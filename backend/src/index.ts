import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServerRoutes } from './routes';
import { requestLogger } from './middleware/requestLogger';

const app = express();

// CORS configuration - Dynamic origins from environment
const allowedOrigins = [
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://0.0.0.0:5000",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  // Add Replit frontend domain
  "https://bae4d653-aebf-4c19-973a-dfccb785f6cd-00-13kummoz7ce1d.riker.replit.dev",
  //add vercel domain
  "https://hamly-frontend.vercel.app",
    // Add mobile app origin (native apps send null or file://)
    "null",
    "file://",
    // For production APK
    "capacitor://localhost",
    "ionic://localhost"
];

// Add ngrok domain from environment variable if provided
if (process.env.EXPO_PUBLIC_API_URL) {
  allowedOrigins.push(process.env.EXPO_PUBLIC_API_URL);
}
if (process.env.EXPO_PUBLIC_API_BASE_URL && process.env.EXPO_PUBLIC_API_BASE_URL !== process.env.EXPO_PUBLIC_API_URL) {
  allowedOrigins.push(process.env.EXPO_PUBLIC_API_BASE_URL);
}

console.log("🔒 CORS allowed origins:", allowedOrigins);

// CORS origin checker function - allows Netlify and Replit domains
const corsOriginChecker = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Allow requests with no origin (like mobile apps or curl)
  if (!origin) {
    return callback(null, true);
  }

  // Check if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  // Allow Netlify domains
  if (origin.includes('.netlify.app')) {
    return callback(null, true);
  }

  // Allow Replit domains
  if (origin.includes('.replit.dev')) {
    return callback(null, true);
  }

  // Allow wildcard (for development)
  if (allowedOrigins.includes('*')) {
    return callback(null, true);
  }

  // Otherwise reject
  callback(new Error('Not allowed by CORS'));
};

app.use(
  cors({
    origin: corsOriginChecker,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-goog-api-key', 'ngrok-skip-browser-warning', 'User-Agent', 'Accept', 'Accept-Language'],
    exposedHeaders: ['ngrok-skip-browser-warning'],
    credentials: true,
    preflightContinue: false, // Let CORS middleware handle preflight completely
    optionsSuccessStatus: 204,
  }),
);

app.use(express.json({ limit: '2mb' }));

// Add ngrok-skip-browser-warning to all responses
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.header('ngrok-skip-browser-warning', 'true');
  next();
});

// Request logging middleware (logs all requests to console and file)
app.use(requestLogger);

// Mount app-specific routes
app.use('/api', createServerRoutes());

// Global OPTIONS handler for preflight requests
app.options('*', (req: express.Request, res: express.Response) => {
  const origin = (req.headers.origin as string) || '*';
  const requestedHeaders = req.headers['access-control-request-headers'] as string;
  
  // Build allowed headers list, ensuring ngrok header is always included
  const allowedHeaders = requestedHeaders 
    ? `${requestedHeaders}, ngrok-skip-browser-warning, User-Agent`
    : 'Content-Type, Authorization, x-goog-api-key, ngrok-skip-browser-warning, User-Agent, Accept, Accept-Language';
  
  // Reflect origin and requested headers to satisfy strict browsers
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', allowedHeaders);
  res.header('Access-Control-Expose-Headers', 'ngrok-skip-browser-warning');
  res.header('Access-Control-Max-Age', '86400');
  // IMPORTANT: Add ngrok skip header to response
  res.header('ngrok-skip-browser-warning', 'true');
  res.sendStatus(204); // 204 is more appropriate for OPTIONS
});

// Root endpoint
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({
    message: 'Hamly Backend API',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/medication-safety-api',
      '/api/process-lab-report-api',
      '/api/analyze-symptom-api'
    ]
  });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`🚀 Backend listening on port ${port}`);
  console.log(`📍 API endpoints available at http://localhost:${port}/api`);
});