import React from 'react';
import { Text, TextStyle } from 'react-native';

interface SafeTextProps {
  children?: React.ReactNode;
  style?: TextStyle;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

export default function SafeText({ 
  children, 
  style, 
  numberOfLines, 
  ellipsizeMode 
}: SafeTextProps) {
  // Filter out empty strings, dots, and whitespace-only content
  const safeChildren = React.Children.toArray(children).filter(child => {
    if (typeof child === 'string') {
      const trimmed = child.trim();
      return trimmed !== '' && trimmed !== '.' && trimmed !== ' ';
    }
    return child !== null && child !== undefined;
  });

  if (safeChildren.length === 0) {
    return null;
  }

  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
    >
      {safeChildren}
    </Text>
  );
}