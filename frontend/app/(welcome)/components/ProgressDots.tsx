import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { COLORS } from '@/utils/modernStyles';

interface ProgressDotsProps {
  count: number;
  activeIndex: number;
}

export default function ProgressDots({ count, activeIndex }: ProgressDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <Dot key={index} active={index === activeIndex} />
      ))}
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = active
      ? withSpring(1.2, { damping: 15, stiffness: 150 })
      : withSpring(1, { damping: 15, stiffness: 150 });

    const opacity = active
      ? withSpring(1, { damping: 15, stiffness: 150 })
      : withSpring(0.3, { damping: 15, stiffness: 150 });

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});
