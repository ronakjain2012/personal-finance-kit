// app/(tabs)/_layout.tsx — Tab layout: Home, History; FAB for add.

import { Tabs } from "expo-router"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { HapticTab } from "@/components/haptic-tab"
import { IconSymbol } from "@/components/ui/icon-symbol"
import { AppColors, Colors } from "@/constants/theme"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"

export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={["top"]}>
        <View className="flex-1 bg-white dark:bg-black">
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
              headerShown: false,
              tabBarButton: HapticTab,
            }}>
            <Tabs.Screen
              name="index"
              options={{
                title: "Home",
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="house.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="history"
              options={{
                title: "History",
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="list.bullet" color={color} />
                ),
              }}
            />
          </Tabs>
          <Pressable
            style={styles.fab}
            accessibilityRole="button"
            accessibilityLabel="Add transaction">
            <Text style={styles.fabIcon}>+</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  fabIcon: {
    fontSize: 28,
    fontWeight: "700",
    color: AppColors.black,
  },
})
