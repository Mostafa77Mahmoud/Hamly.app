import { SupabaseClient, Session, AuthError } from '@supabase/supabase-js';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { diagnosticsLogger } from '@/utils/diagnostics';
import { startResumeTrace, endResumeTrace, traceRequest } from '@/utils/networkTracer';
import { generateRequestId } from '@/utils/requestIds';
import { traceEvent } from '@/utils/deepTracer';
import { captureSessionSnapshot } from '@/utils/sessionDebugger';
import { logSupabaseRequest, logAppStateChange } from '@/utils/logCollector';

type EventHandler = (...args: any[]) => void;

interface SessionManagerOptions {
  supabaseClient: SupabaseClient;
  storage?: typeof SecureStore;
}

interface EnsureSessionResult {
  sessionValid: boolean;
  wasRefreshed: boolean;
}

interface ConnectionHealth {
  isHealthy: boolean;
  latencyMs: number;
  lastChecked: number;
}

interface CircuitBreakerState {
  failures: number;
  state: 'closed' | 'open' | 'half-open';
  nextAttempt: number;
  lastFailure?: number;
}

interface AbortSignalResult {
  signal: AbortSignal;
  cancel: () => void;
}

interface WriteQueueItem<T = any> {
  id: string;
  operation: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  retryCount: number;
  createdAt: number;
  isPersisted: boolean;
}

const DEFAULT_CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 3,
  cooldownMs: 30000,
  timeoutMs: 15000, // Reduced to 15s - sequential loading handles slow connections better
};

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 2,
  initialDelayMs: 300,
  maxDelayMs: 3000,
};

const RESUME_DEBOUNCE_MS = 2000; // Constant for debounce

class SessionManagerClass {
  private supabaseClient: SupabaseClient | null = null;
  private storage: typeof SecureStore | null = null;
  private initialized = false;

  private eventHandlers: Map<string, Set<EventHandler>> = new Map();

  private singleFlightMap: Map<string, Promise<any>> = new Map();

  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();

  private abortControllers: Map<string, AbortController> = new Map();

  private writeQueue: WriteQueueItem[] = [];
  private processingQueue = false;

  private lastHealthCheck: ConnectionHealth = {
    isHealthy: true,
    latencyMs: 0,
    lastChecked: 0,
  };

  private appStateSubscription: any = null;
  private lastResumeTime = 0;
  // private readonly RESUME_DEBOUNCE_MS = 2000; // Moved to constant

  private globalRefreshLock = false;
  private refreshLockReason: string | null = null;

  async initSessionManager(options: SessionManagerOptions): Promise<void> {
    if (this.initialized) {
      this.log('debug', 'SessionManager already initialized, skipping');
      return;
    }

    this.supabaseClient = options.supabaseClient;
    this.storage = options.storage || SecureStore;
    this.initialized = true;

    this.setupAppStateListener();

    this.log('info', 'SessionManager initialized successfully');
    this.emit('manager:initialized', {});
  }

  async ensureSession(): Promise<EnsureSessionResult> {
    if (!this.supabaseClient) {
      throw new Error('SessionManager not initialized');
    }

    const start = Date.now();
    try {
      traceRequest('ensureSession', {
        phase: 'send',
        payload: { action: 'get_session' },
      });
    } catch (e) {
      console.warn('Trace error (non-critical):', e);
    }

    try {
      // محاولة getSession مع timeout protection
      let session, error;
      try {
        const result = await Promise.race([
          this.supabaseClient.auth.getSession(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('ensureSession timeout')), 3000)
          ),
        ]);
        session = result.data?.session;
        error = result.error;
      } catch (timeoutErr) {
        this.log('warn', '⏰ ensureSession getSession timed out, attempting recovery...');

        // محاولة recovery
        const { recoverSupabaseClient } = await import('@/utils/supabaseClientRecovery');
        const recoveryResult = await recoverSupabaseClient(
          this.supabaseClient,
          process.env.EXPO_PUBLIC_SUPABASE_URL!,
          process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
        );

        if (recoveryResult.recovered) {
          this.supabaseClient = recoveryResult.client;
          const retryResult = await this.supabaseClient.auth.getSession();
          session = retryResult.data?.session;
          error = retryResult.error;
          this.log('info', `✅ Session recovered via ${recoveryResult.method}`);
        } else {
          error = timeoutErr;
        }
      }

      const getSessionLatency = Date.now() - start;

      if (error || !session) {
        this.log('warn', 'No valid session found');
        traceRequest('ensureSession', {
          phase: 'response',
          response: { valid: false, wasRefreshed: false },
          latencyMs: getSessionLatency,
        });
        this.emit('session:validated', { valid: false, wasRefreshed: false });
        return { sessionValid: false, wasRefreshed: false };
      }

      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      if (timeUntilExpiry <= 0 || timeUntilExpiry < 10 * 60 * 1000) {
        this.log('info', 'Session expired or expiring soon, attempting refresh');

        try {
          const refreshStart = Date.now();
          const { data, error: refreshError } = await this.supabaseClient.auth.refreshSession();
          const refreshLatency = Date.now() - refreshStart;

          if (refreshError || !data.session) {
            this.log('error', 'Session refresh failed', { error: refreshError?.message });
            traceRequest('sessionRefresh', {
              phase: 'error',
              error: refreshError,
              latencyMs: refreshLatency,
            });
            this.emit('session:stale', { error: refreshError });
            this.emit('session:validated', { valid: false, wasRefreshed: false });
            return { sessionValid: false, wasRefreshed: false };
          }

          this.log('info', 'Session refreshed successfully');
          traceRequest('sessionRefresh', {
            phase: 'response',
            response: { refreshed: true, hasSession: !!data.session },
            latencyMs: refreshLatency,
          });
          this.emit('session:active', { wasRefreshed: true });
          this.emit('session:validated', { valid: true, wasRefreshed: true });

          const totalLatency = Date.now() - start;
          traceRequest('ensureSession', {
            phase: 'response',
            response: { valid: true, wasRefreshed: true },
            latencyMs: totalLatency,
          });
          return { sessionValid: true, wasRefreshed: true };
        } catch (refreshErr) {
          this.log('error', 'Session refresh error', { error: String(refreshErr) });
          traceRequest('sessionRefresh', {
            phase: 'error',
            error: refreshErr,
            latencyMs: Date.now() - start,
          });
          this.emit('session:stale', { error: refreshErr });
          this.emit('session:validated', { valid: false, wasRefreshed: false });
          return { sessionValid: false, wasRefreshed: false };
        }
      }

