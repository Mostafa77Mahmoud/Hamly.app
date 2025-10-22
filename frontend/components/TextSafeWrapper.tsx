
import React from 'react';
import { View, Text } from 'react-native';

interface TextSafeWrapperProps {
  children: React.ReactNode;
  fallbackStyle?: any;
}

export function TextSafeWrapper({ children, fallbackStyle }: TextSafeWrapperProps) {
  const safeChildren = React.Children.map(children, (child, index) => {
    if (typeof child === 'string') {
      const cleaned = child.trim();
      
      // تجاهل النقاط والمسافات والنصوص الفارغة
      if (!cleaned || cleaned === '.' || /^[\s\.\,\;\:\!\?\-\n\r\t]+$/.test(cleaned)) {
        return null;
      }
      
      // لف النص في Text component
      return ( <Text key={`wrapper-${index}`} style={fallbackStyle}> {child} </Text> );
    }
    return child;
  });

  return <>{safeChildren}</>;
}

export default TextSafeWrapper;
