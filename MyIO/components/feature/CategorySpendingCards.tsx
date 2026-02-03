import React from "react"
import { StyleSheet, Text, View } from "react-native"
import Svg, { Circle } from "react-native-svg"

import { AppColors } from "@/constants/theme"
import { formatAmount } from "@/lib/helpers"
import { useReportingStore, type CategorySpendingItem } from "@/stores"

const MINI_DONUT_SIZE = 40
const MINI_DONUT_STROKE = 4
const MINI_DONUT_R = (MINI_DONUT_SIZE - MINI_DONUT_STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * MINI_DONUT_R

function MiniDonut({
  percentageShare,
  color,
}: {
  percentageShare: number
  color: string
}) {
  const dash = (percentageShare / 100) * CIRCUMFERENCE
  const offset = CIRCUMFERENCE * 0.25
  return (
    <Svg width={MINI_DONUT_SIZE} height={MINI_DONUT_SIZE} style={styles.miniDonut}>
      <Circle
        cx={MINI_DONUT_SIZE / 2}
        cy={MINI_DONUT_SIZE / 2}
        r={MINI_DONUT_R}
        stroke={AppColors.gray + "30"}
        strokeWidth={MINI_DONUT_STROKE}
        fill="none"
      />
      <Circle
        cx={MINI_DONUT_SIZE / 2}
        cy={MINI_DONUT_SIZE / 2}
        r={MINI_DONUT_R}
        stroke={color}
        strokeWidth={MINI_DONUT_STROKE}
        fill="none"
        strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </Svg>
  )
}

function CategoryCard({
  item,
  currencySymbol,
}: {
  item: CategorySpendingItem
  currencySymbol: string
}) {
  const { category, expenseTotal, transactionCount, percentageShare, trendPercentage } = item
  const accent = category.color || AppColors.gray
  const trendUp = trendPercentage > 0
  const trendDown = trendPercentage < 0
  const trendLabel =
    trendPercentage === 0
      ? "— 0.00%"
      : trendUp
        ? `↑ ${trendPercentage.toFixed(2)}%`
        : `↓ ${Math.abs(trendPercentage).toFixed(2)}%`

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: accent + "35" }]}>
          <Text style={styles.avatarText}>{category.name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <MiniDonut percentageShare={percentageShare} color={accent} />
      </View>
      <Text style={styles.categoryName}>{category.name}</Text>
      <Text style={styles.meta}>
        {transactionCount} Transaction{transactionCount !== 1 ? "s" : ""}
      </Text>
      <Text style={styles.amount}>− {formatAmount(expenseTotal, currencySymbol)}</Text>
      <Text
        style={[
          styles.trend,
          trendUp && styles.trendUp,
          trendDown && styles.trendDown,
        ]}>
        {trendLabel}
      </Text>
    </View>
  )
}

type CategorySpendingCardsProps = {
  currencySymbol: string
  maxCards?: number
}

export function CategorySpendingCards({
  currencySymbol,
  maxCards = 6,
}: CategorySpendingCardsProps) {
  const categorySpendingSummary = useReportingStore((s) => s.categorySpendingSummary)
  const expenseTotal = useReportingStore((s) => s.expenseTotal)
  const periodLabel = useReportingStore((s) => s.periodLabel)

  const items = categorySpendingSummary.slice(0, maxCards)

  if (items.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <Text style={styles.emptyHint}>No spending by category yet</Text>
      </View>
    )
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Categories</Text>
      {periodLabel ? (
        <Text style={styles.periodLabel}>{periodLabel}</Text>
      ) : null}
      <View style={styles.grid}>
        {items.map((item) => (
          <CategoryCard
            key={item.category.id}
            item={item}
            currencySymbol={currencySymbol}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.black,
    marginBottom: 4,
  },
  periodLabel: {
    fontSize: 12,
    color: AppColors.gray,
    marginBottom: 12,
  },
  emptyHint: {
    fontSize: 14,
    color: AppColors.gray,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "47%",
    minWidth: 140,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.gray + "30",
    borderRadius: 12,
    padding: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.black,
  },
  miniDonut: {},
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.black,
  },
  meta: {
    fontSize: 11,
    color: AppColors.gray,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.black,
    marginTop: 4,
  },
  trend: {
    fontSize: 11,
    color: AppColors.gray,
    marginTop: 4,
  },
  trendUp: {
    color: AppColors.primary,
  },
  trendDown: {
    color: AppColors.gray,
  },
})
