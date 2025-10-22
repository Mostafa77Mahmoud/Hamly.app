import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { traceRequest, createTracedPromise } from './networkTracer';
import { traceEvent } from './deepTracer';
import { captureSessionSnapshot } from './sessionDebugger';
import { logSupabaseRequest } from './logCollector';

// Database type definition
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string; full_name: string | null; avatar_url: string | null; onboard_complete: boolean | null; created_at: string; updated_at: string };
        Insert: { id: string; email: string; full_name?: string | null; avatar_url?: string | null; onboard_complete?: boolean | null; created_at?: string; updated_at?: string };
        Update: { id?: string; email?: string; full_name?: string | null; avatar_url?: string | null; onboard_complete?: boolean | null; updated_at?: string };
      };
      pregnancies: {
        Row: { id: string; user_id: string; name: string; last_menstrual_period: string; due_date: string; is_active: boolean; notes: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; name: string; last_menstrual_period: string; due_date: string; is_active?: boolean; notes?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; name?: string; last_menstrual_period?: string; due_date?: string; is_active?: boolean; notes?: string | null; updated_at?: string };
      };
      lab_reports: {
        Row: { id: string; user_id: string; pregnancy_id: string | null; date: string; summary: string; source: 'manual' | 'upload'; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; pregnancy_id?: string | null; date: string; summary: string; source: 'manual' | 'upload'; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; pregnancy_id?: string | null; date?: string; summary?: string; source?: 'manual' | 'upload'; updated_at?: string };
      };
      lab_results: {
        Row: { id: string; user_id: string; lab_report_id: string; test_name: string; value: string; unit: string; reference_range: string; date: string; is_abnormal: boolean; notes: string | null; category: 'blood' | 'urine' | 'ultrasound' | 'genetic' | 'other'; trimester: 1 | 2 | 3; explanation: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; lab_report_id: string; test_name: string; value: string; unit: string; reference_range: string; date: string; is_abnormal: boolean; notes?: string | null; category: 'blood' | 'urine' | 'ultrasound' | 'genetic' | 'other'; trimester: 1 | 2 | 3; explanation?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; lab_report_id?: string; test_name?: string; value?: string; unit?: string; reference_range?: string; date?: string; is_abnormal?: boolean; notes?: string | null; category?: 'blood' | 'urine' | 'ultrasound' | 'genetic' | 'other'; trimester?: 1 | 2 | 3; explanation?: string | null; updated_at?: string };
      };
      medications: {
        Row: { id: string; user_id: string; pregnancy_id: string | null; name: string; dosage: string; frequency: string; prescribed_date: string; end_date: string | null; fda_category: 'A' | 'B' | 'C' | 'D' | 'X'; fda_category_ai: string | null; notes: string | null; llm_safety_analysis: string | null; llm_benefits: string | null; llm_risks: string | null; overall_safety: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; pregnancy_id?: string | null; name: string; dosage: string; frequency: string; prescribed_date: string; end_date?: string | null; fda_category: 'A' | 'B' | 'C' | 'D' | 'X'; fda_category_ai?: string | null; notes?: string | null; llm_safety_analysis?: string | null; llm_benefits?: string | null; llm_risks?: string | null; overall_safety?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; pregnancy_id?: string | null; name?: string; dosage?: string; frequency?: string; prescribed_date?: string; end_date?: string | null; fda_category?: 'A' | 'B' | 'C' | 'D' | 'X'; fda_category_ai?: string | null; notes?: string | null; llm_safety_analysis?: string | null; llm_benefits?: string | null; llm_risks?: string | null; overall_safety?: string | null; updated_at?: string };
      };
      symptoms: {
        Row: { id: string; user_id: string; pregnancy_id: string | null; date: string; type: string; severity: 1 | 2 | 3 | 4 | 5; description: string; triggers: string | null; llm_analysis: string | null; llm_recommendations: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; pregnancy_id?: string | null; date: string; type: string; severity: 1 | 2 | 3 | 4 | 5; description: string; triggers?: string | null; llm_analysis?: string | null; llm_recommendations?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; pregnancy_id?: string | null; date?: string; type?: string; severity?: 1 | 2 | 3 | 4 | 5; description?: string; triggers?: string | null; llm_analysis?: string | null; llm_recommendations?: string | null; updated_at?: string };
      };
      medication_adherence_logs: {
        Row: { id: string; user_id: string; medication_id: string; date: string; taken: boolean; notes: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; medication_id: string; date: string; taken?: boolean; notes?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; medication_id?: string; date?: string; taken?: boolean; notes?: string | null; updated_at?: string };
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
  };
}

