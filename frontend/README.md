# 🏥 HamlyMD - تطبيق إدارة الحمل والصحة

## 📱 نظرة عامة

تطبيق شامل لمتابعة الحمل وإدارة الصحة، يعمل كموقع إلكتروني وتطبيق موبايل.

### ✨ الميزات الرئيسية:
- ✅ تتبع أسابيع الحمل بالتفصيل
- ✅ إدارة الأدوية مع تحليل الأمان بالذكاء الاصطناعي
- ✅ تتبع الأعراض مع تحليل AI
- ✅ رفع وتحليل التقارير المعملية بالـ OCR
- ✅ واجهة ثنائية اللغة (عربي/إنجليزي)
- ✅ مزامنة تلقائية مع Supabase

---

## 🚀 التشغيل المحلي (على Replit)

### 1. تثبيت المكتبات:
```bash
cd frontend
npm install
```

### 2. إعداد Environment Variables:

أنشئ ملف `.env` في مجلد `frontend`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://uzhtruxyzxtqappavqhr.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aHRydXh5enh0cWFwcGF2cWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MjE4NjcsImV4cCI6MjA3MzQ5Nzg2N30.7GtsyCg09d0rtl-iDPTKXm8FkbtObJR1HN7Q3nIGC6c
EXPO_PUBLIC_API_URL=https://al-mugwumpian-patience.ngrok-free.dev
EXPO_PUBLIC_API_BASE_URL=https://al-mugwumpian-patience.ngrok-free.dev
```

### 3. تشغيل التطبيق:
```bash
# كموقع إلكتروني:
npm run dev:web
```

سيعمل على: `http://localhost:5000`

---

## 🌐 النشر على Netlify (كموقع إلكتروني)

### طريقة سريعة:

```bash
# 1. تثبيت Netlify CLI
npm install -g netlify-cli

# 2. تسجيل الدخول
netlify login

# 3. بناء المشروع
cd frontend
npm run build:web

# 4. النشر
netlify deploy --prod --dir=dist
```

### بعد النشر:
1. ✅ انسخ رابط الموقع (مثل: `https://your-site.netlify.app`)
2. ✅ أضفه في Supabase → Authentication → URL Configuration
3. ✅ ضعه في "Site URL" و "Redirect URLs"

**للتفاصيل الكاملة:** شوف ملف [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📱 بناء APK للأندرويد

### الخطوات:

```bash
# 1. تثبيت EAS CLI
npm install -g eas-cli

# 2. تسجيل الدخول
eas login

# 3. إضافة Secrets
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://uzhtruxyzxtqappavqhr.supabase.co" --type string

eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aHRydXh5enh0cWFwcGF2cWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MjE4NjcsImV4cCI6MjA3MzQ5Nzg2N30.7GtsyCg09d0rtl-iDPTKXm8FkbtObJR1HN7Q3nIGC6c" --type string

eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "https://al-mugwumpian-patience.ngrok-free.dev" --type string

# 4. بناء APK
cd frontend
eas build --platform android --profile production-apk
```

**النتيجة:** بعد 10-20 دقيقة، هتحصل على رابط لتنزيل APK جاهز للتثبيت على Android!

**للتفاصيل الكاملة:** شوف ملف [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🔐 Environment Variables المطلوبة

### للتطوير المحلي:
```env
EXPO_PUBLIC_SUPABASE_URL=https://uzhtruxyzxtqappavqhr.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_BASE_URL=https://al-mugwumpian-patience.ngrok-free.dev
```

### للنشر (Netlify):
يتم إضافتها في Netlify Dashboard → Site settings → Environment variables

### للـ APK (EAS):
يتم إضافتها عبر:
```bash
eas secret:create --scope project --name VARIABLE_NAME --value "value" --type string
```

---

## 📁 هيكل المشروع

```
frontend/
├── app/                    # شاشات التطبيق (Expo Router)
│   ├── (auth)/            # المصادقة
│   ├── (tabs)/            # الشاشات الرئيسية
│   └── (onboarding)/      # الإعداد الأولي
├── components/            # مكونات UI
├── contexts/              # AuthContext, DataContext
├── services/              # خدمات API
├── utils/                 # وظائف مساعدة
├── .env                   # متغيرات البيئة (محلي)
├── netlify.toml          # إعدادات Netlify
└── eas.json              # إعدادات EAS Build
```

---

## ❗ حل المشاكل الشائعة

### 1. خطأ CORS في API
**الحل:** تأكد من إضافة رابط Netlify في Supabase URL Configuration

### 2. APK يتوقف عند Login
**الحل:** تأكد من إضافة جميع الـ Secrets في EAS:
```bash
eas secret:list
```

### 3. Netlify Build Failed
**الحل:** تأكد من Environment Variables في Netlify Dashboard

---

## 📊 التقنيات المستخدمة

- **Frontend:** Expo + React Native + React Native Web
- **Backend:** Express.js + TypeScript
- **Database:** Supabase (PostgreSQL)
- **AI:** Google Gemini API
- **Authentication:** Supabase Auth
- **Deployment:** 
  - Website: Netlify
  - Mobile: EAS Build

---

## 📞 الدعم والمساعدة

- **دليل النشر الكامل:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **تعليمات البناء:** [BUILD_INSTRUCTIONS.md](./BUILD_INSTRUCTIONS.md)
- **Expo Docs:** [docs.expo.dev](https://docs.expo.dev/)
- **Netlify Docs:** [docs.netlify.com](https://docs.netlify.com/)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)

---

## ✅ قائمة التحقق قبل النشر

- [ ] Environment variables مضبوطة
- [ ] Supabase URL Configuration محدثة
- [ ] Backend شغال (ngrok أو منشور)
- [ ] APK مختبر على Android
- [ ] Website مختبر على Netlify

---

## 🎉 جاهز للنشر!

اتبع الخطوات في [DEPLOYMENT.md](./DEPLOYMENT.md) للنشر على Netlify و EAS!

**حظ سعيد! 🚀**