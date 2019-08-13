const Koa = require('koa');
const app = new Koa();
var Redis = require('ioredis');
var redis = new Redis({
	port: 6379,
	host: '127.0.0.1'
});

function queryData() {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve({name: 'tovinping'})
		}, 2000)
	})
}

app.use(async(ctx) => {
	let data = await redis.get('data')
	console.log(data)
	if (!data) {
		const lock = await redis.setnx('data', 'lock')
		if (lock) {
			console.log('全进来了？')
			redis.del('data')
			data = await queryData()
			const r = await redis.setnx('data', JSON.stringify(data))  // r:1 设置成功100ms后删除(过期)
			redis.publish('setData', data)
			if (r > 0) {
				setTimeout(() => {
					redis.del('data')
				}, 1000);
			}
		} else {
			console.log('noLock')
			redis.subscribe('setData')
			redis.on('message', (channel, msg) => {
				console.log(msg)
				if (channel === 'setData') {
					ctx.body = msg
				}
			})
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