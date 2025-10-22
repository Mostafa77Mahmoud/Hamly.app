import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AnimatedProgressBarProps {
  progress: number; // 0-100
  color?: string;
  backgroundColor?: string;
  height?: number;
  showPercentage?: boolean;
  delay?: number;
}

export default function AnimatedProgressBar({
  progress,
  color = '#E91E63',
  backgroundColor = '#F5F5F5',
  height = 12,
  showPercentage = true,
  delay = 0,
}: AnimatedProgressBarProps) {
  const progressValue = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      progressValue.value = withSpring(Math.min(Math.max(progress, 0), 100), {
        damping: 20,
        stiffness: 90,
      });
    }, delay);

    return () => clearTimeout(timeout);
  }, [progress, delay]);

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value}%`,
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <View
        style={[
          styles.progressBar,
          { backgroundColor, height, borderRadius: height / 2 },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: color,
              height,
              borderRadius: height / 2,
            },
            animatedProgressStyle,
          ]}
        />
      </View>
      {showPercentage && (
        <Text style={[styles.percentageText, { color }]}>
          {Math.round(progress)}%
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  progressBar: {
    width: '100%',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
});
