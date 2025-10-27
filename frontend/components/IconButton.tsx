import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { COLORS } from '@/utils/modernStyles';
import { createShadowStyle } from '@/utils/shadowStyles';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
  accessible?: boolean;
  accessibilityLabel?: string;
}

export default function IconButton({
  icon,
  onPress,
  variant = 'default',
  size = 'medium',
  style,
  disabled = false,
  loading = false,
  accessible = true,
  accessibilityLabel,
}: IconButtonProps) {
  const buttonStyle = [
    styles.button,
    styles[`button_${size}`],
    styles[`button_${variant}`],
    disabled && styles.button_disabled,
    style,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? COLORS.white : COLORS.primary}
        />
      ) : (
        <View style={styles.iconContainer}>{icon}</View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },

  // Sizes
  button_small: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },

  button_medium: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },

  button_large: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },

  // Variants
  button_default: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...createShadowStyle({
      color: '#000',
      offset: { width: 0, height: 1 },
      opacity: 0.05,
      radius: 2,
      elevation: 1,
    }),
  },

  button_primary: {
    backgroundColor: COLORS.primary,
    ...createShadowStyle({
      color: COLORS.primary,
      offset: { width: 0, height: 2 },
      opacity: 0.3,
      radius: 4,
      elevation: 3,
    }),
  },

  button_secondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },

  button_ghost: {
    backgroundColor: 'transparent',
  },

  button_disabled: {
    opacity: 0.5,
  },

  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
