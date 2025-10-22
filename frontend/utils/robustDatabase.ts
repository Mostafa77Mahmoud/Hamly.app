import { supabase } from './supabase';
import { generateTraceId, logTrace, createRobustError, retryWithBackoff } from './errorHandling';
import { addUnsyncedItem, removeUnsyncedItem, updateUnsyncedItemRetry, getUnsyncedItems } from './unsyncedStorage';
import { traceEvent } from './deepTracer';
import { logSupabaseRequest } from './logCollector';

interface DatabaseConfig {
  timeout: number;
  maxRetries: number;
  baseDelay: number;
}

const DEFAULT_CONFIG: DatabaseConfig = {
  timeout: process.env.DEBUG_TIMEOUT_DB ? parseInt(process.env.DEBUG_TIMEOUT_DB) : 8000, // Reduced to 8s for faster failure + fresh retry
  maxRetries: 2, // Keep 2 retries
  baseDelay: 1000 // Standard backoff delay
};

export interface SaveResult<T = any> {
  success: boolean;
  data?: T;
  error?: any;
  traceId: string;
  isCached?: boolean;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Database operation timeout')), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

export async function saveSymptomRobust(
  symptomData: Record<string, any>,
  clientRequestId: string,
  config: Partial<DatabaseConfig> = {}
): Promise<SaveResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const traceId = generateTraceId('symptom_save');

  logTrace(traceId, 'save-start', { clientRequestId, dataKeys: Object.keys(symptomData) });
  try {
    traceEvent('ROBUST_DB', 'symptom_save_start', { clientRequestId, traceId });
  } catch (e) {
    console.warn('Trace error (non-critical):', e);
  }

  try {
    const startTime = Date.now();
    const result = await retryWithBackoff(async () => {
      logTrace(traceId, 'db-insert-attempt');
      try {
        traceEvent('ROBUST_DB', 'symptom_insert_attempt', { traceId });
      } catch (e) {
        console.warn('Trace error (non-critical):', e);
      }

      const response = await withTimeout(
        supabase
          .from('symptoms')
          .insert(symptomData)
          .select()
          .single() as unknown as Promise<any>,
        finalConfig.timeout
      );

      if (response?.error) {
        throw response.error;
      }

      return response?.data || response;
    }, traceId, finalConfig.maxRetries, finalConfig.baseDelay);

    logTrace(traceId, 'save-success', { savedId: result?.id });

    // إزالة من التخزين غير المتزامن إذا كان موجوداً
    try {
      await removeUnsyncedItem(clientRequestId);
    } catch (removeError) {
      console.warn('Failed to remove unsynced item:', removeError);
    }

    return {
      success: true,
      data: result,
      traceId
    };

  } catch (error) {
    const robustError = createRobustError(error, traceId);
    logTrace(traceId, 'save-failed', { error: robustError });

    // إضافة إلى التخزين غير المتزامن للمحاولة لاحقاً
    try {
      await addUnsyncedItem({
        id: `tmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        clientRequestId,
        type: 'symptom',
        data: symptomData
      });
    } catch (unsyncedError) {
      console.warn('Failed to add unsynced item:', unsyncedError);
    }

    return {
      success: false,
      error: robustError,
      traceId
    };
  }
}

export async function saveMedicationRobust(
  medicationData: Record<string, any>,
  clientRequestId: string,
  config: Partial<DatabaseConfig> = {}
): Promise<SaveResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const traceId = generateTraceId('medication_save');

  logTrace(traceId, 'save-start', { clientRequestId, dataKeys: Object.keys(medicationData) });

  try {
    const result = await retryWithBackoff(async () => {
      logTrace(traceId, 'db-insert-attempt');

      const response = await withTimeout(
        supabase
          .from('medications')
          .insert(medicationData)
          .select()
          .single() as unknown as Promise<any>,
        finalConfig.timeout
      );

      if (response?.error) {
        throw response.error;
      }

      return response?.data || response;
    }, traceId, finalConfig.maxRetries, finalConfig.baseDelay);

    logTrace(traceId, 'save-success', { savedId: result?.id });

    // إزالة من التخزين غير المتزامن إذا كان موجوداً
    try {
      await removeUnsyncedItem(clientRequestId);
    } catch (removeError) {
      console.warn('Failed to remove unsynced item:', removeError);
    }

    return {
      success: true,
      data: result,
      traceId
    };

  } catch (error) {
    const robustError = createRobustError(error, traceId);
    logTrace(traceId, 'save-failed', { error: robustError });

    // إضافة إلى التخزين غير المتزامن للمحاولة لاحقاً
    try {
      await addUnsyncedItem({
        id: `tmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        clientRequestId,
        type: 'medication',
        data: medicationData
      });
    } catch (unsyncedError) {
      console.warn('Failed to add unsynced item:', unsyncedError);
    }

    return {
      success: false,
      error: robustError,
      traceId
    };
  }
}

