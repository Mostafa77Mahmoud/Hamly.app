import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/utils/modernStyles';

interface OnboardingScreensProps {
  onDone: () => void;
}

const isWeb = Platform.OS === 'web';

export default function OnboardingScreens({ onDone }: OnboardingScreensProps) {
  const DoneButton = ({ ...props }: any) => (
    <TouchableOpacity 
      style={[styles.button, styles.doneButton]} 
      onPress={props?.onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>Get Started</Text>
    </TouchableOpacity>
  );

  const NextButton = ({ ...props }: any) => (
    <TouchableOpacity 
      style={styles.button} 
      onPress={props?.onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>Next</Text>
      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );

  const SkipButton = ({ ...props }: any) => (
    <TouchableOpacity 
      style={styles.skipButton} 
      onPress={props?.onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.skipButtonText}>Skip</Text>
    </TouchableOpacity>
  );

  const Dots = ({ selected }: { selected: boolean }) => (
    <View 
      style={[
        styles.dot,
        selected ? styles.dotActive : styles.dotInactive,
      ]}
    />
  );

  return (
    <Onboarding
      onSkip={onDone}
      onDone={onDone}
      DoneButtonComponent={DoneButton}
      NextButtonComponent={NextButton}
      SkipButtonComponent={SkipButton}
      DotComponent={Dots}
      containerStyles={styles.container}
      imageContainerStyles={styles.imageContainer}
      bottomBarHighlight={false}
      pages={[
        {
          backgroundColor: '#FFFFFF',
          image: (
            <View style={styles.iconWrapper}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="heart" size={isWeb ? 60 : 50} color={COLORS.primary} />
              </View>
            </View>
          ),
          title: 'Welcome to HamlyMD',
          subtitle: 'Your trusted companion throughout your pregnancy journey. Personalized care for every stage.',
          titleStyles: styles.title,
          subTitleStyles: styles.subtitle,
        },
        {
          backgroundColor: '#FFF9FC',
          image: (
            <View style={styles.iconWrapper}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="sparkles" size={isWeb ? 60 : 50} color={COLORS.primary} />
              </View>
            </View>
          ),
          title: 'Key Features',
          subtitle: '• Track pregnancy week-by-week\n• Get personalized health tips\n• AI-powered lab report analysis\n• Manage medications safely\n• Monitor symptoms and health',
          titleStyles: styles.title,
          subTitleStyles: styles.subtitleList,
        },
        {
          backgroundColor: '#FFFFFF',
          image: (
            <View style={styles.iconWrapper}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.accentLight }]}>
                <Ionicons name="book-outline" size={isWeb ? 60 : 50} color={COLORS.accent} />
              </View>
            </View>
          ),
          title: 'How to Use',
          subtitle: '1. Sign up or log in with your email\n2. Enter your due date for tailored content\n3. Explore your personalized dashboard\n4. Track medications and symptoms\n5. Access expert health insights',
          titleStyles: styles.title,
          subTitleStyles: styles.subtitleList,
        },
        {
          backgroundColor: '#FFF9FC',
          image: (
            <View style={styles.iconWrapper}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.successLight }]}>
                <Ionicons name="rocket" size={isWeb ? 60 : 50} color={COLORS.success} />
              </View>
            </View>
          ),
          title: 'Ready to Begin?',
          subtitle: 'Join thousands of expecting mothers who trust HamlyMD for a healthy and happy pregnancy!',
          titleStyles: styles.title,
          subTitleStyles: styles.subtitle,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    paddingBottom: isWeb ? 80 : 60,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: isWeb ? 40 : 20,
  },
  iconCircle: {
    width: isWeb ? 140 : 120,
    height: isWeb ? 140 : 120,
    borderRadius: isWeb ? 70 : 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: isWeb ? 32 : 26,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: isWeb ? 18 : 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: isWeb ? 28 : 24,
    paddingHorizontal: isWeb ? 60 : 30,
    fontFamily: 'Inter-Regular',
  },
  subtitleList: {
    fontSize: isWeb ? 16 : 15,
    color: COLORS.textSecondary,
    textAlign: 'left',
    lineHeight: isWeb ? 28 : 26,
    paddingHorizontal: isWeb ? 80 : 40,
    fontFamily: 'Inter-Regular',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  doneButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 32,
    shadowColor: COLORS.success,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: isWeb ? 17 : 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginLeft: 16,
  },
  skipButtonText: {
    color: COLORS.textTertiary,
    fontSize: isWeb ? 16 : 15,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  dotInactive: {
    backgroundColor: COLORS.gray300,
  },
});
