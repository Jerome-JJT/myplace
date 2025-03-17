import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from "./consts";

const redis = require('redis');
// import redis from 'redis';

export const redisClient = redis.createClient({
    socket: {
        host: REDIS_HOST,
        port: REDIS_PORT
    },
    password: REDIS_PASSWORD
});
redisClient.connect();
