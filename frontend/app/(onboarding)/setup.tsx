import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { createPregnancy, setActivePregnancy, getActivePregnancy } from '@/utils/supabaseStorage';
import { calculateDueDate } from '@/utils/pregnancy';
import { t, isRTL, getCurrentLanguage } from '@/utils/i18n';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { supabase } from '@/utils/supabase';
import LanguageToggle from '@/components/LanguageToggle';

export default function SetupScreen() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pregnancyData, setPregnancyData] = useState({
    name: '',
    lastMenstrualPeriod: '',
    notes: '',
  });
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [languageKey, setLanguageKey] = useState(0);
  const { user, setIsNewUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user?.id) return;
      
      try {
        // Check if user already has an active pregnancy
        const { data: pregnancy } = await supabase
          .from('pregnancies')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();
        
        if (pregnancy) {
          console.log('[Onboarding] User already has active pregnancy, redirecting to main app');
          router.replace('/(tabs)/lab-results');
        }
      } catch (error) {
        console.error('[Onboarding] Error checking pregnancy status:', error);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  const handleNext = () => {
    if (step === 1) {
      if (!pregnancyData.name.trim()) {
        Alert.alert(t('error'), getCurrentLanguage() === 'ar' ? 'يرجى إدخال اسم للحمل' : 'Please enter a name for your pregnancy');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedDay || !selectedMonth || !selectedYear) {
        Alert.alert(t('error'), getCurrentLanguage() === 'ar' ? 'يرجى اختيار تاريخ آخر دورة شهرية كامل' : 'Please select complete Last Menstrual Period date');
        return;
      }

      // Construct and validate date
      const lmpDateString = `${selectedYear}-${selectedMonth.padStart(2, '0')}-${selectedDay.padStart(2, '0')}`;
      const lmpDate = new Date(lmpDateString);
      
      if (isNaN(lmpDate.getTime())) {
        Alert.alert(t('error'), getCurrentLanguage() === 'ar' ? 'يرجى إدخال تاريخ صحيح' : 'Please enter a valid date');
        return;
      }

      // Check if date is in the future
      if (lmpDate > new Date()) {
        Alert.alert(t('error'), getCurrentLanguage() === 'ar' ? 'لا يمكن اختيار تاريخ في المستقبل' : 'Cannot select a future date');
        return;
      }

      setPregnancyData({...pregnancyData, lastMenstrualPeriod: lmpDateString});
      setStep(3);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        throw new Error('User not found');
      }

      // First, ensure profile exists
      console.log('[Onboarding] Checking if profile exists...');
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileCheckError && profileCheckError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('[Onboarding] Profile not found, creating profile...');
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
          });

        if (createProfileError) {
          console.error('[Onboarding] Error creating profile:', createProfileError);
          throw createProfileError;
        }
        console.log('[Onboarding] Profile created successfully');
      } else if (profileCheckError) {
        console.error('[Onboarding] Error checking profile:', profileCheckError);
        throw profileCheckError;
      } else {
        console.log('[Onboarding] Profile already exists');
      }

      // Now create the pregnancy
      const dueDate = calculateDueDate(pregnancyData.lastMenstrualPeriod);

      console.log('[Onboarding] Creating pregnancy with data:', {
        name: pregnancyData.name.trim(),
        last_menstrual_period: pregnancyData.lastMenstrualPeriod,
        due_date: dueDate,
        is_active: true,
        notes: pregnancyData.notes.trim() || null,
      });

      const pregnancy = await createPregnancy({
        name: pregnancyData.name.trim(),
        last_menstrual_period: pregnancyData.lastMenstrualPeriod,
        due_date: dueDate,
        is_active: true,
        notes: pregnancyData.notes.trim() || null,
      });

      console.log('[Onboarding] Created pregnancy:', pregnancy);

      await setActivePregnancy(pregnancy.id);
      console.log('[Onboarding] Set active pregnancy ID:', pregnancy.id);

      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        const activePreg = await getActivePregnancy();
        console.log('[Onboarding] Verified active pregnancy:', activePreg);
        if (!activePreg) {
          throw new Error('Active pregnancy not found after creation');
        }
      } catch (verifyError) {
        console.error('[Onboarding] Failed to verify active pregnancy:', verifyError);
        throw verifyError;
      }

      // Mark user as no longer new since onboarding is complete
      setIsNewUser(false);
      console.log('[Onboarding] Setup complete, navigating to main app');
      router.replace('/(tabs)/lab-results');
    } catch (error) {
      console.error('[Onboarding] Error creating pregnancy:', error);
      Alert.alert(t('error'), getCurrentLanguage() === 'ar' ? 'فشل في إعداد الحمل. يرجى المحاولة مرة أخرى.' : 'Failed to set up your pregnancy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/profile');
  };

  const handleLanguageChange = () => {
    setLanguageKey(prev => prev + 1);
  };

  const currentLang = getCurrentLanguage();

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => (currentYear - i).toString());

  return (
    <SafeAreaView style={styles.container} key={languageKey}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.languageToggleContainer}>
          <LanguageToggle onLanguageChange={handleLanguageChange} />
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentLang === 'ar' ? `الخطوة ${step} من 3` : `Step ${step} of 3`}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Icon name="medical-services" size={48} color="#E91E63" />
            </View>
            <Text style={styles.stepTitle}>
              {currentLang === 'ar' ? 'مرحباً بك في HamlyMD!' : 'Welcome to HamlyMD!'}
            </Text>
            <Text style={styles.stepSubtitle}>
              {currentLang === 'ar' 
                ? 'لنبدأ بإعداد ملف الحمل الخاص بك للحصول على رؤى صحية مخصصة' 
                : "Let's set up your pregnancy profile to provide you with personalized health insights"}
            </Text>
            
            <View style={styles.formContainer}>
              <Input
                label={currentLang === 'ar' ? 'اسم الحمل' : 'Pregnancy Name'}
                value={pregnancyData.name}
                onChangeText={(text) => setPregnancyData({...pregnancyData, name: text})}
                placeholder={currentLang === 'ar' ? 'مثال: الحمل الأول، الطفل الثاني' : 'e.g., First Pregnancy, Baby #2'}
                required
              />
              <Text style={styles.helpText}>
                {currentLang === 'ar' 
                  ? 'أعطي حملك اسماً لمساعدتك على تتبع رحلتك' 
                  : 'Give your pregnancy a name to help you track your journey'}
              </Text>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Icon name="event" size={48} color="#E91E63" />
            </View>
            <Text style={styles.stepTitle}>
              {currentLang === 'ar' ? 'متى بدأت آخر دورة شهرية؟' : 'When did your last period start?'}
            </Text>
            <Text style={styles.stepSubtitle}>
              {currentLang === 'ar' 
                ? 'يساعدنا هذا في حساب موعد الولادة المتوقع وتوفير معلومات دقيقة أسبوعياً' 
                : 'This helps us calculate your due date and provide accurate weekly information'}
            </Text>
            
            <View style={styles.formContainer}>
              <Text style={styles.dateLabel}>
                {currentLang === 'ar' ? 'آخر دورة شهرية (LMP)' : 'Last Menstrual Period (LMP)'}
              </Text>
              
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerSection}>
                  <Text style={styles.datePickerLabel}>
                    {currentLang === 'ar' ? 'اليوم' : 'Day'}
                  </Text>
                  <ScrollView style={styles.datePickerScroll} nestedScrollEnabled>
                    {days.map(day => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dateOption,
                          selectedDay === day && styles.dateOptionSelected
                        ]}
                        onPress={() => setSelectedDay(day)}
                      >
                        <Text style={[
                          styles.dateOptionText,
                          selectedDay === day && styles.dateOptionTextSelected
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.datePickerSection}>
                  <Text style={styles.datePickerLabel}>
                    {currentLang === 'ar' ? 'الشهر' : 'Month'}
                  </Text>
                  <ScrollView style={styles.datePickerScroll} nestedScrollEnabled>
                    {months.map(month => (
                      <TouchableOpacity
                        key={month}
                        style={[
                          styles.dateOption,
                          selectedMonth === month && styles.dateOptionSelected
                        ]}
                        onPress={() => setSelectedMonth(month)}
                      >
                        <Text style={[
                          styles.dateOptionText,
                          selectedMonth === month && styles.dateOptionTextSelected
                        ]}>
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.datePickerSection}>
                  <Text style={styles.datePickerLabel}>
                    {currentLang === 'ar' ? 'السنة' : 'Year'}
                  </Text>
                  <ScrollView style={styles.datePickerScroll} nestedScrollEnabled>
                    {years.map(year => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.dateOption,
                          selectedYear === year && styles.dateOptionSelected
                        ]}
                        onPress={() => setSelectedYear(year)}
                      >
                        <Text style={[
                          styles.dateOptionText,
                          selectedYear === year && styles.dateOptionTextSelected
                        ]}>
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {selectedDay && selectedMonth && selectedYear && (
                <View style={styles.selectedDateContainer}>
                  <Text style={styles.selectedDateText}>
                    {currentLang === 'ar' ? 'التاريخ المحدد: ' : 'Selected date: '}
                    {`${selectedYear}-${selectedMonth.padStart(2, '0')}-${selectedDay.padStart(2, '0')}`}
                  </Text>
                </View>
              )}

              <Text style={styles.helpText}>
                {currentLang === 'ar' 
                  ? 'سيتم حساب موعد الولادة تلقائياً (LMP + 280 يوم)' 
                  : 'Your due date will be automatically calculated (LMP + 280 days)'}
              </Text>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Icon name="arrow-forward" size={48} color="#E91E63" />
            </View>
            <Text style={styles.stepTitle}>
              {currentLang === 'ar' ? 'أوشكنا على الانتهاء!' : 'Almost done!'}
            </Text>
            <Text style={styles.stepSubtitle}>
              {currentLang === 'ar' 
                ? 'أضيفي أي ملاحظات إضافية عن حملك (اختياري)' 
                : 'Add any additional notes about your pregnancy (optional)'}
            </Text>
            
            <View style={styles.formContainer}>
              <Input
                label={currentLang === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
                value={pregnancyData.notes}
                onChangeText={(text) => setPregnancyData({...pregnancyData, notes: text})}
                placeholder={currentLang === 'ar' ? 'أي معلومات إضافية...' : 'Any additional information...'}
                multiline
              />
              
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>
                  {currentLang === 'ar' ? 'الملخص:' : 'Summary:'}
                </Text>
                <Text style={styles.summaryText}>
                  • {currentLang === 'ar' ? 'الاسم: ' : 'Name: '}{pregnancyData.name}
                </Text>
                <Text style={styles.summaryText}>
                  • {currentLang === 'ar' ? 'آخر دورة شهرية: ' : 'LMP: '}{pregnancyData.lastMenstrualPeriod}
                </Text>
                <Text style={styles.summaryText}>
                  • {currentLang === 'ar' ? 'موعد الولادة المتوقع: ' : 'Due Date: '}
                  {calculateDueDate(pregnancyData.lastMenstrualPeriod)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>
            {currentLang === 'ar' ? 'تخطي الآن' : 'Skip for now'}
          </Text>
        </TouchableOpacity>
        
        {step < 3 ? (
          <Button
            title={currentLang === 'ar' ? 'التالي' : 'Next'}
            onPress={handleNext}
            style={styles.nextButton}
          />
        ) : (
          <Button
            title={loading ? (currentLang === 'ar' ? 'جاري الإعداد...' : 'Setting up...') : (currentLang === 'ar' ? 'إنهاء الإعداد' : 'Complete Setup')}
            onPress={handleComplete}
            disabled={loading}
            style={styles.nextButton}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  languageToggleContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E91E63',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFE8F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
  },
  helpText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  dateLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#333333',
    marginBottom: 12,
  },
  datePickerContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  datePickerSection: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  datePickerScroll: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  dateOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  dateOptionSelected: {
    backgroundColor: '#E91E63',
  },
  dateOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#333333',
    textAlign: 'center',
  },
  dateOptionTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  selectedDateContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectedDateText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2E7D32',
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#333333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#666666',
  },
  nextButton: {
    flex: 1,
    marginLeft: 16,
  },
});
