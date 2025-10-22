# تعليمات النشر والربط - Deployment & Integration Instructions

## 🚀 الوضع الحالي / Current Setup

- **Backend**: محلي على جهازك (Port 3001) + ngrok tunnel
- **Frontend**: Netlify + Replit
- **Database**: Supabase

---

## ⚠️ مشكلة Mixed Content - الحل

### المشكلة:
- Frontend على HTTP لا يمكنه إرسال POST requests إلى Backend على HTTPS (ngrok)
- المتصفح يسمح فقط بـ OPTIONS (preflight) لكن يمنع POST مع body

### الحل 1: استخدام Backend محلي مباشرة (للتطوير):

#### على Replit:
1. **أوقف/غيّر متغيرات البيئة مؤقتاً:**
   ```bash
   # في Replit Secrets، غيّر:
   EXPO_PUBLIC_API_BASE_URL = http://localhost:3001
   ```

2. **أعد تشغيل Frontend**

3. **افتح من Replit Webview** (HTTPS):
   - استخدم الرابط من Replit Webview
   - أو استخدم الدومين: `https://[your-repl-name].[username].replit.dev`

---

### الحل 2: استخدام ngrok (للـ Production/Testing):

#### 1. تشغيل Backend على ngrok:
```bash
# على جهازك المحلي
ngrok http 3001 --domain=al-mugwumpian-patience.ngrok-free.dev
```

#### 2. Frontend على Netlify:
**ضبط Environment Variables في Netlify:**

```bash
# عبر Netlify CLI:
netlify env:set EXPO_PUBLIC_API_BASE_URL "https://al-mugwumpian-patience.ngrok-free.dev"
netlify env:set EXPO_PUBLIC_SUPABASE_URL "https://uzhtruxyzxtqappavqhr.supabase.co"
netlify env:set EXPO_PUBLIC_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# أو في Netlify Dashboard:
# Site settings → Environment variables → Add
```

ثم أعد Build و Deploy:
```bash
npm run build:web
# Deploy dist/ folder
```

#### 3. Frontend على Replit:
**يجب استخدام HTTPS Replit domain:**

1. **في Replit Secrets، ضع:**
   ```
   EXPO_PUBLIC_API_BASE_URL=https://al-mugwumpian-patience.ngrok-free.dev
   ```

2. **افتح Frontend من Replit Webview** (ليس localhost):
   - استخدم: `https://[your-repl].replit.dev`
   - الآن: HTTPS → HTTPS ✅

---

## 🔧 Backend CORS Settings

Backend الآن يسمح بـ:
- ✅ `http://localhost:*` (محلي)
- ✅ `https://al-mugwumpian-patience.ngrok-free.dev` (ngrok)
- ✅ `*.netlify.app` (جميع Netlify apps)
- ✅ `*.replit.dev` (جميع Replit apps)

---

## 📊 اختبار الاتصال

### 1. من Browser Console (على Netlify أو Replit):
```javascript
// اختبار Health Check
fetch('https://al-mugwumpian-patience.ngrok-free.dev/api/health', {
  headers: { 'ngrok-skip-browser-warning': 'true' }
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Expected: {ok: true, uptime: ..., timestamp: ...}
```

### 2. من Terminal:
```bash
curl -I https://al-mugwumpian-patience.ngrok-free.dev/api/health
# Expected: HTTP/1.1 200 OK
```

---

## 🎯 ملخص الحلول السريعة

### للتطوير المحلي على Replit:
```bash
# 1. غيّر في Secrets:
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001

# 2. شغّل Backend محلياً على جهازك
# 3. استخدم ngrok للوصول من Replit إذا لزم
```

### للـ Production (Netlify):
```bash
# 1. Backend على ngrok (أو استضافة دائمة)
# 2. ضع EXPO_PUBLIC_API_BASE_URL في Netlify env vars
# 3. Build و Deploy
```

### ملاحظة مهمة:
⚠️ **ngrok مجاني يحتاج إعادة تشغيل كل 2 ساعة!**
للـ production استخدم:
- Railway.app
- Render.com
- Heroku
- أو أي استضافة دائمة

---

## 📝 Next Steps للـ Production

1. **استضافة Backend دائمة:**
   - Railway / Render / Heroku
   - أو Replit Deployments (backend على Replit أيضاً)

2. **Update Environment Variables:**
   - في Netlify: غيّر لـ production backend URL
   - في EAS (للموبايل): استخدم production URL

3. **Database:**
   - ✅ Supabase جاهز ويعمل

---

**Created:** October 16, 2025  
**Last Updated:** October 16, 2025
