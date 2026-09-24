import http from 'http';

import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/database';
import { initSocket } from './socket';
import { initMqtt } from './utils/mqttClient';

const server = http.createServer(app);

initSocket(server);

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected to the database');

    initMqtt();

    server.listen(env.PORT, () => {
      logger.info(`CodeTrack server running on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();

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
