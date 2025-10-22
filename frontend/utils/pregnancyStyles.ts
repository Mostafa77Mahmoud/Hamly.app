
import { StyleSheet } from 'react-native';
import { COLORS, SPACING, COMPONENT_STYLES } from './modernStyles';
import { createShadowStyle } from './shadowStyles';

export const PREGNANCY_COLORS = {
  // Primary pregnancy palette - ألوان ناعمة وهادئة
  primary: '#D81B60',
  primaryLight: '#F8BBD9',
  primaryDark: '#AD1457',
  
  // Secondary colors - ألوان مكملة
  secondary: '#7986CB',
  secondaryLight: '#C5CAE9',
  secondaryDark: '#3F51B5',
  
  // Accent colors - ألوان تأكيدية
  accent: '#FFB74D',
  accentLight: '#FFF3E0',
  accentDark: '#F57C00',
  
  // Health status colors - ألوان الحالة الصحية
  healthGood: '#66BB6A',
  healthGoodLight: '#E8F5E8',
  healthWarning: '#FFA726',
  healthWarningLight: '#FFF8E1',
  healthDanger: '#EF5350',
  healthDangerLight: '#FFEBEE',
  
  // Pregnancy weeks colors - ألوان أسابيع الحمل
  trimester1: '#E1F5FE',
  trimester2: '#F3E5F5',
  trimester3: '#FFF8E1',
  
  // Background variations - خلفيات متنوعة
  backgroundSoft: '#FAFBFC',
  backgroundCard: '#FFFFFF',
  backgroundAccent: '#F8F9FA',
};

export const PREGNANCY_TYPOGRAPHY = {
  // Page headers
  pageTitle: {
    ...COMPONENT_STYLES.heading1,
    color: PREGNANCY_COLORS.primary,
    textAlign: 'center' as const,
  },
  
  pageSubtitle: {
    ...COMPONENT_STYLES.body,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    marginTop: SPACING.xs,
  },
  
  // Section headers
  sectionTitle: {
    ...COMPONENT_STYLES.heading3,
    color: PREGNANCY_COLORS.primary,
    marginBottom: SPACING.sm,
  },
  
  // Card content
  cardTitle: {
    ...COMPONENT_STYLES.body,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  
  cardSubtitle: {
    ...COMPONENT_STYLES.caption,
    color: COLORS.textSecondary,
  },
  
  // Status text
  statusNormal: {
    ...COMPONENT_STYLES.caption,
    color: PREGNANCY_COLORS.healthGood,
  },
  
  statusWarning: {
    ...COMPONENT_STYLES.caption,
    color: PREGNANCY_COLORS.healthWarning,
  },
  
  statusDanger: {
    ...COMPONENT_STYLES.caption,
    color: PREGNANCY_COLORS.healthDanger,
  },
};

export const PREGNANCY_COMPONENTS = StyleSheet.create({
  // Page containers
  pageContainer: {
    flex: 1,
    backgroundColor: PREGNANCY_COLORS.backgroundSoft,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  
  // Headers
  pageHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  
  sectionHeader: {
    marginVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  
  // Cards
  primaryCard: {
    backgroundColor: PREGNANCY_COLORS.backgroundCard,
    borderRadius: 16,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    ...createShadowStyle({
      color: PREGNANCY_COLORS.primary,
      offset: { width: 0, height: 2 },
      opacity: 0.1,
      radius: 8,
      elevation: 3,
    }),
  },
  
  accentCard: {
    backgroundColor: PREGNANCY_COLORS.accentLight,
    borderRadius: 16,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: PREGNANCY_COLORS.accent,
  },
  
  healthCard: {
    backgroundColor: PREGNANCY_COLORS.backgroundCard,
    borderRadius: 16,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: PREGNANCY_COLORS.healthGood,
  },
  
  // Status indicators
  statusIndicator: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  
  statusNormal: {
    backgroundColor: PREGNANCY_COLORS.healthGoodLight,
  },
  
  statusWarning: {
    backgroundColor: PREGNANCY_COLORS.healthWarningLight,
  },
  
  statusDanger: {
    backgroundColor: PREGNANCY_COLORS.healthDangerLight,
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: PREGNANCY_COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadowStyle({
      color: PREGNANCY_COLORS.primary,
      offset: { width: 0, height: 2 },
      opacity: 0.3,
      radius: 4,
      elevation: 3,
    }),
  },
  
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: PREGNANCY_COLORS.primary,
  },
  
  // Form elements
  inputContainer: {
    backgroundColor: PREGNANCY_COLORS.backgroundCard,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginVertical: SPACING.xs,
  },
  
  inputFocused: {
    borderColor: PREGNANCY_COLORS.primary,
    borderWidth: 2,
  },
  
  // Lists and rows
  listContainer: {
    backgroundColor: PREGNANCY_COLORS.backgroundCard,
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: SPACING.sm,
  },
  
  listItem: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  listItemLast: {
    borderBottomWidth: 0,
  },
  
  // Empty states
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.xl,
  },
  
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PREGNANCY_COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  
  // Progress indicators
  progressContainer: {
    backgroundColor: PREGNANCY_COLORS.primaryLight,
    borderRadius: 8,
    height: 8,
    overflow: 'hidden',
    marginVertical: SPACING.sm,
  },
  
  progressBar: {
    backgroundColor: PREGNANCY_COLORS.primary,
    height: '100%',
    borderRadius: 8,
  },
});

// RTL-aware spacing utilities
export function getPregnancySpacing(isRTL: boolean) {
  return {
    marginStart: (value: number) => ({ [isRTL ? 'marginRight' : 'marginLeft']: value }),
    marginEnd: (value: number) => ({ [isRTL ? 'marginLeft' : 'marginRight']: value }),
    paddingStart: (value: number) => ({ [isRTL ? 'paddingRight' : 'paddingLeft']: value }),
    paddingEnd: (value: number) => ({ [isRTL ? 'paddingLeft' : 'paddingRight']: value }),
    textAlign: (isRTL ? 'right' : 'left') as 'left' | 'right',
    writingDirection: isRTL ? 'rtl' : 'ltr',
    flexDirection: (isRTL ? 'row-reverse' : 'row') as 'row' | 'row-reverse',
  };
}
