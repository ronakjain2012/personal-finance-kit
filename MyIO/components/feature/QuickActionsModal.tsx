// components/feature/QuickActionsModal.tsx — Quick actions grid (avatar menu) using react-native-modal.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import {
  Dimensions,
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
  | 'new_card'
  | 'categories'
  | 'accounts';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

type QuickActionItem = {
  id: QuickActionId;
  label: string;
  icon: MaterialIconName;
  color: string;
};

const ACTIONS: QuickActionItem[] = [
  { id: 'income', label: 'Income', icon: 'arrow-downward', color: '#16a34a' },
  { id: 'expense', label: 'Expense', icon: 'arrow-upward', color: '#ef4444' },
  { id: 'transfer', label: 'Transfer', icon: 'swap-horiz', color: '#2563eb' },
  { id: 'categories', label: 'Categories', icon: 'category', color: '#f59e0b' },
  { id: 'accounts', label: 'Accounts', icon: 'account-balance-wallet', color: '#8b5cf6' },
  { id: 'goal', label: 'Goals', icon: 'flag', color: '#ec4899' },
  { id: 'debts', label: 'Debts', icon: 'money-off', color: '#64748b' },
  { id: 'add_import', label: 'Import', icon: 'file-upload', color: '#0ea5e9' },
  { id: 'myio_card', label: 'My Cards', icon: 'credit-card', color: '#14b8a6' },
  { id: 'setting', label: 'Settings', icon: 'settings', color: '#475569' },
];

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
  const screenWidth = Dimensions.get('window').width;
  
  // 3 columns for fuller look with more space
  const itemWidth = (screenWidth - 48) / 3; 

  const handleAction = (id: QuickActionId) => {
    onAction?.(id);
    // Navigation routing
    setTimeout(() => {
      if (id === 'setting') router.push('/(preferences)');
      else if (id === 'categories') router.push('/categories');
      else if (id === 'accounts') router.push('/accounts' as any);
      
      onClose();
    }, 50);
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      // Slower, smoother animation for large sheet
      animationInTiming={500}
      animationOutTiming={400}
      backdropOpacity={0.5}
      backdropColor="#000"
      style={styles.modal}
      useNativeDriver
      hideModalContentWhileAnimating
    >
      <View style={[styles.sheet, { paddingTop: Math.max(insets.top, 20) }]}>
        {/* Header with Close */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Quick Actions</Text>
          <Pressable 
            onPress={onClose} 
            style={styles.closeBtn}
            hitSlop={20}
          >
           <MaterialIcons name="close" size={28} color={AppColors.black} />
          </Pressable>
        </View>

        <View style={styles.grid}>
          {ACTIONS.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleAction(item.id)}
              style={({ pressed }) => [
                styles.itemContainer,
                { width: itemWidth },
                pressed && styles.itemPressed,
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
                <MaterialIcons name={item.icon} size={32} color={item.color} />
              </View>
              <Text style={styles.itemLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  sheet: {
    flex: 1, // Full height
    backgroundColor: AppColors.white,
    paddingHorizontal: 24,
    // Rounded top corners only slightly since it's full screen-ish
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 60, // Start slightly down from top
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 24, // Larger title
    fontWeight: '800',
    color: AppColors.black,
    letterSpacing: -0.5,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: AppColors.gray + '10',
    borderRadius: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // alignContent: 'center',
    gap: 0, 
  },
  itemContainer: {
    alignItems: 'center',
    marginBottom: 40, // More vertical spacing
  },
  itemPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
  iconCircle: {
    width: 72, // Larger icons
    height: 72,
    borderRadius: 28, 
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.black,
    textAlign: 'center',
  },
});
