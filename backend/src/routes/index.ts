import express from 'express';
import { POST as medicationSafetyHandler, OPTIONS as medicationOptions } from './medication-safety';
import { POST as labReportHandler, OPTIONS as labReportOptions } from './process-lab-report';
import { POST as symptomAnalysisHandler, OPTIONS as symptomOptions } from './analyze-symptom';

export function createServerRoutes(): express.Router {
  const router = express.Router();

  // API root endpoint
  router.get('/', (req: express.Request, res: express.Response) => {
    res.json({
      message: 'Hamly API',
      version: '1.0.0',
      endpoints: [
        '/api/health',
        '/api/medication-safety-api',
        '/api/process-lab-report-api',
        '/api/analyze-symptom-api'
      ]
    });
  });

  // Health check endpoint
  router.get('/health', (req: express.Request, res: express.Response) => {
    res.json({ 
      ok: true, 
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Medication Safety API - Direct handler conversion
  router.options('/medication-safety-api', async (req: express.Request, res: express.Response) => {
    try {
      const request = new Request(`http://localhost${req.path}`, {
        method: 'OPTIONS',
      });
      const response = await medicationOptions(request);
      res.status(response.status).set(Object.fromEntries(response.headers.entries())).send();
    } catch (error) {
      res.status(500).end();
    }
  });

  router.post('/medication-safety-api', async (req: express.Request, res: express.Response) => {
    try {
      const request = new Request(`http://localhost${req.path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
          ...(req.headers['x-goog-api-key'] && { 'x-goog-api-key': req.headers['x-goog-api-key'] as string }),
          ...(req.headers['ngrok-skip-browser-warning'] && { 'ngrok-skip-browser-warning': req.headers['ngrok-skip-browser-warning'] as string }),
          ...(req.headers['user-agent'] && { 'User-Agent': req.headers['user-agent'] as string }),
        },
        body: JSON.stringify(req.body),
      });

      const response = await medicationSafetyHandler(request);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error('Medication safety error:', error);
      res.status(500).json({
        error: error.message || 'Internal server error',
      });
    }
  });

  // Lab Report API - Direct handler conversion with OPTIONS support
  router.options('/process-lab-report-api', async (req: express.Request, res: express.Response) => {
    try {
      const request = new Request(`http://localhost${req.path}`, {
        method: 'OPTIONS',
      });
      const response = await labReportOptions(request);
      res.status(response.status).set(Object.fromEntries(response.headers.entries())).send();
    } catch (error) {
      res.status(500).end();
    }
  });

  router.post('/process-lab-report-api', async (req: express.Request, res: express.Response) => {
    try {
      const request = new Request(`http://localhost${req.path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
          ...(req.headers['x-goog-api-key'] && { 'x-goog-api-key': req.headers['x-goog-api-key'] as string }),
          ...(req.headers['ngrok-skip-browser-warning'] && { 'ngrok-skip-browser-warning': req.headers['ngrok-skip-browser-warning'] as string }),
          ...(req.headers['user-agent'] && { 'User-Agent': req.headers['user-agent'] as string }),
        },
        body: JSON.stringify(req.body),
      });

      const response = await labReportHandler(request);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error('Process lab report error:', error);
      res.status(500).json({
        error: error.message || 'Internal server error',
      });
    }
  });

  // Symptom Analysis API - Direct handler conversion
  router.options('/analyze-symptom-api', async (req: express.Request, res: express.Response) => {
    try {
      const request = new Request(`http://localhost${req.path}`, {
        method: 'OPTIONS',
      });
      const response = await symptomOptions(request);
      res.status(response.status).set(Object.fromEntries(response.headers.entries())).send();
    } catch (error) {
      res.status(500).end();
    }
  });

  router.post('/analyze-symptom-api', async (req: express.Request, res: express.Response) => {
    try {
      const request = new Request(`http://localhost${req.path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
          ...(req.headers['x-goog-api-key'] && { 'x-goog-api-key': req.headers['x-goog-api-key'] as string }),
          ...(req.headers['ngrok-skip-browser-warning'] && { 'ngrok-skip-browser-warning': req.headers['ngrok-skip-browser-warning'] as string }),
          ...(req.headers['user-agent'] && { 'User-Agent': req.headers['user-agent'] as string }),
        },
        body: JSON.stringify(req.body),
      });

      const response = await symptomAnalysisHandler(request);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error('Analyze symptom error:', error);
      res.status(500).json({
        error: error.message || 'Internal server error',
      });
    }
  });

  return router;
}
