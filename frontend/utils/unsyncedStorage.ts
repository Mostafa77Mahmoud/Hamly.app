
import { saveData, loadData, removeData } from './storage';

export interface UnsyncedItem {
  id: string;
  clientRequestId: string;
  type: 'symptom' | 'medication' | 'lab_result';
  data: Record<string, any>;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

const UNSYNCED_STORAGE_KEY = 'unsynced_items';

export async function addUnsyncedItem(item: Omit<UnsyncedItem, 'timestamp' | 'retryCount'>): Promise<void> {
  const items = await getUnsyncedItems();
  const newItem: UnsyncedItem = {
    ...item,
    timestamp: Date.now(),
    retryCount: 0
  };
  
  // Prevent duplicates based on clientRequestId
  const filtered = items.filter(existing => existing.clientRequestId !== item.clientRequestId);
  filtered.push(newItem);
  
  await saveData(UNSYNCED_STORAGE_KEY, filtered);
}

export async function getUnsyncedItems(): Promise<UnsyncedItem[]> {
  return await loadData<UnsyncedItem[]>(UNSYNCED_STORAGE_KEY) || [];
}

export async function removeUnsyncedItem(clientRequestId: string): Promise<void> {
  const items = await getUnsyncedItems();
  const filtered = items.filter(item => item.clientRequestId !== clientRequestId);
  await saveData(UNSYNCED_STORAGE_KEY, filtered);
}

export async function updateUnsyncedItemRetry(clientRequestId: string, error: string): Promise<void> {
  const items = await getUnsyncedItems();
  const updated = items.map(item => 
    item.clientRequestId === clientRequestId 
      ? { ...item, retryCount: item.retryCount + 1, lastError: error }
      : item
  );
  await saveData(UNSYNCED_STORAGE_KEY, updated);
}

export function generateClientRequestId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
