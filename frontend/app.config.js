// Environment variables are now available via Replit Secrets and EAS Secrets
// No need to load dotenv in Replit environment

export default ({ config }) => ({
  ...config,
  owner: "capoud7",
  expo: {
    newArchEnabled: true,
    jsEngine: "hermes",
    name: "Hamly",
    slug: "hamly-md",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/app-icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/app-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.hamlymd.app",
    },
    android: {
      package: "com.hamlymd.app",
      adaptiveIcon: {
        foregroundImage: "./assets/images/app-icon.png",
        backgroundColor: "#ffffff",
      },
      softwareKeyboardLayoutMode: "pan",
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
      ],
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/favicon.png",
      dangerousAllowMutuallyExclusiveExtensions: true,
      build: {
        babel: {
          include: ["@supabase/supabase-js"],
        },
      },
    },
    runtimeVersion: "1.0.0",
    plugins: [
      "expo-router",
      "expo-font",
      [
        "expo-camera",
        {
          cameraPermission:
            "Allow Hamly to access your camera to take photos of lab reports and documents.",
        },
      ],
      [
        "expo-document-picker",
        {
          documentsPermission:
            "Allow Hamly to access your documents to upload lab reports.",
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/app-icon.png",
          color: "#ffffff",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: "c20d667e-0a29-4ad6-9042-ce3ef763d504",
      },
      supabaseUrl:
        process.env.EXPO_PUBLIC_SUPABASE_URL ||
        "https://uzhtruxyzxtqappavqhr.supabase.co",
      supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aHRydXh5enh0cWFwcGF2cWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MjE4NjcsImV4cCI6MjA3MzQ5Nzg2N30.7GtsyCg09d0rtl-iDPTKXm8FkbtObJR1HN7Q3nIGC6c",
      apiBaseUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL ||
        "https://al-mugwumpian-patience.ngrok-free.dev",
      // Note: Server-side API keys (Gemini, ElevenLabs) should NOT be exposed to client
      // These will be handled via server-side API endpoints or Replit Secrets
    },
  },
});
