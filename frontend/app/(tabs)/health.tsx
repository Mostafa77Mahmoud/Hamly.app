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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Symptom } from "@/types";
import { createSymptom, deleteSymptom } from "@/utils/supabaseStorage";
import {
  t,
  addLanguageChangeListener,
  isRTL,
  getCurrentLanguage,
} from "@/utils/i18n";
import {
  rtlTextStyles,
  rtlContainerStyles,
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
import ModernHeader from "@/components/ModernHeader";
import LanguageToggle from "@/components/LanguageToggle";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { generateTraceId, logTrace } from "@/utils/errorHandling";
import { calculateGestationalAge } from "@/utils/pregnancy";
import { supabase } from "@/utils/supabase";
import { persistentWriteQueue } from "@/utils/persistentWriteQueue";
import { getApiUrl, safeFetch, isBackendAvailable } from "@/utils/apiConfig";

export default function HealthScreen() {
  const {
    symptoms,
    medications,
    labReports,
    activePregnancy,
    refreshData,
    loading: contextLoading,
    dataLoaded,
    refreshSymptoms,
    setWriting, // دالة للحماية من المقاطعة
  } = useData();

  const { session } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newSymptom, setNewSymptom] = useState({
    type: "",
    severity: "1",
    description: "",
    triggers: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleLanguageChange = () => {
    // Language change handler - no parameters needed as isRTL() is reactive
    console.log(`Language changed to: ${getCurrentLanguage()}`);
  };

  useEffect(() => {
    const unsubscribe = addLanguageChangeListener(handleLanguageChange);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (dataLoaded && symptoms.length === 0 && !contextLoading) {
      console.log("No symptoms found, refreshing from Supabase...");
      setTimeout(() => refreshSymptoms(), 500);
    }
  }, [dataLoaded, symptoms.length, refreshSymptoms, contextLoading]);

  const deleteSymptomHandler = async (symptomId: string) => {
    const symptom = symptoms.find((s) => s.id === symptomId);
    if (!symptom) return;

    setDeletingId(symptomId);
    try {
      await deleteSymptom(symptomId);
      await refreshSymptoms();

      if (Platform.OS !== "web") {
        LayoutAnimation.easeInEaseOut();
      }
    } catch (error) {
      console.error("Error deleting symptom:", error);
      Alert.alert("خطأ", "فشل في حذف العرض. يرجى المحاولة مرة أخرى.");
    } finally {
      setDeletingId(null);
    }
  };

  const addSymptom = async () => {
    const operationId = `add_symp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    console.log(`[${operationId}] 🚀 Starting addSymptom process`);

    if (!newSymptom.type) {
      console.log(`[${operationId}] ⚠️ No symptom type provided`);
      Alert.alert("خطأ", "يرجى إدخال نوع العرض");
      return;
    }

    if (!session?.user) {
      console.log(`[${operationId}] ⚠️ No user session`);
      Alert.alert("خطأ", "المستخدم غير مسجل الدخول");
      return;
    }

    try {
      console.log(`[${operationId}] 🔒 Setting write operation flags`);
      setIsAnalyzing(true);
      setAnalysisStatus("جاري التحليل باستخدام الذكاء الاصطناعي...");
      setWriting(true);

      const traceId = generateTraceId("symptom_add_save");
      logTrace(traceId, "save-start", { type: newSymptom.type });

      let analysisResult: any = null;
      try {
        console.log(`[${operationId}] 🔄 Starting AI analysis...`);
        setAnalysisStatus("جاري التحليل باستخدام الذكاء الاصطناعي...");

        // Check if SessionManager is busy with resume
        const { sessionManager } = await import("@/services/session/sessionManager");
        const maxWaitTime = 5000; // 5 seconds max wait
        const startWaitTime = Date.now();
        
        while ((sessionManager as any).globalRefreshLock) {
          if (Date.now() - startWaitTime > maxWaitTime) {
            console.warn(`[${operationId}] ⏰ Proceeding with AI analysis despite global lock`);
            break;
          }
          console.log(`[${operationId}] ⏳ Waiting for global refresh lock before AI analysis...`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const analysisStartTime = Date.now();
        
        // Prepare comprehensive context
        const currentPregnancyWeek = activePregnancy
          ? calculateGestationalAge(activePregnancy.lastMenstrualPeriod).weeks
          : 0;

        console.log('📊 Context preparation:', {
          hasActivePregnancy: !!activePregnancy,
          pregnancyWeek: currentPregnancyWeek,
          medicationsCount: medications?.length || 0,
          labReportsCount: labReports?.length || 0,
          symptomData: newSymptom,
          userId: session.user.id
        });

        // Don't send context from frontend - let backend fetch it fresh
        // This ensures we always have the latest data from database
        console.log('🔄 Letting backend fetch fresh context from database for userId:', session.user.id);

        // Check if backend is available
        if (!isBackendAvailable()) {
          console.log(`[${operationId}] ⚠️ Backend not available - skipping AI analysis`);
          setAnalysisStatus("الباك إند غير متاح، سيتم الحفظ بدون تحليل AI...");
        } else {
          const response = await Promise.race([
            safeFetch(getApiUrl('analyzeSymptom'), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(session?.access_token
                  ? { Authorization: `Bearer ${session.access_token}` }
                  : {}),
              },
              body: JSON.stringify({
                symptom: {
                  type: newSymptom.type,
                  severity: parseInt(newSymptom.severity),
                  description: newSymptom.description,
                  triggers: newSymptom.triggers,
                  date: newSymptom.date,
                },
                // Send only userId - backend will fetch everything else
                userId: session.user.id,
                language: getCurrentLanguage(),
              }),
            }),
            new Promise<Response | null>((_, reject) =>
              setTimeout(
                () => reject(new Error("AI analysis timeout after 25 seconds")),
                25000,
              ),
            ),
          ]);

          const analysisTime = Date.now() - analysisStartTime;

          if (response && response.ok) {
            const responseText = await response.text();
            console.log(`[${operationId}] 📄 Raw AI response (first 200 chars):`, responseText.substring(0, 200) + "...");

            try {
              analysisResult = JSON.parse(responseText);
              console.log(`[${operationId}] ✅ AI analysis completed successfully in ${analysisTime}ms`);
              logTrace(traceId, "analysis-success", {
                hasAnalysis: !!analysisResult,
              });
            } catch (parseError) {
              console.error(`[${operationId}] ❌ Failed to parse AI response:`, {
                error: parseError instanceof Error ? parseError.message : String(parseError),
                responseText
              });
              throw new Error("فشل في معالجة رد الذكاء الاصطناعي");
            }
          } else if (response && !response.ok) {
            const errorText = await response.text();
            console.error(`[${operationId}] ❌ AI analysis failed with status ${response.status}:`, errorText);
            throw new Error(`AI analysis failed with status: ${response.status}`);
          } else {
            console.log(`[${operationId}] ⚠️ API call failed - skipping AI analysis`);
            setAnalysisStatus("فشل الاتصال بالباك إند، سيتم الحفظ بدون تحليل AI...");
          }
        }
      } catch (analysisError) {
        console.error(`[${operationId}] ❌ AI analysis error:`, {
          error: analysisError instanceof Error ? analysisError.message : String(analysisError),
          status: (analysisError as any)?.status || "NO_STATUS",
          stack: analysisError instanceof Error ? analysisError.stack : undefined
        });
        logTrace(traceId, "analysis-failed", {
          error:
            analysisError instanceof Error
              ? analysisError.message
              : "Unknown error",
          status: (analysisError as any)?.status || "NO_STATUS",
        });
        setAnalysisStatus("التحليل فشل، سيتم الحفظ بدون تحليل AI...");
      }

      console.log(`[${operationId}] 💾 Preparing symptom payload...`);
      setAnalysisStatus("جاري الحفظ...");

      const symptomDataWithAnalysis = {
        user_id: session.user.id,
        pregnancy_id: activePregnancy?.id || null,
        date: newSymptom.date,
        type: newSymptom.type,
        severity: parseInt(newSymptom.severity) as 1 | 2 | 3 | 4 | 5,
        description: newSymptom.description || "",
        triggers: newSymptom.triggers || null,
        llm_analysis: analysisResult?.analysis || null,
        llm_recommendations: analysisResult?.recommendations || null,
      };

      console.log(`[${operationId}] 📤 Enqueuing symptom to write queue...`);
      const localId = await persistentWriteQueue.enqueue(
        'symptom',
        symptomDataWithAnalysis,
        session.user.id
      );

      console.log(`[${operationId}] ✅ Symptom enqueued with localId: ${localId}`);
      logTrace(traceId, "queued-success", { localId });

      console.log(`[${operationId}] 🔓 Releasing write lock`);
      setWriting(false);

      setModalVisible(false);
      setNewSymptom({
        type: "",
        severity: "1",
        description: "",
        triggers: "",
        date: new Date().toISOString().split("T")[0],
      });

      console.log(`[${operationId}] ✅ Showing success alert`);
      Alert.alert(
        t("success"),
        analysisResult
          ? "تم حفظ العرض وتحليله (جاري المزامنة...)"
          : "تم حفظ العرض (جاري المزامنة...)",
        [{ text: t("ok") }],
      );

      console.log(`[${operationId}] 🔄 Starting queue processing...`);
      persistentWriteQueue.processQueue(async (item) => {
        console.log(`[${operationId}] 📝 Processing symptom write: ${item.localId}`);
        const saveStartTime = Date.now();
        const { data: savedSymptom, error: saveError } = await supabase
          .from("symptoms")
          .insert([item.payload as any])
          .select()
          .single();

        const saveTime = Date.now() - saveStartTime;

        if (saveError) {
          console.error(`[${operationId}] ❌ Failed to save symptom:`, saveError);
          throw new Error(`Failed to save: ${saveError.message}`);
        }

        console.log(`[${operationId}] ✅ Symptom saved to DB in ${saveTime}ms, id: ${(savedSymptom as any)?.id}`);
        return (savedSymptom as any)?.id;
      });

      console.log(`[${operationId}] ⏰ Scheduling symptoms refresh in 2s...`);
      setTimeout(() => {
        console.log(`[${operationId}] 🔄 Executing scheduled refresh`);
        refreshSymptoms();
      }, 2000);
    } catch (error: unknown) {
      console.error(`[${operationId}] ❌ Fatal error adding symptom:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      setWriting(false);
      const errorMessage =
        error instanceof Error ? error.message : "خطأ غير معروف";
      Alert.alert("خطأ", `فشل في إضافة العرض: ${errorMessage}`);
    } finally {
      console.log(`[${operationId}] 🏁 Cleaning up flags`);
      setIsAnalyzing(false);
      setIsSaving(false);
      setAnalysisStatus("");
    }
  };

  const resetForm = () => {
    setNewSymptom({
      type: "",
      severity: "1",
      description: "",
      triggers: "",
      date: new Date().toISOString().split("T")[0],
    });
    setModalVisible(false);
  };

  // دالة لإزالة الأعراض المكررة
  const getUniqueSymptoms = (symptoms: Symptom[]): Symptom[] => {
    const uniqueMap = new Map<string, Symptom>();

    symptoms.forEach((symptom) => {
      const key = `${symptom.type}_${symptom.date}_${symptom.severity}_${symptom.description}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, symptom);
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime();
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime();
      return bTime - aTime;
    });
  };

  const uniqueSymptoms = getUniqueSymptoms(symptoms);

  const SymptomCard = ({ symptom }: { symptom: Symptom }) => {
    const localizedStyles = useLocalizedStyles();
    const isDeleting = deletingId === symptom.id;
    const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);

    const getSeverityColor = (severity: number) => {
      const colors = [
        COLORS.success,
        COLORS.info,
        COLORS.warning,
        COLORS.error,
        COLORS.error,
      ];
      return colors[severity - 1] || COLORS.textSecondary;
    };

    const getSeverityText = (severity: number) => {
      const levels = [
        t("mild"),
        t("light"),
        t("moderate"),
        t("severe"),
        t("verySevere"),
      ];
      return levels[severity - 1] || t("unknown");
    };

    const getSeverityIcon = (severity: number) => {
      if (severity <= 2) return "sentiment-satisfied";
      if (severity <= 3) return "sentiment-neutral";
      return "sentiment-dissatisfied";
    };

    const toggleAnalysis = () => {
      if (Platform.OS !== "web") {
        LayoutAnimation.easeInEaseOut();
      }
      setIsAnalysisExpanded(!isAnalysisExpanded);
    };

    if (isDeleting) {
      return null;
    }

    const hasAnalysis = symptom.llmAnalysis || symptom.llmRecommendations;

    return (
      <Card key={symptom.id} variant="default">
        <View style={healthCardStyles.header}>
          <View style={healthCardStyles.titleSection}>
            <View style={healthCardStyles.iconContainer}>
              <View
                style={[
                  healthCardStyles.severityIcon,
                  { backgroundColor: getSeverityColor(symptom.severity) },
                ]}
              >
                <Icon
                  name={getSeverityIcon(symptom.severity)}
                  size={20}
                  color={COLORS.white}
                />
              </View>
            </View>
            <View style={healthCardStyles.symptomInfo}>
              <Text style={healthCardStyles.symptomType}>
                {symptom.type}
              </Text>
              <View style={healthCardStyles.metaRow}>
                <Text style={healthCardStyles.severityText}>
                  {getSeverityText(symptom.severity)} ({symptom.severity}
                  /5)
                </Text>
                <Text style={healthCardStyles.dateText}>
                  {new Date(symptom.date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
          <View style={healthCardStyles.actionsSection}>
            <TouchableOpacity
              style={healthCardStyles.deleteButton}
              onPress={() => deleteSymptomHandler(symptom.id)}
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
        {symptom.description && (
          <View style={healthCardStyles.descriptionSection}>
            <Text style={healthCardStyles.descriptionLabel}>
              {t("description")}:
            </Text>
            <Text style={healthCardStyles.descriptionText}>
              {symptom.description}
            </Text>
          </View>
        )}
        {symptom.triggers && (
          <View style={healthCardStyles.triggersSection}>
            <Text style={healthCardStyles.triggersLabel}>
              {t("triggers")}:
            </Text>
            <Text style={healthCardStyles.triggersText}>
              {symptom.triggers}
            </Text>
          </View>
        )}
        {hasAnalysis && (
          <View style={healthCardStyles.analysisSection}>
            <TouchableOpacity
              style={healthCardStyles.analysisToggle}
              onPress={toggleAnalysis}
            >
              <Icon name="psychology" size={16} color={COLORS.primary} />
              <Text style={healthCardStyles.analysisToggleText}>
                {t("aiAnalysis")}
              </Text>
              <Icon
                name={isAnalysisExpanded ? "expand-less" : "expand-more"}
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
            {isAnalysisExpanded && (
              <View style={healthCardStyles.expandedAnalysis}>
                {symptom.llmAnalysis && (
                  <View style={healthCardStyles.analysisItem}>
                    <Text style={healthCardStyles.analysisItemTitle}>
                      {t("analysis")}:
                    </Text>
                    <Text style={healthCardStyles.analysisItemText}>
                      {symptom.llmAnalysis}
                    </Text>
                  </View>
                )}
                {symptom.llmRecommendations && (
                  <View style={healthCardStyles.analysisItem}>
                    <Text style={healthCardStyles.analysisItemTitle}>
                      {t("recommendations")}:
                    </Text>
                    <Text style={healthCardStyles.analysisItemText}>
                      {symptom.llmRecommendations}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, rtlContainerStyles.pageContainer]}>
      <View style={[styles.container, rtlContainerStyles.pageContainer]}>
        <ModernHeader
          title={t("healthCheckTitle")}
          subtitle={t("healthCheckSubtitle")}
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
              key="addSymptom"
              title={t("addSymptom")}
              onPress={() => setModalVisible(true)}
              variant="primary"
              style={styles.addButton}
              icon={<Icon name="add" size={24} color="#FFFFFF" />}
            />,
          ]}
        />
        {contextLoading && (
          <View
            style={[
              styles.topLoadingBanner,
              { flexDirection: isRTL() ? "row-reverse" : "row" },
            ]}
          >
            <ActivityIndicator size="small" color="#E91E63" />
            <Text style={styles.loadingText}>{t("loadingData")}...</Text>
            <TouchableOpacity
              style={styles.forceRefreshButton}
              onPress={async () => {
                console.log("🔄 Force refresh initiated from health screen");
                await refreshData();
              }}
            ><Icon name="refresh" size={20} color="#E91E63" /></TouchableOpacity>
          </View>
        )}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >

          {uniqueSymptoms.length === 0 ? (
            <View style={styles.emptyState}>

              <Icon name="fitness-center" size={64} color="#E0E0E0" />
              <Text style={styles.emptyText}>{t("noSymptomsLogged")}</Text>
              <Text style={styles.emptySubtext}>
                {t("noSymptomsSubtext")}
              </Text>
            </View>
          ) : (
            uniqueSymptoms.map((symptom) => (
              <SymptomCard key={symptom.id} symptom={symptom} />
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

              <View style={styles.modalHeader}>

                <Text style={styles.modalTitle}>{t("addSymptom")}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>

                  <Icon name="close" size={24} color="#666666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>

                <Input
                  label={t("symptomType")}
                  value={newSymptom.type}
                  onChangeText={(text) =>
                    setNewSymptom({ ...newSymptom, type: text })
                  }
                  placeholder={t("symptomTypePlaceholder")}
                  required
                />
                <View style={styles.severitySection}>

                  <Text
                    style={[
                      styles.severityLabel,
                      { textAlign: isRTL() ? "right" : "left" },
                    ]}
                  >

                    {t("severityLevel")} (1-5)
                  </Text>
                  <View style={styles.severitySlider}>

                    <Text style={styles.severityValue}>

                      {newSymptom.severity}/5
                    </Text>
                    <View
                      style={[
                        styles.severityButtons,
                        { flexDirection: isRTL() ? "row-reverse" : "row" },
                      ]}
                    >

                      {[1, 2, 3, 4, 5].map((level) => (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.severityButton,
                            newSymptom.severity === level.toString() &&
                              styles.severityButtonActive,
                          ]}
                          onPress={() =>
                            setNewSymptom({
                              ...newSymptom,
                              severity: level.toString(),
                            })
                          }
                        >

                          <Text
                            style={[
                              styles.severityButtonText,
                              newSymptom.severity === level.toString() &&
                                styles.severityButtonTextActive,
                            ]}
                          >

                            {level}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View
                      style={[
                        styles.severityLabels,
                        { flexDirection: isRTL() ? "row-reverse" : "row" },
                      ]}
                    >
                      <Text style={styles.severityLabelText}>
                        {t("mild")}
                      </Text>
                      <Text style={styles.severityLabelText}>
                        {t("severe")}
                      </Text>
                    </View>
                  </View>
                </View>
                <Input
                  label={t("description")}
                  value={newSymptom.description}
                  onChangeText={(text) =>
                    setNewSymptom({ ...newSymptom, description: text })
                  }
                  placeholder={t("descriptionPlaceholder")}
                  multiline
                />
                <Input
                  label={t("possibleTriggers")}
                  value={newSymptom.triggers}
                  onChangeText={(text) =>
                    setNewSymptom({ ...newSymptom, triggers: text })
                  }
                  placeholder={t("triggersPlaceholder")}
                />
                <View style={styles.aiAnalysisInfo}>

                  <Icon
                    name="psychology"
                    size={16}
                    color={COLORS.primary}
                  />
                  <Text style={styles.aiAnalysisText}>

                    {t("aiSymptomInfo")}
                  </Text>
                </View>
                {!activePregnancy && (
                  <View style={styles.profileWarning}>

                    <Icon name="warning" size={16} color="#FF9800" />
                    <Text style={styles.profileWarningText}>

                      {t("profileRequiredSymptom")}
                    </Text>
                  </View>
                )}
              </ScrollView>
              <View style={styles.modalFooter}>

                <Button
                  title={t("cancel")}
                  onPress={() => setModalVisible(false)}
                  variant="outlined"
                  style={{ flex: 1, marginRight: 8 }}
                  disabled={isAnalyzing || isSaving}
                />
                <Button
                  title={
                    isAnalyzing || isSaving
                      ? `${t("addSymptom")}...`
                      : t("addSymptom")
                  }
                  onPress={addSymptom}
                  style={{ flex: 1, marginLeft: 8 }}
                  disabled={isAnalyzing || isSaving || contextLoading}
                />
              </View>
              {(isAnalyzing || isSaving) && (
                <View style={styles.loadingOverlay}>

                  <View style={styles.loadingContent}>

                    <ActivityIndicator
                      size="large"
                      color={COLORS.primary}
                    />
                    <Text style={styles.loadingTitle}>

                      {analysisStatus || "جاري معالجة العرض..."}
                    </Text>
                    <Text style={styles.loadingSubtitle}>

                      يرجى الانتظار بينما نحلل العرض ونحفظه في ملفك الطبي
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
    textAlign: "center",
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
  addButton: {
    backgroundColor: "#E91E63",
    borderRadius: 12,
    padding: 12,
  },
  // Card Header Styles
  cardHeader: {
    width: "100%",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  rtlCardHeader: {
    flexDirection: "row-reverse",
  },
  ltrCardHeader: {
    flexDirection: "row",
  },
  // Symptom Info Styles
  symptomInfo: {
    flex: 1,
    width: "100%",
    paddingRight: 12,
  },
  rtlSymptomInfo: {
    alignItems: "flex-end",
    paddingRight: 0,
    paddingLeft: 12,
  },
  ltrSymptomInfo: {
    alignItems: "flex-start",
    paddingRight: 12,
    paddingLeft: 0,
  },
  symptomType: {
    fontSize: 20,
    fontFamily: "Inter-SemiBold",
    color: "#333333",
    marginBottom: 8,
    lineHeight: 28,
  },
  symptomMeta: {
    width: "100%",
    alignItems: "center",
    marginTop: 4,
  },
  rtlMeta: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  ltrMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  // Severity Styles
  severityContainer: {
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rtlSeverity: {
    flexDirection: "row-reverse",
  },
  ltrSeverity: {
    flexDirection: "row",
  },
  severityIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  severityText: {
    fontSize: 13,
    fontFamily: "Inter-Medium",
    color: "#666666",
  },
  dateText: {
    fontSize: 13,
    fontFamily: "Inter-Regular",
    color: "#999999",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  // Text Alignment
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  ltrText: {
    textAlign: "left",
    writingDirection: "ltr",
  },
  deleteButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#FFEBEE",
    marginLeft: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  description: {
    fontSize: 15,
    fontFamily: "Inter-Regular",
    color: "#666666",
    marginBottom: 12,
    lineHeight: 22,
    textAlign: isRTL() ? "right" : "left",
    paddingHorizontal: 4,
  },
  triggersContainer: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  triggersLabel: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    color: "#333333",
    marginBottom: 6,
    textAlign: isRTL() ? "right" : "left",
  },
  triggersText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#666666",
    textAlign: isRTL() ? "right" : "left",
    lineHeight: 20,
  },
  analysisSection: {
    backgroundColor: "#F3E5F5",
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E1BEE7",
    overflow: "hidden",
  },
  analysisHeader: {
    flexDirection: isRTL() ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F3E5F5",
  },
  analysisHeaderContent: {
    flexDirection: isRTL() ? "row-reverse" : "row",
    alignItems: "center",
    flex: 1,
  },
  analysisTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#7B1FA2",
    marginLeft: isRTL() ? 0 : 8,
    marginRight: isRTL() ? 8 : 0,
  },
  analysisContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  analysisItem: {
    marginBottom: 16,
  },
  analysisItemTitle: {
    fontSize: 15,
    fontFamily: "Inter-SemiBold",
    color: "#7B1FA2",
    marginBottom: 8,
    textAlign: isRTL() ? "right" : "left",
  },
  analysisItemText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#4A148C",
    lineHeight: 22,
    textAlign: isRTL() ? "right" : "left",
  },
  analysisDisclaimer: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#7B1FA2",
    fontStyle: "italic",
    marginTop: 12,
    textAlign: isRTL() ? "right" : "left",
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
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
    textAlign: "center",
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  severitySection: {
    marginVertical: 16,
    width: "100%",
  },
  severityLabel: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#333333",
    marginBottom: 12,
    textAlign: "center",
  },
  severitySlider: {
    alignItems: "center",
    width: "100%",
  },
  severityValue: {
    fontSize: 24,
    fontFamily: "Inter-Bold",
    color: "#E91E63",
    marginBottom: 12,
    textAlign: "center",
  },
  severityButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
  },
  severityButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  severityButtonActive: {
    backgroundColor: "#E91E63",
  },
  severityButtonText: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#666666",
  },
  severityButtonTextActive: {
    color: "#FFFFFF",
  },
  severityLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  severityLabelText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#999999",
  },
  aiAnalysisInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F3E5F5",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  aiAnalysisText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#7B1FA2",
    marginLeft: 8,
    marginRight: 0,
    flex: 1,
    lineHeight: 20,
    textAlign: "left",
  },
  profileWarning: {
    flexDirection: isRTL() ? "row-reverse" : "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF3E0",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderLeftWidth: isRTL() ? 0 : 4,
    borderRightWidth: isRTL() ? 4 : 0,
    borderLeftColor: isRTL() ? "transparent" : "#FF9800",
    borderRightColor: isRTL() ? "#FF9800" : "transparent",
  },
  profileWarningText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#E65100",
    marginLeft: isRTL() ? 0 : 8,
    marginRight: isRTL() ? 8 : 0,
    flex: 1,
    lineHeight: 20,
    textAlign: isRTL() ? "right" : "left",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 12,
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

// Health Card Styles using Design System
const healthCardStyles = StyleSheet.create({
  container: {}, // Added an empty container to satisfy the original structure, though not used in the provided code
  title: {}, // Added empty style for title
  message: {}, // Added empty style for message
  button: {}, // Added empty style for button
  buttonText: {}, // Added empty style for buttonText

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
    width: "100%",
  },

  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    width: "100%",
  },

  iconContainer: {
    marginRight: SPACING.md,
  },

  severityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.sm,
  },

  symptomInfo: {
    flex: 1,
  },

  symptomType: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lg * TYPOGRAPHY.lineHeightNormal,
    marginBottom: SPACING.xs,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  severityText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.medium,
  },

  dateText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textDisabled,
  },

  actionsSection: {
    flexDirection: "row",
    alignItems: "center",
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

  descriptionSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },

  descriptionLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },

  descriptionText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.sm * TYPOGRAPHY.relaxed,
  },

  triggersSection: {
    marginTop: SPACING.sm,
  },

  triggersLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },

  triggersText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.sm * TYPOGRAPHY.relaxed,
  },

  analysisSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },

  analysisToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
  },

  analysisToggleText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.primary,
  },

  expandedAnalysis: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  },

  analysisItem: {
    gap: SPACING.xs,
  },

  analysisItemTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textPrimary,
  },

  analysisItemText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.sm * TYPOGRAPHY.relaxed,
  },
});
