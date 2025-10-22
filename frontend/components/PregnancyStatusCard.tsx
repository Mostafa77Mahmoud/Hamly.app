import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AnimatedProgressBar from './AnimatedProgressBar';
import { useIsRTL } from '@/utils/useIsRTL';

interface PregnancyStatusCardProps {
  currentWeek: number;
  currentDay: number;
  trimester: number;
  progress: number;
  dueDate: Date | null;
  daysRemaining: number;
  isOverdue: boolean;
  language?: 'en' | 'ar';
}

export default function PregnancyStatusCard({
  currentWeek,
  currentDay,
  trimester,
  progress,
  dueDate,
  daysRemaining,
  isOverdue,
  language = 'en',
}: PregnancyStatusCardProps) {
  const isRTL = useIsRTL();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const formatDueDate = (date: Date): string => {
    // Format as Gregorian calendar (not Hijri) - force Gregorian for Arabic
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-US', options);
  };

  const getTrimesterText = (): string => {
    if (language === 'ar') {
      return trimester === 1
        ? 'الثلث الأول'
        : trimester === 2
        ? 'الثلث الثاني'
        : 'الثلث الثالث';
    }
    return `${trimester}${
      trimester === 1 ? 'st' : trimester === 2 ? 'nd' : 'rd'
    } Trimester`;
  };

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <Icon name="pregnant-woman" size={32} color="#E91E63" />
        <View style={[styles.headerText, isRTL && styles.headerTextRTL]}>
          <Text style={styles.weekText}>
            {language === 'ar'
              ? `الأسبوع ${currentWeek} + ${currentDay} ${currentDay === 1 ? 'يوم' : 'أيام'}`
              : `Week ${currentWeek} + ${currentDay} day${currentDay !== 1 ? 's' : ''}`}
          </Text>
          <Text style={styles.trimesterText}>{getTrimesterText()}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <Text style={[styles.progressLabel, isRTL && styles.progressLabelRTL]}>
          {language === 'ar' ? 'تقدم الحمل' : 'Pregnancy Progress'}
        </Text>
        <AnimatedProgressBar
          progress={progress}
          height={16}
          showPercentage={true}
          delay={200}
        />
      </View>

      {dueDate && (
        <View style={styles.dueDateSection}>
          <View style={[styles.dueDateRow, isRTL && styles.dueDateRowRTL]}>
            <Icon name="event" size={20} color="#666" />
            <Text style={[styles.dueDateLabel, isRTL && styles.dueDateLabelRTL]}>
              {language === 'ar' ? 'تاريخ الولادة المتوقع:' : 'Due Date:'}
            </Text>
          </View>
          <Text style={[styles.dueDateText, isRTL && styles.dueDateTextRTL]}>
            {formatDueDate(dueDate)}
          </Text>
          <Text
            style={[
              styles.daysRemainingText,
              isOverdue && styles.overdueText,
              isRTL && styles.daysRemainingTextRTL,
            ]}
          >
            {isOverdue
              ? language === 'ar'
                ? `متأخر ${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? 'يوم' : 'أيام'}`
                : `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} overdue`
              : language === 'ar'
              ? `${daysRemaining} ${daysRemaining === 1 ? 'يوم' : 'أيام'} متبقي`
              : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const cardShadow = Platform.OS === 'web'
  ? { boxShadow: '0 4px 20px rgba(233, 30, 99, 0.2)' }
  : {
      shadowColor: '#E91E63',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    };

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FCE4EC',
    ...cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  headerTextRTL: {
    marginLeft: 0,
    marginRight: 16,
  },
  weekText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  trimesterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E91E63',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textAlign: 'left',
  },
  progressLabelRTL: {
    textAlign: 'right',
  },
  dueDateSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dueDateRowRTL: {
    flexDirection: 'row-reverse',
  },
  dueDateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  dueDateLabelRTL: {
    marginLeft: 0,
    marginRight: 8,
  },
  dueDateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'left',
  },
  dueDateTextRTL: {
    textAlign: 'right',
  },
  daysRemainingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E91E63',
    textAlign: 'left',
  },
  daysRemainingTextRTL: {
    textAlign: 'right',
  },
  overdueText: {
    color: '#F44336',
  },
});