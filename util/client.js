//引入redis
const redis = require('redis');

// 连接redis服务器
client = redis.createClient({
    host: '127.0.0.1',
     port: 6379,
});

//错误监听？
client.on('error', function (err) {
    console.log('error: ', err);
});

client.on('connect', function() {
    console.log('Redis 连接成功！')
});

const REDIS_LOCK_KEY = 'cache-lock:';

const redisSet = async (key, value, exp, time) => {
    const lockKey = REDIS_LOCK_KEY + key;
    await redisLock(lockKey);
    return new Promise((resolve, reject) => {
        client.set(key, value, exp, time, async (err, result) => {
            await redisUnlock(lockKey);
            err ? reject(err) : resolve(result);
        })
    })
};

const redisGet = key => {
    return new Promise((resolve, reject) => {
        client.get(key, (err, result) => {
            if(err) reject(err);
            else {
                try {
                    result = JSON.parse(result);
                    resolve(result);
                } catch (err) {
                    console.log('err: ', err);
                    resolve(result);
                }
            }
        })
    })
};

// 锁成功返回1，已锁返回0
const redisLock = (key) => {
    return new Promise((resolve, reject) => {
        console.log('---------------- redisLock -----------------');
        client.setnx(key, Date.now(), (err, islock) => {
            if (err) reject(err);
            else resolve(islock);
        })
    })
}

const redisCheckLock = (key) => {
    const lockKey = REDIS_LOCK_KEY + key;

    return new Promise((resolve, reject) => {
        console.log('---------------- redisCheckLock -----------------');
        client.get(lockKey, (err, result) => {
            if(err) reject(err);
            else {
                resolve(result);
            }
        })
    })
}

// 解锁成功返回1，已锁返回0
const redisUnlock = (key) => {
    return new Promise((resolve, reject) => {
        console.log('---------------- redisUnlock -----------------');
        client.del(key, (err, data) => {
            if (err) reject(err)
            else resolve(data)
        });
    });
}

module.exports = {
    set: redisSet,
    get: redisGet,
    lock: redisLock,
    checkLock: redisCheckLock,
    unlock: redisUnlock,
};