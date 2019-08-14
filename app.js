const Koa = require('koa');
const app = new Koa();
var Redis = require('ioredis');
var redis = new Redis({
	port: 6379,
	host: '127.0.0.1'
});
// 模拟数据查询过程
function queryData() {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve({name: 'tovinping'})
		}, 2000)
	})
}

app.use(async(ctx) => {
	let data = await redis.get('data')
	if (!data) {
		const lock = await redis.setnx('data', 'lock')
		if (lock) {
			data = await queryData()
			redis.del('data')
			const r = await redis.setnx('data', JSON.stringify(data))  // r:1 设置成功100ms后删除(过期)
			console.log('setDATA')
			if (r > 0) {
				setTimeout(() => {
					redis.del('data')
				}, 1000);
			}
			ctx.body = data
		} else {
			console.log('没有获取到锁')
			// 集群模式下：100个客户端共发10000条请求，会出现没有获取到锁的情况
			const timer  = setInterval(async () => {
				const d = await redis.get('data')
				if (d && d !== 'lock') { // !== lock 是因为line 20设置的了lock
					console.log(d)
					ctx.body = d
					clearInterval(timer)
				}
			}, 900);
		}
	} else {
		ctx.body = data
	}
})
app.listen(9000, (err) => {
  console.log('监听服务器启动=====\n')
  if (err) {
    console.error(err)
    return
  }
  console.log(`Server listening on 9000`)
})