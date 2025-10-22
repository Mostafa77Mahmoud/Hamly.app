# 🏥 Hamly - تطبيق متابعة الحمل

## 📁 هيكل المشروع

المشروع الآن مقسم إلى مجلدين منفصلين:

```
Hamly/
├── frontend/          # تطبيق الفرونت إند (React Native/Expo)
│   ├── app/          # صفحات التطبيق
│   ├── components/   # مكونات قابلة لإعادة الاستخدام
│   ├── utils/        # أدوات مساعدة
│   ├── SETUP.md      # دليل إعداد الفرونت إند
│   └── package.json
│
├── backend/          # خادم الباك إند (Express/Node.js)
│   ├── src/          # كود المصدر
│   ├── SETUP.md      # دليل إعداد الباك إند
│   └── package.json
│
├── supabase/         # ملفات قاعدة البيانات والـ migrations
│   └── migrations/
│
└── README-SETUP.md   # هذا الملف
```

---

## 🚀 البدء السريع

### الخطوة 1: المتطلبات الأساسية

تأكد من تثبيت:
- **Node.js** (الإصدار 18 أو أحدث) - [تحميل من هنا](https://nodejs.org/)
- **npm** (يأتي مع Node.js)
- **Git** (اختياري) - [تحميل من هنا](https://git-scm.com/)

### الخطوة 2: إعداد الباك إند (Backend)

1. افتح terminal وانتقل إلى مجلد backend:
   ```bash
   cd backend
   ```

2. اتبع التعليمات الموجودة في `backend/SETUP.md`

3. بعد الإعداد، قم بتشغيل الباك إند:
   ```bash
   npm run dev
   ```

4. تأكد من أن الباك إند يعمل على `http://localhost:3001`

### الخطوة 3: إعداد الفرونت إند (Frontend)

1. افتح terminal جديد وانتقل إلى مجلد frontend:
   ```bash
   cd frontend
   ```

2. اتبع التعليمات الموجودة في `frontend/SETUP.md`

3. بعد الإعداد، قم بتشغيل الفرونت إند:
   ```bash
   npm run dev:web
   ```

4. سيفتح التطبيق تلقائياً على `http://localhost:5000`

---

## 🔑 المتغيرات البيئية المطلوبة

### للفرونت إند (`frontend/.env`):
```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
```

### للباك إند (`backend/.env`):
```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-gemini-api-key
PORT=3001
NODE_ENV=development
```

### 📌 كيفية الحصول على المفاتيح:

1. **Supabase**:
   - اذهب إلى https://supabase.com/dashboard
   - اختر مشروعك → Settings → API
   - انسخ Project URL و anon key

2. **Gemini API**:
   - اذهب إلى https://aistudio.google.com/apikey
   - أنشئ API key جديد

---

## 📋 أوامر التشغيل

### الباك إند (Backend):
```bash
cd backend
npm install          # تثبيت المكتبات
npm run dev          # تشغيل في وضع التطوير
npm run build        # بناء للإنتاج
npm start            # تشغيل النسخة المبنية
```

### الفرونت إند (Frontend):
```bash
cd frontend
npm install          # تثبيت المكتبات
npm run dev:web      # تشغيل على الويب
npm run dev          # تشغيل على جميع المنصات
npm run build        # بناء للإنتاج
```

---

## 🧪 اختبار الاتصال

### 1. اختبار الباك إند:
افتح المتصفح وانتقل إلى:
- `http://localhost:3001/` - معلومات API
- `http://localhost:3001/api/health` - حالة الخادم

### 2. اختبار الاتصال بين الفرونت والباك:
1. شغل كلا المشروعين
2. افتح الفرونت إند على `http://localhost:5000`
3. افتح Developer Tools (F12)
4. تحقق من Console للتأكد من الاتصال بـ API

---

## 🛠️ حل المشاكل الشائعة

### مشكلة: CORS Error

**الحل**: تأكد من أن الباك إند يسمح بـ localhost:5000 في إعدادات CORS

### مشكلة: Port already in use

**الحل**:
```bash
# لإيقاف العملية على المنفذ 3001 (الباك إند)
netstat -ano | findstr :3001
taskkill /PID [رقم_العملية] /F

# لإيقاف العملية على المنفذ 5000 (الفرونت إند)
netstat -ano | findstr :5000
taskkill /PID [رقم_العملية] /F
```

### مشكلة: Module not found

**الحل**:
```bash
# احذف node_modules وأعد التثبيت
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 وثائق إضافية

- **[frontend/SETUP.md](frontend/SETUP.md)** - دليل مفصل لإعداد الفرونت إند
- **[backend/SETUP.md](backend/SETUP.md)** - دليل مفصل لإعداد الباك إند

---

## 🏗️ بنية التطبيق

### الفرونت إند (Frontend):
- **Framework**: React Native + Expo
- **Language**: TypeScript
- **State Management**: React Context
- **UI**: مكونات مخصصة مع Lucide icons
- **Navigation**: Expo Router

### الباك إند (Backend):
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **APIs**:
  - تحليل أمان الأدوية
  - معالجة تقارير المعمل
  - تحليل الأعراض

---

## 🔐 الأمان

- ⚠️ **لا تشارك ملفات `.env` أبداً**
- ⚠️ **استخدم `.env.example` كمرجع فقط**
- ⚠️ **فعّل Row Level Security في Supabase**
- ⚠️ **استخدم HTTPS في الإنتاج**

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. راجع ملفات SETUP.md في كل مجلد
2. تحقق من console logs للأخطاء
3. تأكد من تشغيل كلا الخادمين (Frontend + Backend)

---

## ✅ قائمة التحقق

قبل البدء، تأكد من:
- [ ] تثبيت Node.js و npm
- [ ] إنشاء حساب Supabase والحصول على المفاتيح
- [ ] إنشاء Gemini API key
- [ ] إعداد ملفات .env في كلا المجلدين
- [ ] تثبيت dependencies في كلا المجلدين
- [ ] تطبيق migrations على قاعدة البيانات
- [ ] تشغيل الباك إند على المنفذ 3001
- [ ] تشغيل الفرونت إند على المنفذ 5000

---

**مبروك! 🎉 أنت الآن جاهز لتطوير تطبيق Hamly**
