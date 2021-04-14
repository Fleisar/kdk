(function(){
    let to = setTimeout(()=>{
        window.menu = undefined
        throw 'Hover-menu require JQuery for working'
    },5e3)
    $(()=>clearTimeout(to))
    window.menu = {
        _handlers: {},
        config: {
            class: 'contextmenu',
            stay: false,
            rootStyle: ``,
            style: ``
        },
        init(config = {}){
            this.config = {...this.config, ...config}
            return $('div',{
                class:this.config.class,
                stay:this.config.stay,
                style:this.config.rootStyle.toString()+this.config.style.toString()
            }).appendTo('body'),this
        },
        bind(className, handler){
            if(typeof className !== 'string'||typeof handler !== 'object')throw "Invalid input values"
            $(className).click(e=>{console.log(e)})
            return this._handlers[className]=handler
        },
        update(className){

        },
        unbind(className){
            if(typeof className !== 'string')throw "Invalid class name"
            return delete this._handlers[className], this
        },
        remove: this.unbind,
        set(className, content=[{stay:true,text:'No content'}]){
            if($(className).length===0)throw "Nothing to bind"
            if(typeof content !== 'string' && typeof content !== 'object')throw `Invalid type of content (string or object)`
            return this.bind(className,{open:[],click:[],close:[]}), this._handlerTemplate(className)
        },
        _handlerTemplate(className){
            let handlers = this._handlers[className]
            return {
                open(callback){
                    if(typeof callback === 'function')throw "Invalid type of callback function"
                    handlers.open?handlers.open.push(callback):handlers.open=[callback]
                },
                click(callback){
                    if(typeof callback === 'function')throw "Invalid type of callback function"
                    handlers.click?handlers.click.push(callback):handlers.click=[callback]
                },
                close(callback){
                    if(typeof callback === 'function')throw "Invalid type of callback function"
                    handlers.close?handlers.close.push(callback):handlers.close=[callback]
                },
                unbind(){
                    menu.unbind(className)
                },
                update(){
                    menu.update(className)
                }
            }
        }
    }
})()