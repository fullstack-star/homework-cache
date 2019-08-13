const Koa = require('koa')
Router = require('koa-router')

const app = new Koa()
const router = new Router()

const db = require('./db')
const cache = require('./cache')

router.get('/cache', async(ctx, next) => {
  let top5 =  await cache.get('top5')
  console.log('get chche:', top5 && top5.length)
  if (!top5) {
    try {
      if (await cache.lock('lockTop', 20)) {
        top5 = await db.query('select * from todos limit 5')
        await cache.set('top5', JSON.stringify(top5), 'PX', 1)
        console.log('set chche:', top5.length)
        await cache.unlock('lockTop')
      } else {
        // 测试是否没锁
        console.log('没锁')
      }
    } catch (error) {
      console.log(error)
      ctx.body = []
    }
  }
  ctx.body = top5
})

app
  .use(router.routes())
  .listen(4000)