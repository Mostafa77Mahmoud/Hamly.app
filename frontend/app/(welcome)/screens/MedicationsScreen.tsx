import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Pill, Shield } from 'lucide-react-native';
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

export default function MedicationsScreen() {
  const rotate = useSharedValue(0);
  const scaleAnim = useSharedValue(1);

  // استخدام الدالة الجديدة للحصول على أحجام مثالية
  const shieldSize = getWelcomeIconSize('shield');
  const pillSize = getWelcomeIconSize('pill');
  const pillBgSize = pillSize * 1.5;
  const decorSize = getOptimalIconSize('medium');

  React.useEffect(() => {
    rotate.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 1200 }),
          withTiming(8, { duration: 1200 })
        ),
        -1,
        true
      )
    );

    scaleAnim.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1200 }),
          withTiming(1, { duration: 1200 })
        ),
        -1,
        false
      )
    );
  }, []);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotate.value}deg` },
      { scale: scaleAnim.value },
    ],
  }));

  const pageTitle = t('onboardingMedsTitle');
  const pageSubtitle = t('onboardingMedsSubtitle');
  const pageDescription = t('onboardingMedsDescription');

  console.log('[MEDICATIONS_SCREEN] Rendering with:', {
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
          <View style={styles.shieldWrapper}>
            <Shield 
              size={shieldSize} 
              color={COLORS.success} 
              fill={COLORS.successLight} 
              strokeWidth={2.5} 
            />

            <Animated.View style={[styles.pillContainer, pillStyle]}>
              <View style={[styles.pillBg, { width: pillBgSize, height: pillBgSize, borderRadius: pillBgSize / 2 }]}>
                <Pill size={pillSize} color={COLORS.primary} strokeWidth={3} />
              </View>
            </Animated.View>
          </View>

          <View style={[styles.decorDot, styles.decorDot1, { width: decorSize, height: decorSize }]} />
          <View style={[styles.decorDot, styles.decorDot2, { width: decorSize * 0.7, height: decorSize * 0.7 }]} />
          <View style={[styles.decorDot, styles.decorDot3, { width: decorSize * 1.2, height: decorSize * 1.2 }]} />
          <View style={[styles.decorDot, styles.decorDot4, { width: decorSize * 0.9, height: decorSize * 0.9 }]} />
        </View>
      }
      gradientColors={[COLORS.white, COLORS.successLight]}
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
  shieldWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pillContainer: {
    position: 'absolute',
  },
  pillBg: {
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  decorDot: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: COLORS.primary,
    opacity: 0.25,
  },
  decorDot1: {
    top: 30,
    right: 50,
  },
  decorDot2: {
    top: 70,
    left: 40,
  },
  decorDot3: {
    bottom: 50,
    right: 35,
  },
  decorDot4: {
    bottom: 70,
    left: 60,
  },
});