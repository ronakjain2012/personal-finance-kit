/**
 * Theme colors and fonts for MyIO. Align with tailwind.config.js (primary, black, gray, white).
 */

import { Platform } from 'react-native';

export const AppColors = {
  primary: '#ddf247',
  black: '#20272b',
  gray: '#545d63',
  white: '#ffffff',
} as const;

const tintColorLight = AppColors.primary;
const tintColorDark = AppColors.white;

export const Colors = {
  light: {
    text: AppColors.black,
    background: AppColors.white,
    tint: tintColorLight,
    icon: AppColors.gray,
    tabIconDefault: AppColors.gray,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: AppColors.white,
    background: AppColors.black,
    tint: tintColorDark,
    icon: AppColors.gray,
    tabIconDefault: AppColors.gray,
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
