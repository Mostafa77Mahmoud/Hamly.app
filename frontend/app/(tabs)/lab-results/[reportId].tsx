import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LabReport } from "@/types";
import { loadData, STORAGE_KEYS } from "@/utils/storage";
import LabResultCard from "@/components/LabResultCard";
import { t, isRTL } from "@/utils/i18n";
import { createShadowStyle } from "@/utils/shadowStyles";
import LocalizedHeader from "@/components/LocalizedHeader";
import { useIsRTL } from "@/utils/useIsRTL";
import ModernHeader from "@/components/ModernHeader";
import UltimateSafeView from "@/components/UltimateSafeView";
import { sessionManager } from "@/services/session/sessionManager";

// Helper function to format date, assuming it's needed for the subtitle
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(); // Adjust formatting as needed
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString; // Fallback to original string if parsing fails
  }
};

export default function LabReportDetailsScreen() {
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const router = useRouter();
  const [report, setReport] = useState<LabReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isRTLDirection = useIsRTL();
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const loadId = `load_report_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    console.log(`[${loadId}] 🔍 Starting loadReport for reportId:`, reportId);
    loadReport(loadId);

    return () => {
      mountedRef.current = false;
    };
  }, [reportId]);

  const loadReport = async (loadId: string) => {
    console.log(`[${loadId}] 📊 Setting loading=true`);
    setLoading(true);
    setError(null);

    try {
      // Ensure session is valid before proceeding
      console.log(`[${loadId}] 🔐 Ensuring session is valid...`);
      await sessionManager.ensureSession();
      
      // Wait for any in-progress resync to complete
      if (sessionManager.isResyncInProgress()) {
        console.log(`[${loadId}] ⏳ Resync in progress, waiting for completion...`);
        await sessionManager.waitForResync();
        console.log(`[${loadId}] ✅ Resync completed, continuing with fresh data`);
      }

      // Try to get from DataContext first (instant, no network call)
      const { labReports } = await import("@/contexts/DataContext").then(m => {
        const { useData } = m;
        // Access context if available
        try {
          return useData();
        } catch {
          return { labReports: [] };
        }
      });

      console.log(`[${loadId}] 🔍 Checking DataContext for report ${reportId}`);
      const cachedReport = labReports.find((r: any) => r.id === reportId);
      
      // Only use cached data if it exists and component is still mounted
      if (cachedReport && mountedRef.current) {
        console.log(`[${loadId}] ✅ Found report in DataContext, using cached version`);
        const formattedReport: LabReport = {
          id: cachedReport.id,
          date: cachedReport.date,
          summary: cachedReport.summary,
          source: cachedReport.source,
          labResults: cachedReport.labResults,
        };
        setReport(formattedReport);
        setLoading(false);
        return;
      }

      console.log(`[${loadId}] ⚠️ Report not in cache, loading from database...`);
      console.log(`[${loadId}] 📥 Importing getLabReportById`);
      const { getLabReportById } = await import("@/utils/supabaseStorage");

      // Direct query with retry logic - handle network issues
      console.log(`[${loadId}] 🔄 Loading report directly from database`);
      const startTime = Date.now();
      
      let supabaseReport = null;
      let lastError = null;
      
      // Retry up to 1 time with shorter timeout
      for (let attempt = 1; attempt <= 1; attempt++) {
        try {
          const timeout = 10000; // 10s timeout
          console.log(`[${loadId}] 🔄 Attempt ${attempt}/1 with ${timeout}ms timeout`);
          
          supabaseReport = await Promise.race([
            getLabReportById(reportId),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Direct query timeout')), timeout)
            )
          ]);
          
          console.log(`[${loadId}] ✅ Report loaded on attempt ${attempt}`);
          break; // Success, exit loop
        } catch (err) {
          lastError = err;
          console.warn(`[${loadId}] ⚠️ Attempt ${attempt} failed:`, err instanceof Error ? err.message : String(err));
        }
      }
      
      if (!supabaseReport && lastError) {
        throw lastError;
      }

      const loadTime = Date.now() - startTime;

      console.log(`[${loadId}] ⏱️ Report loaded in ${loadTime}ms`, {
        hasReport: !!supabaseReport,
        reportId: supabaseReport?.id
      });

      if (supabaseReport && mountedRef.current) {
        console.log(`[${loadId}] 📋 Formatting report data...`, {
          id: supabaseReport.id,
          date: supabaseReport.date,
          source: supabaseReport.source,
          labResultsCount: supabaseReport.lab_results?.length || 0
        });

        const formattedReport: LabReport = {
          id: supabaseReport.id,
          date: supabaseReport.date,
          summary: supabaseReport.summary,
          source: supabaseReport.source,
          labResults: (supabaseReport.lab_results || []).map((result: any) => ({
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
        };

        console.log(`[${loadId}] 💾 Setting report state with ${formattedReport.labResults.length} lab results`);
        setReport(formattedReport);
        console.log(`[${loadId}] ✅ Report loaded successfully:`, formattedReport.id);
      } else if (!mountedRef.current) {
        console.log(`[${loadId}] 🚫 Component unmounted, skipping state update`);
      } else {
        console.log(`[${loadId}] ⚠️ No report found for reportId:`, reportId);
        setError(t("reportNotFound"));
      }
    } catch (error) {
      console.error(`[${loadId}] ❌ Error loading report:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        reportId
      });
      
      // User-friendly error messages in Arabic
      if (error instanceof Error && error.message.includes('timeout')) {
        setError("فشل تحميل التقرير - يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى");
      } else {
        setError("حدث خطأ في تحميل التقرير");
      }
    } finally {
      console.log(`[${loadId}] 🏁 Setting loading=false`);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>

        <LocalizedHeader
          title={t("labResults")}
          subtitle={t("loading")}
          showLogo={false}
          leading={
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >

              <Icon name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          }
        />
        <View style={styles.loadingContainer}>

          <ActivityIndicator size="large" color="#E91E63" />
          <Text style={styles.loadingText}>{t("loadingReport")}...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !report) {
    return (
      <SafeAreaView style={styles.container}>

        <LocalizedHeader
          title={t("labResults")}
          subtitle={t("error")}
          showLogo={false}
          leading={
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >

              <Icon name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          }
        />
        <View style={styles.errorContainer}>

          <Icon name="description" size={64} color="#E0E0E0" />
          <Text style={styles.errorText}>{error || t("reportNotFound")}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backToListButton}
          >

            <Text style={styles.backToListText}>{t("backToReports")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const abnormalResults = report.labResults.filter(
    (result) => result.isAbnormal,
  );

  return (
    <SafeAreaView style={styles.container}>

      <ModernHeader
        title={report.summary || t("reportSummaryTitle")}
        subtitle={`${t("date")}: ${formatDate(report.date)}`}
        showBackButton={true}
        onBackPress={() => router.back()}
        variant="compact"
        elevation={true}
        backgroundColor="#FFFFFF"
        textColor="#1A1A1A"
      />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.summaryCard}>

          <View style={styles.summaryHeader}>

            <Icon name="event" size={20} color="#E91E63" />
            <Text style={styles.summaryTitle}>
              {t("reportSummaryTitle")}
            </Text>
          </View>
          <Text style={styles.summaryText}>{report.summary}</Text>
          <View style={styles.summaryStats}>

            <View style={styles.summaryStatItem}>

              <Text style={styles.summaryStatValue}>
                {report.labResults.length}
              </Text>
              <Text style={styles.summaryStatLabel}>
                {t("totalTests")}
              </Text>
            </View>
            <View style={styles.summaryStatItem}>

              <Text
                style={[
                  styles.summaryStatValue,
                  abnormalResults.length > 0 && styles.abnormalStatValue,
                ]}
              >

                {abnormalResults.length}
              </Text>
              <Text style={styles.summaryStatLabel}>
                {t("abnormalResult")}
              </Text>
            </View>
            <View style={styles.summaryStatItem}>

              <Text style={styles.summaryStatValue}>

                {report.labResults.length - abnormalResults.length}
              </Text>
              <Text style={styles.summaryStatLabel}>
                {t("normalResult")}
              </Text>
            </View>
          </View>
          <View style={styles.sourceInfo}>

            <Text style={styles.sourceLabel}>{t("sourceLabel")}</Text>
            <Text
              style={[
                styles.sourceValue,
                {
                  color: report.source === "upload" ? "#4CAF50" : "#E91E63",
                },
              ]}
            >

              {report.source === "upload"
                ? t("uploadedDocument")
                : t("manualEntry")}
            </Text>
          </View>
        </View>
        <View style={styles.resultsSection}>

          <Text style={styles.sectionTitle}>{t("testResultsTitle")}</Text>
          {abnormalResults.length > 0 && (
            <View style={styles.abnormalAlert}>

              <Text style={styles.abnormalAlertText}>

                {`⚠️ ${abnormalResults.length} ${t("resultsOutsideNormalRange")}`}
              </Text>
            </View>
          )}
          {report.labResults.map((result) => (
            <LabResultCard key={result.id} result={result} />
          ))}
        </View>
      </ScrollView>
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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter-Bold",
    color: "#333333",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#666666",
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#666666",
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#666666",
    marginTop: 16,
    textAlign: "center",
  },
  backToListButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#E91E63",
    borderRadius: 12,
  },
  backToListText: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#FFFFFF",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    ...createShadowStyle({
      color: "#000",
      offset: { width: 0, height: 2 },
      opacity: 0.1,
      radius: 8,
      elevation: 4,
    }),
    borderWidth: 1,
    borderColor: "#F5F5F5",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#333333",
    marginLeft: 8,
  },
  summaryText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#666666",
    lineHeight: 24,
    marginBottom: 20,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
    marginBottom: 16,
  },
  summaryStatItem: {
    alignItems: "center",
  },
  summaryStatValue: {
    fontSize: 24,
    fontFamily: "Inter-Bold",
    color: "#333333",
  },
  abnormalStatValue: {
    color: "#FF6B6B",
  },
  summaryStatLabel: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#666666",
    marginTop: 4,
  },
  sourceInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  sourceLabel: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#666666",
    marginRight: 8,
  },
  sourceValue: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
  resultsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Inter-SemiBold",
    color: "#333333",
    marginBottom: 16,
  },
  abnormalAlert: {
    backgroundColor: "#FFF3E0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  abnormalAlertText: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    color: "#E65100",
  },
});