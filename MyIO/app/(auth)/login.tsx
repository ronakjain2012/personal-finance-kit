// app/(auth)/login.tsx — Login screen: email/password; on success → preferences or home.

import { router } from "expo-router"
import { useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { SupabaseCurrenciesCheck } from "@/components/feature/SupabaseCurrenciesCheck"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { AppColors } from "@/constants/theme"
import { findUserPreference } from "@/lib/db"
import { useAuthStore } from "@/stores"

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const login = useAuthStore((s) => s.login)

  const [email, setEmail] = useState("testemail@email.com")
  const [password, setPassword] = useState("Test@1234#")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSignIn() {
    setError(null)
    if (!email.trim() || !password) {
      setError("Email and password are required.")
      return
    }
    setIsLoading(true)
    const { error: err } = await login({ email: email.trim(), password })
    if (err) {
      setIsLoading(false)
      const msg = err.message ?? "Sign in failed."
      const isInvalidCreds =
        msg.toLowerCase().includes("invalid") &&
        msg.toLowerCase().includes("credential")
      // In dev, show full error for debugging (no PII)
      if (__DEV__) {
        setError(isInvalidCreds ? `Invalid credentials. (${msg})` : msg)
      } else {
        setError(isInvalidCreds ? "Invalid credentials." : msg)
      }
      return
    }
    const userId = useAuthStore.getState().session?.user?.id
    if (userId) {
      const { data: pref } = await findUserPreference(userId)
      if (!pref) {
        ;(router.replace as (href: string) => void)("/(preferences)")
      } else {
        router.replace("/(tabs)")
      }
    } else {
      router.replace("/(tabs)")
    }
    setIsLoading(false)
  }

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.form}>
        <ThemedText type="title" style={styles.title}>
          Login
        </ThemedText>
        <ThemedText style={styles.hint}>
          Use your Supabase account. For dev, create a user in Supabase Auth.
        </ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#545d63"
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
          placeholderTextColor="#545d63"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
          accessibilityLabel="Password"
        />
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        <Pressable
          onPress={handleSignIn}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Sign in">
          {isLoading ? (
            <ActivityIndicator color="#20272b" />
          ) : (
            <ThemedText type="defaultSemiBold" style={styles.buttonLabel}>
              Sign in
            </ThemedText>
          )}
        </Pressable>
        <Pressable
          onPress={() => router.push("/(auth)/register")}
          style={styles.createAccountLink}
          accessibilityRole="button"
          accessibilityLabel="Create new account">
          <ThemedText style={styles.createAccountText}>
            Create new account
          </ThemedText>
        </Pressable>
        <SupabaseCurrenciesCheck />
      </KeyboardAvoidingView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  form: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  title: {
    marginBottom: 8,
  },
  hint: {
    marginBottom: 24,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#545d63",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    color: "#20272b",
    backgroundColor: "#ffffff",
  },
  error: {
    marginBottom: 16,
    color: "#c00",
    fontSize: 14,
  },
  button: {
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonLabel: {
    fontSize: 16,
  },
  createAccountLink: {
    marginTop: 16,
    alignItems: "center",
  },
  createAccountText: {
    fontSize: 14,
  },
})
