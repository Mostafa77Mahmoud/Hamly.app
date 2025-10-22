import AsyncStorage from '@react-native-async-storage/async-storage';

interface DiagnosticEvent {
  timestamp: string;
  event: string;
  data: any;
  duration?: number;
}

type EventListener = (data?: any) => void;

class EventBus {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private events: DiagnosticEvent[] = [];
  private sessionStart: number = Date.now();
  private maxEvents: number = 500;

  on(event: string, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: EventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  once(event: string, listener: EventListener): void {
    const onceWrapper = (data?: any) => {
      this.off(event, onceWrapper);
      listener(data);
    };
    this.on(event, onceWrapper);
  }

  emit(event: string, data?: any, duration?: number): void {
    this.logEvent(event, data, duration);
    
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  logEvent(event: string, data: any = {}, duration?: number) {
    const diagnosticEvent: DiagnosticEvent = {
      timestamp: new Date().toISOString(),
      event,
      data: this.redactSecrets(data),
      duration,
    };

    this.events.push(diagnosticEvent);

    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    console.log(`[DIAG] ${event}`, data);
  }

  private redactSecrets(data: any): any {
    if (!data) return data;
    
    try {
      const redactedData = JSON.parse(JSON.stringify(data));
      const secretKeys = ['password', 'token', 'key', 'secret', 'authorization', 'api_key', 'apikey'];

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
    } catch {
      return data;
    }
  }

  async exportDiagnostics(): Promise<string> {
    const diagnostics = {
      sessionStart: new Date(this.sessionStart).toISOString(),
      sessionDuration: Date.now() - this.sessionStart,
      eventCount: this.events.length,
      events: this.events,
    };

    const diagnosticsJson = JSON.stringify(diagnostics, null, 2);

    try {
      const filename = `resume-diagnostics-${Date.now()}.json`;
      await AsyncStorage.setItem(`diagnostics_${Date.now()}`, diagnosticsJson);
      console.log(`📊 Diagnostics exported: ${filename}`);
      return diagnosticsJson;
    } catch (error) {
      console.error('Failed to export diagnostics:', error);
      return diagnosticsJson;
    }
  }

  getEvents(): DiagnosticEvent[] {
    return [...this.events];
  }

  clearEvents() {
    this.events = [];
  }

  removeAllListeners(event?: string) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

export const eventBus = new EventBus();
export const diagnosticsLogger = eventBus;

if (typeof window !== 'undefined') {
  (window as any).eventBus = eventBus;
  (window as any).exportDiagnostics = () => eventBus.exportDiagnostics();
}
