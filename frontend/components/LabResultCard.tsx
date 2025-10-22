import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Card from '@/components/Card';
import { LabResult } from '@/types';
import { t, isRTL } from '@/utils/i18n';

interface LabResultCardProps {
  result: LabResult;
}

export default function LabResultCard({ result }: LabResultCardProps) {
  const renderExplanationBullets = (explanation: string) => {
    // Split explanation by newlines and filter out empty lines
    const lines = explanation.split('\n').filter(line => line.trim().length > 0);

    return lines.map((line, index) => {
      // Remove existing bullet points or dashes at the start of lines
      const cleanLine = line.replace(/^[\s]*[-•*]\s*/, '').trim();

      if (cleanLine.length === 0) return null;

      return ( <View key={index} style={styles.bulletPoint}> <Text style={styles.bullet}>•</Text> <Text style={styles.bulletText}>{cleanLine}</Text> </View> );
    }).filter((item): item is React.JSX.Element => item !== null);
  };

  return ( <Card isAlert={result.isAbnormal}> <View style={styles.cardHeader}> <View style={styles.testInfo}> <Text style={styles.testName}>{result.testName}</Text> </View> {result.isAbnormal && ( <View style={styles.alertBadge}> <Icon name="warning" size={16} color="#FF6B6B" /> <Text style={styles.alertText}>{t('abnormalResult').toUpperCase()}</Text> </View> )} </View> <View style={styles.cardContent}> <View style={styles.valueContainer}> <Text style={[styles.value, result.isAbnormal && styles.abnormalValue]}> {`${result.value} ${result.unit}`} </Text> <Text style={styles.reference}>{`${t('referencePrefix')} ${result.referenceRange}`}</Text> </View> {result.notes && ( <Text style={styles.notes}>{result.notes}</Text> )}

        {result.isAbnormal && result.explanation && ( <View style={styles.explanation}> <Text style={styles.explanationTitle}>{t('whatThisMeans')}</Text> <View style={styles.bulletContainer}> {renderExplanationBullets(result.explanation)} </View> </View> )} </View> </Card> );
}

const styles = StyleSheet.create({
  cardHeader: {
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
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    justifyContent: 'center',
    alignSelf: isRTL() ? 'flex-start' : 'flex-end',
  },
  alertText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FF6B6B',
    marginLeft: isRTL() ? 0 : 4,
    marginRight: isRTL() ? 4 : 0,
    textAlign: 'center',
  },
  cardContent: {
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
  explanationTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#E65100',
    marginBottom: 8,
    textAlign: isRTL() ? 'right' : 'left',
  },
  bulletContainer: {
    gap: 6,
  },
  bulletPoint: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#E65100',
    marginRight: isRTL() ? 0 : 8,
    marginLeft: isRTL() ? 8 : 0,
    marginTop: 2,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E65100',
    lineHeight: 20,
    textAlign: isRTL() ? 'right' : 'left',
  },
});