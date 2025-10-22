import React, { useMemo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useIsRTL } from "@/utils/useIsRTL";
import { t } from "@/utils/i18n";
import { createShadowStyle } from "@/utils/shadowStyles";

interface LocalizedHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  leading?: React.ReactNode;
  actions?: React.ReactNode[];
  rightActions?: React.ReactNode[]; // Backward compatibility
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  backgroundColor?: string;
  elevation?: boolean;
  variant?: "default" | "large" | "compact" | "minimal";
  onTitlePress?: () => void;
}

export default function LocalizedHeader({
  title,
  subtitle,
  showLogo = true,
  leading,
  actions = [],
  rightActions = [],
  style,
  titleStyle,
  subtitleStyle,
  backgroundColor = "#FFFFFF",
  elevation = true,
  variant = "default",
  onTitlePress,
}: LocalizedHeaderProps) {
  const isRTL = useIsRTL();

  const headerStyle = useMemo(
    () => [
      styles.header,
      styles[variant],
      elevation && styles.elevated,
      isRTL && styles.rtlHeader,
      { backgroundColor },
      style,
    ],
    [variant, elevation, isRTL, backgroundColor, style],
  );

  const contentDirection = useMemo(
    () => ({
      flexDirection: (isRTL ? "row-reverse" : "row") as "row" | "row-reverse",
    }),
    [isRTL],
  );

  const textAlignment = useMemo(
    () => ({
      textAlign: "center" as const, // Always center the title horizontally
      writingDirection: isRTL ? "rtl" : "ltr",
    }),
    [isRTL],
  );

  const leadingElement = useMemo(() => {
    if (leading) return leading;
    if (!showLogo) return null;

    return (
      <View style={styles.logoContainer}>
        {" "}
        <Image
          source={require("@/assets/images/hamly transparent logo.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="HamlyMD Logo"
        />{" "}
      </View>
    );
  }, [leading, showLogo]);

  const titleSection = useMemo(
    () => (
      <TouchableOpacity
        style={[styles.titleContainer, isRTL && styles.rtlTitleContainer]}
        onPress={onTitlePress}
        disabled={!onTitlePress}
        activeOpacity={onTitlePress ? 0.7 : 1}
      >
        {" "}
        <Text
          style={
            [
              styles.title,
              styles[`${variant}Title`],
              textAlignment,
              titleStyle,
            ] as TextStyle[]
          }
          numberOfLines={2}
          accessibilityRole="header"
        >
          {" "}
          {title}{" "}
        </Text>{" "}
        {subtitle && (
          <Text
            style={
              [
                styles.subtitle,
                styles[`${variant}Subtitle`],
                textAlignment,
                subtitleStyle,
              ] as TextStyle[]
            }
            numberOfLines={1}
            accessibilityRole="text"
          >
            {" "}
            {subtitle}{" "}
          </Text>
        )}{" "}
      </TouchableOpacity>
    ),
    [
      title,
      subtitle,
      variant,
      textAlignment,
      titleStyle,
      subtitleStyle,
      onTitlePress,
      isRTL,
    ],
  );

  const actionsSection = useMemo(() => {
    // Support both actions and rightActions props for backward compatibility
    const allActions = [...actions, ...rightActions];
    if (allActions.length === 0) return null;

    return (
      <View style={styles.actionsContainer}>
        {" "}
        {allActions.map((action, index) => (
          <View key={index} style={styles.actionItem}>
            {" "}
            {action}{" "}
          </View>
        ))}{" "}
      </View>
    );
  }, [actions, rightActions]);

  return (
    <View style={headerStyle}>
      {" "}
      <View style={styles.content}>
        {" "}
        {/* Golden Rule Structure: Left Slot | Center Slot (flex:1, centered) | Right Slot */}
        {/* Left Slot */}{" "}
        <View style={styles.leftSlot}>
          {" "}
          {isRTL
            ? // RTL: Actions go to left
              actionsSection
            : // LTR: Leading element goes to left
              leadingElement && (
                <View style={styles.leadingContainer}> {leadingElement} </View>
              )}{" "}
        </View>{" "}
        {/* Center Slot - Title (always centered horizontally) */}{" "}
        <View style={styles.centerSlot}>
          {" "}
          <TouchableOpacity
            style={[styles.titleContainer, styles.centeredTitleContainer]}
            onPress={onTitlePress}
            disabled={!onTitlePress}
            activeOpacity={onTitlePress ? 0.7 : 1}
          >
            {" "}
            <Text
              style={
                [
                  styles.title,
                  styles[`${variant}Title`],
                  textAlignment,
                  titleStyle,
                ] as TextStyle[]
              }
              numberOfLines={2}
              accessibilityRole="header"
            >
              {" "}
              {title}{" "}
            </Text>{" "}
            {subtitle && (
              <Text
                style={
                  [
                    styles.subtitle,
                    styles[`${variant}Subtitle`],
                    textAlignment,
                    subtitleStyle,
                  ] as TextStyle[]
                }
                numberOfLines={1}
                accessibilityRole="text"
              >
                {" "}
                {subtitle}{" "}
              </Text>
            )}{" "}
          </TouchableOpacity>{" "}
        </View>{" "}
        {/* Right Slot */}{" "}
        <View style={styles.rightSlot}>
          {" "}
          {isRTL
            ? // RTL: Leading element goes to right
              leadingElement && (
                <View
                  style={[styles.leadingContainer, styles.rtlLeadingContainer]}
                >
                  {" "}
                  {leadingElement}{" "}
                </View>
              )
            : // LTR: Actions go to right
              actionsSection}{" "}
        </View>{" "}
      </View>{" "}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingTop: Platform.OS === "ios" ? 44 : 24,
    paddingBottom: 16,
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  // Variants
  default: {
    // Default header height
  },

  large: {
    paddingBottom: 24,
  },

  compact: {
    paddingBottom: 12,
    paddingTop: Platform.OS === "ios" ? 40 : 20,
  },

  minimal: {
    borderBottomWidth: 0,
    paddingBottom: 8,
  },

  // Elevation
  elevated: {
    ...createShadowStyle({
      color: "#000",
      offset: { width: 0, height: 2 },
      opacity: 0.1,
      radius: 8,
      elevation: 4,
    }),
  },

  // RTL specific
  rtlHeader: {
    // RTL layout handled by flexDirection in content
  },

  // Leading section
  leadingContainer: {
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  rtlLeadingContainer: {
    marginRight: 0,
    marginLeft: 16,
  },

  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: 40,
    height: 40,
  },

  // Golden Rule Layout Slots
  leftSlot: {
    minWidth: 60,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  centerSlot: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  rightSlot: {
    minWidth: 60,
    justifyContent: "center",
    alignItems: "flex-end",
  },

  // Title section - responsive alignment
  titleContainer: {
    justifyContent: "center",
    paddingVertical: 4,
    alignSelf: "stretch",
  },

  rtlTitleContainer: {
    alignItems: "flex-end",
  },

  centeredTitleContainer: {
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1A1A1A",
    lineHeight: 28,
    marginBottom: 4,
    letterSpacing: 0.2,
  },

  centeredTitle: {
    textAlign: "center",
  },

  defaultTitle: {
    fontSize: 20,
  },

  largeTitle: {
    fontSize: 24,
    fontWeight: "800",
  },

  compactTitle: {
    fontSize: 18,
  },

  minimalTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  subtitle: {
    fontSize: 15,
    color: "#666666",
    lineHeight: 20,
    marginTop: 2,
    letterSpacing: 0.1,
  },

  centeredSubtitle: {
    textAlign: "center",
  },

  defaultSubtitle: {
    fontSize: 14,
  },

  largeSubtitle: {
    fontSize: 16,
  },

  compactSubtitle: {
    fontSize: 12,
  },

  minimalSubtitle: {
    fontSize: 12,
    color: "#999999",
  },

  // Actions section
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  actionItem: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
});
