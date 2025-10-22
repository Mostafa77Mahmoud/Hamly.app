import AsyncStorage from '@react-native-async-storage/async-storage';
import { traceEvent, getTimeline } from './deepTracer';
import { getSessionSnapshots } from './sessionDebugger';

interface SupabaseRequest {
  timestamp: string;
  endpoint: string;
  payload?: any;
  response?: any;
  error?: any;
  latencyMs?: number;
  status?: string;
}

interface AppStateChange {
  timestamp: string;
  from: string;
  to: string;
}

interface LogReport {
  generatedAt: string;
  appStateTimeline: AppStateChange[];
  sessionSnapshots: any[];
  supabaseRequests: SupabaseRequest[];
  fullTimeline: any[];
  lastError?: any;
}

class LogCollector {
  private requests: SupabaseRequest[] = [];
  private appStateChanges: AppStateChange[] = [];
  private readonly MAX_REQUESTS = 20;
  private readonly MAX_STATE_CHANGES = 30;
  private readonly STORAGE_KEY = '@log_collector_data';

  logRequest(endpoint: string, data: Partial<SupabaseRequest>) {
    const request: SupabaseRequest = {
      timestamp: new Date().toISOString(),
      endpoint,
      ...data,
    };

    this.requests.push(request);

    if (this.requests.length > this.MAX_REQUESTS) {
      this.requests.shift();
    }

    traceEvent('SUPABASE_REQUEST', endpoint, {
      latency: data.latencyMs,
      status: data.status,
      hasError: !!data.error,
    });

    this.saveToStorage();
  }

  logAppStateChange(from: string, to: string) {
    const change: AppStateChange = {
      timestamp: new Date().toISOString(),
      from,
      to,
    };

    this.appStateChanges.push(change);

    if (this.appStateChanges.length > this.MAX_STATE_CHANGES) {
      this.appStateChanges.shift();
    }

    traceEvent('APP_STATE', `${from} -> ${to}`, { timestamp: change.timestamp });

    this.saveToStorage();
  }

  async generateReport(): Promise<LogReport> {
    const report: LogReport = {
      generatedAt: new Date().toISOString(),
      appStateTimeline: [...this.appStateChanges],
      sessionSnapshots: getSessionSnapshots(),
      supabaseRequests: [...this.requests],
      fullTimeline: getTimeline(),
    };

    const lastRequest = this.requests[this.requests.length - 1];
    if (lastRequest?.error) {
      report.lastError = lastRequest.error;
    }

    return report;
  }

  async saveReport() {
    const report = await this.generateReport();
    const key = `@log_report_${Date.now()}`;
    
    try {
      await AsyncStorage.setItem(key, JSON.stringify(report, null, 2));
      console.log('📊 Log report saved to:', key);
      return key;
    } catch (error) {
      console.error('Failed to save log report:', error);
    }
  }

  async printReport() {
    const report = await this.generateReport();
    
    console.log('\n========== LOG REPORT ==========');
    console.log('Generated at:', report.generatedAt);
    
    console.log('\n--- App State Timeline ---');
    report.appStateTimeline.forEach((change, idx) => {
      const time = new Date(change.timestamp).toLocaleTimeString();
      console.log(`${idx + 1}. [${time}] ${change.from} -> ${change.to}`);
    });

    console.log('\n--- Recent Supabase Requests ---');
    report.supabaseRequests.forEach((req, idx) => {
      const time = new Date(req.timestamp).toLocaleTimeString();
      console.log(`${idx + 1}. [${time}] ${req.endpoint}`);
      console.log(`   Status: ${req.status || 'unknown'}, Latency: ${req.latencyMs || 'N/A'}ms`);
      if (req.error) {
        console.log(`   Error:`, req.error);
      }
    });

    if (report.lastError) {
      console.log('\n--- Last Error ---');
      console.log(JSON.stringify(report.lastError, null, 2));
    }

    console.log('\n================================\n');
  }

  private async saveToStorage() {
    try {
      const data = {
        requests: this.requests,
        appStateChanges: this.appStateChanges,
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save log collector data:', error);
    }
  }

  async loadFromStorage() {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.requests = data.requests || [];
        this.appStateChanges = data.appStateChanges || [];
      }
    } catch (error) {
      console.error('Failed to load log collector data:', error);
    }
  }

  async clearAll() {
    this.requests = [];
    this.appStateChanges = [];
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear log collector data:', error);
    }
  }
}

const collector = new LogCollector();

export const logSupabaseRequest = (endpoint: string, data: Partial<SupabaseRequest>) =>
  collector.logRequest(endpoint, data);

export const logAppStateChange = (from: string, to: string) =>
  collector.logAppStateChange(from, to);

export const generateLogReport = () => collector.generateReport();
export const saveLogReport = () => collector.saveReport();
export const printLogReport = () => collector.printReport();
export const loadLogCollector = () => collector.loadFromStorage();
export const clearLogCollector = () => collector.clearAll();

if (typeof window !== 'undefined') {
  (window as any).printLogReport = printLogReport;
  (window as any).saveLogReport = saveLogReport;
  (window as any).generateLogReport = generateLogReport;
}
