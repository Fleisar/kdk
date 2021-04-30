(function(){
    window.configCollector = function(options={}){
        this.class = options.class||'config-collector'
        this._keeper = {
            update: []
        }
        this.config = {}
        this.update()
        if(this._load()) {
            this.config = JSON.parse(localStorage.getItem('configCollector'))
            $(()=>{
                Object.keys(this.config).forEach(k=>{
                    this._keeper.update.length>0&&this._keeper.update.forEach(f=>f(k,this.config[k]))
                    let e = $(`.${this.class}[name=${k}]`)
                    switch(e.tagName){
                        case 'INPUT': if(e[0].type === 'checkbox') return e.checked(this.config[k])
                        case 'SELECT':
                        default: return e.val(this.config[k])
                    }
                })
            })
        }
    }
    window.configCollector.prototype = {
        update(){
            $(`.${this.class}`).unbind('change').change(e=>{
                this.config[e.target.name] = this._value(e.target)
                this._keeper.update.length>0&&this._keeper.update.forEach(f=>f(e.target.name,this.config[e.target.name]))
                this._save()
            })
        },
        change(handler){
            if(typeof handler !== 'function') throw 'Handler must be a function'
            this._keeper.update.push(handler)
        },
        collect(){
            $(`.${this.class}`).each((i,e)=>{
                this.config[e.name] = this._value(e)
            })
            return this.config
        },
        _value(e){
            switch(e.tagName){
                case 'INPUT': if(e.type === 'checkbox') return $(e).is(':checked')
                case 'SELECT':
                default: return $(e).val()
            }
        },
        _load(){
            return localStorage.hasOwnProperty('configCollector')
        },
        _save(){
            localStorage.setItem('configCollector',JSON.stringify(this.config))
        }
    }
})()