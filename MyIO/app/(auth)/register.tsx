// app/(auth)/register.tsx — Registration: email/password; on success → preferences or home.

import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import { findUserPreference } from '@/lib/db';
import { useAuthStore } from '@/stores';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const signUp = useAuthStore((s) => s.signUp);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignUp() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    const { error: err } = await signUp({ email: email.trim(), password });
    if (err) {
      setIsLoading(false);
      setError(err.message ?? 'Sign up failed.');
      return;
    }
    const userId = useAuthStore.getState().session?.user?.id;
    if (userId) {
      const { data: pref } = await findUserPreference(userId);
      if (!pref) {
        (router.replace as (href: string) => void)('/(preferences)');
      } else {
        router.replace('/(tabs)');
      }
    } else {
      router.replace('/(tabs)');
    }
    setIsLoading(false);
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.form}>
        <Text style={styles.title}>Create new account</Text>
        <Text style={styles.hint}>Sign up with email. You can set preferences next.</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={AppColors.gray}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!isLoading}
          accessibilityLabel="Email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={AppColors.gray}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
          accessibilityLabel="Password"
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          placeholderTextColor={AppColors.gray}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!isLoading}
          accessibilityLabel="Confirm password"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          onPress={handleSignUp}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Sign up">
          {isLoading ? (
            <ActivityIndicator color={AppColors.black} />
          ) : (
            <Text style={styles.buttonLabel}>Sign up</Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          style={styles.backLink}
          accessibilityRole="button"
          accessibilityLabel="Back to login">
          <Text style={styles.backLinkText}>Back to Log in</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    backgroundColor: AppColors.white,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.black,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: AppColors.gray,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.gray,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    color: AppColors.black,
    backgroundColor: AppColors.white,
  },
  error: {
    marginBottom: 16,
    color: '#c00',
    fontSize: 14,
  },
  button: {
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.black,
  },
  backLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  backLinkText: {
    fontSize: 14,
    color: AppColors.gray,
  },
});
