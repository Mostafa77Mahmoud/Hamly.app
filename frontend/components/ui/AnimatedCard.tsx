import React, { ReactNode, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, ViewProps, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface AnimatedCardProps extends ViewProps {
  children: ReactNode;
  onPress?: () => void;
  delay?: number;
  style?: ViewStyle;
  pressable?: boolean;
}

export default function AnimatedCard({
  children,
  onPress,
  delay = 0,
  style,
  pressable = true,
  ...restProps
}: AnimatedCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withSpring(0, {
        damping: 18,
        stiffness: 100,
      });
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const handlePressIn = () => {
    if (pressable && onPress) {
      scale.value = withSpring(0.98, {
        damping: 15,
        stiffness: 200,
      });
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handlePressOut = () => {
    if (pressable && onPress) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
    }
  };

  const handlePress = () => {
    if (pressable && onPress) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onPress();
    }
  };

  const containerStyle: ViewStyle[] = [
    styles.card,
    animatedStyle,
  ];

  if (style) {
    containerStyle.push(style);
  }

  const cardContent = (
    <Animated.View style={containerStyle} {...restProps}>
      {children}
    </Animated.View>
  );

  if (pressable && onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessible={true}
        accessibilityRole="button"
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...cardShadow,
  },
});
