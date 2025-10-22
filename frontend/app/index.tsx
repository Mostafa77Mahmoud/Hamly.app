import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, Text, ActivityIndicator, AppState, SafeAreaView } from 'react-native';
import { supabase } from '@/utils/supabase';
import { traceEvent } from '@/utils/deepTracer';
import { logAppStateChange } from '@/utils/logCollector';
import { captureSessionSnapshot } from '@/utils/sessionDebugger';
import { initializeLanguage } from '@/utils/i18n';
import { COLORS } from '@/utils/modernStyles';

export default function Index() {
  const { session, loading, user, isNewUser } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeLanguage();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize language:', error);
        setIsReady(true);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (!isReady || loading) return;

    const checkAuthAndRedirect = async () => {
      console.log('[INDEX] Checking auth state:', { session: !!session, user: !!user, isNewUser });

      if (!session) {
        console.log('[INDEX] No session, redirecting to auth');
        router.replace('/(auth)/auth');
        return;
      }

      console.log('[INDEX] Session exists, checking profile');

      try {
        // Wait a bit for profile to be created
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if user has an active pregnancy instead of onboard_complete
        const { data: pregnancy, error } = await supabase
          .from('pregnancies')
          .select('id')
          .eq('user_id', user!.id)
          .eq('is_active', true)
          .single();

        console.log('[INDEX] Pregnancy data:', { hasPregnancy: !!pregnancy, error, isNewUser });

        // إذا كان مستخدم جديد أو لا يوجد حمل نشط
        if (isNewUser || !pregnancy) {
          console.log('[INDEX] No active pregnancy or new user, redirecting to setup');
          router.replace('/(onboarding)/setup');
        } else {
          console.log('[INDEX] Has active pregnancy, redirecting to main app');
          router.replace('/(tabs)/lab-results');
        }
      } catch (error) {
        console.error('[INDEX] Error checking pregnancy:', error);
        // في حالة الخطأ، نفترض أنه مستخدم جديد ونوجهه للـ onboarding
        router.replace('/(onboarding)/setup');
      }
    };

    checkAuthAndRedirect();
  }, [session, loading, user, isNewUser, isReady, router]);

  if (!isReady || loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return null;
}