// Unified API configuration for frontend-backend communication
// Development: http://localhost:3001
// Production: Use EXPO_PUBLIC_API_BASE_URL environment variable

import { Platform } from 'react-native';
import Constants from 'expo-constants';

export function getApiBase(): string {
  // Check for explicit environment variable first
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // For browser/client-side in Replit or production
  if (typeof window !== 'undefined' && Platform.OS === 'web') {
    // Safe origin detection
    let currentOrigin: string;
    try {
      currentOrigin = window.location.origin;
    } catch (e) {
      currentOrigin = 'http://localhost:5000';
    }
    
    // If we're on Replit (has .replit.dev domain)
    if (currentOrigin.includes('.replit.dev')) {
      // Use the same domain but with port 3001 for backend
      try {
        const url = new URL(currentOrigin);
        url.port = '3001';
        return url.toString().replace(/\/$/, ''); // Remove trailing slash
      } catch (e) {
        console.warn('[API_CONFIG] Failed to parse origin, falling back to localhost');
        return 'http://localhost:3001';
      }
    }
    
    // For local development
    return 'http://localhost:3001';
  }

  // Native platform fallback
  if (Platform.OS !== 'web') {
    // On native, use scheme or fallback to localhost (won't work but safe)
    const scheme = Constants.expoConfig?.scheme || 'hamly';
    console.log('[API_CONFIG] Native platform detected, scheme:', scheme);
  }

  // Server-side/Node.js fallback
  return 'http://localhost:3001';
}

export const API_ENDPOINTS = {
  medicationSafety: '/api/medication-safety-api',
  processLabReport: '/api/process-lab-report-api',
  analyzeSymptom: '/api/analyze-symptom-api',
} as const;

export function getApiUrl(endpoint: keyof typeof API_ENDPOINTS): string {
  return `${getApiBase()}${API_ENDPOINTS[endpoint]}`;
}

// API configuration - Use dynamic base URL
function getConfiguredBaseURL(): string {
  const baseURL = getApiBase();
  console.log("🌐 [API_CONFIG] Base URL:", baseURL);
  console.log("🔧 [API_CONFIG] Environment:", process.env.EXPO_PUBLIC_API_BASE_URL);
  
  // Safe origin logging
  let originLog = 'server-side';
  if (typeof window !== 'undefined' && Platform.OS === 'web') {
    try {
      originLog = window.location.origin;
    } catch (e) {
      originLog = 'unknown';
    }
  } else if (Platform.OS !== 'web') {
    originLog = `native-${Platform.OS}`;
  }
  console.log("📍 [API_CONFIG] Current origin:", originLog);
  console.log("📍 [API_CONFIG] All endpoints ready:", Object.keys(API_ENDPOINTS));
  return baseURL;
}

const API_BASE_URL = getConfiguredBaseURL();

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 120000,
};

// Helper to create authenticated headers
export function createAuthHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'ngrok-skip-browser-warning': 'true',
    'User-Agent': 'Hamly-App/1.0',
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  console.log('📤 [API_CONFIG] Request headers:', headers);
  return headers;
}

// Helper to create fetch options with ngrok compatibility
export function createFetchOptions(options?: RequestInit): RequestInit {
  return {
    ...options,
    mode: 'cors',
    credentials: 'omit', // Don't send credentials to avoid CORS issues
    headers: {
      'ngrok-skip-browser-warning': 'true',
      'User-Agent': 'Hamly-App',
      ...options?.headers,
    },
  };
}

// Check if backend API is available (not localhost on mobile)
export function isBackendAvailable(): boolean {
  const baseURL = getApiBase();
  const envURL = process.env.EXPO_PUBLIC_API_BASE_URL;
  
  // If explicitly set to empty string, backend is disabled
  if (envURL === '') {
    console.log('🚫 [API_CONFIG] Backend disabled (empty env var)');
    return false;
  }
  
  // Parse the resolved base URL
  let url: URL;
  try {
    url = new URL(baseURL);
  } catch (error) {
    console.log('🚫 [API_CONFIG] Invalid base URL:', baseURL);
    return false;
  }
  
  // Check if we're on native (React Native) - window is undefined
  const isNative = typeof window === 'undefined';
  
  // On native, reject localhost/loopback addresses
  if (isNative && (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.startsWith('192.168.'))) {
    console.log('🚫 [API_CONFIG] Backend not available (localhost on native):', url.hostname);
    return false;
  }
  
  // On web/browser, allow the origin-based fallback
  // Backend is available if we have a valid URL
  const isAvailable = !!baseURL && baseURL !== '';
  console.log(`${isAvailable ? '✅' : '⚠️'} [API_CONFIG] Backend available:`, isAvailable, 'URL:', baseURL, 'Native:', isNative);
  return isAvailable;
}

// Safe API call wrapper with error handling
// Note: ngrok headers are added globally via ngrokFix.ts
export async function safeFetch(url: string, options?: RequestInit): Promise<Response | null> {
  if (!isBackendAvailable()) {
    console.log('⏭️ [API_CONFIG] Skipping API call (backend not available):', url);
    return null;
  }
  
  try {
    console.log(`🌐 [API_CONFIG] Fetching: ${url.substring(url.lastIndexOf('/'))}`);
    
    const response = await fetch(url, options);
    
    console.log(`✅ [API_CONFIG] Response: ${response.status}`);
    return response;
  } catch (error) {
    console.error('❌ [API_CONFIG] API call failed:', error);
    return null;
  }
}