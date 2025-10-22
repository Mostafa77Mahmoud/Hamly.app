import React, { useState, useEffect, useRef, useMemo } from "react";
import { Tabs, useRouter } from "expo-router";
import Icon from "react-native-vector-icons/MaterialIcons";
import { t, addLanguageChangeListener, isRTL } from "@/utils/i18n";
import AuthGuard from "@/components/AuthGuard";
import { View, Text, Platform, StyleSheet, ViewStyle } from "react-native";
import { useData } from "@/contexts/DataContext";
import { useIsRTL } from "@/utils/useIsRTL";
import { TYPOGRAPHY } from "@/utils/modernStyles";
import { createShadowStyle } from "@/utils/shadowStyles";

interface TabConfig {
  name: string;
  title: string;
  iconName: string;
  color: string;
}

export default function TabLayout() {
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();
  const { refreshData } = useData();
  const currentIsRTL = useIsRTL();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTabRef = useRef<string | null>(null);

  // Memoized tab configurations - unified pink accent color
  const tabConfigs = useMemo<TabConfig[]>(
    () => [
      {
        name: "lab-results",
        title: t("labResults"),
        iconName: "assessment",
        color: "#D81B60",
      },
      {
        name: "medications",
        title: t("medications"),
        iconName: "medication", // Fixed: use valid icon name
        color: "#D81B60",
      },
      {
        name: "health",
        title: t("healthCheck"),
        iconName: "favorite", // Changed from 'health_and_safety'
        color: "#D81B60",
      },
      {
        name: "profile",
        title: t("profile"),
        iconName: "person", // Changed from 'account_circle'
        color: "#D81B60",
      },
    ],
    [refreshKey],
  );

  // Tab bar styling based on language direction
  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: "#FFFFFF",
      borderTopWidth: 0,
      paddingBottom: Platform.OS === "ios" ? 24 : 12,
      paddingTop: 16,
      height: Platform.OS === "ios" ? 90 : 75,
      ...createShadowStyle({
        color: "#000",
        offset: { width: 0, height: -4 },
        opacity: 0.15,
        radius: 12,
        elevation: 12,
      }),
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    }),
    [],
  );

  const tabBarLabelStyle = useMemo(
    () => ({
      fontFamily: "System",
      fontWeight: "600" as "600",
      fontSize: 12,
      marginTop: 6,
      textAlign: "center" as const,
      writingDirection: (currentIsRTL ? "rtl" : "ltr") as "rtl" | "ltr",
      letterSpacing: 0.1,
    }),
    [currentIsRTL],
  );

  useEffect(() => {
    const unsubscribe = addLanguageChangeListener(() => {
      setRefreshKey((prev) => prev + 1);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      if (
        args[0]?.includes?.("GO_BACK") ||
        args[0]?.includes?.("not handled by any navigator")
      ) {
        return;
      }
      originalConsoleWarn(...args);
    };

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleTabPress = async (tabName: string) => {
    console.log(`📂 Tab pressed: ${tabName}`);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (tabName && lastTabRef.current !== tabName) {
      console.log("🔄 Starting debounced data load...");
      lastTabRef.current = tabName;

      debounceRef.current = setTimeout(async () => {
        try {
          await refreshData();
          console.log("✅ Tab data refresh completed for:", tabName);
        } catch (error) {
          console.warn("Tab navigation refresh failed:", error);
        }
      }, 200);
    }
  };

  const renderTabIcon =
    (config: TabConfig) =>
    ({ color, size, focused }: any) => (
      <View style={styles.iconContainer}>
        <Icon
          name={config.iconName}
          color={focused ? config.color : "#9E9E9E"}
          size={focused ? size + 2 : size}
          style={[
            styles.icon,
            focused && styles.iconFocused,
            currentIsRTL && styles.iconRTL,
          ]}
        />
        {focused && (
          <View
            style={[styles.activeIndicator, { backgroundColor: config.color }]}
          />
        )}
      </View>
    );

  return (
    <AuthGuard>
      <Tabs
        key={`tabs-${refreshKey}-${currentIsRTL ? "rtl" : "ltr"}`}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#D81B60",
          tabBarInactiveTintColor: "#999999",
          tabBarStyle: tabBarStyle,
          tabBarLabelStyle: tabBarLabelStyle,
          tabBarItemStyle: {
            paddingVertical: 6,
            marginHorizontal: 4,
            borderRadius: 12,
          },
          tabBarAllowFontScaling: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        {tabConfigs.map((config) => (
          <Tabs.Screen
            key={config.name}
            name={config.name}
            options={{
              title: config.title,
              tabBarIcon: renderTabIcon(config),
            }}
            listeners={{
              tabPress: () => handleTabPress(config.name),
            }}
          />
        ))}
      </Tabs>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
  },

  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: 32,
    height: 32,
  } as ViewStyle,

  icon: {
    textAlign: "center",
  },

  iconFocused: {
    transform: [{ scale: 1.1 }],
  },

  iconRTL: {
    // RTL-specific icon adjustments if needed
  },

  activeIndicator: {
    position: "absolute",
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
