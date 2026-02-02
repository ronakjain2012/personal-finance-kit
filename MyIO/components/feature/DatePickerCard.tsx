// components/feature/DatePickerCard.tsx — Month calendar with arrows; selected date highlighted.

import dayjs from "dayjs"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { AppColors } from "@/constants/theme"

type Props = {
  value: string // YYYY-MM-DD
  onChange: (date: string) => void
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

export function DatePickerCard({ value, onChange }: Props) {
  const current = value ? dayjs(value) : dayjs()
  const monthStart = current.startOf("month")
  const monthEnd = current.endOf("month")
  const startPad = (monthStart.day() + 6) % 7
  const daysInMonth = monthEnd.date()
  const totalCells = startPad + daysInMonth
  const rows = Math.ceil(totalCells / 7)

  const goPrev = () => {
    const d = current.subtract(1, "month")
    onChange(d.format("YYYY-MM-DD"))
  }
  const goNext = () => {
    const d = current.add(1, "month")
    onChange(d.format("YYYY-MM-DD"))
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length < rows * 7) cells.push(null)

  const selectedDate = value ? dayjs(value).date() : null
  const selectedMonth = value ? dayjs(value).month() : current.month()
  const selectedYear = value ? dayjs(value).year() : current.year()

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable style={styles.arrow} onPress={goPrev} hitSlop={12}>
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <Text style={styles.monthYear}>
          {current.format("MMMM")} – {current.format("YYYY")}
        </Text>
        <Pressable style={styles.arrow} onPress={goNext} hitSlop={12}>
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (d === null) return <View key={i} style={styles.cell} />
          const isSelected =
            selectedDate === d &&
            current.month() === selectedMonth &&
            current.year() === selectedYear
          const dateStr = current.date(d).format("YYYY-MM-DD")
          return (
            <Pressable
              key={i}
              style={[styles.cell, isSelected && styles.cellSelected]}
              onPress={() => onChange(dateStr)}>
              <Text
                style={[
                  styles.cellText,
                  isSelected && styles.cellTextSelected,
                ]}>
                {d}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray + "25",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  arrow: {
    padding: 8,
  },
  arrowText: {
    fontSize: 28,
    fontWeight: "600",
    color: AppColors.black,
  },
  monthYear: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.black,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekday: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.gray,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  cellSelected: {
    backgroundColor: "#2563eb",
    borderRadius: 999,
  },
  cellText: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.black,
  },
  cellTextSelected: {
    color: AppColors.white,
  },
})
