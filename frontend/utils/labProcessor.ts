import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { getCurrentLanguage } from '@/utils/i18n';
import { getApiUrl, safeFetch, isBackendAvailable, createAuthHeaders } from '@/utils/apiConfig';

export interface ExtractedLabData {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  category: 'blood' | 'urine' | 'ultrasound' | 'genetic' | 'other';
  isAbnormal: boolean;
  notes?: string;
  explanation?: string;
}

export interface LabProcessingResult {
  success: boolean;
  data?: ExtractedLabData[];
  error?: string;
  summary?: string;
  reportDate?: string;
}

export async function processLabDocument(documentUri: string, mimeType?: string): Promise<LabProcessingResult> {
  const startTime = Date.now();
  console.log('Starting document processing:', { documentUri, mimeType, timestamp: new Date().toISOString() });

  try {
    // Convert document to base64
    const { base64Data, detectedMimeType } = await convertDocumentToBase64(documentUri, mimeType);
    const conversionTime = Date.now() - startTime;
    console.log('Document converted to base64', {
      length: base64Data.length,
      mimeType: detectedMimeType,
      conversionTimeMs: conversionTime,
    });

    // Validate base64 size (approx 1MB)
    if (base64Data.length > 1_500_000) {
      console.log('File size validation failed', { base64Length: base64Data.length });
      return {
        success: false,
        error: 'File too large. Please upload a file smaller than 1MB.',
      };
    }

    // Set API URL using apiConfig
    const apiUrl = getApiUrl('processLabReport');
    console.log('Attempting to fetch API:', { apiUrl });
    
    // Use createAuthHeaders to ensure ngrok header is included
    const headers = createAuthHeaders();

    // Get auth token and pregnancy context for user context
    let authHeaders = {};
    let pregnancyWeek = 0;
    try {
      const { supabase } = await import('./supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        authHeaders = { 'Authorization': `Bearer ${session.access_token}` };
        console.log('Auth token retrieved for lab processing');
        
        // Get pregnancy context
        const { calculateGestationalAge } = await import('./pregnancy');
        const { data: pregnancies } = await supabase
          .from('pregnancies')
          .select('last_menstrual_period')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .limit(1);
          
        if (pregnancies && pregnancies.length > 0) {
          const pregnancy = pregnancies[0] as { last_menstrual_period?: string };
          if (pregnancy.last_menstrual_period) {
            const gestationalAge = calculateGestationalAge(pregnancy.last_menstrual_period);
            pregnancyWeek = gestationalAge.weeks;
            console.log('Calculated pregnancy week for lab processing:', pregnancyWeek);
          }
        }
      } else {
        console.warn('No auth session available for lab processing');
      }
    } catch (error) {
      console.warn('Could not get auth session for lab processing:', error);
    }

    // Check if backend is available
    if (!isBackendAvailable()) {
      console.log('⚠️ Backend not available - cannot process lab report');
      return {
        success: false,
        error: 'خدمة معالجة التحليلات غير متاحة حالياً. يمكنك إدخال النتائج يدوياً.',
      };
    }

    const response = await safeFetch(apiUrl, {
      method: 'POST',
      headers: createAuthHeaders(authHeaders['Authorization']?.replace('Bearer ', '')),
      body: JSON.stringify({
        image: base64Data,
        mimeType: detectedMimeType,
        language: getCurrentLanguage(),
        pregnancyWeek: pregnancyWeek,
      }),
    });

    const apiTime = Date.now() - startTime - conversionTime;

    if (!response) {
      console.log('⚠️ API call failed - backend not available');
      return {
        success: false,
        error: 'فشل الاتصال بالباك إند. يمكنك إدخال النتائج يدوياً.',
      };
    }

    console.log('API response received', { status: response.status, apiTimeMs: apiTime });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', { status: response.status, errorText });
      return {
        success: false,
        error:
          response.status === 400
            ? errorText.includes('File too large')
              ? 'File too large. Please upload a file smaller than 1MB.'
              : errorText.includes('Invalid file format')
              ? 'Invalid file format. Ensure the image is clear or the PDF contains readable text.'
              : `Bad request: ${errorText}`
            : response.status === 429 || response.status === 503
            ? 'AI service is temporarily overloaded. Please wait a moment and try again.'
            : response.status === 502
            ? 'Processing timeout or server error. Try a smaller or simpler file (e.g., single-page PDF or low-resolution image).'
            : `API error: ${response.status} - ${errorText}`,
      };
    }

    const result = await response.json();
    console.log('API result:', { testsCount: result.tests?.length, summary: result.summary, reportDate: result.reportDate });

    if (!result.tests || !Array.isArray(result.tests)) {
      console.log('No valid test results found');
      return {
        success: false,
        error: 'No valid lab test results found in the document.',
      };
    }

    const totalTime = Date.now() - startTime;
    console.log('Processing completed successfully', { totalTimeMs: totalTime });

    return {
      success: true,
      data: result.tests,
      summary: result.summary,
      reportDate: result.reportDate,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('Error processing lab document:', { error, totalTimeMs: totalTime });
    return {
      success: false,
      error: error instanceof Error
        ? error.message.includes('Failed to fetch')
          ? 'Failed to connect to the server. Please check your internet connection or try again later.'
          : `Failed to process lab report: ${error.message}`
        : 'Failed to process lab report: Unknown error',
    };
  }
}

