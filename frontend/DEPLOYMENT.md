
# 🚀 دليل النشر الكامل - HamlyMD

## 📋 قبل النشر - تحقق من الإعدادات

### 1. تأكد من Environment Variables

في ملف `.env` (للتطوير المحلي):
```env
EXPO_PUBLIC_SUPABASE_URL=https://uzhtruxyzxtqappavqhr.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aHRydXh5enh0cWFwcGF2cWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MjE4NjcsImV4cCI6MjA3MzQ5Nzg2N30.7GtsyCg09d0rtl-iDPTKXm8FkbtObJR1HN7Q3nIGC6c
EXPO_PUBLIC_API_URL=https://al-mugwumpian-patience.ngrok-free.dev
EXPO_PUBLIC_API_BASE_URL=https://al-mugwumpian-patience.ngrok-free.dev
```

---

## 🌐 النشر على Netlify (كموقع إلكتروني)

### الطريقة 1: النشر من Replit مباشرة

#### الخطوات:

**1. تثبيت Netlify CLI:**
```bash
npm install -g netlify-cli
```

**2. تسجيل الدخول:**
```bash
netlify login
```

**3. بناء المشروع:**
```bash
cd frontend
npm run build:web
```

**4. النشر:**
```bash
netlify deploy --prod --dir=dist
```

**5. اتبع التعليمات:**
- اختر "Create & configure a new site"
- اختار Team
- اختار Site name (أو اترك فارغ لاسم عشوائي)

✅ **بعد النشر مباشرة:**

سيظهر لك رابط الموقع مثل: `https://your-site.netlify.app`

---

### الطريقة 2: الربط مع GitHub (Automatic Deployment)

#### الخطوات:

**1. ادفع الكود على GitHub:**
```bash
git add .
git commit -m "Ready for Netlify deployment"
git push origin main
```

