(function(){
    window.hoverMenu = function(selector,menu=["none"],options={}){
        this._keeper = {
            open: [],
            click: [],
            close: []
        }
        this.state = false
        this.selector = selector
        this._hBind()
        this.name = `hoverMenu-${(new Date()).getTime()}`
        $('body').append(`<ul id="${this.name}"></ul>`)
        this.ROOT = $(`#${this.name}`).css({
            position: 'fixed',
            'z-index': '999'
        }).hide()
        options.style&&this.ROOT.css(options.style)
        options.classes&&options.classes.forEach(c=>this.ROOT.addClass(c))
        this.menuParser(menu)
    }
    window.hoverMenu.prototype = {
        on(event,handler){
            if(Object.keys(this._keeper).indexOf(event) === -1) throw 'Invalid event name'
            if(typeof handler !== 'function') throw 'Handler must be a function'
            return this._keeper[event].push(handler), this
        },
        unbind(event){
            if(Object.keys(this._keeper).indexOf(event) === -1) throw 'Invalid event name'
            return this._keeper[event]=[],this
        },
        update(){
            return $(this.selector).unbind('contextmenu').on('contextmenu',e=>{
                const menuWidth = this.ROOT.width();
                const menuHeight = this.ROOT.height();
                const pageWidth = $(document).width();
                const pageHeight = $(document).height();
                this.open(
                    Math.min(e.pageX, pageWidth - menuWidth - 16),
                    Math.min(e.pageY, pageHeight - menuHeight - 16),
                );
                this._call(this._keeper.open,[e])
                return e.preventDefault(), false
            }), this
        },
        _hBind(){
            this.update()
            $('body').click(e=>{
                let target = $(e.target)
                if(target.parent(`#${this.name}`).length>0){
                    let li = target
                    if(target.parent('li').parent(`#${this.name}`).length>0) li = target.parent('li')
                    this._call(this._keeper.click,[li.attr('data-id'),li])
                    if(li.is('[stay]')) return true
                }
                this.state&&this.close()
            })
        },
        _call(array,args){
            if(typeof array !== 'object') throw 'Invalid type of array'
            Object.values(array).length>0&&array.forEach(f=>f(...args))
        },
        menuParser(menu){
            if(typeof menu !== 'object') throw 'Invalid type of menu'
            this.ROOT.html('')
            Object.values(menu).forEach((i,n)=>{
                if(typeof i === 'string') return this.ROOT.append(`<li data-id="${n}">${i}</li>`);
                this.ROOT.append(`<li data-id="${n}">${i.text}</li>`)
                let selector = this.ROOT.children(`li[data-id=${n}]`)
                i.action&&selector.attr('stay','')
                i.classes&&i.classes.forEach(c=>selector.addClass(c))
                i.style&&selector.css(i.style)
            })
        },
        open(x,y){
            this.state = true
            return this.ROOT.offset({left:x,top:y}).show(), this
        },
        close(){
            this.state = false
            return this.ROOT.offset({top:0,left:0}).hide(), this
        }
    }
})()
