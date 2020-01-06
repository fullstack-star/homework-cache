const Koa = require('koa');
const Router = require('koa-router');
const redisCli = require('./util/client');
const db = require('./util/db');

const app = new Koa();
const router = new Router();

const PORT = 3000;
const CACHE_KEY = 'cache-top5';

router.get('/', async (ctx, next) => {
    await next();
    redisCli.set('testcli', '我只是想看看封装的能不能用着了', 'EX', 3600);
    ctx.body = `It's OK! ${PORT}`
});

router.get('/cache', async (ctx, next) => {
    await next();

    let top5 = await redisCli.get(CACHE_KEY);
    if(!top5) {
        top5 = await db.query('select * from websites limit 5');
        console.log('get db: ', top5.length);
        if(await redisCli.checkLock(CACHE_KEY)) {
            ctx.body = top5;
        }
        try {
            await redisCli.set(CACHE_KEY, JSON.stringify(top5), 'PX', 360000);
        } catch (err) {
            console.log(`redisCli set err: ${err}`);
            ctx.body = top5;
        }
    }

    console.log('get cache: ', top5.length);
    ctx.body = top5;
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, () => {
    console.log(`listening http://localhost:${PORT}`);
});