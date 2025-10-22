import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { processLabDocument, ExtractedLabData } from '@/utils/labProcessor';
import { t, isRTL, getCurrentLanguage } from '@/utils/i18n';

interface DocumentUploaderProps {
  onDataExtracted: (data: ExtractedLabData[], summary?: string, reportDate?: string) => void;
  onClose: () => void;
}

export default function DocumentUploader({ onDataExtracted, onClose }: DocumentUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('permissionRequired'),
          t('cameraPermissionNeeded')
        );
        return false;
      }
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.3,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        const asset = result.assets[0];
        if ((asset as any).size && (asset as any).size > 1_000_000) {
          Alert.alert(t('error'), t('fileTooLarge'));
          return;
        }
        await processDocument(asset.uri, 'image/jpeg');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(t('error'), t('failedToTakePhoto'));
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.3,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        const asset = result.assets[0];
        if ((asset as any).size && (asset as any).size > 1_000_000) {
          Alert.alert(t('error'), t('fileTooLarge'));
          return;
        }
        let mimeType = 'image/jpeg';
        if (asset.uri.toLowerCase().includes('.png')) {
          mimeType = 'image/png';
        }
        await processDocument(asset.uri, mimeType);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert(t('error'), t('failedToSelectImage'));
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        console.log('Document selected:', result.assets[0]);
        const asset = result.assets[0];
        if ((asset as any).size && (asset as any).size > 1_000_000) {
          Alert.alert(t('error'), t('fileTooLarge'));
          return;
        }

        let mimeType = asset.mimeType || 'application/pdf';
        if (!mimeType || mimeType === 'application/octet-stream') {
          if (asset.name?.toLowerCase().endsWith('.pdf')) {
            mimeType = 'application/pdf';
          } else if (asset.name?.toLowerCase().match(/\.(jpg|jpeg)$/)) {
            mimeType = 'image/jpeg';
          } else if (asset.name?.toLowerCase().endsWith('.png')) {
            mimeType = 'image/png';
          }
        }

        console.log('Processing document with MIME type:', mimeType);
        await processDocument(asset.uri, mimeType);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert(t('error'), t('failedToSelectDocument'));
    }
  };

  const processDocument = async (uri: string, mimeType?: string) => {
    console.log('Starting document processing for:', uri, 'MIME type:', mimeType);
    setIsProcessing(true);
    setProcessingStatus(t('analyzingDocument'));

    try {
      setProcessingStatus(t('extractingLabData') + '...');
      const result = await processLabDocument(uri, mimeType);

      if (result.success && result.data && result.data.length > 0) {
        setProcessingStatus(t('processingComplete'));
        console.log('Successfully extracted data:', result.data);
        onDataExtracted(result.data, result.summary, result.reportDate);
      } else {
        console.error('Processing failed:', result.error);
        let errorMessage = result.error || t('failedToExtractLabData');
        if (result.error?.includes('File too large')) {
          errorMessage = t('fileTooLarge');
        } else if (result.error?.includes('Too many requests')) {
          errorMessage = t('rateLimitExceeded');
        } else if (result.error?.includes('timeout')) {
          errorMessage = t('processingTimeout');
        } else if (result.error?.includes('Failed to parse')) {
          errorMessage = t('failedToParseAIResponse');
        } else if (result.error?.includes('No valid lab test results')) {
          errorMessage = t('noValidLabResults');
        } else if (result.error?.includes('No content received')) {
          errorMessage = t('noContentFromAI');
        }
        Alert.alert(t('error'), errorMessage);
      }
    } catch (error: unknown) {
      console.error('Document processing error:', error);
      let errorMessage = t('failedToProcessDocument');

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'طلب المعالجة استغرق وقتاً أطول من المعتاد. يرجى المحاولة مرة أخرى.';
        } else if (error.message?.includes('Failed to fetch')) {
          errorMessage = 'فشل في الاتصال بالخدمة. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.';
        } else if (error.message?.includes('AI service is temporarily overloaded') ||
                   error.message?.includes('503')) {
          errorMessage = 'الخدمة مشغولة حالياً. يرجى المحاولة بعد دقيقة واحدة.';
        } else if (error.message) {
           errorMessage = error.message
        }
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String((error as { message: string }).message);
      }

      Alert.alert(t('error'), errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };



  if (isProcessing) {
    return ( <View style={styles.processingContainer}> <ActivityIndicator size="large" color="#E91E63" /> <Text style={[styles.processingText, { textAlign: isRTL() ? 'right' : 'left' }]}>{processingStatus}</Text> <Text style={styles.processingSubtext}> {t('aiAnalyzingLabReport')} </Text> <Text style={styles.processingNote}> {t('processingTimeNote')} </Text> </View> );
  }

  return ( <View style={styles.container}> <View style={styles.header}> <Text style={[styles.title, { textAlign: isRTL() ? 'right' : 'left' }]}>{t('uploadLabReport')}</Text> <TouchableOpacity onPress={onClose} style={styles.closeButton}> <Icon name="close" size={20} color="#666666" /> </TouchableOpacity> </View> <Text style={styles.subtitle}> {t('uploadSubtitle')} </Text> <View style={styles.options}> <TouchableOpacity style={styles.option} onPress={takePhoto}> <View style={styles.optionIcon}> <Icon name="camera-alt" size={32} color="#E91E63" /> </View> <Text style={styles.optionTitle}>{t('takePhoto')}</Text> <Text style={styles.optionDescription}> {t('takePhotoDesc')} </Text> </TouchableOpacity> <TouchableOpacity style={styles.option} onPress={pickImage}> <View style={styles.optionIcon}> <Icon name="cloud-upload" size={32} color="#E91E63" /> </View> <Text style={styles.optionTitle}>{t('chooseImage')}</Text> <Text style={styles.optionDescription}> {t('chooseImageDesc')} </Text> </TouchableOpacity> <TouchableOpacity style={styles.option} onPress={pickDocument}> <View style={styles.optionIcon}> <Icon name="insert-drive-file" size={32} color="#E91E63" /> </View> <Text style={styles.optionTitle}>{t('uploadPDF')}</Text> <Text style={styles.optionDescription}> {t('uploadPDFDesc')} </Text> </TouchableOpacity> </View> <View style={styles.tips}> <Text style={styles.tipsTitle}>{t('extractionTips')}</Text> <Text style={styles.tip}>{t('tip1')}</Text> <Text style={styles.tip}>{t('tip2')}</Text> <Text style={styles.tip}>{t('tip3')}</Text> <Text style={styles.tip}>{t('tip4')}</Text> <Text style={styles.tip}>{t('tip5')}</Text> <Text style={styles.tip}>{t('tip6')}</Text> </View> <View style={styles.disclaimer}> <Text style={styles.disclaimerText}> ⚠️ {t('aiExtractionDisclaimer')} </Text> </View> </View> );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    writingDirection: isRTL() ? 'rtl' : 'ltr',
  },
  header: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    lineHeight: 24,
  },
  options: {
    padding: 20,
    gap: 16,
  },
  option: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#FFE8F1',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#333333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  tips: {
    margin: 20,
    padding: 16,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  tip: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#2E7D32',
    marginBottom: 4,
    lineHeight: 20,
  },
  disclaimer: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  disclaimerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E65100',
    lineHeight: 20,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 40,
  },
  processingText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#333333',
    marginTop: 20,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  processingNote: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#999999',
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});