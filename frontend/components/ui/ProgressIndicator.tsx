import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

interface ProgressIndicatorProps {
  currentWeek: number;
  totalWeeks?: number;
  label?: string;
  showPercentage?: boolean;
}

export default function ProgressIndicator({
  currentWeek,
  totalWeeks = 40,
  label,
  showPercentage = true,
}: ProgressIndicatorProps) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(0.95);

  const percentage = Math.min((currentWeek / totalWeeks) * 100, 100);

  useEffect(() => {
    progress.value = withTiming(percentage / 100, {
      duration: 1200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
    });
  }, [percentage]);

  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.infoRow}>
        <Text style={styles.weekText}>
          الأسبوع {currentWeek} من {totalWeeks}
        </Text>
        {showPercentage && (
          <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
        )}
      </View>
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBar, progressBarStyle]} />
        <View style={styles.progressGradientOverlay} />
      </View>
    </Animated.View>
  );
}

const progressBarShadow = Platform.OS === 'web'
  ? { boxShadow: '0 0 4px rgba(233, 30, 99, 0.4)' }
  : {
      shadowColor: '#E91E63',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
    };

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weekText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E91E63',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#E91E63',
    borderRadius: 6,
    ...progressBarShadow,
  },
  progressGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
  },
});
