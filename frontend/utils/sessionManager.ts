
import { supabase } from './supabase';
import { traceEvent } from './deepTracer';
import { captureSessionSnapshot } from './sessionDebugger';

interface SessionHealth {
  isValid: boolean;
  expiresIn: number;
  needsRefresh: boolean;
}

export class SessionManager {
  private static instance: SessionManager;
  private lastHealthCheck: number = 0;
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  async checkSessionHealth(): Promise<SessionHealth> {
    traceEvent('SESSION_MANAGER', 'check_health_start', {});
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        traceEvent('SESSION_MANAGER', 'check_health_no_session', { hasError: !!error });
        await captureSessionSnapshot('health_check_no_session', null);
        return {
          isValid: false,
          expiresIn: 0,
          needsRefresh: true
        };
      }

      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();
      const expiresIn = expiresAt - now;

      const health = {
        isValid: expiresIn > 0,
        expiresIn,
        needsRefresh: expiresIn < 10 * 60 * 1000
      };

      traceEvent('SESSION_MANAGER', 'check_health_complete', { 
        isValid: health.isValid, 
        expiresIn: health.expiresIn,
        needsRefresh: health.needsRefresh 
      });
      await captureSessionSnapshot('health_check_complete', session);

      return health;
    } catch (error) {
      console.error('Session health check failed:', error);
      traceEvent('SESSION_MANAGER', 'check_health_error', { error });
      return {
        isValid: false,
        expiresIn: 0,
        needsRefresh: true
      };
    }
  }

  async refreshSessionIfNeeded(): Promise<boolean> {
    const now = Date.now();
    
    traceEvent('SESSION_MANAGER', 'refresh_if_needed_start', { 
      timeSinceLastCheck: now - this.lastHealthCheck 
    });

    // Skip if we've checked recently
    if (now - this.lastHealthCheck < this.HEALTH_CHECK_INTERVAL) {
      traceEvent('SESSION_MANAGER', 'refresh_skipped_recent_check', {});
      return true;
    }

    this.lastHealthCheck = now;

    try {
      const health = await this.checkSessionHealth();
      
      if (!health.isValid || health.needsRefresh) {
        console.log('🔄 Refreshing session...');
        traceEvent('SESSION_MANAGER', 'refresh_needed', { health });
        
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error || !data.session) {
          console.error('❌ Session refresh failed:', error);
          traceEvent('SESSION_MANAGER', 'refresh_failed', { error });
          await captureSessionSnapshot('refresh_failed', null);
          return false;
        }

        console.log('✅ Session refreshed successfully');
        traceEvent('SESSION_MANAGER', 'refresh_success', { 
          userId: data.session?.user?.id 
        });
        await captureSessionSnapshot('refresh_success', data.session);
        return true;
      }

      traceEvent('SESSION_MANAGER', 'refresh_not_needed', { health });
      return true;
    } catch (error) {
      console.error('❌ Session refresh attempt failed:', error);
      traceEvent('SESSION_MANAGER', 'refresh_exception', { error });
      return false;
    }
  }

  async withSessionCheck<T>(operation: () => Promise<T>): Promise<T> {
    const sessionValid = await this.refreshSessionIfNeeded();
    
    if (!sessionValid) {
      throw new Error('Session invalid - please refresh the page');
    }

    try {
      return await operation();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // If it's a session-related error, try one more time
      if (errorMessage.includes('auth') || errorMessage.includes('session') || errorMessage.includes('unauthorized')) {
        console.log('🔄 Retrying operation after session error...');
        
        const refreshSuccess = await this.refreshSessionIfNeeded();
        if (refreshSuccess) {
          return await operation();
        }
      }
      
      throw error;
    }
  }
}

export const sessionManager = SessionManager.getInstance();
