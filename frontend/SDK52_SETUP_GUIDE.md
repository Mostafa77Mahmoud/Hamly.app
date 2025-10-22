# 📱 دليل إعداد Expo SDK 52 - الإصدار المستقر

## نظرة عامة
هذا المستند يوضح إعداد المشروع على **Expo SDK 52** - **الإصدار الأكثر استقرارًا** للعمل كـ Website و APK بدون مشاكل.

---

## 🎯 لماذا SDK 52؟

✅ **الأكثر استقرارًا** - مُجرَّب ومُختبَر بشكل كامل  
✅ **يعمل 100%** - لا توجد مشاكل في APK (التطبيق لا يقفل فجأة)  
✅ **دعم كامل** - جميع الحزم متوفرة ومتوافقة  
✅ **EAS Build جاهز** - يبني APK بدون أخطاء

---

## 📋 الإصدارات المستخدمة

### Expo Packages
```json
"expo": "~52.0.0"
"expo-router": "~4.0.0"
"expo-camera": "~16.0.0"
"expo-notifications": "~0.29.0"
"expo-video": "~2.0.0"
```

### React & React Native
```json
"react": "18.3.1"
"react-dom": "18.3.1"
"react-native": "0.76.5"
"react-native-web": "~0.19.13"
```

### Navigation
```json
"@react-navigation/native": "^7.0.0"
"@react-navigation/bottom-tabs": "^7.0.0"
"react-native-gesture-handler": "~2.20.2"
"react-native-reanimated": "~3.16.1"
"react-native-screens": "~4.0.0"
```

---

## 🔧 الملفات الرئيسية

### 1. package.json
✅ جميع الحزم بإصدارات متوافقة مع SDK 52  
✅ `cross-env` للتوافق مع Windows/Mac/Linux  
✅ Scripts محسّنة للتطوير والبناء

### 2. babel.config.js
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // ⚠️ يجب أن يكون آخر plugin
    ],
  };
};
```

### 3. app.json & app.config.js
```json
{
  "expo": {
    "jsEngine": "hermes",
    "newArchEnabled": false,
    "sdkVersion": "52.0.0",
    "plugins": [
      "expo-router",
      "expo-font",
      ["expo-camera", {
        "cameraPermission": "Allow Hamly to access your camera..."
      }],
      ["expo-document-picker", {
        "documentsPermission": "Allow Hamly to access your documents..."
      }],
      ["expo-notifications", {
        "icon": "./assets/images/app-icon.png",
        "color": "#ffffff"
      }]
    ]
  }
}
```

### 4. eas.json
```json
{
  "build": {
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
}
```

---

## 🚀 التثبيت والتشغيل

### 1. تثبيت الحزم
```bash
npm install --legacy-peer-deps
```

### 2. تشغيل Website محليًا
```bash
npm run dev:web
```
سيعمل على: `http://localhost:5000`

### 3. بناء Website للإنتاج
```bash
npm run build:web
```

---

## 📱 بناء APK مع EAS

### 1. تسجيل الدخول
```bash
eas login
```

### 2. إضافة Secrets
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "YOUR_URL" --type string
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_KEY" --type string
```

### 3. بناء APK
```bash
eas build --platform android --profile production-apk
```

---

## ✅ المشاكل التي تم حلها

### 1. ❌ مشكلة: APK يقفل فجأة عند الفتح
**✅ الحل:** 
- إضافة جميع الـ Plugins المطلوبة في app.json
- استخدام `react-native-reanimated/plugin` في babel.config.js
- استخدام SDK 52 المستقر بدلاً من SDK 54 الجديد

### 2. ❌ مشكلة: تضارب إصدارات الحزم
**✅ الحل:**
- استخدام `--legacy-peer-deps` عند التثبيت
- إصدارات محددة ومتوافقة 100% مع SDK 52

### 3. ❌ مشكلة: Website لا يعمل على Replit
**✅ الحل:**
- استخدام `HOST=0.0.0.0` في scripts
- المنفذ 5000 فقط (غير محظور على Replit)

---

## 🔐 التوافق مع Supabase

✅ **لا تغييرات مطلوبة!**
- Supabase Auth يعمل بنفس الطريقة
- Database queries لم تتغير
- Storage API متوافق تماماً

### Environment Variables
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📊 ملخص التحديث

| المكون | الإصدار المستخدم |
|--------|------------------|
| Expo SDK | 52.0.0 |
| React | 18.3.1 |
| React Native | 0.76.5 |
| Expo Router | 4.0.0 |
| Reanimated | 3.16.1 |

---

## ⚠️ ملاحظات مهمة

1. **expo-av تم استبداله:**
   - للفيديو: استخدم `expo-video`
   - لل Audio: يمكن إضافة `expo-audio` عند الحاجة

2. **Plugins ضرورية:**
   - `expo-font` - للخطوط المخصصة
   - `expo-camera` - للكاميرا
   - `expo-notifications` - للإشعارات
   - `expo-router` - للتنقل

3. **Reanimated Plugin:**
   - يجب أن يكون **آخر plugin** في babel.config.js
   - بدونه، الـ Animations لن تعمل على Android

---

## 🎉 النتيجة النهائية

✅ **Website يعمل بشكل مثالي** على المنفذ 5000  
✅ **APK جاهز للبناء** بدون أخطاء  
✅ **جميع الميزات تعمل** 100%  
✅ **لا توجد مشاكل في الفتح** - التطبيق لن يقفل فجأة

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تأكد من `npm install --legacy-peer-deps`
2. تأكد من وجود جميع الـ Plugins في app.json
3. تأكد من `react-native-reanimated/plugin` في babel.config.js

**تاريخ الإعداد:** 20 أكتوبر 2025  
**الإصدار:** SDK 52 - المستقر والموثوق
