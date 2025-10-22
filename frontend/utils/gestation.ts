/**
 * Gestational Age Calculation Utilities
 * 
 * Provides deterministic, UTC-only pregnancy calculations to ensure
 * consistent progress display across timezones and environments.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const PREGNANCY_DURATION_DAYS = 280; // Standard 40 weeks

export interface GestationalAge {
  days: number;
  weeks: number;
  remainderDays: number;
  eddIso: string;
  progressPct: number;
}

/**
 * Calculate gestational age using UTC-only math for consistency
 * @param lmpDateIso - Last menstrual period date in ISO format (YYYY-MM-DD)
 * @param nowIso - Optional current date override for testing (defaults to today UTC)
 * @returns Calculated gestational age details or null if invalid data
 */
export function getGestationalAge(lmpDateIso: string, nowIso?: string): GestationalAge | null {
  if (!lmpDateIso || typeof lmpDateIso !== 'string' || lmpDateIso.trim() === '') {
    return null;
  }

  try {
    // Parse LMP date - normalize to UTC midnight to avoid timezone issues
    const lmpParts = lmpDateIso.trim().split('-');
    if (lmpParts.length !== 3) {
      return null;
    }
    
    const lmpYear = parseInt(lmpParts[0], 10);
    const lmpMonth = parseInt(lmpParts[1], 10) - 1; // Month is 0-indexed
    const lmpDay = parseInt(lmpParts[2], 10);
    
    if (isNaN(lmpYear) || isNaN(lmpMonth) || isNaN(lmpDay)) {
      return null;
    }
    
    const lmpDateUTC = new Date(Date.UTC(lmpYear, lmpMonth, lmpDay));
    
    // Validate LMP date
    if (isNaN(lmpDateUTC.getTime())) {
      return null;
    }

    // Get current date - normalize to UTC midnight
    const nowDate = nowIso ? new Date(nowIso) : new Date();
    const todayUTC = new Date(Date.UTC(
      nowDate.getUTCFullYear(),
      nowDate.getUTCMonth(),
      nowDate.getUTCDate()
    ));

    // Validate future LMP dates
    if (lmpDateUTC > todayUTC) {
      return null;
    }

    // Validate extremely old LMP dates (more than 11 months)
    const elevenMonthsAgo = new Date(todayUTC);
    elevenMonthsAgo.setUTCMonth(elevenMonthsAgo.getUTCMonth() - 11);
    if (lmpDateUTC < elevenMonthsAgo) {
      return null;
    }

    // Calculate days using UTC-only math
    const days = Math.floor((todayUTC.getTime() - lmpDateUTC.getTime()) / MS_PER_DAY);
    const weeks = Math.floor(days / 7);
    const remainderDays = days % 7;

    // Calculate EDD (LMP + 280 days)
    const eddUTC = new Date(lmpDateUTC.getTime() + (PREGNANCY_DURATION_DAYS * MS_PER_DAY));
    const eddIso = eddUTC.toISOString().split('T')[0];

    // Calculate progress percentage (0-100, clamped)
    const progressPct = Math.max(0, Math.min(100, (days / PREGNANCY_DURATION_DAYS) * 100));

    return {
      days: Math.max(0, days),
      weeks: Math.max(0, weeks),
      remainderDays: Math.max(0, remainderDays),
      eddIso,
      progressPct
    };
  } catch (error) {
    console.warn('Error calculating gestational age:', error);
    return null;
  }
}

/**
 * Get trimester based on gestational weeks
 */
export function getTrimester(weeks: number): 1 | 2 | 3 {
  if (weeks < 14) return 1;
  if (weeks < 28) return 2;
  return 3;
}

/**
 * Format gestational age for display
 */
export function formatGestationalAge(gestationalAge: GestationalAge, isRTL: boolean = false): string {
  const { weeks, remainderDays } = gestationalAge;
  
  if (isRTL) {
    return `${weeks} أسبوع و ${remainderDays} أيام`;
  }
  
  return `${weeks} weeks and ${remainderDays} days`;
}

/**
 * Check if pregnancy is overdue (past EDD)
 */
export function isOverdue(eddIso: string, nowIso?: string): boolean {
  try {
    const edd = new Date(eddIso);
    const now = nowIso ? new Date(nowIso) : new Date();
    const todayUTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));
    
    return todayUTC > edd;
  } catch {
    return false;
  }
}

/**
 * Get days remaining until due date (negative if overdue)
 */
export function getDaysUntilDue(eddIso: string, nowIso?: string): number {
  try {
    const edd = new Date(eddIso);
    const now = nowIso ? new Date(nowIso) : new Date();
    const todayUTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));
    
    return Math.ceil((edd.getTime() - todayUTC.getTime()) / MS_PER_DAY);
  } catch {
    return 0;
  }
}