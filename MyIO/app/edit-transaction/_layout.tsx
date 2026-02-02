// app/edit-transaction/_layout.tsx — Stack for edit transaction (header with back).

import { Stack } from "expo-router"

export default function EditTransactionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: "Edit transaction",
        headerBackTitle: "Back",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#ffffff" },
        headerTintColor: "#20272b",
        headerTitleStyle: { fontWeight: "700", fontSize: 18 },
      }}>
      <Stack.Screen name="[id]" options={{ title: "Edit transaction" }} />
    </Stack>
  )
}
