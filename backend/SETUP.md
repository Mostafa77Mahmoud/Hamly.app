# 🚀 دليل إعداد وتشغيل الباك إند - Hamly Backend

## 📋 المتطلبات الأساسية

قبل البدء، تأكد من تثبيت البرامج التالية على جهازك (Windows):

### 1. Node.js و npm
- قم بتحميل Node.js من الموقع الرسمي: https://nodejs.org/
- نوصي بتثبيت الإصدار LTS (Long Term Support) - الإصدار 18 أو أحدث
- للتحقق من التثبيت، افتح Command Prompt واكتب:
  ```bash
  node --version
  npm --version
  ```
- يجب أن تظهر أرقام الإصدارات (مثال: v20.x.x و 10.x.x)

### 2. Git (اختياري)
- قم بتحميله من: https://git-scm.com/download/win
- للتحقق:
  ```bash
  git --version
  ```

### 3. محرر نصوص (VS Code موصى به)
- قم بتحميله من: https://code.visualstudio.com/

---

## 🚀 خطوات الإعداد

### الخطوة 1: تثبيت المكتبات (Dependencies)

1. افتح Command Prompt أو PowerShell
2. انتقل إلى مجلد الباك إند:
   ```bash
   cd backend
   ```
3. قم بتثبيت جميع المكتبات المطلوبة:
   ```bash
   npm install
   ```
4. انتظر حتى تكتمل عملية التثبيت (قد تستغرق بضع دقائق)

### الخطوة 2: إعداد المتغيرات البيئية (.env)

1. في مجلد `backend`، قم بنسخ ملف `.env.example` إلى ملف جديد باسم `.env`:
   ```bash
   copy .env.example .env
   ```

2. افتح ملف `.env` بمحرر النصوص وقم بتعبئة القيم التالية:

   ```env
   # Supabase Configuration
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   
   # Gemini AI API Key
   GEMINI_API_KEY=your-gemini-api-key-here
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   ```

#### 📌 كيفية الحصول على المفاتيح المطلوبة:

**1. بيانات Supabase:**

- **EXPO_PUBLIC_SUPABASE_URL**:
  - اذهب إلى لوحة تحكم Supabase: https://supabase.com/dashboard
  - اختر مشروعك
  - اذهب إلى `Settings` → `API`
  - انسخ قيمة `Project URL`

- **EXPO_PUBLIC_SUPABASE_ANON_KEY**:
  - في نفس الصفحة (`Settings` → `API`)
  - انسخ قيمة `anon` public key

**2. مفتاح Gemini AI:**

- **GEMINI_API_KEY**:
  - اذهب إلى Google AI Studio: https://aistudio.google.com/apikey
  - قم بتسجيل الدخول بحساب Google
  - اضغط على "Get API key" أو "Create API key"
  - انسخ المفتاح الذي تم إنشاؤه

### الخطوة 3: تسجيل الدخول إلى Supabase وإعداد قاعدة البيانات

#### 3.1 تثبيت Supabase CLI:

```bash
npm install -g supabase
```

#### 3.2 تسجيل الدخول:

```bash
supabase login
```

- سيفتح متصفح للمصادقة
- قم بتسجيل الدخول بحسابك في Supabase
- بعد النجاح، سيتم حفظ بيانات الاعتماد

#### 3.3 ربط المشروع بقاعدة البيانات:

```bash
supabase link --project-ref your-project-ref
```

- يمكنك العثور على `project-ref` في رابط Supabase URL
- مثال: إذا كان URL هو `https://abcdefgh.supabase.co`، فإن project-ref هو `abcdefgh`

#### 3.4 تطبيق الـ Migrations على قاعدة البيانات:

إذا كان لديك migrations في المجلد الرئيسي:

```bash
# من المجلد الرئيسي للمشروع (وليس backend)
cd ..
supabase db push
```

أو يمكنك تطبيق migrations يدوياً من لوحة تحكم Supabase:
1. اذهب إلى `SQL Editor` في لوحة تحكم Supabase
2. افتح ملفات الـ migration من مجلد `supabase/migrations`
3. نفذها واحدة تلو الأخرى بترتيب التاريخ

---

## ▶️ تشغيل المشروع

### للتشغيل المحلي (Development):

1. تأكد من أنك في مجلد `backend`:
   ```bash
   cd backend
   ```

2. قم بتشغيل الباك إند:
   ```bash
   npm run dev
   ```

3. يجب أن ترى رسالة تأكيد:
   ```
   🚀 Backend listening on port 3001
   📍 API endpoints available at http://localhost:3001/api
   ```

### للإنتاج (Production):

```bash
# بناء المشروع
npm run build

# تشغيل النسخة المبنية
npm start
```

---

## 🧪 اختبار الباك إند

### 1. اختبار الاتصال الأساسي:

افتح المتصفح أو استخدم Postman/Thunder Client واذهب إلى:

```
http://localhost:3001/
```

يجب أن تظهر رسالة JSON مع معلومات الباك إند:
```json
{
  "message": "Hamly Backend API",
  "version": "1.0.0",
  "endpoints": [...]
}
```

### 2. اختبار Health Endpoint:

```
http://localhost:3001/api/health
```

### 3. اختبار API Endpoints:

يمكنك اختبار الـ endpoints التالية باستخدام Postman:

#### a. تحليل أمان الدواء (Medication Safety):
```
POST http://localhost:3001/api/medication-safety-api

Body (JSON):
{
  "medicationName": "Paracetamol",
  "pregnancyWeek": 12,
  "language": "ar"
}

Headers:
Authorization: Bearer <your-supabase-access-token>
```

