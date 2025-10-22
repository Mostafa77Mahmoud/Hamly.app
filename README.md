# HamlyMD - مرافق الحمل الذكي

تطبيق صحي شامل مبني بـ React Native و Expo لإدارة صحة الحمل والأدوية والتحاليل والأعراض مع تحليلات الذكاء الاصطناعي.

A comprehensive React Native app built with Expo for pregnancy health management with AI-powered medical insights.

## 🏗️ Architecture

HamlyMD now uses a **split architecture**:
- **Frontend**: React Native/Expo app (deployable to Netlify)
- **Backend**: Express.js server (deployable to Render/Railway/Heroku)
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API

This architecture solves timeout issues and enables proper deployment for long-running AI tasks.

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+** and npm
- **Expo CLI**: `npm install -g @expo/cli`
- **Supabase account** (free tier)
- **Google Gemini API key** for AI analysis

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd hamlymd
```

### 2. Install Dependencies

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd backend
npm install
cd ..
```

### 3. Environment Configuration

#### Frontend (.env.local)
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API URL
# Local development
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
# Production (update after deploying backend)
# EXPO_PUBLIC_API_BASE_URL=https://your-backend.render.com

# Gemini API (for local testing only)
GEMINI_API_KEY=your_gemini_api_key
```

#### Backend (backend/.env)
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 4. Set Up Database
```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

### 5. Run Locally

#### Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```
Backend runs on http://localhost:3000

#### Start Frontend (Terminal 2)
```bash
npm run dev:web
```
Frontend runs on http://localhost:5000

## 📱 Features

### 🔬 Lab Report Analysis
- Upload lab reports via camera, gallery, or PDF
- AI-powered OCR and medical analysis using Google Gemini
- Automatic abnormal result detection with explanations
- Pregnancy-specific reference ranges

### 💊 Medication Safety
- Comprehensive pregnancy medication database
- AI safety analysis based on FDA categories
- Trimester-specific risk assessments
- Daily adherence tracking

### 🩺 Symptom Tracking
- Daily symptom logging with severity scales
- AI-powered analysis and recommendations
- Pattern recognition and trigger identification
- Pregnancy week-specific insights

### 🌐 Multilingual Support
- Full Arabic and English localization
- RTL (Right-to-Left) layout support
- Cultural context awareness in AI responses

## 🚀 Deployment

### Frontend Deployment (Netlify)

1. **Build Configuration** (already configured in `netlify.toml`):
   ```toml
   [build]
     command = "npm run build:web"
     publish = "dist"
   ```

2. **Deploy Steps**:
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login to Netlify
   netlify login
   
   # Deploy
   netlify deploy --prod
   ```

3. **Environment Variables** (set in Netlify dashboard):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_API_BASE_URL` (your backend URL)

### Backend Deployment (Render - Recommended)

1. **Create New Web Service** on Render.com

2. **Build Settings**:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: Node 20

3. **Environment Variables**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `NODE_ENV=production`
   - `PORT=3000`

4. **After Deployment**:
   - Copy the backend URL (e.g., `https://hamlymd-backend.onrender.com`)
   - Update frontend `EXPO_PUBLIC_API_BASE_URL` in Netlify

### Alternative Backend Platforms

#### Railway
- Deploy with one click from GitHub
- Generous free tier with no timeout limits
- Similar environment variable setup

#### Heroku
- Use `backend/Procfile`: `web: cd backend && npm start`
- May require timeout optimization for free tier

### Mobile Deployment (Expo)

```bash
# Build for iOS
eas build --platform ios

# Build for Android  
eas build --platform android

# Submit to stores
eas submit
```

## 📂 Project Structure

```
hamlymd/
├── app/                    # Frontend app (Expo Router)
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tabbed interface
│   └── utils/             # Frontend utilities
├── backend/               # Express.js backend
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── utils/        # Backend utilities
│   │   └── index.ts      # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── components/            # Reusable UI components
├── contexts/             # React Context providers
├── supabase/             # Database migrations
├── netlify.toml          # Netlify config
└── package.json          # Frontend dependencies
```

## 🔧 Development Commands

```bash
# Frontend Development
npm run dev:web              # Start web dev server
npm run dev                  # Start for all platforms

# Backend Development
cd backend
npm run dev                  # Start backend with nodemon

# Building
npm run build:web           # Build frontend for web
cd backend && npm run build # Build backend

# Database
npx supabase db push        # Apply migrations
npx supabase db reset       # Reset database

# Validation
npx tsc --noEmit           # Check TypeScript
```

## 📚 Additional Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)**: Local development guide with ngrok setup
- **[CONSIDERATIONS.md](./CONSIDERATIONS.md)**: Deployment considerations for long-running AI tasks
- **[Backend README](./backend/README.md)**: Backend API documentation

## 🔐 Security & Configuration

### Environment Variables
- **Frontend (EXPO_PUBLIC_*)**: Exposed to client, use for non-sensitive data
- **Backend**: Private server-side variables (API keys, service roles)
- **Database**: Row Level Security (RLS) policies enabled

### Required API Keys
- **Supabase**: Free tier at supabase.com
- **Google Gemini**: Free tier at makersuite.google.com

## 🐛 Troubleshooting

### Frontend Issues

**Port 5000 in use**:
```bash
PORT=8080 npm run dev:web
```

**Build errors**:
```bash
npx expo start --clear
rm -rf node_modules package-lock.json
npm install
```

### Backend Issues

**Connection errors**:
- Verify backend is running on port 3000
- Check `EXPO_PUBLIC_API_BASE_URL` matches backend URL
- Ensure CORS is enabled for your domain

**AI timeout errors**:
- Normal for first requests (cold start)
- Consider upgrading to paid tier on deployment platform
- See CONSIDERATIONS.md for optimization strategies

### Database Issues

**Connection failed**:
```bash
npx supabase status
npx supabase link --project-ref your-ref
```

**Migration errors**:
```bash
npx supabase db reset
npx supabase db push
```

## 🧪 Testing

### Local Testing
```bash
# Run frontend tests
npm test

# Test backend endpoints
cd backend
npm test
```

### Mobile Testing with ngrok
See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed ngrok setup instructions.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **Google Gemini** for AI medical analysis
- **Supabase** for backend infrastructure
- **Expo** for React Native development platform
- **Render** for reliable backend hosting

---

**⚠️ Medical Disclaimer**: HamlyMD provides educational information and should not replace professional medical advice. Always consult healthcare providers for medical decisions during pregnancy.

**Made with ❤️ for expecting mothers worldwide**
