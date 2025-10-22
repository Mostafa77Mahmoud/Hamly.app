import { supabase } from './supabase';

export interface ConnectionHealthStatus {
  isHealthy: boolean;
  latency: number;
  error?: string;
  timestamp: number;
}

let lastHealthCheck: ConnectionHealthStatus | null = null;
let healthCheckPromise: Promise<ConnectionHealthStatus> | null = null;

export const checkConnectionHealth =
  async (): Promise<ConnectionHealthStatus> => {
    // True single-flight pattern - reuse existing promise if in progress
    if (healthCheckPromise) {
      console.log('🔄 Health check already in progress, reusing existing promise');
      return healthCheckPromise;
    }

    // Create the promise and store it for single-flight
    healthCheckPromise = performHealthCheck();
    
    try {
      const result = await healthCheckPromise;
      return result;
    } finally {
      // Clear the promise once done
      healthCheckPromise = null;
    }
  };

const performHealthCheck = async (): Promise<ConnectionHealthStatus> => {
    const startTime = Date.now();

    try {
      // Simplified health check - just test basic connectivity
      const traceId = `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🏥 Health check starting [${traceId}]`);
      
      // Simple ping test with shorter timeout
      const { data, error } = await Promise.race([
        supabase.from('profiles').select('count').limit(1).maybeSingle(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Health check timeout after 2s")), 2000),
        ),
      ]);

      const latency = Date.now() - startTime;
      const structuredLog = {
        traceId,
        latency,
        isHealthy: !error && latency <= 2000,
        errorCode: error?.code,
        timestamp: Date.now()
      };

      if (error || latency > 2000) {
        lastHealthCheck = {
          isHealthy: false,
          latency,
          error: error?.message || `High latency: ${latency}ms > 2000ms threshold`,
          timestamp: Date.now(),
        };
        console.log(`⚠️ Health check failed [${traceId}]:`, structuredLog);
      } else {
        lastHealthCheck = {
          isHealthy: true,
          latency,
          timestamp: Date.now(),
        };
        console.log(`✅ Health check passed [${traceId}]:`, structuredLog);
      }

      console.log("🏥 Connection health check:", lastHealthCheck);
      return lastHealthCheck;
    } catch (error) {
      const latency = Date.now() - startTime;
      lastHealthCheck = {
        isHealthy: false,
        latency,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: Date.now(),
      };

      console.warn("⚠️ Connection health check failed:", lastHealthCheck);
      return lastHealthCheck;
    }
  };

export const getLastHealthCheck = (): ConnectionHealthStatus | null => {
  return lastHealthCheck;
};

// Cache health status for 30 seconds
export const getCachedHealthStatus = (): ConnectionHealthStatus | null => {
  if (!lastHealthCheck) return null;

  const age = Date.now() - lastHealthCheck.timestamp;
  if (age > 30000) return null; // 30 seconds

  return lastHealthCheck;
};
