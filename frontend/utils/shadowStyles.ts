// Utility for cross-platform shadow styles
import { ViewStyle } from 'react-native';

interface ShadowConfig {
  color?: string;
  offset?: { width: number; height: number };
  opacity?: number;
  radius?: number;
  elevation?: number;
}

// Convert hex color to RGB
const hexToRgb = (hex: string): string => {
  if (hex === '#000') return '0, 0, 0';
  if (hex === '#E91E63') return '233, 30, 99';

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
};

// Check if we're on web by checking for window object
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export const createShadowStyle = (config: ShadowConfig): ViewStyle => {
  const {
    color = '#000',
    offset = { width: 0, height: 2 },
    opacity = 0.1,
    radius = 4,
    elevation = 4
  } = config;

  if (isWeb) {
    return {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px rgba(${hexToRgb(color)}, ${opacity})`,
    } as ViewStyle;
  }

  // For native platforms, use the proper shadow properties
  return {
    shadowColor: color,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  } as ViewStyle;
};

export const shadowStyles = {
  small: {
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.22)',
    elevation: 3,
  },
  medium: {
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
    elevation: 5,
  },
  large: {
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.30)',
    elevation: 8,
  },
};