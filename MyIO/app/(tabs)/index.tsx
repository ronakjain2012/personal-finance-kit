// app/(tabs)/index.tsx — Home: balance, chart (income/expense), quick actions, categories, For you, History (last 10).

import dayjs from "dayjs"
import { router } from "expo-router"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
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
  const [quickActionsVisible, setQuickActionsVisible] = useState(false)

  useEffect(() => {
    if (!userId) return
    ;(async () => {
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
    })()
  }, [userId])

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
        style={[styles.container, { paddingBottom: insets.bottom + 60 }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total balance</Text>
          <Text style={styles.balanceAmount}>
            {formatAmount(balance, currencySymbol)}
          </Text>
          <Text style={styles.balanceSub}>
            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <View style={styles.chartSection}>
          <LineChart
            data={incomeData}
            data2={expenseData}
            width={chartWidth()}
            height={180}
            spacing={36}
            initialSpacing={12}
            endSpacing={12}
            maxValue={maxValue}
            noOfSections={5}
            stepValue={maxValue / 5}
            curved
            curvature={0.2}
            color={AppColors.primary}
            color2="#c00"
            thickness={2}
            thickness2={2}
            hideDataPoints={incomeData.length > 10}
            hideDataPoints2={expenseData.length > 10}
            isAnimated
            animateTogether
            xAxisLabelTextStyle={styles.chartXLabel}
            yAxisTextStyle={styles.chartYLabel}
          />
          <View style={styles.chartLegend}>
            <View style={[styles.chartLegendDot, { backgroundColor: AppColors.primary }]} />
            <Text style={styles.chartLegendText}>Income</Text>
            <View style={[styles.chartLegendDot, { backgroundColor: "#c00" }]} />
            <Text style={styles.chartLegendText}>Expense</Text>
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
                    styles.categoryIcon,
                    { backgroundColor: (cat.color || AppColors.gray) + "40" },
                  ]}>
                  <Text style={styles.categoryIconText}>
                    {cat.icon ?? cat.name.slice(0, 1)}
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
  chartSection: {
    marginBottom: 24,
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
    marginTop: 8,
  },
  chartLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartLegendText: {
    fontSize: 12,
    color: AppColors.gray,
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
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 16,
    fontWeight: "600",
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
    color: "#c00",
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
