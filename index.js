const Koa = require("koa");
const Router = require("koa-router");

const app = new Koa();
const router = new Router();

const db = require("./db");
const cache = require("./cache");

router.get("/cache", async (ctx, next) => {
  let top5 = await cache.get("top5");
  console.log("get chche:", top5 && top5.length);
  if (!top5) {
    top5 = await db.query("select * from todos limit 5");
    try {
      await cache.set("top5", JSON.stringify(top5), "PX", 10);
    } catch (error) {
      ctx.body = [];
    }
    console.log("set chche:", top5.length);
  }
  ctx.body = top5;
});

app.use(router.routes()).listen(4000);
