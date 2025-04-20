// redisService.js
const Redis = require('ioredis');

const redisOptions = {
  host: 'redis', // Redis service in docker-compose
  port: 6379
};

const connection = new Redis(redisOptions);

// Redis client to interact with Redis
async function set(key, value, expiration = 3600) {
  await connection.set(key, value, 'EX', expiration); // EX is the expiration time in seconds
}

async function get(key) {
  return await connection.get(key);
}

async function del(key) {
  await connection.del(key);
}

async function keys(pattern) {
  return await connection.keys(pattern);
}

module.exports = {
  connection,
  set,
  get,
  del,
  keys
};