export async function retrySaveUnsynced(clientRequestId: string): Promise<SaveResult> {
  const traceId = generateTraceId('retry_unsynced');
  logTrace(traceId, 'retry-start', { clientRequestId });

  try {
    const unsyncedItems = await getUnsyncedItems();
    const item = unsyncedItems.find(i => i.clientRequestId === clientRequestId);

    if (!item) {
      throw new Error('Unsynced item not found');
    }

    if (item.type === 'symptom') {
      return await saveSymptomRobust(item.data, clientRequestId);
    } else if (item.type === 'medication') {
      return await saveMedicationRobust(item.data, clientRequestId);
    }

    throw new Error(`Unsupported unsynced item type: ${item.type}`);

  } catch (error) {
    const robustError = createRobustError(error, traceId);
    logTrace(traceId, 'retry-failed', { error: robustError });
    await updateUnsyncedItemRetry(clientRequestId, robustError.message);

    return {
      success: false,
      error: robustError,
      traceId
    };
  }
}

// State for circuit breakers
interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
}

const circuitBreakers: Record<string, CircuitBreakerState> = {};
const inFlightRequests: Record<string, Promise<any>> = {};

const CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5;
const CIRCUIT_BREAKER_SUCCESS_THRESHOLD = 3;
const CIRCUIT_BREAKER_RESET_TIMEOUT = 60000; // 1 minute

function getCircuitBreakerState(resource: string): CircuitBreakerState {
  if (!circuitBreakers[resource]) {
    circuitBreakers[resource] = {
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
    };
  }
  return circuitBreakers[resource];
}

function updateCircuitBreaker(resource: string, success: boolean) {
  const breaker = getCircuitBreakerState(resource);

  if (success) {
    breaker.successCount++;
    breaker.failureCount = 0; // Reset failures on success
    breaker.lastSuccessTime = Date.now();
    if (breaker.state === 'HALF_OPEN' && breaker.successCount >= CIRCUIT_BREAKER_SUCCESS_THRESHOLD) {
      breaker.state = 'CLOSED';
      console.log(`CIRCUIT BREAKER: ${resource} state changed to CLOSED`);
    }
  } else {
    breaker.failureCount++;
    breaker.successCount = 0; // Reset successes on failure
    breaker.lastFailureTime = Date.now();
    if (breaker.state === 'CLOSED' && breaker.failureCount >= CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
      breaker.state = 'OPEN';
      console.log(`CIRCUIT BREAKER: ${resource} state changed to OPEN`);
    } else if (breaker.state === 'HALF_OPEN' && breaker.failureCount >= CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
      // If it fails again in HALF_OPEN, go back to OPEN
      breaker.state = 'OPEN';
      console.log(`CIRCUIT BREAKER: ${resource} state changed back to OPEN after failing in HALF_OPEN`);
    }
  }
}

