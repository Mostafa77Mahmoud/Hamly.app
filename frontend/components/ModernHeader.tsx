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
  useWindowDimensions,
} from "react-native";
import { useIsRTL } from "@/utils/useIsRTL";
import { t } from "@/utils/i18n";
import { COLORS, SPACING, TYPOGRAPHY } from "@/utils/modernStyles";
import { createShadowStyle } from "@/utils/shadowStyles";
import Icon from "react-native-vector-icons/MaterialIcons";
import { responsiveIconSize, responsiveFontSize, scale } from "@/utils/responsive";

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
  const { width } = useWindowDimensions();
  
  // Use runtime window dimensions instead of module-level static value
  const isMobileSize = width < 768;

  // حساب الارتفاع الآمن للـ status bar
  const statusBarHeight =
    Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24;

  // Generate dynamic styles based on current screen size
  const styles = useMemo(() => getStyles(isMobileSize), [isMobileSize]);

  // تحديد أنماط الحاوية الرئيسية
  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        backgroundColor,
        paddingTop: isMobileSize ? Math.min(statusBarHeight, 20) : 0,
      },
      elevation && styles.elevated,
      borderBottom && styles.bordered,
      style,
    ],
    [backgroundColor, statusBarHeight, isMobileSize, elevation, borderBottom, style, styles],
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
          <Icon
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={responsiveIconSize(24)}
            color={textColor}
          />
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
          {leftElement}
        </TouchableOpacity>
      );
    }

    if (showLogo) {
      return (
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/hamly-logo-transparent.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel={t("appLogoAlt")}
          />
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
    styles,
  ]);

  // عنصر الجانب الأيمن
  const rightSection = useMemo(() => {
    // استخدام rightActions أو actions أو rightElement
    const actionsToRender = rightActions || actions;

    if (actionsToRender && actionsToRender.length > 0) {
      return (
        <View style={[
          styles.actionsContainer, 
          contentDirection
        ]}>
          {actionsToRender.map((action, index) => (
            <View key={index} style={styles.actionItem}>
              {action}
            </View>
          ))}
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
          {rightElement}
        </TouchableOpacity>
      );
    }

    return <View style={styles.sideContainer} />;
  }, [rightActions, actions, rightElement, onRightPress, contentDirection, isMobileSize, styles]);

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
        <Text
          style={titleTextStyle}
          numberOfLines={variant === "large" ? 3 : 2}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={subtitleTextStyle}
            numberOfLines={2}
            accessibilityRole="text"
          >
            {subtitle}
          </Text>
        )}
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
    styles,
  ]);

  return (
    <View style={containerStyle}>
      <View style={[styles.content, contentDirection]}>
        {/* الجانب الأيسر في LTR أو الأيمن في RTL */}
        <View style={[styles.sideSection, isRTL && styles.rtlSideSection]}>
          {isRTL ? rightSection : leftSection}
        </View>
        {/* منطقة العنوان */}
        <View style={styles.titleSection}>{titleSection}</View>
        {/* الجانب الأيمن في LTR أو الأيسر في RTL */}
        <View style={[styles.sideSection, isRTL && styles.rtlSideSection]}>
          {isRTL ? leftSection : rightSection}
        </View>
      </View>
    </View>
  );
}

// Function to generate styles based on screen size
function getStyles(isMobileSize: boolean) {
  return StyleSheet.create({

    container: {
      backgroundColor: "#FFFFFF",
      width: "100%",
    },

    content: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: isMobileSize ? 56 : 64,
      paddingHorizontal: isMobileSize ? SPACING.sm : SPACING.md,
      paddingVertical: 0,
      gap: isMobileSize ? SPACING.xs : SPACING.sm,
    },

    // الأقسام الجانبية
    sideSection: {
      minWidth: isMobileSize ? 32 : 40,
      alignItems: "center",
      justifyContent: "center",
    },

    rtlSideSection: {
      alignItems: "center",
    },

    sideContainer: {
      alignItems: "center",
      justifyContent: "center",
      minWidth: isMobileSize ? 28 : 36,
      minHeight: isMobileSize ? 28 : 36,
    },

    sideButton: {
      alignItems: "center",
      justifyContent: "center",
      width: isMobileSize ? 32 : 36,
      height: isMobileSize ? 32 : 36,
      borderRadius: isMobileSize ? 6 : 8,
      backgroundColor: "rgba(0, 0, 0, 0.04)",
    },

    // منطقة الشعار
    logoContainer: {
      width: isMobileSize ? 56 : 72,
      height: isMobileSize ? 56 : 72,
      borderRadius: isMobileSize ? 10 : 12,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },

    logo: {
      width: isMobileSize ? 56 : 72,
      height: isMobileSize ? 56 : 72,
    },

    // منطقة العنوان
    titleSection: {
      flex: 1,
      paddingHorizontal: isMobileSize ? 4 : SPACING.sm,
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
      fontSize: isMobileSize ? responsiveFontSize(15) : responsiveFontSize(18),
      fontWeight: TYPOGRAPHY.semibold,
      color: "#1A1A1A",
      lineHeight: isMobileSize ? responsiveFontSize(20) : responsiveFontSize(26),
      letterSpacing: 0.2,
      marginBottom: isMobileSize ? 0 : 2,
    },

    subtitle: {
      fontSize: isMobileSize ? responsiveFontSize(11) : responsiveFontSize(14),
      fontWeight: TYPOGRAPHY.normal,
      color: "#666666",
      lineHeight: isMobileSize ? responsiveFontSize(14) : responsiveFontSize(18),
      letterSpacing: 0.1,
      marginTop: isMobileSize ? 0 : 2,
    },

    // متغيرات العناوين
    defaultTitle: {
      fontSize: responsiveFontSize(20),
      fontWeight: TYPOGRAPHY.semibold,
    },

    largeTitle: {
      fontSize: responsiveFontSize(24),
      fontWeight: TYPOGRAPHY.bold,
      lineHeight: responsiveFontSize(32),
    },

    minimalTitle: {
      fontSize: responsiveFontSize(18),
      fontWeight: TYPOGRAPHY.medium,
    },

    centeredTitle: {
      textAlign: "center",
    },

    compactTitle: {
      fontSize: responsiveFontSize(16),
      fontWeight: TYPOGRAPHY.medium,
    },

    defaultSubtitle: {
      fontSize: responsiveFontSize(14),
    },

    largeSubtitle: {
      fontSize: responsiveFontSize(16),
      lineHeight: responsiveFontSize(20),
    },

    minimalSubtitle: {
      fontSize: responsiveFontSize(12),
      color: "#999999",
    },

    centeredSubtitle: {
      textAlign: "center",
    },

    compactSubtitle: {
      fontSize: responsiveFontSize(12),
      color: "#888888",
    },

    // حاوية الأزرار
    actionsContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: isMobileSize ? 4 : 6,
      minWidth: isMobileSize ? 40 : 56,
      flexWrap: "nowrap",
    },

    actionItem: {
      alignItems: "center",
      justifyContent: "center",
      width: isMobileSize ? 36 : 40,
      height: isMobileSize ? 36 : 40,
      borderRadius: isMobileSize ? 8 : 10,
      overflow: "hidden",
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
}