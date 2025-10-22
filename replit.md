# Hamly MD - React Native/Expo Health Application

## Overview
Hamly MD is a cross-platform health application built with React Native and Expo Router, designed for web deployment on Replit. It offers comprehensive health tracking, lab result management, medication tracking, and AI-powered voice notifications, specifically tailored for pregnancy care. The project aims to provide an intelligent companion for mothers worldwide, focusing on robust data management, security, and a seamless user experience.

## User Preferences
I prefer simple and direct communication. When suggesting code changes, please explain the reasoning clearly but concisely. I value iterative development and would like to review major architectural decisions before implementation. Ensure all generated code adheres to best practices for React Native and TypeScript, prioritizing readability and maintainability. Do not make changes to files outside the `app/`, `components/`, `contexts/`, `utils/`, and `types/` directories without explicit approval.

## Recent Changes (October 12, 2025)

### System Cleanup + Runtime Healing (Latest)
- ✅ **Deep File Cleanup**: Removed all non-runtime files:
  - Deleted test directories: backend/tests/, scripts/, tests/, reports/
  - Removed report .md files: DATABASE.md, DEPLOYMENT_GUIDE.md, DEVELOPMENT.md, ARCHITECTURE.md, and all ALT_TAB_* files
  - Kept only 3 essential docs: README.md, README-ar.md, replit.md
  - Zero test files (.test, .spec, .mock) remaining outside node_modules
- ✅ **Enhanced Runtime Logging**:
  - Backend logs all requests to `backend/runtime.log`
  - Includes: timestamp, method, path, status, duration_ms, body summary
  - Frontend logs detailed request/response info with emojis for easy debugging
- ✅ **API Communication Verified**:
  - Frontend API config: localhost:3001 (fallback when EXPO_PUBLIC_API_BASE_URL not set)
  - All 3 endpoints ready: medicationSafety, processLabReport, analyzeSymptom
  - CORS properly configured
  - Authentication flow verified
- ✅ **Environment Variables**: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY all configured
- ✅ **No Errors**: Zero TypeScript/LSP errors, backend compiles cleanly

## Recent Changes (October 6, 2025)
- ✅ **Replit Environment Setup Completed**: Successfully configured the project to run in Replit environment
- ✅ **Dependencies Installed**: Installed all npm packages with `--legacy-peer-deps` flag
- ✅ **Environment Secrets Configured**: Set up Supabase credentials (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY) in Replit Secrets
- ✅ **Workflow Configured**: Set up development server workflow running on port 5000 with `npm run dev:web`
- ✅ **Deployment Configuration**: Configured autoscale deployment with build and serve commands
- ✅ **Updated .gitignore**: Added proper Node.js/React Native ignore patterns
- ✅ **Fixed JSX Whitespace Errors**: Resolved all "Unexpected text node" console errors in auth.tsx and index.tsx
- ✅ **Supabase Integration Verified**: Confirmed Supabase client is properly connected and authentication system is initialized
- ✅ **Network Tracing System Implemented**: Comprehensive request/response tracking for all Supabase API calls with resume cycle correlation, latency monitoring, and security-safe logging (see docs/network-tracing.md)

## System Architecture

### UI/UX Decisions
The application features a multilingual interface supporting Arabic and English, with Arabic RTL layout fully functional. The design prioritizes a fresh and responsive navigation experience, aiming for instant UI feedback and fast data loading.

### Technical Implementations
The core application is built with React Native and Expo Router, running as a web application on Replit.
- **Session Management**: Comprehensive `SessionManager` (`services/session/sessionManager.ts`) handles session lifecycle, background/foreground resume, phased resync orchestration, circuit breaker protection, write queue, and health checks. Features single-flight deduplication, retry with exponential backoff, abort/cancellation support, and event-driven architecture.
- **Data Management**: Features a robust `DataContext` integrated with SessionManager for optimal performance and reliability. It includes phased resource loading (profile + pregnancy → medications + symptoms → labs), automatic retry logic with exponential backoff, request cancellation, debounced refresh, and cache-first loading to prevent race conditions and ensure clean resource management.
- **Authentication**: Utilizes Supabase Auth for user authentication and session management with automatic session refresh.
- **Database Reliability**: Optimized timeout configurations and robust fallback mechanisms for database operations.
- **Connection Health Monitoring**: Smart health checks with adaptive cadence and cached results.
- **Network Tracing**: Comprehensive request/response tracking system (`utils/networkTracer.ts`) logs all Supabase API interactions with timing data, resume cycle correlation, and error tracking. Instrumented in AuthContext (signIn/signUp), SessionManager (ensureSession/refreshSession), and Supabase client utilities. See `docs/network-tracing.md` for usage guide.
- **State Management**: Uses `AuthContext` for user authentication and `DataContext` for application data. Local storage is used for cache-first loading.
- **File Structure**: Organized into `app/` (with sub-directories for auth, onboarding, tabs), `services/session/`, `api/`, `components/`, `contexts/`, `utils/`, and `types/`.

### Feature Specifications
- **User Authentication**: Supabase Auth with session management.
- **Lab Result Analysis**: AI-powered OCR and medical interpretation using Google Gemini 2.5 Flash.
- **Medication Safety**: AI safety analysis with FDA categorization and pregnancy risks.
- **Symptom Tracking**: Context-aware AI analysis and recommendations.
- **Voice Companion**: ElevenLabs text-to-speech integration for personalized weekly updates.
- **Multilingual Support**: Arabic/English with RTL layout.
- **Security**: Row Level Security, secure environment variable management, client-side validation, HTTPS, medical data encryption, user isolation, audit logging, and GDPR compliance.

### System Design Choices
- **Development Environment**: Configured for Replit with specific environment variables and workflow for `dev:web`.
- **Error Handling**: Comprehensive retry mechanisms and detailed logging with unique request IDs.
- **Performance**: Optimized for fast build times, cold starts, and hot reloads, with aggressive timeouts and single-flight prevention for network requests.
- **Replit Configuration**: 
  - Metro bundler configured to allow all hosts for proxy support
  - Dev server runs on 0.0.0.0:5000
  - CORS headers enabled in metro.config.js
  - Environment variables loaded from Replit Secrets

## External Dependencies

- **Supabase**: Used for database services, user authentication, and row-level security.
  - `EXPO_PUBLIC_SUPABASE_URL` (configured in Replit Secrets)
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY` (configured in Replit Secrets)
- **Google Gemini 2.5 Flash**: Integrated for AI capabilities including lab report analysis, medication safety analysis, and symptom analysis.
  - `GEMINI_API_KEY` (configured in Replit Secrets)
- **ElevenLabs**: Utilized for text-to-speech voice synthesis, providing a voice companion feature.
  - `ELEVENLABS_API_KEY` (optional, configured in Replit Secrets)

## Development Commands

- `npm run dev:web` - Start development server on port 5000 (current workflow)
- `npm run build:web` - Build for production deployment
- `npm run serve` - Serve production build
- `npm install --legacy-peer-deps` - Install dependencies

## Deployment

The app is configured for Replit autoscale deployment:
- **Build**: `npm run build:web` (exports to dist/)
- **Run**: `npx serve -s dist -l 5000`
- **Deployment Type**: Autoscale (stateless web app)

## Known Issues

- **Shadow Style Deprecation**: Some shadow styles use deprecated shadow* props instead of boxShadow (cosmetic issue, does not affect functionality).
- **Package Version**: expo-secure-store version mismatch warning (functional but could be updated in future).
