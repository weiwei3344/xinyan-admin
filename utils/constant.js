const {env} = require('./env')

const UPLOAD_PATH = env === 'dev' ? 'C:/Users/15279/Desktop/心言哇/Vue/admin-upload-ebook' : '/root/admin-upload-ebook'

const OLD_UPLOAD_URL = env === 'dev' ? 'C:/Users/15279/Desktop/心言哇/Vue/admin-upload-ebook' : '/root/admin-upload-ebook'

const UPLOAD_URL = env === 'dev' ? 'C:/Users/15279/Desktop/心言哇/Vue/admin-upload-ebook' : '/root/admin-upload-ebook'

module.exports = {
    CODE_ERROR: -1,
    CODE_SUCCESS: 0,
    debug: false,
    PWD_SALT: 'xinyanwa',
    PRIVATE_KEY: 'xinyanawa',
    JWT_EXPIRED: 60 * 60,
    CODE_TOKEN_EXPIRED: -2,
    UPLOAD_PATH,
    UPLOAD_URL,
    MIME_TYPE_EPUB: 'application/epub+zip',
    OLD_UPLOAD_URL
}
