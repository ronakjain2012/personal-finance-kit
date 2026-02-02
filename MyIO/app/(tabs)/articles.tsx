// app/(tabs)/articles.tsx — Articles / tips placeholder.

import { StyleSheet, Text, View } from "react-native"

import { AppColors } from "@/constants/theme"

export default function ArticlesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Articles</Text>
      <Text style={styles.hint}>Tips and insights — coming soon.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: AppColors.black,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: AppColors.gray,
  },
})
