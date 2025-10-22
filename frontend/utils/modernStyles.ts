import { StyleSheet, TextStyle, ViewStyle, Dimensions } from 'react-native';
import { useIsRTL } from './useIsRTL';
import { createShadowStyle } from './shadowStyles';

// Get device dimensions for React Native native calculations
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Design system constants - Updated for professional health app
export const COLORS = {
  // Primary brand colors - نعومة أكثر للحوامل
  primary: '#D81B60', // وردي أكثر نعومة
  primaryLight: '#F8BBD9',
  primaryDark: '#AD1457',

  // Accent colors - ألوان هادئة
  accent: '#7986CB', // بنفسجي هادئ
  accentLight: '#E8EAF6',

  // Status colors - ألوان ناعمة
  success: '#66BB6A',
  successLight: '#E8F5E8',
  warning: '#FFA726',
  warningLight: '#FFF8E1',
  error: '#EF5350',
  errorLight: '#FFEBEE',
  info: '#42A5F5',
  infoLight: '#E3F2FD',

  // Neutral colors - درجات أكثر نعومة
  white: '#FFFFFF',
  black: '#1A1A1A',
  gray50: '#FAFAFA',
  gray100: '#F7F7F7',
  gray200: '#F0F0F0',
  gray300: '#E8E8E8',
  gray400: '#CCCCCC',
  gray500: '#999999',
  gray600: '#666666',
  gray700: '#4A4A4A',
  gray800: '#333333',
  gray900: '#1A1A1A',

  // Surface colors - خلفيات ناعمة
  surface: '#FFFFFF',
  surfaceLight: '#FAFAFA',
  background: '#F5F7FA',
  border: '#E8E8E8',
  borderLight: '#F0F0F0',

  // Text colors - نصوص أكثر وضوحاً
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textDisabled: '#CCCCCC',
  textInverse: '#FFFFFF',

  // Pregnancy-specific colors
  pregnancyPrimary: '#D81B60',
  pregnancySecondary: '#7986CB',
  pregnancyAccent: '#FFB74D',
  healthGreen: '#66BB6A',
  warningOrange: '#FFA726',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

// Screen dimensions for responsive design
export const SCREEN = {
  width: screenWidth,
  height: screenHeight,
  padding: 16,
  paddingHorizontal: 16,
  paddingVertical: 12,
};

export const TYPOGRAPHY = {
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,

  // Font weights
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  button: '500' as const,

  // Line heights
  tight: 1.25,
  snug: 1.375,
  lineHeightNormal: 1.5,
  relaxed: 1.625,
  loose: 2,

  // Text styles (for component compatibility)
  body: 16,
  caption: 12,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
};

export const SHADOWS = {
  sm: createShadowStyle({
    color: '#000',
    offset: { width: 0, height: 1 },
    opacity: 0.1,
    radius: 2,
    elevation: 2,
  }),
  md: createShadowStyle({
    color: '#000',
    offset: { width: 0, height: 2 },
    opacity: 0.15,
    radius: 4,
    elevation: 4,
  }),
  lg: createShadowStyle({
    color: '#000',
    offset: { width: 0, height: 4 },
    opacity: 0.2,
    radius: 8,
    elevation: 8,
  }),
};

/**
 * Common accessible styles for interactive elements
 */
export const ACCESSIBILITY_STYLES = StyleSheet.create({
  touchableOpacity: {
    minHeight: 44, // Minimum touch target size
    minWidth: 44,
  },

  focusable: {
    // Add visual focus indicators
    borderWidth: 2,
    borderColor: 'transparent',
  },

  focused: {
    borderColor: COLORS.primary,
    ...createShadowStyle({
      color: COLORS.primary,
      offset: { width: 0, height: 0 },
      opacity: 0.3,
      radius: 4,
      elevation: 4,
    }),
  },

  disabled: {
    opacity: 0.6,
  },
});

// Component-specific typography styles
export const COMPONENT_STYLES = StyleSheet.create({
  // Card styles
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    ...SHADOWS.sm,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  // Button styles
  button: {
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    ...ACCESSIBILITY_STYLES.touchableOpacity,
  },

  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },

  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Input styles
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textPrimary,
    minHeight: 44,
  },

  inputFocused: {
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },

  // Text styles
  heading1: {
    fontSize: TYPOGRAPHY['3xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY['3xl'] * TYPOGRAPHY.tight,
  } as TextStyle,

  heading2: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY['2xl'] * TYPOGRAPHY.tight,
  } as TextStyle,

  heading3: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.xl * TYPOGRAPHY.lineHeightNormal,
  } as TextStyle,

  body: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.normal,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.base * TYPOGRAPHY.lineHeightNormal,
  } as TextStyle,

  caption: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.normal,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.sm * TYPOGRAPHY.lineHeightNormal,
  } as TextStyle,

  // Layout styles - React Native native
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
  },

  fullScreenContainer: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: COLORS.background,
  },

  section: {
    paddingHorizontal: 0,
    paddingVertical: SPACING.md,
    width: '100%',
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: SPACING.md,
  },

  // List styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 56,
  },

  listItemContent: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },

  // Safety indicator styles
  safetyIndicator: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },

  safetyText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.white,
  } as TextStyle,
});

/**
 * Generate RTL-aware styles based on current language direction
 */
export function useLocalizedStyles() {
  const isRTL = useIsRTL();

  return {
    // Text alignment
    textAlign: (isRTL ? 'right' : 'left') as 'left' | 'right',
    textAlignOpposite: (isRTL ? 'left' : 'right') as 'left' | 'right',
    writingDirection: isRTL ? 'rtl' : 'ltr',

    // Flex direction
    row: isRTL ? 'row-reverse' : 'row',
    rowReverse: isRTL ? 'row' : 'row-reverse',

    // Margins and padding
    marginStart: (value: number) => ({ [isRTL ? 'marginRight' : 'marginLeft']: value }),
    marginEnd: (value: number) => ({ [isRTL ? 'marginLeft' : 'marginRight']: value }),
    paddingStart: (value: number) => ({ [isRTL ? 'paddingRight' : 'paddingLeft']: value }),
    paddingEnd: (value: number) => ({ [isRTL ? 'paddingLeft' : 'paddingRight']: value }),

    // Positioning
    start: (value: number) => ({ [isRTL ? 'right' : 'left']: value }),
    end: (value: number) => ({ [isRTL ? 'left' : 'right']: value }),

    // Container alignment
    alignStart: isRTL ? 'flex-end' : 'flex-start',
    alignEnd: isRTL ? 'flex-start' : 'flex-end',

    // Helper flags
    isRTL,
    isLTR: !isRTL,
  };
}

/**
 * Get safety category color and styles
 */
export function getSafetyStyles(category: 'A' | 'B' | 'C' | 'D' | 'X' | string) {
  const normalizedCategory = category.toUpperCase();

  let backgroundColor: string;
  let textColor = COLORS.white;

  switch (normalizedCategory) {
    case 'A':
      backgroundColor = COLORS.success;
      break;
    case 'B':
      backgroundColor = COLORS.info;
      break;
    case 'C':
      backgroundColor = COLORS.warning;
      break;
    case 'D':
      backgroundColor = COLORS.error;
      break;
    case 'X':
      backgroundColor = COLORS.black;
      break;
    default:
      backgroundColor = COLORS.info;
      break;
  }

  return {
    backgroundColor,
    color: textColor,
    container: {
      ...COMPONENT_STYLES.safetyIndicator,
      backgroundColor,
    },
    text: {
      ...COMPONENT_STYLES.safetyText,
      color: textColor,
    },
  };
}