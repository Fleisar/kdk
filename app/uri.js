(function(){
    window.URI = function(url,data){
        window.onpopstate = e => {
            this._orh&&this._orh.forEach(f=>f(e.state||{}))
        }
        this.onRedirect(s=>{
            this.page=s
            this.address = location.href.split('#')[1]
        })
        if(location.href.split('#').length===1)this.set(url,data)
        else this._orh&&this._orh.forEach(f=>f({}))
    }
    window.URI.prototype = {
        address: '',
        page: {},
        set(url,data={}){
            if(typeof url !== 'string' && typeof data !== 'object') throw `Invalid input variables`
            return window.history.pushState(data,'',url), this
        },
        onRedirect(callback){
            if(typeof callback !== 'function') throw `Callback must be function`
            return this._orh.push(callback), this
        },
        _orh: []
    }
})()