// redis.js
import Redis from 'ioredis';
import config from './config.js';

const redis = new Redis(config.redis);

export default redis;