async function convertDocumentToBase64(documentUri: string, providedMimeType?: string): Promise<{ base64Data: string; detectedMimeType: string }> {
  const startTime = Date.now();
  console.log('Converting document to base64:', { documentUri, providedMimeType });

  try {
    let base64Data: string;
    let detectedMimeType = providedMimeType || 'application/octet-stream';

    if (Platform.OS === 'web') {
      // Web platform: Use FileReader
      const response = await fetch(documentUri);
      const blob = await response.blob();

      // Detect MIME type if not provided
      detectedMimeType = providedMimeType || blob.type;
      if (!detectedMimeType || detectedMimeType === 'application/octet-stream') {
        if (documentUri.toLowerCase().includes('.pdf')) {
          detectedMimeType = 'application/pdf';
        } else if (documentUri.toLowerCase().match(/\.(jpg|jpeg)$/)) {
          detectedMimeType = 'image/jpeg';
        } else if (documentUri.toLowerCase().includes('.png')) {
          detectedMimeType = 'image/png';
        } else {
          detectedMimeType = 'image/jpeg'; // Default
        }
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          base64Data = result.split(',')[1];
          const conversionTime = Date.now() - startTime;
          console.log('Base64 conversion complete (web)', { length: base64Data.length, conversionTimeMs: conversionTime });
          resolve({ base64Data, detectedMimeType });
        };
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(new Error('Failed to convert document to base64'));
        };
        reader.readAsDataURL(blob);
      });
    } else {
      // Native platform: Use expo-file-system
      base64Data = await FileSystem.readAsStringAsync(documentUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Detect MIME type if not provided
      if (!detectedMimeType || detectedMimeType === 'application/octet-stream') {
        if (documentUri.toLowerCase().includes('.pdf')) {
          detectedMimeType = 'application/pdf';
        } else if (documentUri.toLowerCase().match(/\.(jpg|jpeg)$/)) {
          detectedMimeType = 'image/jpeg';
        } else if (documentUri.toLowerCase().includes('.png')) {
          detectedMimeType = 'image/png';
        } else {
          detectedMimeType = 'image/jpeg'; // Default
        }
      }

      const conversionTime = Date.now() - startTime;
      console.log('Base64 conversion complete (native)', { length: base64Data.length, conversionTimeMs: conversionTime });
      return { base64Data, detectedMimeType };
    }
  } catch (error) {
    console.error('Error converting document to base64:', error);
    throw new Error('Failed to convert document to base64');
  }
}