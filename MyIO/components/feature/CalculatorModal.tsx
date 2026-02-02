// components/feature/CalculatorModal.tsx — Calculator modal: digits, + − × ÷ =, safe area, theme colors.

import { useCallback, useEffect, useState } from "react"
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { AppColors } from "@/constants/theme"

type Props = {
  visible: boolean
  initialValue?: string
  onConfirm: (amount: number) => void
  onCancel: () => void
}

type Op = "+" | "−" | "×" | "÷"

const DIGIT_ROWS: string[][] = [
  ["7", "8", "9", "÷"],
  ["4", "5", "6", "×"],
  ["1", "2", "3", "−"],
  [".", "0", "⌫", "+"],
]

function applyOp(a: number, op: Op, b: number): number {
  switch (op) {
    case "+": return a + b
    case "−": return a - b
    case "×": return a * b
    case "÷": return b === 0 ? a : a / b
    default: return b
  }
}

const OP_MAP: Record<string, Op> = { "+": "+", "−": "−", "×": "×", "÷": "÷" }

export function CalculatorModal({
  visible,
  initialValue = "",
  onConfirm,
  onCancel,
}: Props) {
  const [display, setDisplay] = useState(initialValue)
  const [pending, setPending] = useState<{ value: number; op: Op } | null>(null)
  const [lastWasEquals, setLastWasEquals] = useState(false)

  useEffect(() => {
    if (visible) {
      setDisplay(initialValue)
      setPending(null)
      setLastWasEquals(false)
    }
  }, [visible, initialValue])

  const handleKey = useCallback((key: string) => {
    const op = OP_MAP[key]
    if (op) {
      const num = parseFloat(display) || 0
      setPending({ value: num, op })
      setDisplay("")
      setLastWasEquals(false)
      return
    }
    if (key === "⌫") {
      setDisplay((s) => s.slice(0, -1))
      setLastWasEquals(false)
      return
    }
    if (key === ".") {
      if (display.includes(".")) return
      if (display === "" || display === "0") {
        setDisplay("0.")
      } else {
        setDisplay((s) => s + ".")
      }
      setLastWasEquals(false)
      return
    }
    if (lastWasEquals) {
      setDisplay(key)
      setLastWasEquals(false)
    } else if (display === "0" && key !== ".") {
      setDisplay(key)
    } else {
      setDisplay((s) => s + key)
    }
  }, [display, lastWasEquals])

  const handleEquals = useCallback(() => {
    if (!pending) return
    const b = parseFloat(display) || 0
    const result = applyOp(pending.value, pending.op, b)
    const rounded = Math.round(result * 100) / 100
    setDisplay(String(rounded))
    setPending(null)
    setLastWasEquals(true)
  }, [pending, display])

  const handleClear = useCallback(() => {
    setDisplay("")
    setPending(null)
    setLastWasEquals(false)
  }, [])

  const handleOk = useCallback(() => {
    const parsed = parseFloat(display) || 0
    onConfirm(parsed)
    setDisplay("")
    setPending(null)
  }, [display, onConfirm])

  const handleCancel = useCallback(() => {
    setDisplay(initialValue)
    onCancel()
  }, [initialValue, onCancel])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />
        <SafeAreaView style={styles.content} edges={["bottom"]}>
          <Text style={styles.title}>Amount</Text>
          <View style={styles.displayWrap}>
            <Text style={styles.display} numberOfLines={1}>
              {display || "0"}
            </Text>
          </View>
          <View style={styles.keypad}>
            {DIGIT_ROWS.map((row, i) => (
              <View key={i} style={styles.row}>
                {row.map((key) => (
                  <Pressable
                    key={key}
                    style={[
                      styles.key,
                      OP_MAP[key] && styles.keyOp,
                      key === "⌫" && styles.keyBack,
                    ]}
                    onPress={() => handleKey(key)}>
                    <Text style={styles.keyText}>{key === "−" ? "−" : key === "×" ? "×" : key === "÷" ? "÷" : key}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.actionText}>Clear</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.actionTextSecondary}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.equalsBtn} onPress={handleEquals}>
              <Text style={styles.actionText}>=</Text>
            </Pressable>
            <Pressable style={styles.okBtn} onPress={handleOk}>
              <Text style={styles.okBtnText}>OK</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.black,
    marginBottom: 12,
  },
  displayWrap: {
    backgroundColor: AppColors.gray + "18",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  display: {
    fontSize: 28,
    fontWeight: "700",
    color: AppColors.black,
    textAlign: "right",
  },
  keypad: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10,
  },
  key: {
    flex: 1,
    height: 52,
    backgroundColor: AppColors.gray + "20",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  keyOp: {
    backgroundColor: AppColors.primary + "40",
  },
  keyBack: {
    backgroundColor: AppColors.gray + "35",
  },
  keyText: {
    fontSize: 22,
    fontWeight: "600",
    color: AppColors.black,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  clearBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: AppColors.gray + "25",
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: AppColors.gray + "25",
  },
  equalsBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: AppColors.gray + "30",
  },
  okBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.black,
  },
  actionTextSecondary: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.gray,
  },
  okBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.black,
  },
})
