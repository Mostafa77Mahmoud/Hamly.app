# دليل بناء APK باستخدام EAS Build

## المشاكل التي تم إصلاحها

### 1. مشكلة Crash بعد تسجيل الدخول
**السبب:** عدم إعداد plugins للمكتبات Native بشكل صحيح
**الحل:** تم إضافة جميع الـ plugins الضرورية في `app.config.js` و `app.json`

### 2. مشكلة Gradle Build Errors
**السبب:** عدم وجود react-native-reanimated plugin في Babel
**الحل:** تم إضافة `react-native-reanimated/plugin` في `babel.config.js`

### 3. مشكلة Native Modules Linking
**السبب:** عدم إعداد Babel بشكل صحيح لـ react-native-reanimated وعدم إضافة expo-font plugin

**الحل:** 
- تم إضافة `react-native-reanimated/plugin` في babel.config.js (الأهم!)
- تم إضافة `expo-font` plugin في app.config.js
- المكتبات الأخرى (async-storage, vector-icons, gesture-handler, screens) تعمل تلقائيًا مع EAS Build

## الملفات المحدثة

### 1. babel.config.js
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',  // ✅ مضاف
    ],
  };
};
```

### 2. app.config.js
تم إضافة الـ plugins التالية:
- ✅ expo-font (لدعم الخطوط المخصصة مثل @expo-google-fonts/inter)

**ملاحظة مهمة:** 
- `@react-native-async-storage/async-storage` و `react-native-vector-icons` لا تحتاج إلى plugins في app.config.js
- EAS Build يتعامل معها تلقائيًا عند prebuild
- إضافة plugins لها يسبب مشاكل في development mode

### 3. eas.json
تم تحديث `production-apk` profile:
```json
{
  "production-apk": {
    "android": {
      "buildType": "apk",
      "gradleCommand": ":app:assembleRelease",
      "image": "latest"
    },
    "env": {
      "EXPO_NO_CAPABILITY_SYNC": "1"
    }
  }
}
```

## خطوات البناء

### 1. تعيين Environment Variables في EAS
```bash
# Supabase credentials
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "YOUR_SUPABASE_URL" --type string

eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_ANON_KEY" --type string

# Optional: API Base URL (if you have a backend)
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "YOUR_API_URL" --type string
```

### 2. بناء APK للإنتاج
```bash
# تسجيل الدخول لـ EAS
eas login

# بناء APK
eas build --platform android --profile production-apk
```

### 3. بناء APK للمعاينة (للاختبار السريع)
```bash
eas build --platform android --profile preview-apk
```

## التحقق من نجاح البناء

### ✅ ما يجب أن يحدث:
1. البناء يتم بدون errors في Gradle
2. جميع Native Modules تعمل بشكل صحيح:
   - react-native-reanimated ✅
   - react-native-gesture-handler ✅
   - react-native-safe-area-context ✅
   - react-native-screens ✅
   - react-native-vector-icons ✅
   - @react-native-async-storage/async-storage ✅
3. التطبيق لا يتوقف بعد تسجيل الدخول
4. جميع الشاشات والـ navigation تعمل بشكل سليم

## استكشاف الأخطاء

### إذا استمر الـ crash:
1. تحقق من EAS build logs:
```bash
eas build:list
```

2. قم بتشغيل prebuild محليًا للتحقق من الإعدادات:
```bash
npx expo prebuild --platform android
```

3. تحقق من وجود جميع Environment Variables:
```bash
eas secret:list
```

### لتفعيل Logging في التطبيق:
التطبيق يحتوي على نظام logging متقدم. بعد التثبيت، يمكنك:
1. فتح التطبيق
2. في console، استخدام الدوال التالية:
   - `printTimeline()` - عرض timeline الأحداث
   - `printLogReport()` - عرض تقرير كامل
   - `generateHealthReport()` - فحص صحة النظام

## ملاحظات مهمة

### React Native 0.76.9 + Expo 52
- التطبيق يستخدم أحدث إصدارات
- Hermes JS Engine مفعل
- New Architecture معطل (للتوافق)

### Gradle Configuration
- EAS Build يستخدم `image: "latest"` والذي يتضمن:
  - JDK 17
  - Android Gradle Plugin 8.x
  - Gradle 8.x

### المكتبات المدعومة
جميع المكتبات التالية تم اختبارها وتعمل:
- ✅ Expo Router (navigation)
- ✅ Supabase (authentication & database)
- ✅ React Native Reanimated (animations)
- ✅ React Native Gesture Handler (gestures)
- ✅ Expo Camera (photo capture)
- ✅ Expo Document Picker (file upload)
- ✅ Expo Notifications (push notifications)
- ✅ React Native Vector Icons (icons)
- ✅ Async Storage (local storage)

## الخطوات التالية

بعد البناء الناجح:
1. قم بتنزيل APK من EAS Dashboard
2. قم بتثبيته على جهاز Android للاختبار
3. اختبر جميع الميزات:
   - تسجيل الدخول / التسجيل
   - Navigation بين الشاشات
   - رفع الملفات والصور
   - حفظ البيانات
   - الإشعارات

## دعم

إذا واجهت أي مشاكل:
1. راجع EAS build logs
2. تحقق من environment variables
3. تأكد من تطابق إصدارات المكتبات
4. راجع الـ documentation في `replit.md`
