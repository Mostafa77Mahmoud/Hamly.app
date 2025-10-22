
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { traceSupabaseSDK } from './networkTracer';

const STORED_SESSION_KEY = 'supabase.auth.token';
const SDK_STATE_CHECK_KEY = 'sdk_state_snapshot';

interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: any;
}

interface SDKStateSnapshot {
  timestamp: number;
  hasAuthClient: boolean;
  hasRealtimeClient: boolean;
  sessionValid: boolean;
  userId?: string;
}

/**
 * مراقبة حالة Supabase SDK قبل وبعد Alt+Tab
 */
async function captureSDKState(client: SupabaseClient, label: string): Promise<SDKStateSnapshot> {
  const state: SDKStateSnapshot = {
    timestamp: Date.now(),
    hasAuthClient: !!(client as any).auth,
    hasRealtimeClient: !!(client as any).realtime,
    sessionValid: false,
  };

  try {
    const { data } = await Promise.race([
      client.auth.getSession(),
      new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('SDK state check timeout')), 1000)
      ),
    ]);
    
    state.sessionValid = !!data?.session;
    state.userId = data?.session?.user?.id;
  } catch (err) {
    state.sessionValid = false;
  }

  traceSupabaseSDK(`sdkStateCapture_${label}`, state);
  
  // حفظ الحالة للمقارنة
  await AsyncStorage.setItem(`${SDK_STATE_CHECK_KEY}_${label}`, JSON.stringify(state));
  
  return state;
}

/**
 * مقارنة حالة SDK قبل وبعد Alt+Tab
 */
async function compareSDKStates(): Promise<{ degraded: boolean; reason?: string }> {
  try {
    const beforeStr = await AsyncStorage.getItem(`${SDK_STATE_CHECK_KEY}_before_suspend`);
    const afterStr = await AsyncStorage.getItem(`${SDK_STATE_CHECK_KEY}_after_resume`);
    
    if (!beforeStr || !afterStr) {
      return { degraded: false };
    }
    
    const before: SDKStateSnapshot = JSON.parse(beforeStr);
    const after: SDKStateSnapshot = JSON.parse(afterStr);
    
    // التحقق من تدهور الحالة
    if (before.hasAuthClient && !after.hasAuthClient) {
      return { degraded: true, reason: 'AuthClient lost' };
    }
    
    if (before.sessionValid && !after.sessionValid) {
      return { degraded: true, reason: 'Session became invalid' };
    }
    
    if (before.userId && before.userId !== after.userId) {
      return { degraded: true, reason: 'User ID changed' };
    }
    
    return { degraded: false };
  } catch (err) {
    traceSupabaseSDK('sdkStateComparisonError', { error: String(err) });
    return { degraded: false };
  }
}

/**
 * إعادة إنشاء client من الصفر مع session محفوظة
 */
async function recreateClientWithSession(
  supabaseUrl: string,
  supabaseAnonKey: string,
  storedSession: StoredSession
): Promise<SupabaseClient> {
  traceSupabaseSDK('recreatingClientWithSession', {
    hasAccessToken: !!storedSession.access_token,
    hasRefreshToken: !!storedSession.refresh_token,
    expiresAt: storedSession.expires_at,
  });

  const newClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: Platform.OS === 'web' ? window.localStorage : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  // استعادة الجلسة باستخدام الـ tokens المحفوظة
  const { error } = await newClient.auth.setSession({
    access_token: storedSession.access_token,
    refresh_token: storedSession.refresh_token,
  });

  if (error) {
    traceSupabaseSDK('setSessionError', { error: error.message });
    throw error;
  }

  traceSupabaseSDK('clientRecreatedSuccessfully', {
    userId: storedSession.user?.id,
  });

  return newClient;
}

/**
 * محاولة استعادة الجلسة باستخدام accessToken مباشرة
 */
async function tryDirectTokenRestore(
  client: SupabaseClient,
  storedSession: StoredSession
): Promise<boolean> {
  try {
    traceSupabaseSDK('attemptingDirectTokenRestore', {
      tokenLength: storedSession.access_token?.length,
    });

    // محاولة استخدام access token مباشرة
    const { data, error } = await client.auth.setSession({
      access_token: storedSession.access_token,
      refresh_token: storedSession.refresh_token,
    });

    if (!error && data?.session) {
      traceSupabaseSDK('directTokenRestoreSuccess', {
        userId: data.session.user?.id,
      });
      return true;
    }

    traceSupabaseSDK('directTokenRestoreFailed', {
      error: error?.message,
    });
    return false;
  } catch (err) {
    traceSupabaseSDK('directTokenRestoreError', { error: String(err) });
    return false;
  }
}

/**
 * استعادة Supabase client بعد app resume مع حماية كاملة
 * 
 * الاستراتيجية:
 * 1. التحقق من حالة SDK الحالية (مع timeout قصير جداً 500ms)
 * 2. إذا فشلت أو timeout → استخدام accessToken المحفوظ مباشرة
 * 3. إذا فشل ذلك → إعادة إنشاء client جديد مع الـ session المحفوظة
 * 4. إذا فشل كل شيء → إرجاع fresh client
 */
