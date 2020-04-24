const express = require('express')
const Result = require('../modules/result')
const { login, findUser } = require('../service/user')
const { md5, decode } = require('../utils/index')
const { PWD_SALT,PRIVATE_KEY,JWT_EXPIRED } = require('../utils/constant')
const { body, validationResult } = require('express-validator')
const boom = require('boom')
const jwt = require('jsonwebtoken')


const router = express.Router()

router.post('/login',
    [
        body('username').isString().withMessage('username类型不正确'),
        body('password').isString().withMessage('password类型不正确')
    ],
    function (req,res,next) {
    const err = validationResult(req)
        // console.log(err)
    if(!err.isEmpty()){
        const [{ msg }] = err.errors
        next(boom.badRequest(msg))
    } else{
        const username = req.body.username
        let password = req.body.password
        password = md5(`${password}${PWD_SALT}`)
        // console.log(username,password)
        login(username,password).then(user=>{
            console.log(user)
            if( !user || user.length ===0){
                new Result('登录失败，请检查用户名和密码是否正确').fail(res)
            } else {
                const token = jwt.sign(
                    {username},
                    PRIVATE_KEY,
                    {expiresIn: JWT_EXPIRED}
                )
                new Result({token},'登录成功').success(res)
            }
        })
    }
})

router.get('/info', function(req, res) {
    const decoded = decode(req)
    if (decoded && decoded.username) {
        findUser(decoded.username).then(user => {
            if (user) {
                user.roles = [user.role]
                new Result(user, '获取用户信息成功').success(res)
            } else {
                new Result('获取用户信息失败').fail(res)
            }
        })
    } else {
        new Result('用户信息解析失败').fail(res)
    }
})

/*router.get('/info',function (req,res,next) {
    const decoded = decode(req)
    if(decoded && decoded.username){
        findUser(decoded.username).then(user=>{
            if(user){
                // user.roles = [user.role]
                new Result(user,'获取用户信息成功').success(res)
            } else {
                new Result(user,'获取用户信息失败').fail(res)
            }
        })
    } else {
        new Result('用户信息解析失败').fail(res)
    }
})*/

module.exports = router


//curl http://127.0.0.1:5000/user/login -d "username=sam&password=123456"
