import { useEffect, useState } from 'react';
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

  // Add reset function for testing welcome screens
  import('../utils/welcomeTutorial').then(({ resetWelcomeTutorial }) => {
    (window as any).resetWelcome = async () => {
      await resetWelcomeTutorial();
      console.log('✅ Welcome tutorial reset! Reloading...');
      window.location.href = '/';
    };
    console.log('🔄 Use resetWelcome() to test welcome screens again');
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
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);

  // Check if user has seen welcome tutorial
  useEffect(() => {
    const checkWelcomeTutorial = async () => {
      const { hasSeenWelcomeTutorial } = await import('@/utils/welcomeTutorial');
      const seen = await hasSeenWelcomeTutorial();
      console.log('[ROOT_LAYOUT] Welcome tutorial status:', seen);
      setHasSeenWelcome(seen);
    };
    checkWelcomeTutorial();
    
    // Listen for storage changes (for web)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hasSeenWelcomeTutorial' && e.newValue === 'true') {
        console.log('[ROOT_LAYOUT] Welcome tutorial marked as seen via storage event');
        setHasSeenWelcome(true);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  useEffect(() => {
    if (loading) {
      console.log('[ROOT_LAYOUT] Waiting for auth...', { loading });
      return;
    }

    // Wait until hasSeenWelcome is determined (not null)
    if (hasSeenWelcome === null) {
      console.log('[ROOT_LAYOUT] Waiting for welcome status...', { hasSeenWelcome });
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inWelcomeGroup = segments[0] === '(welcome)';
    const inRootIndex = segments.length === 0 || segments[0] === 'index';

    console.log('[ROOT_LAYOUT] Navigation check:', {
      hasSeenWelcome,
      session: !!session,
      isNewUser,
      segments,
      currentSegment: segments[0],
      inWelcomeGroup,
      inAuthGroup,
      inRootIndex,
    });

    // Priority 1: First time user - MUST show welcome tutorial
    if (hasSeenWelcome === false) {
      if (!inWelcomeGroup) {
        console.log('[ROOT_LAYOUT] 🎯 First time user - Redirecting to welcome...');
        router.replace('/(welcome)');
      }
      return; // Stop here, don't check other conditions
    }

    // Priority 2: Not signed in - show auth
    if (!session) {
      if (!inAuthGroup) {
        console.log('[ROOT_LAYOUT] 🔐 No session - Redirecting to auth...');
        router.replace('/(auth)/auth');
      }
      return;
    }

    // Priority 3: Signed in, new user - show pregnancy setup
    if (isNewUser) {
      if (!inOnboardingGroup) {
        console.log('[ROOT_LAYOUT] 🤰 New user - Redirecting to onboarding setup...');
        router.replace('/(onboarding)/setup');
      }
      return;
    }

    // Priority 4: Signed in, existing user - show main app
    if (!inTabsGroup) {
      console.log('[ROOT_LAYOUT] 📊 Existing user - Redirecting to main app...');
      router.replace('/(tabs)/lab-results');
    }
  }, [session, segments, loading, isNewUser, hasSeenWelcome]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(welcome)" options={{ headerShown: false }} />
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