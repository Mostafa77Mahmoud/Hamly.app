
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Sparkles, Heart, Shield, Activity } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  withDelay,
} from 'react-native-reanimated';
import { COLORS } from '@/utils/modernStyles';
import OnboardingPage from '../components/OnboardingPage';
import { t } from '@/utils/i18n';
import { getWelcomeIconSize, getOptimalIconSize } from '@/utils/iconSizes';
import { scale } from '@/utils/responsive';

export default function GetStartedScreen() {
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const sparkleRotate = useSharedValue(0);

  // استخدام الدالة الجديدة للحصول على أحجام مثالية
  const circleSize = getWelcomeIconSize('mainCircle') * 0.73;
  const centerIconSize = getOptimalIconSize('xlarge') * 0.75;
  const orbitIconSize = getOptimalIconSize('medium') * 0.75;
  const sparkleSize = getOptimalIconSize('small');
  const iconBgSize = getOptimalIconSize('large') * 0.85;

  React.useEffect(() => {
    scale1.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1.12, { duration: 1100 }),
          withTiming(1, { duration: 1100 })
        ),
        -1,
        false
      )
    );

    scale2.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1.12, { duration: 1100 }),
          withTiming(1, { duration: 1100 })
        ),
        -1,
        false
      )
    );

    scale3.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(1.12, { duration: 1100 }),
          withTiming(1, { duration: 1100 })
        ),
        -1,
        false
      )
    );

    sparkleRotate.value = withDelay(
      300,
      withRepeat(
        withTiming(360, { duration: 3500 }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotate.value}deg` }],
  }));

  const pageTitle = t('onboardingFinalTitle');
  const pageSubtitle = t('onboardingFinalSubtitle');
  const pageDescription = t('onboardingFinalDescription');

  console.log('[GET_STARTED_SCREEN] Rendering with:', {
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
          <View style={[styles.mainCircle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]}>
            <View style={[styles.centerIconBg, { width: circleSize * 0.46, height: circleSize * 0.46, borderRadius: circleSize * 0.23 }]}>
              <Sparkles 
                size={centerIconSize} 
                color={COLORS.primary} 
                fill={COLORS.primaryLight} 
                strokeWidth={2.5} 
              />
            </View>

            <Animated.View style={[styles.orbitIcon, styles.orbitIcon1, animatedStyle1]}>
              <View style={[styles.iconBg, { width: iconBgSize, height: iconBgSize, borderRadius: iconBgSize / 2 }]}>
                <Heart size={orbitIconSize} color={COLORS.primary} fill={COLORS.white} strokeWidth={2.5} />
              </View>
            </Animated.View>

            <Animated.View style={[styles.orbitIcon, styles.orbitIcon2, animatedStyle2]}>
              <View style={[styles.iconBg, { width: iconBgSize, height: iconBgSize, borderRadius: iconBgSize / 2 }]}>
                <Shield size={orbitIconSize} color={COLORS.success} fill={COLORS.white} strokeWidth={2.5} />
              </View>
            </Animated.View>

            <Animated.View style={[styles.orbitIcon, styles.orbitIcon3, animatedStyle3]}>
              <View style={[styles.iconBg, { width: iconBgSize, height: iconBgSize, borderRadius: iconBgSize / 2 }]}>
                <Activity size={orbitIconSize} color={COLORS.accent} fill={COLORS.white} strokeWidth={2.5} />
              </View>
            </Animated.View>
          </View>

          <Animated.View style={[styles.decorSparkle, styles.decorSparkle1, sparkleStyle]}>
            <Sparkles size={sparkleSize} color={COLORS.primary} fill={COLORS.primaryLight} />
          </Animated.View>
          <Animated.View style={[styles.decorSparkle, styles.decorSparkle2, sparkleStyle]}>
            <Sparkles size={sparkleSize * 0.86} color={COLORS.accent} fill={COLORS.accentLight} />
          </Animated.View>
          <Animated.View style={[styles.decorSparkle, styles.decorSparkle3, sparkleStyle]}>
            <Sparkles size={sparkleSize * 0.79} color={COLORS.success} fill={COLORS.successLight} />
          </Animated.View>
        </View>
      }
      gradientColors={[COLORS.white, '#FFF5F8', COLORS.surfaceLight]}
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
  mainCircle: {
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 14,
    position: 'relative',
  },
  centerIconBg: {
    backgroundColor: '#FFF5F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitIcon: {
    position: 'absolute',
  },
  orbitIcon1: {
    top: -15,
    right: 35,
  },
  orbitIcon2: {
    bottom: 15,
    left: -15,
  },
  orbitIcon3: {
    top: 55,
    left: -25,
  },
  iconBg: {
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  decorSparkle: {
    position: 'absolute',
  },
  decorSparkle1: {
    top: 25,
    left: 35,
  },
  decorSparkle2: {
    bottom: 55,
    right: 25,
  },
  decorSparkle3: {
    bottom: 75,
    left: 55,
  },
});
