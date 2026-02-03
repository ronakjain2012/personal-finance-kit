// app/add-category.tsx — Add new category: name, type, color; optional type from params.

import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { AppColors } from "@/constants/theme"
import { createCategory } from "@/lib/db"
import { useAuthUser, useCategoriesStore } from "@/stores"
import type { CategoryType } from "@/types/database"

const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
  TRANSFER: "Transfer",
}

const PRESET_COLORS = [
  "#20272b",
  "#545d63",
  "#ddf247",
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#ea580c",
]

export default function AddCategoryScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ type?: string }>()
  const user = useAuthUser()
  const userId = user?.id ?? ""
  const fetchCategories = useCategoriesStore((s) => s.fetch)

  const [name, setName] = useState("")
  const [type, setType] = useState<CategoryType>(() => {
    const t = params.type?.toUpperCase()
    if (t === "INCOME" || t === "EXPENSE" || t === "TRANSFER") return t
    return "EXPENSE"
  })
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = params.type?.toUpperCase()
    if (t === "INCOME" || t === "EXPENSE" || t === "TRANSFER") setType(t)
  }, [params.type])

  const canSubmit = name.trim().length > 0

  const handleSubmit = async () => {
    if (!userId || !canSubmit) return
    const trimmed = name.trim()
    setSaving(true)
    const { data, error } = await createCategory(userId, {
      user_id: userId,
      name: trimmed,
      type,
      color,
      parent_id: null,
      icon: null,
    })
    setSaving(false)
    if (error) {
      Alert.alert("Error", error.message)
      return
    }
    await fetchCategories(userId)
    router.back()
  }

  if (!userId) return null

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>New category</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Category name"
          placeholderTextColor={AppColors.gray}
          autoCapitalize="words"
        />

        <Text style={styles.sectionLabel}>Type</Text>
        <View style={styles.typeRow}>
          {(["INCOME", "EXPENSE", "TRANSFER"] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.typeChip, type === t && styles.typeChipSelected]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeChipText, type === t && styles.typeChipTextSelected]}>
                {CATEGORY_TYPE_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Color</Text>
        <View style={styles.chipRow}>
          {PRESET_COLORS.map((hex) => (
            <Pressable
              key={hex}
              style={[
                styles.colorChip,
                { backgroundColor: hex },
                color === hex && styles.colorChipSelected,
              ]}
              onPress={() => setColor(hex)}
              accessibilityLabel={`Color ${hex}`}
            />
          ))}
        </View>

        <Pressable
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || saving}
        >
          {saving ? (
            <ActivityIndicator color={AppColors.black} />
          ) : (
            <Text style={styles.submitBtnText}>Add category</Text>
          )}
        </Pressable>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray + "20",
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: 28,
    fontWeight: "600",
    color: AppColors.black,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.black,
  },
  scroll: {
    flex: 1,
    backgroundColor: AppColors.gray + "12",
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.black,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray + "25",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: AppColors.black,
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.gray + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  typeChipSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  typeChipText: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.black,
  },
  typeChipTextSelected: {
    color: AppColors.black,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
  colorChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorChipSelected: {
    borderColor: AppColors.black,
    borderWidth: 3,
  },
  submitBtn: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    minHeight: 56,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: AppColors.black,
  },
})
