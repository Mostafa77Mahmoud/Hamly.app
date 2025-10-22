// Cache-first data management with AsyncStorage
import AsyncStorage from "@react-native-async-storage/async-storage";

export const CACHE_KEYS = {
  MEDICATIONS: "cache_medications_v2",
  SYMPTOMS: "cache_symptoms_v2",
  LAB_REPORTS: "cache_lab_reports_v2",
  LAB_RESULTS: "cache_lab_results_v2",
  ACTIVE_PREGNANCY: "cache_active_pregnancy_v2",
  USER_PROFILE: "cache_user_profile_v2",
} as const;

interface CacheItem<T> {
  data: T;
  timestamp: number;
  version: string;
  traceId?: string;
}

// Cache data with trace information
export const cacheData = async <T>(
  key: string,
  data: T,
  traceId?: string,
): Promise<void> => {
  try {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      version: "2.0",
      traceId,
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    console.log(`💾 Cache: Stored ${key}${traceId ? ` [${traceId}]` : ""}`);
  } catch (error) {
    console.warn(`⚠️ Cache: Failed to store ${key}:`, error);
  }
};

// Get cached data with age limit (REDUCED from 180s to 30s for fresher data)
export const getCachedData = async <T>(
  key: string,
  maxAgeMs: number = 30000, // Reduced from 180000 (3 minutes) to 30000 (30 seconds)
): Promise<T | null> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const cacheItem: CacheItem<T> = JSON.parse(cached);
    const age = Date.now() - cacheItem.timestamp;

    // Check if cache is expired
    if (age > maxAgeMs) {
      console.log(
        `🗑️ Cache: Expired ${key} (age: ${age}ms > ${maxAgeMs}ms), removing`,
      );
      await AsyncStorage.removeItem(key);
      return null;
    }

    console.log(
      `📦 Cache: Retrieved ${key} (age: ${age}ms)${cacheItem.traceId ? ` [${cacheItem.traceId}]` : ""}`,
    );
    return cacheItem.data;
  } catch (error) {
    console.warn(`⚠️ Cache: Failed to retrieve ${key}:`, error);
    return null;
  }
};
// Clear specific or all cache
export const clearCache = async (key?: string): Promise<void> => {
  try {
    if (key) {
      await AsyncStorage.removeItem(key);
      console.log(`🗑️ Cache: Cleared ${key}`);
    } else {
      const allKeys = Object.values(CACHE_KEYS);
      await AsyncStorage.multiRemove(allKeys);
      console.log(`🗑️ Cache: Cleared all cache keys`);
    }
  } catch (error) {
    console.warn("⚠️ Cache: Failed to clear cache:", error);
  }
};

// Get cache info for debugging
export const getCacheInfo = async (): Promise<
  Record<string, { size: number; age: number; hasData: boolean }>
> => {
  const info: Record<string, { size: number; age: number; hasData: boolean }> =
    {};

  for (const [name, key] of Object.entries(CACHE_KEYS)) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const cacheItem: CacheItem<any> = JSON.parse(cached);
        info[name] = {
          size: cached.length,
          age: Date.now() - cacheItem.timestamp,
          hasData:
            !!cacheItem.data &&
            (Array.isArray(cacheItem.data) ? cacheItem.data.length > 0 : true),
        };
      } else {
        info[name] = { size: 0, age: 0, hasData: false };
      }
    } catch (error) {
      info[name] = { size: 0, age: 0, hasData: false };
    }
  }

  return info;
};

// Expose cache info in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).getCacheInfo = getCacheInfo;
  (window as any).clearCache = clearCache;
}
