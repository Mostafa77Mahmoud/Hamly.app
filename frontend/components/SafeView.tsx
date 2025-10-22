
import React from 'react';
import { View, Text, ViewStyle } from 'react-native';

interface SafeViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  suppressTextWarnings?: boolean;
}

export function SafeView({ children, style, suppressTextWarnings = true }: SafeViewProps) {
  // تنظيف الأطفال لإزالة النصوص الضارة
  const cleanChildren = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child, index) => {
      // إذا كان نص خام
      if (typeof child === 'string') {
        const cleanText = child.trim();
        
        // تجاهل النصوص الفارغة أو النقاط المنفردة أو المسافات
        if (!cleanText || cleanText === '.' || /^[\s\.\,\;\:\!\?\-]+$/.test(cleanText)) {
          return suppressTextWarnings ? null : <Text key={`safe-text-${index}`} style={{ display: 'none' }}>{cleanText}</Text>;
        }
        
        // لف النص في Text component
        return <Text key={`safe-text-${index}`}>{child}</Text>;
      }

      // إذا كان React element مع أطفال
      if (React.isValidElement(child) && child.props && child.props.children) {
        return React.cloneElement(child as React.ReactElement<any>, {
          ...child.props,
          children: cleanChildren(child.props.children),
          key: child.key || `safe-element-${index}`
        });
      }

      // إرجاع العنصر كما هو
      return child;
    });
  };

  return (
    <View style={style}>
      {cleanChildren(children)}
    </View>
  );
}

export default SafeView;
