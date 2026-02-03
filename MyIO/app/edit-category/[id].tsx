// app/edit-category/[id].tsx — Edit existing category: same form as add, pre-filled.

import { router, useLocalSearchParams } from "expo-router"
import { useCallback, useEffect, useState } from "react"
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
import { deleteCategory, findCategory, updateCategory } from "@/lib/db"
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

export default function EditCategoryScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const user = useAuthUser()
  const userId = user?.id ?? ""
  const fetchCategories = useCategoriesStore((s) => s.fetch)

  const [name, setName] = useState("")
  const [type, setType] = useState<CategoryType>("EXPENSE")
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const loadCategory = useCallback(async () => {
    if (!userId || !id) return
    setLoading(true)
    setNotFound(false)
    const { data, error } = await findCategory(userId, id)
    setLoading(false)
    if (error || !data) {
      setNotFound(true)
      return
    }
    setName(data.name)
    setType(data.type)
    setColor(
      PRESET_COLORS.includes(data.color) ? data.color : PRESET_COLORS[0]
    )
  }, [userId, id])

  useEffect(() => {
    loadCategory()
  }, [loadCategory])

  const canSubmit = name.trim().length > 0

  const handleSubmit = async () => {
    if (!userId || !id || !canSubmit) return
    const trimmed = name.trim()
    setSaving(true)
    const { data, error } = await updateCategory(userId, id, {
      name: trimmed,
      type,
      color,
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

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    )
  }

  if (notFound) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.notFoundText}>Category not found</Text>
        <Pressable style={styles.backBtnStandalone} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Edit category</Text>
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
            <Text style={styles.submitBtnText}>Save changes</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.deleteBtn}
          onPress={async () => {
            Alert.alert(
              "Delete category",
              `Remove "${name}"? Transactions using this category will keep the category name for reference.`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    if (!userId || !id) return
                    setSaving(true)
                    const { error } = await deleteCategory(userId, id)
                    setSaving(false)
                    if (error) {
                      Alert.alert("Error", error.message)
                    } else {
                      await fetchCategories(userId)
                      router.back()
                    }
                  },
                },
              ]
            )
          }}
          disabled={saving}
        >
          <Text style={styles.deleteBtnText}>Delete category</Text>
        </Pressable>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.white,
  },
  notFoundText: {
    fontSize: 16,
    color: AppColors.gray,
    marginBottom: 16,
  },
  backBtnStandalone: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.black,
  },
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

  deleteBtn: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
})
