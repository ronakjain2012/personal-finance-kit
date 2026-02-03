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

import { CategorySpendingCards } from "@/components/feature/CategorySpendingCards"
import { IncomeCategoryCards } from "@/components/feature/IncomeCategoryCards"
import { QuickActionsModal } from "@/components/feature/QuickActionsModal"
import { Header } from "@/components/layout"
import { AppColors } from "@/constants/theme"
import { formatAmount, formatDate, toISODateString } from "@/lib/helpers"
import {
  useAccountsStore,
  useAuthUser,
  useCategoriesStore,
  usePreferencesStore,
  useReportingStore,
  useTransactionsStore,
} from "@/stores"
import type { Transaction } from "@/types/database"

const CHART_DAYS = 7 // Fixed to week length
const HISTORY_LIMIT = 10

function buildChartData(transactions: Transaction[]) {
  const today = dayjs()
  const startOfWeek = today.startOf("week")
  
  const incomeByDate: Record<string, number> = {}
  const expenseByDate: Record<string, number> = {}
  const labels: string[] = []

  // Generate 7 days for the current week
  for (let i = 0; i < 7; i++) {
    const d = startOfWeek.add(i, "day")
    const key = toISODateString(d) ?? ""
    incomeByDate[key] = 0
    expenseByDate[key] = 0
    labels.push(key)
  }

  for (const t of transactions) {
    const key = t.transaction_date.slice(0, 10)
    if (key in incomeByDate) { // Only count if in current week
        const amt = Number(t.amount)
        if (t.entry_type === "INCOME") incomeByDate[key] += amt
        else if (t.entry_type === "EXPENSES") expenseByDate[key] += amt
    }
  }

  const incomeData = labels.map((k) => ({
    value: incomeByDate[k] ?? 0,
    label: dayjs(k).format("ddd"), // Mon, Tue...
    dataPointText: "",
  }))
  const expenseData = labels.map((k) => ({
    value: expenseByDate[k] ?? 0,
    label: dayjs(k).format("ddd"),
    dataPointText: "",
  }))

  const allValues = [
    ...incomeData.map((d) => d.value),
    ...expenseData.map((d) => d.value),
  ]
  const maxVal = Math.max(1, ...allValues)
  // Round up max value for nice top padding
  const maxValue = Math.ceil(maxVal * 1.2)

  return { incomeData, expenseData, maxValue }
}