export async function recoverSupabaseClient(
  currentClient: SupabaseClient,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<{ client: SupabaseClient; recovered: boolean; method: string }> {
  
  traceSupabaseSDK('recoveryAttempt', { reason: 'app_resume' });

  let attemptCount = 0;
  const maxGetSessionAttempts = 3;
  
  // Step 1: محاولة الحصول على session من client الحالي (مع timeout قصير وretries)
  for (let i = 0; i < maxGetSessionAttempts; i++) {
    attemptCount++;
    try {
      traceSupabaseSDK('getSessionAttempt', { attempt: i + 1, timeout: 500 });
      
      const { data: currentData, error: currentError } = await Promise.race([
        currentClient.auth.getSession(),
        new Promise<{ data: null; error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('SDK getSession timeout')), 500) // timeout قصير جداً
        ),
      ]);

      if (!currentError && currentData?.session) {
        // تحقق من صلاحية الـ session
        const expiresAt = currentData.session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        
        if (expiresAt && expiresAt > now + 30) { // صالح لـ 30 ثانية على الأقل
          traceSupabaseSDK('recoverySuccess', { method: 'current_client_valid', attempt: i + 1 });
          return { client: currentClient, recovered: false, method: 'current_client_valid' };
        }
      }
    } catch (timeoutErr) {
      traceSupabaseSDK('getSessionTimeout', { attempt: i + 1, error: String(timeoutErr) });
      // استمر للمحاولة التالية
    }
    
    // انتظار قصير قبل المحاولة التالية
    if (i < maxGetSessionAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  traceSupabaseSDK('currentClientFailed', { attempts: attemptCount });

  // Step 2: محاولة الاستعادة من AsyncStorage
  const storedSessionStr = await AsyncStorage.getItem(STORED_SESSION_KEY);
  
  if (storedSessionStr) {
    try {
      const storedSession: StoredSession = JSON.parse(storedSessionStr);
      
      // تحقق من صلاحية الـ token
      const now = Math.floor(Date.now() / 1000);
      const tokenValid = storedSession.expires_at && storedSession.expires_at > now + 30;
      
      if (tokenValid && storedSession.access_token) {
        traceSupabaseSDK('restoringFromStorage', {
          expiresIn: storedSession.expires_at - now,
          hasAccessToken: !!storedSession.access_token,
        });

        // 2A: محاولة استخدام access token مباشرة على client الحالي
        const directRestore = await tryDirectTokenRestore(currentClient, storedSession);
        if (directRestore) {
          return { client: currentClient, recovered: true, method: 'direct_token_restore' };
        }

        // 2B: إعادة إنشاء client جديد مع session محفوظة
        try {
          const newClient = await recreateClientWithSession(supabaseUrl, supabaseAnonKey, storedSession);
          return { client: newClient, recovered: true, method: 'client_recreated_with_session' };
        } catch (recreateErr) {
          traceSupabaseSDK('clientRecreationFailed', { error: String(recreateErr) });
        }
      } else {
        traceSupabaseSDK('storedSessionExpired', {
          expiresAt: storedSession.expires_at,
          now,
        });
      }
    } catch (parseErr) {
      traceSupabaseSDK('storedSessionParseError', { error: String(parseErr) });
    }
  }

  // Step 3: Last resort - إنشاء fresh client جديد
  traceSupabaseSDK('creatingFreshClient', { reason: 'all_recovery_failed' });
  
  const freshClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: Platform.OS === 'web' ? window.localStorage : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return { client: freshClient, recovered: true, method: 'fresh_client_created' };
}

/**
 * حفظ session للاستعادة لاحقاً
 */
export async function storeSessionForRecovery(session: any): Promise<void> {
  if (!session) return;

  try {
    const storedSession: StoredSession = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user: session.user,
    };

    await AsyncStorage.setItem(STORED_SESSION_KEY, JSON.stringify(storedSession));
    traceSupabaseSDK('sessionStored', { 
      expiresAt: session.expires_at,
      userId: session.user?.id,
    });
  } catch (error) {
    traceSupabaseSDK('sessionStoreFailed', { error: String(error) });
  }
}

/**
 * مراقبة SDK قبل الذهاب للخلفية
 */
export async function captureSDKStateBeforeSuspend(client: SupabaseClient): Promise<void> {
  await captureSDKState(client, 'before_suspend');
  traceSupabaseSDK('sdkStateCapturedBeforeSuspend', { timestamp: Date.now() });
}

/**
 * مراقبة SDK بعد العودة من الخلفية
 */
export async function captureSDKStateAfterResume(client: SupabaseClient): Promise<void> {
  const afterState = await captureSDKState(client, 'after_resume');
  
  // مقارنة الحالة
  const comparison = await compareSDKStates();
  
  if (comparison.degraded) {
    traceSupabaseSDK('sdkStateDegraded', {
      reason: comparison.reason,
      afterState,
    });
  } else {
    traceSupabaseSDK('sdkStateStable', { afterState });
  }
}

/**
 * إنشاء AbortController مع timeout
 */
export function createAbortController(timeoutMs: number): {
  controller: AbortController;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    traceSupabaseSDK('abortControllerTimeout', { timeoutMs });
    controller.abort();
  }, timeoutMs);

  const cleanup = () => {
    clearTimeout(timeoutId);
  };

  return { controller, cleanup };
}
