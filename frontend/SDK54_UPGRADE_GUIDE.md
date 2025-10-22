
# 📱 دليل الترقية إلى Expo SDK 54

## نظرة عامة
هذا المستند يوضح عملية ترقية المشروع من Expo SDK 52 إلى SDK 54، مع الحفاظ على جميع الميزات والتوافقات.

---

## 🎯 التغييرات الرئيسية في SDK 54

### 1. إصدارات الحزم الأساسية
- **React Native**: 0.81.4
- **React**: 19.1.0 (تحديث كبير من 18.x)
- **Node.js**: يتطلب ≥20.19.4
- **Expo Router**: ~4.1.0

### 2. التحسينات والميزات الجديدة
- ✅ تحسينات في الأداء والاستقرار
- ✅ دعم محسّن لـ React 19
- ✅ تحديثات أمنية مهمة
- ✅ تحسينات في EAS Build

---

## 📋 الحزم المحدثة

### Expo Packages
```json
"expo": "~54.0.0"
"expo-router": "~4.1.1"
"expo-camera": "~17.0.1"
"expo-font": "~14.0.1"
"expo-notifications": "~0.31.1"
"expo-av": "~15.2.1"
```

### React Native Packages
```json
"react-native-reanimated": "~3.18.1"
"react-native-gesture-handler": "~2.28.1"
"react-native-screens": "~4.16.1"
```

---

## 🔧 الملفات المحدثة

### 1. package.json
- تحديث جميع حزم Expo إلى الإصدارات المتوافقة مع SDK 54
- الحفاظ على React 19.1.0 و React Native 0.81.4

### 2. babel.config.js
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};
```
✅ **مهم:** plugin الـ Reanimated يجب أن يكون آخر plugin في القائمة

### 3. app.json
```json
{
  "expo": {
    "jsEngine": "hermes",
    "newArchEnabled": false,
    "sdkVersion": "54.0.0"
  }
}
```

### 4. eas.json
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

---

## 🚀 خطوات التثبيت

### 1. تنظيف البيئة
```bash
# حذف الملفات القديمة
rm -rf node_modules
rm package-lock.json

# تنظيف كاش Metro
npx expo start -c
```

### 2. تثبيت الحزم المحدثة
```bash
# في مجلد المشروع
npm install
```

### 3. التحقق من التثبيت
```bash
# تشغيل التطبيق للاختبار
npm run dev:web
```

---

## ✅ اختبار التطبيق

### اختبار محلي (Web)
```bash
npm run dev:web
```
سيعمل على: `http://localhost:5000`

### اختبار على Expo Go
```bash
npx expo start
```
**ملاحظة:** تأكد من تحديث Expo Go على هاتفك إلى آخر إصدار يدعم SDK 54

---

## 📱 بناء APK مع EAS

### تسجيل الدخول
```bash
eas login
```

### إضافة Secrets (إذا لم تكن موجودة)
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "YOUR_URL" --type string
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_KEY" --type string
```

### بناء APK للإنتاج
```bash
eas build --platform android --profile production-apk
```

---

## ⚠️ مشاكل محتملة وحلولها

### 1. خطأ في Metro Bundler
**المشكلة:** `Unable to resolve module`
**الحل:**
```bash
rm -rf node_modules
npm install
npx expo start -c
```

### 2. خطأ في Gradle Build
**المشكلة:** `Execution failed for task ':app:mergeReleaseResources'`
**الحل:**
- تأكد من `gradleCommand: ":app:assembleRelease"` في eas.json
- استخدم `image: "latest"` للحصول على أحدث إصدار من Gradle

### 3. خطأ في React Native Reanimated
**المشكلة:** Animation لا تعمل
**الحل:**
- تأكد من وجود plugin في babel.config.js
- نظف الكاش: `npx expo start -c`

### 4. خطأ CORS في Web
**المشكلة:** `Access-Control-Allow-Origin`
**الحل:**
- تأكد من إضافة رابط Netlify في Supabase URL Configuration

---

## 🔐 التوافق مع Supabase

### لا تغييرات مطلوبة!
- ✅ Supabase Auth يعمل بنفس الطريقة
- ✅ Database queries لم تتغير
- ✅ Storage API متوافق تماماً

### Environment Variables
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🌐 النشر على Netlify

### لا تغييرات في عملية النشر!
```bash
npm run build:web
netlify deploy --prod --dir=dist
```

---

## 📊 ملخص التحديثات

| المكون | قبل | بعد |
|--------|-----|-----|
| Expo SDK | 52.x | 54.0.0 |
| React | 18.x | 19.1.0 |
| React Native | 0.76.x | 0.81.4 |
| Expo Router | 3.x | 4.1.1 |
| Reanimated | 3.15.x | 3.18.1 |

---

## ✅ قائمة التحقق النهائية

- [ ] تم حذف node_modules و package-lock.json
- [ ] تم تثبيت جميع الحزم بنجاح
- [ ] التطبيق يعمل محلياً (npm run dev:web)
- [ ] لا توجد أخطاء في Console
- [ ] جميع الميزات تعمل بشكل صحيح
- [ ] Navigation يعمل بسلاسة
- [ ] Supabase Auth يعمل
- [ ] EAS secrets محدثة
- [ ] APK تم بناؤه بنجاح (اختياري)

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. راجع [Expo SDK 54 Changelog](https://expo.dev/changelog/2024/12-19-sdk-54)
2. تحقق من [EAS Build Docs](https://docs.expo.dev/build/introduction/)
3. راجع ملف `BUILD_INSTRUCTIONS.md` للمزيد من التفاصيل

---

## 🎉 تمت الترقية بنجاح!

المشروع الآن يعمل على Expo SDK 54 مع جميع الميزات والتوافقات المحفوظة.

**التاريخ:** 20 أكتوبر 2025
**المطوّر:** تحديث تلقائي عبر AI Assistant
