import { Dimensions, Platform } from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { RFValue } from 'react-native-responsive-fontsize';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MOBILE_BREAKPOINT = 768;
export const isWeb = Platform.OS === 'web';
const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

export const isSmallScreen = () => SCREEN_WIDTH < MOBILE_BREAKPOINT;

export const isMobileDevice = () => isMobile;

export const isWebPlatform = () => isWeb;

export const responsiveWidth = (percentage: number): number => {
  if (isWeb && SCREEN_WIDTH >= MOBILE_BREAKPOINT) {
    return SCREEN_WIDTH * (percentage / 100);
  }
  return wp(percentage);
};

export const responsiveHeight = (percentage: number): number => {
  if (isWeb && SCREEN_WIDTH >= MOBILE_BREAKPOINT) {
    return SCREEN_HEIGHT * (percentage / 100);
  }
  return hp(percentage);
};

export const responsiveFontSize = (size: number): number => {
  if (isWeb && SCREEN_WIDTH >= MOBILE_BREAKPOINT) {
    return size;
  }
  // تصغير الخطوط للشاشات الصغيرة جداً
  if (SCREEN_WIDTH < 375) {
    return RFValue(size * 0.85, SCREEN_HEIGHT);
  }
  return RFValue(size, SCREEN_HEIGHT);
};

export const responsiveIconSize = (defaultSize: number): number => {
  if (isWeb && SCREEN_WIDTH >= MOBILE_BREAKPOINT) {
    return defaultSize;
  }

  if (SCREEN_WIDTH < 375) {
    return defaultSize * 0.7;
  } else if (SCREEN_WIDTH < 414) {
    return defaultSize * 0.8;
  }
  return defaultSize * 0.9;
};

export const platformSelect = <T,>(options: {
  web?: T;
  mobile?: T;
  default: T;
}): T => {
  if (isWeb && SCREEN_WIDTH >= MOBILE_BREAKPOINT && options.web !== undefined) {
    return options.web;
  }
  if (isMobile && options.mobile !== undefined) {
    return options.mobile;
  }
  return options.default;
};

export const getResponsivePadding = (basePadding: number): number => {
  if (isWeb && SCREEN_WIDTH >= MOBILE_BREAKPOINT) {
    return basePadding;
  }
  return basePadding * (SCREEN_WIDTH / 375);
};

export const getResponsiveMargin = (baseMargin: number): number => {
  if (isWeb && SCREEN_WIDTH >= MOBILE_BREAKPOINT) {
    return baseMargin;
  }
  return baseMargin * (SCREEN_WIDTH / 375);
};

export const getScreenDimensions = () => ({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: isSmallScreen(),
  isMobile: isMobileDevice(),
  isWeb: isWebPlatform(),
});

export const scale = (size: number): number => {
  const scale = SCREEN_WIDTH / 375;
  return Math.round(size * scale);
};

export const verticalScale = (size: number): number => {
  const scale = SCREEN_HEIGHT / 812;
  return Math.round(size * scale);
};

export const moderateScale = (size: number, factor: number = 0.5): number => {
  return Math.round(size + (scale(size) - size) * factor);
};

// Additional utility exports for compatibility
export const isSmallDevice = SCREEN_WIDTH < 375;
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 768;
export const isTablet = SCREEN_WIDTH >= 768;

export const getIconSize = (baseSize: number = 24) => {
  return responsiveIconSize(baseSize);
};

export const getSpacing = (base: number = 16) => {
  if (isWeb && SCREEN_WIDTH >= MOBILE_BREAKPOINT) return base;
  if (SCREEN_WIDTH < 375) return base * 0.75;
  return base;
};

export const getButtonHeight = () => {
  if (isWeb && SCREEN_WIDTH >= MOBILE_BREAKPOINT) return 48;
  if (SCREEN_WIDTH < 375) return 44;
  return 48;
};

export const createResponsiveStyle = <T extends Record<string, any>>(
  webStyle: T,
  mobileStyle: Partial<T>
): T => {
  return isWeb && SCREEN_WIDTH >= MOBILE_BREAKPOINT ? webStyle : { ...webStyle, ...mobileStyle };
};

export const SCREEN_DIMENSIONS = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};