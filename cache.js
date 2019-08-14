const config = require("./config").redis;
const redis = require("redis");

const client = redis.createClient({
  host: config.host,
  port: config.port
});

// TODO: 用于记录锁定时间，方便判断超时解锁
const locksMap = {};

module.exports = {
  get: async key => {
    return new Promise((resolve, reject) => {
      client.get(key, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  },
  set: async (key, value, exp, tim) => {
    return new Promise((resolve, reject) => {
      client.set(key, value, exp, tim, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  },
  lock: async (key, duration) => {
    return new Promise((resolve, reject) => {
      client.setnx(key, "", (err, data) => {
        if (err) reject(err);
        else {
          data === 1 &&
            (locksMap[key] = new Date().getTime()) + Number(duration);
          resolve(data);
        }
      });
    });
  },
  unlock: async key => {
    return new Promise((resolve, reject) => {
      client.del(key, (err, data) => {
        if (err) reject(err);
        else {
          delete locksMap[key];
          resolve(data);
        }
      });
    });
  },
  hasExpired: key => {
    return locksMap[key] < new Date().getTime();
  }
};
