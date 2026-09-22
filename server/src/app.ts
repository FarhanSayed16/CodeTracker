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

import { env } from './config/env';
import { logger } from './utils/logger';
import { apiLimiter } from './middleware/rateLimiter';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// 1. helmet()
app.use(helmet());

// 2. cors()
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// 3. express.json()
app.use(express.json());

// 4. pino-http request logging
app.use(
  pinoHttp({
    logger,
    autoLogging: process.env.NODE_ENV !== 'test',
  })
);

// 5. Rate limiter (apply to /api)
app.use('/api', apiLimiter);

// 6. Static file serving (public/)
app.use(express.static(path.join(__dirname, '../public')));

// 7. Route mounting placeholders
app.use('/api/auth', authRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/responses', responsesRoutes);

// 8. notFoundHandler
app.use(notFoundHandler);

// 9. errorHandler (last)
app.use(errorHandler);

export default app;