export async function requestWithRetries<T>(
  resource: string,
  requestFn: () => Promise<T>,
  maxAttempts = 3,
  timeoutMs = 12000 // Reduced from 40000 to 12000
): Promise<T> {
  // Optimized timeouts based on query complexity - REDUCED for faster failure detection
  const effectiveTimeoutMs = resource === 'activePregnancy' ? 12000 : 
                             resource === 'medications' ? 12000 : 12000; // All unified to 12s

  // Single-flight deduplication - prevent duplicate concurrent requests
  const requestKey = `${resource}_${effectiveTimeoutMs}`;
  if (requestKey in inFlightRequests) {
    console.log(`🔄 Deduplicating concurrent request for ${resource}`);
    return inFlightRequests[requestKey];
  }

  const breaker = getCircuitBreakerState(resource);

  if (breaker.state === 'OPEN') {
    const timeSinceLastFailure = breaker.lastFailureTime ? Date.now() - breaker.lastFailureTime : 0;
    if (timeSinceLastFailure < CIRCUIT_BREAKER_RESET_TIMEOUT) {
      console.warn(`CIRCUIT BREAKER: ${resource} is OPEN. Request blocked.`);
      throw new Error(`Circuit breaker is open for ${resource}`);
    } else {
      // Time to try a HALF_OPEN state
      breaker.state = 'HALF_OPEN';
      console.log(`CIRCUIT BREAKER: ${resource} state changed to HALF_OPEN`);
    }
  }

  let attempt = 0;
  let lastError: any = null;
  let result: T | null = null;

  // Track the promise for in-flight requests
  const requestPromise = (async () => {
    while (attempt < maxAttempts) {
      attempt++;
      const attemptStartTime = Date.now();

      console.log(`🔄 Attempt ${attempt}/${maxAttempts} for "${resource}" Supabase operation`, {
        resource,
        attempt,
        maxAttempts,
        timeoutMs: effectiveTimeoutMs,
        circuitState: breaker.state
      });

      // Structured logging for monitoring
      console.log(JSON.stringify({
        resource,
        attempt,
        latencyMs: 0,
        success: false,
        error: null,
        timestamp: new Date().toISOString(),
        phase: 'start'
      }));

      try {
        // Use the effective timeout for the actual operation
        const operationPromise = requestFn();
        const response = await withTimeout(operationPromise, effectiveTimeoutMs);
        result = response;

        if (result) {
          const latencyMs = Date.now() - attemptStartTime;
          console.log(`✅ ${resource} attempt ${attempt} succeeded`);

          // Structured success log
          console.log(JSON.stringify({
            resource,
            attempt,
            latencyMs,
            success: true,
            error: null,
            timestamp: new Date().toISOString(),
            phase: 'complete'
          }));

          return result;
        } else {
          throw new Error('Received empty response from Supabase');
        }

      } catch (error) {
        lastError = error;
        const latencyMs = Date.now() - attemptStartTime;
        console.error(`❌ ${resource} attempt ${attempt} failed`, {
          resource,
          attempt,
          latencyMs,
          error: createRobustError(error, 'request_with_retries').message,
          circuitState: breaker.state
        });

        // Structured failure log
        console.log(JSON.stringify({
          resource,
          attempt,
          latencyMs,
          success: false,
          error: createRobustError(error, 'request_with_retries').message,
          timestamp: new Date().toISOString(),
          phase: 'error'
        }));

        if (attempt >= maxAttempts) {
          throw lastError;
        }

        // Backoff delay before next retry
        await new Promise(resolve => setTimeout(resolve, attempt * DEFAULT_CONFIG.baseDelay));
      }
    }
    throw lastError || new Error('Max attempts reached without success');
  })();

  // Store the promise for deduplication
  inFlightRequests[requestKey] = requestPromise;

  try {
    result = await requestPromise;
    // Update circuit breaker state on successful completion of all retries
    updateCircuitBreaker(resource, true);
    return result;
  } catch (error) {
    // Update circuit breaker state on failure
    updateCircuitBreaker(resource, false);
    throw error; // Re-throw the error after updating the breaker
  } finally {
    // Clean up in-flight request tracking
    delete inFlightRequests[requestKey];
  }
}