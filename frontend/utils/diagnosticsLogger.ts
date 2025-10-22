import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

interface DiagnosticEvent {
  timestamp: number;
  event: string;
  data?: any;
  level: 'info' | 'warn' | 'error';
}

class DiagnosticsLogger {
  private events: DiagnosticEvent[] = [];
  private readonly MAX_EVENTS = 1000;
  private readonly STORAGE_KEY = 'hamlymd_diagnostic_logs';

  async log(
    event: string,
    data?: any,
    level: 'info' | 'warn' | 'error' = 'info'
  ): Promise<void> {
    const diagnosticEvent: DiagnosticEvent = {
      timestamp: Date.now(),
      event,
      data: this.redactSecrets(data),
      level,
    };

    this.events.push(diagnosticEvent);

    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    console.log(`[${level.toUpperCase()}] ${event}`, data);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        await AsyncStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify(this.events.slice(-100))
        );
      } catch (error) {
        console.error('Failed to persist diagnostic logs:', error);
      }
    }
  }

  private redactSecrets(data: any): any {
    if (!data) return data;

    const redactedData = JSON.parse(JSON.stringify(data));

    const secretKeys = [
      'password',
      'token',
      'key',
      'secret',
      'authorization',
      'api_key',
      'apikey',
    ];

    const redact = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;

      for (const key in obj) {
        if (secretKeys.some(sk => key.toLowerCase().includes(sk))) {
          obj[key] = '*REDACTED*';
        } else if (typeof obj[key] === 'object') {
          obj[key] = redact(obj[key]);
        }
      }
      return obj;
    };

    return redact(redactedData);
  }

  async saveToFile(filename: string): Promise<string | null> {
    try {
      const logData = JSON.stringify(this.events, null, 2);

      if (Platform.OS === 'web') {
        const blob = new Blob([logData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        return filename;
      } else {
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, logData);
        return fileUri;
      }
    } catch (error) {
      console.error('Failed to save diagnostic logs to file:', error);
      return null;
    }
  }

  getEvents(filter?: { level?: string; event?: string; since?: number }): DiagnosticEvent[] {
    let filtered = [...this.events];

    if (filter?.level) {
      const level = filter.level;
      filtered = filtered.filter(e => e.level === level);
    }

    if (filter?.event) {
      const event = filter.event;
      filtered = filtered.filter(e => e.event.includes(event));
    }

    if (filter?.since !== undefined) {
      filtered = filtered.filter(e => e.timestamp >= filter.since!);
    }

    return filtered;
  }

  async clear(): Promise<void> {
    this.events = [];
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear diagnostic logs:', error);
    }
  }

  async loadFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load diagnostic logs from storage:', error);
    }
  }
}

export const diagnosticsLogger = new DiagnosticsLogger();

if (typeof window !== 'undefined') {
  (window as any).diagnosticsLogger = diagnosticsLogger;
  (window as any).getDiagnosticLogs = (filter?: any) => diagnosticsLogger.getEvents(filter);
  (window as any).saveDiagnosticLogs = (filename: string = 'diagnostics.json') =>
    diagnosticsLogger.saveToFile(filename);
}
