// messageQueue.js
const Queue = require('bull');
const redisService = require('./redis'); // Import the Redis connection

// Create message queue using the existing Redis connection
const messageQueue = new Queue('message-waqueue', {
  redis: {
    host: redisService.connection.options.host,
    port: redisService.connection.options.port 
  }
});

// Export the message queue and Redis connection
module.exports = { messageQueue, redisConnection: redisService.connection };
