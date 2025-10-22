import React, { ReactNode, useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

interface SectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  style?: ViewStyle;
  delay?: number;
  variant?: 'default' | 'card' | 'flat';
}

export default function Section({
  title,
  subtitle,
  children,
  style,
  delay = 0,
  variant = 'card',
}: SectionProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
      });
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  const getContainerStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.container];
    
    if (variant === 'card') {
      baseStyle.push(styles.containerCard as ViewStyle);
    } else if (variant === 'flat') {
      baseStyle.push(styles.containerFlat as ViewStyle);
    }

    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  return (
    <Animated.View style={[getContainerStyle(), animatedStyle]}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
}

const cardShadow = Platform.OS === 'web'
  ? { boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }
  : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    };

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  containerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    ...cardShadow,
  },
  containerFlat: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  content: {
    width: '100%',
  },
});
