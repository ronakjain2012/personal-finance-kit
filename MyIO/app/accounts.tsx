// app/accounts.tsx — Accounts list; creative, minimal, high-contrast.

import { router, useFocusEffect } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import {
    ActivityIndicator,
    LayoutAnimation,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    UIManager,
    View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { IconSymbol } from "@/components/ui/icon-symbol"
import { AppColors } from "@/constants/theme"
import { formatAmount } from "@/lib/helpers"
import {
    useAccountsStore,
    useAuthUser,
    usePreferencesStore,
    useReportingStore,
} from "@/stores"
import type { Account, AccountType } from "@/types/database"

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: "Cash",
  BANK: "Bank",
  CREDIT: "Credit Card",
  INVESTMENT: "Investment",
}

const SECTION_ORDER: AccountType[] = ["CASH", "BANK", "CREDIT", "INVESTMENT"]

function AccountIcon({ type }: { type: AccountType }) {
  let initial = ACCOUNT_TYPE_LABELS[type].charAt(0)
  let color: string = AppColors.gray

  switch (type) {
    case "CASH":
      color = "#16a34a"
      break
    case "BANK":
      color = "#2563eb"
      break
    case "CREDIT":
      color = "#9333ea"
      break
    case "INVESTMENT":
      color = "#ea580c"
      break
  }

  return (
    <View
      style={[
        styles.iconContainer,
        {
          backgroundColor: color,
          width: 48,  // Match CategoryIcon
          height: 48,
          borderRadius: 14, // Squircle
        },
      ]}
    >
      <Text style={styles.iconText}>{initial}</Text>
    </View>
  )
}

function AccountRow({
  account,
  balance,
  symbol,
  onPress,
}: {
  account: Account
  balance: number
  symbol: string
  onPress: () => void
}) {
  // Positive balance = Green/Blue, Negative = Red
  const isPositive = balance >= 0
  const amountColor = isPositive ? "#3fe579ff" : "#ef4444"

  return (
    <Pressable
      style={({ pressed }) => [pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${account.name}`}
    >
      <View style={styles.cardRow}>
        {/* Left: Icon + Name */}
        <View style={styles.cardRowLeft}>
          <AccountIcon type={account.type} />
          <View style={styles.cardRowContent}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {account.name}
            </Text>
            <Text style={styles.rowSubtitle}>
              {ACCOUNT_TYPE_LABELS[account.type]}
            </Text>
          </View>
        </View>

        {/* Right: Amount */}
        <View style={styles.cardRowRight}>
          <Text style={[styles.statAmount, { color: amountColor }]}>
             {/* If negative, formatAmount adds - usually, but we can trust formatAmount or strip it.
                 formatAmount result usually includes symbol.
                 Let's rely on formatAmount result but color it.
                 We want + sign if positive? Image showed signs.
             */}
             {balance > 0 ? "+" : ""}{formatAmount(balance, symbol)}
          </Text>
          {/* We don't have a status for accounts like category list, maybe just empty or "Available" */}
        </View>
      </View>
    </Pressable>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  )
}

export default function AccountsScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthUser()
  const userId = user?.id ?? ""

  // Accounts Store
  const accounts = useAccountsStore((s) => s.accounts)
  const accLoading = useAccountsStore((s) => s.loading)
  const fetchAccounts = useAccountsStore((s) => s.fetch)

  // Reporting Store
  const reportingFetch = useReportingStore((s) => s.fetch)
  const accountsBalance = useReportingStore((s) => s.getAccountsBalance())

  // Preferences Store (for currency)
  const preferences = usePreferencesStore((s) => s.preference)
  const currencies = usePreferencesStore((s) => s.currencies)

  const symbol = useMemo(() => {
    const code = preferences?.default_currency || "USD"
    const found = currencies.find((c) => c.code === code)
    return found?.symbol || "$"
  }, [preferences, currencies])

  const [refreshing, setRefreshing] = useState(false)

  const byType = useMemo(() => {
    const map: Record<AccountType, Account[]> = {
      CASH: [],
      BANK: [],
      CREDIT: [],
      INVESTMENT: [],
    }
    for (const a of accounts) {
      map[a.type].push(a)
    }
    return map
  }, [accounts])

  const loadData = useCallback(async () => {
    if (!userId) return
    await Promise.all([fetchAccounts(userId), reportingFetch(userId)])
    setRefreshing(false)
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
  }, [userId, fetchAccounts, reportingFetch])

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerBtn}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <IconSymbol name="chevron.left" size={28} color={AppColors.black} />
        </Pressable>
        <Text style={styles.headerTitle}>Accounts</Text>
        <Pressable
          style={styles.headerBtn}
          onPress={() => router.push("/add-account")}
          hitSlop={10}
        >
          <IconSymbol name="plus" size={24} color={AppColors.black} />
        </Pressable>
      </View>

      {/* Content */}
      {accLoading && !refreshing && accounts.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : accounts.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            {/* Generic icon since custom icon support might be limited */}
            <Text style={{ fontSize: 40 }}>🏦</Text>
          </View>
          <Text style={styles.emptyTitle}>No accounts</Text>
          <Text style={styles.emptyText}>
            Add bank accounts, cash wallets, or credit cards.
          </Text>
          <Pressable
            style={styles.ctaBtn}
            onPress={() => router.push("/add-account")}
          >
            <Text style={styles.ctaBtnText}>Add Account</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {SECTION_ORDER.map((type) => {
            const list = byType[type]
            if (list.length === 0) return null
            return (
              <View key={type} style={styles.section}>
                <SectionHeader title={ACCOUNT_TYPE_LABELS[type]} />
                <View style={styles.cardGroup}>
                  {list.map((a, index) => {
                    const balance = accountsBalance[a.id] ?? a.opening_balance
                    return (
                      <View key={a.id}>
                        <AccountRow
                          account={a}
                          balance={balance}
                          symbol={symbol}
                          onPress={() =>
                            router.push({
                              pathname: "/edit-account/[id]",
                              params: { id: a.id },
                            })
                          }
                        />
                        {index < list.length - 1 && (
                          <View style={styles.separator} />
                        )}
                      </View>
                    )
                  })}
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.gray + "05",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginTop: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: AppColors.white,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.black,
    letterSpacing: -0.5,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.gray,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardGroup: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: AppColors.white,
    flexWrap: "nowrap",
    width: "100%",
  },
  rowPressed: {
    backgroundColor: AppColors.gray + "08",
  },
  cardRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  cardRowContent: {
    marginLeft: 16,
    justifyContent: "center",
    flex: 1,
  },
  cardRowRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 80,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.black,
    marginBottom: 4,
  },
  rowSubtitle: {
    fontSize: 13,
    color: AppColors.gray,
    fontWeight: "500",
  },
  statAmount: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.gray + "15",
    marginLeft: 80,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconText: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.white,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    marginTop: -40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.gray + "10",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.black,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: AppColors.gray,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  ctaBtn: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 100,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.black,
  },
})