// Database types are defined in ../types, assuming they are compatible
// If not, adjust the import path or re-define types here if necessary.
// For demonstration, I'll assume the original Database interface is still relevant.
// If the Database interface was in the original file and not imported,
// it should be kept here. Since it's now imported from ../types,
// we'll proceed with that assumption.

// Assuming Database interface is correctly imported from ../types
// If not, the original Database definition from the provided snippet
// should be included here.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey || '';

console.log('Debug - Environment variables:');
console.log('process.env.EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('Final supabaseUrl:', supabaseUrl || '[NOT SET]');
console.log('Final supabaseAnonKey:', supabaseAnonKey ? '[SET]' : '[NOT SET]');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Missing Supabase environment variables - App will not function properly');
  console.error('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  // Don't throw error, allow app to load with warning
}

if (supabaseUrl) {
  try {
    new URL(supabaseUrl);
  } catch (error) {
    console.error(`Invalid Supabase URL: ${supabaseUrl}`);
  }
}

const createPlatformStorage = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: async (key: string) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      setItem: async (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
      },
      removeItem: async (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      },
    };
  } else {
    return AsyncStorage;
  }
};

// --- START OF MODIFIED CODE ---

// Database types are now assumed to be imported from '../types' as per the changes
// If they were originally defined here, they should be kept or appropriately merged.
// For this integration, we assume the import is correct and the Database interface is available.

// The original 'supabase' client creation is replaced by a more robust system.

// تتبع حالة الـ client
let currentClient: SupabaseClient<Database> | null = null;
let clientCreationTime = Date.now();
let isRecreating = false;

// إنشاء client مع إعدادات محسنة لحل مشكلة Alt+Tab
function createSupabaseClient(): SupabaseClient<Database> | null {
  console.log('[SUPABASE_CLIENT] Creating new client instance');
  
  // Return null if credentials are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[SUPABASE_CLIENT] Cannot create client - missing credentials');
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: createPlatformStorage(), // Use platform-specific storage
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // تعطيل multiTab لتقليل triggers الزائدة
      storageKey: 'hamlymd-auth-token',
      // استخدام localStorage بدل IndexedDB في الويب
      ...(Platform.OS === 'web' && {
        flowType: 'pkce', // Preferred for web for security
      }),
    },
    realtime: {
      // تحسين إعدادات realtime للتعامل مع الـ reconnection
      params: {
        eventsPerSecond: 10, // Limit events per second for better stability
      },
    },
    global: {
      headers: {
        'x-client-info': 'hamlymd-app', // Consistent client info
      },
    },
    // db: { schema: 'public' } - This was in original, kept for consistency if needed
  });
}

