// app/(tabs)/history.tsx — Transaction history with edit button.

import { useFocusEffect } from "@react-navigation/native"
import { router } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { QuickActionsModal } from "@/components/feature/QuickActionsModal"
import { Header } from "@/components/layout"
import { AppColors } from "@/constants/theme"
import {
    findUserPreference,
    listCurrencies,
    listTransactions,
} from "@/lib/db"
import { formatAmount, formatDate } from "@/lib/helpers"
import { useAuthUser } from "@/stores"
import type { Transaction } from "@/types/database"

export default function HistoryScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthUser()
  const userId = user?.id ?? ""

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [currencySymbol, setCurrencySymbol] = useState("$")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [quickActionsVisible, setQuickActionsVisible] = useState(false)

  const loadData = useCallback(async () => {
    if (!userId) return
    const [txRes, prefRes, currRes] = await Promise.all([
      listTransactions(userId, { limit: 100 }),
      findUserPreference(userId),
      listCurrencies(),
    ])
    if (txRes.data) setTransactions(txRes.data)
    const code = prefRes.data?.default_currency ?? "USD"
    const curr = currRes.data?.find((c) => c.code === code)
    setCurrencySymbol(curr?.symbol ?? "$")
    setLoading(false)
    setRefreshing(false)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    loadData()
  }, [userId, loadData])

  useFocusEffect(
    useCallback(() => {
      if (userId) loadData()
    }, [userId, loadData])
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadData()
  }, [loadData])

  if (!userId) return null

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 60 }]}>
      <View style={styles.headerWrap}>
        <Header
          title="History"
          onAvatarPress={() => setQuickActionsVisible(true)}
          onRightPress={() => {}}
        />
      </View>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyHint}>No transactions yet</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={AppColors.primary}
            />
          }>
          {transactions.map((tx) => (
            <View key={tx.id} style={styles.row}>
              <View
                style={[
                  styles.avatarWrap,
                  tx.entry_type === "INCOME"
                    ? { backgroundColor: AppColors.primary + "40" }
                    : { backgroundColor: AppColors.gray + "25" },
                ]}>
                <Text style={styles.avatarText}>
                  {tx.entry_type === "INCOME" ? "↑" : tx.entry_type === "CONTRA" ? "⇄" : "↓"}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.desc} numberOfLines={1}>
                  {tx.description || (tx.entry_type === "INCOME" ? "Income" : tx.entry_type === "CONTRA" ? "Transfer" : "Expense")}
                </Text>
                <Text style={styles.date}>{formatDate(tx.transaction_date)}</Text>
              </View>
              <Text
                style={[
                  styles.amount,
                  tx.entry_type === "INCOME" && styles.amountIncome,
                ]}>
                {tx.entry_type === "INCOME" ? "+ " : tx.entry_type === "CONTRA" ? "" : "− "}
                {formatAmount(Number(tx.amount), currencySymbol)}
              </Text>
              <Pressable
                style={styles.editBtn}
                onPress={() =>
                  router.push({ pathname: "/edit-transaction/[id]", params: { id: tx.id } })
                }
                hitSlop={8}>
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      <QuickActionsModal
        visible={quickActionsVisible}
        onClose={() => setQuickActionsVisible(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  headerWrap: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyHint: {
    fontSize: 14,
    color: AppColors.gray,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.gray + "12",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AppColors.gray + "18",
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.black,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  desc: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.black,
  },
  date: {
    fontSize: 12,
    color: AppColors.gray,
    marginTop: 2,
  },
  amount: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.black,
    marginRight: 12,
  },
  amountIncome: {
    color: AppColors.primary,
  },
  editBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: AppColors.primary,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.black,
  },
})
