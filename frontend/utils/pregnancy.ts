import { LabReport, Pregnancy } from '@/types';
import { loadData, STORAGE_KEYS } from '@/utils/storage';

export const calculateGestationalAge = (lastMenstrualPeriod: string): { weeks: number; days: number; totalDays: number } => {
  if (!lastMenstrualPeriod || lastMenstrualPeriod.trim() === '') {
    return {
      weeks: 0,
      days: 0,
      totalDays: 0
    };
  }

  const lmpDate = new Date(lastMenstrualPeriod);
  if (isNaN(lmpDate.getTime())) {
    return {
      weeks: 0,
      days: 0,
      totalDays: 0
    };
  }

  const today = new Date();
  const timeDiff = today.getTime() - lmpDate.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  const weeks = Math.floor(daysDiff / 7);
  const days = daysDiff % 7;

  return {
    weeks: Math.max(0, weeks),
    days: Math.max(0, days),
    totalDays: Math.max(0, daysDiff)
  };
};

export const calculateDueDate = (lastMenstrualPeriod: string): string => {
  const lmp = new Date(lastMenstrualPeriod);
  lmp.setDate(lmp.getDate() + 280); // 40 weeks
  return lmp.toISOString().split('T')[0];
};

export const getTrimester = (gestationalWeeks: number): 1 | 2 | 3 => {
  if (gestationalWeeks <= 12) return 1;
  if (gestationalWeeks <= 26) return 2;
  return 3;
};

export const getWeightGainRecommendation = (prePregnancyBMI: number, currentWeight: number, prePregnancyWeight: number, gestationalWeeks: number) => {
  const weightGain = currentWeight - prePregnancyWeight;
  let recommendedRange: { min: number; max: number };

  // BMI categories and recommended weight gain
  if (prePregnancyBMI < 18.5) {
    recommendedRange = { min: 28, max: 40 }; // Underweight
  } else if (prePregnancyBMI < 25) {
    recommendedRange = { min: 25, max: 35 }; // Normal weight
  } else if (prePregnancyBMI < 30) {
    recommendedRange = { min: 15, max: 25 }; // Overweight
  } else {
    recommendedRange = { min: 11, max: 20 }; // Obese
  }

  // Adjust for gestational age (most weight gain in 2nd and 3rd trimester)
  const adjustedMin = (recommendedRange.min * gestationalWeeks) / 40;
  const adjustedMax = (recommendedRange.max * gestationalWeeks) / 40;

  return {
    current: weightGain,
    recommendedMin: Math.round(adjustedMin),
    recommendedMax: Math.round(adjustedMax),
    isWithinRange: weightGain >= adjustedMin && weightGain <= adjustedMax,
  };
};

export const getMedicationSafetyInfo = (category: string) => {
  const safetyInfo: Record<string, { color: string; label: string; description: string }> = {
    A: {
      color: '#4CAF50',
      label: 'Safe',
      description: 'Adequate and well-controlled studies have failed to demonstrate a risk to the fetus.'
    },
    B: {
      color: '#8BC34A',
      label: 'Probably Safe',
      description: 'Animal studies have revealed no evidence of harm to the fetus.'
    },
    C: {
      color: '#FF9800',
      label: 'Use with Caution',
      description: 'Animal studies have shown adverse effects, but no adequate human studies.'
    },
    D: {
      color: '#FF5722',
      label: 'Use Only if Benefits Outweigh Risks',
      description: 'Evidence of human fetal risk, but benefits may warrant use despite potential risks.'
    },
    X: {
      color: '#F44336',
      label: 'Contraindicated',
      description: 'Studies have shown fetal abnormalities. Risks clearly outweigh benefits.'
    }
  };

  return safetyInfo[category] || safetyInfo['C'];
};

export const getRecentLabReportsSummary = async (count: number = 2): Promise<{ date: string; summary: string }[]> => {
  try {
    const reports = await loadData<LabReport[]>(STORAGE_KEYS.LAB_REPORTS);
    if (!reports || reports.length === 0) {
      return [];
    }

    // Sort by date (most recent first) and take the specified count
    const sortedReports = reports
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, count);

    return sortedReports.map(report => ({
      date: report.date,
      summary: report.summary
    }));
  } catch (error) {
    console.error('Error loading recent lab reports:', error);
    return [];
  }
};

export function calculatePregnancyWeek(lastMenstrualPeriod: string): number {
  const lmpDate = new Date(lastMenstrualPeriod);
  const currentDate = new Date();

  const diffInMs = currentDate.getTime() - lmpDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);

  // Clamp between 1-42 weeks for safety
  return Math.max(1, Math.min(42, diffInWeeks));
}

export async function getLabReports() {
  try {
    // Import the proper function from supabaseStorage
    const { getLabReports: getSupabaseLabReports } = await import('./supabaseStorage');
    const reports = await getSupabaseLabReports();

    // Convert to the expected format
    return (reports || []).map((report: any) => ({
      id: report.id,
      date: report.date,
      summary: report.summary,
      source: report.source,
      labResults: (report.lab_results || []).map((result: any) => ({
        id: result.id,
        testName: result.test_name,
        value: result.value,
        unit: result.unit,
        referenceRange: result.reference_range,
        date: result.date,
        isAbnormal: result.is_abnormal,
        notes: result.notes,
        category: result.category,
        explanation: result.explanation
      }))
    }));
  } catch (error) {
    console.warn('Error loading lab reports:', error);
    return [];
  }
}