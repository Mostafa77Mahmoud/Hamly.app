/**
 * AI Monitoring and Logging System for HamlyMD
 * Comprehensive logging for all Gemini AI requests with failure tracking
 */

import * as FileSystem from 'expo-file-system';

export interface AIRequest {
  id: string;
  timestamp: string;
  endpoint: string;
  model: string;
  requestData: any;
  responseData?: any;
  error?: string;
  duration: number;
  status: 'success' | 'error' | 'timeout';
  retryCount?: number;
}

export interface AIMonitoringConfig {
  enableConsoleAlerts: boolean;
  enableFileLogging: boolean;
  logDirectory: string;
  alertThresholds: {
    errorRate: number; // Percentage
    responseTime: number; // Milliseconds
    consecutiveFailures: number;
  };
}

class AIMonitoringService {
  private config: AIMonitoringConfig;
  private requests: AIRequest[] = [];
  private consecutiveFailures = 0;
  private logFilePath: string;
  private monitoringFilePath: string;

  constructor(config?: Partial<AIMonitoringConfig>) {
    this.config = {
      enableConsoleAlerts: true,
      enableFileLogging: true,
      logDirectory: `${FileSystem.documentDirectory}logs/`,
      alertThresholds: {
        errorRate: 20, // 20% error rate triggers alert
        responseTime: 10000, // 10 seconds
        consecutiveFailures: 3
      },
      ...config
    };

    this.logFilePath = `${this.config.logDirectory}ai-requests.log`;
    this.monitoringFilePath = `${this.config.logDirectory}ai-monitoring.md`;
    
    this.initializeLogging();
  }

