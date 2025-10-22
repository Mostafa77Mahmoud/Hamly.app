import { supabase, requestWithRetries } from './supabase';
import type { Database } from './supabase';
import type { Symptom } from '@/types';

type Tables = Database['public']['Tables'];

// Retry helper for network operations
const withRetry = async <T>(operation: () => Promise<T>, maxRetries: number = 3, delay: number = 1000): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} for Supabase operation`);
      return await operation();
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  throw new Error('All retry attempts failed');
};

// Profile
export const getProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Select only required columns to improve performance
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, created_at, updated_at')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const updateProfile = async (updates: Tables['profiles']['Update']) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Pregnancies
export const createPregnancy = async (pregnancy: Omit<Tables['pregnancies']['Insert'], 'user_id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('pregnancies')
    .insert({ ...pregnancy, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getPregnancies = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('pregnancies')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Optimized activePregnancy query using the new database function
export const getActivePregnancy = async (): Promise<any | null> => {
  return await withRetry(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Try the optimized database function first with longer timeout
    try {
      console.log('🚀 Using optimized get_active_pregnancy_fast function...');
      const { data, error } = await Promise.race([
        supabase.rpc('get_active_pregnancy_fast', { user_uuid: user.id }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Optimized function timeout')), 15000) // Increased timeout
        )
      ]);

      if (error) {
        console.error('Error in optimized active pregnancy function:', error);
        throw error;
      }

      // The function returns an array, get the first item or null
      const result = Array.isArray(data) ? data[0] || null : data;
      if (result) {
        console.log('✅ Active pregnancy loaded via optimized function:', result.name);
      } else {
        console.log('ℹ️ No active pregnancy found via optimized function');
      }
      return result;
    } catch (optimizedError) {
      console.warn('⚠️ Optimized function failed, trying direct query fallback:', optimizedError);

      // Fallback to direct query with longer timeout
      try {
        const { data, error } = await Promise.race([
          supabase
            .from('pregnancies')
            .select('id, user_id, name, last_menstrual_period, due_date, is_active, notes, created_at, updated_at')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Direct query timeout')), 18000) // Increased timeout
          )
        ]);

        if (error) {
          console.error('Error in direct active pregnancy query:', error);
          throw error;
        }

        if (data) {
          console.log('✅ Active pregnancy loaded via direct query fallback:', data.name);
        } else {
          console.log('ℹ️ No active pregnancy found via direct query');
        }
        return data;
      } catch (directError) {
        console.warn('⚠️ Direct query also failed, trying final fallback:', directError);

        // Final fallback: Get all pregnancies and filter in JavaScript
        try {
          const { data: allPregnancies, error: allError } = await Promise.race([
            supabase
              .from('pregnancies')
              .select('id, user_id, name, last_menstrual_period, due_date, is_active, notes, created_at, updated_at')
              .eq('user_id', user.id)
              .order('updated_at', { ascending: false }),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Final fallback timeout')), 20000) // Increased timeout
            )
          ]);

          if (allError) {
            console.error('❌ All fallback methods failed for active pregnancy:', allError);
            throw allError;
          }

          // Find active pregnancy in JavaScript
          const activePregnancy = allPregnancies?.find(p => p.is_active === true) || null;
          if (activePregnancy) {
            console.log('✅ Active pregnancy found via final JavaScript filter:', activePregnancy.name);
          } else {
            console.log('ℹ️ No active pregnancy found in final fallback');
          }
          return activePregnancy;
        } catch (finalError) {
          console.error('❌ Final fallback also failed:', finalError);

          // Last resort: Return null to avoid blocking the entire app
          console.warn('⚠️ All activePregnancy methods failed, returning null to avoid app blocking');
          return null;
        }
      }
    }
  }, 1, 2000); // Reduced retries but increased delay since we have comprehensive internal fallbacks
};

export const setActivePregnancy = async (pregnancyId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // First, set all pregnancies to inactive
  await supabase
    .from('pregnancies')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  // Then set the selected pregnancy to active
  const { data, error } = await supabase
    .from('pregnancies')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', pregnancyId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updatePregnancy = async (pregnancyId: string, updates: Partial<Tables['pregnancies']['Update']>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('pregnancies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', pregnancyId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Lab Reports
export const createLabReport = async (labReport: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('lab_reports')
    .insert([{ ...labReport, user_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getLabReports = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('lab_reports')
    .select(`
      *,
      lab_results (*)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getLabResults = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('lab_results')
    .select(`
      *,
      lab_reports!inner(
        id,
        user_id,
        date,
        summary
      )
    `)
    .eq('lab_reports.user_id', user.id)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const updateLabReport = async (reportId: string, updates: Partial<Tables['lab_reports']['Update']>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('lab_reports')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', reportId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteLabReport = async (reportId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // First delete associated lab results
  const { error: resultsError } = await supabase
    .from('lab_results')
    .delete()
    .eq('lab_report_id', reportId)
    .eq('user_id', user.id);

  if (resultsError) throw resultsError;

  // Then delete the lab report
  const { error } = await supabase
    .from('lab_reports')
    .delete()
    .eq('id', reportId)
    .eq('user_id', user.id);

  if (error) throw error;
};

