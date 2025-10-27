
import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, SafeAreaView, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from '@/utils/modernStyles';
import { rtlTextStyles } from '@/utils/rtlStyles';
import { responsiveFontSize, responsiveHeight } from '@/utils/responsive';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface OnboardingPageProps {
  title: string;
  subtitle: string;
  description: string;
  illustration: React.ReactNode;
  backgroundColor?: string;
  gradientColors?: string[];
}

export default function OnboardingPage({
  title,
  subtitle,
  description,
  illustration,
  backgroundColor = COLORS.white,
  gradientColors = [COLORS.white, COLORS.surfaceLight],
}: OnboardingPageProps) {
  const { height, width } = useWindowDimensions();
  const isDesktop = width >= 768;
  
  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Illustration Section */}
          <Animated.View
            entering={Platform.OS !== 'web' ? FadeInUp.duration(600).delay(200) : undefined}
            style={[styles.illustrationContainer, { height: isDesktop ? Math.min(height * 0.4, 400) : height * 0.45 }]}
          >
            {illustration}
          </Animated.View>

          {/* Content Section */}
          <Animated.View
            entering={Platform.OS !== 'web' ? FadeInDown.duration(600).delay(400) : undefined}
            style={[styles.contentContainer, isDesktop && styles.contentContainerDesktop]}
          >
            <Text
              style={[styles.title, isDesktop && styles.titleDesktop]}
              numberOfLines={3}
            >
              {title}
            </Text>

            <Text
              style={[styles.subtitle, isDesktop && styles.subtitleDesktop]}
              numberOfLines={2}
            >
              {subtitle}
            </Text>

            <Text
              style={[styles.description, isDesktop && styles.descriptionDesktop]}
              numberOfLines={5}
            >
              {description}
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 40 : 24,
    paddingBottom: 20,
  },
  illustrationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  contentContainerDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: responsiveFontSize(26),
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: responsiveFontSize(34),
  },
  titleDesktop: {
    fontSize: 28,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: responsiveFontSize(17),
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: responsiveFontSize(24),
  },
  subtitleDesktop: {
    fontSize: 18,
    lineHeight: 26,
  },
  description: {
    fontSize: responsiveFontSize(14),
    fontWeight: '400',
    color: COLORS.textSecondary,
    lineHeight: responsiveFontSize(20),
    textAlign: 'center',
  },
  descriptionDesktop: {
    fontSize: 15,
    lineHeight: 22,
  },
});
