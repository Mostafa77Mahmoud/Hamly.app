/**
 * Debug Panel for Circuit Breaker and Request Monitoring
 * Development-only tool for observing system health
 */

import { getCircuitBreakerStates } from './supabase';
import { writeQueue } from './writeQueue';

interface RequestAttemptLog {
  timestamp: number;
  resource: string;
  attempt: number;
  latencyMs: number;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  isSessionRecoveryAttempt: boolean;
  circuitState: string;
}

class DebugPanel {
  private requestLogs: RequestAttemptLog[] = [];
  private readonly maxLogs = 100;

  logRequestAttempt(log: RequestAttemptLog) {
    this.requestLogs.unshift(log);
    if (this.requestLogs.length > this.maxLogs) {
      this.requestLogs = this.requestLogs.slice(0, this.maxLogs);
    }
  }

  getSystemStatus() {
    const circuitStates = getCircuitBreakerStates();
    const writeQueueStatus = writeQueue.getQueueStatus();
    
    const recentLogs = this.requestLogs.slice(0, 20);
    const failureRate = this.calculateFailureRate();
    const avgLatency = this.calculateAverageLatency();

    return {
      timestamp: new Date().toISOString(),
      circuitBreakers: circuitStates,
      writeQueue: writeQueueStatus,
      recentRequests: recentLogs,
      metrics: {
        totalRequests: this.requestLogs.length,
        failureRate: failureRate,
        averageLatencyMs: avgLatency,
        circuitBreakerCount: Object.keys(circuitStates).length,
        openCircuits: Object.entries(circuitStates)
          .filter(([_, state]) => state.state === 'open')
          .map(([key, _]) => key),
      },
    };
  }

  private calculateFailureRate(): number {
    if (this.requestLogs.length === 0) return 0;
    
    const recent = this.requestLogs.slice(0, 50); // Last 50 requests
    const failures = recent.filter(log => !log.success).length;
    return (failures / recent.length) * 100;
  }

  private calculateAverageLatency(): number {
    if (this.requestLogs.length === 0) return 0;
    
    const recent = this.requestLogs.slice(0, 20).filter(log => log.success);
    if (recent.length === 0) return 0;
    
    const totalLatency = recent.reduce((sum, log) => sum + log.latencyMs, 0);
    return Math.round(totalLatency / recent.length);
  }

  generateHealthReport(): string {
    const status = this.getSystemStatus();
    
    let report = `🏥 HamlyMD System Health Report\n`;
    report += `Generated: ${status.timestamp}\n\n`;
    
    report += `📊 METRICS:\n`;
    report += `- Total Requests: ${status.metrics.totalRequests}\n`;
    report += `- Failure Rate: ${status.metrics.failureRate.toFixed(1)}%\n`;
    report += `- Average Latency: ${status.metrics.averageLatencyMs}ms\n`;
    report += `- Circuit Breakers: ${status.metrics.circuitBreakerCount}\n`;
    
    if (status.metrics.openCircuits.length > 0) {
      report += `- 🚨 OPEN CIRCUITS: ${status.metrics.openCircuits.join(', ')}\n`;
    }
    
    report += `\n🔄 WRITE QUEUE:\n`;
    report += `- Operations Pending: ${status.writeQueue.queueLength}\n`;
    report += `- Processing: ${status.writeQueue.processing}\n`;
    
    if (status.writeQueue.operations.length > 0) {
      report += `- Pending Operations:\n`;
      status.writeQueue.operations.forEach(op => {
        report += `  • ${op.id} (retry ${op.retryCount}, age ${op.ageMs}ms)\n`;
      });
    }
    
    report += `\n🔧 CIRCUIT BREAKERS:\n`;
    Object.entries(status.circuitBreakers).forEach(([key, state]) => {
      const stateIcon = state.state === 'open' ? '🔴' : state.state === 'half-open' ? '🟡' : '🟢';
      report += `${stateIcon} ${key}: ${state.state} (failures: ${state.failures})\n`;
    });
    
    report += `\n📋 RECENT REQUESTS:\n`;
    status.recentRequests.slice(0, 10).forEach(log => {
      const icon = log.success ? '✅' : '❌';
      const time = new Date(log.timestamp).toLocaleTimeString();
      report += `${icon} ${time} ${log.resource} (${log.latencyMs}ms)\n`;
    });
    
    return report;
  }

  clearLogs() {
    this.requestLogs = [];
    console.log('🗑️ Debug panel logs cleared');
  }
}

// Global debug panel instance
export const debugPanel = new DebugPanel();

// Development-only global functions
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  (window as any).getSystemStatus = () => debugPanel.getSystemStatus();
  (window as any).generateHealthReport = () => {
    const report = debugPanel.generateHealthReport();
    console.log(report);
    return report;
  };
  (window as any).clearDebugLogs = () => debugPanel.clearLogs();
}