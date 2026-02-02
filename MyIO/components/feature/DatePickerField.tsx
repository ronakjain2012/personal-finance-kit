// components/feature/DatePickerField.tsx — Pressable date field; opens native date picker.

import DateTimePicker from "@react-native-community/datetimepicker"
import dayjs from "dayjs"
import { useState } from "react"
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { AppColors } from "@/constants/theme"
import { formatDate } from "@/lib/helpers"

type Props = {
  value: string // YYYY-MM-DD
  onChange: (date: string) => void
}

export function DatePickerField({ value, onChange }: Props) {
  const insets = useSafeAreaInsets()
  const [visible, setVisible] = useState(false)
  const current = value ? dayjs(value).toDate() : new Date()

  const handleChange = (_: unknown, date?: Date) => {
    if (Platform.OS === "android") setVisible(false)
    if (date) onChange(dayjs(date).format("YYYY-MM-DD"))
  }

  const handleDone = () => {
    setVisible(false)
  }

  if (Platform.OS === "android") {
    return (
      <>
        <Pressable style={styles.field} onPress={() => setVisible(true)}>
          <Text style={styles.fieldText}>{value ? formatDate(value) : "Select date"}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        {visible && (
          <DateTimePicker
            value={current}
            mode="date"
            display="default"
            onChange={handleChange}
          />
        )}
      </>
    )
  }

  return (
    <>
      <Pressable style={styles.field} onPress={() => setVisible(true)}>
        <Text style={styles.fieldText}>{value ? formatDate(value) : "Select date"}</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <Modal visible={visible} transparent animationType="slide">
        <View style={[styles.modalOverlay, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setVisible(false)} hitSlop={12}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleDone} hitSlop={12}>
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={current}
              mode="date"
              display="spinner"
              onChange={handleChange}
              style={styles.picker}
            />
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray + "25",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.black,
  },
  chevron: {
    fontSize: 20,
    fontWeight: "600",
    color: AppColors.gray,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray + "20",
  },
  cancelText: {
    fontSize: 16,
    color: AppColors.gray,
    fontWeight: "600",
  },
  doneText: {
    fontSize: 16,
    color: AppColors.black,
    fontWeight: "700",
  },
  picker: {
    alignSelf: "center",
  },
})
