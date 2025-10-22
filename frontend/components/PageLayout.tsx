
import React, { ReactNode, useMemo } from 'react';
import { View, ViewStyle, StyleSheet, ScrollView, Platform } from 'react-native';
import { useIsRTL } from '@/utils/useIsRTL';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PageLayoutProps {
  children: ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  scrollable?: boolean;
  variant?: 'default' | 'fullscreen' | 'padded' | 'centered';
  safeArea?: boolean;
  backgroundColor?: string;
}

export default function PageLayout({ 
  children, 
  style, 
  contentStyle,
  scrollable = true,
  variant = 'default',
  safeArea = true,
  backgroundColor = '#FFFFFF'
}: PageLayoutProps) {
  const isRTL = useIsRTL();
  const insets = useSafeAreaInsets();
  
  const containerStyles = useMemo(() => [
    styles.container,
    styles[variant],
    isRTL && styles.rtlContainer,
    safeArea && {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    { backgroundColor },
    style
  ], [variant, isRTL, safeArea, insets, backgroundColor, style]);
  
  const contentStyles = useMemo(() => [
    styles.content,
    styles[`${variant}Content`],
    isRTL && styles.rtlContent,
    contentStyle
  ], [variant, isRTL, contentStyle]);

  const Container = scrollable ? ScrollView : View;
  const scrollViewProps = scrollable ? {
    contentContainerStyle: contentStyles,
    showsVerticalScrollIndicator: false,
    showsHorizontalScrollIndicator: false,
    keyboardShouldPersistTaps: 'handled' as const,
    bounces: Platform.OS === 'ios',
  } : {};

  return ( <View style={containerStyles}> <Container 
        style={scrollable ? styles.scrollContainer : contentStyles}
        {...scrollViewProps}
      > {scrollable ? ( <View style={contentStyles}> {children} </View> ) : (
          children
        )} </Container> </View> );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  
  rtlContainer: {
    // RTL handled by flexDirection and alignItems
  },
  
  scrollContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  
  content: {
    flex: 1,
    width: '100%',
  },
  
  rtlContent: {
    alignItems: 'flex-end',
  },
  
  // Variants
  default: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    width: '100%',
  },
  
  defaultContent: {
    paddingHorizontal: 0,
    paddingVertical: 16,
    flex: 1,
    width: '100%',
  },
  
  fullscreen: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    width: '100%',
  },
  
  fullscreenContent: {
    padding: 0,
    flex: 1,
    width: '100%',
  },
  
  padded: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    width: '100%',
  },
  
  paddedContent: {
    padding: 24,
    flex: 1,
    width: '100%',
  },
  
  centered: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  
  centeredContent: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
});
