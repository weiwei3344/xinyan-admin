const express = require('express')
const router = require('./router/index')
const bodyParser = require('body-parser')
const cors = require('cors')

// 创建express应用
const app = express()

app.use(bodyParser.urlencoded({ extended:true }))
app.use(bodyParser.json())
app.use(cors())
app.use('/',router)


/*
// 中间函数
const myLogger = function(req, res, next) {
	console.log('myLogger')
	next() //next要调用，不调用的画不会被执行下一个
}

app.use(myLogger)

// 监听路由‘/’路径get请求 get请求可以在浏览器访问
app.get('/',function(req,res){
	// res.send('hello node')
	throw new Error('error...')
})

// 监听路由‘/user’路径的post请求 post请求在浏览器不可以被访问到
app.post('/user',function (req,res) {
	res.send('helllo xinyanwa')
})

// 自定义异常处理
function errorHandle(err,req,res,next) {
	console.log('errorHandler')
	res.status(400)
	res.send('down...')
}

app.use(errorHandle)
*/

// 使express监听5000端口号发起的http请求
const server = app.listen(5000,function(){
	// 监听到端口号和地址
	const { address, port } = server.address()
	console.log('Http 服务启动成功： http://%s:%s', address, port)
})