export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthUser()
  const userId = user?.id ?? ""

  const accounts = useAccountsStore((s) => s.accounts)
  const transactions = useTransactionsStore((s) => s.transactions)
  const preference = usePreferencesStore((s) => s.preference)
  const currencies = usePreferencesStore((s) => s.currencies)
  const txLoading = useTransactionsStore((s) => s.loading)
  const accLoading = useAccountsStore((s) => s.loading)
  const catLoading = useCategoriesStore((s) => s.loading)
  const prefLoading = usePreferencesStore((s) => s.loading)
  const fetchTransactions = useTransactionsStore((s) => s.fetch)
  const fetchAccounts = useAccountsStore((s) => s.fetch)
  const fetchCategories = useCategoriesStore((s) => s.fetch)
  const fetchPreferences = usePreferencesStore((s) => s.fetch)
  const fetchReporting = useReportingStore((s) => s.fetch)

  const [refreshing, setRefreshing] = useState(false)
  const [quickActionsVisible, setQuickActionsVisible] = useState(false)
  
  const loading = txLoading || accLoading || catLoading || prefLoading

  const loadData = useCallback(async () => {
    if (!userId) return
    await Promise.all([
      fetchTransactions(userId, { limit: 200 }),
      fetchCategories(userId),
      fetchAccounts(userId),
      fetchPreferences(userId),
    ])
    await fetchReporting(userId)
    setRefreshing(false)
  }, [userId, fetchTransactions, fetchCategories, fetchAccounts, fetchPreferences, fetchReporting])

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

  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.is_active),
    [accounts]
  )
  const currencySymbol = useMemo(() => {
    const code = preference?.default_currency ?? "USD"
    return currencies.find((c) => c.code === code)?.symbol ?? "$"
  }, [preference?.default_currency, currencies])

  const balance = useMemo(
    () => activeAccounts.reduce((sum, a) => sum + Number(a.balance), 0),
    [activeAccounts]
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
            {activeAccounts.length} account{activeAccounts.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
             <Text style={styles.chartTitle}>Weekly Overview</Text>
             <Text style={styles.chartSubtitle}>{dayjs().startOf('week').format("MMM D")} - {dayjs().endOf('week').format("MMM D")}</Text>
          </View>
          <View style={styles.chartCardInner}>
            <LineChart
              data={incomeData}
              data2={expenseData}
              height={180}
              width={chartWidth() + 10}
              spacing={(chartWidth() - 30) / 7}
              initialSpacing={10}
              color={AppColors.primary}
              color2="#ef4444"
              thickness={3}
              thickness2={3}
              curved
              curvature={0.2}
              hideRules
              hideYAxisText
              hideAxesAndRules
              isAnimated
              animationDuration={1200}
              hideDataPoints
              hideDataPoints2
              startFillColor={AppColors.primary}
              startFillColor2="#ef4444"
              startOpacity={0.1}
              startOpacity2={0.1}
              endOpacity={0}
              endOpacity2={0}
              areaChart
              pointerConfig={{
                pointerStripUptoDataPoint: true,
                pointerStripColor: 'lightgray',
                pointerStripWidth: 2,
                strokeDashArray: [2, 5],
                pointerColor: AppColors.primary,
                radius: 4,
                pointerLabelWidth: 100,
                pointerLabelHeight: 120,
                activatePointersOnLongPress: false,
                autoAdjustPointerLabelPosition: true,
                pointerLabelComponent: (items: any) => {
                  const inc = items[0]?.value ?? 0
                  const exp = items[1]?.value ?? 0
                  return (
                     <View style={{
                        height: 90,
                        width: 100,
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        justifyContent:'center',
                        paddingHorizontal:10,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 4,
                     }}>
                        <Text style={{color: AppColors.gray, fontSize:10, marginBottom:4}}>
                            {items[0]?.label}
                        </Text>
                        <Text style={{color: AppColors.primary, fontWeight:'bold', fontSize:12}}>
                           + {formatAmount(inc, currencySymbol)}
                        </Text>
                        <Text style={{color: '#ef4444', fontWeight:'bold', fontSize:12}}>
                           - {formatAmount(exp, currencySymbol)}
                        </Text>
                     </View>
                  );
                },
              }}
            />
          </View>
          
          <View style={styles.chartLegend}>
             <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: AppColors.primary }]} />
                <Text style={styles.legendText}>Income</Text>
             </View>
             <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
                <Text style={styles.legendText}>Expense</Text>
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

        <CategorySpendingCards currencySymbol={currencySymbol} maxCards={6} />
        <IncomeCategoryCards currencySymbol={currencySymbol} maxCards={6} />

        <Text style={styles.sectionTitle}>For you</Text>
        <View style={styles.forYouRow}>
          <View style={styles.forYouCard}>
             <View style={[styles.forYouIconWrap,{ backgroundColor: AppColors.gray + "30" }]}>
              <Text style={styles.forYouIcon}>↓</Text>
            </View>
            <Text style={styles.forYouLabel}>Spending</Text>
            <Text style={styles.forYouAmount}>
              − {formatAmount(spending, currencySymbol)}
            </Text>
          </View>
          <View style={styles.forYouCard}>
            <View style={[styles.forYouIconWrap,{ backgroundColor: AppColors.primary + "40" }]}>
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
  chartHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.black,
  },
  chartSubtitle: {
    fontSize: 12,
    color: AppColors.gray,
    marginTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: AppColors.gray,
    fontWeight: "500",
  },
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