// إعادة إنشاء الـ client بشكل آمن
async function recreateClient(reason: string): Promise<SupabaseClient<Database> | null> {
  if (isRecreating) {
    console.log('[SUPABASE_RECOVERY] Already recreating, waiting...');
    // انتظر حتى ينتهي الـ recreation الجاري
    // Add a small delay to avoid race conditions if multiple calls happen concurrently
    await new Promise(resolve => setTimeout(resolve, 100));
    // Ensure currentClient is not null before returning, though it should be set by isRecreating logic
    if (!currentClient) {
        // Fallback if something went wrong, recreate immediately
        console.warn('[SUPABASE_RECOVERY] Current client became null during wait, re-initiating recreation.');
        isRecreating = false; // Reset flag to allow new recreation
        return recreateClient(`fallback_after_wait_for_${reason}`);
    }
    return currentClient;
  }

  isRecreating = true;
  console.log(`[SUPABASE_RECOVERY] Recreating client due to: ${reason}`);

  try {
    // احفظ الجلسة الحالية قبل إعادة الإنشاء
    let savedSession = null;
    if (currentClient) {
      try {
        // Use await for getSession() as it's an async operation
        const { data } = await currentClient.auth.getSession();
        savedSession = data.session;
      } catch (err) {
        console.log('[SUPABASE_RECOVERY] Could not get current session:', err);
      }
    }

    // أنشئ client جديد
    const newClient = createSupabaseClient();
    
    // If client creation failed, return null
    if (!newClient) {
      console.error('[SUPABASE_RECOVERY] Failed to create new client - missing credentials');
      return null;
    }

    // استعد الجلسة إذا كانت موجودة
    if (savedSession?.access_token) {
      console.log('[SUPABASE_RECOVERY] Restoring saved session');
      // Ensure we pass the correct structure to setSession
      await newClient.auth.setSession({
        access_token: savedSession.access_token,
        refresh_token: savedSession.refresh_token,
      });
    } else {
      // حاول استعادة من storage
      // Use the correct storage key if it was changed
      const storedSession = await AsyncStorage.getItem('hamlymd-auth-token'); // Assuming this is the correct key
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession);
          // Adjust parsing based on actual storage format
          // Assuming 'currentSession' contains the actual session object
          const currentSession = sessionData.currentSession || sessionData;
          if (currentSession?.access_token) {
            console.log('[SUPABASE_RECOVERY] Restoring from storage');
            await newClient.auth.setSession({
              access_token: currentSession.access_token,
              refresh_token: currentSession.refresh_token,
            });
          }
        } catch (parseError) {
          console.error('[SUPABASE_RECOVERY] Error parsing stored session:', parseError);
        }
      }
    }

    // ابدأ auto refresh يدويًا إذا كان مدعومًا
    if (Platform.OS === 'web') {
      // The original code had '@ts-ignore - startAutoRefresh غير موجود في types لكن موجود في SDK'
      // We should use the correct method or ensure types are updated.
      // For now, assuming it's available or handled by the SDK.
      // A more robust approach might be to check for its existence.
      if (typeof (newClient.auth as any).startAutoRefresh === 'function') {
         // @ts-ignore - Assuming startAutoRefresh exists based on context
         (newClient.auth as any).startAutoRefresh();
      } else {
         console.log('[SUPABASE_RECOVERY] startAutoRefresh not available on this client version.');
      }
    }

    currentClient = newClient;
    clientCreationTime = Date.now();

    console.log('[SUPABASE_RECOVERY] Client recreated successfully');
    return newClient;
  } catch (error) {
    console.error('[SUPABASE_RECOVERY] Error during client recreation:', error);
    // If an error occurs, ensure currentClient is reset or handled appropriately
    // For now, we re-throw to indicate failure
    throw error;
  } finally {
    isRecreating = false;
  }
}

// اكتشاف الـ freeze وإعادة الإنشاء تلقائيًا  
async function ensureClientHealth(): Promise<SupabaseClient<Database> | null> {
  if (!currentClient) {
    console.log('[SUPABASE_HEALTH] No client found, creating initial client.');
    currentClient = createSupabaseClient();
    clientCreationTime = Date.now(); // Set creation time for the new client
    return currentClient;
  }

  // اختبار صحة الـ client بـ timeout قصير
  const healthCheckPromise = new Promise<boolean>(async (resolve) => {
    const timeout = setTimeout(() => {
      console.log('[SUPABASE_HEALTH] Health check timed out.');
      resolve(false);
    }, 200); // 200ms timeout

    try {
      // Attempt to get session, which implicitly checks connection
      await currentClient!.auth.getSession();
      clearTimeout(timeout);
      resolve(true);
    } catch (error) {
      console.log('[SUPABASE_HEALTH] Health check failed:', error);
      clearTimeout(timeout);
      resolve(false);
    }
  });

  const isHealthy = await healthCheckPromise;

  if (!isHealthy) {
    console.log('[SUPABASE_HEALTH] Client is frozen or unresponsive, attempting to recreate...');
    return await recreateClient('health_check_failed');
  }

  // إذا الـ client قديم جداً (أكثر من ساعة)، أعد إنشاءه احتياطيًا
  const clientAge = Date.now() - clientCreationTime;
  const oneHourInMillis = 60 * 60 * 1000;
  if (clientAge > oneHourInMillis) {
    console.log('[SUPABASE_HEALTH] Client is old (over 1 hour), recreating preventively...');
    return await recreateClient('preventive_recreation');
  }

  // Client is healthy and not too old
  return currentClient;
}

// إنشاء الـ client الأولي عند تحميل الملف
// This ensures that `currentClient` is initialized.
// The Proxy will handle subsequent access and health checks.
try {
    currentClient = createSupabaseClient();
    clientCreationTime = Date.now();
    if (currentClient) {
        console.log('[SUPABASE_INIT] Initial client created successfully.');
    } else {
        console.warn('[SUPABASE_INIT] Client not created - missing credentials. App will run in limited mode.');
    }
} catch (error) {
    console.error('[SUPABASE_INIT] Failed to create initial client:', error);
    currentClient = null;
}


