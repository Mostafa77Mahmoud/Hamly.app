import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { t } from '@/utils/i18n';
import { COLORS, TYPOGRAPHY } from '@/utils/modernStyles';
import { rtlContainerStyles } from '@/utils/rtlStyles';
import { responsiveFontSize, getButtonHeight } from '@/utils/responsive';
import ProgressDots from './ProgressDots';

// Import screens directly
import WelcomeScreen from '../screens/WelcomeScreen';
import LabResultsScreen from '../screens/LabResultsScreen';
import MedicationsScreen from '../screens/MedicationsScreen';
import HealthTrackingScreen from '../screens/HealthTrackingScreen';
import GetStartedScreen from '../screens/GetStartedScreen';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const SCREENS = [
  WelcomeScreen,
  LabResultsScreen,
  MedicationsScreen,
  HealthTrackingScreen,
  GetStartedScreen,
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  console.debug('[ONBOARDING] Rendering screen index:', currentIndex);

  const goToNext = () => {
    console.debug('[ONBOARDING] Next button pressed. Current index:', currentIndex);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentIndex < SCREENS.length - 1) {
      const nextIndex = currentIndex + 1;
      console.debug('[ONBOARDING] Moving to index:', nextIndex);
      setCurrentIndex(nextIndex);
    } else {
      console.debug('[ONBOARDING] Last screen - completing onboarding');
      handleComplete();
    }
  };

  const handleSkip = async () => {
    console.debug('[ONBOARDING] Skip button pressed');

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await onComplete();
  };

  const handleComplete = async () => {
    console.debug('[ONBOARDING] Completing onboarding flow');

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await onComplete();
  };

  const isLastScreen = currentIndex === SCREENS.length - 1;
  const CurrentScreen = SCREENS[currentIndex];

  return (
    <View style={styles.container}>
      {/* Render only the current screen with animation */}
      <Animated.View
        key={currentIndex}
        entering={Platform.OS !== 'web' ? FadeIn.duration(300) : undefined}
        exiting={Platform.OS !== 'web' ? FadeOut.duration(200) : undefined}
        style={styles.screenContainer}
      >
        <CurrentScreen />
      </Animated.View>

      <View style={styles.bottomContainer}>
        <ProgressDots count={SCREENS.length} activeIndex={currentIndex} />

        <View style={[styles.buttonsContainer, rtlContainerStyles.row]}>
          {!isLastScreen && (
            <TouchableOpacity
              style={[styles.skipButton, rtlContainerStyles.alignStart]}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>{t('onboardingSkip')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              isLastScreen && styles.getStartedButton,
              rtlContainerStyles.alignEnd,
            ]}
            onPress={isLastScreen ? handleComplete : goToNext}
            activeOpacity={0.8}
          >
            <Text style={[styles.nextButtonText, isLastScreen && styles.getStartedButtonText]}>
              {isLastScreen ? t('onboardingGetStarted') : t('onboardingNext')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    width: '100%',
    height: '100%',
  },
  screenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bottomContainer: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16,
    paddingHorizontal: 24,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    minHeight: getButtonHeight(),
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  skipButtonText: {
    ...TYPOGRAPHY.body,
    fontSize: responsiveFontSize(15),
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    minHeight: getButtonHeight() - 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  getStartedButton: {
    paddingHorizontal: 40,
    backgroundColor: COLORS.primary,
    flex: 1,
    marginLeft: 0,
    marginRight: 0,
  },
  nextButtonText: {
    ...TYPOGRAPHY.body,
    fontSize: responsiveFontSize(15),
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  getStartedButtonText: {
    fontSize: responsiveFontSize(17),
    fontWeight: '700',
  },
});