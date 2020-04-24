const {MIME_TYPE_EPUB, UPLOAD_URL, UPLOAD_PATH, OLD_UPLOAD_URL} = require('../utils/constant')

const fs = require('fs')
const Epub = require('../utils/epub')
const xml2js = require('xml2js').parseString

class Book {
    constructor(file, data) {
        if (file) {
            this.createBookFromFile(file)
        } else {
            this.createBookFromData(data)
        }
    }

    createBookFromFile(file) {
        // console.log(file)
        const {
            destination,
            fileName,
            mimetype = MIME_TYPE_EPUB,
            path,
            originalname
        } = file
        const suffix = mimetype === MIME_TYPE_EPUB ? '.epub' : ''
        //电子书后缀名
        const oldBookPath = path
        //电子书原有路径
        const bookPath = `${destination}/${fileName}${suffix}`
        //电子书路径
        const url = `${UPLOAD_URL}/book/${fileName}${suffix}`
        //电子书url路径
        const unzipPath = `${UPLOAD_PATH}/unzip/${fileName}`
        //电子书解压路径
        const unzipUrl = `${UPLOAD_URL}/unzip/${fileName}`
        //电子书下载路径
        if (!fs.existsSync(unzipPath)) {
            fs.mkdirSync(unzipPath, {recursive: true})
        }
        if (fs.existsSync(oldBookPath) && !fs.existsSync(bookPath)) {
            fs.renameSync(oldBookPath, bookPath)
        }
        this.fileName = fileName //文件名
        this.path = `book/${fileName}${suffix}` //文件相对路径
        this.filePath = this.path // 文件路径
        this.unzipPath = `unzip/${fileName}` //解压相对路径
        this.url = url //电子书下载路径
        this.title = '' //书名
        this.author = '' //作者
        this.publisher = '' //出版社
        this.contents = [] //目录
        this.contentsTree = [] // 二级目录
        this.cover = '' //封面图片url
        this.coverPath = '' //封面图片地址
        this.category = -1 //分类id
        this.caategoryText = '' //分类名称
        this.language = '' //语言
        this.unzipPath = unzipPath //电子书解压路径
        this.originalname = originalname //电子书原名
    }

    createBookFromData(data) {
        this.fileName = data.fileName
        this.cover = data.cover
        this.title = data.title
        this.author = data.author
        this.publisher = data.publisher
        this.bookid = data.fileName
        this.language = data.language
        this.rootFile = data.rootFile
        this.originalname = data.originalname
        this.path = data.path || data.filePath
        this.filePath = data.path || data.filePath
        this.unzipPath = data.unzipPath
        this.coverPath = data.coverPath
        this.createUser = data.username
        this.createDt = new Date().getTime()
        this.updateDt = new Date().getTime()
        this.updateType = data.updateType === 0 ? data.updateType : 1
        this.category = data.category || 99
        this.categoryText = data.categoryText || '自定义'
        this.contents = data.contents || []
    }

    parse() {
        return new Promise(((resolve, reject) => {
            const bookPath = `${UPLOAD_PATH}/${this.filePath}`
            if (!fs.existsSync(bookPath)) {
                reject(new Error('电子书不存在'))
            }
            let epub = new Epub(bookPath)
            epub.on('error', err => {
                reject(err)
            })
            epub.on('end', err => {
                if (err) {
                    reject(err)
                } else {
                    // console.log(epub.metadata)
                    const {
                        title, //电子书标题
                        language, //电子书语言
                        creator, //电子书作者
                        creatorFileAs,
                        publisher, //出版社
                        cover //封面
                    } = epub.metadata
                    if (!title) {
                        reject(new Error('电子书标题不存在'))
                    } else {
                        this.title = title
                        this.language = language
                        this.author = creator || creatorFileAs || 'unkonwn'
                        this.publisher = publisher || 'unkonwn'
                        this.rootFile = epub.rootFile
                        try {
                            this.unzip()
                            this.parseContents(epub)
                                .then(({chapters, chapterTree}) => {
                                    this.contents = chapters
                                    this.contentsTree = chapterTree
                                })
                            const handleGetImg = (err, file, mimeType) => {
                                if (err) {
                                    reject(err)
                                } else {
                                    const suffix = mimeType.split('/')[1]
                                    const coverPath = `${UPLOAD_PATH}/img/${this.fileName}.${suffix}`
                                    const coverUrl = `${UPLOAD_URL}/img/${this.fileName}.${suffix}`
                                    fs.writeFileSync(coverPath, file, 'binary')
                                    /*this.coverPath = `/img/${this.fileName}.${suffix}`
                                    this.cover = coverUrl*/
                                    this.cover = 'https://tvax2.sinaimg.cn/crop.0.0.996.996.180/00826tnQly8gapdl2e0mrj30ro0romyl.jpg?KID=imgbed,tva&Expires=1586429232&ssig=hkT1bLgrIJ'
                                    this.coverPath = 'https://tvax2.sinaimg.cn/crop.0.0.996.996.180/00826tnQly8gapdl2e0mrj30ro0romyl.jpg?KID=imgbed,tva&Expires=1586429232&ssig=hkT1bLgrIJ'
                                    resolve(this)
                                }
                            }
                            epub.getImage(cover, handleGetImg)
                        } catch (e) {
                            reject(e)
                        }
                    }
                }
            })
            epub.parse()
        }))
    }

    unzip() {
        const AdmZip = require('adm-zip')
        // console.log('path',this.path)
        // console.log('unzippath',this.unzipPath)
        const zip = new AdmZip(Book.genPath(this.path))
        zip.extractAllTo(this.unzipPath, true)
    }

