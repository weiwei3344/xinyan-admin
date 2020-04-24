const { querySql,querOne } = require('../db/index')

function login( username, password) {
    const sql = `select * from admin_user where username='${username}' and password='${password}'`
    return querySql(sql)
}

function findUser(username){
    const sql =`select id,username,role,nickname,avatar from admin_user where username='${username}'`
    return querOne(sql)
}

module.exports = {
    login,
    findUser
}
