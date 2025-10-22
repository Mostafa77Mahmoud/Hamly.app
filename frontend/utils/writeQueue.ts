/**
 * Write Queue for AI Operations
 * Separate circuit breaker and retry logic for write/AI operations
 * to ensure they don't get blocked by read circuit breaker states
 */

import { requestWithRetries } from './supabase';

interface WriteOperation<T> {
  id: string;
  operation: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  retryCount: number;
  createdAt: number;
}

class WriteQueue {
  private queue: WriteOperation<any>[] = [];
  private processing = false;
  private readonly maxRetries = 3;
  private readonly retryDelayMs = 1000;

  async enqueue<T>(operationId: string, operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const writeOp: WriteOperation<T> = {
        id: operationId,
        operation,
        resolve,
        reject,
        retryCount: 0,
        createdAt: Date.now(),
      };

      this.queue.push(writeOp);
      console.log(`📝 Enqueued write operation: ${operationId}`);
      
      // Start processing if not already running
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    console.log(`🔄 Processing write queue (${this.queue.length} operations)`);

    while (this.queue.length > 0) {
      const operation = this.queue.shift()!;
      await this.processOperation(operation);
    }

    this.processing = false;
    console.log('✅ Write queue processing completed');
  }

  private async processOperation<T>(op: WriteOperation<T>): Promise<void> {
    try {
      console.log(`🔄 Executing write operation: ${op.id} (attempt ${op.retryCount + 1}/${this.maxRetries + 1})`);
      
      // Use write-specific circuit breaker with separate key prefix
      const result = await requestWithRetries(
        `write_${op.id}`,
        op.operation,
        2,
        30000
      );

      console.log(`✅ Write operation completed: ${op.id}`);
      op.resolve(result);
    } catch (error) {
      op.retryCount++;
      
      const errorInfo = {
        operationId: op.id,
        attempt: op.retryCount,
        maxRetries: this.maxRetries,
        error: error instanceof Error ? error.message : String(error),
        ageMs: Date.now() - op.createdAt,
      };
      
      console.log(`❌ Write operation failed: ${op.id}`, errorInfo);

      if (op.retryCount <= this.maxRetries) {
        // Exponential backoff with jitter
        const delay = this.retryDelayMs * Math.pow(2, op.retryCount - 1) + Math.random() * 1000;
        console.log(`⏳ Retrying write operation ${op.id} in ${Math.round(delay)}ms`);
        
        setTimeout(() => {
          this.queue.unshift(op); // Put back at front of queue
          this.processQueue();
        }, delay);
      } else {
        console.error(`❌ Write operation exhausted retries: ${op.id}`);
        op.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  // Debug helpers
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      operations: this.queue.map(op => ({
        id: op.id,
        retryCount: op.retryCount,
        ageMs: Date.now() - op.createdAt,
      })),
    };
  }

  clearQueue() {
    const cleared = this.queue.length;
    this.queue.forEach(op => op.reject(new Error('Queue cleared')));
    this.queue = [];
    console.log(`🗑️ Cleared ${cleared} write operations from queue`);
  }
}

// Global write queue instance
export const writeQueue = new WriteQueue();

// Convenience wrapper for AI operations
export const executeAIOperation = async <T>(
  operationId: string,
  operation: () => Promise<T>
): Promise<T> => {
  return writeQueue.enqueue(`ai_${operationId}`, operation);
};

// Convenience wrapper for database writes
export const executeDatabaseWrite = async <T>(
  operationId: string,
  operation: () => Promise<T>
): Promise<T> => {
  return writeQueue.enqueue(`db_${operationId}`, operation);
};

// Debug helpers for development
if (typeof window !== 'undefined') {
  (window as any).writeQueueStatus = () => writeQueue.getQueueStatus();
  (window as any).clearWriteQueue = () => writeQueue.clearQueue();
}