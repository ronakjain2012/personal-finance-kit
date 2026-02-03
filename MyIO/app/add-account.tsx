// app/add-account.tsx — Add new account: name, type, currency from preference, opening balance.

import { router } from "expo-router"
import { useMemo, useState } from "react"
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
import { createAccount, createTransaction } from "@/lib/db"
import { useAccountsStore, useAuthUser, useCategoriesStore, usePreferencesStore } from "@/stores"
import type { AccountType, EntryType } from "@/types/database"

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: "Cash",
  BANK: "Bank",
  CREDIT: "Credit",
  INVESTMENT: "Investment",
}

export default function AddAccountScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthUser()
  const userId = user?.id ?? ""
  const preference = usePreferencesStore((s) => s.preference)
  const currencies = usePreferencesStore((s) => s.currencies)
  const fetchAccounts = useAccountsStore((s) => s.fetch)
  const categories = useCategoriesStore((s) => s.categories)

  const [name, setName] = useState("")
  const [type, setType] = useState<AccountType>("BANK")
  const [openingBalanceStr, setOpeningBalanceStr] = useState("0")
  const [saving, setSaving] = useState(false)

  const currencyCode = preference?.default_currency ?? "USD"
  const currencySymbol = useMemo(
    () => currencies.find((c) => c.code === currencyCode)?.symbol ?? currencyCode,
    [currencyCode, currencies]
  )

  const canSubmit = name.trim().length > 0

  const handleSubmit = async () => {
    if (!userId || !canSubmit) return
    const trimmed = name.trim()
    const openingBalance = parseFloat(openingBalanceStr) || 0
    if (Number.isNaN(openingBalance)) {
      Alert.alert("Invalid amount", "Opening balance must be a number.")
      return
    }
    setSaving(true)
    const { data, error } = await createAccount(userId, {
      user_id: userId,
      name: trimmed,
      type,
      currency_code: currencyCode,
      opening_balance: openingBalance,
      balance: openingBalance,
      is_active: true,
      allow_delete: true,
    })
    const defaultIncomeAccountId = preference?.default_income_account_id ?? ""
    const defaultExpenseAccountId = preference?.default_expense_account_id ?? ""
    // find other category
    const otherCategory = categories.find((c) => c.name.toLowerCase() === "other")
    if(openingBalance !== 0){
      let entryType : EntryType = "INCOME"
      if(openingBalance < 0) {
        entryType = "EXPENSES"
      }
      await createTransaction(userId, {
        from_account_id: data?.id ?? "",
        to_account_id: entryType == "INCOME" ? defaultIncomeAccountId : defaultExpenseAccountId,
        category_id: otherCategory?.id ?? null,
        amount: openingBalance,
        description: `System created opening balance transaction`,
        transaction_date: new Date().toISOString(),
        entry_type: entryType,
        added_by: 'AUTO',
        status: 'COMPLETED',
        attachments: [],
      })
    }
    setSaving(false)
    if (error) {
      Alert.alert("Error", error.message)
      return
    }
    await fetchAccounts(userId)
    router.back()
  }

  if (!userId) return null

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>New account</Text>
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
          placeholder="Account name"
          placeholderTextColor={AppColors.gray}
          autoCapitalize="words"
        />

        <Text style={styles.sectionLabel}>Type</Text>
        <View style={styles.chipRow}>
          {(["CASH", "BANK", "CREDIT", "INVESTMENT"] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.typeChip, type === t && styles.typeChipSelected]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.chipText, type === t && styles.chipTextSelected]}>
                {ACCOUNT_TYPE_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Currency</Text>
        <View style={styles.currencyRow}>
          <Text style={styles.currencyValue}>
            {currencySymbol} {currencyCode}
          </Text>
          <Text style={styles.currencyHint}>From your preferences</Text>
        </View>

        <Text style={styles.sectionLabel}>Opening balance</Text>
        <TextInput
          style={styles.input}
          value={openingBalanceStr}
          onChangeText={setOpeningBalanceStr}
          placeholder="0"
          placeholderTextColor={AppColors.gray}
          keyboardType="decimal-pad"
        />

        <Pressable
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || saving}
        >
          {saving ? (
            <ActivityIndicator color={AppColors.black} />
          ) : (
            <Text style={styles.submitBtnText}>Add account</Text>
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  typeChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.gray + "30",
  },
  typeChipSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.black,
  },
  chipTextSelected: {
    color: AppColors.black,
  },
  currencyRow: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray + "25",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  currencyValue: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.black,
  },
  currencyHint: {
    fontSize: 12,
    color: AppColors.gray,
    marginTop: 4,
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
