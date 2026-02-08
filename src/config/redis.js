import { createClient } from 'redis';

const redisClient = createClient();
redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
    await redisClient.connect();
})();

export default redisClient;