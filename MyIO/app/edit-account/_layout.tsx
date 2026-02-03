// app/edit-account/_layout.tsx — Stack; header hidden so [id] uses custom header.

import { Stack } from "expo-router"

export default function EditAccountLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
    </Stack>
  )
}
