import http from 'http';

import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/database';
import { initSocket } from './socket';

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected to the database');

    server.listen(env.PORT, () => {
      logger.info(`🚀 CodeTrack server running on port ${env.PORT} (development)`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server...');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
