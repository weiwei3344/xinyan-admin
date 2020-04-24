
// 导入两个提示代码
const { CODE_ERROR, CODE_SUCCESS,CODE_TOKEN_EXPIRED } = require('../utils/constant')

// 使用new Result就会创建下面的方法
class Result {
    constructor(data, msg = '操作成功', options) {
        this.data = null
        if (arguments.length === 0) {
            this.msg = '操作成功'
        } else if (arguments.length === 1) {
            this.msg = data
        } else {
            this.data = data
            this.msg = msg
            if (options) {
                this.options = options
            }
        }
    }

    createResult() {
        if (!this.code) {
            this.code = CODE_SUCCESS
        }
        let base = {
            code: this.code,
            msg: this.msg
        }
        if (this.data) {
            base.data = this.data
        }
        // {code,msg,data}执行完上面一步时候的数据

        // options 是一个对象，使用对象的浅拷贝进行合并
        if (this.options) {
            base = { ...base, ...this.options }
        }
        console.log(base)
        return base
    }

    json(res) {
        res.json(this.createResult())
    }

    success(res) {
        this.code = CODE_SUCCESS
        this.json(res)
    }

    fail(res) {
        this.code = CODE_ERROR
        this.json(res)
    }

    expired(res){
        this.code = CODE_TOKEN_EXPIRED
        this.json(res)
    }
}

module.exports = Result



/*
// 导入两个提示代码
const { CODE_SUCCRESS,CODE_ERROR} = require('../utils/constant')


// 使用new Result就会创建下面的方法
class  Result{
    constructor(data,msg = '操作成功',options) {
        thi.data = null
        if(arguments === 0){
            this.msg = '操作成功'
        } else if(arguments === 1){
            this.msg = data
        }else {
            this.data = data
            this.msg = msg
            if(options){
                this.options =options
            }
        }
    }
    createResult(){
        if(!this.code){
            this.code = CODE_SUCCESS
        }
        let base = {
            code:this.code,
            msg:this.msg
        }
        if(this.data){
            base.data= this.data
        }
        // {code,msg,data}执行完上面一步时候的数据

        // options 是一个对象，使用对象的浅拷贝进行合并
        if(this.options){
            base = {...base,...this.options}
        }
        console.log(base)
        return base
    }
    json(res){
        res.json(this.createResult())
    }
    seccress(res){
        this.code = CODE_SUCCRESS
        this.json(res)
    }
    fail(res) {
        this.code = CODE_ERROR
        this.json(ress)
    }
}
module.exports = Result
*/