  private async initializeLogging() {
    try {
      // Create logs directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(this.config.logDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.config.logDirectory, { intermediates: true });
      }
    } catch (error) {
      console.error('Failed to initialize AI monitoring logging:', error);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start monitoring an AI request
   */
  async startRequest(endpoint: string, model: string, requestData: any): Promise<string> {
    const requestId = this.generateRequestId();
    const timestamp = new Date().toISOString();

    const request: AIRequest = {
      id: requestId,
      timestamp,
      endpoint,
      model,
      requestData: this.sanitizeRequestData(requestData),
      duration: 0,
      status: 'success'
    };

    // Log request start
    if (this.config.enableConsoleAlerts) {
      console.log(`🤖 [AI-Monitor] Starting ${endpoint} request: ${requestId}`);
    }

    return requestId;
  }

  /**
   * Complete monitoring for a successful AI request
   */
  async completeRequest(
    requestId: string,
    responseData: any,
    startTime: number
  ): Promise<void> {
    const duration = Date.now() - startTime;
    const request = this.findRequest(requestId);

    if (request) {
      request.responseData = this.sanitizeResponseData(responseData);
      request.duration = duration;
      request.status = 'success';
      this.consecutiveFailures = 0; // Reset on success

      // Check for performance alerts
      if (duration > this.config.alertThresholds.responseTime) {
        await this.logAlert(`Slow response time: ${duration}ms for request ${requestId}`, 'performance');
      }

      if (this.config.enableConsoleAlerts) {
        console.log(`✅ [AI-Monitor] Completed ${request.endpoint} in ${duration}ms: ${requestId}`);
      }
    }

    await this.saveRequest(request);
    await this.updateMonitoringStats();
  }

  /**
   * Handle AI request failure
   */
  async failRequest(
    requestId: string,
    error: string,
    startTime: number,
    retryCount: number = 0
  ): Promise<void> {
    const duration = Date.now() - startTime;
    const request = this.findRequest(requestId);

    if (request) {
      request.error = error;
      request.duration = duration;
      request.status = 'error';
      request.retryCount = retryCount;
      this.consecutiveFailures++;

      // Log failure
      await this.logAlert(
        `AI request failed: ${request.endpoint} - ${error}`,
        'error',
        {
          requestId,
          endpoint: request.endpoint,
          model: request.model,
          error,
          retryCount,
          consecutiveFailures: this.consecutiveFailures
        }
      );

      // Check for consecutive failure alert
      if (this.consecutiveFailures >= this.config.alertThresholds.consecutiveFailures) {
        await this.logAlert(
          `Critical: ${this.consecutiveFailures} consecutive AI failures`,
          'critical'
        );
      }

      if (this.config.enableConsoleAlerts) {
        console.error(`❌ [AI-Monitor] Failed ${request.endpoint} after ${duration}ms: ${error}`);
      }
    }

    await this.saveRequest(request);
    await this.updateMonitoringStats();
  }

  /**
   * Find request by ID (for internal tracking)
   */
  private findRequest(requestId: string): AIRequest | undefined {
    return this.requests.find(r => r.id === requestId) || {
      id: requestId,
      timestamp: new Date().toISOString(),
      endpoint: 'unknown',
      model: 'unknown',
      requestData: {},
      duration: 0,
      status: 'error'
    };
  }

  /**
   * Sanitize request data for logging (remove sensitive info)
   */
  private sanitizeRequestData(data: any): any {
    if (!data) return {};
    
    const sanitized = { ...data };
    
    // Remove or mask sensitive fields
    if (sanitized.image) {
      sanitized.image = `[BASE64_IMAGE_${sanitized.image.length}_BYTES]`;
    }
    
    if (sanitized.apiKey) {
      sanitized.apiKey = '[REDACTED]';
    }
    
    return sanitized;
  }

  /**
   * Sanitize response data for logging
   */
  private sanitizeResponseData(data: any): any {
    if (!data) return {};
    
    // Keep full response for now, but could be truncated if needed
    return data;
  }

  /**
   * Save request to log file
   */
  private async saveRequest(request: AIRequest | undefined): Promise<void> {
    if (!request || !this.config.enableFileLogging) return;

    try {
      const logEntry = {
        ...request,
        loggedAt: new Date().toISOString()
      };

      const logLine = JSON.stringify(logEntry) + '\\n';
      
      await FileSystem.writeAsStringAsync(
        this.logFilePath,
        logLine,
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      // Keep in-memory requests limited (last 100)
      this.requests.push(request);
      if (this.requests.length > 100) {
        this.requests = this.requests.slice(-100);
      }
    } catch (error) {
      console.error('Failed to save AI request log:', error);
    }
  }

  /**
   * Log alert to monitoring file
   */
  private async logAlert(
    message: string,
    severity: 'info' | 'warning' | 'error' | 'critical' | 'performance',
    details?: any
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const alertEntry = `
## ${severity.toUpperCase()} Alert - ${timestamp}

**Message**: ${message}

${details ? `**Details**:
\`\`\`json
${JSON.stringify(details, null, 2)}
\`\`\`
` : ''}

---
`;

    try {
      await FileSystem.writeAsStringAsync(
        this.monitoringFilePath,
        alertEntry,
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      // Console alert for development
      if (this.config.enableConsoleAlerts) {
        const emoji = {
          info: '💡',
          warning: '⚠️',
          error: '❌',
          critical: '🚨',
          performance: '⏱️'
        }[severity];
        console.log(`${emoji} [AI-Monitor] ${severity.toUpperCase()}: ${message}`);
      }
    } catch (error) {
      console.error('Failed to log AI monitoring alert:', error);
    }
  }

  /**
   * Update monitoring statistics
   */
  private async updateMonitoringStats(): Promise<void> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    const recentRequests = this.requests.filter(
      r => new Date(r.timestamp) > last24Hours
    );

    const stats = {
      totalRequests: recentRequests.length,
      successfulRequests: recentRequests.filter(r => r.status === 'success').length,
      failedRequests: recentRequests.filter(r => r.status === 'error').length,
      errorRate: recentRequests.length > 0 
        ? (recentRequests.filter(r => r.status === 'error').length / recentRequests.length) * 100 
        : 0,
      averageResponseTime: recentRequests.length > 0 
        ? recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length 
        : 0,
      consecutiveFailures: this.consecutiveFailures,
      lastUpdated: now.toISOString()
    };

    // Check for error rate alert
    if (stats.errorRate > this.config.alertThresholds.errorRate && recentRequests.length >= 5) {
      await this.logAlert(
        `High error rate: ${stats.errorRate.toFixed(1)}% in last 24 hours`,
        'warning',
        stats
      );
    }

    // Log stats summary
    if (this.config.enableConsoleAlerts && recentRequests.length > 0) {
      console.log(`📊 [AI-Monitor] Stats: ${stats.successfulRequests}/${stats.totalRequests} success, ${stats.errorRate.toFixed(1)}% error rate, ${stats.averageResponseTime.toFixed(0)}ms avg response`);
    }
  }

  /**
   * Get monitoring summary
   */
  async getMonitoringSummary(): Promise<any> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    const recentRequests = this.requests.filter(
      r => new Date(r.timestamp) > last24Hours
    );

    return {
      totalRequests: recentRequests.length,
      successfulRequests: recentRequests.filter(r => r.status === 'success').length,
      failedRequests: recentRequests.filter(r => r.status === 'error').length,
      errorRate: recentRequests.length > 0 
        ? (recentRequests.filter(r => r.status === 'error').length / recentRequests.length) * 100 
        : 0,
      averageResponseTime: recentRequests.length > 0 
        ? recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length 
        : 0,
      consecutiveFailures: this.consecutiveFailures,
      recentErrors: recentRequests
        .filter(r => r.status === 'error')
        .slice(-5)
        .map(r => ({ endpoint: r.endpoint, error: r.error, timestamp: r.timestamp }))
    };
  }
}

// Singleton instance
export const aiMonitor = new AIMonitoringService();

/**
 * Utility function to wrap AI API calls with monitoring
 */
export async function monitorAIRequest<T>(
  endpoint: string,
  model: string,
  requestData: any,
  apiCall: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const requestId = await aiMonitor.startRequest(endpoint, model, requestData);
  
  try {
    const result = await apiCall();
    await aiMonitor.completeRequest(requestId, result, startTime);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await aiMonitor.failRequest(requestId, errorMessage, startTime);
    throw error;
  }
}