import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExtractedLabData } from '@/utils/labProcessor';
import { t, isRTL } from '@/utils/i18n';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';

interface ExtractedDataReviewProps {
  extractedData: ExtractedLabData[];
  summary?: string;
  initialReportDate: string;
  onConfirm: (data: ExtractedLabData[], reportDate: string) => void;
  onCancel: () => void;
}

export default function ExtractedDataReview({
  extractedData,
  summary,
  initialReportDate,
  onConfirm,
  onCancel,
}: ExtractedDataReviewProps) {
  const [editingData, setEditingData] = useState<ExtractedLabData[]>(extractedData);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const updateTestData = (index: number, field: keyof ExtractedLabData, value: any) => {
    const updated = [...editingData];
    updated[index] = { ...updated[index], [field]: value };
    setEditingData(updated);
  };

  const removeTest = (index: number) => {
    Alert.alert(
      t('removeTestConfirm'),
      t('removeTestMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('removeTest'),
          style: 'destructive',
          onPress: () => {
            const updated = editingData.filter((_, i) => i !== index);
            setEditingData(updated);
          },
        },
      ]
    );
  };

  const handleConfirm = () => {
    onConfirm(editingData, initialReportDate);
  };

  const EditableTestCard = ({ test, index }: { test: ExtractedLabData; index: number }) => {
    const isEditing = editingIndex === index;

    if (isEditing) {
      return ( <Card> <View style={styles.editHeader}> <Text style={styles.editTitle}>{t('editingTestResult')}</Text> <TouchableOpacity onPress={() => setEditingIndex(null)}> <Ionicons name="checkmark" size={20} color="#E91E63" /> </TouchableOpacity> </View> <Input
            label={t('testName')}
            value={test.testName}
            onChangeText={(text) => updateTestData(index, 'testName', text)}
          /> <View style={styles.inputRow}> <Input
              label={t('value')}
              value={test.value}
              onChangeText={(text) => updateTestData(index, 'value', text)}
              containerStyle={{ flex: 1, ...(isRTL() ? { marginLeft: 8 } : { marginRight: 8 }) }}
            /> <Input
              label={t('unit')}
              value={test.unit}
              onChangeText={(text) => updateTestData(index, 'unit', text)}
              containerStyle={{ flex: 1, ...(isRTL() ? { marginRight: 8 } : { marginLeft: 8 }) }}
            /> </View> <Input
            label={t('referenceRange')}
            value={test.referenceRange}
            onChangeText={(text) => updateTestData(index, 'referenceRange', text)}
          /> <Input
            label={t('notes')}
            value={test.notes || ''}
            onChangeText={(text) => updateTestData(index, 'notes', text)}
            multiline
          /> {test.isAbnormal && ( <Input
              label={t('explanationAbnormal')}
              value={test.explanation || ''}
              onChangeText={(text) => updateTestData(index, 'explanation', text)}
              multiline
            /> )} <View style={styles.editActions}> <Button
              title={t('removeTest')}
              onPress={() => removeTest(index)}
              variant="danger"
              size="small"
            /> </View> </Card> );
    }

    return ( <Card> <View style={styles.testHeader}> <View style={styles.testInfo}> <Text style={styles.testName}>{test.testName}</Text> </View> <View style={styles.testActions}> {test.isAbnormal ? ( <View style={styles.abnormalBadge}> <Ionicons name="warning" size={16} color="#FF6B6B" /> <Text style={styles.abnormalText}>{t('abnormalResult')}</Text> </View> ) : ( <View style={styles.normalBadge}> <Ionicons name="checkmark-circle" size={16} color="#E91E63" /> <Text style={styles.normalText}>{t('normalResult')}</Text> </View> )} <TouchableOpacity onPress={() => setEditingIndex(index)}> <Ionicons name="create-outline" size={16} color="#666666" /> </TouchableOpacity> </View> </View> <View style={styles.testContent}> <View style={styles.valueContainer}> <Text style={[styles.value, test.isAbnormal && styles.abnormalValue]}> {`${test.value} ${test.unit}`} </Text> <Text style={styles.reference}>{`${t('referencePrefix')} ${test.referenceRange}`}</Text> </View> {test.notes && ( <Text style={styles.notes}>{test.notes}</Text> )}

          {test.isAbnormal && test.explanation && ( <View style={styles.explanation}> <Text style={styles.explanationText}>{test.explanation}</Text> </View> )} </View> </Card> );
  };

  return ( <View style={styles.container}> <View style={styles.header}> <Text style={styles.title}>{t('reviewExtractedData')}</Text> <TouchableOpacity onPress={onCancel}> <Ionicons name="close" size={24} color="#666666" /> </TouchableOpacity> </View> <ScrollView style={styles.content}> {summary && ( <Card style={styles.summaryCard}> <Text style={styles.summaryTitle}>{t('aiAnalysisSummary')}</Text> <Text style={styles.summaryText}>{summary}</Text> </Card> )} <Card style={styles.dateCard}> <View style={styles.dateHeader}> <Ionicons name="calendar" size={20} color="#E91E63" /> <Text style={styles.dateTitle}>{t('reportDate')}</Text> </View> <Text style={styles.dateDescription}> {t('reportDateDescription')} </Text> <Input
            label={t('reportDate')}
            value={initialReportDate}
            placeholder="YYYY-MM-DD"
            editable={false}
            style={styles.readOnlyInput}
          /> </Card> <Text style={styles.sectionTitle}> {`${t('extractedTestResults')} (${editingData.length})`} </Text> <Text style={styles.sectionSubtitle}> {t('reviewAndEdit')} </Text> {editingData.map((test, index) => ( <EditableTestCard key={index} test={test} index={index} /> ))} </ScrollView> <View style={styles.footer}> <Button
          title={t('cancel')}
          onPress={onCancel}
          variant="outlined"
          style={{ flex: 1, ...(isRTL() ? { marginLeft: 8 } : { marginRight: 8 }) }}
        /> <Button
          title={`${t('saveResults')} ${editingData.length} ${t('tests')}`}
          onPress={handleConfirm}
          style={{ flex: 1, ...(isRTL() ? { marginRight: 8 } : { marginLeft: 8 }) }}
        /> </View> </View> );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#333333',
    textAlign: isRTL() ? 'right' : 'left',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#E91E63',
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1976D2',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1976D2',
    lineHeight: 20,
  },
  dateCard: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  dateHeader: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#E65100',
    marginLeft: isRTL() ? 0 : 8,
    marginRight: isRTL() ? 8 : 0,
  },
  dateDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E65100',
    lineHeight: 20,
    marginBottom: 16,
    textAlign: isRTL() ? 'right' : 'left',
  },
  readOnlyInput: {
    backgroundColor: '#F5F5F5',
    color: '#666666',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#333333',
    marginTop: 24,
    marginBottom: 4,
    textAlign: isRTL() ? 'right' : 'left',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginBottom: 16,
    textAlign: isRTL() ? 'right' : 'left',
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  testInfo: {
    flex: 1,
    alignItems: isRTL() ? 'flex-end' : 'flex-start',
  },
  testName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#333333',
    textAlign: isRTL() ? 'right' : 'left',
  },
  testActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: isRTL() ? 'flex-start' : 'flex-end',
  },
  abnormalBadge: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  abnormalText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FF6B6B',
    marginLeft: isRTL() ? 0 : 4,
    marginRight: isRTL() ? 4 : 0,
    textAlign: 'center',
  },
  normalBadge: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  normalText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#E91E63',
    marginLeft: isRTL() ? 0 : 4,
    marginRight: isRTL() ? 4 : 0,
    textAlign: 'center',
  },
  testContent: {
    gap: 12,
  },
  valueContainer: {
    alignItems: isRTL() ? 'flex-end' : 'flex-start',
  },
  value: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#333333',
    textAlign: isRTL() ? 'right' : 'left',
  },
  abnormalValue: {
    color: '#FF6B6B',
  },
  reference: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginTop: 4,
    textAlign: isRTL() ? 'right' : 'left',
  },
  notes: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    fontStyle: 'italic',
    textAlign: isRTL() ? 'right' : 'left',
  },
  explanation: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: isRTL() ? 0 : 3,
    borderRightWidth: isRTL() ? 3 : 0,
    borderLeftColor: isRTL() ? 'transparent' : '#FF9800',
    borderRightColor: isRTL() ? '#FF9800' : 'transparent',
  },
  explanationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E65100',
    lineHeight: 20,
    textAlign: isRTL() ? 'right' : 'left',
  },
  editHeader: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#333333',
    textAlign: isRTL() ? 'right' : 'left',
  },
  inputRow: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
  },
  editActions: {
    alignItems: isRTL() ? 'flex-end' : 'flex-start',
    marginTop: 8,
  },
  footer: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});