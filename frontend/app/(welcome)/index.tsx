
import React from 'react';
import { View, StyleSheet } from 'react-native';
import OnboardingFlow from './components/OnboardingFlow';
import { markWelcomeTutorialAsSeen } from '@/utils/welcomeTutorial';
import { useRouter } from 'expo-router';

export default function WelcomeIndex() {
  const router = useRouter();

  const handleComplete = async () => {
    try {
      console.log('[WELCOME_INDEX] Tutorial completed, marking as seen...');
      await markWelcomeTutorialAsSeen();
      console.log('[WELCOME_INDEX] Tutorial marked as seen successfully');
      
      // Trigger storage event for web to update parent layout state
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'hasSeenWelcomeTutorial',
          newValue: 'true',
          oldValue: 'false',
        }));
      }
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 150));
      
      console.log('[WELCOME_INDEX] Redirecting to auth screen...');
      
      // Use replace to prevent going back to welcome screens
      router.replace('/(auth)/auth');
    } catch (error) {
      console.error('[WELCOME_INDEX] Error during completion:', error);
      // Still redirect even if marking fails
      router.replace('/(auth)/auth');
    }
  };

  return (
    <View style={styles.container}>
      <OnboardingFlow onComplete={handleComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
