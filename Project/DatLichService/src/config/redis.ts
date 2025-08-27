import Redis from 'ioredis';

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  connectTimeout: 10000,
  lazyConnect: true,
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  }
});

redisClient.on('error', (err) => {
  console.warn('Redis Client Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

redisClient.on('close', () => {
  console.warn('Redis Client Connection Closed');
});

redisClient.on('end', () => {
  console.warn('Redis Client Connection Ended');
});

export default redisClient; 