// components/feature/AttachmentChip.tsx — Attachment item: preview/icon, name, remove top-right, tap to open.

import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native"

import { AppColors } from "@/constants/theme"
import type { AttachmentItem } from "@/lib/attachment-utils"

const THUMB_SIZE = 72
const CHIP_WIDTH = 100

type Props = AttachmentItem & {
  onRemove: () => void
}

export function AttachmentChip({ url, name, isImage, onRemove }: Props) {
  const handleOpen = () => {
    Linking.openURL(url).catch(() => {})
  }

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.chip} onPress={handleOpen}>
        <Pressable
          style={styles.removeBtn}
          onPress={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          hitSlop={8}>
          <Text style={styles.removeText}>×</Text>
        </Pressable>
        {isImage ? (
          <Image
            source={{ uri: url }}
            style={styles.thumb}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.fileIconWrap}>
            <Text style={styles.fileIcon}>PDF</Text>
          </View>
        )}
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
  },
  chip: {
    width: CHIP_WIDTH,
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray + "25",
    overflow: "hidden",
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    zIndex: 1,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AppColors.gray + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.black,
    lineHeight: 18,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    backgroundColor: AppColors.gray + "15",
  },
  fileIconWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    backgroundColor: AppColors.gray + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  fileIcon: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.gray,
  },
  name: {
    fontSize: 11,
    fontWeight: "600",
    color: AppColors.black,
    marginTop: 6,
    textAlign: "center",
    maxWidth: CHIP_WIDTH - 12,
  },
})
