// app/categories.tsx — Categories list; creative, minimal, high-contrast.

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

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

import { IconSymbol } from "@/components/ui/icon-symbol"
import { AppColors } from "@/constants/theme"
import { formatAmount } from "@/lib/helpers"
import { useAuthUser, useCategoriesStore, usePreferencesStore, useReportingStore } from "@/stores"
import type { Category, CategoryType } from "@/types/database"

const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
  TRANSFER: "Transfer",
}

const SECTION_ORDER: CategoryType[] = ["INCOME", "EXPENSE", "TRANSFER"]

function CategoryIcon({
  color,
  name,
  size = 48,
}: {
  color: string
  name: string
  size?: number
}) {
  const initial = name.charAt(0).toUpperCase()
  return (
    <View
      style={[
        styles.iconContainer,
        {
          backgroundColor: color || AppColors.gray,
          width: size,
          height: size,
          borderRadius: 14, // Squircle shape
        },
      ]}
    >
      <Text style={styles.iconText}>{initial}</Text>
    </View>
  )
}

function CategoryRow({
  category,
  amountStr,
  count,
  onPress,
}: {
  category: Category
  amountStr?: string
  count?: number
  onPress: () => void
}) {
  const isIncome = category.type === "INCOME"
  const amountColor = isIncome ? "#3fe579ff" : "#ef4444" 
  
  return (
    <Pressable
      style={({ pressed }) => [ pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${category.name}`}
    >
      <View style={styles.cardRow}>
        {/* Left: Icon + Name */}
      <View style={styles.cardRowLeft}>
        <CategoryIcon color={category.color} name={category.name} />
        <View style={styles.cardRowContent}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {category.name}
          </Text>
          <Text style={styles.rowSubtitle}>
           {count !== undefined && count > 0 ? `${count} txns` : "No transactions"}
          </Text>
        </View>
      </View>

      {/* Right: Amount + Label */}
      <View style={styles.cardRowRight}>
        {amountStr ? (
          <Text style={[styles.statAmount, { color: amountColor }]}>
            {isIncome ? "+" : "-"}{amountStr.replace(/[^0-9.,]/g, "").trim()} 
          </Text>
        ) : (
           <Text style={[styles.statAmount, { color: AppColors.gray }]}>-</Text>
        )}
        <Text style={{}}>
          {CATEGORY_TYPE_LABELS[category.type]}
        </Text>
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

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthUser()
  const userId = user?.id ?? ""

  // Category Store
  const categories = useCategoriesStore((s) => s.categories)
  const catLoading = useCategoriesStore((s) => s.loading)
  const fetchCategories = useCategoriesStore((s) => s.fetch)

  // Reporting Store
  const reportingFetch = useReportingStore((s) => s.fetch)
  const incomeSummary = useReportingStore((s) => s.getCategoryIncomeSummary())
  const expenseSummary = useReportingStore((s) => s.getCategorySpendingSummary())
  const loadingReporting = false // basic tracking via refresh

  // Preferences Store (for currency)
  const preferences = usePreferencesStore((s) => s.preference)
  const currencies = usePreferencesStore((s) => s.currencies)
  
  const symbol = useMemo(() => {
    const code = preferences?.default_currency || "USD"
    const found = currencies.find(c => c.code === code)
    return found?.symbol || "$"
  }, [preferences, currencies])

  const [refreshing, setRefreshing] = useState(false)

  // Maps for efficient lookup
  const statsMap = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>()
    for (const item of incomeSummary) {
      if(item.category) map.set(item.category.id, { total: item.incomeTotal, count: item.transactionCount })
    }
    for (const item of expenseSummary) {
      if(item.category) map.set(item.category.id, { total: item.expenseTotal, count: item.transactionCount })
    }
    return map
  }, [incomeSummary, expenseSummary])

  const byType = useMemo(() => {
    const map: Record<CategoryType, Category[]> = {
      INCOME: [],
      EXPENSE: [],
      TRANSFER: [],
    }
    for (const c of categories) {
      map[c.type].push(c)
    }
    return map
  }, [categories])

  const loadData = useCallback(async () => {
    if (!userId) return
    // parallel fetch
    await Promise.all([
        fetchCategories(userId),
        reportingFetch(userId)
    ])
    setRefreshing(false)
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
  }, [userId, fetchCategories, reportingFetch])

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
        <Text style={styles.headerTitle}>Categories</Text>
        <Pressable
          style={styles.headerBtn}
          onPress={() => router.push("/add-category")}
          hitSlop={10}
        >
          <IconSymbol name="plus" size={24} color={AppColors.black} />
        </Pressable>
      </View>

      {/* Content */}
      {catLoading && !refreshing && categories.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <IconSymbol name="tag" size={48} color={AppColors.gray + "50"} />
          </View>
          <Text style={styles.emptyTitle}>No categories</Text>
          <Text style={styles.emptyText}>
            Create your first category to start tracking.
          </Text>
          <Pressable
            style={styles.ctaBtn}
            onPress={() => router.push("/add-category")}
          >
            <Text style={styles.ctaBtnText}>Create Category</Text>
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
                <SectionHeader title={CATEGORY_TYPE_LABELS[type]} />
                <View style={styles.cardGroup}>
                  {list.map((c, index) => {
                     const stats = statsMap.get(c.id)
                     const amountStr = stats && stats.total > 0 
                        ? formatAmount(stats.total, symbol) 
                        : undefined
                     const count = stats?.count

                    return (
                    <View key={c.id}>
                      <CategoryRow
                        category={c}
                        amountStr={amountStr}
                        count={count}
                        onPress={() =>
                          router.push({
                            pathname: "/edit-category/[id]",
                            params: { id: c.id },
                          })
                        }
                      />
                      {index < list.length - 1 && <View style={styles.separator} />}
                    </View>
                  )})}
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.gray + "05", // slightly off-white bg
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
    // small shadow
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
    // card shadow
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
    flexWrap: "nowrap", // Explicitly disable wrap
    width: "100%",
  },
  rowPressed: {
    backgroundColor: AppColors.gray + "08",
  },
  cardRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Take remaining space
    marginRight: 16,
  },
  cardRowContent: {
    marginLeft: 16,
    justifyContent: "center",
    flex: 1, // Shrink text if needed
  },
  cardRowRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 80, // Ensure minimum space for amount
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
  statStatus: {
    fontSize: 12,
    color: AppColors.gray,
    fontWeight: "500",
    opacity: 0.8,
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
  // Empty State
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