      this.emit('session:active', { wasRefreshed: false });
      this.emit('session:validated', { valid: true, wasRefreshed: false });

      const totalLatency = Date.now() - start;
      traceRequest('ensureSession', {
        phase: 'response',
        response: { valid: true, wasRefreshed: false },
        latencyMs: totalLatency,
      });
      return { sessionValid: true, wasRefreshed: false };
    } catch (err) {
      this.log('error', 'ensureSession error', { error: String(err) });
      traceRequest('ensureSession', {
        phase: 'error',
        error: err,
        latencyMs: Date.now() - start,
      });
      this.emit('session:validated', { valid: false, wasRefreshed: false });
      return { sessionValid: false, wasRefreshed: false };
    }
  }

  private setupAppStateListener(): void {
    if (Platform.OS === 'web') {
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
      }
    } else {
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    }
  }

  private handleVisibilityChange = async () => {
    const { traceLifecycle } = await import('@/utils/networkTracer');

    if (typeof document !== 'undefined') {
      const state = document.visibilityState;
      traceLifecycle('DocumentVisibility', { state });
      traceEvent('SESSION_MANAGER', 'visibility_change', { state });
      logAppStateChange(document.visibilityState === 'visible' ? 'hidden' : 'visible', state);

      if (state === 'visible') {
        await this.onResume();
      } else if (state === 'hidden') {
        await this.onBackground();
      }
    }
  };

  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    const { traceLifecycle } = await import('@/utils/networkTracer');
    const previousState = AppState.currentState;

    traceLifecycle('AppState', { state: nextAppState });
    traceEvent('SESSION_MANAGER', 'app_state_change', { from: previousState, to: nextAppState });
    logAppStateChange(previousState, nextAppState);

    if (nextAppState === 'active') {
      await this.onResume();
    } else if (nextAppState === 'background') {
      await this.onBackground();
    }
  };

  private resumeInProgress = false;
  private connectionHealthy = true;

  private async waitForNetworkStability(maxWaitMs: number = 8000, stepMs: number = 1000): Promise<boolean> {
    this.log('info', '🌐 Waiting for network stability before proceeding...');

    let stableCount = 0;
    const requiredStableChecks = 3; // Need 3 consecutive stable checks
    const maxTries = Math.floor(maxWaitMs / stepMs);

    for (let attempt = 0; attempt < maxTries; attempt++) {
      // Check network status
      const isOnline = Platform.OS === 'web' && typeof navigator !== 'undefined' 
        ? navigator.onLine 
        : true; // On native, assume available

      if (isOnline) {
        stableCount++;
        this.log('debug', `Network check ${attempt + 1}: stable (${stableCount}/${requiredStableChecks})`);
      } else {
        stableCount = 0; // Reset if unstable
        this.log('debug', `Network check ${attempt + 1}: unstable, resetting counter`);
      }

      // If we have 3 consecutive stable checks, we're good
      if (stableCount >= requiredStableChecks) {
        const waitedMs = attempt * stepMs;
        this.log('info', `✅ Network confirmed stable after ${waitedMs}ms (${stableCount} consecutive checks)`);
        return true;
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, stepMs));
    }

    // Timeout reached
    this.log('warn', `⚠️ Network stability timeout after ${maxWaitMs}ms - proceeding anyway (stableCount: ${stableCount})`);
    return false; // Proceed with caution
  }

  private async ensureSupabaseConnection(timeoutMs: number = 10000): Promise<boolean> {
    if (!this.supabaseClient) return false;

    try {
      this.log('debug', `🔌 Testing Supabase connection (timeout: ${timeoutMs}ms)...`);
      const startTime = Date.now();

      const { error } = await Promise.race([
        this.supabaseClient.from('profiles').select('id').limit(1).maybeSingle(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), timeoutMs)
        ),
      ]);

      const latency = Date.now() - startTime;

      if (error) {
        this.log('warn', '⚠️ Supabase connection test failed', { error: error.message, latency });
        this.connectionHealthy = false;
        return false;
      }

      this.log('info', '✅ Supabase connection healthy', { latency });
      this.connectionHealthy = true;
      return true;
    } catch (err) {
      this.log('error', '❌ Supabase connection check error', { error: String(err) });
      this.connectionHealthy = false;
      return false;
    }
  }

  private async waitForConnection(maxAttempts: number = 3): Promise<boolean> {
    this.log('info', '🔄 Waiting for stable connection...');

    // CRITICAL: First ensure network is actually stable (not just "online")
    this.log('info', '🌐 Step 1: Verifying network stability...');
    const networkStable = await this.waitForNetworkStability(8000, 1000);

    if (!networkStable) {
      this.log('warn', '⚠️ Network stability check inconclusive - proceeding with caution');
    } else {
      this.log('info', '✅ Network confirmed stable - proceeding to health checks');
    }

    // Step 2: Refresh session to avoid stale tokens (with REAL abort + timeout protection)
    this.log('info', '🔐 Step 2: Refreshing session token with timeout protection...');
    try {
      if (this.supabaseClient) {
        const refreshResult = await this.safeRefreshSession(8000);

        if (refreshResult.from === 'timeout_recovered' || refreshResult.status === 'timeout_recovered') {
          this.log('info', '✅ Safe refresh recovered from timeout, client recreated - continuing normal flow');
          // Client already recreated successfully, continue to health checks
          // No error - we can proceed normally
        } else if (refreshResult.from === 'timeout') {
          this.log('warn', '⏰ Session refresh TIMEOUT - will proceed with health checks', { 
            error: refreshResult.error?.message 
          });
        } else if (refreshResult.error) {
          this.log('warn', '⚠️ Session refresh failed (will proceed anyway)', { 
            error: refreshResult.error.message || String(refreshResult.error),
            from: refreshResult.from
          });
        } else if (refreshResult.data?.session) {
          this.log('info', '✅ Session refreshed successfully before health check');
        }
      }
    } catch (refreshErr) {
      // This should never happen since safeRefreshSession always returns a resolved promise
      this.log('error', '❌ Session refresh unexpected error (outer catch)', { error: String(refreshErr) });
    }

    // Step 3: Small buffer to let session settle
    await new Promise(resolve => setTimeout(resolve, 500));

    // Now try health checks with extended timeout (10s for resume scenarios)
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      this.log('debug', `🏥 Health check attempt ${attempt}/${maxAttempts}`);

      // Use 10s timeout for health checks after resume
      const isHealthy = await this.ensureSupabaseConnection(10000);

      if (isHealthy) {
        this.log('info', '✅ Connection established successfully');
        this.resetAllCircuitBreakers();
        return true;
      }

      // If first attempt failed, try recreating the Supabase client
      // (it might have stale HTTP connections after resume)
      if (attempt === 1) {
        this.log('warn', '⚠️ First health check failed - this may be due to stale client connection');
        this.log('info', '♻️ Attempting to recreate Supabase client for fresh connection...');

        try {
          // Import and recreate client
          const { ensureSupabaseConnection: recreateClient } = await import('@/utils/supabase');
          const recreateResult = await recreateClient({ timeoutMs: 10000, maxAttempts: 1 });

          if (recreateResult.recreated) {
            this.log('info', '✅ Supabase client recreated - retrying health check');
            // Try one more time immediately with the fresh client
            const retryHealthy = await this.ensureSupabaseConnection(10000);
            if (retryHealthy) {
              this.log('info', '✅ Connection established after client recreation');
              this.resetAllCircuitBreakers();
              return true;
            }
          }
        } catch (recreateErr) {
          this.log('warn', '⚠️ Client recreation failed (non-critical)', { error: String(recreateErr) });
        }
      }

      if (attempt === maxAttempts) {
        this.log('warn', '♻️ All health checks failed after network stability - connection issue may be deeper');
      }

      if (attempt < maxAttempts) {
        const delay = 2000 * attempt; // 2s, 4s delays
        this.log('debug', `⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    this.log('warn', '⚠️ Failed to establish connection after all attempts');
    return false;
  }

  private resetAllCircuitBreakers(): void {
    this.log('info', '🔄 Resetting all circuit breakers after successful connection');
    this.circuitBreakers.forEach((breaker, resource) => {
      breaker.failures = 0;
      breaker.state = 'closed';
      breaker.nextAttempt = 0;
      this.log('debug', `Reset circuit breaker: ${resource}`);
    });
  }

  async onBackground(): Promise<void> {
    this.log('info', 'App going to background');
    traceEvent('SESSION_MANAGER', 'on_background_start', {});

    // 📸 التقاط حالة SDK قبل الذهاب للخلفية
    if (this.supabaseClient) {
      try {
        const { captureSDKStateBeforeSuspend, storeSessionForRecovery } = await import('@/utils/supabaseClientRecovery');
        await captureSDKStateBeforeSuspend(this.supabaseClient);

        // حفظ session الحالية للاستعادة لاحقاً
        const { data } = await this.supabaseClient.auth.getSession();
        if (data?.session) {
          await storeSessionForRecovery(data.session);
          this.log('info', '💾 Session saved before background');
        }
      } catch (err) {
        this.log('warn', '⚠️ Failed to capture SDK state before background', { error: String(err) });
      }
    }

    this.abortControllers.forEach((controller, key) => {
      if (!key.startsWith('user_write_') && !key.startsWith('write_')) {
        this.log('debug', 'Aborting background request', { key });
        traceEvent('SESSION_MANAGER', 'abort_request', { key });
        controller.abort();
        this.abortControllers.delete(key);
      }
    });

    await this.persistWriteQueue();
    this.emit('app:background', {});
    traceEvent('SESSION_MANAGER', 'on_background_complete', {});
  }

  private async persistWriteQueue(): Promise<void> {
    if (this.writeQueue.length === 0) {
      return;
    }

    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const queueData = this.writeQueue.map(item => ({
        id: item.id,
        retryCount: item.retryCount,
        createdAt: item.createdAt,
        isPersisted: true,
      }));

      await AsyncStorage.setItem('session_write_queue', JSON.stringify(queueData));
      this.log('info', 'Persisted write queue', { count: queueData.length });
    } catch (error) {
      this.log('error', 'Failed to persist write queue', { error: String(error) });
    }
  }

  private async safeRefreshSession(
    timeoutMs: number = 8000
  ): Promise<{ 
    data?: { session: Session | null };
    session: Session | null; 
    error: AuthError | null;
    from?: string;
    status?: string;
  }> {
    const requestId = generateRequestId('safe_refresh');
    const { traceSupabaseSDK } = await import('@/utils/networkTracer');

    this.log('info', '🔐 Starting manual session restoration (resume-safe)...', { timeoutMs });

    try {
      if (!this.supabaseClient) {
        this.log('error', '❌ Supabase client not initialized');
        return {
          data: { session: null },
          session: null,
          error: new AuthError('Supabase client not initialized'),
          from: 'client_null',
          status: 'error'
        };
      }

      // Trace SDK state before calling
      traceSupabaseSDK('beforeGetSession', {
        clientExists: !!this.supabaseClient,
        hasAuthClient: !!(this.supabaseClient as any).auth,
      });

      // Step 1: Check current session from cache/storage with timeout protection
      this.log('debug', '📡 Getting current session from storage...');
      const getSessionStart = Date.now();

      let currentData, getError;
      try {
        const result = await Promise.race([
          this.supabaseClient.auth.getSession(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('getSession timeout')), 5000)
          ),
        ]);
        currentData = result.data;
        getError = result.error;
      } catch (timeoutErr) {
        this.log('warn', '⏰ getSession timed out, attempting recovery...');
        traceSupabaseSDK('getSessionTimeout', { timeoutMs: 5000 });

        // Try recovery
        const { recoverSupabaseClient } = await import('@/utils/supabaseClientRecovery');
        const recoveryResult = await recoverSupabaseClient(
          this.supabaseClient,
          process.env.EXPO_PUBLIC_SUPABASE_URL!,
          process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
        );

        if (recoveryResult.recovered) {
          this.supabaseClient = recoveryResult.client;
          const retryResult = await this.supabaseClient.auth.getSession();
          currentData = retryResult.data;
          getError = retryResult.error;
        } else {
          getError = timeoutErr as AuthError;
        }
      }

      const getSessionLatency = Date.now() - getSessionStart;

      traceSupabaseSDK('afterGetSession', {
        latencyMs: getSessionLatency,
        hasData: !!currentData,
        hasSession: !!currentData?.session,
        hasError: !!getError,
      });

      if (getError) {
        this.log('error', '❌ Error getting session', { error: getError });
        return { 
          data: { session: null },
          session: null, 
          error: getError, 
          from: 'get_session_error' 
        };
      }

      // Step 2: If session exists, verify it's valid
      if (currentData?.session) {
        const expiresAt = currentData.session.expires_at;
        const now = Math.floor(Date.now() / 1000);

        if (expiresAt && expiresAt > now + 60) { // Valid for at least 1 more minute
          this.log('info', '✅ Session restored from cache (still valid)', {
            expiresIn: expiresAt - now
          });
          return { 
            data: { session: currentData.session },
            session: currentData.session, 
            error: null, 
            from: 'cache', 
            status: 'valid' 
          };
        }
      }

      // Step 3: If no valid session, try to refresh using stored token
      this.log('warn', '⚠️ Session missing or expired, attempting token-based restoration...');

      // Get refresh token from current session if available
      const refreshToken = currentData?.session?.refresh_token;

      if (refreshToken) {
        this.log('debug', '🔄 Refreshing with stored refresh token...');
        const { data: refreshData, error: refreshError } = await this.supabaseClient.auth.refreshSession({
          refresh_token: refreshToken
        });

        if (!refreshError && refreshData?.session) {
          this.log('info', '✅ Session refreshed successfully with token');
          return { 
            data: { session: refreshData.session },
            session: refreshData.session, 
            error: null, 
            from: 'token_refresh', 
            status: 'success' 
          };
        }

        this.log('warn', '❌ Token refresh failed', { error: refreshError });
      }

      // Step 4: Last resort - recreate client
      this.log('warn', '♻️ Recreating Supabase client (no valid session found)...');
      await this.recreateSupabaseClient();

      if (!this.supabaseClient) {
        return {
          data: { session: null },
          session: null,
          error: new AuthError('Failed to recreate Supabase client'),
          from: 'recreation_failed',
          status: 'error'
        };
      }

      // Try one more time after recreation
      const { data: finalData, error: finalError } = await this.supabaseClient.auth.getSession();

      if (finalData?.session) {
        this.log('info', '✅ Session restored after client recreation');

        // Store session for future recovery
        const { storeSessionForRecovery } = await import('@/utils/supabaseClientRecovery');
        await storeSessionForRecovery(finalData.session);

        return { 
          data: { session: finalData.session },
          session: finalData.session, 
          error: null, 
          from: 'client_recreation', 
          status: 'success' 
        };
      }

      return { 
        data: { session: null },
        session: null, 
        error: finalError || new AuthError('Session restoration failed after client recreation'),
        from: 'recreation_failed',
        status: 'error'
      };

    } catch (err) {
      this.log('error', '❌ Exception in safeRefreshSession', { error: err });
      return {
        data: { session: null },
        session: null,
        error: err as AuthError,
        from: 'exception',
        status: 'error'
      };
    }
  }

  private async recreateSupabaseClient(): Promise<void> {
    this.log('info', '♻️ Recreating Supabase client...');

    try {
      // Clean up any stale channels/connections before recreating
      if (this.supabaseClient) {
        try {
          this.log('debug', '🧹 Cleaning up stale channels...');
          await this.supabaseClient.removeAllChannels();
        } catch (cleanupErr) {
          this.log('warn', '⚠️ Channel cleanup failed (non-critical)', { error: cleanupErr });
        }
      }

      // Import dynamically to avoid circular deps
      const { getSupabaseClient } = await import('@/utils/supabase');
      this.supabaseClient = getSupabaseClient();

      this.log('info', '✅ Supabase client recreated successfully');
    } catch (err) {
      this.log('error', '❌ Failed to recreate Supabase client', { error: err });
      throw err;
    }
  }

  private async onResume(): Promise<void> {
    const resumeId = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = Date.now();

    this.log('info', `[${resumeId}] 🔔 onResume triggered`, {
      timeSinceLastResume: now - this.lastResumeTime,
      debounceThreshold: RESUME_DEBOUNCE_MS,
      resumeInProgress: this.resumeInProgress,
      globalRefreshLock: this.globalRefreshLock,
      refreshLockReason: this.refreshLockReason
    });

    // Debounce: skip if called too soon
    if (now - this.lastResumeTime < RESUME_DEBOUNCE_MS) {
      this.log('debug', `[${resumeId}] ⏭️ Debounced (too soon)`);
      return;
    }

    // Skip if another resume is already running or locked
    if (this.resumeInProgress || this.globalRefreshLock) {
      this.log('debug', `[${resumeId}] ⏭️ Resume already in progress or locked, skipping`);
      return;
    }

    // Update timestamp immediately to prevent rapid-fire resumes
    this.lastResumeTime = now;

    this.resumeInProgress = true;
    this.log('info', `[${resumeId}] ▶️ Resume processing started`);

    // 🔍 START RESUME TRACE
    const traceId = startResumeTrace();

    // Acquire global refresh lock for resume
    this.globalRefreshLock = true;
    this.refreshLockReason = 'app_resume';
    this.log('info', `[${resumeId}] 🔒 Acquired global refresh lock for resume`);
    diagnosticsLogger.logEvent('resync:start', { reason: 'app_resume', lockAcquired: true, resumeId });

    const startTime = Date.now();

    // Safety timeout: force unlock after 15 seconds no matter what
    const forceUnlockTimer = setTimeout(() => {
      if (this.globalRefreshLock || this.resumeInProgress) {
        this.log('warn', `[${resumeId}] ⏰ Force unlocking after 15s timeout (safety fallback)`);
        this.globalRefreshLock = false;
        this.resumeInProgress = false;
        this.refreshLockReason = null;
      }
    }, 15000);

    // Reset circuit breakers before resume to give fresh chance
    this.log('info', `[${resumeId}] 🔄 Resetting circuit breakers for fresh resume`);
    this.circuitBreakers.forEach((breaker, resource) => {
      if (breaker.state === 'open') {
        breaker.state = 'half-open';
        breaker.failures = 0;
        this.log('debug', `[${resumeId}] Reset circuit breaker for ${resource}`);
      }
    });

    try {
      // 📸 التقاط حالة SDK بعد العودة من الخلفية
      if (this.supabaseClient) {
        try {
          const { captureSDKStateAfterResume } = await import('@/utils/supabaseClientRecovery');
          await captureSDKStateAfterResume(this.supabaseClient);
        } catch (err) {
          this.log('warn', '⚠️ Failed to capture SDK state after resume', { error: String(err) });
        }
      }

      // 🔍 محاولة استعادة client أولاً قبل session check
      this.log('info', `[${resumeId}] 🔌 Attempting SDK recovery before session check...`);

      const { recoverSupabaseClient } = await import('@/utils/supabaseClientRecovery');

      const recoveryResult = await recoverSupabaseClient(
        this.supabaseClient!,
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
      );

      if (recoveryResult.recovered) {
        this.log('info', `[${resumeId}] ♻️ Supabase client recovered via ${recoveryResult.method}`);
        this.supabaseClient = recoveryResult.client;
      } else {
        this.log('info', `[${resumeId}] ✅ Current client still valid (${recoveryResult.method})`);
      }

      this.log('info', `[${resumeId}] 🔐 Checking session...`);
      const sessionResult = await this.ensureSession();
      diagnosticsLogger.logEvent('session:checked', { 
        valid: sessionResult.sessionValid, 
        wasRefreshed: sessionResult.wasRefreshed,
        resumeId 
      });

      if (!sessionResult.sessionValid) {
        this.log('warn', `[${resumeId}] ⚠️ Session invalid after resume, skipping resync`);
        this.emit('session:stale', { onResume: true, resumeId });
        return;
      }

      this.log('info', `[${resumeId}] 🔌 Ensuring Supabase connection is healthy...`);

      const connectionReady = await this.waitForConnection(3);

      if (!connectionReady) {
        this.log('error', `[${resumeId}] ❌ Failed to establish stable connection`);
        this.emit('resync:delayed', { reason: 'connection_failed', resumeId });
        // Fall back to cached data
        return;
      }

      this.log('info', `[${resumeId}] 📡 Session valid, connection healthy, starting resync...`);
      this.emit('resync:start', { reason: 'app_resume', resumeId });

      const resyncStartTime = Date.now();
      await this.phasedResyncSequential(resumeId);
      const resyncDuration = Date.now() - resyncStartTime;

      this.log('info', `[${resumeId}] ✅ Phased resync completed in ${resyncDuration}ms`);
      this.emit('resync:complete', { reason: 'app_resume', success: true, resumeId, resyncDuration });

      this.log('info', `[${resumeId}] 📝 Restoring write queue...`);
      await this.restoreAndProcessWriteQueue();

      this.emit('session:resumed', { resumeId });

      const totalDuration = Date.now() - startTime;
      this.log('info', `[${resumeId}] 🎉 Resume handled successfully (total: ${totalDuration}ms)`);
      diagnosticsLogger.logEvent('resync:complete', { 
        reason: 'app_resume', 
        success: true, 
        duration: totalDuration,
        resumeId 
      });

      // 🔍 END RESUME TRACE - SUCCESS
      endResumeTrace(true);
    } catch (err) {
      this.log('error', `[${resumeId}] ❌ Resume handling failed, using cached data`, {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        duration: Date.now() - startTime
      });
      diagnosticsLogger.logEvent('resync:complete', {
        reason: 'app_resume',
        success: false,
        error: err instanceof Error ? err.message : String(err),
        duration: Date.now() - startTime,
        resumeId,
        fallbackMode: 'cached_data'
      });

      // 🔍 END RESUME TRACE - ERROR
      endResumeTrace(false);

      // Emit event to notify UI that we're using cached data
      this.emit('resync:fallback', { reason: 'timeout', resumeId });

      // Schedule a retry in background after 5 seconds
      setTimeout(() => {
        this.log('info', `[${resumeId}] ⏰ Attempting background retry after failure`);
        this.requestResync('background_retry_after_resume_failure').catch(retryErr => {
          this.log('warn', `[${resumeId}] Background retry also failed`, { error: String(retryErr) });
        });
      }, 5000);

      // Don't throw, allow app to continue with cached data
    } finally {
      // Clear the force unlock timer
      clearTimeout(forceUnlockTimer);

      // Force unlock no matter what (safety fallback)
      this.resumeInProgress = false;
      this.globalRefreshLock = false;
      this.refreshLockReason = null;
      this.log('info', `[${resumeId}] 🔓 Force released global refresh lock (safety fallback)`);

      diagnosticsLogger.logEvent('refreshLock:released', { reason: 'app_resume', resumeId, forced: true });
    }
  }

  private async phasedResyncSequential(resumeId: string): Promise<void> {
    const phaseId = `phased_resync_${Date.now()}`;

    this.log('info', `[${phaseId}] 🎬 Starting SEQUENTIAL phased resync after resume...`);

    try {
      // Phase 1: Critical data first (ONE AT A TIME to avoid timeout)
      this.log('info', `[${phaseId}] 📋 Phase 1: Loading profile (sequential)`);
      this.emit('resync:phase', { phase: 1, resources: ['profile'], phaseId });
      diagnosticsLogger.logEvent('resync:phase:start', { phase: 1, resources: ['profile'], phaseId });

      const profileLoader = this.resourceLoaders.get('profile');
      if (profileLoader) {
        await this.singleFlightRequest('profile', profileLoader);
        this.log('debug', `[${phaseId}] ✅ profile loaded`);
      }

      await new Promise(resolve => setTimeout(resolve, 500)); // Small pause

      this.log('info', `[${phaseId}] 📋 Phase 2: Loading activePregnancy (sequential)`);
      this.emit('resync:phase', { phase: 2, resources: ['activePregnancy'], phaseId });
      diagnosticsLogger.logEvent('resync:phase:start', { phase: 2, resources: ['activePregnancy'], phaseId });

      const pregnancyLoader = this.resourceLoaders.get('activePregnancy');
      if (pregnancyLoader) {
        await this.singleFlightRequest('activePregnancy', pregnancyLoader);
        this.log('debug', `[${phaseId}] ✅ activePregnancy loaded`);
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      // Phase 3: Secondary data (can be parallel now)
      const phase3Start = Date.now();
      this.log('info', `[${phaseId}] 📋 Phase 3: Loading medications & symptoms (parallel)`);
      this.emit('resync:phase', { phase: 3, resources: ['medications', 'symptoms'], phaseId });
      diagnosticsLogger.logEvent('resync:phase:start', { phase: 3, resources: ['medications', 'symptoms'], phaseId });

      await Promise.all(
        ['medications', 'symptoms'].map(async (resource) => {
          const loader = this.resourceLoaders.get(resource);
          if (loader) {
            this.log('debug', `[${phaseId}] 🔄 Loading ${resource}...`);
            await this.singleFlightRequest(resource, loader);
            this.log('debug', `[${phaseId}] ✅ ${resource} loaded`);
          }
        })
      );

      const phase3Duration = Date.now() - phase3Start;
      this.log('info', `[${phaseId}] ✅ Phase 3 complete (${phase3Duration}ms)`);
      diagnosticsLogger.logEvent('resync:phase:complete', { phase: 3, duration: phase3Duration, phaseId });

      await new Promise(resolve => setTimeout(resolve, 300));

      // Phase 4: Labs (lowest priority, can fail without breaking app)
      const phase4Start = Date.now();
      this.log('info', `[${phaseId}] 📋 Phase 4: Loading labs (optional)`);
      this.emit('resync:phase', { phase: 4, resources: ['labs'], phaseId });
      diagnosticsLogger.logEvent('resync:phase:start', { phase: 4, resources: ['labs'], phaseId });

      const labsLoader = this.resourceLoaders.get('labs');
      if (labsLoader) {
        try {
          await this.singleFlightRequest('labs', labsLoader);
          this.log('debug', `[${phaseId}] ✅ labs loaded`);
        } catch (labErr) {
          this.log('warn', `[${phaseId}] ⚠️ Labs loading failed (non-critical)`, { error: String(labErr) });
        }
      }

      const phase4Duration = Date.now() - phase4Start;
      this.log('info', `[${phaseId}] ✅ Phase 4 complete (${phase4Duration}ms)`);
      diagnosticsLogger.logEvent('resync:phase:complete', { phase: 4, duration: phase4Duration, phaseId });

      this.log('info', `[${phaseId}] 🎉 Sequential phased resync completed successfully`);
    } catch (err) {
      this.log('error', `[${phaseId}] ❌ Sequential phased resync failed`, { 
        error: String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      diagnosticsLogger.logEvent('resync:phase:failed', { error: String(err), phaseId });
      throw err;
    }
  }

  private async phasedResyncNetworkOnly(): Promise<void> {
    // Keep old parallel version for non-resume resync requests
    const phaseId = `phased_resync_${Date.now()}`;
    const phase1Resources = ['profile', 'activePregnancy'];
    const phase2Resources = ['medications', 'symptoms'];
    const phase3Resources = ['labs'];

    this.log('info', `[${phaseId}] 🎬 Starting phased resync (parallel mode)...`);

    try {
      const phase1Start = Date.now();
      this.log('info', `[${phaseId}] 📋 Phase 1: Loading ${phase1Resources.join(', ')}`);
      this.emit('resync:phase', { phase: 1, resources: phase1Resources, phaseId });
      diagnosticsLogger.logEvent('resync:phase:start', { phase: 1, resources: phase1Resources, phaseId });

      await Promise.all(
        phase1Resources.map(async (resource) => {
          const loader = this.resourceLoaders.get(resource);
          if (loader) {
            await this.singleFlightRequest(resource, loader);
          }
        })
      );

      const phase1Duration = Date.now() - phase1Start;
      diagnosticsLogger.logEvent('resync:phase:complete', { phase: 1, duration: phase1Duration, phaseId });

      await new Promise(resolve => setTimeout(resolve, 100));

      await Promise.all(
        phase2Resources.map(async (resource) => {
          const loader = this.resourceLoaders.get(resource);
          if (loader) {
            await this.singleFlightRequest(resource, loader);
          }
        })
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      await Promise.all(
        phase3Resources.map(async (resource) => {
          const loader = this.resourceLoaders.get(resource);
          if (loader) {
            await this.singleFlightRequest(resource, loader);
          }
        })
      );

      this.log('info', `[${phaseId}] 🎉 Parallel phased resync completed successfully`);
    } catch (err) {
      this.log('error', `[${phaseId}] ❌ Parallel phased resync failed`, { 
        error: String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      diagnosticsLogger.logEvent('resync:phase:failed', { error: String(err), phaseId });
      throw err;
    }
  }

  private async restoreAndProcessWriteQueue(): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const stored = await AsyncStorage.getItem('session_write_queue');

      if (stored) {
        const queueData = JSON.parse(stored);
        this.log('info', 'Restored write queue', { count: queueData.length });
        await AsyncStorage.removeItem('session_write_queue');

        if (this.writeQueue.length > 0) {
          this.log('info', 'Processing write queue after resume');
          this.processWriteQueue();
        }
      }
    } catch (error) {
      this.log('error', 'Failed to restore write queue', { error: String(error) });
    }
  }

  async requestResync(reason: string): Promise<void> {
    const resyncKey = 'global_resync';

    // Check global refresh lock
    if (this.globalRefreshLock) {
      this.log('debug', `🛑 Global refresh lock active (reason: ${this.refreshLockReason}), skipping resync request: ${reason}`);
      return;
    }

    if (this.singleFlightMap.has(resyncKey)) {
      this.log('debug', 'Resync already in progress, reusing promise');
      return this.singleFlightMap.get(resyncKey)!;
    }

    const resyncPromise = this.executeResync(reason);
    this.singleFlightMap.set(resyncKey, resyncPromise);

    try {
      await resyncPromise;
    } finally {
      this.singleFlightMap.delete(resyncKey);
    }
  }

  private async executeResync(reason: string): Promise<void> {
    // Acquire global refresh lock
    this.acquireRefreshLock(reason);

    this.emit('resync:start', { reason });

    this.cancelSafeCancellableRequests();

    try {
      await this.phasedResync();

      this.log('info', 'Resync completed successfully');
      this.emit('resync:complete', { reason, success: true });
    } catch (err) {
      this.log('error', 'Resync failed', { reason, error: String(err) });
      this.emit('resync:complete', { reason, success: false, error: err });
      throw err;
    } finally {
      // Release global refresh lock
      this.releaseRefreshLock(reason);
    }
  }

  private resourceLoaders: Map<string, () => Promise<any>> = new Map();

  registerResourceLoader(resourceName: string, loader: () => Promise<any>): void {
    this.resourceLoaders.set(resourceName, loader);
    this.log('debug', 'Registered resource loader', { resourceName });
  }

  // Mock dataContext for compilation, assuming it has refreshProfile and refreshActivePregnancy
  private dataContext: any = {
    refreshProfile: async (force: boolean) => { /* mock implementation */ },
    refreshActivePregnancy: async (force: boolean) => { /* mock implementation */ }
  };

  private async phasedResync(): Promise<void> {
    const phase1Resources = ['profile', 'activePregnancy'];
    const phase2Resources = ['medications', 'symptoms'];
    const phase3Resources = ['labs'];

    try {
      this.log('info', 'Phase 1: Loading profile + pregnancy');
      await Promise.all(
        phase1Resources.map(async (resource) => {
          const loader = this.resourceLoaders.get(resource);
          if (loader) {
            await this.singleFlightRequest(resource, loader);
          } else {
            this.log('warn', `No loader registered for ${resource}`);
          }
        })
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      this.log('info', 'Phase 2: Loading medications + symptoms');
      await Promise.all(
        phase2Resources.map(async (resource) => {
          const loader = this.resourceLoaders.get(resource);
          if (loader) {
            await this.singleFlightRequest(resource, loader);
          } else {
            this.log('warn', `No loader registered for ${resource}`);
          }
        })
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      this.log('info', 'Phase 3: Loading labs');
      await Promise.all(
        phase3Resources.map(async (resource) => {
          const loader = this.resourceLoaders.get(resource);
          if (loader) {
            await this.singleFlightRequest(resource, loader);
          } else {
            this.log('warn', `No loader registered for ${resource}`);
          }
        })
      );

      this.log('info', 'Phased resync completed successfully');
    } catch (err) {
      this.log('error', 'Phased resync failed', { error: String(err) });
      throw err;
    }
  }

  private cancelSafeCancellableRequests(): void {
    this.abortControllers.forEach((controller, key) => {
      if (!key.startsWith('user_write_')) {
        this.log('debug', 'Aborting safe-cancellable request', { key });
        controller.abort();
        this.abortControllers.delete(key);
      }
    });
  }

  async singleFlightRequest<T>(
    resourceName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    if (this.singleFlightMap.has(resourceName)) {
      this.log('debug', 'Single-flight: reusing existing promise', { resourceName });
      return this.singleFlightMap.get(resourceName)!;
    }

    const promise = this.executeWithCircuitBreaker(resourceName, operation);
    this.singleFlightMap.set(resourceName, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.singleFlightMap.delete(resourceName);
    }
  }

  private async executeWithCircuitBreaker<T>(
    resourceName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const breaker = this.getCircuitBreaker(resourceName);

    if (breaker.state === 'open') {
      const now = Date.now();
      if (now < breaker.nextAttempt) {
        this.log('warn', 'Circuit breaker is OPEN', { resourceName, nextAttempt: breaker.nextAttempt });
        this.emit('circuit:open', { resourceName });
        throw new Error(`Circuit breaker open for ${resourceName}`);
      } else {
        this.log('info', 'Circuit breaker entering HALF-OPEN', { resourceName });
        breaker.state = 'half-open';
      }
    }

    try {
      const result = await this.retryWithBackoff(resourceName, operation);

      this.log('debug', 'Circuit breaker: operation succeeded', { resourceName });
      breaker.failures = 0;
      breaker.state = 'closed';

      return result;
    } catch (err) {
      breaker.failures++;
      breaker.lastFailure = Date.now();

      this.log('warn', 'Circuit breaker: operation failed', {
        resourceName,
        failures: breaker.failures,
        threshold: DEFAULT_CIRCUIT_BREAKER_CONFIG.failureThreshold,
      });

      if (breaker.failures >= DEFAULT_CIRCUIT_BREAKER_CONFIG.failureThreshold) {
        breaker.state = 'open';
        breaker.nextAttempt = Date.now() + DEFAULT_CIRCUIT_BREAKER_CONFIG.cooldownMs;
        this.log('error', 'Circuit breaker OPENED', { resourceName });
        this.emit('circuit:open', { resourceName });
      }

      this.emit('resource:failure', { resourceName, error: err });
      throw err;
    }
  }

  private getCircuitBreaker(resourceName: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(resourceName)) {
      this.circuitBreakers.set(resourceName, {
        failures: 0,
        state: 'closed',
        nextAttempt: 0,
      });
    }
    return this.circuitBreakers.get(resourceName)!;
  }

  private async retryWithBackoff<T>(
    resourceName: string,
    operation: () => Promise<T>,
    maxRetries = DEFAULT_RETRY_CONFIG.maxRetries
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const timeoutMs = DEFAULT_CIRCUIT_BREAKER_CONFIG.timeoutMs;
        const result = await this.withTimeout(operation(), timeoutMs);

        if (attempt > 0) {
          this.log('info', 'Retry succeeded', { resourceName, attempt });
        }

        return result;
      } catch (err: any) {
        lastError = err;

        const is4xx = err?.status >= 400 && err?.status < 500;
        if (is4xx) {
          this.log('warn', 'Non-retryable 4xx error', { resourceName, status: err?.status });
          throw err;
        }

        if (attempt < maxRetries) {
          const delay = Math.min(
            DEFAULT_RETRY_CONFIG.initialDelayMs * Math.pow(2, attempt),
            DEFAULT_RETRY_CONFIG.maxDelayMs
          );
          this.log('debug', 'Retrying after delay', { resourceName, attempt: attempt + 1, delayMs: delay });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.log('error', 'All retries exhausted', { resourceName });
    throw lastError;
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  createAbortSignal(timeoutMs?: number): AbortSignalResult {
    const controller = new AbortController();

    if (timeoutMs) {
      setTimeout(() => controller.abort(), timeoutMs);
    }

    return {
      signal: controller.signal,
      cancel: () => controller.abort(),
    };
  }

  registerAbortController(key: string, controller: AbortController): void {
    if (this.abortControllers.has(key)) {
      this.abortControllers.get(key)?.abort();
    }
    this.abortControllers.set(key, controller);
  }

  cancelRequest(key: string): void {
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
      this.log('debug', 'Request cancelled', { key });
    }
  }

  async enqueueWrite<T>(
    operationId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const writeItem: WriteQueueItem<T> = {
        id: operationId,
        operation,
        resolve,
        reject,
        retryCount: 0,
        createdAt: Date.now(),
        isPersisted: false,
      };

      this.writeQueue.push(writeItem);
      this.log('info', 'Write operation enqueued', { operationId, queueLength: this.writeQueue.length });
      this.emit('write:queued', { operationId });

      this.processWriteQueue();
    });
  }

  private async processWriteQueue(): Promise<void> {
    if (this.processingQueue || this.writeQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    while (this.writeQueue.length > 0) {
      const item = this.writeQueue.shift()!;
      await this.processWriteItem(item);
    }

    this.processingQueue = false;
  }

  private async processWriteItem<T>(item: WriteQueueItem<T>): Promise<void> {
    try {
      this.log('info', 'Processing write operation', { id: item.id, attempt: item.retryCount + 1 });

      const result = await this.retryWithBackoff(`write_${item.id}`, item.operation, 3);

      this.log('info', 'Write operation completed', { id: item.id });
      this.emit('write:processed', { operationId: item.id, success: true });
      item.resolve(result);
    } catch (err) {
      item.retryCount++;

      if (item.retryCount <= 3) {
        const delay = 1000 * Math.pow(2, item.retryCount - 1);
        this.log('warn', 'Write operation failed, retrying', { id: item.id, retryCount: item.retryCount, delayMs: delay });

        setTimeout(() => {
          this.writeQueue.unshift(item);
          this.processWriteQueue();
        }, delay);
      } else {
        this.log('error', 'Write operation exhausted retries', { id: item.id });
        this.emit('write:processed', { operationId: item.id, success: false, error: err });
        item.reject(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }

  private async testConnectivity(): Promise<{ connected: boolean; latency: number }> {
    const startTime = Date.now();

    try {
      if (!this.supabaseClient) {
        return { connected: false, latency: 0 };
      }

      // Quick ping test with 5s timeout
      await Promise.race([
        this.supabaseClient.from('profiles').select('id').limit(1).maybeSingle(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connectivity test timeout')), 5000)
        ),
      ]);

      const latency = Date.now() - startTime;
      this.log('debug', 'Connectivity test passed', { latency });
      return { connected: true, latency };
    } catch (err) {
      const latency = Date.now() - startTime;
      this.log('warn', 'Connectivity test failed', { error: String(err), latency });
      return { connected: false, latency };
    }
  }

  async getConnectionHealth(): Promise<ConnectionHealth> {
    const now = Date.now();
    const cacheMaxAge = 30000;

    if (now - this.lastHealthCheck.lastChecked < cacheMaxAge) {
      this.log('debug', 'Using cached health check');
      return this.lastHealthCheck;
    }

    const startTime = Date.now();

    try {
      if (!this.supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await Promise.race([
        this.supabaseClient.from('profiles').select('count').limit(1).maybeSingle(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 3000)
        ),
      ]);

      const latencyMs = Date.now() - startTime;
      const isHealthy = !error && latencyMs < 2000;

      this.lastHealthCheck = {
        isHealthy,
        latencyMs,
        lastChecked: now,
      };

      this.log('info', 'Health check completed', { isHealthy, latencyMs });
      return this.lastHealthCheck;
    } catch (err) {
      const latencyMs = Date.now() - startTime;

      this.lastHealthCheck = {
        isHealthy: false,
        latencyMs,
        lastChecked: now,
      };

      this.log('error', 'Health check failed', { error: String(err), latencyMs });
      return this.lastHealthCheck;
    }
  }

  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    diagnosticsLogger.logEvent('listener:added', { event, handlerCount: this.eventHandlers.get(event)!.size });
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      diagnosticsLogger.logEvent('listener:removed', { event, handlerCount: handlers.size });
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (err) {
          this.log('error', 'Event handler error', { event, error: String(err) });
        }
      });
    }
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta,
    };

    if (level === 'debug') {
      console.debug('[SessionManager]', logEntry);
    } else if (level === 'info') {
      console.log('[SessionManager]', logEntry);
    } else if (level === 'warn') {
      console.warn('[SessionManager]', logEntry);
    } else {
      console.error('[SessionManager]', logEntry);
    }
  }

  getCircuitBreakerStates(): Record<string, CircuitBreakerState> {
    const states: Record<string, CircuitBreakerState> = {};
    this.circuitBreakers.forEach((state, resource) => {
      states[resource] = { ...state };
    });
    return states;
  }

  getWriteQueueStatus(): { queueLength: number; processing: boolean; items: any[] } {
    return {
      queueLength: this.writeQueue.length,
      processing: this.processingQueue,
      items: this.writeQueue.map(item => ({
        id: item.id,
        retryCount: item.retryCount,
        ageMs: Date.now() - item.createdAt,
      })),
    };
  }

  isResyncInProgress(): boolean {
    return this.resumeInProgress || this.globalRefreshLock;
  }

  async waitForResync(timeoutMs: number = 10000): Promise<void> {
    if (!this.isResyncInProgress()) {
      return;
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkInterval = setInterval(() => {
        if (!this.isResyncInProgress()) {
          clearInterval(checkInterval);
          clearTimeout(timeoutHandle);
          resolve();
        } else if (Date.now() - startTime > timeoutMs) {
          clearInterval(checkInterval);
          clearTimeout(timeoutHandle);
          reject(new Error(`waitForResync timeout after ${timeoutMs}ms`));
        }
      }, 100);

      const timeoutHandle = setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error(`waitForResync timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  private acquireRefreshLock(reason: string): void {
    const { traceLockState } = require('@/utils/networkTracer');

    this.globalRefreshLock = true;
    this.refreshLockReason = reason;
    this.log('info', '🔒 Acquired global refresh lock', { reason });

    traceLockState('globalRefreshLock', {
      acquired: true,
      holder: reason,
      timestamp: Date.now(),
    });
  }

  private releaseRefreshLock(reason: string, resumeId?: string): void {
    const { traceLockState } = require('@/utils/networkTracer');

    this.globalRefreshLock = false;
    this.refreshLockReason = null;
    this.log('info', '🔓 Released global refresh lock', { reason, resumeId });

    traceLockState('globalRefreshLock', {
      released: true,
      holder: reason,
      timestamp: Date.now(),
    });

    diagnosticsLogger.logEvent('refreshLock:released', { reason, resumeId });
  }

  destroy(): void {
    if (Platform.OS === 'web') {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      }
    } else {
      this.appStateSubscription?.remove();
    }

    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
    this.singleFlightMap.clear();
    this.eventHandlers.clear();

    this.initialized = false;
    this.log('info', 'SessionManager destroyed');
  }
}

export const sessionManager = new SessionManagerClass();

export const initSessionManager = (options: SessionManagerOptions) =>
  sessionManager.initSessionManager(options);

export const ensureSession = () => sessionManager.ensureSession();

export const requestResync = (reason: string) => sessionManager.requestResync(reason);

export const createAbortSignal = (timeoutMs?: number) => sessionManager.createAbortSignal(timeoutMs);

export const getConnectionHealth = () => sessionManager.getConnectionHealth();

export const enqueueWrite = <T>(operationId: string, operation: () => Promise<T>) =>
  sessionManager.enqueueWrite(operationId, operation);

export const on = (event: string, handler: EventHandler) => sessionManager.on(event, handler);

export const off = (event: string, handler: EventHandler) => sessionManager.off(event, handler);

export const registerResourceLoader = (resourceName: string, loader: () => Promise<any>) =>
  sessionManager.registerResourceLoader(resourceName, loader);

export const isResyncInProgress = () => sessionManager.isResyncInProgress();

export const waitForResync = (timeoutMs?: number) => sessionManager.waitForResync(timeoutMs);

export type {
  SessionManagerOptions,
  EnsureSessionResult,
  ConnectionHealth,
  AbortSignalResult,
};