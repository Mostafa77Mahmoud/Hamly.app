import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.join(__dirname, '../../runtime.log');

// Ensure log file exists (create if not present)
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '', { flag: 'w' });
}

interface LogEntry {
  ts: string;
  method: string;
  path: string;
  status: number | null;
  remote: string;
  bodySummary: string;
  resumeCycle: null;
}

function maskSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const masked = { ...obj };
  const sensitiveKeys = ['authorization', 'apikey', 'api-key', 'token', 'password', 'secret', 'cookie'];

  for (const key in masked) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      masked[key] = '[REDACTED]';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }

  return masked;
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Capture request details immediately
  const requestDetails = {
    method: req.method,
    path: req.path || req.url,
    remote: req.ip || req.connection.remoteAddress || '127.0.0.1',
    bodySummary: req.body ? JSON.stringify(maskSensitiveData(req.body)).substring(0, 200) : '{}'
  };

  // Log when response finishes (captures ALL response types: send, end, json, error, etc.)
  res.on('finish', () => {
    const logEntry: LogEntry = {
      ts: new Date().toISOString(),
      method: requestDetails.method,
      path: requestDetails.path,
      status: res.statusCode,
      remote: requestDetails.remote,
      bodySummary: requestDetails.bodySummary,
      resumeCycle: null
    };

    const duration = Date.now() - startTime;

    // Enhanced console log with duration and body preview
    const bodyPreview = logEntry.bodySummary.substring(0, 100);
    console.log(`[${logEntry.ts}] ${logEntry.method} ${logEntry.path} - ${logEntry.status} - ${duration}ms | Body: ${bodyPreview}`);

    // Enhanced log entry with duration for file
    const enhancedEntry = {
      ...logEntry,
      duration_ms: duration
    };

    // Log to file (append)
    try {
      fs.appendFileSync(LOG_FILE, JSON.stringify(enhancedEntry) + '\n', { flag: 'a' });
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  });

  // Also log on error/close to catch aborted requests
  res.on('close', () => {
    if (!res.writableEnded) {
      const logEntry: LogEntry = {
        ts: new Date().toISOString(),
        method: requestDetails.method,
        path: requestDetails.path,
        status: res.statusCode || 0,
        remote: requestDetails.remote,
        bodySummary: requestDetails.bodySummary,
        resumeCycle: null
      };

      console.log(`[${logEntry.ts}] ${logEntry.method} ${logEntry.path} - ABORTED`);

      try {
        fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n', { flag: 'a' });
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    }
  });

  next();
}