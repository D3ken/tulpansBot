import IORedis from 'ioredis';

export const redis = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  db: 0,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => {
  console.log('Redis подключён');
});

redis.on('ready', () => {
  console.log('Redis готов к работе');
});

redis.on('error', (err) => {
  console.error('Ошибка Redis:', err.message);
});

redis.on('close', () => {
  console.log('Соединение с Redis закрыто');
});
