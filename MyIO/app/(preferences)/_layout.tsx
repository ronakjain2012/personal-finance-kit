// app/(preferences)/_layout.tsx — Preferences group: stack for user preferences screen.

import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PreferencesLayout() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={["top"]}><Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack></SafeAreaView>
  );
}
