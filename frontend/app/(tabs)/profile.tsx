import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { UserProfile, Pregnancy } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/utils/supabase";
import {
  getActivePregnancy,
  getPregnancies,
  createPregnancy,
  updatePregnancy,
  setActivePregnancy,
} from "@/utils/supabaseStorage";
import { t, isRTL } from "@/utils/i18n";
import { useIsRTL } from "@/utils/useIsRTL";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  BORDER_RADIUS,
} from "@/utils/modernStyles";
import { rtlContainerStyles } from "@/utils/rtlStyles";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Input from "@/components/Input";
import LanguageToggle from "@/components/LanguageToggle";
import PregnancySelector from "@/components/PregnancySelector";
import LocalizedHeader from "@/components/LocalizedHeader"; // This import is no longer used, but keeping for now
import ModernHeader from "@/components/ModernHeader"; // New import for the modern header component
import PregnancyStatusCard from "@/components/PregnancyStatusCard";
import PregnancyWeeksDisplay from "@/components/PregnancyWeeksDisplay";
import ScreenTransition from "@/components/ui/ScreenTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";
import Section from "@/components/ui/Section";
import AnimatedButton from "@/components/ui/AnimatedButton";
export default function ProfileScreen() {
  const {
    activePregnancy: contextActivePregnancy,
    loading: dataLoading,
    refreshData,
  } = useData();
  const [localActivePregnancy, setLocalActivePregnancy] =
    useState<Pregnancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPregnancy, setEditingPregnancy] = useState<Pregnancy | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const { signOut, user } = useAuth();
  const isRTLMode = useIsRTL();

  // State for the edit modal form
  const [editForm, setEditForm] = useState({
    name: "",
    pregnancyName: "",
    lastMenstrualPeriod: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Only load if we don't have data from DataContext
    if (!contextActivePregnancy) {
      loadActivePregnancyData();
    } else {
      // We have data from context, no need to load
      setLocalActivePregnancy(contextActivePregnancy); // Ensure local state is synced
      setLoading(false);
    }
  }, [contextActivePregnancy]); // Depend on contextActivePregnancy

  useEffect(() => {
    // Sync with DataContext if it changes
    if (contextActivePregnancy) {
      setLocalActivePregnancy(contextActivePregnancy);
    }
    // Stop loading if DataContext loading is complete, regardless of data availability
    if (!dataLoading) {
      setLoading(false);
    }
  }, [contextActivePregnancy, dataLoading]);

  const loadActivePregnancyData = async () => {
    // Only set loading if we don't have data from DataContext and DataContext is still loading
    if (!contextActivePregnancy && dataLoading) {
      setLoading(true);
    } else if (!contextActivePregnancy && !dataLoading) {
      setLoading(false); // If context has no data and is done loading, then we are not loading
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log("No authenticated user, skipping pregnancy data load");
        setLocalActivePregnancy(null);
        setLoading(false); // Ensure loading stops if no user
        return;
      }

      const activePreg = await getActivePregnancy();
      if (activePreg) {
        const formattedActive = {
          id: activePreg.id,
          name: activePreg.name,
          lastMenstrualPeriod: activePreg.last_menstrual_period,
          dueDate: activePreg.due_date,
          isActive: activePreg.is_active,
          createdAt: activePreg.created_at,
          notes: activePreg.notes || undefined,
        };
        setLocalActivePregnancy(formattedActive);
        console.log(
          "Active pregnancy loaded successfully:",
          formattedActive.name,
        );
      } else {
        console.log("No active pregnancy found");
        setLocalActivePregnancy(null);
      }
    } catch (error) {
      console.error("Error loading active pregnancy:", error);
      // Don't set to null if we have data from context
      if (!contextActivePregnancy) {
        setLocalActivePregnancy(null);
      }
    } finally {
      setLoading(false); // Ensure loading stops in all cases
    }
  };

  const handlePregnancyChange = (pregnancy: Pregnancy | null) => {
    setLocalActivePregnancy(pregnancy);
    // If DataContext provides updated pregnancy, it will be reflected in contextActivePregnancy
    // and the useEffect hook will sync it
  };

  const openEditModal = () => {
    if (localActivePregnancy) {
      setEditingPregnancy({ ...localActivePregnancy });
      // Initialize editForm state from localActivePregnancy
      setEditForm({
        name: localActivePregnancy.name || "",
        pregnancyName: localActivePregnancy.name || "", // Assuming pregnancyName should also be pre-filled
        lastMenstrualPeriod: localActivePregnancy.lastMenstrualPeriod || "",
        notes: localActivePregnancy.notes || "",
      });
      setEditModalVisible(true);
    } else {
      // If no active pregnancy, maybe offer to create one
      Alert.alert(
        t("info"),
        "No active pregnancy to edit. You can add a new one.",
      );
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Use computed pregnancy details from DataContext for consistency
  const pregnancyDetails = useMemo(() => {
    // Use contextActivePregnancy which has computed gestational age from DataContext
    const pregnancyData = contextActivePregnancy || localActivePregnancy;

    if (!pregnancyData?.gestationalAge) {
      // Return default values if no computed gestation data available
      return {
        currentWeek: 0,
        currentDay: 0,
        trimester: 1,
        progress: 0,
        dueDate: null,
        daysRemaining: 0,
        isOverdue: false,
        lmpDate: null,
        totalDays: 0,
      };
    }

    try {
      const { gestationalAge, trimester = 1, computedDueDate } = pregnancyData;

      // Calculate due date and days remaining
      const dueDate = computedDueDate ? new Date(computedDueDate) : null;
      let daysRemaining = 0;
      let isOverdue = false;

      if (dueDate) {
        const today = new Date();
        const timeDiff = dueDate.getTime() - today.getTime();
        daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        isOverdue = daysRemaining < 0;
      }

      const lmpDate = pregnancyData.lastMenstrualPeriod
        ? new Date(pregnancyData.lastMenstrualPeriod)
        : null;

      return {
        currentWeek: gestationalAge.weeks || 0,
        currentDay: gestationalAge.remainderDays || 0,
        trimester,
        progress: gestationalAge.progressPct || 0,
        dueDate,
        daysRemaining,
        isOverdue,
        lmpDate,
        totalDays: gestationalAge.days || 0,
      };
    } catch (error) {
      console.warn("Error processing computed pregnancy data:", error);
      return {
        currentWeek: 0,
        currentDay: 0,
        trimester: 1,
        progress: 0,
        dueDate: null,
        daysRemaining: 0,
        isOverdue: false,
        lmpDate: null,
        totalDays: 0,
      };
    }
  }, [contextActivePregnancy, localActivePregnancy]);

  // Remove duplicate calculation - use computed values from DataContext only
  const getGestationalAge = () => {
    // Return computed gestational age from context data
    const pregnancyData = contextActivePregnancy || localActivePregnancy;
    return pregnancyData?.gestationalAge || null;
  };

  const getDaysUntilDue = () => {
    // This function is also captured in pregnancyDetails.daysRemaining
    return pregnancyDetails.daysRemaining;
  };

  const getCurrentTrimester = () => {
    // This is captured in pregnancyDetails.trimester
    return pregnancyDetails.trimester;
  };

  const handleForceRefresh = async () => {
    console.log("🔄 User initiated force fresh refresh");
    await refreshData(); // Force fresh refresh
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t("loading")}...</Text>
          {dataLoading && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleForceRefresh}
            >
              <Icon name="refresh" size={20} color="#E91E63" />
              <Text style={styles.retryButtonText}>
                {isRTLMode ? "إعادة المحاولة" : "Retry"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Use values from pregnancyDetails
  const gestationalAge = getGestationalAge(); // Still useful if calculateGestationalAge provides more than weeks/days
  const daysUntilDue = getDaysUntilDue();
  const currentTrimester = getCurrentTrimester();

  // Helper to format dates for display with Gregorian calendar
  const formatDate = (date: Date | null) => {
    if (!date) return isRTLMode ? "غير محدد" : "Not specified";

    // Always use Gregorian calendar with en-GB locale for consistent DD/MM/YYYY format
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Function to handle the save action for the edit modal
  const handleSave = async () => {
    // Basic validation for name
    if (!editForm.pregnancyName.trim()) {
      Alert.alert(t("error"), "اسم الحمل مطلوب");
      return;
    }

    // Basic validation for LMP date
    if (!editForm.lastMenstrualPeriod) {
      Alert.alert(t("error"), "يرجى تحديد تاريخ آخر دورة شهرية");
      return;
    }

    // Validate LMP date format
    const lmpDate = new Date(editForm.lastMenstrualPeriod);
    if (isNaN(lmpDate.getTime())) {
      Alert.alert(t("error"), "تاريخ آخر دورة شهرية غير صالح");
      return;
    }

    // Check if LMP is not in the future
    const today = new Date();
    // Normalize dates to midnight for comparison to avoid timezone issues
    const lmpMidnight = new Date(
      lmpDate.getFullYear(),
      lmpDate.getMonth(),
      lmpDate.getDate(),
    );
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    if (lmpMidnight > todayMidnight) {
      Alert.alert(
        t("error"),
        "تاريخ آخر دورة شهرية لا يمكن أن يكون في المستقبل",
      );
      return;
    }

    // Check if LMP is not more than 11 months ago (reasonable pregnancy limit)
    const elevenMonthsAgo = new Date(todayMidnight);
    elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);
    if (lmpMidnight < elevenMonthsAgo) {
      Alert.alert(
        t("error"),
        "تاريخ آخر دورة شهرية قديم جداً (أكثر من 11 شهر)",
      );
      return;
    }

    setSaving(true);
    try {
      // Assuming updateProfile is a function that updates user profile info if any
      // If not, this part might need adjustment or removal
      // const updatedProfile = {
      //   name: editForm.name.trim(), // Assuming 'name' in editForm is for user profile name
      // };
      // await updateProfile(updatedProfile);

      const updatedPregnancyData = {
        name: editForm.pregnancyName.trim(),
        last_menstrual_period: editForm.lastMenstrualPeriod, // This should be the validated and formatted date string
        notes: editForm.notes?.trim() || null,
      };

      console.log("Saving pregnancy data:", updatedPregnancyData);

      // Update active pregnancy in the database
      if (localActivePregnancy?.id) {
        await updatePregnancy(localActivePregnancy.id, updatedPregnancyData);
        Alert.alert(t("success"), "تم حفظ معلومات الحمل بنجاح");
        // Refresh local state or refetch data after successful save
        // refreshData(); // Assuming refreshData() reloads all context data
        // Manually update localActivePregnancy to reflect changes immediately
        // Update local state with both snake_case (for database) and camelCase (for UI) fields
        const updatedLocalState = {
          ...localActivePregnancy,
          name: updatedPregnancyData.name,
          lastMenstrualPeriod: updatedPregnancyData.last_menstrual_period,
          last_menstrual_period: updatedPregnancyData.last_menstrual_period,
          notes: updatedPregnancyData.notes || undefined,
          // Recompute derived fields
          dueDate: (() => {
            const lmp = new Date(updatedPregnancyData.last_menstrual_period);
            const due = new Date(lmp);
            due.setDate(due.getDate() + 280); // 40 weeks
            return due.toISOString().split("T")[0];
          })(),
          current_week: (() => {
            const lmp = new Date(updatedPregnancyData.last_menstrual_period);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - lmp.getTime());
            const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
            return Math.min(diffWeeks, 42);
          })(),
        };
        setLocalActivePregnancy(updatedLocalState);
        setEditingPregnancy(null); // Clear editing state
        setEditModalVisible(false); // Close modal
      } else {
        // Handle case where there's no active pregnancy to update (e.g., create new)
        // For now, just show an error if no ID is found
        Alert.alert(t("error"), "لم يتم العثور على حمل نشط للتحديث.");
      }
    } catch (error) {
      console.error("Error saving pregnancy:", error);
      Alert.alert(t("error"), "فشل في حفظ التغييرات. يرجى المحاولة مرة أخرى.");
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = () => {
    // Force re-render to update all text
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <SafeAreaView key={refreshKey} style={styles.container}>
      <ModernHeader
        title={t("profileTitle")}
        subtitle={t("profileSubtitle")}
        showLogo={true}
        variant="large"
        elevation={true}
        backgroundColor="#FFFFFF"
        textColor="#1A1A1A"
        rightActions={[
          <LanguageToggle
            key="languageToggle"
            onLanguageChange={handleLanguageChange}
          />,
          <TouchableOpacity
            key="signOut"
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>,
          // Conditionally show edit button only if there's an active pregnancy
          ...(localActivePregnancy
            ? [
                <TouchableOpacity
                  key="edit"
                  style={styles.editButton}
                  onPress={openEditModal}
                >
                  <Icon name="edit" size={20} color="#FFFFFF" />
                </TouchableOpacity>,
              ]
            : []),
        ]}
      />
      <ScreenTransition>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <PregnancySelector onPregnancyChange={handlePregnancyChange} />
          {localActivePregnancy && pregnancyDetails.currentWeek > 0 ? (
            <>
              <PregnancyStatusCard
                currentWeek={pregnancyDetails.currentWeek}
                currentDay={pregnancyDetails.currentDay}
                trimester={pregnancyDetails.trimester}
                progress={pregnancyDetails.progress}
                dueDate={pregnancyDetails.dueDate}
                daysRemaining={pregnancyDetails.daysRemaining}
                isOverdue={pregnancyDetails.isOverdue}
                language={isRTL() ? "ar" : "en"}
              />
              <PregnancyWeeksDisplay
                currentWeek={pregnancyDetails.currentWeek}
                language={isRTL() ? "ar" : "en"}
              />
            </>
          ) : (
            <AnimatedCard delay={100}>
              <View style={styles.noPregnancyState}>
                <Icon
                  name="info-outline"
                  size={48}
                  color={COLORS.textDisabled}
                />
                <Text
                  style={[
                    styles.noPregnancyTitle,
                    isRTLMode ? styles.rtlHeaderText : styles.ltrHeaderText,
                  ]}
                >
                  {t("noActivePregnancy")}
                </Text>
                <Text
                  style={[
                    styles.noPregnancyText,
                    isRTLMode ? styles.rtlHeaderText : styles.ltrHeaderText,
                  ]}
                >
                  {t("addFirstPregnancy")}
                </Text>
                <AnimatedButton
                  title={t("addPregnancy")}
                  onPress={() => {
                    /* Navigate to add pregnancy screen or open modal */
                  }}
                  style={{ marginTop: SPACING.lg }}
                />
              </View>
            </AnimatedCard>
          )}
          {/* Moved Details Card outside the conditional rendering for localActivePregnancy */}
          {localActivePregnancy ? (
            <Card style={profileCardStyles.detailsCard}>
              <Text style={profileCardStyles.detailsTitle}>
                {t("pregnancyDetails")}
              </Text>
              <View style={profileCardStyles.detailsGrid}>
                <View style={profileCardStyles.detailItem}>
                  <View
                    style={[
                      profileCardStyles.detailLabelRow,
                      { flexDirection: isRTLMode ? "row-reverse" : "row" },
                    ]}
                  >
                    <Icon
                      name="access-time"
                      size={16}
                      color={COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        profileCardStyles.detailLabel,
                        {
                          marginLeft: isRTLMode ? 0 : SPACING.xs,
                          marginRight: isRTLMode ? SPACING.xs : 0,
                          textAlign: isRTLMode ? "right" : "left",
                          writingDirection: isRTLMode ? "rtl" : "ltr",
                        },
                      ]}
                    >
                      {t("currentWeek")}
                    </Text>
                  </View>
                  <Text
                    style={[
                      profileCardStyles.detailValue,
                      {
                        textAlign: isRTLMode ? "right" : "left",
                        writingDirection: isRTLMode ? "rtl" : "ltr",
                      },
                    ]}
                  >
                    {pregnancyDetails.currentWeek > 0
                      ? `${pregnancyDetails.currentWeek} ${t("weeks")}`
                      : isRTLMode
                        ? "غير محسوب"
                        : "Not calculated"}
                  </Text>
                </View>
                <View style={profileCardStyles.detailItem}>
                  <View
                    style={[
                      profileCardStyles.detailLabelRow,
                      { flexDirection: isRTLMode ? "row-reverse" : "row" },
                    ]}
                  >
                    <Icon
                      name="timeline"
                      size={16}
                      color={COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        profileCardStyles.detailLabel,
                        {
                          marginLeft: isRTLMode ? 0 : SPACING.xs,
                          marginRight: isRTLMode ? SPACING.xs : 0,
                          textAlign: isRTLMode ? "right" : "left",
                          writingDirection: isRTLMode ? "rtl" : "ltr",
                        },
                      ]}
                    >
                      {t("currentTrimester")}
                    </Text>
                  </View>
                  <Text
                    style={[
                      profileCardStyles.detailValue,
                      {
                        textAlign: isRTLMode ? "right" : "left",
                        writingDirection: isRTLMode ? "rtl" : "ltr",
                      },
                    ]}
                  >
                    {pregnancyDetails.trimester === 1
                      ? t("trimester1")
                      : pregnancyDetails.trimester === 2
                        ? t("trimester2")
                        : t("trimester3")}
                  </Text>
                </View>
                <View style={profileCardStyles.detailItem}>
                  <View
                    style={[
                      profileCardStyles.detailLabelRow,
                      { flexDirection: isRTLMode ? "row-reverse" : "row" },
                    ]}
                  >
                    <Icon
                      name="event-note"
                      size={16}
                      color={COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        profileCardStyles.detailLabel,
                        {
                          marginLeft: isRTLMode ? 0 : SPACING.xs,
                          marginRight: isRTLMode ? SPACING.xs : 0,
                          textAlign: isRTLMode ? "right" : "left",
                          writingDirection: isRTLMode ? "rtl" : "ltr",
                        },
                      ]}
                    >
                      {t("lastMenstrualPeriod")}
                    </Text>
                  </View>
                  <Text
                    style={[
                      profileCardStyles.detailValue,
                      {
                        textAlign: isRTLMode ? "right" : "left",
                        writingDirection: isRTLMode ? "rtl" : "ltr",
                      },
                    ]}
                  >
                    {pregnancyDetails.lmpDate
                      ? formatDate(pregnancyDetails.lmpDate)
                      : isRTLMode
                        ? "غير محسوب"
                        : "Not calculated"}
                  </Text>
                </View>
              </View>
            </Card>
          ) : null}
          <View style={styles.footer}>
            <Text
              style={[
                styles.footerText,
                isRTLMode ? styles.rtlHeaderText : styles.ltrHeaderText,
              ]}
            >
              {t("consultDisclaimer")}
            </Text>
          </View>
        </ScrollView>
      </ScreenTransition>
      <View style={styles.userInfo}>
        <Text
          style={[
            styles.userEmail,
            isRTLMode ? styles.rtlHeaderText : styles.ltrHeaderText,
          ]}
        >
          {user?.email}
        </Text>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  isRTLMode ? styles.rtlHeaderText : styles.ltrHeaderText,
                ]}
              >
                {t("editPregnancy")}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Input
                label={t("pregnancyName")}
                value={editForm.pregnancyName}
                onChangeText={(text) =>
                  setEditForm((prev) => ({ ...prev, pregnancyName: text }))
                }
                placeholder={t("pregnancyNamePlaceholder")}
                required
              />
              <Input
                label={t("lmp")}
                value={editForm.lastMenstrualPeriod}
                onChangeText={(text) =>
                  setEditForm((prev) => ({
                    ...prev,
                    lastMenstrualPeriod: text,
                  }))
                }
                placeholder="YYYY-MM-DD"
                required
              />
              <Input
                label={t("notes")}
                value={editForm.notes}
                onChangeText={(text) =>
                  setEditForm((prev) => ({ ...prev, notes: text }))
                }
                placeholder={t("pregnancyNotesPlaceholder")}
                multiline
              />
              <View style={styles.infoBox}>
                <Icon name="event" size={16} color="#E91E63" />
                <Text style={styles.infoText}>{t("dueDateCalculation")}</Text>
              </View>
            </ScrollView>
            <View
              style={[
                styles.modalFooter,
                isRTLMode ? styles.rtlModalFooter : styles.ltrModalFooter,
              ]}
            >
              <Button
                title={t("cancel")}
                onPress={() => setEditModalVisible(false)}
                variant="outlined"
                style={{ flex: 1, marginRight: SPACING.xs }}
              />
              <Button
                title={t("saveChanges")}
                onPress={handleSave}
                style={{ flex: 1, marginLeft: SPACING.xs }}
                loading={saving} // Show loading indicator while saving
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerContent: {
    flexDirection: isRTL() ? "row-reverse" : "row",
    alignItems: "center",
    flex: 1,
  },
  headerActions: {
    flexDirection: isRTL() ? "row-reverse" : "row",
    alignItems: "center",
    gap: 8,
  },
  signOutButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signOutText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter-Bold",
    color: "#333333",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#666666",
    marginTop: 4,
  },
  rtlHeaderText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  ltrHeaderText: {
    textAlign: "left",
    writingDirection: "ltr",
  },
  editButton: {
    backgroundColor: "#E91E63",
    borderRadius: 12,
    padding: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 20,
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#666666",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFE6F0",
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    color: "#E91E63",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#FF6B6B",
  },
  noPregnancyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noPregnancyTitle: {
    fontSize: 20,
    fontFamily: "Inter-SemiBold",
    color: "#333333",
    marginBottom: 8,
    textAlign: "center",
  },
  noPregnancyText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
  },
  // Hero card styles are now in profileCardStyles
  // pregnancyCard: ,
  // cardHeader: ,
  // pregnancyIcon: ,
  // headerContent: ,
  // cardTitle: ,
  // cardSubtitle: ,
  // progressSection: ,
  // progressLabel: ,
  // progressBar: ,
  // progressFill: ,
  // progressText: ,
  // detailsSection: ,
  // detailRow: ,
  // detailLabel: ,
  // detailValue: ,
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#999999",
    textAlign: "center",
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter-SemiBold",
    color: "#333333",
  },
  modalBody: {
    padding: 20,
    // maxHeight: 300, // Removed to allow scroll view to manage height
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#E8F5E8",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#2E7D32",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  rtlModalFooter: {
    flexDirection: "row-reverse",
  },
  ltrModalFooter: {
    flexDirection: "row",
  },
  userInfo: {
    padding: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  userEmail: {
    fontSize: 14,
    color: "#666666",
    fontFamily: "Inter-Regular",
  },
  // Added styles from changes
  pregnancyCard: {
    // This style was present in the original changes but not defined in the original styles
    // Assuming it should be part of the main styles or removed if profileCardStyles is preferred
    // For now, keeping it minimal as it seems to be replaced by Card component usage
    marginBottom: SPACING.lg,
    backgroundColor: "#FFFFFF",
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lg * TYPOGRAPHY.lineHeightNormal,
  },
  cardSubtitle: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: "Inter-Regular",
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  progressSection: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.sm,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
  },
  progressText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textPrimary,
  },
  detailsSection: {
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.medium,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.semibold,
    lineHeight: TYPOGRAPHY.md * TYPOGRAPHY.lineHeightNormal,
  },
  emptyStateSection: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    margin: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#666666",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  setupButton: {
    backgroundColor: "#E91E63",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setupButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
  },
});

