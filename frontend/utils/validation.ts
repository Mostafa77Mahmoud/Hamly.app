/**
 * Comprehensive Data Validation System for HamlyMD
 * Validates realistic data inputs across all health-related features
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PregnancyData {
  lastMenstrualPeriod?: string;
  dueDate?: string;
  pregnancyWeek?: number;
}

export interface MedicationData {
  name: string;
  dosage?: string;
  startDate?: string;
  endDate?: string;
  expirationDate?: string;
}

export interface LabResultData {
  testName: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  category: 'blood' | 'urine' | 'ultrasound' | 'genetic' | 'other';
  testDate?: string;
}

export interface SymptomData {
  type: string;
  severity: number;
  description?: string;
  date?: string;
  pregnancyWeek?: number;
}

/**
 * Pregnancy Date Validation
 */
export function validatePregnancyDates(data: PregnancyData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Current date for validation
  const now = new Date();
  const currentYear = now.getFullYear();
  const minYear = 2010; // Minimum reasonable year for pregnancy tracking

  // Validate Last Menstrual Period (LMP)
  if (data.lastMenstrualPeriod) {
    const lmpDate = new Date(data.lastMenstrualPeriod);
    
    if (isNaN(lmpDate.getTime())) {
      errors.push('Invalid last menstrual period date format');
    } else {
      const lmpYear = lmpDate.getFullYear();
      
      // Check if LMP is before 2010
      if (lmpYear < minYear) {
        errors.push(`Last menstrual period cannot be before ${minYear}`);
      }
      
      // Check if LMP is in the future
      if (lmpDate > now) {
        errors.push('Last menstrual period cannot be in the future');
      }
      
      // Check if LMP is more than 10 months ago (unrealistic active pregnancy)
      const maxPregnancyDuration = new Date(now.getTime() - (10 * 30 * 24 * 60 * 60 * 1000));
      if (lmpDate < maxPregnancyDuration) {
        warnings.push('Last menstrual period is more than 10 months ago - please verify active pregnancy status');
      }
    }
  }

  // Validate Due Date
  if (data.dueDate) {
    const dueDate = new Date(data.dueDate);
    
    if (isNaN(dueDate.getTime())) {
      errors.push('Invalid due date format');
    } else {
      // Due date should be in the future for active pregnancies
      if (dueDate < now) {
        warnings.push('Due date is in the past - please verify pregnancy status');
      }
      
      // Due date should not be more than 1 year in the future
      const maxFutureDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000));
      if (dueDate > maxFutureDate) {
        errors.push('Due date cannot be more than 1 year in the future');
      }
    }
  }

  // Validate Pregnancy Week
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
 * Medication Data Validation
 */
