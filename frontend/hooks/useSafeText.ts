
import React, { useMemo } from 'react';

export function useSafeText(text: string | undefined | null): string | null {
  return useMemo(() => {
    if (!text) return null;
    
    const cleaned = text.trim();
    
    // تجاهل النصوص الضارة
    if (!cleaned || 
        cleaned === '.' || 
        /^[\s\.\,\;\:\!\?\-\n\r\t]+$/.test(cleaned) ||
        cleaned.length === 0) {
      return null;
    }
    
    return cleaned;
  }, [text]);
}

export function useSafeChildren(children: React.ReactNode): React.ReactNode[] {
  return useMemo(() => {
    const safeChildren: React.ReactNode[] = [];
    
    React.Children.forEach(children, (child, index) => {
      if (typeof child === 'string') {
        const safeText = useSafeText(child);
        if (safeText) {
          safeChildren.push(safeText);
        }
      } else if (child) {
        safeChildren.push(child);
      }
    });
    
    return safeChildren;
  }, [children]);
}
