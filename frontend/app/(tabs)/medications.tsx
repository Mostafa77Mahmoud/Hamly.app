import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  TextStyle,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Medication } from "@/types";
import {
  createMedication,
  deleteMedication as deleteSupabaseMedication,
  logMedicationAdherence,
} from "@/utils/supabaseStorage";
import {
  getMedicationSafetyInfo,
  calculateGestationalAge,
  getLabReports,
} from "@/utils/pregnancy";
import {
  t,
  addLanguageChangeListener,
  isRTL,
  getCurrentLanguage,
} from "@/utils/i18n";
import {
  rtlTextStyles,
  rtlContainerStyles,
  rtlSpacingStyles,
  getDirectionalIcon,
} from "@/utils/rtlStyles";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SHADOWS,
  COMPONENT_STYLES,
  useLocalizedStyles,
  getSafetyStyles,
} from "@/utils/modernStyles";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { generateTraceId, logTrace } from "@/utils/errorHandling";
import LanguageToggle from "@/components/LanguageToggle";
import ModernHeader from "@/components/ModernHeader";
import LocalizedRow from "@/components/LocalizedRow";
import { clearCache, CACHE_KEYS } from "@/utils/cacheManager";
import { persistentWriteQueue } from "@/utils/persistentWriteQueue";
import { getApiUrl, safeFetch, isBackendAvailable, createAuthHeaders, createFetchOptions } from "@/utils/apiConfig";