    parseContents(epub) {
        function getNcxFilePath() {
            const manifest = epub && epub.manifest
            const spine = epub && epub.spine
            const ncx = manifest && manifest.ncx
            const toc = spine && spine.toc
            return (ncx && ncx.href) || (toc && toc.href)
        }

        /**
         * flatten方法，将目录转为一维数组
         *
         * @param array
         * @returns {*[]}
         */
        function flatten(array) {
            return [].concat(...array.map(item => {
                if (item.navPoint && item.navPoint.length) {
                    return [].concat(item, ...flatten(item.navPoint))
                } else if (item.navPoint) {
                    return [].concat(item, item.navPoint)
                } else {
                    return item
                }
            }))
        }

        /**
         * 查询当前目录的父级目录及规定层次
         *
         * @param array
         * @param level
         * @param pid
         */
        function findParent(array, level = 0, pid = '') {
            return array.map(item => {
                item.level = level
                item.pid = pid
                if (item.navPoint && item.navPoint.length) {
                    item.navPoint = findParent(item.navPoint, level + 1, item['$'].id)
                } else if (item.navPoint) {
                    item.navPoint.level = level + 1
                    item.navPoint.pid = item['$'].id
                }
                return item
            })
        }

        if (!this.rootFile) {
            throw new Error('目录解析失败')
        } else {
            const fileName = this.fileName
            return new Promise((resolve, reject) => {
                const ncxFilePath = `${this.unzipPath}/${getNcxFilePath()}` // 获取ncx文件路径
                const xml = fs.readFileSync(ncxFilePath, 'utf-8') // 读取ncx文件
                // 将ncx文件从xml转为json
                xml2js(xml, {
                    explicitArray: false, // 设置为false时，解析结果不会包裹array
                    ignoreAttrs: false  // 解析属性
                }, function (err, json) {
                    if (!err) {
                        const navMap = json.ncx.navMap // 获取ncx的navMap属性
                        if (navMap.navPoint) { // 如果navMap属性存在navPoint属性，则说明目录存在
                            navMap.navPoint = findParent(navMap.navPoint)
                            const newNavMap = flatten(navMap.navPoint) // 将目录拆分为扁平结构
                            const chapters = []
                            epub.flow.forEach((chapter, index) => { // 遍历epub解析出来的目录
                                // 如果目录大于从ncx解析出来的数量，则直接跳过
                                if (index + 1 > newNavMap.length) {
                                    return
                                }
                                const nav = newNavMap[index] // 根据index找到对应的navMap
                                chapter.text = `${UPLOAD_URL}/unzip/${fileName}/${chapter.href}` // 生成章节的URL
                                // console.log(`${JSON.stringify(navMap)}`)
                                if (nav && nav.navLabel) { // 从ncx文件中解析出目录的标题
                                    chapter.label = nav.navLabel.text || ''
                                } else {
                                    chapter.label = ''
                                }
                                chapter.level = nav.level
                                chapter.pid = nav.pid
                                chapter.navId = nav['$'].id
                                chapter.fileName = fileName
                                chapter.order = index + 1
                                chapters.push(chapter)
                            })
                            // console.log(chapters)
                            const chapterTree = []
                            chapters.forEach(c => {
                                c.children = []
                                if (c.pid === '') {
                                    chapterTree.push(c)
                                } else {
                                    const parent = chapters.find(_ => _.navId === c.pid)
                                    parent.children.push(c)
                                }
                            }) // 将目录转化为树状结构
                            resolve({chapters, chapterTree})
                        } else {
                            reject(new Error('目录解析失败，navMap.navPoint error'))
                        }
                    } else {
                        reject(err)
                    }
                })
            })
        }
    }

    toDb() {
        return {
            fileName: this.fileName,
            cover: this.cover,
            title: this.title,
            author: this.author,
            publisher: this.publisher,
            bookid: this.fileName,
            language: this.language,
            rootFile: this.rootFile,
            originalname: this.originalname,
            filePath: this.filePath,
            unzipPath: this.unzipPath,
            coverPath: this.coverPath,
            createUser: this.createUser,
            createDt: this.createDt,
            updateDt: this.updateDt,
            updateType: this.updateType,
            category: this.category,
            categoryText: this.categoryText,
        }
    }

    getContents() {
        return this.contents
    }

    reset() {
        if (Book.pathExists(this.filePath)) {
            fs.unlinkSync(Book.genPath(this.filePath))
        }
        if (`${UPLOAD_PATH}/img/${this.fileName}.jpeg`) {
            fs.unlinkSync(`${UPLOAD_PATH}/img/${this.fileName}.jpeg`)
        }
        // 在低版本中，recursive不支持，他是迭代删除
        if (Book.pathExists(this.unzipPath)) {
            fs.rmdirSync((this.unzipPath), {recursive: true})
        }
        // console.log((`${UPLOAD_PATH}/img/${this.fileName}.jpeg`))
    }

    static genPath(path) {
        if (!path.startsWith('/')) {
            path = `/${path}`
        }
        return `${UPLOAD_PATH}${path}`
    }

    static pathExists(path) {
        if (path.startsWith(UPLOAD_PATH)) {
            return fs.existsSync(path)
        } else {
            return fs.existsSync(Book.genPath(path))
        }
    }

    static genCoverUrl(book) {
        const {cover} = book
        if (+book.updateType === 0) {
            if (cover) {
                if (cover.startsWith('/')) {
                    return `${OLD_UPLOAD_URL}${cover}`
                } else {
                    return `${OLD_UPLOAD_URL}/${cover}`
                }
            } else {
                return null
            }
        } else {
            if (cover) {
                if (cover.startsWith('/')) {
                    return `${UPLOAD_URL}${cover}`
                } else {
                    return `${UPLOAD_URL}/${cover}`
                }
            } else {
                return null
            }
        }
    }
}

module.exports = Book
