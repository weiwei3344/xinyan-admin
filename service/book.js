const Book = require('../modules/Book')
const db = require('../db/index')
const _ = require('lodash')

/**
 * 方法用来查询数据库中有没有相同记录
 * @param book
 * @returns {Promise | Promise<unknown>}
 */

function exists(book) {
    const {title, author, publisher} = book
    const sql = `select * from book where title= '${title}' and author= '${author}' and publisher= '${publisher}'`
    return db.querOne(sql)
}

/**
 * 移除电子书
 * @param book
 */

async function removeBook(book) {
    if (book) {
        book.reset()
        if (book.fileName) {
            const removeBookSql = `delete from book where fileName = '${book.fileName}'`
            const removeContentsSql = `delete from contents where fileName = '${book.fileName}'`
            await db.querySql(removeBookSql)
            await db.querySql(removeContentsSql)
        }
    }
}

async function insertContents(book) {
    const contents = book.getContents()
    // console.log(contents)
    if (contents && contents.length > 0) {
        for (let i = 0; i < contents.length; i++) {
            const content = contents[i]
            const _content = _.pick(content, [
                'fileName',
                'id',
                'text',
                'href',
                'order',
                'level',
                'label',
                'pid',
                'navId'
            ])
            // console.log('_content', _content)
            await db.insert(_content, 'contents')
            // console.log('111111111111111111111')
        }
    }
}

function insertBook(book) {
    return new Promise(async (resolve, reject) => {
        try {
            if (book instanceof Book) {
                const result = await exists(book)
                if (result) {
                    await removeBook(book)
                    reject(new Error('电子书已存在'))
                } else {
                    await db.insert(book.toDb(), 'book')
                    await insertContents(book)    //电子书目录创建
                    resolve()
                }
            } else {
                reject(new Error('添加图书不合法'))
            }
        } catch (e) {
            reject(e)
        }
    })
}

function updataBook(book) {
    return new Promise((async (resolve, reject) => {
        try {
            if (book instanceof Book) {
                const result = await getBook(book.fileName)
                if (result) {
                    const model = book.toDb()
                    if (+result.updateType === 0) {
                        reject(new Error('内置图书不能进行操作'))
                    } else {
                        await db.update(model, 'book', `where fileName = '${book.fileName}'`)
                        resolve()
                    }
                }
            } else {
                reject(new Error('添加图书对象不合法'))
            }
        } catch (e) {
            reject(e)
        }
    }))
}

function getBook(fileName) {
    return new Promise((async (resolve, reject) => {
        const bookSql = `select * from book where fileName = '${fileName}'`
        const contentsSql = `select * from contents where fileName = '${fileName}' order by \`order\``
        const book = await db.querOne(bookSql)
        const contents = await db.querySql(contentsSql)

        /*if (book) {
            book.cover = Book.genCoverUrl(book)
        }*/
        resolve(book)
    }))
}

/**
 * 此处特别注意要解决数据库限制order的问题
 * @returns {Promise<[]>}
 */

async function getCategory() {
    // console.log('22222222222222')
    const sql = 'select * from category order by category asc'
    const result = await db.querySql(sql)
    console.log('此处要解决数据库显示order的问题')
    const categoryList = []
    result.forEach(item => {
        categoryList.push({
            label: item.category,
            value: item.categoryText,
            num: item.num
        })
    })
    return categoryList
}

/**
 * 返回两种方法
 * 第一种
 * return new Promise((resolve, reject) => {
        resolve()
    })
 *
 * 第二种 直接返回一个对象
 * return { list }
 *
 * async方法里的返回对象会直接帮你转换成Promise对象
 * @param query
 * @returns {Promise<unknown>}
 */

async function listBook(query) {
    // console.log(query)
    const {categroy, author, tatle, sort, page = 1, pageSize = 20} = query
    const offset = (page - 1) * pageSize
    let bookSql = 'select * from book'
    let where = 'where'
    categroy && (where = db.and(where, 'categoryText', categroy))
    author && (where = db.andLike(where, 'author', author))
    tatle && (where = db.andLike(where, 'title', tatle))
    if (where !== 'where') {
        bookSql = `${bookSql} ${where}`
    }
    if (sort) {
        const symbol = sort[0]
        const column = sort.slice(1, sort.length)
        const order = symbol === '+' ? 'asc' : 'desc'
        bookSql = `${bookSql} order by \`${column}\` ${order}`
    }
    let countSql = `select count(*) as count from book`
    if (where !== 'where') {
        countSql = `${countSql} ${where}`
    }
    const count = await db.querySql(countSql)
    console.log('count', count)
    bookSql = `${bookSql} limit ${pageSize} offset ${offset}`
    // console.log(bookSql)
    const list = await db.querySql(bookSql)
    list.forEach(book=>book.server = Book.genCoverUrl(book))
    return {list, count: count[0].count, page, pageSize}
}

function deleteBook(fileName){
    return new Promise(async (resolve, reject) => {
        let book = await getBook(fileName)
        if (book) {
            if (+book.updateType === 0) {
                reject(new Error('内置图书不能删除'))
            } else {
                const bookObj = new Book(null,book)
                const sql = `delete from book where fileName = '${fileName}'`
                db.querySql(sql).then(()=>{
                    bookObj.reset() || resolve()
                    resolve()
                })
            }
        } else {
            reject(new Error('电子书不存在!!!'))
        }
    })
}

module.exports = {
    insertBook,
    updataBook,
    getCategory,
    listBook,
    deleteBook,
    getBook
}