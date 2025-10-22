# تشغيل HamlyMD محلياً على Windows

## المتطلبات الأساسية
- Node.js 18+ ([تحميل من هنا](https://nodejs.org))
- Git (اختياري)
- حساب Supabase مع API Keys
- Gemini API Key

---

## الخطوة 1: تحميل المشروع

### الطريقة 1: من Replit (Download as ZIP)
1. اضغط على "..." في أعلى يسار Replit
2. اختر "Download as ZIP"
3. فك الضغط في مجلد على جهازك

### الطريقة 2: باستخدام Git
```bash
git clone <repository-url>
cd hamlymd
```

---

## الخطوة 2: إعداد Backend

### 1. افتح Command Prompt أو PowerShell:
```bash
cd path\to\backend
```

### 2. ثبّت المكتبات:
```bash
npm install
```

### 3. أنشئ ملف `.env` في مجلد `backend`:
```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://uzhtruxyzxtqappavqhr.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<ضع-هنا-supabase-anon-key>

# Gemini API
GEMINI_API_KEY=<ضع-هنا-gemini-api-key>

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 4. شغّل Backend:
```bash
npm run dev
```

### 5. تحقق من التشغيل:
افتح المتصفح على: `http://localhost:3001/api/health`

يجب أن ترى:
```json
{
  "ok": true,
  "uptime": 123.45,
  "timestamp": "2025-10-13T..."
}
```

---

## الخطوة 3: إعداد Frontend

### 1. افتح Command Prompt جديدة:
```bash
cd path\to\frontend
```

### 2. ثبّت المكتبات:
```bash
npm install
```

### 3. أنشئ ملف `.env.local` في مجلد `frontend`:
```env
# API Configuration (للتشغيل المحلي)
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://uzhtruxyzxtqappavqhr.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<ضع-هنا-supabase-anon-key>
```

### 4. شغّل Frontend:
```bash
npm run dev:web
```

### 5. افتح المتصفح:
التطبيق سيعمل على: `http://localhost:5000`

---

## اختبار التكامل

### 1. تأكد أن Backend و Frontend يعملان معاً:

1. افتح المتصفح على `http://localhost:5000`
2. افتح **Developer Console** (اضغط F12)
3. في تبويب **Console**، ابحث عن:
   ```
   🌐 [API_CONFIG] Base URL: http://localhost:3001
   ```
4. سجّل دخول بحساب Supabase
5. جرب إضافة دواء أو عرض

### 2. إذا ظهرت أخطاء:

#### خطأ CORS:
```
Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:5000' has been blocked
```
**الحل:** تأكد من إعدادات CORS في `backend/src/index.ts`

#### خطأ 401 Unauthorized:
```
{"error": "Unauthorized"}
```
**الحل:** تأكد من:
- تسجيل الدخول بنجاح في Frontend
- وجود Access Token في Local Storage

#### خطأ Connection Refused:
```
ERR_CONNECTION_REFUSED
```
**الحل:** تأكد من تشغيل Backend على port 3001

---

## نصائح مهمة

### ✅ Do's:
- تأكد من تشغيل Backend **قبل** Frontend
- استخدم `http://localhost:3001` في `.env.local` (محلياً فقط)
- راقب لوجات Backend في Command Prompt للأخطاء

### ❌ Don'ts:
- لا تستخدم Replit domain في التشغيل المحلي
- لا تنسى إضافة `.env` و `.env.local` في `.gitignore`
- لا تشارك API Keys على GitHub

---

## Endpoints المتاحة

| Endpoint | الوصف | Method |
|----------|-------|--------|
| `/api/health` | التحقق من حالة السيرفر | GET |
| `/api/medication-safety-api` | تحليل أمان الأدوية | POST |
| `/api/process-lab-report-api` | معالجة التقارير المعملية | POST |
| `/api/analyze-symptom-api` | تحليل الأعراض | POST |

---

## الحصول على API Keys

### Supabase:
1. افتح [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك
3. اذهب إلى **Settings** > **API**
4. انسخ:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Gemini API:
1. افتح [Google AI Studio](https://aistudio.google.com/apikey)
2. سجّل دخول بحساب Google
3. اضغط "Create API Key"
4. انسخ المفتاح → `GEMINI_API_KEY`

---

## استكشاف الأخطاء

### المشكلة: Cannot GET /api
**التوضيح:** هذا **ليس خطأ**! المسار `/api` وحده غير موجود.

**الحل:** استخدم endpoints محددة:
- ✅ `/api/health`
- ✅ `/api/medication-safety-api`
- ❌ `/api` (سيعطي 404)

### المشكلة: Frontend لا يتصل بـ Backend
**الحل:**
1. تأكد من `EXPO_PUBLIC_API_BASE_URL=http://localhost:3001` في `.env.local`
2. أعد تشغيل Frontend بعد تعديل `.env.local`
3. امسح cache: احذف مجلد `.expo` ثم أعد التشغيل

---

## الدعم

إذا واجهت أي مشاكل:
1. تحقق من اللوجات في Command Prompt (Backend)
2. افتح Developer Console في المتصفح (Frontend)
3. شارك رسائل الأخطاء للحصول على المساعدة
