import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { Plus, ChevronDown, Calendar } from "lucide-react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  getActivePregnancy,
  getPregnancies,
  createPregnancy,
  updatePregnancy,
  setActivePregnancy as setSupabaseActivePregnancy,
} from "@/utils/supabaseStorage";
import { Pregnancy } from "@/types";
import { calculateGestationalAge, calculateDueDate } from "@/utils/pregnancy";
import { t, isRTL } from "@/utils/i18n";
import { createShadowStyle } from "@/utils/shadowStyles";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Input from "@/components/Input";

interface PregnancySelectorProps {
  onPregnancyChange?: (pregnancy: Pregnancy | null) => void;
}

export default function PregnancySelector({
  onPregnancyChange,
}: PregnancySelectorProps) {
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([]);
  const [activePregnancy, setActivePregnancy] = useState<Pregnancy | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPregnancy, setNewPregnancy] = useState({
    name: "",
    lastMenstrualPeriod: "",
    notes: "",
  });

  useEffect(() => {
    loadPregnancyData();
  }, []);

  const loadPregnancyData = async () => {
    try {
      const [pregnanciesData, activePregnancyData] = await Promise.all([
        getPregnancies(),
        getActivePregnancy(),
      ]);

      if (pregnanciesData) {
        const formattedPregnancies = pregnanciesData.map((p) => ({
          id: p.id,
          name: p.name,
          lastMenstrualPeriod: p.last_menstrual_period,
          dueDate: p.due_date,
          isActive: p.is_active,
          createdAt: p.created_at,
          notes: p.notes || undefined,
        }));

        setPregnancies(formattedPregnancies);

        if (activePregnancyData) {
          const formattedActive = {
            id: activePregnancyData.id,
            name: activePregnancyData.name,
            lastMenstrualPeriod: activePregnancyData.last_menstrual_period,
            dueDate: activePregnancyData.due_date,
            isActive: activePregnancyData.is_active,
            createdAt: activePregnancyData.created_at,
            notes: activePregnancyData.notes || undefined,
          };
          setActivePregnancy(formattedActive);
          onPregnancyChange?.(formattedActive);
        }
      }
    } catch (error) {
      console.error("Error loading pregnancy data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addPregnancy = async () => {
    if (!newPregnancy.name.trim()) {
      Alert.alert(t("error"), "Please enter a name for this pregnancy");
      return;
    }

    if (!newPregnancy.lastMenstrualPeriod) {
      Alert.alert(t("error"), "Please enter the Last Menstrual Period date");
      return;
    }

    const lmpDate = new Date(newPregnancy.lastMenstrualPeriod);
    if (isNaN(lmpDate.getTime())) {
      Alert.alert(
        t("error"),
        "Please enter a valid Last Menstrual Period date",
      );
      return;
    }

    try {
      const pregnancyData = await createPregnancy({
        name: newPregnancy.name.trim(),
        last_menstrual_period: newPregnancy.lastMenstrualPeriod,
        due_date: calculateDueDate(newPregnancy.lastMenstrualPeriod),
        is_active: pregnancies.length === 0,
        notes: newPregnancy.notes.trim() || null,
      });

      const pregnancy: Pregnancy = {
        id: pregnancyData.id,
        name: pregnancyData.name,
        lastMenstrualPeriod: pregnancyData.last_menstrual_period,
        dueDate: pregnancyData.due_date,
        isActive: pregnancyData.is_active,
        createdAt: pregnancyData.created_at,
        notes: pregnancyData.notes || undefined,
      };

      setPregnancies([pregnancy, ...pregnancies]);

      if (pregnancies.length === 0) {
        setActivePregnancy(pregnancy);
        await setSupabaseActivePregnancy(pregnancy.id);
        onPregnancyChange?.(pregnancy);
      }

      resetForm();
      setModalVisible(false);

      Alert.alert(
        t("success"),
        `Pregnancy "${pregnancy.name}" has been added successfully!`,
        [{ text: t("ok") }],
      );
    } catch (error) {
      console.error("Error adding pregnancy:", error);
      Alert.alert(t("error"), "Failed to add pregnancy. Please try again.");
    }
  };

  const switchPregnancy = async (pregnancy: Pregnancy) => {
    try {
      await setSupabaseActivePregnancy(pregnancy.id);

      const updatedPregnancy = { ...pregnancy, isActive: true };
      const updatedPregnancies = pregnancies.map((p) => ({
        ...p,
        isActive: p.id === pregnancy.id,
      }));

      setPregnancies(updatedPregnancies);
      setActivePregnancy(updatedPregnancy);
      onPregnancyChange?.(updatedPregnancy);
    } catch (error) {
      console.error("Error switching pregnancy:", error);
      Alert.alert(t("error"), "Failed to switch pregnancy. Please try again.");
    }
  };

  const resetForm = () => {
    setNewPregnancy({
      name: "",
      lastMenstrualPeriod: "",
      notes: "",
    });
  };

  const getGestationalInfo = (pregnancy: Pregnancy) => {
    const gestationalAge = calculateGestationalAge(
      pregnancy.lastMenstrualPeriod,
    );
    return `${gestationalAge.weeks} ${t("weeks")}, ${gestationalAge.days} ${t("days")}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {" "}
        <Text style={styles.loadingText}>{t("loading")}...</Text>{" "}
      </View>
    );
  }

  return (
    <>
      {" "}
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        {" "}
        <View style={styles.selectorContent}>
          {" "}
          <Icon name="pregnant-woman" size={20} color="#E91E63" />{" "}
          <View style={styles.selectorInfo}>
            {" "}
            {activePregnancy ? (
              <>
                {" "}
                <Text style={styles.selectorTitle}>
                  {activePregnancy.name}
                </Text>{" "}
                <Text style={styles.selectorSubtitle}>
                  {" "}
                  {getGestationalInfo(activePregnancy)}{" "}
                </Text>{" "}
              </>
            ) : (
              <>
                {" "}
                <Text style={styles.selectorTitle}>
                  {t("selectPregnancy")}
                </Text>{" "}
                <Text style={styles.selectorSubtitle}>
                  {t("noActivePregnancy")}
                </Text>{" "}
              </>
            )}{" "}
          </View>{" "}
          <ChevronDown size={20} color="#666666" />{" "}
        </View>{" "}
      </TouchableOpacity>{" "}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {" "}
        <View style={styles.modalOverlay}>
          {" "}
          <View style={styles.modalContent}>
            {" "}
            <View style={styles.modalHeader}>
              {" "}
              <Text style={styles.modalTitle}>
                {t("managePregnancies")}
              </Text>{" "}
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                {" "}
                <Text style={styles.closeButton}>✕</Text>{" "}
              </TouchableOpacity>{" "}
            </View>{" "}
            <ScrollView style={styles.modalBody}>
              {" "}
              {pregnancies.length > 0 && (
                <View style={styles.section}>
                  {" "}
                  <Text style={styles.sectionTitle}>
                    {t("existingPregnancies")}
                  </Text>{" "}
                  {pregnancies.map((pregnancy) => (
                    <TouchableOpacity
                      key={pregnancy.id}
                      style={[
                        styles.pregnancyCard,
                        pregnancy.isActive && styles.activePregnancyCard,
                      ]}
                      onPress={() => switchPregnancy(pregnancy)}
                    >
                      {" "}
                      <View style={styles.pregnancyInfo}>
                        {" "}
                        <Text
                          style={[
                            styles.pregnancyName,
                            pregnancy.isActive && styles.activePregnancyName,
                          ]}
                        >
                          {" "}
                          {pregnancy.name}{" "}
                        </Text>{" "}
                        <Text style={styles.pregnancyDetails}>
                          {" "}
                          {getGestationalInfo(pregnancy)}{" "}
                        </Text>{" "}
                        <Text style={styles.pregnancyDate}>
                          {" "}
                          {t("due")}:{" "}
                          {new Date(
                            pregnancy.dueDate,
                          ).toLocaleDateString()}{" "}
                        </Text>{" "}
                      </View>{" "}
                      {pregnancy.isActive && (
                        <View style={styles.activeBadge}>
                          {" "}
                          <Text style={styles.activeBadgeText}>
                            {t("active")}
                          </Text>{" "}
                        </View>
                      )}{" "}
                    </TouchableOpacity>
                  ))}{" "}
                </View>
              )}{" "}
              <View style={styles.section}>
                {" "}
                <Text style={styles.sectionTitle}>
                  {t("addNewPregnancy")}
                </Text>{" "}
                <Input
                  label={t("pregnancyName")}
                  value={newPregnancy.name}
                  onChangeText={(text) =>
                    setNewPregnancy({ ...newPregnancy, name: text })
                  }
                  placeholder={t("pregnancyNamePlaceholder")}
                  required
                />{" "}
                <Input
                  label={t("lmp")}
                  value={newPregnancy.lastMenstrualPeriod}
                  onChangeText={(text) =>
                    setNewPregnancy({
                      ...newPregnancy,
                      lastMenstrualPeriod: text,
                    })
                  }
                  placeholder="YYYY-MM-DD"
                  required
                />{" "}
                <Input
                  label={t("notes")}
                  value={newPregnancy.notes}
                  onChangeText={(text) =>
                    setNewPregnancy({ ...newPregnancy, notes: text })
                  }
                  placeholder={t("pregnancyNotesPlaceholder")}
                  multiline
                />{" "}
                <View style={styles.infoBox}>
                  {" "}
                  <Calendar size={16} color="#E91E63" />{" "}
                  <Text style={styles.infoText}>
                    {" "}
                    {t("dueDateCalculation")}{" "}
                  </Text>{" "}
                </View>{" "}
              </View>{" "}
            </ScrollView>{" "}
            <View style={styles.modalFooter}>
              {" "}
              <Button
                title={t("cancel")}
                onPress={() => setModalVisible(false)}
                variant="outlined"
                style={{
                  flex: 1,
                  ...(isRTL() ? { marginLeft: 8 } : { marginRight: 8 }),
                }}
              />{" "}
              <Button
                title={t("addPregnancy")}
                onPress={addPregnancy}
                style={{
                  flex: 1,
                  ...(isRTL() ? { marginRight: 8 } : { marginLeft: 8 }),
                }}
              />{" "}
            </View>{" "}
          </View>{" "}
        </View>{" "}
      </Modal>{" "}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 16,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#666666",
  },
  selector: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    ...createShadowStyle({
      color: "#000",
      offset: { width: 0, height: 2 },
      opacity: 0.1,
      radius: 4,
      elevation: 3,
    }),
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  selectorContent: {
    flexDirection: isRTL() ? "row-reverse" : "row",
    alignItems: "center",
  },
  selectorInfo: {
    flex: 1,
    marginLeft: isRTL() ? 0 : 12,
    marginRight: isRTL() ? 12 : 0,
    alignItems: isRTL() ? "flex-end" : "flex-start",
  },
  selectorTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#333333",
    textAlign: isRTL() ? "right" : "left",
  },
  selectorSubtitle: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#666666",
    marginTop: 2,
    textAlign: isRTL() ? "right" : "left",
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
    flexDirection: isRTL() ? "row-reverse" : "row",
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
    textAlign: isRTL() ? "right" : "left",
  },
  closeButton: {
    fontSize: 24,
    color: "#666666",
    padding: 4,
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#333333",
    marginBottom: 16,
    textAlign: isRTL() ? "right" : "left",
  },
  pregnancyCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
    flexDirection: isRTL() ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activePregnancyCard: {
    backgroundColor: "#FFE8F1",
    borderColor: "#E91E63",
  },
  pregnancyInfo: {
    flex: 1,
    alignItems: isRTL() ? "flex-end" : "flex-start",
  },
  pregnancyName: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#333333",
    textAlign: isRTL() ? "right" : "left",
  },
  activePregnancyName: {
    color: "#E91E63",
  },
  pregnancyDetails: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#666666",
    marginTop: 4,
    textAlign: isRTL() ? "right" : "left",
  },
  pregnancyDate: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#999999",
    marginTop: 2,
    textAlign: isRTL() ? "right" : "left",
  },
  activeBadge: {
    backgroundColor: "#E91E63",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
    color: "#FFFFFF",
  },
  infoBox: {
    flexDirection: isRTL() ? "row-reverse" : "row",
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
    marginLeft: isRTL() ? 0 : 8,
    marginRight: isRTL() ? 8 : 0,
    flex: 1,
    lineHeight: 20,
    textAlign: isRTL() ? "right" : "left",
  },
  modalFooter: {
    flexDirection: isRTL() ? "row-reverse" : "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
});
