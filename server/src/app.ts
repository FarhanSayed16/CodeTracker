import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import path from 'path';
import authRoutes from './modules/auth/auth.routes';
import classesRoutes from './modules/classes/classes.routes';
import sessionsRoutes from './modules/sessions/sessions.routes';
import tasksRoutes from './modules/tasks/tasks.routes';
import responsesRoutes from './modules/responses/responses.routes';
import institutionsRoutes from './modules/institutions/institutions.routes';
import departmentsRoutes from './modules/departments/departments.routes';

import { logger } from './utils/logger';
import { corsOriginOption } from './config/corsOrigins';
import { apiLimiter } from './middleware/rateLimiter';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const publicDir = path.join(__dirname, '../public');
/** Opt-in: serve dashboard dist at /app. Prefer a separate dashboard host in labs. */
const serveDashboard = process.env.SERVE_DASHBOARD === 'true';

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: corsOriginOption(),
    credentials: true,
  })
);

app.use(express.json());

app.use(
  pinoHttp({
    logger,
    autoLogging: process.env.NODE_ENV !== 'test',
  })
);

app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'codetrack' });
});

app.use('/api/auth', authRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/responses', responsesRoutes);
app.use('/api/institutions', institutionsRoutes);
app.use('/api/departments', departmentsRoutes);

// Student join assets — never claim `/` via index.html
app.use(express.static(publicDir, { index: false }));

/** Canonical student join (phones / no-companion fallback). */
app.get('/join', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

/**
 * Root:
 * - ?code= → /join?code= (QR / shared links)
 * - else → /join (student) — dashboard stays on its own origin in typical deploys
 */
app.get('/', (req, res) => {
  const code = req.query.code;
  if (code != null && String(code).length > 0) {
    return res.redirect(302, `/join?code=${encodeURIComponent(String(code))}`);
  }
  if (serveDashboard) {
    return res.redirect(302, '/app');
  }
  return res.redirect(302, '/join');
});

if (serveDashboard) {
  const dashboardDist = path.join(__dirname, '../../dashboard/dist');
  app.use(
    '/app',
    express.static(dashboardDist, {
      // built assets may assume base `/` — prefer separate dashboard host in labs
      index: false,
    })
  );
  app.get(/^\/app(\/.*)?$/, (req, res, next) => {
    res.sendFile(path.join(dashboardDist, 'index.html'), (err) => {
      if (err) next();
    });
  });
  logger.info('Serving professor dashboard at /app (prefer a separate dashboard host when possible)');
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
