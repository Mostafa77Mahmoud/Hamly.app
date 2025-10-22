
export interface TraceInfo {
  traceId: string;
  timestamp: number;
  operation: string;
  details?: Record<string, any>;
}

export interface RobustError {
  message: string;
  code: string;
  status: string;
  traceId: string;
  sessionInfo?: {
    userId?: string;
    sessionExpiry?: number;
  };
  stack?: string;
}

let traceBuffer: TraceInfo[] = [];
const MAX_TRACES = 50;

export function generateTraceId(operation: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `trace_${operation}_${timestamp}_${random}`;
}

export function logTrace(traceId: string, operation: string, details?: Record<string, any>): void {
  const trace: TraceInfo = {
    traceId,
    timestamp: Date.now(),
    operation,
    details
  };
  
  traceBuffer.push(trace);
  if (traceBuffer.length > MAX_TRACES) {
    traceBuffer.shift();
  }
  
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
    console.log(`🔍 Trace [${traceId}]:`, operation, details || null);
  }
}

export function getTraceBuffer(): TraceInfo[] {
  return [...traceBuffer];
}

// Expose trace buffer accessor in development for quick inspection
if (typeof window !== 'undefined' && (process.env.NODE_ENV === 'development' || (process.env as any).DEBUG === 'true')) {
  (window as any).getAIMonitorTraces = () => getTraceBuffer();
  // Usage: open devtools console and call getAIMonitorTraces()
}

export function createRobustError(
  error: unknown, 
  traceId: string, 
  sessionInfo?: { userId?: string; sessionExpiry?: number }
): RobustError {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: (error as any).code || 'UNKNOWN_ERROR',
      status: (error as any).status || 'NO_STATUS',
      traceId,
      sessionInfo,
      stack: error.stack
    };
  }
  
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, any>;
    return {
      message: errorObj.message || 'Unknown error occurred',
      code: errorObj.code || 'UNKNOWN_ERROR',
      status: errorObj.status || 'NO_STATUS',
      traceId,
      sessionInfo,
      stack: errorObj.stack
    };
  }
  
  return {
    message: String(error) || 'Unhandled error',
    code: 'SERIALIZATION_ERROR',
    status: 'NO_STATUS',
    traceId,
    sessionInfo
  };
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  traceId: string,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        logTrace(traceId, 'retry-delay', { attempt, delay });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      logTrace(traceId, 'operation-attempt', { attempt });
      const result = await operation();
      logTrace(traceId, 'operation-success', { attempt });
      return result;
    } catch (error) {
      lastError = error;
      logTrace(traceId, 'operation-failed', { 
        attempt, 
        error: createRobustError(error, traceId) 
      });
      
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
  
  throw lastError;
}
