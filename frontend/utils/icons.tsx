import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

export function getDirectionalIcon(nameLTR: string, nameRTL: string, isRTL: boolean) {
  const name = isRTL ? nameRTL : nameLTR;
  // return React element, not an object
  return <MaterialIcons name={name as any} size={20} />;
}