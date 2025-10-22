/**
 * Server-side validation for API endpoints
 * Node.js compatible version of validation rules
 */

/**
 * Validate pregnancy data
 */
function validatePregnancyDates(data) {
  const errors = [];
  const warnings = [];
  const now = new Date();
  const minYear = 2010;

  if (data.lastMenstrualPeriod) {
    const lmpDate = new Date(data.lastMenstrualPeriod);
    
    if (isNaN(lmpDate.getTime())) {
      errors.push('Invalid last menstrual period date format');
    } else {
      const lmpYear = lmpDate.getFullYear();
      
      if (lmpYear < minYear) {
        errors.push(`Last menstrual period cannot be before ${minYear}`);
      }
      
      if (lmpDate > now) {
        errors.push('Last menstrual period cannot be in the future');
      }
      
      const maxPregnancyDuration = new Date(now.getTime() - (10 * 30 * 24 * 60 * 60 * 1000));
      if (lmpDate < maxPregnancyDuration) {
        warnings.push('Last menstrual period is more than 10 months ago - please verify active pregnancy status');
      }
    }
  }

  if (data.pregnancyWeek !== undefined) {
    if (data.pregnancyWeek < 1 || data.pregnancyWeek > 42) {
      errors.push('Pregnancy week must be between 1 and 42');
    }
    
    if (data.pregnancyWeek > 40) {
      warnings.push('Pregnancy week is beyond typical term (40 weeks) - please consult healthcare provider');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate medication data
 */
function validateMedicationData(data) {
  const errors = [];
  const warnings = [];
  const now = new Date();

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Medication name must be at least 2 characters long');
  }

  if (data.pregnancyWeek !== undefined) {
    if (data.pregnancyWeek < 1 || data.pregnancyWeek > 42) {
      errors.push('Pregnancy week must be between 1 and 42');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate symptom data
 */
function validateSymptomData(data) {
  const errors = [];
  const warnings = [];

  if (!data.type || data.type.trim().length < 2) {
    errors.push('Symptom type must be at least 2 characters long');
  }

  if (data.severity < 1 || data.severity > 5) {
    errors.push('Symptom severity must be between 1 and 5');
  } else if (data.severity >= 4) {
    warnings.push('High severity symptom - consider consulting healthcare provider immediately');
  }

  if (data.pregnancyWeek !== undefined) {
    if (data.pregnancyWeek < 1 || data.pregnancyWeek > 42) {
      errors.push('Pregnancy week must be between 1 and 42');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate lab report data
 */
function validateLabReportData(data) {
  const errors = [];
  const warnings = [];

  if (!data.image || data.image.length < 100) {
    errors.push('Valid lab report image is required');
  }

  if (data.image && data.image.length > 1500000) {
    errors.push('Lab report file is too large (max 1.5MB)');
  }

  if (!data.mimeType || !['image/jpeg', 'image/png', 'application/pdf'].includes(data.mimeType)) {
    errors.push('Lab report must be JPEG, PNG, or PDF format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

module.exports = {
  validatePregnancyDates,
  validateMedicationData,
  validateSymptomData,
  validateLabReportData
};