export default function MedicationsScreen() {
  const {
    medications: contextMedications,
    activePregnancy,
    refreshMedications,
    refreshData,
    loading: contextLoading,
    dataLoaded,
    setWriting, // دالة للحماية من المقاطعة
  } = useData();

  const [medications, setMedications] = useState<Medication[]>([]);

  const { session } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    frequency: "",
    fdaCategory: "B" as const,
    notes: "",
  });

  // حالات إضافة الدواء
  const [isAddingMedication, setIsAddingMedication] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("");

  // Sync medications from context and remove duplicates
  useEffect(() => {
    if (contextMedications && contextMedications.length > 0) {
      // Remove duplicates by ID first, then by name
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();
      const uniqueMedications: Medication[] = [];

      // Sort by created time descending (newest first)
      const sorted = [...contextMedications].sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      for (const med of sorted) {
        const normalizedName = med.name.toLowerCase().trim();

        if (seenIds.has(med.id) || seenNames.has(normalizedName)) {
          continue;
        }

        seenIds.add(med.id);
        seenNames.add(normalizedName);
        uniqueMedications.push(med);
      }

      console.log(
        `✅ Set ${uniqueMedications.length} unique medications (filtered from ${contextMedications.length})`,
      );
      setMedications(uniqueMedications);
    } else {
      setMedications([]);
    }
  }, [contextMedications]);

  // Refresh medications data when screen is focused
  useEffect(() => {
    if (dataLoaded && contextMedications.length === 0 && !contextLoading) {
      console.log("No medications found, refreshing from Supabase...");
      setTimeout(() => refreshMedications(), 500);
    }
  }, [
    dataLoaded,
    contextMedications.length,
    refreshMedications,
    contextLoading,
  ]);

  const deleteMedication = async (medicationId: string) => {
    const medication = medications.find((med) => med.id === medicationId);
    if (!medication) return;

    setDeletingId(medicationId);
    try {
      await deleteSupabaseMedication(medicationId);

      // تحديث فوري للـ UI
      setMedications((prev) => prev.filter((med) => med.id !== medicationId));

      if (Platform.OS !== "web") {
        LayoutAnimation.easeInEaseOut();
      }

      // تحديث البيانات من Supabase
      setTimeout(() => refreshMedications(), 500);
    } catch (error) {
      console.error("Error deleting medication from Supabase:", error);
      Alert.alert("Error", "Failed to delete medication. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // Helper function to analyze medication safety with AI
  const analyzeMedicationSafety = async (medicationName: string) => {
    const traceId = generateTraceId("medication_analysis");
    logTrace(traceId, "analysis-start", { medicationName });

    let pregnancyWeek = 0;
    try {
      if (activePregnancy?.lastMenstrualPeriod) {
        const gestationalAge = calculateGestationalAge(
          activePregnancy.lastMenstrualPeriod,
        );
        pregnancyWeek = gestationalAge.weeks || 0;
      }
    } catch {}

    try {
      // Check if SessionManager is busy with resume
      const { sessionManager } = await import("@/services/session/sessionManager");
      const maxWaitTime = 5000; // 5 seconds max wait
      const startWaitTime = Date.now();

      while ((sessionManager as any).globalRefreshLock) {
        if (Date.now() - startWaitTime > maxWaitTime) {
          console.warn(`[${traceId}] ⏰ Proceeding with AI analysis despite global lock`);
          break;
        }
        console.log(`[${traceId}] ⏳ Waiting for global refresh lock before AI analysis...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log("Starting AI analysis for medication:", medicationName);

      console.log('📊 Medication analysis context:', {
          medicationsCount: medications?.length || 0,
          hasActivePregnancy: !!activePregnancy,
          pregnancyWeek,
          userId: session?.user?.id
        });

        // Don't send context from frontend - let backend fetch it fresh
        console.log('🔄 Letting backend fetch fresh context from database for userId:', session?.user?.id);

        const apiUrl = getApiUrl('medicationSafety');
        const requestPayload = {
          medicationName,
          // Send only userId - backend will fetch everything else from database
          userId: session?.user?.id,
          language: getCurrentLanguage(),
          requestId: traceId,
          timestamp: new Date().toISOString(),
        };

      // Check if backend is available
      if (!isBackendAvailable()) {
        console.log("⚠️ [MEDICATION] Backend not available - using basic safety info");
        const basicInfo = getMedicationSafetyInfo(medicationName);
        return {
          safetyAnalysis: basicInfo?.safetyInfo || "لا توجد معلومات تفصيلية متاحة حالياً. يرجى استشارة الطبيب.",
          fdaCategory: basicInfo?.fdaCategory || "C",
          risks: basicInfo?.risks || [],
          benefits: basicInfo?.benefits || [],
          recommendations: ["يرجى استشارة الطبيب قبل تناول هذا الدواء"],
          isBasicInfo: true,
        };
      }

      console.log("🚀 [MEDICATION] Sending request to:", apiUrl);
      console.log("📦 [MEDICATION] Payload:", JSON.stringify(requestPayload).substring(0, 200));
      console.log("🔐 [MEDICATION] Has auth token:", !!session?.access_token);

      // Use safe fetch with timeout for AI analysis (30 seconds)
      const response = await Promise.race([
        safeFetch(apiUrl, {
          method: "POST",
          headers: createAuthHeaders(session?.access_token),
          body: JSON.stringify(requestPayload),
        }),
        new Promise<Response | null>((_, reject) =>
          setTimeout(
            () => reject(new Error("AI analysis timeout after 30 seconds")),
            30000,
          ),
        ),
      ]);

      // If backend not available or request failed, use basic info
      if (!response) {
        console.log("⚠️ [MEDICATION] API call failed - using basic safety info");
        const basicInfo = getMedicationSafetyInfo(medicationName);
        return {
          safetyAnalysis: basicInfo?.safetyInfo || "لا توجد معلومات تفصيلية متاحة حالياً. يرجى استشارة الطبيب.",
          fdaCategory: basicInfo?.fdaCategory || "C",
          risks: basicInfo?.risks || [],
          benefits: basicInfo?.benefits || [],
          recommendations: ["يرجى استشارة الطبيب قبل تناول هذا الدواء"],
          isBasicInfo: true,
        };
      }

      console.log("📡 [MEDICATION] Response status:", response.status);

      if (!response.ok) {
        let msg = `HTTP error: ${response.status}`;
        try {
          const e = await response.json();
          console.error("❌ [MEDICATION] Error response:", e);
          msg = e?.error || msg;
        } catch {}
        throw new Error(msg);
      }

      const result = await response.json();
      console.log("✅ [MEDICATION] Success! Result keys:", Object.keys(result));
      logTrace(traceId, "analysis-success", {
        hasAnalysis: !!(
          result?.safetyAnalysis ||
          result?.benefits ||
          result?.risks
        ),
      });
      return result;
    } catch (error: unknown) {
      logTrace(traceId, "analysis-failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      console.error("❌ AI analysis failed:", error);
      throw error;
    }
  };

  const addMedication = async () => {
    const operationId = `add_med_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    console.log(`[${operationId}] 🚀 Starting addMedication process`);

    if (!newMedication.name) {
      console.log(`[${operationId}] ⚠️ No medication name provided`);
      Alert.alert("خطأ", "يرجى إدخال اسم الدواء");
      return;
    }

    if (!session?.user) {
      console.log(`[${operationId}] ⚠️ No user session`);
      Alert.alert("خطأ", "المستخدم غير مسجل الدخول");
      return;
    }

    try {
      console.log(`[${operationId}] 🔒 Setting write operation flags`);
      setIsAddingMedication(true);
      setAnalysisStatus("جاري إعداد الدواء...");
      setWriting(true);

      const traceId = generateTraceId("medication_add");
      logTrace(traceId, "save-start", { name: newMedication.name });

      console.log(`[${operationId}] 🔄 Starting medication analysis...`);

      let analysisResult: any = null;
      try {
        setAnalysisStatus("جاري التحليل باستخدام الذكاء الاصطناعي...");
        const analysisStartTime = Date.now();
        analysisResult = await analyzeMedicationSafety(newMedication.name);
        const analysisTime = Date.now() - analysisStartTime;
        console.log(`[${operationId}] ✅ AI analysis completed in ${analysisTime}ms`);
      } catch (analysisError) {
        console.error(`[${operationId}] ❌ AI analysis failed:`, {
          error: analysisError instanceof Error ? analysisError.message : String(analysisError),
          stack: analysisError instanceof Error ? analysisError.stack : undefined
        });
        setAnalysisStatus("التحليل فشل، سيتم الحفظ بدون تحليل AI...");
      }

      console.log(`[${operationId}] 💾 Preparing medication payload...`);
      setAnalysisStatus("جاري الحفظ...");

      const payload = {
        user_id: session.user.id,
        pregnancy_id: activePregnancy?.id || null,
        name: newMedication.name,
        dosage: newMedication.dosage || "Not specified",
        frequency: newMedication.frequency || "As needed",
        prescribed_date: new Date().toISOString().split("T")[0],
        end_date: null,
        fda_category: (analysisResult?.fdaCategory || "B") as
          | "A"
          | "B"
          | "C"
          | "D"
          | "X",
        fda_category_ai: analysisResult?.fdaCategory || null,
        notes: newMedication.notes || null,
        llm_safety_analysis: analysisResult?.safetyAnalysis || null,
        llm_benefits: analysisResult?.benefits || null,
        llm_risks: analysisResult?.risks || null,
        overall_safety: analysisResult?.overallSafety || null,
      };

      console.log(`[${operationId}] 📤 Enqueuing medication to write queue...`);
      const localId = await persistentWriteQueue.enqueue(
        'medication',
        payload,
        session.user.id
      );

      console.log(`[${operationId}] ✅ Medication enqueued with localId: ${localId}`);
      logTrace(traceId, "queued-success", { localId });

      const tempMedication: Medication = {
        id: localId,
        name: newMedication.name,
        dosage: newMedication.dosage || "Not specified",
        frequency: newMedication.frequency || "As needed",
        prescribedDate: new Date().toISOString().split("T")[0],
        endDate: undefined,
        fdaCategory: (analysisResult?.fdaCategory || "B") as
          | "A"
          | "B"
          | "C"
          | "D"
          | "X",
        notes: newMedication.notes || undefined,
        reminders: [],
        adherenceLog: [],
        llmSafetyAnalysis: analysisResult?.safetyAnalysis || undefined,
        llmBenefits: analysisResult?.benefits || undefined,
        llmRisks: analysisResult?.risks || undefined,
        overallSafety: analysisResult?.overallSafety || undefined,
      };

      console.log(`[${operationId}] 💾 Adding temp medication to UI state`);
      setMedications((prev) => [tempMedication, ...prev]);

      const message = analysisResult
        ? `تم إضافة ${newMedication.name} مع التحليل الطبي (جاري المزامنة...)`
        : `تم إضافة ${newMedication.name} (جاري المزامنة...)`;

      console.log(`[${operationId}] ✅ Showing success alert`);
      Alert.alert("نجاح", message);
      resetForm();

      console.log(`[${operationId}] 🔄 Starting queue processing...`);
      persistentWriteQueue.processQueue(async (item) => {
        console.log(`[${operationId}] 📝 Processing medication write: ${item.localId}`);
        const saveStartTime = Date.now();
        const saveResult = await createMedication(item.payload as any);
        const saveTime = Date.now() - saveStartTime;

        if (saveResult?.id) {
          console.log(`[${operationId}] ✅ Medication saved to DB in ${saveTime}ms, id: ${saveResult.id}`);
          setMedications((prev) =>
            prev.map((med) =>
              med.id === item.localId ? { ...med, id: saveResult.id } : med
            )
          );
          return saveResult.id;
        }
        console.error(`[${operationId}] ❌ Failed to save medication`);
        throw new Error('Failed to save medication');
      });

      console.log(`[${operationId}] ⏰ Scheduling data refresh in 2s...`);
      setTimeout(() => {
        console.log(`[${operationId}] 🔄 Executing scheduled refresh`);
        refreshData();
      }, 2000);
    } catch (error: unknown) {
      console.error(`[${operationId}] ❌ Fatal error adding medication:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      const errorMessage =
        error instanceof Error ? error.message : "خطأ غير معروف";
      Alert.alert("خطأ", `فشل في إضافة الدواء: ${errorMessage}`);
    } finally {
      console.log(`[${operationId}] 🏁 Cleaning up flags`);
      setIsAddingMedication(false);
      setAnalysisStatus("");
      setWriting(false);
    }
  };

  const resetForm = () => {
    setNewMedication({
      name: "",
      dosage: "",
      frequency: "",
      fdaCategory: "B" as const,
      notes: "",
    });
    setModalVisible(false);
  };

  const forceRefreshData = async () => {
    try {
      console.log("🗑️ Force refreshing medications data...");

      // Clear medications cache
      await clearCache(CACHE_KEYS.MEDICATIONS);

      // Force refresh data
      await refreshData();

      Alert.alert("نجاح", "تم تحديث بيانات الأدوية بنجاح");
    } catch (error) {
      console.error("❓ Error force refreshing data:", error);
      Alert.alert("خطأ", "فشل في تحديث البيانات");
    }
  };

  const markAsTaken = async (medicationId: string) => {
    const today = new Date().toISOString().split("T")[0];

    try {
      // تحديث فوري للـ UI أولاً لردة فعل سريعة
      setMedications((prev) =>
        prev.map((med) => {
          if (med.id === medicationId) {
            const updatedAdherenceLog = [...(med.adherenceLog || [])];
            const existingEntryIndex = updatedAdherenceLog.findIndex(
              (entry) => entry.date === today,
            );

            if (existingEntryIndex >= 0) {
              updatedAdherenceLog[existingEntryIndex] = {
                ...updatedAdherenceLog[existingEntryIndex],
                taken: true,
              };
            } else {
              updatedAdherenceLog.push({
                id: `temp_${Date.now()}`,
                medicationId: medicationId,
                date: today,
                taken: true,
              });
            }

            return {
              ...med,
              adherenceLog: updatedAdherenceLog,
            };
          }
          return med;
        }),
      );

      // حفظ في قاعدة البيانات
      const result = await logMedicationAdherence(medicationId, today, true);
      console.log("Medication adherence logged to Supabase:", result);

      // تحديث المعرف المؤقت بالمعرف الحقيقي من قاعدة البيانات
      if (result?.id) {
        setMedications((prev) =>
          prev.map((med) => {
            if (med.id === medicationId) {
              const updatedAdherenceLog =
                med.adherenceLog?.map((entry) => {
                  if (entry.date === today && entry.id.startsWith("temp_")) {
                    return {
                      ...entry,
                      id: result.id,
                    };
                  }
                  return entry;
                }) || [];

              return {
                ...med,
                adherenceLog: updatedAdherenceLog,
              };
            }
            return med;
          }),
        );
      }

      // تحديث خفيف من قاعدة البيانات بدون تأثير على UI (للتأكد من التزامن)
      setTimeout(() => {
        refreshMedications().catch((error) => {
          console.warn("Background medication refresh failed:", error);
        });
      }, 2000);
    } catch (error) {
      console.error("Error logging medication adherence to Supabase:", error);

      // إعادة تعيين الحالة في حالة الفشل
      setMedications((prev) =>
        prev.map((med) => {
          if (med.id === medicationId) {
            const updatedAdherenceLog =
              med.adherenceLog?.filter(
                (entry) =>
                  !(entry.date === today && entry.id.startsWith("temp_")),
              ) || [];

            return {
              ...med,
              adherenceLog: updatedAdherenceLog,
            };
          }
          return med;
        }),
      );

      Alert.alert("خطأ", "فشل في تسجيل تناول الدواء. يرجى المحاولة مرة أخرى.");
    }
  };

  const getTodaysAdherence = (medication: Medication) => {
    const today = new Date().toISOString().split("T")[0];
    return (
      medication.adherenceLog?.some(
        (entry) => entry.date === today && entry.taken,
      ) || false
    );
  };

  const MedicationCard = ({ medication }: { medication: Medication }) => {
    const localizedStyles = useLocalizedStyles();
    const isDeleting = deletingId === medication.id;
    const todaysAdherence = getTodaysAdherence(medication);

    // Get safety styling from design system
    const safetyInfo = getMedicationSafetyInfo(medication.fdaCategory || "B");
    const safetyStyles = getSafetyStyles(medication.fdaCategory || "B");

    if (isDeleting) {
      return null;
    }

    return (
      <Card
        key={medication.id}
        variant="default"
        style={medicationCardStyles.container}
      >
        <View style={medicationCardStyles.header}>
          <View style={medicationCardStyles.titleSection}>
            <View
              style={[
                medicationCardStyles.iconContainer,
                { backgroundColor: safetyStyles.backgroundColor },
              ]}
            >
              <Icon name="local-pharmacy" size={20} color={COLORS.white} />
            </View>
            <View style={medicationCardStyles.medicationInfo}>
              <Text
                style={medicationCardStyles.medicationName}
                numberOfLines={1}
              >
                {medication.name || t("unknownMedication")}
              </Text>
              <Text style={medicationCardStyles.dosageInfo} numberOfLines={1}>
                {medication.dosage} • {medication.frequency}
              </Text>
            </View>
          </View>
          <View style={medicationCardStyles.actionsSection}>
            <TouchableOpacity
              style={[
                medicationCardStyles.adherenceButton,
                todaysAdherence && medicationCardStyles.adherenceButtonTaken,
              ]}
              onPress={() => markAsTaken(medication.id)}
              disabled={todaysAdherence}
            >
              <Icon
                name={
                  todaysAdherence ? "check-circle" : "radio-button-unchecked"
                }
                size={24}
                color={todaysAdherence ? COLORS.success : COLORS.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={medicationCardStyles.deleteButton}
              onPress={() => deleteMedication(medication.id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={COLORS.error} />
              ) : (
                <Icon name="delete" size={20} color={COLORS.error} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={medicationCardStyles.safetySection}>
          <View
            style={[medicationCardStyles.safetyBadge, safetyStyles.container]}
          >
            <Text style={[medicationCardStyles.safetyText, safetyStyles.text]}>
              {`${t("fdaCategory")} ${medication.fdaCategory || "B"}`}
            </Text>
          </View>
          {medication.llmSafetyAnalysis && (
            <Text
              style={medicationCardStyles.safetyDescription}
              numberOfLines={2}
            >
              {medication.llmSafetyAnalysis}
            </Text>
          )}
        </View>
        {(medication.llmBenefits ||
          medication.llmRisks ||
          medication.overallSafety) && (
          <View style={medicationCardStyles.aiAnalysisSection}>
            <View style={medicationCardStyles.aiSectionHeader}>
              <Icon name="psychology" size={20} color={COLORS.primary} />
              <Text style={medicationCardStyles.aiSectionTitle}>
                {t("aiSafetyAnalysis")}
              </Text>
            </View>

            <View style={medicationCardStyles.analysisCardsContainer}>
              {medication.llmBenefits && (
                <View style={[medicationCardStyles.analysisCard, medicationCardStyles.benefitsCard]}>
                  <View style={medicationCardStyles.cardHeader}>
                    <Icon name="thumb-up" size={16} color={COLORS.success} />
                    <Text style={[medicationCardStyles.cardTitle, medicationCardStyles.benefitsTitle]}>
                      {t("benefits")}
                    </Text>
                  </View>
                  <Text style={medicationCardStyles.cardContent}>
                    {medication.llmBenefits}
                  </Text>
                </View>
              )}

              {medication.llmRisks && (
                <View style={[medicationCardStyles.analysisCard, medicationCardStyles.risksCard]}>
                  <View style={medicationCardStyles.cardHeader}>
                    <Icon name="warning" size={16} color={COLORS.warning} />
                    <Text style={[medicationCardStyles.cardTitle, medicationCardStyles.risksTitle]}>
                      {t("risks")}
                    </Text>
                  </View>
                  <Text style={medicationCardStyles.cardContent}>
                    {medication.llmRisks}
                  </Text>
                </View>
              )}

              {medication.overallSafety && (
                <View style={[medicationCardStyles.analysisCard, medicationCardStyles.safetyCard]}>
                  <View style={medicationCardStyles.cardHeader}>
                    <Icon name="verified" size={16} color={COLORS.primary} />
                    <Text style={[medicationCardStyles.cardTitle, medicationCardStyles.safetyTitle]}>
                      {t("overallSafety")}
                    </Text>
                  </View>
                  <Text style={medicationCardStyles.cardContent}>
                    {medication.overallSafety}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {medication.prescribedDate && (
          <Text style={medicationCardStyles.dateText}>
            {t("prescribed")}:
            {new Date(medication.prescribedDate).toLocaleDateString()}
          </Text>
        )}
      </Card>
    );
  };

  // Handler for language changes, to be passed to LanguageToggle
  const handleLanguageChange = () => {
    // This function might be used to trigger a re-render or update context if needed
    // For now, the isRTL() hook in styles handles the directional changes
  };

  return (
    <SafeAreaView style={[styles.container, rtlContainerStyles.pageContainer]}>
      <View style={[styles.container, rtlContainerStyles.pageContainer]}>
        <ModernHeader
          title={t("medicationsTitle")}
          subtitle={t("medicationsSubtitle")}
          showLogo={true}
          variant="default"
          elevation={true}
          backgroundColor="#FFFFFF"
          textColor="#1A1A1A"
          rightActions={[
            <LanguageToggle
              key="languageToggle"
              onLanguageChange={handleLanguageChange}
            />,
            <Button
              key="addMedication"
              title={t("addMedication")}
              onPress={() => setModalVisible(true)}
              variant="primary"
              style={styles.addButton}
              icon={<Icon name="add" size={24} color="#FFFFFF" />}
            />,
          ]}
        />
        {contextLoading && (
          <View style={[styles.topLoadingBanner, { flexDirection: isRTL() ? "row-reverse" : "row" }]}>
            <ActivityIndicator size="small" color="#E91E63" />
            <Text style={styles.loadingText}>{t("loading")}...</Text>
            <TouchableOpacity
              style={styles.forceRefreshButton}
              onPress={async () => {
                console.log("🔄 Force refresh initiated from medications screen");
                await refreshData();
              }}
            ><Icon name="refresh" size={20} color="#E91E63" /></TouchableOpacity>
          </View>
        )}
        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingHorizontal: 0 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {medications.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="shield" size={64} color="#E0E0E0" />
              <Text style={[styles.emptyText, rtlTextStyles.text]}>
                {t("noMedications")}
              </Text>
              <Text style={[styles.emptySubtext, rtlTextStyles.text]}>
                {t("noMedicationsSubtext")}
              </Text>
            </View>
          ) : (
            medications.map((medication) => (
              <MedicationCard key={medication.id} medication={medication} />
            ))
          )}
        </ScrollView>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={[styles.modalHeader, rtlContainerStyles.headerRow]}>
                {isRTL() ? (
                  <>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Icon name="close" size={24} color="#666666" />
                    </TouchableOpacity>
                    <Text style={[styles.modalTitle, rtlTextStyles.text]}>
                      {t("addMedication")}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.modalTitle, rtlTextStyles.text]}>
                      {t("addMedication")}
                    </Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Icon name="close" size={24} color="#666666" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
              <ScrollView style={styles.modalBody}>
                <Input
                  label={t("medicationName")}
                  value={newMedication.name}
                  onChangeText={(text) =>
                    setNewMedication({ ...newMedication, name: text })
                  }
                  placeholder={t("medicationNamePlaceholder")}
                  required
                />
                <Input
                  label={`${t("dosage")} (${t("optional")})`}
                  value={newMedication.dosage}
                  onChangeText={(text) =>
                    setNewMedication({ ...newMedication, dosage: text })
                  }
                  placeholder={t("dosagePlaceholder")}
                />
                <Input
                  label={`${t("frequency")} (${t("optional")})`}
                  value={newMedication.frequency}
                  onChangeText={(text) =>
                    setNewMedication({ ...newMedication, frequency: text })
                  }
                  placeholder={t("frequencyPlaceholder")}
                />
                <Input
                  label={t("notes")}
                  value={newMedication.notes}
                  onChangeText={(text) =>
                    setNewMedication({ ...newMedication, notes: text })
                  }
                  placeholder={t("notesPlaceholder")}
                  multiline
                />
                <View style={styles.aiAnalysisInfo}>
                  <Icon name="psychology" size={16} color={COLORS.primary} />
                  <Text style={[styles.aiAnalysisText, rtlTextStyles.text]}>
                    {t("aiAnalysisInfo")}
                  </Text>
                </View>
                {!activePregnancy && (
                  <View style={styles.profileWarning}>
                    <Icon name="error" size={16} color="#FF9800" />
                    <Text
                      style={[styles.profileWarningText, rtlTextStyles.text]}
                    >
                      {t("profileRequiredMedication")}
                    </Text>
                  </View>
                )}
              </ScrollView>
              <View style={[styles.modalFooter, rtlContainerStyles.row]}>
                <Button
                  title={t("cancel")}
                  onPress={() => setModalVisible(false)}
                  variant="outlined"
                  style={{
                    flex: 1,
                    marginRight: isRTL() ? 0 : 8,
                    marginLeft: isRTL() ? 8 : 0,
                  }}
                  disabled={isAddingMedication}
                />
                <Button
                  title={
                    isAddingMedication
                      ? `${t("addMedication")}...`
                      : t("addMedication")
                  }
                  onPress={addMedication}
                  style={{
                    flex: 1,
                    marginRight: isRTL() ? 8 : 0,
                    marginLeft: isRTL() ? 0 : 8,
                  }}
                  disabled={isAddingMedication || contextLoading}
                />
              </View>
              {isAddingMedication && (
                <View style={styles.loadingOverlay}>
                  <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={[styles.loadingTitle, rtlTextStyles.text]}>
                      {analysisStatus || "جاري إضافة الدواء..."}
                    </Text>
                    <Text style={[styles.loadingSubtitle, rtlTextStyles.text]}>
                      يرجى الانتظار بينما نحلل أمان الدواء ونحفظه في قاعدة
                      البيانات
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
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
    width: "100%",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    width: "100%",
  },
  headerLogo: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter-Bold",
    color: "#333333",
    width: "100%",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#666666",
    marginTop: 4,
    width: "100%",
  },
  addButton: {
    backgroundColor: "#E91E63",
    borderRadius: 12,
    padding: 12,
  },
  content: {
    flex: 1,
    width: "100%",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%",
  },
  topLoadingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#FFF5F7",
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#666666",
  },
  forceRefreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: "Inter-SemiBold",
    color: "#666666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#999999",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  rtlMedicationInfo: {
    alignItems: "flex-end", // Align text to the right in RTL
  },
  medicationName: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#333333",
  },
  medicationMeta: {
    flexDirection: "row",
    marginTop: 4,
    gap: 8,
  },
  dosage: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#666666",
  },
  frequency: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#666666",
  },
  category: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#999999",
    fontStyle: "italic",
  },
  cardActionsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  safetyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    justifyContent: "center",
  },
  safetyText: {
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FFEBEE",
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  safetyInfo: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  safetyLabel: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    color: "#333333",
    marginBottom: 4,
  },
  safetyDescription: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#666666",
    lineHeight: 16,
  },
  aiCategoryNote: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
    color: COLORS.primary,
    fontStyle: "italic",
  },
  aiAnalysisIndicator: {
    fontSize: 10,
    fontFamily: "Inter-Medium",
    color: COLORS.primary,
    marginTop: 4,
    fontStyle: "italic",
  },
  overallSafetyText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    color: "#4CAF50",
    marginTop: 4,
    fontStyle: "italic",
  },
  notes: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#666666",
    fontStyle: "italic",
    marginBottom: 8,
  },
  llmAnalysisSection: {
    backgroundColor: "#F3E5F5",
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    overflow: "hidden",
  },
  llmHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  llmHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  llmTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#7B1FA2",
    marginLeft: 8,
  },
  llmContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  llmItem: {
    marginBottom: 12,
  },
  llmItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#E8D5ED",
    borderRadius: 8,
    marginBottom: 8,
  },
  llmItemTitle: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    color: "#7B1FA2",
    flex: 1,
  },
  llmItemText: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
    color: "#4A148C",
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  llmDisclaimer: {
    fontSize: 11,
    fontFamily: "Inter-Regular",
    color: "#7B1FA2",
    fontStyle: "italic",
    marginTop: 8,
    paddingHorizontal: 12,
  },
  adherenceSection: {
    marginBottom: 8,
  },
  adherenceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  adherenceTitle: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#666666",
  },
  takenBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    minWidth: 60,
    justifyContent: "center",
  },
  takenText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    color: "#4CAF50",
    marginLeft: 4,
    textAlign: "center",
  },
  takeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E91E63",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    minWidth: 80,
    justifyContent: "center",
  },
  takeButtonText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    color: "#FFFFFF",
    marginLeft: 4,
    textAlign: "center",
  },
  metadata: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  prescribedDate: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#999999",
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
    maxHeight: "90%",
    position: "relative",
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
    maxHeight: 500,
  },

  aiAnalysisInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F3E5F5",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  aiAnalysisText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#7B1FA2",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  profileWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  profileWarningText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#E65100",
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
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  loadingContent: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#333333",
    marginTop: 16,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});

// Updated medication card styles for consistent design with RTL support
const medicationCardStyles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
    overflow: "hidden",
  },

  header: {
    flexDirection: isRTL() ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
    minHeight: 70,
    paddingVertical: SPACING.sm,
  },

  titleSection: {
    flexDirection: isRTL() ? "row-reverse" : "row",
    alignItems: "flex-start",
    flex: 1,
    gap: SPACING.md,
    paddingRight: isRTL() ? 0 : SPACING.sm,
    paddingLeft: isRTL() ? SPACING.sm : 0,
    minWidth: 0,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  medicationInfo: {
    flex: 1,
    alignItems: isRTL() ? "flex-end" : "flex-start",
    minWidth: 0,
  },

  medicationName: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: isRTL() ? "right" : "left",
    writingDirection: isRTL() ? "rtl" : "ltr",
    width: "100%",
    lineHeight: TYPOGRAPHY.md * TYPOGRAPHY.relaxed,
    flexWrap: "wrap",
  },

  dosageInfo: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    textAlign: isRTL() ? "right" : "left",
    writingDirection: isRTL() ? "rtl" : "ltr",
    width: "100%",
    lineHeight: TYPOGRAPHY.sm * TYPOGRAPHY.relaxed,
    flexWrap: "wrap",
  },

  actionsSection: {
    flexDirection: isRTL() ? "row-reverse" : "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    flexShrink: 0,
    paddingTop: SPACING.xs,
  },

  adherenceButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  adherenceButtonTaken: {
    backgroundColor: COLORS.primaryLight,
  },

  deleteButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  safetySection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    width: "100%",
  },

  safetyBadge: {
    alignSelf: isRTL() ? "flex-end" : "flex-start",
    marginBottom: SPACING.sm,
  },

  safetyText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
  },

  safetyDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.sm * TYPOGRAPHY.relaxed,
    marginTop: SPACING.xs,
    textAlign: isRTL() ? "right" : "left",
    writingDirection: isRTL() ? "rtl" : "ltr",
    width: "100%",
    paddingHorizontal: SPACING.xs,
  },

  // New professional AI analysis styles
  aiAnalysisSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },

  aiSectionHeader: {
    flexDirection: isRTL() ? "row-reverse" : "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },

  aiSectionTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.primary,
    textAlign: isRTL() ? "right" : "left",
    writingDirection: isRTL() ? "rtl" : "ltr",
  },

  analysisCardsContainer: {
    gap: SPACING.md,
  },

  analysisCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderLeftWidth: isRTL() ? 0 : 4,
    borderRightWidth: isRTL() ? 4 : 0,
    marginBottom: SPACING.sm,
  },

  benefitsCard: {
    borderLeftColor: isRTL() ? 'transparent' : COLORS.success,
    borderRightColor: isRTL() ? COLORS.success : 'transparent',
    backgroundColor: '#F8FFF8',
  },

  risksCard: {
    borderLeftColor: isRTL() ? 'transparent' : COLORS.warning,
    borderRightColor: isRTL() ? COLORS.warning : 'transparent',
    backgroundColor: '#FFFBF0',
  },

  safetyCard: {
    borderLeftColor: isRTL() ? 'transparent' : COLORS.primary,
    borderRightColor: isRTL() ? COLORS.primary : 'transparent',
    backgroundColor: '#F3E5F5',
  },

  cardHeader: {
    flexDirection: isRTL() ? "row-reverse" : "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },

  cardTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    textAlign: isRTL() ? "right" : "left",
    writingDirection: isRTL() ? "rtl" : "ltr",
    flex: 1,
  },

  benefitsTitle: {
    color: COLORS.success,
  },

  risksTitle: {
    color: COLORS.warning,
  },

  safetyTitle: {
    color: COLORS.primary,
  },

  cardContent: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.sm * 1.5,
    textAlign: isRTL() ? "right" : "left",
    writingDirection: isRTL() ? "rtl" : "ltr",
  },

  dateText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textDisabled,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    textAlign: isRTL() ? "right" : "left",
    writingDirection: isRTL() ? "rtl" : "ltr",
    width: "100%",
  } as TextStyle,
});

const modernCardStyles = StyleSheet.create({
  header: {
    flexDirection: isRTL() ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
    width: "100%",
    minHeight: 60,
  },

  titleSection: {
    flexDirection: isRTL() ? "row-reverse" : "row",
    alignItems: "flex-start",
    flex: 1,
    width: "100%",
    paddingRight: isRTL() ? 0 : SPACING.sm,
    paddingLeft: isRTL() ? SPACING.sm : 0,
  },

  iconContainer: {
    marginRight: isRTL() ? 0 : SPACING.md,
    marginLeft: isRTL() ? SPACING.md : 0,
    flexShrink: 0,
  },

  medicationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.sm,
  },

  medicationInfo: {
    flex: 1,
    alignItems: isRTL() ? "flex-end" : "flex-start",
    minWidth: 0, // Allow text to wrap
  },

  medicationName: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lg * TYPOGRAPHY.relaxed,
    marginBottom: SPACING.xs,
    textAlign: isRTL() ? "right" : "left",
    writingDirection: isRTL() ? "rtl" : "ltr",
    width: "100%",
    flexWrap: "wrap",
  },

  dosageInfo: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.sm * TYPOGRAPHY.relaxed,
    textAlign: isRTL() ? "right" : "left",
    writingDirection: isRTL() ? "rtl" : "ltr",
    width: "100%",
    flexWrap: "wrap",
  },

  actionsSection: {
    flexDirection: isRTL() ? "row-reverse" : "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    flexShrink: 0,
    paddingTop: SPACING.xs,
  },

  adherenceButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  adherenceButtonTaken: {
    backgroundColor: COLORS.primaryLight,
  },

  deleteButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  safetySection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    width: "100%",
  },

  safetyBadge: {
    alignSelf: isRTL() ? "flex-end" : "flex-start",
    marginBottom: SPACING.sm,
  },

  safetyText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
  },

  safetyDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.sm * TYPOGRAPHY.relaxed,
    textAlign: isRTL() ? "right" : "left",
    writingDirection: isRTL() ? "rtl" : "ltr",
    width: "100%",
    paddingHorizontal: SPACING.xs,
    marginTop: SPACING.xs,
  },

  aiAnalysisSection: {
    flexDirection: isRTL() ? "row-reverse" : "row",
    marginTop: SPACING.md,
    gap: SPACING.lg,
    flexWrap: "wrap",
    width: "100%",
  },

  analysisItem: {
    flexDirection: isRTL() ? "row-reverse" : "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },

  analysisLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.medium,
    textAlign: isRTL() ? "right" : "left",
    marginBottom: SPACING.xs,
  },

  analysisText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.xs * 1.4,
    textAlign: isRTL() ? "right" : "left",
    writingDirection: isRTL() ? "rtl" : "ltr",
    marginTop: SPACING.xs,
  } as TextStyle,

  dateText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textDisabled,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    textAlign: isRTL() ? "right" : "left",
    writingDirection: isRTL() ? "rtl" : "ltr",
    width: "100%",
  } as TextStyle,
});