import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity, Pressable } from 'react-native';
import { useLocalizedStyles, COLORS, SPACING, COMPONENT_STYLES, ACCESSIBILITY_STYLES } from '@/utils/modernStyles';

export interface LocalizedRowProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode; // Icon, image, or avatar
  actions?: ReactNode[]; // Action buttons
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  // Layout options
  spacing?: 'compact' | 'comfortable' | 'spacious';
  alignment?: 'center' | 'flex-start' | 'flex-end';
}

/**
 * Modern LocalizedRow component with perfect RTL/LTR support
 * 
 * Layout rules:
 * - RTL: Actions (far left) | Title+Subtitle (center-right) | Leading (far right)
 * - LTR: Leading (far left) | Title+Subtitle (center-left) | Actions (far right)
 * 
 * This implements the design principle: leading content (image/avatar) at outer edge,
 * actions adjacent inward, and text content in the remaining space
 */
export default function LocalizedRow({
  title,
  subtitle,
  leading,
  actions = [],
  style,
  titleStyle,
  subtitleStyle,
  onPress,
  disabled = false,
  testID,
  spacing = 'comfortable',
  alignment = 'center',
}: LocalizedRowProps) {
  const localizedStyles = useLocalizedStyles();
  const styles = getStyles(localizedStyles, spacing, alignment);

  // Create title content
  const titleContent = (
    <View style={styles.titleContainer}>
      {typeof title === 'string' ? (
        <Text 
          style={[styles.title, titleStyle]}
          numberOfLines={2}
        >
          {title}
        </Text>
      ) : (
        title
      )}
      {subtitle && (
        <View style={styles.subtitleContainer}>
          {typeof subtitle === 'string' ? (
            <Text 
              style={[styles.subtitle, subtitleStyle]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : (
            subtitle
          )}
        </View>
      )}
    </View>
  );

  // Create actions section
  const actionsSection = actions.length > 0 ? (
    <View style={styles.actionsContainer}>
      {actions.map((action, index) => (
        <View key={index} style={styles.actionItem}>
          {action}
        </View>
      ))}
    </View>
  ) : null;

  // Create leading section
  const leadingSection = leading ? (
    <View style={styles.leadingContainer}>
      {leading}
    </View>
  ) : null;

  // Container styles
  const containerStyle = [styles.container, disabled && styles.disabled, style];

  const content = localizedStyles.isRTL ? (
    // RTL Layout: Actions | Title | Leading
    <>
      {actionsSection}
      {titleContent}
      {leadingSection}
    </>
  ) : (
    // LTR Layout: Leading | Title | Actions
    <>
      {leadingSection}
      {titleContent}
      {actionsSection}
    </>
  );

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          ...containerStyle,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        testID={testID}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={containerStyle} testID={testID}>
      {content}
    </View>
  );
}

function getStyles(
  localizedStyles: ReturnType<typeof useLocalizedStyles>,
  spacing: 'compact' | 'comfortable' | 'spacious',
  alignment: 'center' | 'flex-start' | 'flex-end'
) {
  const verticalPadding = {
    compact: SPACING.sm,
    comfortable: SPACING.md,
    spacious: SPACING.lg,
  }[spacing];

  return StyleSheet.create({
    container: {
      flexDirection: localizedStyles.row as any,
      alignItems: alignment,
      paddingVertical: verticalPadding,
      paddingHorizontal: SPACING.lg,
      backgroundColor: COLORS.surface,
      borderRadius: 8,
      marginVertical: 2,
      ...ACCESSIBILITY_STYLES.touchableOpacity,
    },

    disabled: {
      ...ACCESSIBILITY_STYLES.disabled,
    },

    pressed: {
      backgroundColor: COLORS.gray50,
      transform: [{ scale: 0.98 }],
    },

    leadingContainer: {
      marginEnd: SPACING.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },

    titleContainer: {
      flex: 1,
      alignItems: localizedStyles.alignStart as any,
      justifyContent: alignment === 'center' ? 'center' : alignment,
    },

    title: {
      ...COMPONENT_STYLES.body,
      fontWeight: '500',
      textAlign: localizedStyles.textAlign as any,
      writingDirection: localizedStyles.writingDirection as any,
      width: '100%',
    } as TextStyle,

    subtitleContainer: {
      marginTop: SPACING.xs,
      width: '100%',
    },

    subtitle: {
      ...COMPONENT_STYLES.caption,
      textAlign: localizedStyles.textAlign as any,
      writingDirection: localizedStyles.writingDirection as any,
      width: '100%',
    } as TextStyle,

    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      flexShrink: 0,
      marginStart: SPACING.md,
    },

    actionItem: {
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
}