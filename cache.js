
const config = require('./config').redis
const redis = require('redis')
// redis链接

const client = redis.createClient({
  host: config.host,
  port: config.port
})

module.exports = {
  get: async (key) => {
    return new Promise((resolve, reject) => {
      client.get(key, (err, data) => {
        if (err) reject(err)
        else resolve(data)
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
  }
}