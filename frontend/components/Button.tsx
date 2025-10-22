import React from "react";
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import {
  useLocalizedStyles,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from "@/utils/modernStyles";
import { createShadowStyle } from "@/utils/shadowStyles";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outlined" | "ghost" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  testID?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  titleStyle,
  testID,
  icon,
  iconPosition = "left",
}: ButtonProps) {
  const localizedStyles = useLocalizedStyles();
  const styles = getStyles(localizedStyles);

  const isDisabled = disabled || loading;

  const content = (
    <>
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? COLORS.white : COLORS.primary}
          style={styles.loadingIndicator}
        />
      )}
      {!loading && icon && iconPosition === "left" && <>{icon}</>}
      <Text
        style={[
          styles.title,
          styles[`${variant}Title`],
          styles[`${size}Title`],
          isDisabled && styles.disabledTitle,
          titleStyle,
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {!loading && icon && iconPosition === "right" && <>{icon}</>}
    </>
  );

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        styles[size],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      testID={testID}
    >
      {content}
    </TouchableOpacity>
  );
}

function getStyles(localizedStyles: ReturnType<typeof useLocalizedStyles>) {
  return StyleSheet.create({
    button: {
      flexDirection: localizedStyles.row as any,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      minHeight: 44,
      paddingHorizontal: SPACING.lg,
      gap: SPACING.sm,
    },

    // Variants
    primary: {
      backgroundColor: COLORS.pregnancyPrimary,
      ...createShadowStyle({
        color: COLORS.pregnancyPrimary,
        offset: { width: 0, height: 2 },
        opacity: 0.2,
        radius: 4,
        elevation: 3,
      }),
    },

    secondary: {
      backgroundColor: COLORS.pregnancySecondary,
      ...createShadowStyle({
        color: COLORS.pregnancySecondary,
        offset: { width: 0, height: 2 },
        opacity: 0.2,
        radius: 4,
        elevation: 3,
      }),
    },

    outlined: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: COLORS.pregnancyPrimary,
    },

    ghost: {
      backgroundColor: "transparent",
    },

    danger: {
      backgroundColor: COLORS.error,
      ...createShadowStyle({
        color: COLORS.error,
        offset: { width: 0, height: 2 },
        opacity: 0.2,
        radius: 4,
        elevation: 3,
      }),
    },

    // Sizes
    small: {
      minHeight: 36,
      paddingHorizontal: SPACING.md,
      borderRadius: 8,
    },

    medium: {
      minHeight: 44,
      paddingHorizontal: SPACING.lg,
      borderRadius: 12,
    },

    large: {
      minHeight: 52,
      paddingHorizontal: SPACING.xl,
      borderRadius: 14,
    },

    // States
    disabled: {
      opacity: 0.5,
    },

    // Title styles
    title: {
      fontSize: TYPOGRAPHY.base,
      fontWeight: TYPOGRAPHY.button,
      textAlign: "center",
      letterSpacing: 0.2,
    },

    primaryTitle: {
      color: COLORS.white,
    },

    secondaryTitle: {
      color: COLORS.white,
    },

    outlinedTitle: {
      color: COLORS.pregnancyPrimary,
    },

    ghostTitle: {
      color: COLORS.pregnancyPrimary,
    },

    dangerTitle: {
      color: COLORS.white,
    },

    disabledTitle: {
      opacity: 0.7,
    },

    // Size-specific title styles
    smallTitle: {
      fontSize: 14,
    },

    mediumTitle: {
      fontSize: 16,
    },

    largeTitle: {
      fontSize: 18,
    },

    loadingIndicator: {
      marginRight: SPACING.xs,
    },
  });
}
