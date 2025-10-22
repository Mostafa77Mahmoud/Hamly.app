import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "@/contexts/AuthContext";
import { t, isRTL } from "@/utils/i18n";
import { createShadowStyle } from "@/utils/shadowStyles";

type AuthMode = "signin" | "signup" | "reset";

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { signIn, signUp, resetPassword } = useAuth();

  const getErrorMessage = (error: any): string => {
    if (!error) return "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";

    const message = error.message || error.toString();
    const code = typeof error?.code === "string" ? error.code : null;

    console.log("Error details:", { message, code, error });

    // More specific authentication errors
    if (
      message.includes("Invalid login credentials") ||
      code === "invalid_credentials"
    ) {
      if (mode === "signin") {
        return "بيانات الدخول غير صحيحة\n\nأسباب محتملة:\n• البريد الإلكتروني غير صحيح\n• كلمة المرور خاطئة\n• الحساب غير مفعّل\n\nيرجى التحقق من البيانات أو إنشاء حساب جديد";
      }
    }
    if (
      message.includes("User not found") ||
      message.includes("user_not_found")
    ) {
      return "لم يتم العثور على الحساب\n\nهذا البريد الإلكتروني غير مسجل لدينا.\n\nيرجى:\n• التحقق من صحة البريد الإلكتروني\n• إنشاء حساب جديد إذا كانت هذه المرة الأولى";
    }
    if (
      message.includes("Invalid email") ||
      message.includes("invalid_email") ||
      message.includes("email_address_invalid")
    ) {
      return "البريد الإلكتروني غير صحيح\n\nيجب أن يكون البريد بالصيغة:\nexample@domain.com\n\nتحقق من:\n• عدم وجود مسافات\n• وجود @ و .\n• صحة اسم النطاق";
    }
    if (
      message.includes("Wrong password") ||
      message.includes("invalid_password")
    ) {
      return 'كلمة المرور خاطئة\n\nيرجى:\n• التأكد من صحة كلمة المرور\n• استخدام "نسيت كلمة المرور" إذا لزم الأمر\n• التحقق من حالة الأحرف (كبيرة/صغيرة)';
    }
    if (
      message.includes("Email not confirmed") ||
      code === "email_not_confirmed"
    ) {
      return "📧 يرجى تأكيد البريد الإلكتروني أولاً\n\n• تحقق من رسائل البريد الواردة\n• ابحث في مجلد الرسائل المرفوضة\n• قد يستغرق التأكيد بضع دقائق";
    }
    if (
      message.includes("User already registered") ||
      code === "user_already_exists"
    ) {
      return '👤 هذا الحساب مسجل بالفعل\n\n• استخدم "تسجيل الدخول" بدلاً من إنشاء حساب جديد\n• أو استخدم "نسيت كلمة المرور" إذا كنت تريد إعادة تعيينها';
    }
    if (
      message.includes("Password should be at least") ||
      code === "weak_password"
    ) {
      return "🔒 كلمة المرور ضعيفة جداً\n\n• يجب أن تكون 6 أحرف على الأقل\n• استخدم مزيج من الحروف والأرقام\n• تجنب كلمات المرور البسيطة";
    }
    if (
      message.includes("Invalid email") ||
      message.includes("invalid_email")
    ) {
      return "📧 صيغة البريد الإلكتروني غير صحيحة\n\n• تأكد من الصيغة: name@example.com\n• تحقق من عدم وجود مسافات زائدة\n• استخدم بريد إلكتروني صالح";
    }
    if (
      message.includes("Email already taken") ||
      message.includes("email_address_not_authorized")
    ) {
      return '📧 البريد الإلكتروني مستخدم بالفعل\n\n• جرب بريد إلكتروني آخر\n• أو سجل الدخول إذا كان لديك حساب\n• استخدم "نسيت كلمة المرور" إذا نسيتها';
    }
    if (
      message.includes("Network request failed") ||
      message.includes("timeout") ||
      message.includes("fetch")
    ) {
      return "🌐 مشكلة في الاتصال بالخادم\n\n• تأكد من اتصالك بالإنترنت\n• حاول مرة أخرى بعد قليل\n• إذا استمرت المشكلة، اتصل بالدعم";
    }
    if (message.includes("Too many requests") || code === "too_many_requests") {
      return "⏰ محاولات كثيرة جداً\n\n• انتظر 5-10 دقائق قبل المحاولة مرة أخرى\n• هذا إجراء أمني لحماية حسابك";
    }
    if (message.includes("signup_disabled") || code === "signup_disabled") {
      return "🚫 التسجيل غير متاح حالياً\n\n• الخدمة تحت الصيانة\n• حاول مرة أخرى لاحقاً\n• اتصل بفريق الدعم للمساعدة";
    }
    if (message.includes("email_change_confirm_invalid")) {
      return "📧 رابط التأكيد غير صالح\n\n• الرابط منتهي الصلاحية\n• اطلب رابط تأكيد جديد";
    }
    if (message.includes("password_reset_limit_exceeded")) {
      return "🔄 تم تجاوز حد طلبات إعادة التعيين\n\n• انتظر 15 دقيقة قبل المحاولة مرة أخرى\n• تحقق من بريدك الإلكتروني للرسائل السابقة";
    }

    // Fallback for unknown errors
    return `❌ حدث خطأ غير متوقع\n\nتفاصيل الخطأ: ${message}\n\nيرجى المحاولة مرة أخرى أو الاتصال بالدعم`;
  };

  // Enhanced validation functions
  const validateEmail = (
    email: string,
  ): { isValid: boolean; error?: string } => {
    if (!email.trim()) {
      return { isValid: false, error: "يرجى إدخال عنوان البريد الإلكتروني" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return {
        isValid: false,
        error: "صيغة البريد الإلكتروني غير صحيحة\nمثال: user@example.com",
      };
    }

    if (email.length > 254) {
      return { isValid: false, error: "البريد الإلكتروني طويل جداً" };
    }

    return { isValid: true };
  };

  const validatePassword = (
    password: string,
  ): { isValid: boolean; error?: string } => {
    if (!password.trim()) {
      return { isValid: false, error: "يرجى إدخال كلمة المرور" };
    }

    if (password.length < 6) {
      return {
        isValid: false,
        error: "كلمة المرور قصيرة جداً\nيجب أن تكون 6 أحرف على الأقل",
      };
    }

    if (password.length > 72) {
      return {
        isValid: false,
        error: "كلمة المرور طويلة جداً\nيجب أن تكون أقل من 72 حرف",
      };
    }

    return { isValid: true };
  };

  const validateFullName = (
    name: string,
  ): { isValid: boolean; error?: string } => {
    if (!name.trim()) {
      return { isValid: false, error: "يرجى إدخال الاسم الكامل" };
    }

    if (name.trim().length < 2) {
      return {
        isValid: false,
        error: "الاسم قصير جداً\nيجب أن يكون حرفين على الأقل",
      };
    }

    if (name.length > 100) {
      return { isValid: false, error: "الاسم طويل جداً" };
    }

    return { isValid: true };
  };

  const handleSubmit = async () => {
    setError("");
    setSuccessMessage("");

    // Enhanced validation with better error messages
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error!);
      return;
    }

    if (mode === "reset") {
      setLoading(true);
      try {
        const { error } = await resetPassword(email);
        setLoading(false);

        if (error) {
          console.error("Reset password error:", error);
          setError(getErrorMessage(error));
        } else {
          setSuccessMessage(
            "تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني\n\nتحقق من صندوق الوارد والرسائل المرفوضة",
          );
          setTimeout(() => {
            setMode("signin");
            setSuccessMessage("");
          }, 3000);
        }
      } catch (error) {
        setLoading(false);
        console.error("Reset password exception:", error);
        setError(getErrorMessage(error));
      }
      return;
    }

    if (mode === "signup") {
      const nameValidation = validateFullName(fullName);
      if (!nameValidation.isValid) {
        setError(nameValidation.error!);
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setError(passwordValidation.error!);
        return;
      }
    } else if (mode === "signin") {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setError(passwordValidation.error!);
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        console.log("Starting signup process...");
        const { error } = await signUp(email, password, fullName);

        if (error) {
          console.error("Signup failed:", error);
          setError(getErrorMessage(error));
        } else {
          console.log("Signup successful");
          setSuccessMessage(
            "تم إنشاء الحساب بنجاح!\n\nتحقق من بريدك الإلكتروني لتفعيل الحساب",
          );
          setTimeout(() => {
            setMode("signin");
            setSuccessMessage("");
          }, 3000);
        }
      } else {
        console.log("Starting signin process...");
        const { error } = await signIn(email, password);

        if (error) {
          console.error("Signin failed:", error);
          setError(getErrorMessage(error));
        } else {
          console.log(
            "Signin successful - user will be redirected automatically",
          );
          setSuccessMessage("تم تسجيل الدخول بنجاح!");
        }
      }
    } catch (error) {
      console.error("Auth process exception:", error);
      setError(getErrorMessage(error));
    }

    setLoading(false);
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setShowPassword(false);
    setError("");
    setSuccessMessage("");
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  // Clear error when user starts typing
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (error) setError("");
    if (successMessage) setSuccessMessage("");
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (error) setError("");
    if (successMessage) setSuccessMessage("");
  };

  const handleNameChange = (value: string) => {
    setFullName(value);
    if (error) setError("");
    if (successMessage) setSuccessMessage("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>H</Text>
              </View>
            </View>
            <Text style={styles.title}>
              {mode === "signin"
                ? "مرحباً بعودتك"
                : mode === "signup"
                  ? "إنشاء حساب جديد"
                  : "إعادة تعيين كلمة المرور"}
            </Text>
            <Text style={styles.subtitle}>
              {mode === "signin"
                ? "سجلي دخولك لمتابعة رحلة حملك"
                : mode === "signup"
                  ? "انضمي إلى آلاف الأمهات المنتظرات"
                  : "أدخلي بريدك الإلكتروني لإعادة تعيين كلمة المرور"}
            </Text>
          </View>
          <View style={styles.form}>
            {mode === "signup" && (
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Icon
                    name="person"
                    size={20}
                    color="#666666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="الاسم الكامل"
                    value={fullName}
                    onChangeText={handleNameChange}
                    autoCapitalize="words"
                    textContentType="name"
                  />
                </View>
              </View>
            )}<View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Icon
                  name="email"
                  size={20}
                  color="#666666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="البريد الإلكتروني"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                />
              </View>
            </View>{mode !== "reset" && (
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Icon
                    name="lock"
                    size={20}
                    color="#666666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="كلمة المرور"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!showPassword}
                    textContentType="password"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <Icon name="visibility-off" size={20} color="#666666" />
                    ) : (
                      <Icon name="visibility" size={20} color="#666666" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {/* Error Message Display */}
            {error ? (
              <View style={styles.messageContainer}>
                <View style={styles.errorContainer}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              </View>
            ) : null}
            {/* Success Message Display */}
            {successMessage ? (
              <View style={styles.messageContainer}>
                <View style={styles.successContainer}>
                  <Text style={styles.successIcon}>✅</Text>
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              </View>
            ) : null}
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === "signin"
                    ? "تسجيل الدخول"
                    : mode === "signup"
                      ? "إنشاء الحساب"
                      : "إعادة تعيين كلمة المرور"}
                </Text>
              )}
            </TouchableOpacity>
            {mode === "signin" && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => switchMode("reset")}
              >
                <Text style={styles.linkText}>نسيت كلمة المرور؟</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.footer}>
            {mode === "signin" ? (
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>ليس لديك حساب؟ </Text>
                <TouchableOpacity onPress={() => switchMode("signup")}>
                  <Text style={styles.footerLink}>سجلي الآن</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>لديك حساب بالفعل؟ </Text>
                <TouchableOpacity onPress={() => switchMode("signin")}>
                  <Text style={styles.footerLink}>تسجيل الدخول</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    paddingBottom: Platform.OS === "android" ? 100 : 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E91E63",
    alignItems: "center",
    justifyContent: "center",
    ...createShadowStyle({
      color: "#E91E63",
      offset: { width: 0, height: 4 },
      opacity: 0.3,
      radius: 8,
      elevation: 8,
    }),
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1A1A1A",
  },
  eyeIcon: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: "#E91E63",
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    ...createShadowStyle({
      color: "#E91E63",
      offset: { width: 0, height: 2 },
      opacity: 0.2,
      radius: 4,
      elevation: 4,
    }),
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  linkButton: {
    alignItems: "center",
    marginTop: 16,
    padding: 8,
  },
  linkText: {
    color: "#E91E63",
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#666666",
  },
  footerLink: {
    fontSize: 14,
    color: "#E91E63",
    fontWeight: "600",
  },
  messageContainer: {
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: "row",
    backgroundColor: "#FFE6E6",
    borderColor: "#FF6B6B",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "flex-start",
  },
  errorIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#C62828",
    lineHeight: 20,
    textAlign: "right",
    fontWeight: "500",
  },
  successContainer: {
    flexDirection: "row",
    backgroundColor: "#E8F5E8",
    borderColor: "#E91E63",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "flex-start",
  },
  successIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: "#2E7D32",
    lineHeight: 20,
    textAlign: "right",
    fontWeight: "500",
  },
});