#### b. معالجة تقرير المعمل (Process Lab Report):
```
POST http://localhost:3001/api/process-lab-report-api

Body (JSON):
{
  "text": "نص تقرير المعمل هنا",
  "language": "ar"
}

Headers:
Authorization: Bearer <your-supabase-access-token>
```

#### c. تحليل الأعراض (Analyze Symptom):
```
POST http://localhost:3001/api/analyze-symptom-api

Body (JSON):
{
  "symptomType": "غثيان",
  "severity": 3,
  "description": "غثيان في الصباح",
  "pregnancyWeek": 8,
  "language": "ar"
}

Headers:
Authorization: Bearer <your-supabase-access-token>
```

---

## 🔗 اختبار الاتصال بالفرونت إند

### التأكد من أن الفرونت إند يمكنه الوصول للباك إند:

1. قم بتشغيل الباك إند كما هو موضح أعلاه
2. قم بتشغيل الفرونت إند (انظر دليل الفرونت إند)
3. افتح Developer Tools في المتصفح (F12)
4. اذهب إلى تبويب `Network`
5. حاول استخدام أي ميزة في التطبيق تستدعي الباك إند
6. راقب الطلبات - يجب أن تذهب إلى `http://localhost:3001/api/...`

---

## 🛠️ حل المشاكل الشائعة

### 1. خطأ "Missing Supabase environment variables"

**المشكلة**: الباك إند لا يستطيع الوصول إلى متغيرات Supabase

**الحل**:
- تأكد من وجود ملف `.env` في مجلد `backend`
- تحقق من أن القيم صحيحة وبدون مسافات زائدة
- أعد تشغيل الباك إند بعد تعديل `.env`

### 2. خطأ "GEMINI_API_KEY not found"

**المشكلة**: مفتاح Gemini AI غير موجود أو غير صحيح

**الحل**:
- تأكد من إضافة `GEMINI_API_KEY` في ملف `.env`
- تحقق من صحة المفتاح من Google AI Studio
- تأكد من تفعيل Gemini API في مشروعك في Google Cloud

### 3. خطأ CORS من الفرونت إند

**المشكلة**: الفرونت إند لا يستطيع الوصول للباك إند بسبب CORS

**الحل**:
- تحقق من ملف `backend/src/index.ts`
- تأكد من أن CORS يسمح بـ `http://localhost:5000`
- الإعداد الحالي يجب أن يكون:
  ```javascript
  cors({
    origin: [
      "http://localhost:5000",
      "http://127.0.0.1:5000",
      "http://localhost:3000",
      // ... origins أخرى
    ],
    credentials: true
  })
  ```

### 4. خطأ في Port 3001 (Port already in use)

**المشكلة**: المنفذ 3001 مستخدم بالفعل

**الحل**:
```bash
# اقتل العملية التي تستخدم المنفذ 3001
netstat -ano | findstr :3001
taskkill /PID [رقم_العملية] /F

# أو استخدم منفذ آخر في ملف .env
PORT=3002
```

### 5. خطأ "ts-node-dev not found"

**المشكلة**: لم يتم تثبيت ts-node-dev

**الحل**:
```bash
# أعد تثبيت المكتبات
npm install

# أو قم بتثبيت ts-node-dev مباشرة
npm install --save-dev ts-node-dev
```

### 6. مشكلة في الاتصال بقاعدة البيانات

**المشكلة**: أخطاء عند الاتصال بـ Supabase

**الحل**:
- تأكد من أن مشروع Supabase نشط (ليس Paused)
- تحقق من اتصالك بالإنترنت
- راجع قواعد الأمان (RLS Policies) في Supabase
- تأكد من تطبيق جميع الـ migrations

---

## 📝 ملاحظات مهمة

1. **لا تنشر ملف `.env`**: يحتوي على مفاتيح API حساسة
2. **راقب Logs**: ملف `runtime.log` يسجل جميع الطلبات للتتبع
3. **استخدم HTTPS في الإنتاج**: للأمان، استخدم HTTPS في بيئة الإنتاج
4. **قيود Gemini API**: لديه حدود مجانية، راقب استخدامك

---

## 🔄 أوامر مفيدة

```bash
# تثبيت المكتبات
npm install

# تشغيل المشروع (Development)
npm run dev

# بناء المشروع
npm run build

# تشغيل النسخة المبنية
npm start

# فحص الأخطاء (Linting)
npm run lint

# مسح ملف runtime.log
del runtime.log     # Windows
rm runtime.log      # Linux/Mac
```

---

## 📊 مراقبة الأداء

- **Logs**: تحقق من ملف `backend/runtime.log` لمتابعة جميع الطلبات
- **Console**: راقب console أثناء التشغيل للأخطاء
- **Network Tab**: استخدم Developer Tools لمراقبة طلبات API

---

## 🔐 الأمان

1. **لا تشارك ملف .env أبداً**
2. **استخدم متغيرات البيئة في الإنتاج** (لا تكتب القيم مباشرة في الكود)
3. **فعّل RLS في Supabase** لحماية البيانات
4. **استخدم HTTPS** في الإنتاج

---

## 📞 المساعدة والدعم

إذا واجهت أي مشاكل:

1. تحقق من ملف `README.md` في المجلد الرئيسي
2. راجع console logs للحصول على تفاصيل الخطأ
3. تأكد من تطبيق جميع الـ migrations على قاعدة البيانات
4. تحقق من صحة جميع المتغيرات البيئية

---

**تم الإعداد! 🎉 الباك إند جاهز للعمل مع تطبيق Hamly**
