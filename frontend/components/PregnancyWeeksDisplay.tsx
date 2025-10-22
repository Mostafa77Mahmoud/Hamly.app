import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, ViewStyle, StyleProp } from 'react-native';
import { pregnancyWeeksData, WeeklyContent } from '@/data/pregnancyWeeks';
import { t } from '@/utils/i18n';
import { useIsRTL } from '@/utils/useIsRTL';
import AnimatedCard from '@/components/ui/AnimatedCard';
import Section from '@/components/ui/Section';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface PregnancyWeeksDisplayProps {
  currentWeek: number;
  language?: 'en' | 'ar';
}

export default function PregnancyWeeksDisplay({
  currentWeek,
  language = 'en',
}: PregnancyWeeksDisplayProps) {
  const isRTL = useIsRTL();
  const [expandedWeek, setExpandedWeek] = useState<number | null>(currentWeek);

  // Get the current week's data
  const currentWeekData = pregnancyWeeksData.find((w) => w.week === currentWeek);

  // Get updates to display (current week ± 2 weeks)
  const getDisplayedWeeks = (): WeeklyContent[] => {
    const start = Math.max(1, currentWeek - 2);
    const end = Math.min(40, currentWeek + 2);
    return pregnancyWeeksData
      .filter((w) => w.week >= start && w.week <= end)
      .sort((a, b) => b.week - a.week); // Show newest first
  };

  const displayedWeeks = getDisplayedWeeks();

  if (!currentWeekData) {
    return (
      <Section title={language === 'ar' ? 'تحديثات الحمل' : 'Pregnancy Updates'} variant="card">
        <Text style={styles.noDataText}>
          {language === 'ar'
            ? 'لا توجد بيانات متاحة لهذا الأسبوع'
            : 'No data available for this week'}
        </Text>
      </Section>
    );
  }

  const toggleWeek = (week: number) => {
    setExpandedWeek(expandedWeek === week ? null : week);
  };

  const renderWeekCard = (weekData: WeeklyContent, index: number) => {
    const isExpanded = expandedWeek === weekData.week;
    const isCurrent = weekData.week === currentWeek;
    const lang = language;

    return (
      <View
        key={weekData.week}
        style={isCurrent ? [styles.weekCard, styles.currentWeekCard] : styles.weekCard}
      >
        <AnimatedCard
          delay={150 + index * 50}
          onPress={() => toggleWeek(weekData.week)}
          pressable={true}
        >
        <View style={[styles.weekHeader, isRTL && styles.weekHeaderRTL]}>
          <View style={[styles.weekBadge, isCurrent && styles.currentWeekBadge]}>
            <Text style={[styles.weekNumber, isCurrent && styles.currentWeekNumber]}>
              {lang === 'ar' ? `الأسبوع ${weekData.week}` : `Week ${weekData.week}`}
            </Text>
          </View>
          <Icon
            name={isExpanded ? 'expand-less' : 'expand-more'}
            size={24}
            color={isCurrent ? '#E91E63' : '#666'}
          />
        </View>

        {isCurrent && (
          <View style={styles.currentBadge}>
            <Icon name="star" size={16} color="#E91E63" />
            <Text style={styles.currentBadgeText}>
              {lang === 'ar' ? 'الأسبوع الحالي' : 'Current Week'}
            </Text>
          </View>
        )}

        {isExpanded && (
          <View style={styles.weekContent}>
            <View style={styles.contentSection}>
              <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
                <Icon name="child-care" size={20} color="#E91E63" />
                <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
                  {lang === 'ar' ? 'تطور الجنين' : 'Fetal Development'}
                </Text>
              </View>
              <Text style={[styles.contentText, isRTL && styles.contentTextRTL]}>
                {weekData.fetalDevelopment[lang]}
              </Text>
            </View>

            <View style={styles.contentSection}>
              <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
                <Icon name="favorite" size={20} color="#E91E63" />
                <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
                  {lang === 'ar' ? 'التغيرات الأمومية' : 'Maternal Changes'}
                </Text>
              </View>
              <Text style={[styles.contentText, isRTL && styles.contentTextRTL]}>
                {weekData.maternalChanges[lang]}
              </Text>
            </View>

            <View style={styles.contentSection}>
              <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
                <Icon name="local-hospital" size={20} color="#E91E63" />
                <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
                  {lang === 'ar' ? 'نصائح صحية' : 'Health Tips'}
                </Text>
              </View>
              <Text style={[styles.contentText, isRTL && styles.contentTextRTL]}>
                {weekData.healthTips[lang]}
              </Text>
            </View>

            <View style={styles.contentSection}>
              <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
                <Icon name="restaurant" size={20} color="#E91E63" />
                <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
                  {lang === 'ar' ? 'نصائح التغذية' : 'Nutrition Advice'}
                </Text>
              </View>
              <Text style={[styles.contentText, isRTL && styles.contentTextRTL]}>
                {weekData.nutritionAdvice[lang]}
              </Text>
            </View>
          </View>
        )}
        </AnimatedCard>
      </View>
    );
  };

  return (
    <Section
      title={language === 'ar' ? 'تحديثات الحمل' : 'Pregnancy Updates'}
      subtitle={
        language === 'ar'
          ? 'معلومات مفصلة عن أسبوعك الحالي والأسابيع القريبة'
          : 'Detailed information about your current week and nearby weeks'
      }
      variant="flat"
      delay={200}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {displayedWeeks.map((weekData, index) => renderWeekCard(weekData, index))}
      </ScrollView>
    </Section>
  );
}

const cardShadow = Platform.OS === 'web'
  ? { boxShadow: '0 2px 8px rgba(233, 30, 99, 0.15)' }
  : {
      shadowColor: '#E91E63',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 3,
    };

const currentCardShadow = Platform.OS === 'web'
  ? { boxShadow: '0 4px 16px rgba(233, 30, 99, 0.25)' }
  : {
      shadowColor: '#E91E63',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    };

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },
  weekCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...cardShadow,
  },
  currentWeekCard: {
    borderWidth: 2,
    borderColor: '#E91E63',
    ...currentCardShadow,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weekHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  weekBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  currentWeekBadge: {
    backgroundColor: '#FCE4EC',
  },
  weekNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  currentWeekNumber: {
    color: '#E91E63',
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCE4EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  currentBadgeText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#E91E63',
  },
  weekContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  contentSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  sectionTitleRTL: {
    marginLeft: 0,
    marginRight: 8,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
    textAlign: 'left',
  },
  contentTextRTL: {
    textAlign: 'right',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
});
