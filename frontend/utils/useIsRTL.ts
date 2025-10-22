import { useEffect, useState } from 'react';
import { isRTL, addLanguageChangeListener } from '@/utils/i18n';

/**
 * Custom hook to get current RTL state and react to language changes
 * Returns true if current language is RTL (Arabic), false for LTR (English)
 */
export function useIsRTL(): boolean {
  const [isRTLValue, setIsRTLValue] = useState(() => isRTL());

  useEffect(() => {
    // Update RTL state when language changes
    const unsubscribe = addLanguageChangeListener(() => {
      setIsRTLValue(isRTL());
    });

    return unsubscribe;
  }, []);

  return isRTLValue;
}

export default useIsRTL;