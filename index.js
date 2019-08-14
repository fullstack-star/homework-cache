const Koa = require("koa");
const Router = require("koa-router");

const app = new Koa();
const router = new Router();

const db = require("./db");
const cache = require("./cache");

router.get("/cache", async (ctx, next) => {
  const lockName = "cache-lock";
  const lockMaxDuration = 2000;

  const getCacheData = async () => {
    let top5 = await cache.get("top5");
    console.log("get chche:", top5 && top5.length);

    // get access to lock...
    if (!top5) {
      const lockRes = await cache.lock(lockName, lockMaxDuration);
      if (lockRes === 1) {
        top5 = await db.query("select * from todos limit 5");
        try {
          await cache.set("top5", JSON.stringify(top5), "PX", 30000);
          await cache.unlock(lockName);
        } catch (error) {
          ctx.body = [];
        }
        console.log("set chche:", top5.length);
      } else {
        // when lock: true, top5: false
        const expired = cache.hasExpired(lockName);
        if (!expired) {
          setTimeout(async () => {
            await getCacheData();
          }, 200);
        } else {
          ctx.body = [];
        }
      }
    }
    ctx.body = top5;
  };

  await getCacheData();
});

app.use(router.routes()).listen(4000, () => {
  console.log("server is running at port: 4000");
});