export function validateMedicationData(data: MedicationData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const now = new Date();

  // Validate medication name
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Medication name must be at least 2 characters long');
  }

  // Validate start date
  if (data.startDate) {
    const startDate = new Date(data.startDate);
    
    if (isNaN(startDate.getTime())) {
      errors.push('Invalid medication start date format');
    } else {
      // Start date cannot be more than 5 years ago
      const maxPastDate = new Date(now.getTime() - (5 * 365 * 24 * 60 * 60 * 1000));
      if (startDate < maxPastDate) {
        errors.push('Medication start date cannot be more than 5 years ago');
      }
      
      // Start date cannot be more than 1 year in the future
      const maxFutureDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000));
      if (startDate > maxFutureDate) {
        errors.push('Medication start date cannot be more than 1 year in the future');
      }
    }
  }

  // Validate end date
  if (data.endDate) {
    const endDate = new Date(data.endDate);
    
    if (isNaN(endDate.getTime())) {
      errors.push('Invalid medication end date format');
    }
    
    if (data.startDate) {
      const startDate = new Date(data.startDate);
      if (!isNaN(startDate.getTime()) && endDate < startDate) {
        errors.push('Medication end date cannot be before start date');
      }
    }
  }

  // Validate expiration date
  if (data.expirationDate) {
    const expirationDate = new Date(data.expirationDate);
    
    if (isNaN(expirationDate.getTime())) {
      errors.push('Invalid medication expiration date format');
    } else {
      // Expiration date cannot be more than 10 years ago
      const maxPastExpiration = new Date(now.getTime() - (10 * 365 * 24 * 60 * 60 * 1000));
      if (expirationDate < maxPastExpiration) {
        errors.push('Medication expiration date cannot be more than 10 years ago');
      }
      
      // Warn if medication is expired
      if (expirationDate < now) {
        warnings.push('This medication has expired - please consult your healthcare provider');
      }
      
      // Warn if expiration is very soon
      const oneMonthFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      if (expirationDate > now && expirationDate < oneMonthFromNow) {
        warnings.push('This medication expires within a month - consider renewal');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Lab Result Data Validation
 */
export function validateLabResultData(data: LabResultData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate test name
  if (!data.testName || data.testName.trim().length < 2) {
    errors.push('Test name must be at least 2 characters long');
  }

  // Validate numeric values for common tests
  const numericValue = typeof data.value === 'string' ? parseFloat(data.value) : data.value;
  
  if (!isNaN(numericValue)) {
    // Common lab value validations
    const testNameLower = data.testName.toLowerCase();
    
    // Hemoglobin validation
    if (testNameLower.includes('hemoglobin') || testNameLower.includes('hb')) {
      if (numericValue < 3 || numericValue > 20) {
        errors.push('Hemoglobin value is outside possible human range (3-20 g/dL)');
      } else if (numericValue < 7) {
        warnings.push('Very low hemoglobin - immediate medical attention may be required');
      } else if (numericValue > 16) {
        warnings.push('High hemoglobin - please verify with healthcare provider');
      }
    }
    
    // White Blood Cell Count validation
    if (testNameLower.includes('wbc') || testNameLower.includes('white blood cell')) {
      if (numericValue < 0 || numericValue > 100) {
        errors.push('WBC count is outside possible human range (0-100 × 10³/μL)');
      } else if (numericValue < 2) {
        warnings.push('Very low WBC count - immune system concern, consult doctor');
      } else if (numericValue > 50) {
        warnings.push('Very high WBC count - possible infection or other condition');
      }
    }
    
    // Blood pressure validation
    if (testNameLower.includes('blood pressure') || testNameLower.includes('bp')) {
      if (numericValue < 50 || numericValue > 300) {
        errors.push('Blood pressure value is outside possible human range (50-300 mmHg)');
      } else if (numericValue > 180) {
        warnings.push('High blood pressure - hypertensive crisis risk, seek immediate care');
      } else if (numericValue < 90) {
        warnings.push('Low blood pressure - monitor for symptoms');
      }
    }
    
    // Blood glucose validation
    if (testNameLower.includes('glucose') || testNameLower.includes('sugar')) {
      if (numericValue < 10 || numericValue > 800) {
        errors.push('Blood glucose is outside possible human range (10-800 mg/dL)');
      } else if (numericValue > 400) {
        warnings.push('Extremely high glucose - diabetic emergency risk');
      } else if (numericValue < 50) {
        warnings.push('Very low glucose - hypoglycemia risk');
      }
    }
  }

  // Validate test date
  if (data.testDate) {
    const testDate = new Date(data.testDate);
    const now = new Date();
    
    if (isNaN(testDate.getTime())) {
      errors.push('Invalid test date format');
    } else {
      // Test date cannot be more than 5 years ago
      const maxPastDate = new Date(now.getTime() - (5 * 365 * 24 * 60 * 60 * 1000));
      if (testDate < maxPastDate) {
        errors.push('Test date cannot be more than 5 years ago');
      }
      
      // Test date cannot be in the future
      if (testDate > now) {
        errors.push('Test date cannot be in the future');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Symptom Data Validation
 */
export function validateSymptomData(data: SymptomData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate symptom type
  if (!data.type || data.type.trim().length < 2) {
    errors.push('Symptom type must be at least 2 characters long');
  }

  // Validate severity
  if (data.severity < 1 || data.severity > 5) {
    errors.push('Symptom severity must be between 1 and 5');
  } else if (data.severity >= 4) {
    warnings.push('High severity symptom - consider consulting healthcare provider');
  }

  // Validate pregnancy week if provided
  if (data.pregnancyWeek !== undefined) {
    if (data.pregnancyWeek < 1 || data.pregnancyWeek > 42) {
      errors.push('Pregnancy week must be between 1 and 42');
    }
  }

  // Validate symptom date
  if (data.date) {
    const symptomDate = new Date(data.date);
    const now = new Date();
    
    if (isNaN(symptomDate.getTime())) {
      errors.push('Invalid symptom date format');
    } else {
      // Symptom date cannot be more than 1 year ago
      const maxPastDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
      if (symptomDate < maxPastDate) {
        errors.push('Symptom date cannot be more than 1 year ago');
      }
      
      // Symptom date cannot be in the future
      if (symptomDate > now) {
        errors.push('Symptom date cannot be in the future');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Comprehensive validation function that validates all data types
 */
export function validateHealthData(data: {
  pregnancy?: PregnancyData;
  medications?: MedicationData[];
  labResults?: LabResultData[];
  symptoms?: SymptomData[];
}): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Validate pregnancy data
  if (data.pregnancy) {
    const pregnancyValidation = validatePregnancyDates(data.pregnancy);
    allErrors.push(...pregnancyValidation.errors);
    allWarnings.push(...pregnancyValidation.warnings);
  }

  // Validate medications
  if (data.medications) {
    data.medications.forEach((medication, index) => {
      const medicationValidation = validateMedicationData(medication);
      allErrors.push(...medicationValidation.errors.map(error => `Medication ${index + 1}: ${error}`));
      allWarnings.push(...medicationValidation.warnings.map(warning => `Medication ${index + 1}: ${warning}`));
    });
  }

  // Validate lab results
  if (data.labResults) {
    data.labResults.forEach((labResult, index) => {
      const labValidation = validateLabResultData(labResult);
      allErrors.push(...labValidation.errors.map(error => `Lab Result ${index + 1}: ${error}`));
      allWarnings.push(...labValidation.warnings.map(warning => `Lab Result ${index + 1}: ${warning}`));
    });
  }

  // Validate symptoms
  if (data.symptoms) {
    data.symptoms.forEach((symptom, index) => {
      const symptomValidation = validateSymptomData(symptom);
      allErrors.push(...symptomValidation.errors.map(error => `Symptom ${index + 1}: ${error}`));
      allWarnings.push(...symptomValidation.warnings.map(warning => `Symptom ${index + 1}: ${warning}`));
    });
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}