import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Helper function to assemble user context from Supabase
export async function assembleUserContext(userId: string, supabaseServiceKey?: string) {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  // Use service key if available, otherwise fall back to anon key with user auth
  const keyToUse = serviceKey || anonKey;

  if (!keyToUse) {
    console.error('No Supabase key available for context assembly');
    return null;
  }

  const supabase = createClient(supabaseUrl, keyToUse, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('Context assembly using key type:', serviceKey ? 'service' : 'anon');

  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount < maxRetries) {
    try {
      console.log(`Assembling user context attempt ${retryCount + 1}/${maxRetries} for user:`, userId);
    // Query active pregnancy for user
    const { data: pregnancies, error: pregnancyError } = await supabase
      .from('pregnancies')
      .select('id, last_menstrual_period, is_active, due_date')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1);

    if (pregnancyError) {
      console.error('Error fetching pregnancies:', pregnancyError);
    }

    // Query current medications
    const { data: medications, error: medicationError } = await supabase
      .from('medications')
      .select('id, name, dosage, frequency, fda_category, llm_safety_analysis')
      .eq('user_id', userId)
      .or('end_date.is.null,end_date.gte.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (medicationError) {
      console.error('Error fetching medications:', medicationError);
    }

    // Query recent lab results with their reports (last 3 reports worth of results)
    const { data: labReports, error: labReportsError } = await supabase
      .from('lab_reports')
      .select(`
        id,
        date,
        summary,
        lab_results (
          id,
          test_name,
          value,
          unit,
          reference_range,
          date,
          is_abnormal,
          explanation,
          category
        )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(3);

    if (labReportsError) {
      console.error('Error fetching lab reports:', labReportsError);
    }

    // Flatten lab results from the 3 most recent reports
    const labResults = labReports?.flatMap(report => 
      (report.lab_results || []).map((result: any) => ({
        ...result,
        report_date: report.date,
        report_summary: report.summary
      }))
    ) || [];

    // Calculate pregnancy week if active pregnancy exists
    let pregnancyWeek = 0;
    let isPregnant = false;

    if (pregnancies && pregnancies.length > 0) {
      const pregnancy = pregnancies[0];
      isPregnant = true;

      if (pregnancy.last_menstrual_period) {
        const lmpDate = new Date(pregnancy.last_menstrual_period);
        const currentDate = new Date();
        const diffInMs = currentDate.getTime() - lmpDate.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        const diffInWeeks = Math.floor(diffInDays / 7);
        pregnancyWeek = Math.max(1, Math.min(42, diffInWeeks)); // Clamp between 1-42 weeks

        console.log('Pregnancy week calculation:', {
          lmp: pregnancy.last_menstrual_period,
          diffInDays,
          diffInWeeks,
          finalWeek: pregnancyWeek
        });
      }
    }

    // Assemble context object with enhanced lab report information
      const context = {
        profile: {
          id: userId
        },
        userContext: {
          pregnancyWeek,
          isPregnant,
          currentMedications: medications || [],
          recentLabResults: labResults || [],
          recentLabReports: labReports || [],
          recentLabTrends: (labResults || []).slice(0, 5).map(lab => ({
            testName: lab.test_name,
            value: lab.value,
            unit: lab.unit,
            date: lab.date,
            isAbnormal: lab.is_abnormal,
            reportDate: lab.report_date
          }))
        },
        pregnancyWeek, // Duplicate for backward compatibility
        userId,
        currentMedications: medications || [],
        recentLabResults: labResults || [],
        recentLabReports: labReports || [],
        // Standardized field names for verification
        medications: medications || [],
        labResults: labResults || [],
        labReports: labReports || []
      };

      console.log('User context assembled successfully:', {
        pregnancyWeek,
        isPregnant,
        medicationCount: medications?.length || 0,
        labResultCount: labResults?.length || 0,
        labReportCount: labReports?.length || 0
      });

      return context;

    } catch (error) {
      console.error(`Context assembly attempt ${retryCount + 1} failed:`, error);

      retryCount++;

      if (retryCount >= maxRetries) {
        console.error('All context assembly attempts failed');
        return null;
      }

      // Wait before retry
      const waitTime = 1000 * retryCount;
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return null;
}

// Helper function to mask sensitive data
function maskSensitiveData(obj: any): void {
  const sensitiveKeys = ['apiKey', 'api_key', 'token', 'secret', 'password', 'key'];

  if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        obj[key] = '[MASKED]';
      } else if (typeof obj[key] === 'object') {
        maskSensitiveData(obj[key]);
      }
    }
  }
}

// Save final Gemini payload for testing (without secrets)
export function saveGeminiPayload(payload: any, endpoint: string) {
  if (typeof window === 'undefined') { // Server-side only
    const fs = require('fs');
    const path = require('path');

    try {
      const logsDir = path.join(process.cwd(), 'tests', 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // Mask any sensitive data
      const maskedPayload = JSON.parse(JSON.stringify(payload));
      maskSensitiveData(maskedPayload);

      const timestamp = Date.now();
      const filename = `gemini-${endpoint}-final-request-${timestamp}.json`;
      const filepath = path.join(logsDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(maskedPayload, null, 2));
      console.log(`Saved Gemini payload to: ${filepath}`);

    } catch (error) {
      console.error('Error saving Gemini payload:', error);
    }
  }
}

// Placeholder for assembleContextForAI - actual implementation will use sessionManager
export async function assembleContextForAI(
  userId: string,
  contextType: 'medication' | 'symptom' | 'lab',
  specificData?: any
): Promise<string> {
  try {
    console.log(`📋 Assembling ${contextType} context for user ${userId}`);

    // Ensure session is valid before proceeding
    const { sessionManager } = await import('./sessionManager');
    const sessionValid = await sessionManager.refreshSessionIfNeeded();

    if (!sessionValid) {
      console.warn('⚠️ Session invalid - attempting to refresh');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        throw new Error('Session expired - please refresh the page');
      }
    }

    let contextData: any[] = [];
    let error: Error | null = null;

    switch (contextType) {
      case 'medication':
        // Fetch active pregnancy with session check
        const { data: pregnancy, error: pregError } = await sessionManager.withSessionCheck(async () => {
          return await supabase
            .from('pregnancies')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle();
        });
        if (pregError) {
          console.error('Error fetching pregnancy:', pregError);
          error = pregError as Error;
        }

        // Fetch medications with session check
        const { data: medications, error: medsError } = await sessionManager.withSessionCheck(async () => {
          return await supabase
            .from('medications')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        });
        if (medsError) {
          console.error('Error fetching medications:', medsError);
          error = medsError as Error;
        }
        contextData = medications || [];
        break;

      case 'symptom':
        // Fetch recent symptoms with session check
        const { data: symptoms, error: sympError } = await sessionManager.withSessionCheck(async () => {
          return await supabase
            .from('symptoms')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);
        });
        if (sympError) {
          console.error('Error fetching symptoms:', sympError);
          error = sympError as Error;
        }
        contextData = symptoms || [];
        break;

      case 'lab':
        // Fetch recent lab results with session check
        const { data: labResults, error: labError } = await sessionManager.withSessionCheck(async () => {
          return await supabase
            .from('lab_results')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(10);
        });
        if (labError) {
          console.error('Error fetching lab results:', labError);
          error = labError as Error;
        }
        contextData = labResults || [];
        break;

      default:
        throw new Error(`Unsupported context type: ${contextType}`);
    }

    if (error) {
      throw error;
    }

    if (contextData.length === 0) {
      return "No relevant data found to build context.";
    }

    // Simple summarization logic (can be expanded)
    let contextString = `User ${userId} has the following ${contextType} data:\n`;
    contextData.forEach((item, index) => {
      contextString += `${index + 1}. ${JSON.stringify(item)}\n`;
    });

    return contextString;

  } catch (e) {
    console.error(`Error assembling context for AI: ${e}`);
    return `Error: Failed to assemble context for ${contextType}. Please try again later.`;
  }
}