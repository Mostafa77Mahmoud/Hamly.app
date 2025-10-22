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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { LabResult, LabReport } from "@/types";
import { saveData, loadData, STORAGE_KEYS } from "@/utils/storage";
import { getTrimester } from "@/utils/pregnancy";
import { ExtractedLabData } from "@/utils/labProcessor";
import { t, isRTL } from "@/utils/i18n";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  BORDER_RADIUS,
} from "@/utils/modernStyles";
import {
  rtlTextStyles,
  rtlContainerStyles,
  getDirectionalIcon,
} from "@/utils/rtlStyles";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Input from "@/components/Input";
import DocumentUploader from "@/components/DocumentUploader";
import ExtractedDataReview from "@/components/ExtractedDataReview";
import LocalizedHeader from "@/components/LocalizedHeader";
import { useData } from "@/contexts/DataContext";
import LanguageToggle from "@/components/LanguageToggle";
import ModernHeader from "@/components/ModernHeader"; // Assuming ModernHeader is in this path

export default function LabResultsScreen() {
  const router = useRouter();
  const {
    refreshData,
    labReports: contextLabReports,
    loading: contextLoading,
    dataLoaded,
  } = useData();
  const [reports, setReports] = useState<LabReport[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploaderVisible, setUploaderVisible] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedLabData[]>([]);
  const [extractedSummary, setExtractedSummary] = useState<string>("");
  const [extractedReportDate, setExtractedReportDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [newResult, setNewResult] = useState({
    testName: "",
    value: "",
    unit: "",
    referenceRange: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    category: "blood" as const,
  });

  useEffect(() => {
    // فقط حمل البيانات إذا لم يتم تحميلها عبر DataContext
    if (!dataLoaded) {
      console.log(
        "🔄 Initial load: DataContext not ready, loading reports directly...",
      );
      loadReports();
    } else if (!contextLabReports || contextLabReports.length === 0) {
      console.log(
        "🔄 Initial load: DataContext ready but no reports, loading directly...",
      );
      loadReports();
    }
  }, [dataLoaded, contextLabReports]);

  useEffect(() => {
    if (dataLoaded && contextLabReports !== undefined) {
      // تأكد من أن البيانات متوفرة
      if (contextLabReports && contextLabReports.length > 0) {
        const formattedReports: LabReport[] = contextLabReports.map(
          (report) => ({
            id: report.id,
            date: report.date,
            summary: report.summary,
            source: report.source,
            labResults: report.labResults || [],
          }),
        );

        setReports(
          formattedReports.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          ),
        );
        setLoading(false);
        console.log(
          "✅ Loaded lab reports from DataContext:",
          formattedReports.length,
        );
        return; // استخدم بيانات DataContext وتوقف هنا
      } else {
        // إذا كانت البيانات فارغة في DataContext، جرب التحميل المباشر
        console.log("⚠️ No lab reports in DataContext, trying direct load");
        setReports([]);
        setLoading(false);

        // محاولة تحميل مباشر كـ fallback
        loadReports().catch((error) => {
          console.error("Fallback load failed:", error);
        });
      }
    }
  }, [contextLabReports, dataLoaded]);

  const loadReports = async () => {
    // تجنب التحميل إذا كان DataContext يحتوي على بيانات
    if (contextLabReports && contextLabReports.length > 0) {
      console.log(
        "📋 Using existing DataContext lab reports, skipping direct load",
      );
      return;
    }

    setLoading(true);
    try {
      console.log("🔄 Fallback: Loading lab reports directly from database...");
      const { getLabReports } = await import("@/utils/supabaseStorage");
      const supabaseReports = await getLabReports();

      if (supabaseReports && supabaseReports.length > 0) {
        const formattedReports: LabReport[] = supabaseReports.map((report) => ({
          id: report.id,
          date: report.date,
          summary: report.summary,
          source: report.source,
          labResults: (report.lab_results || []).map((result: any) => ({
            id: result.id,
            testName: result.test_name,
            value: result.value,
            unit: result.unit,
            referenceRange: result.reference_range,
            date: result.date,
            isAbnormal: result.is_abnormal,
            notes: result.notes || undefined,
            category: result.category,
            trimester: result.trimester,
            explanation: result.explanation || undefined,
          })),
        }));

        setReports(
          formattedReports.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          ),
        );
        console.log(
          "✅ Loaded lab reports from database (fallback):",
          formattedReports.length,
        );
      } else {
        setReports([]);
        console.log("✅ No lab reports found in database (fallback)");
      }
    } catch (error) {
      console.error("❌ Error loading lab reports from database:", error);
      setReports([]);
      Alert.alert(
        t("error"),
        "Failed to load lab reports from database. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = () => {
    // This function is called by LanguageToggle, no specific logic needed here as isRTL is reactive
  };

  const addResult = async () => {
    if (!newResult.testName || !newResult.value) {
      Alert.alert(t("error"), "Please fill in test name and value");
      return;
    }

    try {
      setLoading(true);

      // Import Supabase functions
      const { createLabReport, createLabResults } = await import(
        "@/utils/supabaseStorage"
      );

      const gestationalAge = calculateGestationalWeeks(newResult.date);

      // Create the lab report first
      const reportData = await createLabReport({
        date: newResult.date,
        summary: `Manually Added Result for ${newResult.testName}`,
        source: "manual",
      });

      // Create lab result linked to the report
      const resultData = await createLabResults([
        {
          lab_report_id: reportData.id,
          test_name: newResult.testName,
          value: newResult.value,
          unit: newResult.unit,
          reference_range: newResult.referenceRange,
          date: newResult.date,
          is_abnormal: checkIfAbnormal(
            newResult.value,
            newResult.referenceRange,
          ),
          notes: newResult.notes || null,
          category: newResult.category,
          trimester: getTrimester(gestationalAge),
          explanation: null,
        },
      ]);

      // Format for local state
      const result: LabResult = {
        id: resultData[0].id,
        testName: resultData[0].test_name,
        value: resultData[0].value,
        unit: resultData[0].unit,
        referenceRange: resultData[0].reference_range,
        date: resultData[0].date,
        isAbnormal: resultData[0].is_abnormal,
        notes: resultData[0].notes || undefined,
        category: resultData[0].category,
        trimester: resultData[0].trimester,
        explanation: resultData[0].explanation || undefined,
      };

      // Create a new report for this manual entry
      const report: LabReport = {
        id: reportData.id,
        date: reportData.date,
        summary: reportData.summary,
        source: reportData.source,
        labResults: [result],
      };

      const updatedReports = [report, ...reports].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      setReports(updatedReports);
      setModalVisible(false);
      resetForm();

      Alert.alert("Success", "Lab result added successfully!");
    } catch (error) {
      console.error("Error adding lab result:", error);
      Alert.alert(t("error"), "Failed to add lab result. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDataExtracted = (
    data: ExtractedLabData[],
    summary?: string,
    reportDate?: string,
  ) => {
    setExtractedData(data);
    setExtractedSummary(summary || "");
    setExtractedReportDate(
      reportDate || new Date().toISOString().split("T")[0],
    );
    setUploaderVisible(false);
    setReviewVisible(true);
  };

  const handleConfirmExtractedData = async (
    data: ExtractedLabData[],
    reportDate: string,
  ) => {
    try {
      setLoading(true);

      // Import Supabase functions
      const { createLabReport, createLabResults } = await import(
        "@/utils/supabaseStorage"
      );

      // Create the lab report first
      const reportData = await createLabReport({
        date: reportDate,
        summary: extractedSummary,
        source: "upload",
      });

      // Create lab results linked to the report
      const resultsToCreate = data.map((item) => {
        const gestationalAge = calculateGestationalWeeks(reportDate);
        return {
          lab_report_id: reportData.id,
          test_name: item.testName,
          value: item.value,
          unit: item.unit,
          reference_range: item.referenceRange,
          date: reportDate,
          is_abnormal: item.isAbnormal,
          notes: item.notes || null,
          category: item.category,
          trimester: getTrimester(gestationalAge),
          explanation: item.explanation || null,
        };
      });

      const createdResults = await createLabResults(resultsToCreate);

      // Format for local state
      const newResults: LabResult[] = createdResults.map((result) => ({
        id: result.id,
        testName: result.test_name,
        value: result.value,
        unit: result.unit,
        referenceRange: result.reference_range,
        date: result.date,
        isAbnormal: result.is_abnormal,
        notes: result.notes || undefined,
        category: result.category,
        trimester: result.trimester,
        explanation: result.explanation || undefined,
      }));

      // Create the report object for local state
      const report: LabReport = {
        id: reportData.id,
        date: reportData.date,
        summary: reportData.summary,
        source: reportData.source,
        labResults: newResults,
      };

      const updatedReports = [report, ...reports].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      setReports(updatedReports);

      setReviewVisible(false);
      setExtractedData([]);
      setExtractedSummary("");
      setExtractedReportDate("");

      Alert.alert(
        "Success",
        `Lab report with ${newResults.length} test results has been added successfully!`,
      );
    } catch (error) {
      console.error("Error saving lab report:", error);
      Alert.alert("Error", "Failed to save lab report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewResult({
      testName: "",
      value: "",
      unit: "",
      referenceRange: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      category: "blood",
    });
  };

  const calculateGestationalWeeks = (date: string): number => {
    // In a real app, this would use the user's LMP
    const testDate = new Date(date);
    const lmp = new Date("2024-01-01"); // Placeholder LMP
    const diffTime = Math.abs(testDate.getTime() - lmp.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  };

  const checkIfAbnormal = (value: string, range: string): boolean => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || !range) return false;

    const rangeParts = range.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    if (rangeParts) {
      const min = parseFloat(rangeParts[1]);
      const max = parseFloat(rangeParts[2]);
      return numValue < min || numValue > max;
    }
    return false;
  };

  const ReportSummaryCard = ({ report }: { report: LabReport }) => {
    // Add null checks and error handling
    if (!report) {
      console.warn("ReportSummaryCard: Received null or undefined report");
      return null;
    }

    try {
      const abnormalCount = (report.labResults || []).filter(
        (result) => result && result.isAbnormal,
      ).length;
      const totalTests = (report.labResults || []).length;

      // Ensure report has required properties
      const reportDate = report.date ? new Date(report.date) : new Date();
      const reportSource = report.source || "manual";
      const reportId = report.id || "";

      return (
        <TouchableOpacity
          onPress={() => {
            if (reportId) {
              router.push(`/lab-results/${reportId}`);
            }
          }}
          activeOpacity={0.7}
        >
          <Card variant="elevated" style={labResultsCardStyles.reportCard}>
            <View style={labResultsCardStyles.reportHeader}>
              <View style={labResultsCardStyles.reportIcon}>
                <Icon
                  name={reportSource === "upload" ? "description" : "edit"}
                  size={24}
                  color={COLORS.primary}
                />
              </View>
              <View style={labResultsCardStyles.reportInfo}>
                <Text style={labResultsCardStyles.reportDate}>
                  {reportDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </Text>
                <View style={labResultsCardStyles.sourceRow}>
                  <Icon
                    name={
                      reportSource === "upload" ? "cloud-upload" : "keyboard"
                    }
                    size={14}
                    color={COLORS.textSecondary}
                  />
                  <Text style={labResultsCardStyles.reportSource}>
                    {reportSource === "upload"
                      ? t("uploadedDocument")
                      : t("manualEntry")}
                  </Text>
                </View>
              </View>
              <View style={labResultsCardStyles.chevronContainer}>
                <Icon
                  name="chevron-right"
                  size={20}
                  color={COLORS.textDisabled}
                />
              </View>
            </View>
            {report.summary && (
              <View style={labResultsCardStyles.summaryContainer}>
                <Text
                  style={labResultsCardStyles.reportSummary}
                  numberOfLines={3}
                >
                  {report.summary.length > 120
                    ? `${report.summary.substring(0, 120)}...`
                    : report.summary}
                </Text>
              </View>
            )}
            <View style={labResultsCardStyles.statsContainer}>
              <View style={labResultsCardStyles.statItem}>
                <Text style={labResultsCardStyles.statValue}>
                  {totalTests}
                </Text>
                <Text style={labResultsCardStyles.statLabel}>
                  {t("tests")}
                </Text>
              </View>
              {abnormalCount > 0 && (
                <View style={labResultsCardStyles.statItem}>
                  <Text
                    style={[
                      labResultsCardStyles.statValue,
                      labResultsCardStyles.abnormalValue,
                    ]}
                  >
                    {abnormalCount}
                  </Text>
                  <Text style={labResultsCardStyles.statLabel}>
                    {t("abnormal")}
                  </Text>
                </View>
              )}
              <View style={labResultsCardStyles.statItem}>
                <View style={labResultsCardStyles.statusIndicator}>
                  <View
                    style={[
                      labResultsCardStyles.statusDot,
                      {
                        backgroundColor:
                          abnormalCount > 0 ? COLORS.error : COLORS.success,
                      },
                    ]}
                  />
                  <Text style={labResultsCardStyles.statusText}>
                    {abnormalCount > 0
                      ? t("requiresAttention")
                      : t("normal")}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      );
    } catch (error) {
      console.error("ReportSummaryCard render error:", error);
      return (
        <Card variant="elevated" style={labResultsCardStyles.reportCard}>
          <View style={labResultsCardStyles.reportHeader}>
            <Text style={labResultsCardStyles.reportDate}>
              {t("errorLoadingReport")}
            </Text>
          </View>
        </Card>
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, rtlTextStyles.text]}>
            {t("loading")}..
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader
        title={t("labResultsTitle")}
        subtitle={t("labResultsSubtitle")}
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
            key="uploadLabReport"
            title={t("uploadLabReport")}
            onPress={() => setUploaderVisible(true)}
            variant="primary"
            style={styles.headerButton}
            icon={<Icon name="upload" size={20} color="#FFFFFF" />}
          />,
          <Button
            key="addManually"
            title={t("addManually")}
            onPress={() => setModalVisible(true)}
            variant="primary"
            style={styles.headerButton}
            icon={<Icon name="add" size={24} color="#FFFFFF" />}
          />,
        ]}
      />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {reports.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="biotech" size={64} color="#E0E0E0" />
            <Text style={[styles.emptyStateTitle, rtlTextStyles.title]}>
              {t("noLabReports")}
            </Text>
            <Text style={[styles.emptyStateText, rtlTextStyles.text]}>
              {t("noLabReportsSubtext")}
            </Text>
            <View style={[styles.emptyActions, rtlContainerStyles.row]}>
              <Button
                title={t("uploadLabReport")}
                onPress={() => setUploaderVisible(true)}
                style={styles.emptyButton}
              />
              <Button
                title={t("addManually")}
                onPress={() => setModalVisible(true)}
                variant="outlined"
                style={styles.emptyButton}
              />
            </View>
          </View>
        ) : (
          reports.map((report) => (
            <ReportSummaryCard key={report.id} report={report} />
          ))
        )}
      </ScrollView>
      {/* Manual Entry Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, rtlTextStyles.title]}>
                {t("addLabResult")}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Input
                label={t("testName")}
                value={newResult.testName}
                onChangeText={(text) =>
                  setNewResult({ ...newResult, testName: text })
                }
                placeholder={t("testNamePlaceholder")}
                required
              />
              <View style={[styles.inputRow, rtlContainerStyles.row]}>
                <Input
                  label={t("value")}
                  value={newResult.value}
                  onChangeText={(text) =>
                    setNewResult({ ...newResult, value: text })
                  }
                  placeholder={t("valuePlaceholder")}
                  keyboardType="numeric"
                  containerStyle={{
                    flex: 1,
                    marginRight: isRTL() ? 0 : 8,
                    marginLeft: isRTL() ? 8 : 0,
                  }}
                  required
                />
                <Input
                  label={t("unit")}
                  value={newResult.unit}
                  onChangeText={(text) =>
                    setNewResult({ ...newResult, unit: text })
                  }
                  placeholder={t("unitPlaceholder")}
                  containerStyle={{
                    flex: 1,
                    marginLeft: isRTL() ? 8 : 0,
                    marginRight: isRTL() ? 0 : 8,
                  }}
                />
              </View>
              <Input
                label={t("referenceRange")}
                value={newResult.referenceRange}
                onChangeText={(text) =>
                  setNewResult({ ...newResult, referenceRange: text })
                }
                placeholder={t("referencePlaceholder")}
              />
              <Input
                label={t("date")}
                value={newResult.date}
                onChangeText={(text) =>
                  setNewResult({ ...newResult, date: text })
                }
                placeholder="YYYY-MM-DD"
              />
              <Input
                label={t("notes")}
                value={newResult.notes}
                onChangeText={(text) =>
                  setNewResult({ ...newResult, notes: text })
                }
                placeholder={t("notesPlaceholder")}
                multiline
              />
            </ScrollView>
            <View style={styles.modalFooter}>

              <Button
                title={t("cancel")}
                onPress={() => setModalVisible(false)}
                variant="outlined"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={t("addResult")}
                onPress={addResult}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
      {/* Document Uploader Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={uploaderVisible}
        onRequestClose={() => setUploaderVisible(false)}
      >

        <DocumentUploader
          onDataExtracted={handleDataExtracted}
          onClose={() => setUploaderVisible(false)}
        />
      </Modal>
      {/* Extracted Data Review Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={reviewVisible}
        onRequestClose={() => setReviewVisible(false)}
      >

        <ExtractedDataReview
          extractedData={extractedData}
          summary={extractedSummary}
          initialReportDate={extractedReportDate}
          onConfirm={handleConfirmExtractedData}
          onCancel={() => {
            setReviewVisible(false);
            setExtractedData([]);
            setExtractedSummary("");
            setExtractedReportDate("");
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
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
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerLogo: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    marginTop: 4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginTop: 8,
    marginHorizontal: 40,
    lineHeight: 22,
  },
  emptyActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
  },
  emptyButton: {
    minWidth: 140,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
    alignItems: "flex-start",
  },
  rtlReportInfo: {
    alignItems: "flex-end",
  },
  reportDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  reportSource: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  reportSummary: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
    marginBottom: 16,
  },
  reportStats: {
    flexDirection: "row",
    gap: 24,
    justifyContent: "flex-start",
  },
  stat: {
    alignItems: "center",
    minWidth: 60,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
    textAlign: "center",
  },
  abnormalStat: {
    color: "#FF3B30",
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
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    maxHeight: 400,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
});

// Lab Results Card Styles using Design System
const labResultsCardStyles = StyleSheet.create({
  reportCard: {
    marginBottom: SPACING.md,
  },

  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },

  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.sm,
  },

  reportInfo: {
    flex: 1,
  },

  reportDate: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    lineHeight: TYPOGRAPHY.lg * TYPOGRAPHY.lineHeightNormal,
  },

  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  reportSource: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    fontWeight: TYPOGRAPHY.medium,
  },

  chevronContainer: {
    padding: SPACING.xs,
  },

  summaryContainer: {
    marginBottom: SPACING.md,
  },

  reportSummary: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.sm * TYPOGRAPHY.relaxed,
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },

  statItem: {
    alignItems: "center",
    flex: 1,
  },

  statValue: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lg * TYPOGRAPHY.lineHeightNormal,
  },

  abnormalValue: {
    color: COLORS.error,
  },

  statLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textDisabled,
    marginTop: SPACING.xs,
    textAlign: "center",
    fontWeight: TYPOGRAPHY.medium,
  },

  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },

  statusText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textSecondary,
  },
});