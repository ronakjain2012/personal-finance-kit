// app/(auth)/_layout.tsx — Auth group: stack for login, signup, reset.

import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthLayout() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={["top"]}><Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack></SafeAreaView>
  );
}
