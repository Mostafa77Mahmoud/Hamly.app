let currentResumeId: string | null = null;
let requestCounter = 0;

interface TracePayload {
  timestamp: string;
  event: 'SupabaseRequest' | 'ResumeEvent' | 'Lifecycle' | 'LockState' | 'SupabaseSDK';
  label: string;
  phase?: 'send' | 'response' | 'error';
  payload?: any;
  response?: any;
  error?: any;
  resumeCycle?: string | null;
  latencyMs?: number;
  requestId: string;
  headers?: any;
  url?: string;
  status?: number;
  lockState?: any;
  threadInfo?: any;
  state?: any;
  lockInfo?: {
    acquired?: boolean;
    released?: boolean;
    holder?: string;
    waiting?: string[];
  };
  action?: string;
  details?: any;
}

function formatTimestamp(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

function maskToken(token: string | undefined): string {
  if (!token) return '[NONE]';
  if (token.length <= 8) return token;
  return `${token.substring(0, 8)}...`;
}

function sanitizeHeaders(headers: any): any {
  if (!headers) return headers;

  const sanitized: any = {};
  const sensitiveKeys = [
    'authorization',
    'apikey',
    'api-key',
    'x-api-key',
    'x-apikey',
    'token',
    'access-token',
    'refresh-token',
    'secret',
    'password',
    'cookie',
    'set-cookie',
    'session',
    'auth',
    'credential',
  ];

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function sanitizePayload(payload: any): any {
  if (!payload) return payload;

  const sanitized = { ...payload };

  if (sanitized.session?.access_token) {
    sanitized.session = {
      ...sanitized.session,
      access_token: maskToken(sanitized.session.access_token),
      refresh_token: maskToken(sanitized.session.refresh_token),
    };
  }

  if (sanitized.access_token) {
    sanitized.access_token = maskToken(sanitized.access_token);
  }

  if (sanitized.refresh_token) {
    sanitized.refresh_token = maskToken(sanitized.refresh_token);
  }

  if (sanitized.password) {
    sanitized.password = '[REDACTED]';
  }

  if (sanitized.apiKey) {
    sanitized.apiKey = maskToken(sanitized.apiKey);
  }

  if (sanitized.token) {
    sanitized.token = maskToken(sanitized.token);
  }

  return sanitized;
}

export function startResumeTrace(): string {
  currentResumeId = Date.now().toString(36);
  const timestamp = formatTimestamp();

  console.log(`\n${'='.repeat(80)}`);
  console.log(`[${timestamp}] 🔄 RESUME CYCLE START [${currentResumeId}]`);
  console.log(`${'='.repeat(80)}\n`);

  const trace: TracePayload = {
    timestamp: new Date().toISOString(),
    event: 'ResumeEvent',
    label: 'resume_start',
    phase: 'send',
    resumeCycle: currentResumeId,
    requestId: `resume_${currentResumeId}`,
  };

  console.log('[TRACE]', JSON.stringify(trace, null, 2));

  return currentResumeId;
}

export function endResumeTrace(success: boolean = true): void {
  const timestamp = formatTimestamp();

  console.log(`\n${'='.repeat(80)}`);
  console.log(`[${timestamp}] ${success ? '✅' : '❌'} RESUME CYCLE END [${currentResumeId}]`);
  console.log(`${'='.repeat(80)}\n`);

  const trace: TracePayload = {
    timestamp: new Date().toISOString(),
    event: 'ResumeEvent',
    label: 'resume_end',
    phase: success ? 'response' : 'error',
    resumeCycle: currentResumeId,
    requestId: `resume_${currentResumeId}_end`,
  };

  console.log('[TRACE]', JSON.stringify(trace, null, 2));

  currentResumeId = null;
}

export function getCurrentResumeId(): string | null {
  return currentResumeId;
}

// Helper to get current resume cycle for tracing
function getCurrentResumeCycle(): string | null {
  return currentResumeId;
}

export function traceRequest(label: string, data: {
  phase: 'send' | 'response' | 'error';
  payload?: any;
  response?: any;
  error?: any;
  latencyMs?: number;
  lockState?: any;
  threadInfo?: any;
  url?: string;
  status?: number;
  headers?: any;
}): void {
  const resumeCycle = getCurrentResumeCycle();
  const requestId = `req_${++requestCounter}_${resumeCycle || 'nocycle'}`;
  const timestamp = formatTimestamp();

  const phaseIcon = {
    send: '📤',
    response: '✅',
    error: '❌',
  };

  const resumePrefix = resumeCycle ? `[${resumeCycle}]` : '[no-resume]';
  const icon = phaseIcon[data.phase];

  console.log(
    `[${timestamp}] ${resumePrefix} ${icon} [${label}] -> ${data.phase}${
      data.latencyMs ? ` (${Math.round(data.latencyMs)}ms)` : ''
    }`
  );

  const trace: TracePayload = {
    timestamp: new Date().toISOString(),
    event: 'SupabaseRequest',
    label,
    phase: data.phase,
    payload: sanitizePayload(data.payload),
    response: sanitizePayload(data.response),
    error: data.error ? {
      message: data.error.message || String(data.error),
      code: data.error.code,
      status: data.error.status,
      stack: data.error.stack?.split('\n').slice(0, 3).join('\n'),
    } : undefined,
    resumeCycle,
    latencyMs: data.latencyMs,
    requestId,
    headers: sanitizeHeaders(data.headers),
    url: data.url,
    status: data.status,
    lockState: data.lockState,
    threadInfo: data.threadInfo,
  };

  if (data.phase === 'error') {
    console.error('[TRACE ERROR]', JSON.stringify(trace, null, 2));
  } else {
    console.log('[TRACE]', JSON.stringify(trace, null, 2));
  }

  if (data.phase === 'response' && data.latencyMs) {
    if (data.latencyMs > 5000) {
      console.warn(`⚠️  SLOW REQUEST: ${label} took ${Math.round(data.latencyMs)}ms`);
    } else if (data.latencyMs > 2000) {
      console.warn(`⏱️  DELAYED REQUEST: ${label} took ${Math.round(data.latencyMs)}ms`);
    }
  }
}

// Trace lifecycle events
export function traceLifecycle(label: string, state: any): void {
  const resumeCycle = getCurrentResumeCycle();
  const requestId = `lifecycle_${++requestCounter}`;
  const traceLog: TracePayload = {
    timestamp: new Date().toISOString(),
    event: 'Lifecycle',
    label,
    state,
    resumeCycle,
    requestId,
  };

  console.log('[TRACE]', JSON.stringify(traceLog, null, 2));
}

// Trace lock state changes
export function traceLockState(label: string, lockInfo: {
  acquired?: boolean;
  released?: boolean;
  holder?: string;
  waiting?: string[];
}): void {
  const resumeCycle = getCurrentResumeCycle();
  const requestId = `lock_${++requestCounter}`;

  const traceLog: TracePayload = {
    timestamp: new Date().toISOString(),
    event: 'LockState',
    label,
    lockInfo,
    resumeCycle,
    requestId,
  };

  console.log('[TRACE]', JSON.stringify(traceLog, null, 2));
}

// Trace Supabase SDK internal state
export function traceSupabaseSDK(action: string, details: any): void {
  const resumeCycle = getCurrentResumeCycle();
  const requestId = `sdk_${++requestCounter}`;

  const traceLog: TracePayload = {
    timestamp: new Date().toISOString(),
    event: 'SupabaseSDK',
    label: action,
    action,
    details,
    resumeCycle,
    requestId,
  };

  console.log('[TRACE]', JSON.stringify(traceLog, null, 2));
}

export function createTracedPromise<T>(
  label: string,
  promiseFactory: () => Promise<T>,
  options?: {
    payload?: any;
    url?: string;
  }
): Promise<T> {
  const start = Date.now();

  traceRequest(label, {
    phase: 'send',
    payload: options?.payload,
    url: options?.url,
  });

  return promiseFactory()
    .then((response) => {
      const latencyMs = Date.now() - start;
      traceRequest(label, {
        phase: 'response',
        response,
        latencyMs,
        url: options?.url,
      });
      return response;
    })
    .catch((error) => {
      const latencyMs = Date.now() - start;
      traceRequest(label, {
        phase: 'error',
        error,
        latencyMs,
        url: options?.url,
      });
      throw error;
    });
}