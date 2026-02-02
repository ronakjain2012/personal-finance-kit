// app/(tabs)/_layout.tsx — Tab layout: Home, History, Articles; lime-green + action button in footer.

import { Tabs } from "expo-router"
import { StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { HapticTab } from "@/components/haptic-tab"
import { IconSymbol } from "@/components/ui/icon-symbol"
import { AppColors } from "@/constants/theme"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"

const ACTIVE_LINE_WIDTH = 24
const ACTIVE_LINE_HEIGHT = 2

function TabIconWithLine({
  focused,
  color,
  name,
}: {
  focused: boolean
  color: string
  name: "house.fill" | "list.bullet" | "lightbulb.fill"
}) {
  return (
    <View style={styles.tabIconWrap}>
      {focused && (
        <View
          style={[
            styles.activeLine,
            { backgroundColor: color },
          ]}
        />
      )}
      <IconSymbol size={26} name={name} color={color} />
    </View>
  )
}

function AddButtonIcon() {
  return (
    <View style={styles.addPill}>
      <Text style={styles.addPillIcon}>+</Text>
    </View>
  )
}

export default function TabLayout() {
  const insets = useSafeAreaInsets()

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.container}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: AppColors.black,
              tabBarInactiveTintColor: AppColors.gray,
              tabBarStyle: [
                styles.tabBar,
                {
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  paddingBottom: Math.max(insets.bottom, 8),
                  height: 56 + Math.max(insets.bottom, 8),
                },
              ],
              tabBarLabelStyle: styles.tabBarLabel,
              tabBarItemStyle: styles.tabBarItem,
              tabBarButton: HapticTab,
            }}>
            <Tabs.Screen
              name="index"
              options={{
                title: "Home",
                tabBarIcon: ({ focused, color }) => (
                  <TabIconWithLine focused={focused} color={color} name="house.fill" />
                ),
              }}
            />
            <Tabs.Screen
              name="history"
              options={{
                title: "History",
                tabBarIcon: ({ focused, color }) => (
                  <TabIconWithLine focused={focused} color={color} name="list.bullet" />
                ),
              }}
            />
            <Tabs.Screen
              name="articles"
              options={{
                title: "Articles",
                tabBarIcon: ({ focused, color }) => (
                  <TabIconWithLine focused={focused} color={color} name="lightbulb.fill" />
                ),
              }}
            />
            <Tabs.Screen
              name="add"
              options={{
                title: "",
                tabBarIcon: () => <AddButtonIcon />,
                tabBarLabel: () => null,
              }}
            />
          </Tabs>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  tabBar: {
    backgroundColor: AppColors.white,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray + "20",
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  tabBarItem: {
    paddingTop: 8,
  },
  tabIconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  activeLine: {
    width: ACTIVE_LINE_WIDTH,
    height: ACTIVE_LINE_HEIGHT,
    borderRadius: 1,
    marginBottom: 4,
  },
  addPill: {
    width: 48,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addPillIcon: {
    fontSize: 22,
    fontWeight: "700",
    color: AppColors.black,
  },
})
