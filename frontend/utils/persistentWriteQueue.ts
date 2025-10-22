import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceId } from './clientUuid';

export interface PersistentWriteItem<T = any> {
  localId: string;
  deviceId: string;
  userId?: string;
  type: 'medication' | 'symptom' | 'lab_report' | 'other';
  payload: T;
  createdAt: number;
  attempts: number;
  lastAttempt?: number;
  status: 'pending' | 'processing' | 'synced' | 'failed';
  serverId?: string;
  error?: string;
}

const QUEUE_STORAGE_KEY = 'hamlymd_write_queue';
const MAX_ATTEMPTS = 5;
const BACKOFF_BASE_MS = 500;

class PersistentWriteQueue {
  private queue: Map<string, PersistentWriteItem> = new Map();
  private processing = false;
  private listeners: Set<(queue: PersistentWriteItem[]) => void> = new Set();

  async initialize(): Promise<void> {
    await this.loadFromStorage();
    console.log(`📝 Write queue initialized with ${this.queue.size} pending items`);
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        const items: PersistentWriteItem[] = JSON.parse(stored);
        items.forEach(item => {
          this.queue.set(item.localId, item);
        });
      }
    } catch (error) {
      console.error('Failed to load write queue from storage:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const items = Array.from(this.queue.values());
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save write queue to storage:', error);
    }
  }

  private notifyListeners(): void {
    const items = this.getAllItems();
    this.listeners.forEach(listener => {
      try {
        listener(items);
      } catch (error) {
        console.error('Error in queue listener:', error);
      }
    });
  }

  subscribe(listener: (queue: PersistentWriteItem[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getAllItems());
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  async enqueue<T>(
    type: PersistentWriteItem['type'],
    payload: T,
    userId?: string
  ): Promise<string> {
    const deviceId = await getDeviceId();
    const localId = `${deviceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const item: PersistentWriteItem<T> = {
      localId,
      deviceId,
      userId,
      type,
      payload,
      createdAt: Date.now(),
      attempts: 0,
      status: 'pending',
    };

    this.queue.set(localId, item);
    await this.saveToStorage();
    this.notifyListeners();

    console.log(`📝 Enqueued write: ${type} (${localId})`);

    this.processQueue().catch(err =>
      console.error('Error processing queue after enqueue:', err)
    );

    return localId;
  }

  async processQueue(
    executor?: (item: PersistentWriteItem) => Promise<{ serverId?: string; error?: string }>
  ): Promise<void> {
    if (this.processing) {
      console.log('Queue already processing, skipping');
      return;
    }

    this.processing = true;

    try {
      const pendingItems = Array.from(this.queue.values()).filter(
        item => item.status === 'pending' || item.status === 'failed'
      );

      if (pendingItems.length === 0) {
        return;
      }

      console.log(`🔄 Processing ${pendingItems.length} pending write(s)`);

      for (const item of pendingItems) {
        if (item.attempts >= MAX_ATTEMPTS) {
          console.error(`❌ Item ${item.localId} exhausted all attempts, marking as failed`);
          item.status = 'failed';
          item.error = 'Max attempts reached';
          await this.saveToStorage();
          this.notifyListeners();
          continue;
        }

        const backoffDelay = BACKOFF_BASE_MS * Math.pow(2, item.attempts);
        const timeSinceLastAttempt = Date.now() - (item.lastAttempt || 0);

        if (item.lastAttempt && timeSinceLastAttempt < backoffDelay) {
          continue;
        }

        item.status = 'processing';
        item.attempts++;
        item.lastAttempt = Date.now();
        this.notifyListeners();

        if (executor) {
          try {
            const result = await executor(item);

            if (result.serverId) {
              item.serverId = result.serverId;
              item.status = 'synced';
              item.error = undefined;
              console.log(`✅ Synced ${item.type}: ${item.localId} → ${result.serverId}`);
            } else if (result.error) {
              item.status = 'failed';
              item.error = result.error;
              console.error(`❌ Failed to sync ${item.localId}:`, result.error);
            }
          } catch (error) {
            item.status = 'failed';
            item.error = error instanceof Error ? error.message : String(error);
            console.error(`❌ Error syncing ${item.localId}:`, error);
          }

          await this.saveToStorage();
          this.notifyListeners();
        }
      }
    } finally {
      this.processing = false;
    }
  }

  getItem(localId: string): PersistentWriteItem | undefined {
    return this.queue.get(localId);
  }

  getAllItems(): PersistentWriteItem[] {
    return Array.from(this.queue.values());
  }

  getPendingItems(): PersistentWriteItem[] {
    return this.getAllItems().filter(item => item.status === 'pending' || item.status === 'processing');
  }

  async markSynced(localId: string, serverId: string): Promise<void> {
    const item = this.queue.get(localId);
    if (item) {
      item.status = 'synced';
      item.serverId = serverId;
      item.error = undefined;
      await this.saveToStorage();
      this.notifyListeners();
      console.log(`✅ Marked ${localId} as synced with server ID ${serverId}`);
    }
  }

  async markFailed(localId: string, error: string): Promise<void> {
    const item = this.queue.get(localId);
    if (item) {
      item.status = 'failed';
      item.error = error;
      await this.saveToStorage();
      this.notifyListeners();
      console.error(`❌ Marked ${localId} as failed:`, error);
    }
  }

  async removeSynced(): Promise<void> {
    const beforeSize = this.queue.size;
    const syncedItems = Array.from(this.queue.values()).filter(item => item.status === 'synced');
    
    syncedItems.forEach(item => {
      this.queue.delete(item.localId);
    });

    if (syncedItems.length > 0) {
      await this.saveToStorage();
      this.notifyListeners();
      console.log(`🗑️ Removed ${syncedItems.length} synced items (${beforeSize} → ${this.queue.size})`);
    }
  }

  async clearAll(): Promise<void> {
    this.queue.clear();
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
    this.notifyListeners();
    console.log('🗑️ Cleared all write queue items');
  }

  getStatus() {
    const items = this.getAllItems();
    return {
      total: items.length,
      pending: items.filter(i => i.status === 'pending').length,
      processingItems: items.filter(i => i.status === 'processing').length,
      synced: items.filter(i => i.status === 'synced').length,
      failed: items.filter(i => i.status === 'failed').length,
      isProcessing: this.processing,
    };
  }
}

export const persistentWriteQueue = new PersistentWriteQueue();

if (typeof window !== 'undefined') {
  (window as any).writeQueueStatus = () => persistentWriteQueue.getStatus();
  (window as any).writeQueueClear = () => persistentWriteQueue.clearAll();
  (window as any).writeQueueItems = () => persistentWriteQueue.getAllItems();
}
