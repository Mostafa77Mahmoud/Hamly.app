
import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// تحديد نوع الجهاز
const MOBILE_BREAKPOINT = 768;
export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
export const isSmallScreen = SCREEN_WIDTH < MOBILE_BREAKPOINT;

// أحجام الأيقونات المثالية لكل منصة
export const ICON_SIZES = {
  // للموبايل والأجهزة الصغيرة
  mobile: {
    tiny: 16,
    small: 24,
    medium: 32,
    large: 48,
    xlarge: 64,
    xxlarge: 80,
    hero: 100,
  },
  // للويب والشاشات الكبيرة
  desktop: {
    tiny: 20,
    small: 28,
    medium: 40,
    large: 60,
    xlarge: 80,
    xxlarge: 100,
    hero: 120,
  },
};

/**
 * دالة للحصول على الحجم المثالي للأيقونة حسب المنصة
 */
export const getOptimalIconSize = (
  desiredSize: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'hero'
): number => {
  // تحديد المنصة
  const isDesktop = isWeb && SCREEN_WIDTH >= MOBILE_BREAKPOINT;
  
  // إرجاع الحجم المناسب
  return isDesktop 
    ? ICON_SIZES.desktop[desiredSize] 
    : ICON_SIZES.mobile[desiredSize];
};

/**
 * دالة للحصول على حجم مخصص مع التكيف التلقائي
 */
export const getAdaptiveIconSize = (
  mobileSize: number,
  desktopSize: number
): number => {
  const isDesktop = isWeb && SCREEN_WIDTH >= MOBILE_BREAKPOINT;
  
  if (isDesktop) {
    return desktopSize;
  }
  
  // للأجهزة الصغيرة جداً، نقلل الحجم قليلاً
  if (SCREEN_WIDTH < 375) {
    return mobileSize * 0.85;
  }
  
  return mobileSize;
};

/**
 * دالة للحصول على حجم دائري (للدوائر حول الأيقونات)
 */
export const getCircleSize = (iconSize: number, padding: number = 2): number => {
  return iconSize * padding;
};

/**
 * أحجام محددة مسبقاً لصفحات الترحيب
 */
export const WELCOME_ICON_SIZES = {
  // الأيقونة الرئيسية في المنتصف
  mainIcon: {
    mobile: 80,
    desktop: 100,
  },
  // الدائرة المحيطة
  mainCircle: {
    mobile: 240,
    desktop: 300,
  },
  // أيقونات الزينة
  decorIcon: {
    mobile: 20,
    desktop: 25,
  },
  // أيقونات ثانوية
  secondaryIcon: {
    mobile: 50,
    desktop: 70,
  },
  // عناصر إضافية
  checkmark: {
    mobile: 50,
    desktop: 60,
  },
  document: {
    mobile: 180,
    desktop: 250,
  },
  pill: {
    mobile: 50,
    desktop: 60,
  },
  shield: {
    mobile: 120,
    desktop: 140,
  },
};

/**
 * دالة للحصول على حجم من WELCOME_ICON_SIZES
 */
export const getWelcomeIconSize = (
  key: keyof typeof WELCOME_ICON_SIZES
): number => {
  const isDesktop = isWeb && SCREEN_WIDTH >= MOBILE_BREAKPOINT;
  const sizes = WELCOME_ICON_SIZES[key];
  
  if (isDesktop) {
    return sizes.desktop;
  }
  
  // تعديل تلقائي للشاشات الصغيرة جداً
  if (SCREEN_WIDTH < 375) {
    return Math.floor(sizes.mobile * 0.85);
  }
  
  return sizes.mobile;
};

/**
 * دالة لحساب حجم responsive بناءً على نسبة من الشاشة
 */
export const getResponsiveIconSize = (
  baseSize: number,
  maxWidthPercent: number = 0.2
): number => {
  const isDesktop = isWeb && SCREEN_WIDTH >= MOBILE_BREAKPOINT;
  
  if (isDesktop) {
    return baseSize;
  }
  
  // حساب الحد الأقصى بناءً على عرض الشاشة
  const maxSize = SCREEN_WIDTH * maxWidthPercent;
  
  // إرجاع الأصغر بين الحجم المطلوب والحد الأقصى
  return Math.min(baseSize, maxSize);
};

/**
 * معلومات الجهاز الحالي
 */
export const getDeviceInfo = () => ({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isWeb,
  isMobile,
  isSmallScreen,
  isDesktop: isWeb && SCREEN_WIDTH >= MOBILE_BREAKPOINT,
  platform: Platform.OS,
});
