
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { useIsRTL } from '@/utils/useIsRTL';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'large' | 'compact' | 'centered';
  spacing?: 'tight' | 'normal' | 'loose';
}

export default function PageTitle({ 
  title, 
  subtitle, 
  titleStyle, 
  subtitleStyle, 
  containerStyle,
  variant = 'default',
  spacing = 'normal'
}: PageTitleProps) {
  const isRTL = useIsRTL();
  
  const containerStyles = useMemo(() => [
    styles.container,
    styles[variant],
    styles[`${spacing}Spacing`],
    isRTL && styles.rtlContainer,
    containerStyle
  ], [variant, spacing, isRTL, containerStyle]);
  
  const titleStyles = useMemo(() => [
    styles.title,
    styles[`${variant}Title`],
    isRTL && styles.rtlTitle,
    titleStyle
  ], [variant, isRTL, titleStyle]);
  
  const subtitleStyles = useMemo(() => [
    styles.subtitle,
    styles[`${variant}Subtitle`],
    isRTL && styles.rtlSubtitle,
    subtitleStyle
  ], [variant, isRTL, subtitleStyle]);
  
  return ( <View style={containerStyles}> <Text style={titleStyles} accessibilityRole="header"> {title} </Text> {subtitle && ( <Text style={subtitleStyles} accessibilityRole="text"> {subtitle} </Text> )} </View> );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'flex-start',
  },
  
  rtlContainer: {
    alignItems: 'flex-end',
    // RTL handled by textAlign and flexDirection
  },
  
  // Variants
  default: {
    paddingVertical: 16,
  },
  
  large: {
    paddingVertical: 24,
  },
  
  compact: {
    paddingVertical: 8,
  },
  
  centered: {
    alignItems: 'center',
    textAlign: 'center',
  },
  
  // Spacing variants
  tightSpacing: {
    paddingVertical: 8,
  },
  
  normalSpacing: {
    paddingVertical: 16,
  },
  
  looseSpacing: {
    paddingVertical: 24,
  },
  
  // Base title styles
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 34,
    marginBottom: 4,
    textAlign: 'left',
  },
  
  rtlTitle: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  
  // Title variants
  defaultTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  
  largeTitle: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
  },
  
  compactTitle: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 28,
  },
  
  centeredTitle: {
    textAlign: 'center',
  },
  
  // Base subtitle styles
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
    textAlign: 'left',
  },
  
  rtlSubtitle: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  
  // Subtitle variants
  defaultSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  
  largeSubtitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  
  compactSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  
  centeredSubtitle: {
    textAlign: 'center',
  },
});
