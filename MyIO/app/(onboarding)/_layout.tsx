// app/(onboarding)/_layout.tsx — Onboarding group: prevent back swipe to home.

import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingLayout() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={["top"]}><Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}>
      <Stack.Screen name="index" />
    </Stack>
    </SafeAreaView>
  );
}
