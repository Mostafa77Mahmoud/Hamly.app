import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from "react-native";
import { useIsRTL } from "@/utils/useIsRTL";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  COMPONENT_STYLES,
} from "@/utils/modernStyles";

interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  required?: boolean;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  labelStyle?: any;
  inputStyle?: any;
  variant?: "default" | "outlined" | "filled";
}

export default function Input({
  label,
  error,
  required = false,
  style,
  containerStyle,
  labelStyle,
  inputStyle,
  variant = "default",
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const isRTL = useIsRTL();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const containerStyles = [styles.container, containerStyle];

  const inputContainerStyles = [
    styles.inputContainer,
    styles[variant],
    isFocused && styles.focused,
    error && styles.error,
    style,
  ];

  const textInputStyles = [styles.input, isRTL && styles.inputRTL, inputStyle];

  const labelStyles = [
    styles.label,
    isRTL && styles.labelRTL,
    error && styles.labelError,
    labelStyle,
  ];

  return (
    <View style={containerStyles}>
      {label && (
        <Text style={labelStyles}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View style={inputContainerStyles}>
        <TextInput
          style={textInputStyles}
          textAlign={isRTL ? "right" : "left"}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={COLORS.textTertiary}
          {...props}
        />
      </View>
      {error && (
        <Text style={[styles.errorText, isRTL && styles.errorTextRTL]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },

  label: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: "500",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: "left",
  },

  labelRTL: {
    textAlign: "right",
  },

  labelError: {
    color: COLORS.error,
  },

  required: {
    color: COLORS.error,
    fontWeight: "600",
  },

  inputContainer: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },

  default: {
    borderColor: COLORS.border,
  },

  outlined: {
    borderColor: COLORS.pregnancyPrimary,
    backgroundColor: "transparent",
  },

  filled: {
    backgroundColor: COLORS.gray50,
    borderColor: "transparent",
  },

  focused: {
    borderColor: COLORS.pregnancyPrimary,
    borderWidth: 2,
  },

  error: {
    borderColor: COLORS.error,
  },

  input: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.normal,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    minHeight: 44,
    textAlignVertical: "center",
  },

  inputRTL: {
    writingDirection: "rtl",
  },

  errorText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.normal,
    color: COLORS.error,
    marginTop: SPACING.xs,
    textAlign: "left",
  },

  errorTextRTL: {
    textAlign: "right",
  },
});
