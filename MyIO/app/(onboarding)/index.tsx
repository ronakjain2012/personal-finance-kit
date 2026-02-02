// app/(onboarding)/index.tsx — Onboarding carousel: white background, primary/black text, images; back stays in onboarding.

import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  ImageSourcePropType,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Slide = {
  key: string;
  image: ImageSourcePropType;
  heading: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    key: '1',
    image: require('../../assets/logo.png'),
    heading: 'Manage your money every day',
    description:
      'Set up the unloading of transactions from your bank cards and get rid of the routine of adding expenses manually.',
  },
  {
    key: '2',
    image: require('../../assets/project_imgs/control_preview.jpg'),
    heading: 'Your data is securely protected',
    description:
      'Set up the unloading of transactions from your bank cards and get rid of the routine of adding expenses manually.',
  },
  {
    key: '3',
    image: require('../../assets/project_imgs/tracking-business-expenses.png'),
    heading: 'We always take care of your budget',
    description:
      'Set up the unloading of transactions from your bank cards and get rid of the routine of adding expenses manually.',
  },
  {
    key: '4',
    image: require('../../assets/project_imgs/listing.webp'),
    heading: '100+ of banks to connect to',
    description:
      'Set up the unloading of transactions from your bank cards and get rid of the routine of adding expenses manually.',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index > 0) {
        listRef.current?.scrollToOffset({ offset: (index - 1) * SCREEN_WIDTH, animated: true });
        setIndex(index - 1);
        return true;
      }
      return true;
    });
    return () => sub.remove();
  }, [index]);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (i >= 0 && i < SLIDES.length) setIndex(i);
  }

  const renderItem: ListRenderItem<Slide> = ({ item }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.imageWrap}>
        <Image source={item.image} style={styles.image} resizeMode="contain" />
      </View>
      <Text style={styles.heading}>{item.heading}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.progressRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.progressDash, index === i && styles.progressDashActive]}
          />
        ))}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
      />

      <View style={styles.cta}>
        <Pressable
          onPress={() => router.replace('/(auth)/login')}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Log in">
          <Text style={styles.primaryButtonText}>Log in</Text>
        </Pressable>
        <Text style={styles.or}>or</Text>
        <Pressable
          onPress={() => router.replace('/(auth)/register')}
          style={({ pressed }) => [styles.outlineButton, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Create new account">
          <Text style={styles.outlineButtonText}>Create new account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
    paddingHorizontal: 24,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  progressDash: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.gray,
  },
  progressDashActive: {
    backgroundColor: AppColors.primary,
  },
  slide: {
    paddingHorizontal: 8,
    paddingBottom: 24,
    justifyContent: 'flex-start',
  },
  imageWrap: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  image: {
    width: SCREEN_WIDTH - 80,
    height: 180,
    maxWidth: 280,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: AppColors.black,
    opacity: 0.85,
    lineHeight: 22,
    textAlign: 'center',
  },
  cta: {
    paddingTop: 24,
    paddingBottom: 16,
  },
  primaryButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.black,
  },
  or: {
    fontSize: 14,
    color: AppColors.gray,
    textAlign: 'center',
    marginVertical: 12,
  },
  outlineButton: {
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.black,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
