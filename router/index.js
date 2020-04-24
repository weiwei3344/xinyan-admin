const express = require('express')
const boom = require('boom')
const userrouter = require('./user')
const bookrouter = require('./book')
const jwtAuth = require('./jwt')
const Result = require('../modules/result')
const { CODE_ERROR } = require('../utils/constant')

// 注册路由
const router = express.Router()

// 对所有路由进行 jwt 认证
router.use(jwtAuth)

router.get('/',function (req,res) {
     res.send('欢迎来到xinyan书屋')
})



router.use('/book',bookrouter)
router.use('/vue-element-admin/user',userrouter)


router.use((req,res,next)=>{
    next(boom.notFound('接口不存在'))
})

router.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        new Result(null, 'token失效', {
            error: err.status,
            errorMsg: err.name
        }).expired(res.status(err.status))
    } else {
        const msg = (err && err.message) || '系统错误'
        const statusCode = (err.output && err.output.statusCode) || 500;
        const errorMsg = (err.output && err.output.payload && err.output.payload.error) || err.message
        new Result(null, msg, {
            error: statusCode,
            errorMsg
        }).fail(res.status(statusCode))
    }
})

module.exports = router
