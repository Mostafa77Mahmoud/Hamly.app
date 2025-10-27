import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getCurrentLanguage, setLanguage, t, isRTL } from '@/utils/i18n';
import { COLORS } from '@/utils/modernStyles';
import { createShadowStyle } from '@/utils/shadowStyles';

interface LanguageToggleProps {
  onLanguageChange?: () => void;
  compact?: boolean;
}

export default function LanguageToggle({ onLanguageChange, compact = false }: LanguageToggleProps) {
  const currentLang = getCurrentLanguage();

  const toggleLanguage = async () => {
    const newLanguage = currentLang === 'ar' ? 'en' : 'ar';
    await setLanguage(newLanguage);
    onLanguageChange?.();
  };

  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactContainer} 
        onPress={toggleLanguage}
        accessibilityLabel={currentLang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
        accessibilityRole="button"
      >
        <Icon name="translate" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={toggleLanguage}>
      <Icon name="translate" size={20} color="#666666" />
      <Text style={styles.languageText}>
        {currentLang === 'ar' ? 'English' : 'العربية'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    alignSelf: isRTL() ? 'flex-start' : 'flex-end',
  },
  compactContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadowStyle({
      color: '#000',
      offset: { width: 0, height: 1 },
      opacity: 0.05,
      radius: 2,
      elevation: 1,
    }),
  },
  languageText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#666666',
    textAlign: isRTL() ? 'right' : 'left',
  },
});