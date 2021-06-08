function Bind(selector,action){
    this.selector = selector
    this.action = action
    this.handlers = {}
    let handlers = this.handlers
    $(selector).on(action,function(e){
        handlers&&Object.values(handlers).forEach(f=>f.function.call(this,e))
    })
}
Bind.prototype = {
    bind(func,key){
        if(typeof func !== 'function')throw 'Invalid function'
        let keys = Object.values(this.handlers).filter(i=>{
            if(i.key===key)return i
        })
        if(keys.length!==0) return this.update()
        let id = (new Date()).getTime()
        let context = new Object(this)
        context.id = id
        return this.handlers[id]={key:key||undefined,function:func}, context
    },
    unbind(id=this.id){
        if(typeof id !== 'number')throw 'Invalid id'
        if(this.handlers[id]) delete this.handlers[id]
        else throw 'Nothing to delete'
        return this
    },
    update(){
        let handlers = this.handlers
        $(this.selector).unbind(this.action).on(this.action,function(e){
            handlers&&Object.values(handlers).forEach(f=>f.function.call(this,e))
        })
        return this
    },
    clear(){
        return this.handlers={},this
    },
    delete(){
        return this.clear(),$(this.selector).unbind(this.action),undefined
    }
}