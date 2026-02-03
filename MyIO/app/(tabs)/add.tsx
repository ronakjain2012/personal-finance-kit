// app/(tabs)/add.tsx — Add transaction: type switcher, accounts, date, amount (calculator), category, attachments.

import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AttachmentChip } from '@/components/feature/AttachmentChip';
import { CalculatorModal } from '@/components/feature/CalculatorModal';
import { DatePickerField } from '@/components/feature/DatePickerField';
import { AppColors } from '@/constants/theme';
import {
  ATTACHMENT_PICKER_TYPES,
  isAllowedMime,
  toAttachmentItem,
  type AttachmentItem,
} from '@/lib/attachment-utils';
import { createTransaction } from '@/lib/db';
import { toISODateString } from '@/lib/helpers';
import { uploadAttachment } from '@/lib/storage';
import {
  useAccountsStore,
  useAuthUser,
  useCategoriesStore,
  useDefaultAccountsStore,
  usePreferencesStore,
  useTransactionsStore,
} from '@/stores';
import type { EntryType } from '@/types/database';

type TxType = 'INCOME' | 'EXPENSES' | 'CONTRA';

const TX_TYPE_LABELS: Record<TxType, string> = {
  INCOME: 'Income',
  EXPENSES: 'Expense',
  CONTRA: 'Transfer',
};

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthUser();
  const userId = user?.id ?? '';
  const defaultIncomeId = useDefaultAccountsStore((s) => s.defaultIncomeAccountId);
  const defaultExpenseId = useDefaultAccountsStore((s) => s.defaultExpenseAccountId);

  const [txType, setTxType] = useState<TxType>('EXPENSES');
  const [fromAccountId, setFromAccountId] = useState<string | null>(defaultExpenseId);
  const [toAccountId, setToAccountId] = useState<string | null>(defaultIncomeId);
  const [transactionDate, setTransactionDate] = useState(() => toISODateString(new Date()));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const accounts = useAccountsStore((s) => s.accounts);
  const categories = useCategoriesStore((s) => s.categories);
  const preference = usePreferencesStore((s) => s.preference);
  const currencies = usePreferencesStore((s) => s.currencies);
  

  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.is_active),
    [accounts]
  )
  const currencySymbol = useMemo(() => {
    const code = preference?.default_currency ?? "USD"
    return currencies.find((c) => c.code === code)?.symbol ?? "$"
  }, [preference?.default_currency, currencies])

  useEffect(() => {
    setFromAccountId(defaultExpenseId);
    setToAccountId(defaultIncomeId);
  }, [defaultExpenseId, defaultIncomeId]);

  const incomeCategories = categories.filter((c) => c.type === 'INCOME');
  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  const displayCategories =
    txType === 'INCOME' ? incomeCategories : txType === 'EXPENSES' ? expenseCategories : [];

  const handleCalculatorOk = useCallback((value: number) => {
    setAmount(value.toFixed(2));
    setCalculatorVisible(false);
  }, []);

  const pickAndUploadAttachment = useCallback(async () => {
    if (!userId) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [...ATTACHMENT_PICKER_TYPES],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      const mime = file.mimeType ?? '';
      if (!isAllowedMime(mime)) {
        Alert.alert('File type not allowed', 'Only images and PDF files can be uploaded.');
        return;
      }
      setUploading(true);
      const out = await uploadAttachment(
        userId,
        file.uri,
        mime || 'application/octet-stream',
        file.name
      );
      setUploading(false);
      if ('url' in out) {
        setAttachments((prev) => [...prev, toAttachmentItem(out.url, file.name, mime)]);
      } else {
        Alert.alert('Upload failed', out.error.message);
      }
    } catch (e) {
      setUploading(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to pick file');
    }
  }, [userId]);

  const removeAttachment = useCallback((url: string) => {
    setAttachments((prev) => prev.filter((a) => a.url !== url));
  }, []);

  const canSubmit =
    (txType === 'CONTRA'
      ? fromAccountId && toAccountId && fromAccountId !== toAccountId
      : txType === 'INCOME'
      ? toAccountId
      : fromAccountId) &&
    amount &&
    parseFloat(amount) > 0 &&
    transactionDate;

  const handleSubmit = async () => {
    if (!userId || !canSubmit) return;
    setSaving(true);
    const numAmount = parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      setSaving(false);
      return;
    }
    const fromId = txType === 'CONTRA' || txType === 'EXPENSES' ? fromAccountId : null;
    const toId = txType === 'CONTRA' || txType === 'INCOME' ? toAccountId : null;

    const { data, error } = await createTransaction(userId, {
      from_account_id: fromId,
      to_account_id: toId,
      category_id: categoryId,
      amount: numAmount,
      description: description.trim() || null,
      transaction_date: transactionDate,
      entry_type: txType as EntryType,
      added_by: 'MANUAL',
      status: 'COMPLETED',
      attachments: attachments.length ? attachments.map((a) => a.url) : [],
    });
    if(txType === 'CONTRA'){
      await createTransaction(userId, {
        from_account_id: toId,
        to_account_id: fromId,
        category_id: categoryId,
        amount: numAmount,
        description: `System created transfer`,
        transaction_date: transactionDate,
        entry_type: "INCOME",
        added_by: 'TRANSFER',
        status: 'COMPLETED',
        attachments: [],
      });
      await createTransaction(userId, {
        from_account_id: fromId,
        to_account_id: toId,
        category_id: categoryId,
        amount: numAmount,
        description: `System created transfer`,
        transaction_date: transactionDate,
        entry_type: "EXPENSES",
        added_by: 'TRANSFER',
        status: 'COMPLETED',
        attachments: [],
      });
    }
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    useTransactionsStore.getState().fetch(userId, { limit: 200 });
    router.replace('/(tabs)');
  };

  if (!userId) return null;
  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {txType === 'INCOME' ? 'Add Income' : txType === 'EXPENSES' ? 'Add Expense' : 'Transfer'}
        </Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Type switcher — full width */}
        <View style={styles.typeRow}>
          {(['INCOME', 'EXPENSES', 'CONTRA'] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.typeChip, txType === t && styles.typeChipSelected]}
              onPress={() => setTxType(t)}
            >
              <Text style={[styles.typeChipText, txType === t && styles.typeChipTextSelected]}>
                {TX_TYPE_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Accounts */}
        {txType === 'CONTRA' ? (
          <>
            <Text style={styles.sectionLabel}>From account</Text>
            <View style={styles.chipRow}>
              {activeAccounts.map((a) => (
                <Pressable
                  key={a.id}
                  style={[styles.accountChip, fromAccountId === a.id && styles.chipSelected]}
                  onPress={() => setFromAccountId(a.id)}
                >
                  <Text
                    style={[styles.chipText, fromAccountId === a.id && styles.chipTextSelected]}
                  >
                    {a.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.sectionLabel}>To account</Text>
            <View style={styles.chipRow}>
              {activeAccounts.map((a) => (
                <Pressable
                  key={a.id}
                  style={[styles.accountChip, toAccountId === a.id && styles.chipSelected]}
                  onPress={() => setToAccountId(a.id)}
                >
                  <Text style={[styles.chipText, toAccountId === a.id && styles.chipTextSelected]}>
                    {a.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : txType === 'INCOME' ? (
          <>
            <Text style={styles.sectionLabel}>Credit to account</Text>
            <View style={styles.chipRow}>
              {activeAccounts.filter((a) => a.id !== defaultExpenseId && a.id !== defaultIncomeId).map((a) => (
                <Pressable
                  key={a.id}
                  style={[styles.accountChip, toAccountId === a.id && styles.chipSelected]}
                  onPress={() => setToAccountId(a.id)}
                >
                  <Text style={[styles.chipText, toAccountId === a.id && styles.chipTextSelected]}>
                    {a.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Account</Text>
            <View style={styles.chipRow}>
              {accounts
                .filter((a) => a.id !== defaultExpenseId && a.id !== defaultIncomeId)
                .map((a) => (
                  <Pressable
                    key={a.id}
                    style={[styles.accountChip, fromAccountId === a.id && styles.chipSelected]}
                    onPress={() => setFromAccountId(a.id)}
                  >
                    <Text
                      style={[styles.chipText, fromAccountId === a.id && styles.chipTextSelected]}
                    >
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
          <Pressable style={styles.calcBtn} onPress={() => setCalculatorVisible(true)}>
            <Text style={styles.calcBtnText}>⌗</Text>
          </Pressable>
          <Text style={styles.currencySymbol}>{currencySymbol}</Text>
        </View>

        {/* Category — show for Income/Expense so "+" is always available */}
        {(txType === 'INCOME' || txType === 'EXPENSES') && (
          <>
            <Text style={styles.sectionLabel}>
              {txType === 'INCOME' ? 'Income category' : 'Expense category'}
            </Text>
            <View style={styles.chipRow}>
              <Pressable
                style={styles.addCategoryCircle}
                onPress={() =>
                  router.push({
                    pathname: '/add-category',
                    params: {
                      type:
                        txType === 'INCOME'
                          ? 'INCOME'
                          : txType === 'EXPENSES'
                            ? 'EXPENSE'
                            : 'TRANSFER',
                    },
                  })
                }
              >
                <Text style={styles.addCategoryPlus}>+</Text>
              </Pressable>
              {displayCategories.map((c) => (
                <Pressable
                  key={c.id}
                  style={[styles.accountChip, categoryId === c.id && styles.chipSelected]}
                  onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
                >
                  <Text style={[styles.chipText, categoryId === c.id && styles.chipTextSelected]}>
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
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={AppColors.gray} />
            ) : (
              <Text style={styles.addCategoryPlus}>+</Text>
            )}
          </Pressable>
          {attachments.map((a) => (
            <AttachmentChip
              key={a.url}
              url={a.url}
              name={a.name}
              isImage={a.isImage}
              onRemove={() => removeAttachment(a.url)}
            />
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
          disabled={!canSubmit || saving}
        >
          {saving ? (
            <ActivityIndicator color={AppColors.black} />
          ) : (
            <Text style={styles.submitBtnText}>
              {txType === 'INCOME'
                ? 'ADD INCOME'
                : txType === 'EXPENSES'
                ? 'ADD EXPENSE'
                : 'TRANSFER'}
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.gray + '12',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray + '20',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 28,
    fontWeight: '600',
    color: AppColors.black,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.black,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.black,
    marginBottom: 8,
    marginTop: 16,
  },
  typeRow: {
    flexDirection: 'row',
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
    borderColor: AppColors.gray + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChipSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  typeChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.black,
  },
  typeChipTextSelected: {
    color: AppColors.black,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  accountChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.gray + '30',
  },
  chipSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
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
    borderStyle: 'dashed',
    borderColor: AppColors.gray + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCategoryPlus: {
    fontSize: 22,
    fontWeight: '600',
    color: AppColors.gray,
  },
  input: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray + '25',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: AppColors.black,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray + '25',
    paddingHorizontal: 16,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.black,
  },
  calcBtn: {
    padding: 8,
    marginRight: 8,
  },
  calcBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.primary,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.gray,
  },
  descriptionInput: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray + '25',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: AppColors.black,
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: 24,
  },
  submitBtn: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 56,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.black,
  },
});
