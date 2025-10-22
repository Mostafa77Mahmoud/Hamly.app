# 📱 دليل إعداد وتشغيل الفرونت إند - Hamly

## 📋 المتطلبات الأساسية

قبل البدء، تأكد من تثبيت البرامج التالية على جهازك (Windows):

### 1. Node.js و npm
- قم بتحميل Node.js من الموقع الرسمي: https://nodejs.org/
- نوصي بتثبيت الإصدار LTS (Long Term Support)
- للتحقق من التثبيت، افتح Command Prompt واكتب:
  ```bash
  node --version
  npm --version
  ```
- يجب أن تظهر أرقام الإصدارات

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
2. انتقل إلى مجلد الفرونت إند:
   ```bash
   cd frontend
   ```
3. قم بتثبيت جميع المكتبات المطلوبة:
   ```bash
   npm install
   ```
4. انتظر حتى تكتمل عملية التثبيت (قد تستغرق بضع دقائق)

### الخطوة 2: إعداد المتغيرات البيئية (.env)

1. في مجلد `frontend`، قم بنسخ ملف `.env.example` إلى ملف جديد باسم `.env`:
   ```bash
   copy .env.example .env
   ```

2. افتح ملف `.env` بمحرر النصوص وقم بتعبئة القيم التالية:

   ```env
   # Supabase Configuration
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   
   # Backend API URL (للتطوير المحلي)
   EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
   ```

#### 📌 كيفية الحصول على بيانات Supabase:

1. **EXPO_PUBLIC_SUPABASE_URL**:
   - اذهب إلى لوحة تحكم Supabase: https://supabase.com/dashboard
   - اختر مشروعك
   - اذهب إلى `Settings` → `API`
   - انسخ قيمة `Project URL`

2. **EXPO_PUBLIC_SUPABASE_ANON_KEY**:
   - في نفس الصفحة (`Settings` → `API`)
   - انسخ قيمة `anon` public key

### الخطوة 3: تسجيل الدخول إلى Supabase من جهازك

إذا كنت تريد استخدام Supabase CLI لإدارة قاعدة البيانات محلياً:

1. قم بتثبيت Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. قم بتسجيل الدخول:
   ```bash
   supabase login
   ```

3. سيفتح متصفح للمصادقة - قم بتسجيل الدخول بحسابك في Supabase

4. للربط بمشروعك:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (يمكنك العثور على project-ref في رابط Supabase URL الخاص بك)

---

## ▶️ تشغيل المشروع

### للتشغيل المحلي (Development):

1. تأكد من أنك في مجلد `frontend`:
   ```bash
   cd frontend
   ```

2. لتشغيل المشروع على الويب:
   ```bash
   npm run dev:web
   ```
   أو:
   ```bash
   npm run dev
   ```

3. سيفتح المشروع تلقائياً في المتصفح على العنوان:
   ```
   http://localhost:5000
   ```

### للتشغيل على Android/iOS:

1. **لنظام Android**:
   ```bash
   npm run android
   ```
   (يتطلب Android Studio و Android SDK)

2. **لنظام iOS** (Mac فقط):
   ```bash
   npm run ios
   ```

---

## 🔗 اختبار الاتصال بالباك إند

### التأكد من أن الباك إند يعمل:

1. تأكد من تشغيل الباك إند أولاً (انظر دليل الباك إند)
2. افتح المتصفح واذهب إلى:
   ```
   http://localhost:3001/api/health
   ```
3. يجب أن تظهر رسالة تأكيد أن الباك إند يعمل

### اختبار الاتصال من الفرونت إند:

1. بعد تشغيل الفرونت إند، افتح Developer Tools في المتصفح (اضغط F12)
2. اذهب إلى تبويب `Console`
3. يجب أن ترى رسائل تشير إلى:
   ```
   🌐 [API_CONFIG] Base URL: http://localhost:3001
   ```
4. حاول تسجيل الدخول أو استخدام أي ميزة - راقب طلبات الـ API في تبويب `Network`

---

## 🛠️ حل المشاكل الشائعة

### 1. خطأ CORS (Access-Control-Allow-Origin)

**المشكلة**: رسالة خطأ في Console تقول:
```
Access to fetch at 'http://localhost:3001/api/...' has been blocked by CORS policy
```

**الحل**:
- تأكد من أن الباك إند يعمل
- تحقق من إعدادات CORS في `backend/src/index.ts`
- يجب أن يتضمن `http://localhost:5000` في قائمة الـ origins المسموح بها

### 2. خطأ في الاتصال بـ Supabase

**المشكلة**: رسائل خطأ تتعلق بـ Supabase أو قاعدة البيانات

**الحل**:
- تأكد من صحة قيم `EXPO_PUBLIC_SUPABASE_URL` و `EXPO_PUBLIC_SUPABASE_ANON_KEY` في ملف `.env`
- تأكد من أن مشروع Supabase نشط وليس معلقاً (Paused)
- تحقق من اتصالك بالإنترنت

### 3. خطأ "Module not found"

**المشكلة**: رسالة خطأ تقول أن module معين غير موجود

**الحل**:
```bash
# احذف مجلد node_modules
rmdir /s /q node_modules

# احذف ملف package-lock.json
del package-lock.json

# أعد تثبيت المكتبات
npm install
```

### 4. خطأ في Port 5000 (Port already in use)

**المشكلة**: المنفذ 5000 مستخدم بالفعل

**الحل**:
```bash
# اقتل العملية التي تستخدم المنفذ 5000
netstat -ano | findstr :5000
taskkill /PID [رقم_العملية] /F

# أو استخدم منفذ آخر
npm run dev -- --port 5001
```

### 5. مشكلة في تحميل الخطوط (Fonts)

**المشكلة**: الخطوط لا تظهر بشكل صحيح

**الحل**:
- امسح الـ cache:
  ```bash
  npm start -- --clear
  ```
- أو أعد تشغيل Metro Bundler

---

## 📝 ملاحظات مهمة

1. **لا تنشر ملف `.env`**: ملف `.env` يحتوي على بيانات حساسة، لا تقم برفعه إلى Git
2. **استخدم .env.example كمرجع**: عند مشاركة المشروع، شارك `.env.example` وليس `.env`
3. **تأكد من تشغيل الباك إند أولاً**: الفرونت إند يعتمد على الباك إند للعديد من الميزات
4. **استخدم localhost:3001**: تأكد من أن الباك إند يعمل على المنفذ 3001

---

## 🔄 أوامر مفيدة

```bash
# تثبيت المكتبات
npm install

# تشغيل المشروع (ويب)
npm run dev:web

# تشغيل المشروع (جميع المنصات)
npm run dev

# بناء المشروع للإنتاج
npm run build

# تشغيل النسخة المبنية
npm run serve

# فحص الأخطاء (Linting)
npm run lint
```

---

## 📞 المساعدة والدعم

إذا واجهت أي مشاكل:

1. تحقق من ملف `README.md` في المجلد الرئيسي
2. راجع الـ Console في Developer Tools للحصول على تفاصيل الخطأ
3. تأكد من أن جميع المتغيرات البيئية مضبوطة بشكل صحيح
4. تحقق من أن الباك إند يعمل بشكل صحيح

---

**تم الإعداد! 🎉 الآن يمكنك البدء في تطوير تطبيق Hamly**