**2. في Netlify Dashboard:**
- اذهب إلى [app.netlify.com](https://app.netlify.com)
- اضغط "Add new site" → "Import an existing project"
- اختر GitHub
- اختر الريبو الخاص بك

**3. إعدادات البناء (Build Settings):**
```
Base directory: frontend
Build command: npm run build:web
Publish directory: frontend/dist
```

**4. إضافة Environment Variables:**

اضغط "Advanced build settings" وأضف:

| Key | Value |
|-----|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://uzhtruxyzxtqappavqhr.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `EXPO_PUBLIC_API_URL` | `https://al-mugwumpian-patience.ngrok-free.dev` |
| `EXPO_PUBLIC_API_BASE_URL` | `https://al-mugwumpian-patience.ngrok-free.dev` |
| `NODE_VERSION` | `20` |

**5. اضغط "Deploy site"**

✅ **النتيجة:** كل مرة تعمل Push على GitHub، Netlify هينشر تلقائياً!

---

### 🔧 بعد النشر على Netlify - إعداد Supabase

**مهم جداً:** لازم تضيف رابط Netlify في Supabase عشان الـ Authentication يشتغل!

**1. افتح Supabase Dashboard:**
- اذهب إلى [supabase.com](https://supabase.com/)
- افتح مشروعك

**2. إعدادات Authentication:**
- اذهب إلى: Authentication → URL Configuration
- في "Site URL" حط: `https://your-site.netlify.app`
- في "Redirect URLs" أضف:
  ```
  https://your-site.netlify.app/**
  https://your-site.netlify.app/auth/**
  ```

**3. احفظ التغييرات**

✅ **دلوقتي الموقع شغال كامل!**

---

## 📱 بناء APK من EAS (للأندرويد)

### التحضير:

**1. تثبيت EAS CLI:**
```bash
npm install -g eas-cli
```

**2. تسجيل الدخول في Expo:**
```bash
eas login
```
*(إذا ما عندكش حساب، سجل من [expo.dev](https://expo.dev))*

**3. إعداد المشروع:**
```bash
cd frontend
eas build:configure
```

---

### إضافة Environment Variables في EAS:

**مهم:** لازم تضيف الـ secrets دي عشان APK يشتغل صح:

```bash
# Supabase URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://uzhtruxyzxtqappavqhr.supabase.co" --type string

# Supabase Anonymous Key
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aHRydXh5enh0cWFwcGF2cWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MjE4NjcsImV4cCI6MjA3MzQ5Nzg2N30.7GtsyCg09d0rtl-iDPTKXm8FkbtObJR1HN7Q3nIGC6c" --type string

# Backend API URL
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://al-mugwumpian-patience.ngrok-free.dev" --type string

# Backend API Base URL
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "https://al-mugwumpian-patience.ngrok-free.dev" --type string
```

---

### بناء APK للاختبار:

```bash
eas build --platform android --profile production-apk
```

**ملاحظات:**
- ✅ هيسألك عن Keystore - اختر "Generate new keystore"
- ✅ البناء بياخد 10-20 دقيقة
- ✅ لما يخلص، هيديك رابط لتنزيل APK

**تنزيل APK:**
```bash
# أو نزّله من EAS Dashboard:
# https://expo.dev/accounts/[your-account]/projects/hamly/builds
```

---

### تثبيت APK على Android:

**1. نزّل APK على موبايلك**

**2. افتح الملف:**
- Android قد يقول "مصدر غير موثوق"
- اذهب إلى الإعدادات وسمح بالتثبيت من مصادر غير معروفة

**3. ثبّت التطبيق**

✅ **APK جاهز للاستخدام!**

---

## 🎯 ملخص سريع

### للموقع (Netlify):
```bash
# 1. بناء
cd frontend && npm run build:web

# 2. نشر
netlify deploy --prod --dir=dist
```

### للـ APK (EAS):
```bash
# 1. تسجيل دخول
eas login

# 2. بناء
cd frontend && eas build --platform android --profile production-apk
```

---

## ❗ مشاكل شائعة وحلولها

### 1. Netlify Build Failed

**الخطأ:** `Build command failed`

**الحل:**
```bash
# تأكد من:
1. ملف netlify.toml موجود في frontend/
2. Environment variables مضبوطة
3. النود 20 محدد في netlify.toml
```

---

### 2. APK يكرش على Login

**الخطأ:** التطبيق يتوقف عند تسجيل الدخول

**الحل:**
```bash
# تأكد من إضافة Secrets في EAS:
eas secret:list

# لو مش موجودين، أضفهم:
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "..." --type string
```

---

### 3. CORS Error في الموقع

**الخطأ:** `Access-Control-Allow-Origin`

**الحل:**
- تأكد من إضافة رابط Netlify في Supabase → URL Configuration

---

### 4. Backend لا يستجيب

**الخطأ:** `Network request failed`

**الحل:**
- تأكد من ngrok شغال على الجهاز المحلي
- أو غير `EXPO_PUBLIC_API_BASE_URL` لـ backend منشور (Render, Railway, إلخ)

---

## 🎉 بعد النشر الناجح

### اختبر الموقع:
- ✅ افتح `https://your-site.netlify.app`
- ✅ جرب تسجيل دخول
- ✅ أضف دواء/عرض
- ✅ تأكد من عدم وجود أخطاء في Console

### اختبر APK:
- ✅ ثبّت على Android
- ✅ جرب تسجيل دخول
- ✅ أضف بيانات
- ✅ تأكد من الـ sync مع Supabase

---

## 📞 محتاج مساعدة؟

- **Netlify Docs:** [docs.netlify.com](https://docs.netlify.com/)
- **EAS Build Docs:** [docs.expo.dev/build](https://docs.expo.dev/build/introduction/)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)

---

**🎯 ملاحظة نهائية:**

احتفظ بنسخة احتياطية من:
- ✅ Environment Variables
- ✅ Supabase Keys
- ✅ EAS Keystore (بيتحفظ تلقائياً في Expo)
- ✅ Netlify Site URL

**حظ سعيد! 🚀**
