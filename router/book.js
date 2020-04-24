const express = require('express')
const multer = require('multer')
const {UPLOAD_PATH} = require('../utils/constant')
const Result = require('../modules/result')
const Book = require('../modules/Book')
const boom = require('boom')
const {decode} = require('../utils/index')
const bookServer = require('../service/book')

const router = express.Router()

router.post('/upload',
    multer({dest: `${UPLOAD_PATH}/book`}).single('file'),
    function (req, res, next) {
        if (!req.file || req.file.length === 0) {
            new Result('上传电子书失败').fail(res)
        } else {
            const book = new Book(req.file)
            book.parse().then((book) => {
                // console.log(book)
                new Result(book, '上传电子书成功').success(res)
            })
                .catch(err => {
                    next(boom.badImplementation(err))
                })
        }
    })

router.post('/create', function (req, res, next) {
    const decoded = decode(req)
    const data = req.body
    if (decoded && decoded.username) {
        data.username = decoded.username
    }
    const book = new Book(null, data)
    // console.log(book)
    bookServer.insertBook(book).then(() => {
        new Result('添加电子书成功').success(res)
    }).catch(err => {
        next(boom.badImplementation(err))
    })
})

router.post('/updata', function (req, res, next) {
    const decoded = decode(req)
    const data = req.body
    if (decoded && decoded.username) {
        req.body.username = decoded.username
    }
    const book = new Book(null, req.body)
    // console.log(book)
    bookServer.updataBook(book).then(() => {
        new Result('更新电子书成功').success(res)
    }).catch(err => {
        next(boom.badImplementation(err))
    })
})

/**
 * 这里我也不知道为啥是从req.query.fileName里面你拿出来，老师中的是直接body里面
 * 但我好像body中没有
 * */
router.get('/get', function (req, res, next) {
    const fileName = req.query.fileName
    // console.log(req.query.fileName)
    if (!fileName) {
        // console.log(fileName)
        next(boom.badRequest(new Error('参数fileName不能为空')))
    } else {
        bookServer.getBook(fileName).then(book => {
            new Result(book, '获取图书信息成功').success(res)
        }).catch(err => {
            next(boom.badImplementation(err))
        })
    }
})

router.get('/category', function (req, res, next) {
    // console.log('1111111111111111111')
    bookServer.getCategory().then(category => {
        new Result(category, '获取图书分类成功').success(res)
    }).catch(err => {
        boom.badImplementation(new Error(err))
    })
})

router.get('/list', function (req, res, next) {
    bookServer.listBook(req.query).then(({list, count, page, pageSize}) => {
        new Result({list, count, page: +page, pageSize: +pageSize}, '获取图书列表成功').success(res)
    }).catch(err => {
        boom.badImplementation(new Error(err))
    })
})

/**
 * 这里需要优化下路径
 */

router.get('/delete',function (req,res,next) {
    const { fileName } =req.query
    if (!fileName) {
        next(boom.badImplementation(new Error('参数fileName不能为空')))
    } else {
        bookServer.deleteBook(fileName).then(()=>{
            new Result('删除图书信息成功').success(res)
        }).catch(err=>{
            next(boom.badImplementation(err))
        })
    }
})

module.exports = router
