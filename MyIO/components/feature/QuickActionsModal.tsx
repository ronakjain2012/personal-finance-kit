// components/feature/QuickActionsModal.tsx — Quick actions grid (avatar menu) using react-native-modal.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';

export type QuickActionId =
  | 'transfer'
  | 'expense'
  | 'income'
  | 'close'
  | 'goal'
  | 'add_import'
  | 'debts'
  | 'setting'
  | 'all_card'
  | 'myio_card'
  | 'new_card';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

type QuickActionItem = {
  id: QuickActionId;
  label: string;
  icon: MaterialIconName;
  highlighted?: boolean;
};

const ROW1: QuickActionItem[] = [
  { id: 'transfer', label: 'TRANSFER', icon: 'swap-horiz' },
  { id: 'expense', label: 'EXPENSE', icon: 'trending-up' },
  { id: 'income', label: 'INCOME', icon: 'trending-down' },
];

const ROW2: QuickActionItem[] = [
  { id: 'goal', label: 'GOAL', icon: 'emoji-events' },
  { id: 'add_import', label: 'ADD IMPORT', icon: 'download' },
  { id: 'debts', label: 'DEBTS', icon: 'sync' },
  { id: 'setting', label: 'SETTING', icon: 'settings' },
];

const ROW3: QuickActionItem[] = [
  { id: 'all_card', label: 'ALL CARD', icon: 'swap-horiz' },
  { id: 'myio_card', label: 'MYIO CARD', icon: 'apps', highlighted: true },
  { id: 'new_card', label: 'NEW CARD', icon: 'credit-card' },
];

const ROWS = [ROW1, ROW2, ROW3];

export type QuickActionsModalProps = {
  visible: boolean;
  onClose: () => void;
  onAction?: (id: QuickActionId) => void;
};

export function QuickActionsModal({
  visible,
  onClose,
  onAction,
}: QuickActionsModalProps) {
  const insets = useSafeAreaInsets();

  const handleAction = (id: QuickActionId) => {
    if (id === 'close') {
      onClose();
      return;
    }
    onAction?.(id);
    if (id === 'setting') {
      router.push('/(preferences)');
      onClose();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      animationIn="fadeIn"
      animationOut="fadeOut"
      animationInTiming={250}
      animationOutTiming={250}
      backdropOpacity={0.5}
      backdropColor="#000"
      hasBackdrop
      coverScreen
      style={styles.modal}
      useNativeDriver
      useNativeDriverForBackdrop
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingHorizontal: 24,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Quick actions</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.buttonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <MaterialIcons name="close" size={28} color={AppColors.black} />
          </Pressable>
        </View>

        <View style={styles.content}>
          {ROWS.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleAction(item.id)}
                  style={({ pressed }) => [
                    styles.buttonWrap,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <View
                    style={[
                      styles.circle,
                      item.highlighted && styles.circleHighlighted,
                    ]}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={24}
                      color={item.highlighted ? AppColors.black : AppColors.gray}
                    />
                  </View>
                  <Text
                    style={[
                      styles.label,
                      item.highlighted && styles.labelHighlighted,
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    flex: 1,
  },
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: AppColors.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray + '20',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.black,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingTop: 24,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  buttonWrap: {
    flex: 1,
    alignItems: 'center',
    minWidth: 72,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.gray + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  circleHighlighted: {
    backgroundColor: AppColors.primary,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: AppColors.gray,
  },
  labelHighlighted: {
    color: AppColors.black,
  },
});
