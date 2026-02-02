// app/(tabs)/add.tsx — Add transaction: type switcher, accounts, date, amount (calculator), category, attachments.

import * as DocumentPicker from "expo-document-picker"
import { router } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { CalculatorModal } from "@/components/feature/CalculatorModal"
import { DatePickerField } from "@/components/feature/DatePickerField"
import { AppColors } from "@/constants/theme"
import {
  createTransaction,
  listAccounts,
  listCategories,
} from "@/lib/db"
import { toISODateString } from "@/lib/helpers"
import { uploadAttachment } from "@/lib/storage"
import { useAuthUser, useDefaultAccountsStore } from "@/stores"
import type { Account, Category, EntryType } from "@/types/database"

type TxType = "INCOME" | "EXPENSES" | "CONTRA"

const TX_TYPE_LABELS: Record<TxType, string> = {
  INCOME: "Income",
  EXPENSES: "Expense",
  CONTRA: "Transfer",
}

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthUser()
  const userId = user?.id ?? ""
  const defaultIncomeId = useDefaultAccountsStore((s) => s.defaultIncomeAccountId)
  const defaultExpenseId = useDefaultAccountsStore((s) => s.defaultExpenseAccountId)

  const [txType, setTxType] = useState<TxType>("EXPENSES")
  const [fromAccountId, setFromAccountId] = useState<string | null>(defaultExpenseId)
  const [toAccountId, setToAccountId] = useState<string | null>(defaultIncomeId)
  const [transactionDate, setTransactionDate] = useState(() =>
    toISODateString(new Date())
  )
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<string[]>([])
  const [calculatorVisible, setCalculatorVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const [accRes, catRes] = await Promise.all([
        listAccounts(userId),
        listCategories(userId),
      ])
      if (accRes.data) setAccounts(accRes.data.filter((a) => a.is_active))
      if (catRes.data) setCategories(catRes.data)
      setLoading(false)
    })()
  }, [userId])

  useEffect(() => {
    setFromAccountId(defaultExpenseId)
    setToAccountId(defaultIncomeId)
  }, [defaultExpenseId, defaultIncomeId])

  const incomeCategories = categories.filter((c) => c.type === "INCOME")
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE")

  const displayCategories =
    txType === "INCOME" ? incomeCategories : txType === "EXPENSES" ? expenseCategories : []

  const handleCalculatorOk = useCallback((value: number) => {
    setAmount(value.toFixed(2))
    setCalculatorVisible(false)
  }, [])

  const pickAndUploadAttachment = useCallback(async () => {
    if (!userId) return
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      })
      if (result.canceled) return
      const file = result.assets[0]
      setUploading(true)
      const out = await uploadAttachment(
        userId,
        file.uri,
        file.mimeType ?? "application/octet-stream",
        file.name
      )
      setUploading(false)
      if ("url" in out) {
        setAttachments((prev) => [...prev, out.url])
      } else {
        Alert.alert("Upload failed", out.error.message)
      }
    } catch (e) {
      setUploading(false)
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to pick file")
    }
  }, [userId])

  const removeAttachment = useCallback((url: string) => {
    setAttachments((prev) => prev.filter((u) => u !== url))
  }, [])

  const canSubmit =
    (txType === "CONTRA"
      ? fromAccountId && toAccountId && fromAccountId !== toAccountId
      : txType === "INCOME"
        ? toAccountId
        : fromAccountId) &&
    amount &&
    parseFloat(amount) > 0 &&
    transactionDate

  const handleSubmit = async () => {
    if (!userId || !canSubmit) return
    setSaving(true)
    const numAmount = parseFloat(amount)
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      setSaving(false)
      return
    }
    const fromId =
      txType === "CONTRA" || txType === "EXPENSES" ? fromAccountId : null
    const toId =
      txType === "CONTRA" || txType === "INCOME" ? toAccountId : null
    const { data, error } = await createTransaction(userId, {
      from_account_id: fromId,
      to_account_id: toId,
      category_id: categoryId,
      amount: numAmount,
      description: description.trim() || null,
      transaction_date: transactionDate,
      entry_type: txType as EntryType,
      added_by: "MANUAL",
      status: "COMPLETED",
      attachments: attachments.length ? attachments : [],
    })
    setSaving(false)
    if (error) {
      Alert.alert("Error", error.message)
      return
    }
    router.replace("/(tabs)")
  }

  if (!userId) return null
  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 60}>
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={12}>
          <Text style={styles.backBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {txType === "INCOME"
            ? "Add Income"
            : txType === "EXPENSES"
              ? "Add Expense"
              : "Transfer"}
        </Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Type switcher — full width */}
        <View style={styles.typeRow}>
          {(["INCOME", "EXPENSES", "CONTRA"] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.typeChip, txType === t && styles.typeChipSelected]}
              onPress={() => setTxType(t)}>
              <Text
                style={[
                  styles.typeChipText,
                  txType === t && styles.typeChipTextSelected,
                ]}>
                {TX_TYPE_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Accounts */}
        {txType === "CONTRA" ? (
          <>
            <Text style={styles.sectionLabel}>From account</Text>
            <View style={styles.chipRow}>
              {accounts.map((a) => (
                <Pressable
                  key={a.id}
                  style={[
                    styles.accountChip,
                    fromAccountId === a.id && styles.chipSelected,
                  ]}
                  onPress={() => setFromAccountId(a.id)}>
                  <Text
                    style={[
                      styles.chipText,
                      fromAccountId === a.id && styles.chipTextSelected,
                    ]}>
                    {a.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.sectionLabel}>To account</Text>
            <View style={styles.chipRow}>
              {accounts.map((a) => (
                <Pressable
                  key={a.id}
                  style={[
                    styles.accountChip,
                    toAccountId === a.id && styles.chipSelected,
                  ]}
                  onPress={() => setToAccountId(a.id)}>
                  <Text
                    style={[
                      styles.chipText,
                      toAccountId === a.id && styles.chipTextSelected,
                    ]}>
                    {a.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : txType === "INCOME" ? (
          <>
            <Text style={styles.sectionLabel}>Credit to account</Text>
            <View style={styles.chipRow}>
              {accounts.map((a) => (
                <Pressable
                  key={a.id}
                  style={[
                    styles.accountChip,
                    toAccountId === a.id && styles.chipSelected,
                  ]}
                  onPress={() => setToAccountId(a.id)}>
                  <Text
                    style={[
                      styles.chipText,
                      toAccountId === a.id && styles.chipTextSelected,
                    ]}>
                    {a.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Debit from account</Text>
            <View style={styles.chipRow}>
              {accounts.map((a) => (
                <Pressable
                  key={a.id}
                  style={[
                    styles.accountChip,
                    fromAccountId === a.id && styles.chipSelected,
                  ]}
                  onPress={() => setFromAccountId(a.id)}>
                  <Text
                    style={[
                      styles.chipText,
                      fromAccountId === a.id && styles.chipTextSelected,
                    ]}>
                    {a.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Date */}
        <Text style={styles.sectionLabel}>Date</Text>
        <DatePickerField value={transactionDate} onChange={setTransactionDate} />

        {/* Amount + Calculator */}
        <Text style={styles.sectionLabel}>Amount</Text>
        <View style={styles.amountRow}>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={AppColors.gray}
            keyboardType="decimal-pad"
          />
          <Pressable
            style={styles.calcBtn}
            onPress={() => setCalculatorVisible(true)}>
            <Text style={styles.calcBtnText}>⌗</Text>
          </Pressable>
          <Text style={styles.currencySymbol}>$</Text>
        </View>

        {/* Category */}
        {displayCategories.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>
              {txType === "INCOME" ? "Income category" : "Expense category"}
            </Text>
            <View style={styles.chipRow}>
              <Pressable
                style={styles.addCategoryCircle}
                onPress={() => {}}>
                <Text style={styles.addCategoryPlus}>+</Text>
              </Pressable>
              {displayCategories.map((c) => (
                <Pressable
                  key={c.id}
                  style={[
                    styles.accountChip,
                    categoryId === c.id && styles.chipSelected,
                  ]}
                  onPress={() =>
                    setCategoryId(categoryId === c.id ? null : c.id)
                  }>
                  <Text
                    style={[
                      styles.chipText,
                      categoryId === c.id && styles.chipTextSelected,
                    ]}>
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Attachments */}
        <Text style={styles.sectionLabel}>Attachments</Text>
        <View style={styles.chipRow}>
          <Pressable
            style={styles.addCategoryCircle}
            onPress={pickAndUploadAttachment}
            disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color={AppColors.gray} />
            ) : (
              <Text style={styles.addCategoryPlus}>+</Text>
            )}
          </Pressable>
          {attachments.map((url) => (
            <View key={url} style={styles.attachmentChip}>
              <Text style={styles.attachmentLabel} numberOfLines={1}>
                File
              </Text>
              <Pressable
                hitSlop={8}
                onPress={() => removeAttachment(url)}
                style={styles.removeAttachment}>
                <Text style={styles.removeAttachmentText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>

        {/* Description — no label */}
        <TextInput
          style={styles.descriptionInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Description (optional)"
          placeholderTextColor={AppColors.gray}
          autoCapitalize="sentences"
          multiline
        />

        {/* Submit */}
        <Pressable
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || saving}>
          {saving ? (
            <ActivityIndicator color={AppColors.black} />
          ) : (
            <Text style={styles.submitBtnText}>
              {txType === "INCOME"
                ? "ADD INCOME"
                : txType === "EXPENSES"
                  ? "ADD EXPENSE"
                  : "TRANSFER"}
            </Text>
          )}
        </Pressable>
      </ScrollView>

      <CalculatorModal
        visible={calculatorVisible}
        initialValue={amount}
        onConfirm={handleCalculatorOk}
        onCancel={() => setCalculatorVisible(false)}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.gray + "12",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.black,
    marginBottom: 8,
    marginTop: 16,
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
    gap: 10,
    alignItems: "center",
  },
  accountChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.gray + "30",
  },
  chipSelected: {
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
  addCategoryCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: AppColors.gray + "60",
    alignItems: "center",
    justifyContent: "center",
  },
  addCategoryPlus: {
    fontSize: 22,
    fontWeight: "600",
    color: AppColors.gray,
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
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray + "25",
    paddingHorizontal: 16,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: "600",
    color: AppColors.black,
  },
  calcBtn: {
    padding: 8,
    marginRight: 8,
  },
  calcBtnText: {
    fontSize: 22,
    fontWeight: "700",
    color: AppColors.primary,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.gray,
  },
  attachmentChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 8,
    borderRadius: 999,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.gray + "25",
    gap: 8,
  },
  attachmentLabel: {
    fontSize: 13,
    color: AppColors.gray,
    maxWidth: 80,
  },
  removeAttachment: {
    padding: 4,
  },
  removeAttachmentText: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.gray,
  },
  descriptionInput: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray + "25",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: AppColors.black,
    minHeight: 80,
    textAlignVertical: "top",
    marginTop: 24,
  },
  submitBtn: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
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
