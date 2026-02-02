// app/edit-transaction/_layout.tsx — Stack; header hidden so [id] uses same custom header as add.

import { Stack } from "expo-router"

export default function EditTransactionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
    </Stack>
  )
}
