import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'hamlymd_device_id';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function getStorage() {
  if (Platform.OS === 'web') {
    return {
      getItem: async (key: string) => {
        try {
          return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
        } catch {
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, value);
          }
        } catch {}
      },
    };
  } else {
    try {
      return SecureStore;
    } catch {
      return AsyncStorage;
    }
  }
}

let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    const storage = await getStorage();
    let deviceId = await storage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
      deviceId = generateUUID();
      await storage.setItem(DEVICE_ID_KEY, deviceId);
      console.log('Generated new device ID:', deviceId);
    }

    cachedDeviceId = deviceId;
    return deviceId;
  } catch (error) {
    console.error('Failed to get/set device ID, using temporary UUID:', error);
    const tempId = generateUUID();
    cachedDeviceId = tempId;
    return tempId;
  }
}

export async function resetDeviceId(): Promise<string> {
  try {
    const storage = await getStorage();
    const newId = generateUUID();
    await storage.setItem(DEVICE_ID_KEY, newId);
    cachedDeviceId = newId;
    console.log('Reset device ID to:', newId);
    return newId;
  } catch (error) {
    console.error('Failed to reset device ID:', error);
    throw error;
  }
}

if (typeof window !== 'undefined') {
  (window as any).getDeviceId = getDeviceId;
  (window as any).resetDeviceId = resetDeviceId;
}
