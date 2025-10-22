export interface LabResult {
  id: string;
  labReportId?: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  date: string;
  isAbnormal: boolean;
  notes?: string;
  category: 'blood' | 'urine' | 'ultrasound' | 'genetic' | 'other';
  trimester: 1 | 2 | 3;
  explanation?: string;
}

export interface LabReport {
  id: string;
  date: string;
  summary: string;
  source: 'manual' | 'upload';
  labResults: LabResult[];
}

export interface MedicationReminder {
  id: string;
  time: string; // HH:MM format
  enabled: boolean;
}

export interface AdherenceLog {
  id: string;
  medicationId: string;
  date: string;
  taken: boolean;
  time?: string;
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedDate: string;
  endDate?: string;
  fdaCategory: 'A' | 'B' | 'C' | 'D' | 'X';
  fdaCategoryAi?: string;
  category?: string;
  notes?: string;
  reminders: MedicationReminder[];
  adherenceLog: AdherenceLog[];

  // AI-generated fields
  llmSafetyAnalysis?: string;
  llmBenefits?: string;
  llmRisks?: string;
  overallSafety?: string;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface VitalSigns {
  id: string;
  date: string;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  weight?: number;
  bloodSugar?: number;
  temperature?: number;
  notes?: string;
}

export interface FetalMovement {
  id: string;
  date: string;
  time: string;
  kickCount: number;
  duration: number; // in minutes
  notes?: string;
}

export interface Symptom {
  id: string;
  date: string;
  type: string;
  severity: 1 | 2 | 3 | 4 | 5;
  description: string;
  triggers?: string;
  llmAnalysis?: string;
  llmRecommendations?: string;
  clientRequestId?: string;
  saving?: boolean;
  unsynced?: boolean;
  saveError?: string;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface Ultrasound {
  id: string;
  date: string;
  gestationalAge: string;
  measurements: {
    biparietal?: number;
    femurLength?: number;
    estimatedWeight?: number;
  };
  notes?: string;
  imageUrl?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  dueDate: string;
  lastMenstrualPeriod: string;
  isActive?: boolean;
}

// Import gestational age type for computed fields
export interface GestationalAge {
  days: number;
  weeks: number;
  remainderDays: number;
  eddIso: string;
  progressPct: number;
}

export interface Pregnancy {
  id: string;
  name: string;
  lastMenstrualPeriod: string;
  last_menstrual_period?: string; // Support both snake_case and camelCase
  dueDate: string;
  isActive: boolean;
  createdAt: string;
  notes?: string;
  current_week?: number;
  
  // Computed gestational age fields (added by DataContext)
  gestationalAge?: GestationalAge | null;
  trimester?: 1 | 2 | 3;
  currentWeek?: number;
  currentDay?: number;
  totalDays?: number;
  progress?: number;
  computedDueDate?: string | null;
  lastGestationCalculation?: string;
}

export interface PregnancyMilestone {
  week: number;
  title: string;
  description: string;
  tips: string[];
  upcomingTests?: string[];
}

// إضافة تعريفات الترجمة المفقودة
export interface Translations {
  // تسميات عامة
  loading: string;
  error: string;
  success: string;
  cancel: string;
  save: string;
  retry: string;
  saving: string;

  // تسميات الصحة والأعراض
  healthCheckTitle: string;
  healthCheckSubtitle: string;
  logSymptom: string;
  symptomType: string;
  symptomTypePlaceholder: string;
  severityLevel: string;
  description: string;
  descriptionPlaceholder: string;
  possibleTriggers: string;
  triggersPlaceholder: string;
  triggers: string;
  mild: string;
  severe: string;
  noSymptoms: string;
  noSymptomsSubtext: string;
  aiAnalysis: string;
  recommendations: string;
  aiAnalysisDisclaimer: string;
  aiSymptomInfo: string;
  analyzingSymptom: string;
  analyzingSymptomSubtext: string;
  profileRequiredSymptom: string;
  unsyncedWarning: string;

  // تسميات الأخطاء
  errorAnalyzingSymptom: string;
  pleaseTryAgain: string;
}