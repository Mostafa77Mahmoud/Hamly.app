import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { Medication, Pregnancy, LabResult, LabReport, Symptom } from "@/types";
import { supabase } from "@/utils/supabase";
import { getGestationalAge, getTrimester } from "@/utils/gestation";
import { sessionManager, initSessionManager } from "@/services/session/sessionManager";
import { traceEvent } from "@/utils/deepTracer";
import { logSupabaseRequest } from "@/utils/logCollector";

const enhancePregnancyWithGestation = (pregnancyData: any) => {
  if (!pregnancyData) return pregnancyData;

  const lmpDate = pregnancyData.last_menstrual_period || pregnancyData.lastMenstrualPeriod;
  const gestationalAge = lmpDate ? getGestationalAge(lmpDate) : null;
  const trimester = gestationalAge ? getTrimester(gestationalAge.weeks) : 1;

  const computedFields = gestationalAge
    ? {
        currentWeek: gestationalAge.weeks,
        currentDay: gestationalAge.remainderDays,
        totalDays: gestationalAge.days,
        progress: gestationalAge.progressPct,
        computedDueDate: gestationalAge.eddIso,
      }
    : {
        currentWeek: 0,
        currentDay: 0,
        totalDays: 0,
        progress: 0,
        computedDueDate: null,
      };

  return {
    ...pregnancyData,
    lastMenstrualPeriod: lmpDate,
    last_menstrual_period: lmpDate,
    gestationalAge,
    trimester,
    ...computedFields,
    lastGestationCalculation: new Date().toISOString(),
  };
};

interface DataContextType {
  medications: Medication[];
  symptoms: Symptom[];
  labReports: LabReport[];
  labResults: LabResult[];
  activePregnancy: Pregnancy | null;
  userProfile: any | null;
  loading: boolean;
  isRefreshing: boolean;
  error: string | null;
  dataLoaded: boolean;

  refreshData: (forceFresh?: boolean) => Promise<void>;
  refreshMedications: () => Promise<void>;
  refreshSymptoms: () => Promise<void>;
  refreshLabReports: () => Promise<void>;

  addMedication: (medication: Medication) => void;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  removeMedication: (id: string) => void;
  addSymptom: (symptom: Symptom) => void;
  updateSymptom: (id: string, updates: Partial<Symptom>) => void;
  setSymptoms: React.Dispatch<React.SetStateAction<Symptom[]>>;
  addLabReport: (report: LabReport) => void;
  updateLabReport: (id: string, updates: Partial<LabReport>) => void;
  setWriting: (writing: boolean) => void; // دالة جديدة
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}

interface DataProviderProps {
  children: React.ReactNode;
}

const RETRY_CONFIG = {
  maxRetries: 2, // Reduced retries to fail faster
  initialDelay: 1000,
  maxDelay: 5000,
  timeout: 25000, // Increased to 25 seconds to handle slow resume
};

const DEBOUNCE_DELAY = 300;

