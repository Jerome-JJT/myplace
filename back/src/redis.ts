const redis = require('redis');
// import redis from 'redis';

export const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT!)
    },
    password: process.env.REDIS_PASSWORD
});
redisClient.connect();
