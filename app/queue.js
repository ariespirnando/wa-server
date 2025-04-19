const Queue = require('bull');
const Redis = require('ioredis');

const redisOptions = {
  host: 'redis',//'192.168.1.226', // Service name in docker-compose
  port: 6379
};

const redisConnection = new Redis(redisOptions);

// Create message queue
const messageQueue = new Queue('message-waqueue', {
  redis: redisOptions
});

module.exports = { messageQueue, redisConnection };
