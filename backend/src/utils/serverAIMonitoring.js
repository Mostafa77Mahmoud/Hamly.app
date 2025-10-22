/**
 * Server-side AI monitoring for API endpoints
 * Node.js compatible monitoring system
 */

const fs = require('fs');
const path = require('path');

class ServerAIMonitor {
  constructor() {
    this.consecutiveFailures = 0;
    this.logFilePath = path.join(process.cwd(), 'logs', 'ai-monitoring.md');
    this.requestLogPath = path.join(process.cwd(), 'logs', 'ai-requests.log');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  generateRequestId() {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async startRequest(endpoint, model, requestData) {
    const requestId = this.generateRequestId();
    console.log(`🤖 [AI-Monitor] Starting ${endpoint} request: ${requestId}`);
    return requestId;
  }

  async completeRequest(requestId, endpoint, responseData, startTime) {
    const duration = Date.now() - startTime;
    this.consecutiveFailures = 0;

    const logEntry = {
      id: requestId,
      timestamp: new Date().toISOString(),
      endpoint,
      duration,
      status: 'success',
      responseSize: JSON.stringify(responseData || {}).length
    };

    this.logRequest(logEntry);

    if (duration > 10000) {
      await this.logAlert(`Slow response time: ${duration}ms for request ${requestId}`, 'performance');
    }

    console.log(`✅ [AI-Monitor] Completed ${endpoint} in ${duration}ms: ${requestId}`);
  }

  async failRequest(requestId, endpoint, error, startTime, retryCount = 0) {
    const duration = Date.now() - startTime;
    this.consecutiveFailures++;

    const logEntry = {
      id: requestId,
      timestamp: new Date().toISOString(),
      endpoint,
      duration,
      status: 'error',
      error: error.toString(),
      retryCount
    };

    this.logRequest(logEntry);

    await this.logAlert(
      `AI request failed: ${endpoint} - ${error}`,
      'error',
      {
        requestId,
        endpoint,
        error: error.toString(),
        retryCount,
        consecutiveFailures: this.consecutiveFailures
      }
    );

    if (this.consecutiveFailures >= 3) {
      await this.logAlert(
        `Critical: ${this.consecutiveFailures} consecutive AI failures`,
        'critical'
      );
    }

    console.error(`❌ [AI-Monitor] Failed ${endpoint} after ${duration}ms: ${error}`);
  }

  logRequest(entry) {
    try {
      const logLine = JSON.stringify(entry) + '\\n';
      fs.appendFileSync(this.requestLogPath, logLine);
    } catch (error) {
      console.error('Failed to log AI request:', error);
    }
  }

  async logAlert(message, severity, details = null) {
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
      fs.appendFileSync(this.logFilePath, alertEntry);

      const emoji = {
        info: '💡',
        warning: '⚠️',
        error: '❌',
        critical: '🚨',
        performance: '⏱️'
      }[severity] || '📋';
      
      console.log(`${emoji} [AI-Monitor] ${severity.toUpperCase()}: ${message}`);
    } catch (error) {
      console.error('Failed to log AI monitoring alert:', error);
    }
  }
}

const monitor = new ServerAIMonitor();

/**
 * Wrap AI API calls with monitoring
 */
async function monitorAIRequest(endpoint, model, requestData, apiCall) {
  const startTime = Date.now();
  const requestId = await monitor.startRequest(endpoint, model, requestData);
  
  try {
    const result = await apiCall();
    await monitor.completeRequest(requestId, endpoint, result, startTime);
    return result;
  } catch (error) {
    await monitor.failRequest(requestId, endpoint, error, startTime);
    throw error;
  }
}

module.exports = {
  monitor,
  monitorAIRequest,
  ServerAIMonitor
};