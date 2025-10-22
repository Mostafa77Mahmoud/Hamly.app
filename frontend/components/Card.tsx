import React, { ReactNode } from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useLocalizedStyles, COLORS, SPACING } from "@/utils/modernStyles";
import { createShadowStyle } from "@/utils/shadowStyles";

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: "default" | "elevated" | "outlined" | "filled";
  padding?: "none" | "small" | "medium" | "large";
  disabled?: boolean;
  testID?: string;
  isAlert?: boolean;
}

export default function Card({
  children,
  style,
  onPress,
  variant = "default",
  padding = "medium",
  disabled = false,
  testID,
}: CardProps) {
  const localizedStyles = useLocalizedStyles();
  const styles = getStyles(localizedStyles);

  const containerStyle = [
    styles.card,
    styles[variant],
    styles[
      `padding${padding.charAt(0).toUpperCase() + padding.slice(1)}` as keyof typeof styles
    ],
    disabled && styles.disabled,
    style,
  ];

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [...containerStyle, pressed && styles.pressed]}
        testID={testID}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={containerStyle} testID={testID}>
      {children}
    </View>
  );
}

function getStyles(localizedStyles: ReturnType<typeof useLocalizedStyles>) {
  return StyleSheet.create({
    card: {
      backgroundColor: COLORS.surface,
      borderRadius: 16,
      marginVertical: 4,
      overflow: "hidden",
    },

    default: {
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
      ...createShadowStyle({
        color: "#000",
        offset: { width: 0, height: 1 },
        opacity: 0.05,
        radius: 3,
        elevation: 2,
      }),
    },

    elevated: {
      backgroundColor: COLORS.surface,
      ...createShadowStyle({
        color: "#000",
        offset: { width: 0, height: 4 },
        opacity: 0.1,
        radius: 8,
        elevation: 4,
      }),
    },

    outlined: {
      backgroundColor: COLORS.surface,
      borderWidth: 1.5,
      borderColor: COLORS.primary,
    },

    filled: {
      backgroundColor: COLORS.primaryLight,
      borderWidth: 1,
      borderColor: COLORS.primary,
    },

    paddingNone: {
      padding: 0,
    },

    paddingSmall: {
      padding: SPACING.sm,
    },

    paddingMedium: {
      padding: SPACING.lg,
    },

    paddingLarge: {
      padding: SPACING.xl,
    },

    disabled: {
      opacity: 0.6,
    },

    pressed: {
      backgroundColor: COLORS.gray50,
      transform: [{ scale: 0.98 }],
    },
  });
}
