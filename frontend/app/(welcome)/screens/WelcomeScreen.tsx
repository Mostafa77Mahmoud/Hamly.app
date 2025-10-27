
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Heart } from 'lucide-react-native';
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

export default function WelcomeScreen() {
  const scaleAnim = useSharedValue(1);
  
  // استخدام الدالة الجديدة للحصول على أحجام مثالية
  const iconSize = getWelcomeIconSize('mainIcon');
  const circleSize = getWelcomeIconSize('mainCircle');
  const decorSize = getOptimalIconSize('large');

  React.useEffect(() => {
    scaleAnim.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1200 }),
          withTiming(1, { duration: 1200 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const pageTitle = t('onboardingWelcomeTitle');
  const pageSubtitle = t('onboardingWelcomeSubtitle');
  const pageDescription = t('onboardingWelcomeDescription');

  console.log('[WELCOME_SCREEN] Rendering with:', {
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
          <View style={[styles.outerCircle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]}>
            <View style={[styles.middleCircle, { width: circleSize * 0.79, height: circleSize * 0.79, borderRadius: circleSize * 0.39 }]}>
              <View style={[styles.innerCircle, { width: circleSize * 0.57, height: circleSize * 0.57, borderRadius: circleSize * 0.29 }]}>
                <Animated.View style={animatedStyle}>
                  <Heart 
                    size={iconSize} 
                    color={COLORS.primary} 
                    fill={COLORS.primaryLight} 
                    strokeWidth={2.5} 
                  />
                </Animated.View>
              </View>
            </View>
          </View>
          
          <View style={[styles.decorCircle, styles.decorCircle1, { width: decorSize * 1.2, height: decorSize * 1.2 }]} />
          <View style={[styles.decorCircle, styles.decorCircle2, { width: decorSize * 0.9, height: decorSize * 0.9 }]} />
          <View style={[styles.decorCircle, styles.decorCircle3, { width: decorSize, height: decorSize }]} />
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
  outerCircle: {
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  middleCircle: {
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.3,
  },
  decorCircle1: {
    top: 10,
    right: 20,
  },
  decorCircle2: {
    bottom: 30,
    left: 30,
  },
  decorCircle3: {
    top: 40,
    left: 10,
  },
});