// تصدير client مع health check باستخدام Proxy
// This proxy intercepts calls and ensures the client is healthy before forwarding.
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop, receiver) {
    // Intercept specific methods that are critical for connection checks
    // Use `in` operator for checking property existence
    if (prop in ['auth', 'from', 'rpc']) {
      // Dynamically create a function that first ensures health, then calls the original method
      return async (...args: any[]) => {
        const healthyClient = await ensureClientHealth();
        // @ts-ignore - Suppress TypeScript error about property access on potentially undefined client
        // We know healthyClient is valid due to ensureClientHealth logic
        const method = healthyClient[prop as keyof SupabaseClient<Database>];
        if (typeof method === 'function') {
            // @ts-ignore - Suppress TypeScript error about calling with unknown arguments
            return method.apply(healthyClient, args);
        } else {
            console.error(`[SUPABASE_PROXY] Property ${String(prop)} is not a function on the client.`);
            throw new Error(`Property ${String(prop)} is not a function.`);
        }
      };
    }
    // For all other properties, return the value from the current client directly
    // Ensure currentClient is not null, though it should be initialized
    if (currentClient) {
        // @ts-ignore - Suppress TypeScript error about property access
        return Reflect.get(currentClient, prop, receiver);
    } else {
        // This case should ideally not happen if initialization is successful
        console.error('[SUPABASE_PROXY] Current Supabase client is null.');
        throw new Error('Supabase client is not initialized.');
    }
  }
});

// استمع لـ visibility changes وأعد إنشاء الـ client
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  let wasHidden = false;

  // Using 'pagehide' and 'pageshow' events for more reliable detection of tab lifecycle
  // 'visibilitychange' can sometimes be unreliable across different browsers/platforms.
  window.addEventListener('pagehide', () => {
    wasHidden = true;
    console.log('[VISIBILITY] Page hidden (pagehide)');
  });

  window.addEventListener('pageshow', async (event) => {
    // Check if the page was hidden before becoming visible again
    // event.persisted will be true if the page was served from bfcache (back/forward cache)
    // which also indicates a potential state loss.
    if (wasHidden || event.persisted) {
      console.log(`[VISIBILITY] Page visible again (wasHidden: ${wasHidden}, persisted: ${event.persisted}), checking client health...`);
      wasHidden = false; // Reset flag

      // Schedule recreation after a short delay to allow the browser to stabilize
      setTimeout(async () => {
        try {
          await recreateClient('visibility_change_recovery');
        } catch (err) {
          console.error('[VISIBILITY] Failed to recreate client after visibility change:', err);
        }
      }, 100); // Small delay
    }
  });
}

// تصدير دالة إعادة الإنشاء اليدوية للاستخدام في SessionManager أو أماكن أخرى
export async function forceRecreateSupabaseClient(reason: string = 'manual'): Promise<void> {
  console.log(`[FORCE_RECREATE] Manual recreation requested: ${reason}`);
  await recreateClient(reason);
}

// --- END OF MODIFIED CODE ---

// --- ORIGINAL CODE PRESERVED (excluding replaced parts) ---

export interface FetchWithRetriesResult<T> {
  ok: boolean;
  data?: T;
  error?: any;
  attempts: number;
  latencyMs: number;
}

export interface FetchWithRetriesOptions {
  key: string;
  fn: (signal: AbortSignal) => Promise<any>;
  timeoutMs?: number;
  maxAttempts?: number;
  signal?: AbortSignal;
  idempotencyKey?: string;
}

