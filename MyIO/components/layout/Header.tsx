// components/layout/Header.tsx — Reusable app header: avatar (left), title (center), optional right action.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/theme';

export type HeaderProps = {
  /** Screen title, centered */
  title: string;
  /** Called when avatar is pressed (e.g. open quick actions) */
  onAvatarPress?: () => void;
  /** Called when right action (e.g. notifications) is pressed */
  onRightPress?: () => void;
  /** Show avatar; default true */
  showAvatar?: boolean;
  /** Custom right element; if not set, shows bell icon when onRightPress is provided */
  rightElement?: React.ReactNode;
};

export function Header({
  title,
  onAvatarPress,
  onRightPress,
  showAvatar = true,
  rightElement,
}: HeaderProps) {
  const showRight = rightElement != null || onRightPress != null;

  const handleAvatarPress = () => {
    if (typeof onAvatarPress === 'function') {
      onAvatarPress();
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.side} pointerEvents="box-none" collapsable={false}>
        {showAvatar ? (
          <Pressable
            onPress={handleAvatarPress}
            style={({ pressed }) => [styles.avatarWrap, pressed && styles.pressed]}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <MaterialIcons name="account-circle" size={40} color={AppColors.gray} />
          </Pressable>
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.side}>
        {showRight ? (
          rightElement ?? (
            <Pressable
              onPress={onRightPress}
              style={({ pressed }) => [styles.rightButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <MaterialIcons name="notifications" size={24} color={AppColors.black} />
            </Pressable>
          )
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    marginBottom: 16,
  },
  side: {
    width: 48,
    alignItems: 'flex-start',
  },
  avatarWrap: {
    padding: 4,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.black,
    textAlign: 'center',
  },
  rightButton: {
    padding: 8,
    alignSelf: 'flex-end',
  },
  pressed: {
    opacity: 0.7,
  },
});
