import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getCurrentLanguage, setLanguage, t, isRTL } from '@/utils/i18n';

interface LanguageToggleProps {
  onLanguageChange?: () => void;
}

export default function LanguageToggle({ onLanguageChange }: LanguageToggleProps) {
  const currentLang = getCurrentLanguage();

  const toggleLanguage = async () => {
    const newLanguage = currentLang === 'ar' ? 'en' : 'ar';
    await setLanguage(newLanguage);
    onLanguageChange?.();
  };

  return ( <TouchableOpacity style={styles.container} onPress={toggleLanguage}> <Icon name="translate" size={20} color="#666666" /> <Text style={styles.languageText}> {currentLang === 'ar' ? 'English' : 'العربية'} </Text> </TouchableOpacity> );
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
  languageText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#666666',
    textAlign: isRTL() ? 'right' : 'left',
  },
});