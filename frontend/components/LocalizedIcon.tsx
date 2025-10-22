
import React, { useMemo } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsRTL } from '@/utils/useIsRTL';
import { View, ViewStyle, StyleSheet } from 'react-native';

interface LocalizedIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
  rtlFlip?: boolean;
  rtlAlternative?: string;
  variant?: 'default' | 'filled' | 'outlined' | 'rounded';
  containerStyle?: ViewStyle;
  background?: boolean;
  backgroundColor?: string;
}

export default function LocalizedIcon({
  name,
  size = 24,
  color = '#000000',
  style,
  rtlFlip = false,
  rtlAlternative,
  variant = 'default',
  containerStyle,
  background = false,
  backgroundColor = '#F0F0F0',
}: LocalizedIconProps): React.ReactElement {
  const isRTL = useIsRTL();
  
  const iconName = useMemo(() => {
    if (isRTL && rtlAlternative) return rtlAlternative;
    return name;
  }, [isRTL, rtlAlternative, name]);
  
  const iconStyle = useMemo(() => {
    const baseStyle = [style];
    
    if (isRTL && rtlFlip) {
      baseStyle.push({ transform: [{ scaleX: -1 }] });
    }
    
    return baseStyle;
  }, [isRTL, rtlFlip, style]);

  const containerStyles = useMemo(() => {
    if (!background && !containerStyle) return null;
    
    return [
      background && {
        width: size + 16,
        height: size + 16,
        borderRadius: (size + 16) / 2,
        backgroundColor,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      containerStyle,
    ];
  }, [background, containerStyle, size, backgroundColor]);

  const iconElement = ( <MaterialIcons
      name={iconName as any}
      size={size}
      color={color}
      style={iconStyle}
    /> );

  if (containerStyles) {
    return ( <View style={containerStyles}> {iconElement} </View> );
  }

  return iconElement;
}

// Pre-configured icon components for common use cases
export const LocalizedIcons = {
  // Navigation icons
  back: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon 
      name="arrow-back" 
      rtlFlip={true} 
      rtlAlternative="arrow-forward"
      {...props} 
    /> ),
  
  forward: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon 
      name="arrow-forward" 
      rtlFlip={true} 
      rtlAlternative="arrow-back"
      {...props} 
    /> ),
  
  menu: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="menu" {...props} /> ),
  
  close: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="close" {...props} /> ),
  
  // Action icons
  add: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="add" {...props} /> ),
  
  edit: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="edit" {...props} /> ),
  
  delete: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="delete" color="#F44336" {...props} /> ),
  
  save: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="save" color="#E91E63" {...props} /> ),
  
  // Status icons
  checkCircle: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="check-circle" color="#E91E63" {...props} /> ),
  
  warning: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="warning" color="#FF9800" {...props} /> ),
  
  error: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="error" color="#F44336" {...props} /> ),
  
  info: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="info" color="#E91E63" {...props} /> ),
  
  // Health-specific icons
  medication: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="medical-services" color="#E91E63" {...props} /> ),
  
  labResult: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="biotech" color="#E91E63" {...props} /> ),
  
  symptom: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="favorite" color="#E91E63" {...props} /> ),
  
  profile: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="person" color="#E91E63" {...props} /> ),
  
  // Content icons with directional awareness
  chevronRight: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon 
      name="chevron-right" 
      rtlFlip={true}
      rtlAlternative="chevron-left"
      {...props} 
    /> ),
  
  chevronLeft: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon 
      name="chevron-left" 
      rtlFlip={true}
      rtlAlternative="chevron-right"
      {...props} 
    /> ),
  
  expandMore: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="expand-more" {...props} /> ),
  
  expandLess: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="expand-less" {...props} /> ),
  
  // Common utility icons
  search: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="search" {...props} /> ),
  
  filter: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="filter-list" {...props} /> ),
  
  sort: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="sort" {...props} /> ),
  
  settings: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="settings" {...props} /> ),
  
  help: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="help" color="#666666" {...props} /> ),
  
  moreVert: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="more-vert" {...props} /> ),
  
  moreHoriz: (props: Partial<LocalizedIconProps>) => ( <LocalizedIcon name="more-horiz" {...props} /> ),
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
