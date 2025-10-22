import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function AnimatedButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.95, {
        damping: 15,
        stiffness: 150,
      });
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
    }
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onPress();
    }
  };

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button];
    
    // Add size-specific style with runtime guard
    const sizeStyleKey = `button_${size}` as keyof typeof styles;
    if (sizeStyleKey in styles) {
      baseStyle.push(styles[sizeStyleKey] as ViewStyle);
    }
    
    // Add variant-specific style
    if (variant === 'primary') {
      baseStyle.push(styles.buttonPrimary as ViewStyle);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.buttonSecondary as ViewStyle);
    } else if (variant === 'outline') {
      baseStyle.push(styles.buttonOutline as ViewStyle);
    }

    if (disabled || loading) {
      baseStyle.push(styles.buttonDisabled as ViewStyle);
    }

    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.text];
    
    // Add size-specific style with runtime guard
    const sizeStyleKey = `text_${size}` as keyof typeof styles;
    if (sizeStyleKey in styles) {
      baseStyle.push(styles[sizeStyleKey] as TextStyle);
    }
    
    // Add variant-specific style
    if (variant === 'primary') {
      baseStyle.push(styles.textPrimary as TextStyle);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.textSecondary as TextStyle);
    } else if (variant === 'outline') {
      baseStyle.push(styles.textOutline as TextStyle);
    }

    if (disabled) {
      baseStyle.push(styles.textDisabled as TextStyle);
    }

    if (textStyle) {
      baseStyle.push(textStyle);
    }

    return baseStyle;
  };

  return (
    <AnimatedTouchable
      style={[getButtonStyle(), animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#E91E63'} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </AnimatedTouchable>
  );
}

const shadowPrimary = Platform.OS === 'web' 
  ? { boxShadow: '0 4px 8px rgba(233, 30, 99, 0.3)' }
  : { 
      shadowColor: '#E91E63',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    };

const shadowSecondary = Platform.OS === 'web'
  ? { boxShadow: '0 2px 4px rgba(233, 30, 99, 0.15)' }
  : {
      shadowColor: '#E91E63',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    };

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  button_small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  button_medium: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  button_large: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    minHeight: 56,
  },
  buttonPrimary: {
    backgroundColor: '#E91E63',
    ...shadowPrimary,
  },
  buttonSecondary: {
    backgroundColor: '#F8BBD0',
    ...shadowSecondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E91E63',
  },
  buttonDisabled: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textSecondary: {
    color: '#C2185B',
  },
  textOutline: {
    color: '#E91E63',
  },
  textDisabled: {
    color: '#9E9E9E',
  },
});
