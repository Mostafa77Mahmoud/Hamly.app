
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isResetting: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isResetting: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isResetting: false };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ [ERROR_BOUNDARY] Error caught:', error);
    console.error('❌ [ERROR_BOUNDARY] Error info:', errorInfo);
    
    // Clear potentially corrupted session data
    try {
      await AsyncStorage.removeItem('hamlymd-auth-token');
      console.log('🧹 [ERROR_BOUNDARY] Cleared potentially corrupted session');
    } catch (clearError) {
      console.error('❌ [ERROR_BOUNDARY] Failed to clear session:', clearError);
    }
  }

  handleReset = async () => {
    this.setState({ isResetting: true });
    
    try {
      // Clear corrupted session first (most critical)
      try {
        await AsyncStorage.removeItem('hamlymd-auth-token');
        console.log('🧹 [ERROR_BOUNDARY] Cleared auth token');
      } catch (e) {
        console.warn('⚠️ Could not clear auth token:', e);
      }

      // Clear all storage to reset app state
      await AsyncStorage.clear();
      console.log('🧹 [ERROR_BOUNDARY] Cleared all storage');
      
      // Reload the app
      if (Platform.OS === 'web') {
        // Web: use window.location.reload
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      } else {
        // Native: use Expo Updates to reload
        try {
          await Updates.reloadAsync();
        } catch (updateError) {
          // Fallback: reset state only
          console.warn('⚠️ [ERROR_BOUNDARY] Could not reload app, resetting state only');
          this.setState({ hasError: false, error: undefined, isResetting: false });
        }
      }
    } catch (error) {
      console.error('❌ [ERROR_BOUNDARY] Failed to reset:', error);
      // Fallback: just reset state
      this.setState({ hasError: false, error: undefined, isResetting: false });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>حدث خطأ غير متوقع</Text>
          <Text style={styles.titleEn}>Something went wrong</Text>
          <Text style={styles.message}>
            نعتذر عن هذا الخطأ. سيتم إعادة تشغيل التطبيق وتنظيف البيانات المؤقتة
          </Text>
          <Text style={styles.messageEn}>
            Sorry for the inconvenience. The app will restart and clear temporary data
          </Text>
          {this.state.error && (
            <Text style={styles.errorDetails}>
              {this.state.error.message}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.button, this.state.isResetting && styles.buttonDisabled]}
            onPress={this.handleReset}
            disabled={this.state.isResetting}
          >
            <Text style={styles.buttonText}>
              {this.state.isResetting ? 'جاري إعادة التشغيل...' : 'إعادة تشغيل التطبيق'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleEn: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  messageEn: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorDetails: {
    fontSize: 12,
    color: '#C62828',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
