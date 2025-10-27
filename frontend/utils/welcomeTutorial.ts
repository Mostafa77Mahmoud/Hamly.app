
import AsyncStorage from '@react-native-async-storage/async-storage';

const WELCOME_SEEN_KEY = 'hasSeenWelcomeTutorial';

export const hasSeenWelcomeTutorial = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(WELCOME_SEEN_KEY);
    console.log('[WELCOME_TUTORIAL] Checking welcome status:', value);
    return value === 'true';
  } catch (error) {
    console.error('[WELCOME_TUTORIAL] Error checking welcome tutorial flag:', error);
    // On error, assume user hasn't seen it (safer default)
    return false;
  }
};

export const markWelcomeTutorialAsSeen = async (): Promise<void> => {
  try {
    console.log('[WELCOME_TUTORIAL] Marking tutorial as seen...');
    await AsyncStorage.setItem(WELCOME_SEEN_KEY, 'true');
    
    // Verify it was saved
    const saved = await AsyncStorage.getItem(WELCOME_SEEN_KEY);
    console.log('[WELCOME_TUTORIAL] Tutorial marked as seen, verified:', saved);
  } catch (error) {
    console.error('[WELCOME_TUTORIAL] Error saving welcome tutorial flag:', error);
    throw error;
  }
};

export const resetWelcomeTutorial = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(WELCOME_SEEN_KEY);
  } catch (error) {
    console.error('Error resetting welcome tutorial flag:', error);
  }
};

const ONBOARDING_KEY = '@hamly_onboarding_completed';

export const hasSeenOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

export const setOnboardingComplete = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (error) {
    console.error('Error setting onboarding status:', error);
  }
};

export const resetOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
  }
};
