import mqtt, { type IClientOptions, type MqttClient } from 'mqtt';
import { logger } from './logger';
import { env } from '../config/env';

let client: MqttClient | null = null;

function getClient(): MqttClient | null {
  if (!env.ENABLE_MQTT) return null;
  if (client) return client;

  const options: IClientOptions = {
    reconnectPeriod: 5000,
  };

  if (env.MQTT_USERNAME) {
    options.username = env.MQTT_USERNAME;
    options.password = env.MQTT_PASSWORD;
  }

  client = mqtt.connect(env.MQTT_URL, options);

  client.on('connect', () => {
    logger.info(`Connected to MQTT Broker at ${env.MQTT_URL}`);
    client!.subscribe('codetrack/session/+/control', { qos: 1 }, (err) => {
      if (err) logger.error({ err }, 'Failed to subscribe to MQTT control topics');
      else logger.info('Subscribed to codetrack/session/+/control');
    });
  });

  client.on('message', (topic, payload) => {
    try {
      const message = JSON.parse(payload.toString());
      logger.info({ topic, message }, 'MQTT control message received');
    } catch (err) {
      logger.warn({ err, topic }, 'Invalid MQTT control payload');
    }
  });

  client.on('error', (err) => {
    logger.error({ err }, 'MQTT Client Error');
  });

  client.on('offline', () => {
    logger.warn('MQTT Client Offline');
  });

  client.on('reconnect', () => {
    logger.info('MQTT Client Reconnecting...');
  });

  return client;
}

/**
 * Soft-fail publish: never throws into request handlers.
 * No-op when ENABLE_MQTT=false.
 */
export const publishSessionStatus = (sessionId: string, payload: unknown) => {
  if (!env.ENABLE_MQTT) return;
  try {
    const mqttClient = getClient();
    if (!mqttClient) return;
    const topic = `codetrack/session/${sessionId}/status`;
    mqttClient.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
      if (err) logger.error({ err, topic }, 'Failed to publish to MQTT');
    });
  } catch (err) {
    logger.error({ err }, 'MQTT publish threw unexpectedly — ignored');
  }
};

/** Connect at boot only when IoT is enabled. */
export const initMqtt = () => {
  if (!env.ENABLE_MQTT) {
    logger.info('MQTT disabled (ENABLE_MQTT=false) — skipping broker connection');
    return;
  }
  try {
    getClient();
  } catch (err) {
    logger.error({ err }, 'MQTT init failed — continuing without broker');
  }
};
