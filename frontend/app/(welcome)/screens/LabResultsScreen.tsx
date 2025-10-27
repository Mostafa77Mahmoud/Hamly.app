import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { CheckCircle, FileBarChart } from 'lucide-react-native';
import Animated, { 
  FadeInRight,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withDelay,
} from 'react-native-reanimated';
import { COLORS } from '@/utils/modernStyles';
import OnboardingPage from '../components/OnboardingPage';
import { t } from '@/utils/i18n';
import { getWelcomeIconSize, getOptimalIconSize } from '@/utils/iconSizes';
import { scale } from '@/utils/responsive';

export default function LabResultsScreen() {
  const translateY = useSharedValue(0);

  // استخدام الدالة الجديدة للحصول على أحجام مثالية
  const docWidth = getWelcomeIconSize('document');
  const iconSize = getWelcomeIconSize('secondaryIcon');
  const checkSize = getWelcomeIconSize('checkmark');
  const decorSize = getOptimalIconSize('large');

  React.useEffect(() => {
    translateY.value = withDelay(
      300,
      withRepeat(
        withTiming(-12, { duration: 1800 }),
        -1,
        true
      )
    );
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const pageTitle = t('onboardingLabsTitle');
  const pageSubtitle = t('onboardingLabsSubtitle');
  const pageDescription = t('onboardingLabsDescription');

  console.log('[LAB_RESULTS_SCREEN] Rendering with:', {
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
          <Animated.View style={[styles.documentWrapper, floatingStyle]}>
            <View style={[styles.document, { width: docWidth, height: docWidth * 1.3 }]}>
              <View style={styles.documentHeader}>
                <FileBarChart size={iconSize} color={COLORS.info} strokeWidth={2.5} />
              </View>

              <View style={styles.contentLines}>
                <View style={styles.line1} />
                <View style={styles.line2} />
                <View style={styles.line3} />
                <View style={styles.line4} />
              </View>
            </View>

            <Animated.View 
              entering={Platform.OS !== 'web' ? FadeInRight.delay(1000).duration(800).springify() : undefined}
              style={styles.checkmark}
            >
              <View style={styles.checkmarkBg}>
                <CheckCircle 
                  size={checkSize} 
                  color={COLORS.success} 
                  fill={COLORS.white} 
                  strokeWidth={3} 
                />
              </View>
            </Animated.View>
          </Animated.View>

          <View style={[styles.decorBox, styles.decorBox1, { width: decorSize, height: decorSize }]} />
          <View style={[styles.decorBox, styles.decorBox2, { width: decorSize * 0.75, height: decorSize * 0.75 }]} />
        </View>
      }
      gradientColors={[COLORS.white, COLORS.infoLight]}
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
  documentWrapper: {
    position: 'relative',
  },
  document: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: scale(32),
    paddingTop: scale(36),
    paddingBottom: scale(36),
    justifyContent: 'flex-start',
    alignItems: 'center',
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  documentHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  contentLines: {
    width: '100%',
    marginTop: 24,
  },
  line1: {
    width: '100%',
    height: 10,
    backgroundColor: COLORS.infoLight,
    borderRadius: 5,
    marginBottom: 12,
  },
  line2: {
    width: '85%',
    height: 10,
    backgroundColor: COLORS.gray200,
    borderRadius: 5,
    marginBottom: 12,
  },
  line3: {
    width: '95%',
    height: 10,
    backgroundColor: COLORS.gray200,
    borderRadius: 5,
    marginBottom: 12,
  },
  line4: {
    width: '75%',
    height: 10,
    backgroundColor: COLORS.gray200,
    borderRadius: 5,
  },
  checkmark: {
    position: 'absolute',
    right: -15,
    top: -10,
  },
  checkmarkBg: {
    backgroundColor: COLORS.white,
    borderRadius: 30,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  decorBox: {
    position: 'absolute',
    borderRadius: 16,
    backgroundColor: COLORS.accentLight,
    opacity: 0.4,
  },
  decorBox1: {
    top: 20,
    left: 15,
  },
  decorBox2: {
    bottom: 40,
    right: 30,
  },
});