import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useSegments } from 'expo-router';
import { Alert } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { installNetworkInterceptor } from "@/utils/networkInterceptor";

// Initialize debug panel for development
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  import('../utils/debugPanel').then(({ debugPanel }) => {
    (window as any).debugPanel = debugPanel;
    console.log('🔧 Debug panel initialized. Use generateHealthReport() for system status');
  });

  // Initialize deep tracing system
  import('../utils/traceInit').then(({ initializeTracing }) => {
    initializeTracing();
  });
}
import { I18nManager, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import { isRTL, initializeLanguage } from '@/utils/i18n';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { installNgrokFix } from '@/utils/ngrokFix';
SplashScreen.preventAutoHideAsync();

// Install network interceptor for debugging
installNetworkInterceptor();

// Install ngrok fix for headers
installNgrokFix();

// Note: Supabase check removed for security - should not create test users in production

function RootLayoutNav() {
  const { session, loading, isNewUser } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!session && !inAuthGroup) {
      // Redirect to auth if not signed in
      router.replace('/(auth)/auth');
    } else if (session && isNewUser && !inOnboardingGroup) {
      // Redirect new users to onboarding
      router.replace('/(onboarding)/setup');
    } else if (session && !isNewUser && !inTabsGroup) {
      // Redirect existing users to main app
      router.replace('/(tabs)/lab-results');
    }
  }, [session, segments, loading, isNewUser]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  // Suppress navigation warnings in development
  useEffect(() => {
    if (__DEV__) {
      const originalConsoleWarn = console.warn;
      const originalConsoleError = console.error;

      console.warn = (...args) => {
        // Suppress specific navigation warnings that are not critical
        const message = args[0]?.toString?.() || '';
        if (
          message.includes('GO_BACK') ||
          message.includes('not handled by any navigator') ||
          message.includes('Is there any screen to go back to?') ||
          message.includes('development-only warning')
        ) {
          return; // Suppress these specific warnings
        }
        originalConsoleWarn(...args);
      };

      console.error = (...args) => {
        const message = args[0]?.toString?.() || '';
        if (
          message.includes('GO_BACK') ||
          message.includes('not handled by any navigator')
        ) {
          return; // Suppress these specific errors too
        }
        originalConsoleError(...args);
      };
    }
  }, []);

  // Initialize language and set RTL
  useEffect(() => {
    const initLanguage = async () => {
      await initializeLanguage();

      if (Platform.OS !== 'web') {
        I18nManager.forceRTL(isRTL());
      } else {
        // For web, set document direction
        if (typeof document !== 'undefined') {
          document.documentElement.dir = isRTL() ? 'rtl' : 'ltr';
          document.documentElement.lang = isRTL() ? 'ar' : 'en';
        }
      }
    };

    initLanguage();
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <AuthProvider>
        <DataProvider>
          <RootLayoutNav />
        </DataProvider>
      </AuthProvider>
      <StatusBar style="auto" />
    </>
  );
}