async function retryWithBackoff<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  retries: number = RETRY_CONFIG.maxRetries,
  signal?: AbortSignal
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) {
      throw new Error('Request aborted');
    }

    let timeoutId: NodeJS.Timeout | null = null;
    let abortHandler: (() => void) | null = null;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          timeoutId = null;
          reject(new Error('Request timeout'));
        }, RETRY_CONFIG.timeout);

        abortHandler = () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          reject(new Error('Request aborted'));
        };

        signal?.addEventListener('abort', abortHandler);
      });

      const result = await Promise.race([fn(signal!), timeoutPromise]);

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (abortHandler) {
        signal?.removeEventListener('abort', abortHandler);
      }

      return result;
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (abortHandler) {
        signal?.removeEventListener('abort', abortHandler);
      }

      lastError = error;

      if (attempt < retries && !signal?.aborted) {
        const delay = Math.min(
          RETRY_CONFIG.initialDelay * Math.pow(2, attempt),
          RETRY_CONFIG.maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export function DataProvider({ children }: DataProviderProps) {
  const { user, session } = useAuth();
  const userId = user?.id;

  const [medications, setMedications] = useState<Medication[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [activePregnancy, setActivePregnancy] = useState<Pregnancy | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const refreshGuardRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);
  const isWritingRef = useRef<boolean>(false); // Track active write operations
  const resyncInProgressRef = useRef<boolean>(false);

  const loadUserProfile = useCallback(async (signal: AbortSignal) => {
    if (!userId || signal.aborted) return null;

    try {
      const sessionResult = await sessionManager.ensureSession();

      if (!sessionResult.sessionValid) {
        throw new Error('Session expired - please refresh the page');
      }
      const abortPromise = new Promise<never>((_, reject) => {
        if (signal.aborted) reject(new Error('Request aborted'));
        signal.addEventListener('abort', () => reject(new Error('Request aborted')));
      });

      const { data, error } = await Promise.race([
        supabase
          .from("profiles")
          .select("id, email, full_name, avatar_url, created_at, updated_at")
          .eq("id", userId)
          .single(),
        abortPromise
      ]) as any;

      if (error) throw error;
      return data;
    } catch (error: any) {
      if (error.message === 'Request aborted') throw error;

      console.error("❌ Failed to load user profile:", error);
      return {
        id: userId,
        email: user?.email || "",
        full_name: user?.user_metadata?.full_name || "",
        preferred_language: "ar",
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }, [userId, user]);

  const loadActivePregnancy = useCallback(async (signal: AbortSignal) => {
    if (!userId || signal.aborted) return null;

    try {
      const abortPromise = new Promise<never>((_, reject) => {
        if (signal.aborted) reject(new Error('Request aborted'));
        signal.addEventListener('abort', () => reject(new Error('Request aborted')));
      });

      const { data, error } = await Promise.race([
        supabase
          .from("pregnancies")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle(),
        abortPromise
      ]) as any;

      if (error) throw error;
      return data ? enhancePregnancyWithGestation(data) : null;
    } catch (error: any) {
      if (error.message === 'Request aborted') throw error;
      console.error("❌ Failed to load active pregnancy:", error);
      return null;
    }
  }, [userId]);

  const loadMedications = useCallback(async (signal: AbortSignal) => {
    if (!userId || signal.aborted) return [];

    try {
      await sessionManager.ensureSession();
      const abortPromise = new Promise<never>((_, reject) => {
        if (signal.aborted) reject(new Error('Request aborted'));
        signal.addEventListener('abort', () => reject(new Error('Request aborted')));
      });

      const { data, error } = await Promise.race([
        supabase
          .from("medications")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        abortPromise
      ]) as any;

      if (error) throw error;

      const formattedMeds = (data || []).map((med: any) => ({
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        prescribedDate: med.prescribed_date,
        endDate: med.end_date,
        fdaCategory: med.fda_category || "B",
        fdaCategoryAi: med.fda_category_ai,
        notes: med.notes,
        reminders: [],
        adherenceLog: [],
        llmSafetyAnalysis: med.llm_safety_analysis,
        llmBenefits: med.llm_benefits,
        llmRisks: med.llm_risks,
        overallSafety: med.overall_safety,
        createdAt: med.created_at,
        updatedAt: med.updated_at,
      }));

      // Deduplicate medications by ID and name at load time
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();
      const uniqueMeds: Medication[] = [];

      for (const med of formattedMeds) {
        const normalizedName = med.name.toLowerCase().trim();

        if (seenIds.has(med.id) || seenNames.has(normalizedName)) {
          continue;
        }

        seenIds.add(med.id);
        seenNames.add(normalizedName);
        uniqueMeds.push(med);
      }

      console.log(`✅ Loaded ${uniqueMeds.length} unique medications (filtered from ${formattedMeds.length})`);
      return uniqueMeds;
    } catch (error: any) {
      if (error.message === 'Request aborted') throw error;
      console.error("❌ Failed to load medications:", error);
      return [];
    }
  }, [userId]);

  const loadSymptoms = useCallback(async (signal: AbortSignal) => {
    if (!userId || signal.aborted) return [];

    try {
      await sessionManager.ensureSession();
      const abortPromise = new Promise<never>((_, reject) => {
        if (signal.aborted) reject(new Error('Request aborted'));
        signal.addEventListener('abort', () => reject(new Error('Request aborted')));
      });

      const { data, error } = await Promise.race([
        supabase
          .from("symptoms")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        abortPromise
      ]) as any;

      if (error) throw error;

      const formattedSymptoms = (data || []).map((symptom: any) => ({
        id: symptom.id,
        date: symptom.date,
        type: symptom.type,
        severity: symptom.severity,
        description: symptom.description,
        triggers: symptom.triggers,
        llmAnalysis: symptom.llm_analysis,
        llmRecommendations: symptom.llm_recommendations,
        createdAt: symptom.created_at,
        updatedAt: symptom.updated_at,
      }));

      return formattedSymptoms;
    } catch (error: any) {
      if (error.message === 'Request aborted') throw error;
      console.error("❌ Failed to load symptoms:", error);
      return [];
    }
  }, [userId]);

  const loadLabData = useCallback(async (signal: AbortSignal) => {
    if (!userId || signal.aborted) return { reports: [], results: [] };

    try {
      const abortPromise = new Promise<never>((_, reject) => {
        if (signal.aborted) reject(new Error('Request aborted'));
        signal.addEventListener('abort', () => reject(new Error('Request aborted')));
      });

      const [reportsResponse, resultsResponse] = await Promise.race([
        Promise.all([
          supabase
            .from("lab_reports")
            .select("*")
            .eq("user_id", userId)
            .order("date", { ascending: false }),
          supabase
            .from("lab_results")
            .select("*")
            .eq("user_id", userId)
            .order("date", { ascending: false }),
        ]),
        abortPromise
      ]) as any;

      if (reportsResponse.error) throw reportsResponse.error;
      if (resultsResponse.error) throw resultsResponse.error;

      const reportsData = reportsResponse.data || [];
      const resultsData = resultsResponse.data || [];

      const formattedReports = reportsData.map((report: any) => {
        const relatedResults = resultsData
          .filter((result: any) => result.lab_report_id === report.id)
          .map((result: any) => ({
            id: result.id,
            testName: result.test_name,
            value: result.value,
            unit: result.unit,
            referenceRange: result.reference_range,
            date: result.date,
            isAbnormal: result.is_abnormal,
            notes: result.notes,
            category: result.category,
            trimester: result.trimester,
            explanation: result.explanation,
          }));

        return {
          id: report.id,
          date: report.date,
          summary: report.summary,
          source: report.source,
          labResults: relatedResults,
        };
      });

      const formattedResults = resultsData.map((result: any) => ({
        id: result.id,
        labReportId: result.lab_report_id,
        testName: result.test_name,
        value: result.value,
        unit: result.unit,
        referenceRange: result.reference_range,
        date: result.date,
        isAbnormal: result.is_abnormal,
        notes: result.notes,
        category: result.category,
        trimester: result.trimester,
        explanation: result.explanation,
      }));

      return { reports: formattedReports, results: formattedResults };
    } catch (error: any) {
      if (error.message === 'Request aborted') throw error;
      console.error("❌ Failed to load lab data:", error);
      return { reports: [], results: [] };
    }
  }, [userId]);

  const refreshDataInternal = useCallback(async (isInitialLoad: boolean = false, forceFresh: boolean = false) => {
    const refreshId = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    console.log(`[${refreshId}] 🚀 refreshDataInternal START`, {
      isInitialLoad,
      forceFresh,
      hasUser: !!user,
      hasSession: !!session,
      guardActive: refreshGuardRef.current,
      isWriting: isWritingRef.current,
      resyncInProgress: resyncInProgressRef.current
    });

    if (!user || !session) {
      console.log(`[${refreshId}] ⚠️ No user/session, aborting refresh`);
      setLoading(false);
      setDataLoaded(false);
      return;
    }

    // Don't abort on regular refresh unless force fresh
    if (forceFresh && abortControllerRef.current) {
      console.log(`[${refreshId}] 🔄 Force refresh: Aborting previous request`);
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      refreshGuardRef.current = false;
    }

    // Skip if already refreshing (unless initial load or force fresh)
    if (refreshGuardRef.current && !isInitialLoad && !forceFresh) {
      console.log(`[${refreshId}] 🛑 Refresh already in progress, skipping...`);
      return;
    }

    refreshGuardRef.current = true;
    console.log(`[${refreshId}] 🔒 Acquired refresh guard`);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    if (isInitialLoad || forceFresh) {
      console.log(`[${refreshId}] 📊 Setting loading=true`);
      setLoading(true);
    } else {
      console.log(`[${refreshId}] 📊 Setting isRefreshing=true`);
      setIsRefreshing(true);
    }
    setError(null);

    if (forceFresh) {
      console.log(`[${refreshId}] 🔄 Force Fresh Refresh: Clearing all cache and retrying from scratch...`);
      // Clear all local cache
      const { clearCache } = await import('@/utils/cacheManager');
      await clearCache();
    } else {
      console.log(`[${refreshId}] 🔄 Refreshing all data from database...`);
    }

    try {
      console.log(`[${refreshId}] 📥 Starting Promise.allSettled for data loading (crash-safe)...`);
      const startTime = Date.now();

      // Use Promise.allSettled instead of Promise.all to prevent crash on individual failures
      const results = await Promise.allSettled([
        retryWithBackoff(() => loadUserProfile(abortController.signal), RETRY_CONFIG.maxRetries, abortController.signal),
        retryWithBackoff(() => loadActivePregnancy(abortController.signal), RETRY_CONFIG.maxRetries, abortController.signal),
        retryWithBackoff(() => loadMedications(abortController.signal), RETRY_CONFIG.maxRetries, abortController.signal),
        retryWithBackoff(() => loadSymptoms(abortController.signal), RETRY_CONFIG.maxRetries, abortController.signal),
        retryWithBackoff(() => loadLabData(abortController.signal), RETRY_CONFIG.maxRetries, abortController.signal),
      ]);

      const loadTime = Date.now() - startTime;

      // Extract results or use safe defaults
      const profile = results[0].status === 'fulfilled' ? results[0].value : null;
      const pregnancy = results[1].status === 'fulfilled' ? results[1].value : null;
      const meds = results[2].status === 'fulfilled' ? results[2].value : [];
      const symp = results[3].status === 'fulfilled' ? results[3].value : [];
      const labData = results[4].status === 'fulfilled' ? results[4].value : { reports: [], results: [] };

      // Log any failures
      results.forEach((result, index) => {
        const names = ['profile', 'pregnancy', 'medications', 'symptoms', 'lab data'];
        if (result.status === 'rejected') {
          console.warn(`[${refreshId}] ⚠️ Failed to load ${names[index]}:`, result.reason);
        }
      });

      console.log(`[${refreshId}] ⏱️ Data loaded in ${loadTime}ms`, {
        profileLoaded: !!profile,
        pregnancyLoaded: !!pregnancy,
        medsCount: meds?.length || 0,
        symptomsCount: symp?.length || 0,
        labReportsCount: (labData as any)?.reports?.length || 0
      });

      if (!abortController.signal.aborted) {
        console.log(`[${refreshId}] 💾 Updating state with loaded data (using safe defaults for failures)...`);
        setUserProfile(profile);
        setActivePregnancy(pregnancy);
        setMedications(meds);
        setSymptoms(symp);
        setLabReports((labData as { reports: LabReport[], results: LabResult[] }).reports);
        setLabResults((labData as { reports: LabReport[], results: LabResult[] }).results);
        setDataLoaded(true);
        setError(null);
        lastRefreshTimeRef.current = Date.now();
        console.log(`[${refreshId}] ✅ Data refresh completed (some items may have failed gracefully)`);
      } else {
        console.log(`[${refreshId}] 🚫 Refresh aborted, skipping state update`);
      }
    } catch (error: any) {
      if (error.message !== 'Request aborted') {
        console.error(`[${refreshId}] ❌ Error refreshing data:`, {
          message: error.message,
          stack: error.stack,
          isTimeout: error.message === 'Request timeout'
        });

        // Set user-friendly error message
        const errorMessage = error.message === 'Request timeout'
          ? 'Connection timeout - Please check your internet connection'
          : error.message || "Failed to refresh data";

        setError(errorMessage);
        console.log(`[${refreshId}] 📊 Setting loading/refreshing=false due to error`);
        setLoading(false);
        setIsRefreshing(false);
      } else {
        console.log(`[${refreshId}] ℹ️ Request was aborted (normal)`);
      }
    } finally {
      console.log(`[${refreshId}] 🏁 Finally block executing...`);
      if (isInitialLoad || forceFresh) {
        console.log(`[${refreshId}] 📊 Setting loading=false`);
        setLoading(false);
      } else {
        console.log(`[${refreshId}] 📊 Setting isRefreshing=false`);
        setIsRefreshing(false);
      }
      refreshGuardRef.current = false;
      console.log(`[${refreshId}] 🔓 Released refresh guard`);
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
        console.log(`[${refreshId}] 🧹 Cleared abort controller`);
      }
    }
  }, [user, session, loadUserProfile, loadActivePregnancy, loadMedications, loadSymptoms, loadLabData]);

  const refreshData = useCallback(async (forceFresh: boolean = false) => {
    // إلغاء أي debounce قيد التشغيل
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // إذا كان force refresh، إلغاء الطلب القديم فوراً والبدء بالجديد
    if (forceFresh) {
      if (abortControllerRef.current) {
        console.log("🔄 Force refresh: Aborting previous request immediately");
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        refreshGuardRef.current = false;
      }
      // تنفيذ فوراً بدون debounce
      await refreshDataInternal(false, true);
      return;
    }

    return new Promise<void>((resolve) => {
      debounceTimerRef.current = setTimeout(async () => {
        await refreshDataInternal(false, false);
        resolve();
      }, DEBOUNCE_DELAY);
    });
  }, [refreshDataInternal]);

  // Initialize SessionManager only once
  const sessionInitializedRef = useRef(false);

  useEffect(() => {
    if (user && session && !sessionInitializedRef.current) {
      sessionInitializedRef.current = true;

      initSessionManager({ supabaseClient: supabase }).then(() => {
        console.log('✅ Session Manager initialized (first time)');
      });

      const handleSessionStale = () => {
        console.warn('⚠️ Session became stale');
        setError('Your session has expired. Please refresh the page.');
      };

      const handleSessionActive = (data: any) => {
        console.log('✅ Session is active', data);
        // On resume, trigger full refresh as if first time
        if (data.onResume) {
          console.log('🔄 App resumed - triggering full refresh');
          setTimeout(() => refreshData(true), 500); // Force fresh refresh
        }
      };

      const handleWriteQueued = (data: any) => {
        console.log('📝 Write operation queued:', data.operationId);
      };

      const handleWriteProcessed = (data: any) => {
        console.log('✅ Write operation processed:', data);
        if (data.success) {
          // Gentle refresh without abort
          setTimeout(() => refreshData(false), 500);
        }
      };

      const handleResyncRequested = () => {
        console.log('🔄 Resync requested by session manager');
        refreshData(false);
      };

      const handleSessionValidated = (data: any) => {
        console.log('✅ [DataContext] Session validated:', data);
        // Session is valid, safe to proceed with data operations
      };

      const handleResyncPhase = (data: any) => {
        console.log(`🔄 [DataContext] Resync phase ${data.phase}: ${data.description}`, {
          resources: data.resources,
          phase: data.phase,
          totalPhases: data.totalPhases
        });
        // Track resync progress for debugging
      };

      const handleResyncStart = () => {
        if (resyncInProgressRef.current) {
          console.log('⏭️ Resync already in progress, skipping duplicate resync:start');
          return;
        }

        resyncInProgressRef.current = true;
        console.log('🔄 [DataContext] Resync started - keeping local data');
        // Don't set loading/refreshing - keep UI showing existing data
      };

      const handleResyncComplete = async ({ success }: { success: boolean }) => {
        const resyncId = `resync_complete_${Date.now()}`;
        console.log(`[${resyncId}] 🎯 handleResyncComplete called`, {
          success,
          wasInProgress: resyncInProgressRef.current,
          currentRefreshGuard: refreshGuardRef.current,
          currentLoading: loading,
          currentRefreshing: isRefreshing
        });

        resyncInProgressRef.current = false;

        if (success) {
          console.log(`[${resyncId}] 🔄 Starting silent data update after resume...`);
          const startTime = Date.now();

          try {
            // Use Promise.allSettled to prevent crash on individual failures
            const results = await Promise.allSettled([
              loadUserProfile(new AbortController().signal),
              loadActivePregnancy(new AbortController().signal),
              loadMedications(new AbortController().signal),
              loadSymptoms(new AbortController().signal),
              loadLabData(new AbortController().signal),
            ]);

            // Extract results or use safe defaults
            const profile = results[0].status === 'fulfilled' ? results[0].value : null;
            const pregnancy = results[1].status === 'fulfilled' ? results[1].value : null;
            const meds = results[2].status === 'fulfilled' ? results[2].value : [];
            const symp = results[3].status === 'fulfilled' ? results[3].value : [];
            const labData = results[4].status === 'fulfilled' ? results[4].value : { reports: [], results: [] };

            const loadTime = Date.now() - startTime;
            console.log(`[${resyncId}] ⏱️ Silent load completed in ${loadTime}ms`, {
              profileLoaded: !!profile,
              pregnancyLoaded: !!pregnancy,
              medsCount: meds?.length || 0,
              symptomsCount: symp?.length || 0,
              labReportsCount: (labData as any)?.reports?.length || 0
            });

            // Update state silently
            console.log(`[${resyncId}] 💾 Updating state silently...`);
            setUserProfile(profile);
            setActivePregnancy(pregnancy);
            setMedications(meds);
            setSymptoms(symp);
            setLabReports((labData as { reports: LabReport[], results: LabResult[] }).reports);
            setLabResults((labData as { reports: LabReport[], results: LabResult[] }).results);
            console.log(`[${resyncId}] ✅ Data updated silently after resume`);
          } catch (error) {
            console.error(`[${resyncId}] ❌ Silent refresh failed:`, {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            });
          }
        } else {
          console.log(`[${resyncId}] ⚠️ Resync was not successful, skipping silent update`);
        }
      };

      sessionManager.on('session:validated', handleSessionValidated);
      sessionManager.on('session:stale', handleSessionStale);
      sessionManager.on('session:active', handleSessionActive);
      sessionManager.on('write:queued', handleWriteQueued);
      sessionManager.on('write:processed', handleWriteProcessed);
      sessionManager.on('resync:requested', handleResyncRequested);
      sessionManager.on('resync:phase', handleResyncPhase);
      sessionManager.on('resync:start', handleResyncStart);
      sessionManager.on('resync:complete', handleResyncComplete);

      import('@/services/session/sessionManager').then(({ registerResourceLoader }) => {
        registerResourceLoader('profile', async () => {
          const profile = await loadUserProfile(new AbortController().signal);
          if (profile) setUserProfile(profile);
          return profile;
        });

        registerResourceLoader('activePregnancy', async () => {
          const pregnancy = await loadActivePregnancy(new AbortController().signal);
          if (pregnancy) setActivePregnancy(pregnancy);
          return pregnancy;
        });

        registerResourceLoader('medications', async () => {
          const meds = await loadMedications(new AbortController().signal);
          if (meds) setMedications(meds);
          return meds;
        });

        registerResourceLoader('symptoms', async () => {
          const symp = await loadSymptoms(new AbortController().signal);
          if (symp) setSymptoms(symp);
          return symp;
        });

        registerResourceLoader('labs', async () => {
          const labData = await loadLabData(new AbortController().signal);
          if (labData) {
            setLabReports((labData as { reports: LabReport[], results: LabResult[] }).reports);
            setLabResults((labData as { reports: LabReport[], results: LabResult[] }).results);
          }
          return labData;
        });
      });

      refreshDataInternal(true);

      return () => {
        sessionManager.off('session:validated', handleSessionValidated);
        sessionManager.off('session:stale', handleSessionStale);
        sessionManager.off('session:active', handleSessionActive);
        sessionManager.off('write:queued', handleWriteQueued);
        sessionManager.off('write:processed', handleWriteProcessed);
        sessionManager.off('resync:requested', handleResyncRequested);
        sessionManager.off('resync:phase', handleResyncPhase);
        sessionManager.off('resync:start', handleResyncStart);
        sessionManager.off('resync:complete', handleResyncComplete);
      };
    } else if (!user || !session) {
      sessionInitializedRef.current = false;
      setMedications([]);
      setSymptoms([]);
      setLabReports([]);
      setLabResults([]);
      setActivePregnancy(null);
      setUserProfile(null);
      setDataLoaded(false);
      setLoading(false);
      setError(null);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [user, session, refreshDataInternal, refreshData]);

  const refreshMedications = useCallback(async () => {
    if (!userId) return;

    // لا تقاطع عمليات الكتابة
    if (isWritingRef.current) {
      console.log('⏭️ Skipping medication refresh - write operation in progress');
      return;
    }

    while (refreshGuardRef.current) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController();
    }

    try {
      const meds = await retryWithBackoff(
        () => loadMedications(abortControllerRef.current!.signal),
        RETRY_CONFIG.maxRetries,
        abortControllerRef.current.signal
      );
      if (!abortControllerRef.current.signal.aborted) {
        setMedications(meds);
      }
    } catch (error: any) {
      if (error.message !== 'Request aborted') {
        console.error("❌ Error refreshing medications:", error);
      }
    }
  }, [userId, loadMedications]);

  const refreshSymptoms = useCallback(async () => {
    if (!userId) return;

    // لا تقاطع عمليات الكتابة
    if (isWritingRef.current) {
      console.log('⏭️ Skipping symptoms refresh - write operation in progress');
      return;
    }

    while (refreshGuardRef.current) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController();
    }

    try {
      const symp = await retryWithBackoff(
        () => loadSymptoms(abortControllerRef.current!.signal),
        RETRY_CONFIG.maxRetries,
        abortControllerRef.current.signal
      );
      if (!abortControllerRef.current.signal.aborted) {
        setSymptoms(symp);
      }
    } catch (error: any) {
      if (error.message !== 'Request aborted') {
        console.error("❌ Error refreshing symptoms:", error);
      }
    }
  }, [userId, loadSymptoms]);

  const refreshLabReports = useCallback(async () => {
    if (!userId) return;

    while (refreshGuardRef.current) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController();
    }

    try {
      const labData = await retryWithBackoff(
        () => loadLabData(abortControllerRef.current!.signal),
        RETRY_CONFIG.maxRetries,
        abortControllerRef.current.signal
      );
      if (!abortControllerRef.current.signal.aborted) {
        setLabReports((labData as { reports: LabReport[], results: LabResult[] }).reports);
        setLabResults((labData as { reports: LabReport[], results: LabResult[] }).results);
      }
    } catch (error: any) {
      if (error.message !== 'Request aborted') {
        console.error("❌ Error refreshing lab reports:", error);
      }
    }
  }, [userId, loadLabData]);

  const addMedication = useCallback((medication: Medication) => {
    setMedications((prev: Medication[]) => [medication, ...prev]);
    setTimeout(() => refreshMedications(), 500);
  }, [refreshMedications]);

  const updateMedication = useCallback((id: string, updates: Partial<Medication>) => {
    setMedications((prev: Medication[]) =>
      prev.map((med: Medication) => (med.id === id ? { ...med, ...updates } : med))
    );
    setTimeout(() => refreshMedications(), 500);
  }, [refreshMedications]);

  const removeMedication = useCallback((id: string) => {
    setMedications((prev: Medication[]) => prev.filter((med: Medication) => med.id !== id));
    setTimeout(() => refreshMedications(), 500);
  }, [refreshMedications]);

  const addSymptom = useCallback((symptom: Symptom) => {
    setSymptoms((prev: Symptom[]) => [symptom, ...prev]);
    setTimeout(() => refreshSymptoms(), 500);
  }, [refreshSymptoms]);

  const updateSymptom = useCallback((id: string, updates: Partial<Symptom>) => {
    setSymptoms((prev: Symptom[]) =>
      prev.map((symptom: Symptom) =>
        symptom.id === id ? { ...symptom, ...updates } : symptom
      )
    );
    setTimeout(() => refreshSymptoms(), 500);
  }, [refreshSymptoms]);

  const addLabReport = useCallback((report: LabReport) => {
    setLabReports((prev: LabReport[]) => [report, ...prev]);
    setTimeout(() => refreshLabReports(), 500);
  }, [refreshLabReports]);

  const updateLabReport = useCallback((id: string, updates: Partial<LabReport>) => {
    setLabReports((prev: LabReport[]) =>
      prev.map((report: LabReport) =>
        report.id === id ? { ...report, ...updates } : report
      )
    );
    setTimeout(() => refreshLabReports(), 500);
  }, [refreshLabReports]);

  // دوال للتحكم في حالة الكتابة
  const setWriting = useCallback((writing: boolean) => {
    isWritingRef.current = writing;
    console.log(writing ? '🔒 Write operation started - blocking refreshes' : '🔓 Write operation completed - allowing refreshes');
  }, []);

  // Removed infinite loop useEffect - deduplication now happens at load time in loadMedications()

  // Consolidated resync event handling - moved to main useEffect to avoid duplicate subscriptions

  const value = {
    medications,
    symptoms,
    labReports,
    labResults,
    activePregnancy,
    userProfile,
    loading,
    isRefreshing,
    error,
    dataLoaded,
    refreshData,
    refreshMedications,
    refreshSymptoms,
    refreshLabReports,
    addMedication,
    updateMedication,
    removeMedication,
    addSymptom,
    updateSymptom,
    setSymptoms,
    addLabReport,
    updateLabReport,
    setWriting,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}