// Profile Card Styles using Design System
const profileCardStyles = StyleSheet.create({
  heroCard: {
    marginBottom: SPACING.lg,
  },

  pregnancyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },

  pregnancyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
    ...SHADOWS.sm,
  },

  pregnancyInfo: {
    flex: 1,
  },

  pregnancyName: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    lineHeight: TYPOGRAPHY.xl * TYPOGRAPHY.lineHeightNormal,
  },

  dueDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },

  dueDateText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.medium,
  },

  gestationalRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  gestationalText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.medium,
  },

  progressSection: {
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },

  progressTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
  },

  daysUntilDueContainer: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },

  daysUntilDueText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.primary,
  },

  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },

  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.sm,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
  },

  progressPercentage: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textPrimary,
    minWidth: 40,
  },

  trimesterIndicators: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  trimesterText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textDisabled,
    fontWeight: TYPOGRAPHY.medium,
  },

  detailsCard: {
    marginBottom: SPACING.lg,
  },

  detailsTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },

  detailsGrid: {
    gap: SPACING.lg,
  },

  detailItem: {
    gap: SPACING.xs,
  },

  detailLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  detailLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.medium,
  },

  detailValue: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.semibold,
    lineHeight: TYPOGRAPHY.md * TYPOGRAPHY.lineHeightNormal,
  },
});
