
import React from 'react';
import { StyleSheet, ViewStyle, TextStyle, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { isRTL } from './i18n';

// Get device dimensions for React Native native calculations
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// RTL-aware container styles
export const rtlContainerStyles = StyleSheet.create({
  row: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
  },
  rowReverse: {
    flexDirection: isRTL() ? 'row' : 'row-reverse',
  },
  alignStart: {
    alignItems: isRTL() ? 'flex-end' : 'flex-start',
  },
  alignEnd: {
    alignItems: isRTL() ? 'flex-start' : 'flex-end',
  },
  justifyStart: {
    justifyContent: isRTL() ? 'flex-end' : 'flex-start',
  },
  justifyEnd: {
    justifyContent: isRTL() ? 'flex-start' : 'flex-end',
  },
  justifyBetween: {
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardRow: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  column: {
    flexDirection: 'column',
  },
  pageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: isRTL() ? 'flex-end' : 'flex-start',
  },
  sectionContainer: {
    width: '100%',
    flex: 1,
    alignItems: isRTL() ? 'flex-end' : 'flex-start',
  },
  titleContainer: {
    width: '100%',
    alignItems: isRTL() ? 'flex-end' : 'flex-start',
    paddingHorizontal: 20,
  },
});

// RTL-aware text styles with proper direction handling
export const rtlTextStyles = StyleSheet.create({
  text: {
    textAlign: isRTL() ? 'right' : 'left',
    writingDirection: isRTL() ? 'rtl' : 'ltr',
    width: '100%',
  },
  title: {
    textAlign: isRTL() ? 'right' : 'left',
    writingDirection: isRTL() ? 'rtl' : 'ltr',
    width: '100%',
  },
  subtitle: {
    textAlign: isRTL() ? 'right' : 'left',
    writingDirection: isRTL() ? 'rtl' : 'ltr',
    width: '100%',
  },
  center: {
    textAlign: 'center',
    writingDirection: isRTL() ? 'rtl' : 'ltr',
    width: '100%',
  },
  pageTitle: {
    textAlign: isRTL() ? 'right' : 'left',
    writingDirection: isRTL() ? 'rtl' : 'ltr',
    width: '100%',
    alignSelf: isRTL() ? 'flex-end' : 'flex-start',
  },
  pageSubtitle: {
    textAlign: isRTL() ? 'right' : 'left',
    writingDirection: isRTL() ? 'rtl' : 'ltr',
    width: '100%',
    alignSelf: isRTL() ? 'flex-end' : 'flex-start',
  },
});

// RTL-aware margin and padding
export const rtlSpacingStyles = StyleSheet.create({
  marginStart: {
    marginLeft: isRTL() ? 0 : 8,
    marginRight: isRTL() ? 8 : 0,
  },
  marginEnd: {
    marginLeft: isRTL() ? 8 : 0,
    marginRight: isRTL() ? 0 : 8,
  },
  paddingStart: {
    paddingLeft: isRTL() ? 0 : 16,
    paddingRight: isRTL() ? 16 : 0,
  },
  paddingEnd: {
    paddingLeft: isRTL() ? 16 : 0,
    paddingRight: isRTL() ? 0 : 16,
  },
  marginStartSmall: {
    marginLeft: isRTL() ? 0 : 4,
    marginRight: isRTL() ? 4 : 0,
  },
  marginEndSmall: {
    marginLeft: isRTL() ? 4 : 0,
    marginRight: isRTL() ? 0 : 4,
  },
  marginStartMedium: {
    marginLeft: isRTL() ? 0 : 12,
    marginRight: isRTL() ? 12 : 0,
  },
  marginEndMedium: {
    marginLeft: isRTL() ? 12 : 0,
    marginRight: isRTL() ? 0 : 12,
  },
});

// Helper function to get RTL-aware icon name string
export const getDirectionalIconName = (iconName: string): string => {
  const iconMap: { [key: string]: string } = {
    'chevron-left': isRTL() ? 'chevron-right' : 'chevron-left',
    'chevron-right': isRTL() ? 'chevron-left' : 'chevron-right',
    'arrow-back': isRTL() ? 'arrow-forward' : 'arrow-back',
    'arrow-forward': isRTL() ? 'arrow-back' : 'arrow-forward',
    'arrow-left': isRTL() ? 'arrow-right' : 'arrow-left',
    'arrow-right': isRTL() ? 'arrow-left' : 'arrow-right',
  };

  return iconMap[iconName] || iconName;
};

// Fixed getDirectionalIcon function to return proper React element
export const getDirectionalIcon = (
  iconName: string, 
  size: number = 24, 
  color: string = '#000000'
): React.ReactElement => {
  const finalIconName = getDirectionalIconName(iconName);
  
  return React.createElement(Icon, {
    name: finalIconName,
    size: size,
    color: color,
  });
};

// Re-export the new getDirectionalIcon function from utils/icons.tsx for compatibility
export { getDirectionalIcon as getDirectionalIconNew } from './icons';

// Helper function for RTL-aware positioning
export const getRTLStyle = (
  ltrStyle: ViewStyle | TextStyle, 
  rtlStyle: ViewStyle | TextStyle
): ViewStyle | TextStyle => {
  return isRTL() ? rtlStyle : ltrStyle;
};

// RTL-aware flex positioning
export const rtlFlexStyles = StyleSheet.create({
  container: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
  },
  headerContainer: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionContainer: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
});
