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
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useIsRTL } from "@/utils/useIsRTL";
import { t } from "@/utils/i18n";
import { COLORS, SPACING, TYPOGRAPHY } from "@/utils/modernStyles";
import { createShadowStyle } from "@/utils/shadowStyles";
import Icon from "react-native-vector-icons/MaterialIcons";

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  rightActions?: React.ReactNode[];
  actions?: React.ReactNode[];
  onLeftPress?: () => void;
  onRightPress?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  backgroundColor?: string;
  textColor?: string;
  variant?: "default" | "large" | "minimal" | "centered" | "compact";
  showBackButton?: boolean;
  onBackPress?: () => void;
  elevation?: boolean;
  borderBottom?: boolean;
}

export default function ModernHeader({
  title,
  subtitle,
  showLogo = false,
  leftElement,
  rightElement,
  rightActions,
  actions,
  onLeftPress,
  onRightPress,
  style,
  titleStyle,
  subtitleStyle,
  backgroundColor = "#FFFFFF",
  textColor = "#1A1A1A",
  variant = "default",
  showBackButton = false,
  onBackPress,
  elevation = true,
  borderBottom = true,
}: ModernHeaderProps) {
  const isRTL = useIsRTL();

  // حساب الارتفاع الآمن للـ status bar
  const statusBarHeight =
    Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24;

  // تحديد أنماط الحاوية الرئيسية
  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        backgroundColor,
        paddingTop: statusBarHeight,
      },
      elevation && styles.elevated,
      borderBottom && styles.bordered,
      style,
    ],
    [backgroundColor, statusBarHeight, elevation, borderBottom, style],
  );

  // تحديد اتجاه المحتوى
  const contentDirection = useMemo(
    () => ({
      flexDirection: (isRTL ? "row-reverse" : "row") as "row" | "row-reverse",
    }),
    [isRTL],
  );

  // تحديد محاذاة النص
  const textAlignment = useMemo(
    () => ({
      textAlign: (variant === "centered"
        ? "center"
        : isRTL
          ? "right"
          : "left") as "center" | "right" | "left",
      writingDirection: (isRTL ? "rtl" : "ltr") as "rtl" | "ltr",
    }),
    [isRTL, variant],
  );

  // عنصر الجانب الأيسر
  const leftSection = useMemo(() => {
    if (showBackButton && onBackPress) {
      return (
        <TouchableOpacity
          style={styles.sideButton}
          onPress={onBackPress}
          activeOpacity={0.7}
        >
          {" "}
          <Icon
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color={textColor}
          />{" "}
        </TouchableOpacity>
      );
    }

    if (leftElement) {
      return (
        <TouchableOpacity
          style={styles.sideContainer}
          onPress={onLeftPress}
          activeOpacity={onLeftPress ? 0.7 : 1}
          disabled={!onLeftPress}
        >
          {" "}
          {leftElement}{" "}
        </TouchableOpacity>
      );
    }

    if (showLogo) {
      return (
        <View style={styles.logoContainer}>
          {" "}
          <Image
            source={require("@/assets/images/hamly transparent logo.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel={t("appLogoAlt")}
          />{" "}
        </View>
      );
    }

    return <View style={styles.sideContainer} />;
  }, [
    showBackButton,
    onBackPress,
    leftElement,
    onLeftPress,
    showLogo,
    isRTL,
    textColor,
  ]);

  // عنصر الجانب الأيمن
  const rightSection = useMemo(() => {
    // استخدام rightActions أو actions أو rightElement
    const actionsToRender = rightActions || actions;

    if (actionsToRender && actionsToRender.length > 0) {
      return (
        <View style={[styles.actionsContainer, contentDirection]}>
          {" "}
          {actionsToRender.map((action, index) => (
            <View key={index} style={styles.actionItem}>
              {" "}
              {action}{" "}
            </View>
          ))}{" "}
        </View>
      );
    }

    if (rightElement) {
      return (
        <TouchableOpacity
          style={styles.sideContainer}
          onPress={onRightPress}
          activeOpacity={onRightPress ? 0.7 : 1}
          disabled={!onRightPress}
        >
          {" "}
          {rightElement}{" "}
        </TouchableOpacity>
      );
    }

    return <View style={styles.sideContainer} />;
  }, [rightActions, actions, rightElement, onRightPress, contentDirection]);

  // منطقة العنوان
  const titleSection = useMemo(() => {
    const titleTextStyle = [
      styles.title,
      styles[`${variant}Title`],
      { color: textColor },
      textAlignment,
      titleStyle,
    ];

    const subtitleTextStyle = [
      styles.subtitle,
      styles[`${variant}Subtitle`],
      { color: textColor },
      textAlignment,
      subtitleStyle,
    ];

    return (
      <View
        style={[
          styles.titleContainer,
          variant === "centered" && { alignItems: "center" },
        ]}
      >
        {" "}
        <Text
          style={titleTextStyle}
          numberOfLines={variant === "large" ? 3 : 2}
          accessibilityRole="header"
        >
          {" "}
          {title}{" "}
        </Text>{" "}
        {subtitle && (
          <Text
            style={subtitleTextStyle}
            numberOfLines={2}
            accessibilityRole="text"
          >
            {" "}
            {subtitle}{" "}
          </Text>
        )}{" "}
      </View>
    );
  }, [
    title,
    subtitle,
    variant,
    textColor,
    textAlignment,
    titleStyle,
    subtitleStyle,
  ]);

  return (
    <View style={containerStyle}>
      {" "}
      <View style={[styles.content, contentDirection]}>
        {" "}
        {/* الجانب الأيسر في LTR أو الأيمن في RTL */}{" "}
        <View style={[styles.sideSection, isRTL && styles.rtlSideSection]}>
          {" "}
          {isRTL ? rightSection : leftSection}{" "}
        </View>{" "}
        {/* منطقة العنوان */}{" "}
        <View style={styles.titleSection}> {titleSection} </View>{" "}
        {/* الجانب الأيمن في LTR أو الأيسر في RTL */}{" "}
        <View style={[styles.sideSection, isRTL && styles.rtlSideSection]}>
          {" "}
          {isRTL ? leftSection : rightSection}{" "}
        </View>{" "}
      </View>{" "}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    width: "100%",
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },

  // الأقسام الجانبية
  sideSection: {
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
  },

  rtlSideSection: {
    alignItems: "center",
  },

  sideContainer: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
    minHeight: 44,
  },

  sideButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },

  // منطقة الشعار
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    ...createShadowStyle({
      color: "#000",
      offset: { width: 0, height: 1 },
      opacity: 0.1,
      radius: 2,
      elevation: 2,
    }),
  },

  logo: {
    width: 40,
    height: 40,
  },

  // منطقة العنوان
  titleSection: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
  },

  titleContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },

  // أنماط العناوين الأساسية
  title: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semibold,
    color: "#1A1A1A",
    lineHeight: 28,
    letterSpacing: 0.2,
    marginBottom: 2,
  },

  subtitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.normal,
    color: "#666666",
    lineHeight: 20,
    letterSpacing: 0.1,
    marginTop: 2,
  },

  // متغيرات العناوين
  defaultTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.semibold,
  },

  largeTitle: {
    fontSize: TYPOGRAPHY["2xl"],
    fontWeight: TYPOGRAPHY.bold,
    lineHeight: 34,
  },

  minimalTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.medium,
  },

  centeredTitle: {
    textAlign: "center",
  },

  compactTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.medium,
  },

  defaultSubtitle: {
    fontSize: TYPOGRAPHY.sm,
  },

  largeSubtitle: {
    fontSize: TYPOGRAPHY.base,
    lineHeight: 22,
  },

  minimalSubtitle: {
    fontSize: TYPOGRAPHY.xs,
    color: "#999999",
  },

  centeredSubtitle: {
    textAlign: "center",
  },

  compactSubtitle: {
    fontSize: TYPOGRAPHY.xs,
    color: "#888888",
  },

  // حاوية الأزرار
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    minWidth: 56,
  },

  actionItem: {
    alignItems: "center",
    justifyContent: "center",
  },

  // التأثيرات البصرية
  elevated: {
    ...createShadowStyle({
      color: "#000",
      offset: { width: 0, height: 2 },
      opacity: 0.1,
      radius: 8,
      elevation: 4,
    }),
  },

  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
});