// Lab Results
export const createLabResults = async (results: Omit<Tables['lab_results']['Insert'], 'user_id'>[]) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const resultsWithUserId = results.map(result => ({ ...result, user_id: user.id }));

  const { data, error } = await supabase
    .from('lab_results')
    .insert(resultsWithUserId)
    .select();

  if (error) throw error;
  return data || [];
};

// Medications
export const createMedication = async (medicationData: {
  user_id: string;
  pregnancy_id?: string | null;
  name: string;
  dosage: string;
  frequency: string;
  prescribed_date: string;
  end_date?: string | null;
  fda_category: 'A' | 'B' | 'C' | 'D' | 'X';
  fda_category_ai?: string | null;
  notes?: string | null;
  llm_safety_analysis?: string | null;
  llm_benefits?: string | null;
  llm_risks?: string | null;
  overall_safety?: string | null;
}): Promise<any> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('medications')
    .insert([{
      ...medicationData,
      user_id: session.user.id,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating medication:', error);
    throw error;
  }

  return data;
};

export const getMedications = async (): Promise<any[]> => {
  return await withRetry(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data: supabaseMedications, error } = await supabase
      .from('medications')
      .select(`
        id,
        name,
        dosage,
        frequency,
        prescribed_date,
        end_date,
        fda_category,
        fda_category_ai,
        notes,
        llm_safety_analysis,
        llm_benefits,
        llm_risks,
        overall_safety,
        created_at,
        updated_at,
        medication_adherence_logs(
          id,
          medication_id,
          date,
          taken,
          notes
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    console.log('📊 Supabase medications query result:', {
      count: supabaseMedications?.length || 0,
      hasData: !!supabaseMedications,
      sampleData: supabaseMedications?.[0] ? {
        name: supabaseMedications[0].name,
        llm_safety_analysis: supabaseMedications[0].llm_safety_analysis,
        llm_benefits: supabaseMedications[0].llm_benefits,
        llm_risks: supabaseMedications[0].llm_risks,
        overall_safety: supabaseMedications[0].overall_safety
      } : null
    });

    if (error) {
      console.error('Error fetching medications:', error);
      throw error;
    }

    // Remove duplicates at database level (by name)
    const seenNames = new Set<string>();
    const uniqueMeds = (supabaseMedications || []).filter(med => {
      const normalizedName = med.name.toLowerCase().trim();
      if (seenNames.has(normalizedName)) {
        console.log(`⚠️ Skipping duplicate medication: ${med.name} (${med.id})`);
        return false;
      }
      seenNames.add(normalizedName);
      return true;
    });

    console.log(`✅ Filtered to ${uniqueMeds.length} unique medications from ${supabaseMedications?.length || 0} total`);

    // Format medications data with all fields from database - preserve exact values
    const formattedMeds: any[] = uniqueMeds.map(med => {
      // Debug log the raw data from database
      if (med.name && med.name.includes('بروفين')) {
        console.log('🔍🔍 FOUND BRUFEN - Raw medication data from Supabase:', {
          id: med.id,
          name: med.name,
          fda_category: med.fda_category,
          fda_category_ai: med.fda_category_ai,
          llm_safety_analysis: med.llm_safety_analysis ? med.llm_safety_analysis.substring(0, 100) + '...' : null,
          llm_benefits: med.llm_benefits ? med.llm_benefits.substring(0, 50) + '...' : null,
          llm_risks: med.llm_risks ? med.llm_risks.substring(0, 50) + '...' : null,
          overall_safety: med.overall_safety ? med.overall_safety.substring(0, 50) + '...' : null,
          prescribed_date: med.prescribed_date,
          created_at: med.created_at
        });
      }

      return {
        id: med.id,
        name: med.name || 'اسم الدواء غير محدد',
        dosage: med.dosage || 'غير محدد',
        frequency: med.frequency || 'عند الحاجة',
        prescribedDate: med.prescribed_date,
        endDate: med.end_date || undefined,
        fdaCategory: med.fda_category || 'B',
        fdaCategoryAi: med.fda_category_ai,
        notes: med.notes,
        reminders: [],
        adherenceLog: (med.medication_adherence_logs || []).map((log: any) => ({
          id: log.id,
          medicationId: log.medication_id,
          date: log.date,
          taken: log.taken,
          notes: log.notes,
        })),
        // Preserve all AI analysis fields exactly as stored in database - keep original values
        llmSafetyAnalysis: med.llm_safety_analysis,
        llmBenefits: med.llm_benefits,
        llmRisks: med.llm_risks,
        overallSafety: med.overall_safety,
        createdAt: med.created_at,
        updatedAt: med.updated_at,
      };
    });

    return formattedMeds;
  });
};

export const updateMedication = async (id: string, updates: Tables['medications']['Update']) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('medications')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteMedication = async (id: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('medications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};

// Medication Adherence
export const logMedicationAdherence = async (medicationId: string, date: string, taken: boolean, notes?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Check if an entry already exists for this medication and date
  const { data: existingLogs } = await supabase
    .from('medication_adherence_logs')
    .select('*')
    .eq('medication_id', medicationId)
    .eq('date', date)
    .eq('user_id', user.id);

  if (existingLogs && existingLogs.length > 0) {
    // Update existing log
    const { data, error } = await supabase
      .from('medication_adherence_logs')
      .update({
        taken,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingLogs[0].id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new log
    const { data, error } = await supabase
      .from('medication_adherence_logs')
      .insert({
        medication_id: medicationId,
        user_id: user.id,
        date,
        taken,
        notes
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const getMedicationAdherenceLogs = async (medicationId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('medication_adherence_logs')
    .select('*')
    .eq('medication_id', medicationId)
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getMedicationAdherenceForDate = async (medicationId: string, date: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('medication_adherence_logs')
    .select('*')
    .eq('medication_id', medicationId)
    .eq('date', date)
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return data;
};

// Symptoms
export const createSymptom = async (symptom: Partial<Symptom>): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  if (!symptom.type || !symptom.severity || !symptom.date) {
    throw new Error('Missing required symptom fields');
  }

  // Allow empty descriptions - just ensure it's a string
  const description = symptom.description || '';
  if (typeof description !== 'string') {
    throw new Error('Symptom description must be a string');
  }

  const activePregnancy = await getActivePregnancy();

  const { data, error } = await supabase
    .from('symptoms')
    .insert([{
      user_id: user.id,
      pregnancy_id: activePregnancy?.id || null,
      type: symptom.type,
      severity: symptom.severity as 1 | 2 | 3 | 4 | 5,
      description: description,
      date: symptom.date,
      triggers: symptom.triggers || null,
      llm_analysis: symptom.llmAnalysis || null,
      llm_recommendations: symptom.llmRecommendations || null,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getSymptoms = async (): Promise<any[]> => {
  return await withRetry(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('symptoms')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching symptoms:', error);
      throw error;
    }

    return data || [];
  });
};

export const updateSymptom = async (id: string, updates: Tables['symptoms']['Update']) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('symptoms')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSymptom = async (id: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('symptoms')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const getLabReportById = async (reportId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('lab_reports')
    .select(`
      *,
      lab_results (*)
    `)
    .eq('id', reportId)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data;
};

// All functions are already exported individually above