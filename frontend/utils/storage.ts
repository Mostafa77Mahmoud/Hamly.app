import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  LAB_RESULTS: 'prenatal_lab_results',
  LAB_REPORTS: 'prenatal_lab_reports',
  MEDICATIONS: 'prenatal_medications',
  VITAL_SIGNS: 'prenatal_vital_signs',
  FETAL_MOVEMENTS: 'prenatal_fetal_movements',
  SYMPTOMS: 'prenatal_symptoms',
  ULTRASOUNDS: 'prenatal_ultrasounds',
  USER_PROFILE: 'prenatal_user_profile',
  PREGNANCIES: 'prenatal_pregnancies',
  ACTIVE_PREGNANCY: 'prenatal_active_pregnancy',
};

export const saveData = async <T>(key: string, data: T): Promise<void> => {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const jsonString = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonString);
      return; // Success, exit function
    } catch (error) {
      attempt++;
      console.error(`Error saving data for key ${key} (attempt ${attempt}):`, error);

      if (attempt >= maxRetries) {
        throw new Error(`Failed to save data after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

export const loadData = async <T>(key: string): Promise<T | null> => {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const jsonString = await AsyncStorage.getItem(key);
      if (jsonString === null) {
        return null;
      }
      return JSON.parse(jsonString) as T;
    } catch (error) {
      attempt++;
      console.error(`Error loading data for key ${key} (attempt ${attempt}):`, error);

      if (attempt >= maxRetries) {
        console.error(`Failed to load data after ${maxRetries} attempts, returning null`);
        return null;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
    }
  }

  return null;
};

export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing data for key ${key}:`, error);
    throw error;
  }
};

export const exportAllData = async (): Promise<string> => {
  try {
    const allData: Record<string, any> = {};
    for (const [storageKey, key] of Object.entries(STORAGE_KEYS)) {
      const data = await loadData(key);
      if (data) {
        allData[storageKey] = data;
      }
    }
    return JSON.stringify(allData, null, 2);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

export { STORAGE_KEYS };