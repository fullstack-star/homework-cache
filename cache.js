
const config = require('./config').redis
const redis = require('redis')
// redis链接

const client = redis.createClient({
  host: config.host,
  port: config.port
})

const sleep = (time = 0) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  })
}
const tryLock = async (key, timeout, resolve, reject, self) => {
  // 超时获取新锁,删除原来的锁, 没有超时就进入抢锁
  const currentLockTime = await self.get(key)
  if (currentLockTime < Date.now()) {
    client.getset(key, timeout + Date.now(), async (err, oldTime) => {
      if (err) return reject(err)
      // 两个锁时间相同才证明是同一个锁，否则已经被抢，进入抢锁阶段
      if (currentLockTime == oldTime && oldTime !== null) {
        client.setnx(key, timeout + Date.now(), async (err, islock) => {
          if (err) reject(err)
          else {
            await self.unlock(key)
            client.setnx(key, timeout + Date.now(), (err, islock) => {
              if (err) reject(err)
              else resolve(islock)
            })
          }
        })
      } else {
        // 没有取到锁，一段时间后重新获取
        while(true) {
          if (currentLockTime < Date.now()) {
            tryLock(key, timeout, resolve, reject, self)
            break
          } else {
            await sleep(timeout)
          }
        }
      }
    })
  } else {
    while(true) {
      if (currentLockTime < Date.now()) {
        tryLock(key, timeout, resolve, reject, self)
        break
      } else {
        await sleep(timeout)
      }
    }
  }
}

module.exports = {
  get: async (key) => {
    return new Promise((resolve, reject) => {
      client.get(key, (err, data) => {
        if (err) reject(err)
        else {
          try {
            resolve(data ? JSON.parse(data) : data)
          } catch {
            resolve('')
          }
        }
      })
    })
  },
  set: async (key, value, exp, tim) => {
    return new Promise((resolve, reject) => {
      client.set(key, value, exp, tim, (err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
  },
  lock: async function (key, timeout) {
    /// 考虑两个因素：
    /// 1. 某个请求获取到锁后，在解锁时，redis出错，可能造成死锁，所以要设置超时时间。
    /// 2. 设置了超时时间会有一个新的问题，如果多个请求获取到超时，那么会多次删除锁，但是之前获得锁的请求依然会执行先去。
    /// 例如： b,c 读取到超时后，删除锁，设置新锁，b获得锁，然后c也删除锁，设置新锁，c也获得锁，所以b，c同时有锁。
    const self = this
    return new Promise((resolve, reject) => {
      client.setnx(key, timeout + Date.now(), (err, islock) => {
        if (err) return reject(err)
        if (islock) {
          resolve(islock)
        } else {
          // 没有获得锁就判断是否超时
          tryLock(key, timeout, resolve, reject, self)
        }
      })
    })
  },
  unlock: async (key) => {
    return new Promise((resolve, reject) => {
      client.del(key, (err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
  },
}