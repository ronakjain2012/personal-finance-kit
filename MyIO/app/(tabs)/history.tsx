// app/(tabs)/history.tsx — History placeholder; transaction list in a later task.

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuickActionsModal } from '@/components/feature/QuickActionsModal';
import { Header } from '@/components/layout';
import { AppColors } from '@/constants/theme';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 60 }]}>
      <View style={styles.headerWrap}>
        <Header
          title="History"
          onAvatarPress={() => setQuickActionsVisible(true)}
          onRightPress={() => {}}
        />
      </View>
      <Text style={styles.hint}>Transaction history will be listed here.</Text>

      <QuickActionsModal
        visible={quickActionsVisible}
        onClose={() => setQuickActionsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: AppColors.white,
  },
  headerWrap: {
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: AppColors.gray,
  },
});
