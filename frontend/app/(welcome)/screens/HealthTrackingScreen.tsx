import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Activity, TrendingUp } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { COLORS } from '@/utils/modernStyles';
import OnboardingPage from '../components/OnboardingPage';
import { t } from '@/utils/i18n';
import { getWelcomeIconSize, getOptimalIconSize } from '@/utils/iconSizes';
import { scale } from '@/utils/responsive';

export default function HealthTrackingScreen() {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  // استخدام الدالة الجديدة للحصول على أحجام مثالية
  const iconSize = getWelcomeIconSize('mainIcon');
  const circleSize = getWelcomeIconSize('mainCircle');
  const barWidth = getOptimalIconSize('tiny');
  const decorSize = getOptimalIconSize('large');

  React.useEffect(() => {
    translateY.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 1400 }),
          withTiming(0, { duration: 1400 })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1400 }),
          withTiming(1, { duration: 1400 })
        ),
        -1,
        false
      )
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const pageTitle = t('onboardingHealthTitle');
  const pageSubtitle = t('onboardingHealthSubtitle');
  const pageDescription = t('onboardingHealthDescription');

  console.log('[HEALTH_TRACKING_SCREEN] Rendering with:', {
    title: pageTitle,
    subtitle: pageSubtitle,
    description: pageDescription,
  });

  return (
    <OnboardingPage
      title={pageTitle}
      subtitle={pageSubtitle}
      description={pageDescription}
      illustration={
        <View style={styles.container}>
          <View style={styles.chartWrapper}>
            <View style={[styles.chartBg, { width: circleSize, height: circleSize }]}>
              <Animated.View style={[styles.activityIcon, pulseStyle]}>
                <Activity size={iconSize} color={COLORS.primary} strokeWidth={3} />
              </Animated.View>

              <View style={[styles.barsContainer, { height: circleSize * 0.35 }]}>
                <View style={[styles.bar, { height: circleSize * 0.17, width: barWidth }]} />
                <View style={[styles.bar, { height: circleSize * 0.25, width: barWidth }, styles.bar2]} />
                <View style={[styles.bar, { height: circleSize * 0.35, width: barWidth }, styles.bar3]} />
                <View style={[styles.bar, { height: circleSize * 0.21, width: barWidth }, styles.bar4]} />
                <View style={[styles.bar, { height: circleSize * 0.29, width: barWidth }, styles.bar5]} />
              </View>
            </View>

            <View style={styles.trendWrapper}>
              <TrendingUp size={iconSize * 0.4} color={COLORS.success} strokeWidth={3} />
            </View>
          </View>

          <View style={[styles.decorLine, styles.decorLine1, { width: decorSize }]} />
          <View style={[styles.decorLine, styles.decorLine2, { width: decorSize * 0.75 }]} />
          <View style={[styles.decorLine, styles.decorLine3, { width: decorSize * 0.9 }]} />
        </View>
      }
      gradientColors={[COLORS.white, COLORS.warningLight]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  chartWrapper: {
    position: 'relative',
  },
  chartBg: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: scale(36),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  activityIcon: {
    marginBottom: scale(28),
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: scale(10),
  },
  bar: {
    backgroundColor: COLORS.primary,
    borderRadius: 9,
    opacity: 0.4,
  },
  bar2: {
    opacity: 0.6,
  },
  bar3: {
    opacity: 1,
  },
  bar4: {
    opacity: 0.5,
  },
  bar5: {
    opacity: 0.8,
  },
  trendWrapper: {
    position: 'absolute',
    top: -12,
    right: -12,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 10,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  decorLine: {
    position: 'absolute',
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    opacity: 0.35,
  },
  decorLine1: {
    top: 40,
    left: 25,
  },
  decorLine2: {
    bottom: 60,
    right: 45,
  },
  decorLine3: {
    bottom: 35,
    left: 35,
  },
});