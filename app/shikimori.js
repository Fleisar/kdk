/* API docs (official): https://shikimori.one/api/doc/1.0 */
(function(){
    const SHIKIMORI_ORIGIN = 'https://shikimori.one';
    window.shikimori = {
        origin: SHIKIMORI_ORIGIN,
        api: `${SHIKIMORI_ORIGIN}/api`,
        anime(id){
            return new this._anime(id)
        },
        animes(args){
            return new this._animes(args)
        },
        _animes: function(args={}){
            if(typeof args !== 'object')throw `Invalid construction`
            this.value = {...this.DEF,...args}
            return this
        },
        _asp: {
            value: {},
            _reset: false,
            DEF: {
                limit: 50,
                order: 'ranked',
                status: 'ongoing'
            },
            reset(){
                this.value = {}
                return this
            },
            page(num){
                if(typeof num !== 'number') return this.value.page||0
                this.value.page = num
                return this
            },
            limit(num){
                if(typeof num !== 'number') throw `Limit must be a number`
                this.value.limit = num
                return this
            },
            order(type){
                if(['id','ranked','kind','popularity','name','aired_on','episodes','status','random',''].indexOf(type) === -1) throw `Invalid type of order`
                this.value.order = type
                return this
            },
            kind(kind){
                if(['tv','movie','ova','ona','special','music','tv_13','tv_24','tv_48',''].indexOf(kind) === -1) throw `Invalid type of kind`
                this.value.kind = kind
                return this
            },
            status(st){
                if(['anons','ongoing','released',''].indexOf(st) === -1) throw `Invalid type of status`
                this.value.status = st
                return this
            },
            season(season){
                this.season = season
                return this
            },
            score(num){
                if(typeof num !== 'number') throw `Score must be a number`
                this.value.score = num
                return this
            },
            duration(d){
                if(['S','D','F'].indexOf(d) === -1) throw `Invalid duration`
                this.value.duration = d
                return this
            },
            rating(rating){
                if(['none','g','pg','pg_13','r','r_plus','rx'].indexOf(rating) === -1) throw `Invalid duration`
                this.value.rating = rating
                return this
            },
            genre(genres){
                genres.forEach(arg=>{if(typeof arg !== 'number')throw`Genre id must be a number`})
                this.value.genre = genres
                return this
            },
            studio(studios){
                studios.forEach(arg=>{if(typeof arg !== 'number')throw`Studio id must be a number`})
                this.value.studio = studios
                return this
            },
            franchise(franchise1,franchise2,franchise3){
                this.value.franchise = arguments
                return this
            },
            censored(state){
                this.value.censored = Boolean(state)
                return this
            },
            ids(ids){
                ids.forEach(arg=>{if(typeof arg !== 'number')throw`Id must be a number`})
                this.value.ids = ids
                return this
            },
            exclude_ids(){
                let args = arguments
                args.forEach(arg=>{if(typeof arg !== 'number')throw`Id must be a number`})
                this.value.exclude_ids = args
                return this
            },
            search(text){
                this.value.search = text.toString()
                return this
            },
            then(callback,onError=callback){
                if(typeof callback !== 'function')throw `Callback must be a function`
                let args = this.value
                let http_query = Object.keys(args).map(k=>{
                    if(typeof args[k] === 'object') args[k] = Object.values(args[k]).join(',')
                    else args[k] = args[k].toString()
                    if(args[k]==='')return ''
                    return `${k}=${args[k]}`
                }).join('&')
                fetch(`${shikimori.api}/animes?${http_query}`).then((r,e)=>{
                    if(e)return onError(r,e)
                    if(r.ok) r.json().then(json=>callback(json))
                })
                return this
            }
        },
        _anime: function(id = 0){
            if(isNaN(Number(id))) throw `Invalid construction`
            this.id = Number(id)
            return this
        },
        _ap: {
            id: 0,
            request: '',
            roles(){this._request='/roles';return this},
            similar(){this._request='/similar';return this},
            related(){this._request='/related';return this},
            screenshots(){this._request='/screenshots';return this},
            franchise(){this._request='/franchise';return this},
            external_links(){this._request='/external_links';return this},
            topics(){this._request='/topics';return this},
            then(callback,onError=callback){
                if(typeof callback !== 'function')throw `Callback must be a function`
                fetch(`${shikimori.api}/animes/${this.id}${this._request}`).then((r,e)=>{
                    if(e)return onError(r,e)
                    if(r.ok) r.json().then(json=>callback(json))
                })
                return this
            }
        }
    }
    shikimori._animes.prototype = shikimori._asp
    shikimori._anime.prototype = shikimori._ap
})()
