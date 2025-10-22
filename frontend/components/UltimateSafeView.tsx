
import React from 'react';
import { View, Text, ViewStyle } from 'react-native';

interface UltimateSafeViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function UltimateSafeView({ children, style }: UltimateSafeViewProps) {
  // تنظيف شامل للأطفال
  const processChildren = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child, index) => {
      // إذا كان نص خام
      if (typeof child === 'string') {
        const cleaned = child.trim();
        
        // إزالة أي نص يحتوي على نقاط فقط أو مسافات
        if (!cleaned || 
            cleaned === '.' || 
            /^[\s\.\,\;\:\!\?\-\n\r\t]+$/.test(cleaned) ||
            cleaned.length === 0) {
          return null; // إزالة تماماً
        }
        
        // إذا كان نص حقيقي، لفه في Text
        return <Text key={`safe-${index}`}>{child}</Text>;
      }

      // إذا كان React element
      if (React.isValidElement(child)) {
        // إذا كان له أطفال، نظف أطفاله أيضاً
        if (child.props && child.props.children) {
          return React.cloneElement(child as React.ReactElement<any>, {
            ...child.props,
            children: processChildren(child.props.children),
            key: child.key || `element-${index}`
          });
        }
      }

      return child;
    });
  };

  const safeChildren = processChildren(children);

  return <View style={style}>{safeChildren}</View>;
}

export default UltimateSafeView;