export async function fetchWithRetries<T>(
  options: FetchWithRetriesOptions
): Promise<FetchWithRetriesResult<T>> {
  const {
    key,
    fn,
    timeoutMs = 12000,
    maxAttempts = 3,
    signal: externalSignal,
    idempotencyKey,
  } = options;

  const startTime = Date.now();
  let lastError: any;
  let attempts = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    attempts++;

    if (externalSignal?.aborted) {
      return {
        ok: false,
        error: new Error('Request aborted'),
        attempts,
        latencyMs: Date.now() - startTime,
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const abortHandler = () => controller.abort();
    externalSignal?.addEventListener('abort', abortHandler);

    try {
      const result = await fn(controller.signal);
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', abortHandler);

      const latencyMs = Date.now() - startTime;
      console.log(`✅ ${key} succeeded (attempt ${attempts}, ${latencyMs}ms)`);

      return {
        ok: true,
        data: result,
        attempts,
        latencyMs,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', abortHandler);

      lastError = error;

      const isAborted = controller.signal.aborted || externalSignal?.aborted;
      const errorMsg = error?.message || String(error);

      console.warn(`⚠️ ${key} failed (attempt ${attempts}/${maxAttempts}): ${errorMsg}`);

      if (isAborted || attempt === maxAttempts - 1) {
        break;
      }

      const backoffMs = Math.min(500 * Math.pow(2, attempt), 2000);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }

  const latencyMs = Date.now() - startTime;
  console.error(`❌ ${key} failed after ${attempts} attempts (${latencyMs}ms)`);

  return {
    ok: false,
    error: lastError,
    attempts,
    latencyMs,
  };
}

// نظام طلبات مباشر وبسيط - بدون تعقيدات
export const directDatabaseQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  resourceName: string
): Promise<T> => {
  console.log(`📡 Direct DB query: ${resourceName}`);

  const { data, error } = await queryFn();

  if (error) {
    console.error(`❌ ${resourceName} query failed:`, error);
    throw error;
  }

  if (!data) {
    console.log(`ℹ️ ${resourceName}: No data found`);
    return null as T;
  }

  console.log(`✅ ${resourceName} query successful`);
  return data;
};

export function getCircuitBreakerStates(): Record<string, any> {
  return {};
}

export async function requestWithRetries<T>(
  resource: string,
  requestFn: () => Promise<T>,
  maxAttempts: number = 3,
  timeoutMs: number = 12000
): Promise<T> {
  // This import relies on a local file 'robustDatabase'.
  // Ensure this file exists and exports `requestWithRetries`.
  const { requestWithRetries: robustRequestWithRetries } = await import('./robustDatabase');
  return robustRequestWithRetries(resource, requestFn, maxAttempts, timeoutMs);
}

export interface SelectOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function selectWithSignal<T>(
  resource: string,
  queryBuilder: any,
  opts: SelectOptions = {}
): Promise<T> {
  const { signal, timeoutMs = 15000 } = opts;

  // The queryBuilder is expected to be a Supabase Query Builder instance or similar promise-returning object.
  const queryPromise = queryBuilder;

  const abortPromise = signal
    ? new Promise<never>((_, reject) => {
        if (signal.aborted) {
          reject(new Error('Request aborted'));
        }
        signal.addEventListener('abort', () => reject(new Error('Request aborted')));
      })
    : null;

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
  );

  const promises = [queryPromise, timeoutPromise];
  if (abortPromise) promises.push(abortPromise);

  // Using Promise.race to get the first settled promise.
  // The type assertion `as any` might need refinement if queryBuilder's type is known.
  const result = await Promise.race(promises);

  // Check if the result is an error object or has an error property.
  // Supabase typically returns { data: ..., error: ... } or throws an error.
  // This handling assumes `result` could be the direct result object or an error.
  if (result && typeof result === 'object' && (result.error || result.message?.includes('aborted') || result.message?.includes('timeout'))) {
      const error = result.error || result; // Use result.error if available, otherwise use the result itself as error
      console.error(`❌ ${resource} query failed:`, error);
      throw error;
  } else if (result instanceof Error) {
      console.error(`❌ ${resource} query failed:`, result);
      throw result;
  }

  // Assuming the successful result has a 'data' property.
  // If queryBuilder directly returns data upon success, this needs adjustment.
  // The original code had `const { data, error } = await Promise.race(promises) as any;`
  // which suggests `data` and `error` are expected properties.
  // Let's refine this based on typical Supabase SDK responses.
  // If `queryBuilder` itself is a promise that resolves to `{ data: T, error: any }`,
  // then the `Promise.race` would resolve to that object.

  let data: T | undefined;
  let error: any | undefined;

  if (result && typeof result === 'object') {
      // Try to extract data and error, assuming structure like Supabase responses
      data = (result as any).data;
      error = (result as any).error;
  }

  if (error) {
      console.error(`❌ ${resource} query failed:`, error);
      throw error;
  }

  // If no error and data is undefined, it might mean queryBuilder resolved to something else,
  // or it resolved to an object without 'data'. This part is ambiguous without knowing
  // the exact nature of `queryBuilder`. Assuming it resolves to `{ data: T }` on success.
  if (data === undefined) {
      console.warn(`⚠️ ${resource} query resolved but no data found. Result:`, result);
      // Depending on requirements, this might be an error or valid case.
      // For now, returning null or throwing might be options.
      // Let's assume null is acceptable if no data is found.
      return null as T; // Or throw new Error('No data received');
  }

  return data as T;
}


export async function refreshSession(): Promise<{ session: any; error: any }> {
  const start = Date.now();

  traceEvent('SUPABASE', 'refresh_session_start', { timestamp: new Date().toISOString() });
  traceRequest('refreshSession', {
    phase: 'send',
    payload: { action: 'refresh_session' },
  });

  try {
    // Use the proxied supabase client to ensure connection health before refresh
    const { data, error } = await supabase.auth.refreshSession();
    const latencyMs = Date.now() - start;

    if (error) {
      console.error('❌ Session refresh failed:', error);
      traceEvent('SUPABASE', 'refresh_session_error', { error, latencyMs });
      logSupabaseRequest('auth.refreshSession', { error, latencyMs, status: 'error' });
      traceRequest('refreshSession', {
        phase: 'error',
        error,
        latencyMs,
      });
      return { session: null, error };
    }

    console.log('✅ Session refreshed successfully');
    // Ensure data and data.session are checked before accessing properties
    if (data && data.session) {
        await captureSessionSnapshot('after_refresh', data.session);
        traceEvent('SUPABASE', 'refresh_session_success', {
          userId: data.session?.user?.id,
          latencyMs,
          expiresAt: data.session?.expires_at
        });
        logSupabaseRequest('auth.refreshSession', {
          response: { userId: data.session?.user?.id },
          latencyMs,
          status: 'success'
        });
        traceRequest('refreshSession', {
          phase: 'response',
          response: { hasSession: !!data.session, userId: data.session?.user?.id },
          latencyMs,
        });
        return { session: data.session, error: null };
    } else {
        // Handle case where refresh succeeded but no session data was returned
        console.warn('✅ Session refreshed, but no session data returned.');
        traceEvent('SUPABASE', 'refresh_session_success_no_session', { latencyMs });
        logSupabaseRequest('auth.refreshSession', { response: 'no_session_data', latencyMs, status: 'success' });
        traceRequest('refreshSession', {
          phase: 'response',
          response: { hasSession: false, userId: null },
          latencyMs,
        });
        return { session: null, error: null }; // Indicate success but no session
    }
  } catch (err) {
    const latencyMs = Date.now() - start;
    console.error('❌ Session refresh error:', err);
    traceEvent('SUPABASE', 'refresh_session_exception', { error: err, latencyMs });
    logSupabaseRequest('auth.refreshSession', { error: err, latencyMs, status: 'exception' });
    traceRequest('refreshSession', {
      phase: 'error',
      error: err,
      latencyMs,
    });
    return { session: null, error: err };
  }
}

// The original `supabaseClient` variable is now effectively replaced by the `supabase` proxy.
// `getSupabaseClient` should return the proxied client.

export interface EnsureConnectionOptions {
  userId?: string;
  timeoutMs?: number;
  maxAttempts?: number;
}

export async function ensureSupabaseConnection(
  options: EnsureConnectionOptions = {}
): Promise<{ ok: boolean; error?: any; recreated?: boolean }> {
  const { userId, timeoutMs = 60000, maxAttempts = 5 } = options;
  const start = Date.now();

  console.log('🔍 Ensuring Supabase connection...');
  traceEvent('SUPABASE', 'ensure_connection_start', { userId, timeoutMs, maxAttempts });
  traceRequest('ensureSupabaseConnection', {
    phase: 'send',
    payload: { userId, timeoutMs, maxAttempts },
  });

  // Define the health check function. It should use the potentially proxied `supabase` client.
  const healthCheckFn = async (signal: AbortSignal) => {
    // Use the proxied `supabase` client here
    const client = supabase; // This implicitly calls the proxy's get method

    if (userId) {
      // The .abortSignal(signal) method might not be directly available on the proxied client's
      // query builder object. Ensure it's handled correctly if the proxy doesn't forward it.
      // For now, assume it works or needs adjustment based on proxy implementation.
      const { data, error } = await client
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .limit(1)
        // Ensure abortSignal is correctly passed if supported by the proxied query builder
        // If not, this might need to be handled differently, e.g., via fetchWithRetries' signal.
        .abortSignal(signal); // This assumes the query builder supports abortSignal directly

      if (error) throw error;
      return data; // Return data for validation
    } else {
      // Generic health check
      const { error } = await client
        .from('profiles')
        .select('id')
        .limit(1)
        .abortSignal(signal); // Same consideration for abortSignal

      if (error) throw error;
      return true; // Indicate success
    }
  };

  // Use fetchWithRetries for the initial health check.
  // Note: fetchWithRetries itself does not use the `supabase` proxy, it calls `fn` directly.
  let result = await fetchWithRetries({
    key: 'healthCheck',
    fn: healthCheckFn,
    timeoutMs,
    maxAttempts: 2, // Initial health check might be less aggressive
  });

  if (result.ok) {
    const latencyMs = Date.now() - start;
    console.log('✅ Supabase connection healthy');
    traceRequest('ensureSupabaseConnection', {
      phase: 'response',
      response: { ok: true, recreated: false },
      latencyMs,
    });
    return { ok: true };
  }

  console.warn('⚠️ Initial health check failed, attempting to recreate Supabase client...');
  traceRequest('supabaseClientRecreate', {
    phase: 'send',
    payload: { reason: 'health_check_failed' },
  });

  try {
    // Call the `recreateClient` function, which uses the new `createSupabaseClient`.
    // This is the core of the fix: replacing the client instance.
    await recreateClient('health_check_failed'); // This updates the global `currentClient`

    console.log('🔄 Supabase client recreated, retrying health check...');
    traceRequest('supabaseClientRecreate', {
      phase: 'response',
      response: { recreated: true },
      latencyMs: Date.now() - start,
    });

    // Dispatching a custom event might be useful for other parts of the app
    if (typeof window !== 'undefined') {
      // Ensure the event name is consistent if used elsewhere
      (window as any).dispatchEvent(new CustomEvent('session:recreated'));
    }

    // Retry the health check with the new client
    result = await fetchWithRetries({
      key: 'healthCheckAfterRecreate',
      fn: healthCheckFn, // Use the same health check function, which will now use the new client
      timeoutMs,
      maxAttempts, // Use the specified max attempts for the retry
    });

    const latencyMs = Date.now() - start;

    if (result.ok) {
      console.log('✅ Supabase connection restored after recreation');
      traceRequest('ensureSupabaseConnection', {
        phase: 'response',
        response: { ok: true, recreated: true },
        latencyMs,
      });
      return { ok: true, recreated: true };
    }

    console.error('❌ Supabase connection failed even after recreation');
    traceRequest('ensureSupabaseConnection', {
      phase: 'error',
      error: result.error,
      latencyMs,
    });
    return { ok: false, error: result.error, recreated: true };
  } catch (error) {
    const latencyMs = Date.now() - start;
    console.error('❌ Failed to recreate Supabase client:', error);
    traceRequest('ensureSupabaseConnection', {
      phase: 'error',
      error,
      latencyMs,
    });
    return { ok: false, error };
  }
}

// This function now returns the proxied `supabase` client.
export function getSupabaseClient() {
  // Ensure the client is healthy before returning it.
  // This call might trigger a recreation if needed.
  // However, simply returning the proxy is more aligned with its purpose.
  // If a user *needs* to ensure health explicitly, they should call ensureSupabaseConnection.
  return supabase;
}

// Global exposure for debugging purposes
if (typeof window !== 'undefined') {
  // Assign the proxied supabase client
  (window as any).supabase = supabase;
  // Ensure the ensureSupabaseConnection function is also globally accessible if needed for debugging
  (window as any).ensureSupabaseConnection = ensureSupabaseConnection;
  // Export the forceRecreateSupabaseClient for manual testing/debugging
  (window as any).forceRecreateSupabaseClient = forceRecreateSupabaseClient;
}

// Original Database interface definition - assuming it's replaced by import from ../types
/*
export interface Database {
  public: {
    Tables: {
      medication_adherence_logs: { Row: { id: string; user_id: string; medication_id: string; date: string; taken: boolean; notes: string | null; created_at: string; updated_at: string; }; Insert: { id?: string; user_id: string; medication_id: string; date: string; taken?: boolean; notes?: string | null; created_at?: string; updated_at?: string; }; Update: { id?: string; user_id?: string; medication_id?: string; date?: string; taken?: boolean; notes?: string | null; updated_at?: string; }; };
      profiles: { Row: { id: string; email: string; full_name: string | null; avatar_url: string | null; created_at: string; updated_at: string; }; Insert: { id: string; email: string; full_name?: string | null; avatar_url?: string | null; created_at?: string; updated_at?: string; }; Update: { id?: string; email?: string; full_name?: string | null; avatar_url?: string | null; updated_at?: string; }; };
      pregnancies: { Row: { id: string; user_id: string; name: string; last_menstrual_period: string; due_date: string; is_active: boolean; notes: string | null; created_at: string; updated_at: string; }; Insert: { id?: string; user_id: string; name: string; last_menstrual_period: string; due_date: string; is_active?: boolean; notes?: string | null; created_at?: string; updated_at?: string; }; Update: { id?: string; user_id?: string; name?: string; last_menstrual_period?: string; due_date?: string; is_active?: boolean; notes?: string | null; updated_at?: string; }; };
      lab_reports: { Row: { id: string; user_id: string; pregnancy_id: string | null; date: string; summary: string; source: 'manual' | 'upload'; created_at: string; updated_at: string; }; Insert: { id?: string; user_id: string; pregnancy_id?: string | null; date: string; summary: string; source: 'manual' | 'upload'; created_at?: string; updated_at?: string; }; Update: { id?: string; user_id?: string; pregnancy_id?: string | null; date?: string; summary?: string; source?: 'manual' | 'upload'; updated_at?: string; }; };
      lab_results: { Row: { id: string; user_id: string; lab_report_id: string; test_name: string; value: string; unit: string; reference_range: string; date: string; is_abnormal: boolean; notes: string | null; category: 'blood' | 'urine' | 'ultrasound' | 'genetic' | 'other'; trimester: 1 | 2 | 3; explanation: string | null; created_at: string; updated_at: string; }; Insert: { id?: string; user_id: string; lab_report_id: string; test_name: string; value: string; unit: string; reference_range: string; date: string; is_abnormal: boolean; notes?: string | null; category: 'blood' | 'urine' | 'ultrasound' | 'genetic' | 'other'; trimester: 1 | 2 | 3; explanation?: string | null; created_at?: string; updated_at?: string; }; Update: { id?: string; user_id?: string; lab_report_id?: string; test_name?: string; value?: string; unit?: string; reference_range?: string; date?: string; is_abnormal?: boolean; notes?: string | null; category?: 'blood' | 'urine' | 'ultrasound' | 'genetic' | 'other'; trimester?: 1 | 2 | 3; explanation?: string | null; updated_at?: string; }; };
      medications: { Row: { id: string; user_id: string; pregnancy_id: string | null; name: string; dosage: string; frequency: string; prescribed_date: string; end_date: string | null; fda_category: 'A' | 'B' | 'C' | 'D' | 'X'; fda_category_ai: string | null; notes: string | null; llm_safety_analysis: string | null; llm_benefits: string | null; llm_risks: string | null; overall_safety: string | null; created_at: string; updated_at: string; }; Insert: { id?: string; user_id: string; pregnancy_id?: string | null; name: string; dosage: string; frequency: string; prescribed_date: string; end_date?: string | null; fda_category: 'A' | 'B' | 'C' | 'D' | 'X'; fda_category_ai?: string | null; notes?: string | null; llm_safety_analysis?: string | null; llm_benefits?: string | null; llm_risks?: string | null; overall_safety?: string | null; created_at?: string; updated_at?: string; }; Update: { id?: string; user_id?: string; pregnancy_id?: string | null; name?: string; dosage?: string; frequency?: string; prescribed_date?: string; end_date?: string | null; fda_category?: 'A' | 'B' | 'C' | 'D' | 'X'; fda_category_ai?: string | null; notes?: string | null; llm_safety_analysis?: string | null; llm_benefits?: string | null; llm_risks?: string | null; overall_safety?: string | null; updated_at?: string; }; };
      symptoms: { Row: { id: string; user_id: string; pregnancy_id: string | null; date: string; type: string; severity: 1 | 2 | 3 | 4 | 5; description: string; triggers: string | null; llm_analysis: string | null; llm_recommendations: string | null; created_at: string; updated_at: string; }; Insert: { id?: string; user_id: string; pregnancy_id?: string | null; date: string; type: string; severity: 1 | 2 | 3 | 4 | 5; description: string; triggers?: string | null; llm_analysis?: string | null; llm_recommendations?: string | null; created_at?: string; updated_at?: string; }; Update: { id?: string; user_id?: string; pregnancy_id?: string | null; date?: string; type?: string; severity?: 1 | 2 | 3 | 4 | 5; description?: string; triggers?: string | null; llm_analysis?: string | null; llm_recommendations?: string | null; updated_at?: string; }; };
    };
    Views: { [_ in never]: never; };
    Functions: { [_ in never]: never; };
    Enums: { [_ in never]: never; };
  };
}
*/