// app/(tabs)/index.tsx — Home: balance, chart (income/expense), quick actions, categories, For you, History (last 10).

import { useFocusEffect } from "@react-navigation/native"
import dayjs from "dayjs"
import { router } from "expo-router"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { LineChart } from "react-native-gifted-charts"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { QuickActionsModal } from "@/components/feature/QuickActionsModal"
import { Header } from "@/components/layout"
import { AppColors } from "@/constants/theme"
import {
  findUserPreference,
  listAccounts,
  listCategories,
  listCurrencies,
  listTransactions,
} from "@/lib/db"
import { formatAmount, formatDate, toISODateString } from "@/lib/helpers"
import { useAuthUser } from "@/stores"
import type { Account, Category, Transaction } from "@/types/database"

const CHART_DAYS = 7
const HISTORY_LIMIT = 10

type CategoryBalance = Category & { balance: number }

function buildChartData(transactions: Transaction[]) {
  const today = dayjs()
  const incomeByDate: Record<string, number> = {}
  const expenseByDate: Record<string, number> = {}
  for (let i = CHART_DAYS - 1; i >= 0; i--) {
    const d = today.subtract(i, "day")
    const key = toISODateString(d) ?? ""
    incomeByDate[key] = 0
    expenseByDate[key] = 0
  }
  for (const t of transactions) {
    const key = t.transaction_date.slice(0, 10)
    if (!(key in incomeByDate)) continue
    const amt = Number(t.amount)
    if (t.entry_type === "INCOME") incomeByDate[key] += amt
    else if (t.entry_type === "EXPENSES") expenseByDate[key] += amt
  }
  const labels = Object.keys(incomeByDate).sort()
  const incomeData = labels.map((k) => ({
    value: incomeByDate[k] ?? 0,
    label: formatDate(k).slice(0, 5),
  }))
  const expenseData = labels.map((k) => ({
    value: expenseByDate[k] ?? 0,
    label: formatDate(k).slice(0, 5),
  }))
  const allValues = [
    ...incomeData.map((d) => d.value),
    ...expenseData.map((d) => d.value),
  ]
  const maxVal = Math.max(1, ...allValues)
  const step = Math.ceil(maxVal / 5) || 1
  const maxValue = step * 5
  return { incomeData, expenseData, maxValue }
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthUser()
  const userId = user?.id ?? ""

  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [currencySymbol, setCurrencySymbol] = useState("$")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [quickActionsVisible, setQuickActionsVisible] = useState(false)

  const loadData = useCallback(async () => {
    if (!userId) return
    const [accRes, catRes, txRes, prefRes, currRes] = await Promise.all([
      listAccounts(userId),
      listCategories(userId),
      listTransactions(userId, { limit: 200 }),
      findUserPreference(userId),
      listCurrencies(),
    ])
    if (accRes.data) setAccounts(accRes.data.filter((a) => a.is_active))
    if (catRes.data) setCategories(catRes.data)
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

  const balance = useMemo(
    () => accounts.reduce((sum, a) => sum + Number(a.balance), 0),
    [accounts]
  )
  const spending = useMemo(
    () =>
      transactions
        .filter((t) => t.entry_type === "EXPENSES")
        .reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions]
  )
  const income = useMemo(
    () =>
      transactions
        .filter((t) => t.entry_type === "INCOME")
        .reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions]
  )

  const { incomeData, expenseData, maxValue } = useMemo(
    () => buildChartData(transactions),
    [transactions]
  )

  const categoryBalances = useMemo((): CategoryBalance[] => {
    const map = new Map<string, number>()
    for (const c of categories) map.set(c.id, 0)
    for (const t of transactions) {
      if (!t.category_id) continue
      const amt = Number(t.amount)
      const sign = t.entry_type === "INCOME" ? 1 : -1
      map.set(t.category_id, (map.get(t.category_id) ?? 0) + sign * amt)
    }
    return categories.map((c) => ({
      ...c,
      balance: map.get(c.id) ?? 0,
    }))
  }, [categories, transactions])

  const last10Transactions = useMemo(
    () => transactions.slice(0, HISTORY_LIMIT),
    [transactions]
  )

  const chartWidth = useCallback(
    () => Dimensions.get("window").width - 48,
    []
  )

  if (!userId) return null

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    )
  }

  return (
    <>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Header
          title="Home"
          onAvatarPress={() => setQuickActionsVisible(true)}
          onRightPress={() => {}}
        />
      </View>
      <ScrollView
        style={[styles.container]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={AppColors.primary}
          />
        }>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total balance</Text>
          <Text style={styles.balanceAmount}>
            {formatAmount(balance, currencySymbol)}
          </Text>
          <Text style={styles.balanceSub}>
            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartCardInner}>
            <LineChart
              data={incomeData}
              data2={expenseData}
              width={chartWidth() - 32}
              height={140}
              spacing={28}
              initialSpacing={8}
              endSpacing={8}
              maxValue={maxValue}
              noOfSections={4}
              stepValue={maxValue / 4}
              curved
              curvature={0.25}
              color={AppColors.primary}
              color2={AppColors.gray}
              thickness={1.5}
              thickness2={1.5}
              hideDataPoints
              hideDataPoints2
              xAxisLabelTextStyle={styles.chartXLabel}
              yAxisTextStyle={styles.chartYLabel}
            />
            <View style={styles.chartLegend}>
              <View style={[styles.chartLegendDot, { backgroundColor: AppColors.primary }]} />
              <Text style={styles.chartLegendText}>Income</Text>
              <View style={[styles.chartLegendDot, { backgroundColor: AppColors.gray }]} />
              <Text style={styles.chartLegendText}>Expense</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          {[
            { label: "TRANSFER", icon: "⇄" },
            { label: "INCOME", icon: "↑" },
            { label: "EXPENSE", icon: "↓" },
            { label: "MORE", icon: "⋯" },
          ].map((a) => (
            <Pressable
              key={a.label}
              style={styles.quickActionBtn}
              accessibilityRole="button">
              <View style={styles.quickActionCircle}>
                <Text style={styles.quickActionIcon}>{a.icon}</Text>
              </View>
              <Text style={styles.quickActionLabel}>{a.label} </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoryList}>
          {categoryBalances.length === 0 ? (
            <Text style={styles.emptyHint}>No categories yet</Text>
          ) : (
            categoryBalances.slice(0, 6).map((cat) => (
              <View key={cat.id} style={styles.categoryCard}>
                <View
                  style={[
                    styles.categoryAvatar,
                    { backgroundColor: (cat.color || AppColors.gray) + "35" },
                  ]}>
                  <Text style={styles.categoryAvatarText}>
                    {cat.name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text
                    style={[
                      styles.categoryBalance,
                      cat.balance < 0 && styles.categoryBalanceNegative,
                    ]}>
                    {cat.balance >= 0 ? "+ " : "− "}
                    {formatAmount(Math.abs(cat.balance), currencySymbol)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>For you</Text>
        <View style={styles.forYouRow}>
          <View style={styles.forYouCard}>
            <View
              style={[
                styles.forYouIconWrap,
                { backgroundColor: AppColors.gray + "30" },
              ]}>
              <Text style={styles.forYouIcon}>↓</Text>
            </View>
            <Text style={styles.forYouLabel}>Spending</Text>
            <Text style={styles.forYouAmount}>
              − {formatAmount(spending, currencySymbol)}
            </Text>
          </View>
          <View style={styles.forYouCard}>
            <View
              style={[
                styles.forYouIconWrap,
                { backgroundColor: AppColors.primary + "40" },
              ]}>
              <Text style={styles.forYouIcon}>↑</Text>
            </View>
            <Text style={styles.forYouLabel}>Income</Text>
            <Text style={[styles.forYouAmount, { color: AppColors.primary }]}>
              + {formatAmount(income, currencySymbol)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>History</Text>
        <View style={styles.historyList}>
          {last10Transactions.length === 0 ? (
            <Text style={styles.emptyHint}>No transactions yet</Text>
          ) : (
            last10Transactions.map((tx) => (
              <Pressable
                key={tx.id}
                style={styles.historyRow}
                onPress={() => router.push({ pathname: "/edit-transaction/[id]", params: { id: tx.id } })}>
                <View
                  style={[
                    styles.historyIconWrap,
                    tx.entry_type === "INCOME"
                      ? { backgroundColor: AppColors.primary + "40" }
                      : { backgroundColor: AppColors.gray + "30" },
                  ]}>
                  <Text style={styles.historyIcon}>
                    {tx.entry_type === "INCOME" ? "↑" : "↓"}
                  </Text>
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDesc}>
                    {tx.description || (tx.entry_type === "INCOME" ? "Income" : "Expense")}
                  </Text>
                  <Text style={styles.historyDate}>
                    {formatDate(tx.transaction_date)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.historyAmount,
                    tx.entry_type === "INCOME" && styles.historyAmountIncome,
                  ]}>
                  {tx.entry_type === "INCOME" ? "+ " : "− "}
                  {formatAmount(Number(tx.amount), currencySymbol)}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <QuickActionsModal
        visible={quickActionsVisible}
        onClose={() => setQuickActionsVisible(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.white,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  headerContainer: {
    paddingHorizontal: 24,
    backgroundColor: AppColors.white,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  balanceCard: {
    backgroundColor: AppColors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: AppColors.black,
    opacity: 0.8,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: AppColors.black,
  },
  balanceSub: {
    fontSize: 12,
    color: AppColors.black,
    opacity: 0.7,
    marginTop: 4,
  },
  chartCard: {
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.gray + "18",
    overflow: "hidden",
  },
  chartCardInner: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  chartXLabel: {
    fontSize: 10,
    color: AppColors.gray,
  },
  chartYLabel: {
    fontSize: 10,
    color: AppColors.gray,
  },
  chartLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 12,
  },
  chartLegendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chartLegendText: {
    fontSize: 11,
    color: AppColors.gray,
    fontWeight: "600",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  quickActionBtn: {
    width: 72,
    alignItems: "center",
  },
  quickActionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.black,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickActionIcon: {
    fontSize: 24,
    color: AppColors.white,
    fontWeight: "600",
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: AppColors.gray,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.black,
    marginBottom: 12,
  },
  emptyHint: {
    fontSize: 14,
    color: AppColors.gray,
    marginBottom: 12,
  },
  categoryList: {
    marginBottom: 24,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.gray + "30",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  categoryAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.black,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.black,
  },
  categoryBalance: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primary,
    marginTop: 2,
  },
  categoryBalanceNegative: {
    color: AppColors.gray,
  },
  forYouRow: {
    flexDirection: "row",
    gap: 12,
  },
  forYouCard: {
    flex: 1,
    backgroundColor: AppColors.gray + "12",
    borderRadius: 12,
    padding: 16,
  },
  forYouIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  forYouIcon: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.black,
  },
  forYouLabel: {
    fontSize: 12,
    color: AppColors.gray,
    marginBottom: 4,
  },
  forYouAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.black,
  },
  historyList: {
    marginBottom: 24,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.gray + "12",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  historyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  historyIcon: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.black,
  },
  historyInfo: {
    flex: 1,
  },
  historyDesc: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.black,
  },
  historyDate: {
    fontSize: 12,
    color: AppColors.gray,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.black,
  },
  historyAmountIncome: {
    color: AppColors.primary,
  },
})
