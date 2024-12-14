!function(){
    window.kodikBackend = function(token,strict=true,proxy){
        this.token = token
        this.proxy = proxy
        this._request('/list',{limit:1}).then((r,e)=>{
            if(e) throw e
            if(r.error==='Отсутствует или неверный токен') throw 'Kodik invalid token'
        })
        let m = {
            years: {
                sort: ['year','count'],
                ...this._pfilters
            },
            genres: {
                genres_type: ['kinopoisk','shikimori','mydramalist','all'],
                year: 'string',
                sort: ['title','count'],
                ...this._pfilters
            },
            countries: {
                year: 'string',
                sort: ['title','count'],
                ...this._pfilters
            },
            qualities: {},
            'translations/v2': {
                year: 'string',
                sort: ['title','count'],
                ...this._pfilters
            },
            list: {
                limit: 'number',
                sort: ['year','created_at','updated_at','kinopoisk_rating','imdb_rating','shikimori_rating'],
                order: ['asc','desc'],
                year: 'object',
                camrip: 'boolean',
                with_seasons: 'boolean',
                with_episodes: 'boolean',
                with_episodes_data: 'boolean',
                with_page_links: 'boolean',
                not_blocked_in: 'object',
                not_blocked_for_me: 'boolean',
                with_material_data: 'boolean',
                ...this._pfilters
            },
            search: {
                title: 'string',
                title_orig: 'string',
                strict: 'boolean',
                full_match: 'boolean',
                id: 'string',
                player_link: 'string',
                kinopoisk_id: 'number',
                imdb_id: 'string',
                mdl_id: 'string',
                worldart_animation_id: 'string',
                worldart_cinema_id: 'number',
                worldart_link: 'string',
                shikimori_id: 'number',
                limit: 'number',
                year: 'object',
                prioritize_translations: 'object',
                unprioritize_translations: 'object',
                prioritize_translation_type: ['voice','subtitles'],
                block_translations: 'object',
                camrip: 'boolean',
                with_seasons: 'boolean',
                season: 'number',
                episode: 'number',
                with_episodes: 'boolean',
                with_episodes_data: 'boolean',
                with_page_links: 'boolean',
                not_blocked_in: 'object',
                not_blocked_for_me: 'boolean',
                ...this._pfilters
            }
        }
        Object.keys(m).forEach(k=>this[k]=a=>{
            if(strict) Object.keys(a).forEach(ak=>{
                if(m[k][ak]==='string') a[ak]=a[ak].toString()
                if(
                    m[k][ak]===undefined||
                    (typeof m[k][ak]==='object'&&m[k][ak].indexOf(a[ak].toString())===-1)||
                    (m[k][ak]==='number'&&typeof a[ak]!==m[k][ak])
                )
                    throw `Invalid type of ${a[ak]}=${typeof a[ak]}(should be ${(m[k][ak]||'null').toString()})`
                if(m[k][ak]==="object") a[ak]=a[ak].join(',')
            })
            return this._request(`/${k}`,a)
        })
    }
    window.kodikBackend.prototype = {
        _pfilters: {
            types: ['foreign-movie','soviet-cartoon','foreign-cartoon','russian-cartoon','anime','russian-movie','cartoon-serial','documentary-serial','russian-serial','foreign-serial','anime-serial','multi-part-film'],
            translation_id: 'number',
            translation_type: ['voice','subtitles'],
            countries: 'object',
            genres: 'object',
            anime_genres: 'object',
            drama_genres: 'object',
            all_genres: 'object',
            duration: 'string',
            kinopoisk_rating: 'string',
            imdb_rating: 'string',
            shikimori_rating: 'string',
            mydrammalist_rating: 'string',
            actors: 'object',
            producers: 'object',
            writers: 'object',
            composers: 'object',
            editors: 'object',
            designers: 'object',
            operators: 'object',
            mpaa_rating: ['G','PG','PG-13','R','R+','Rx','R','PG-13'],
            minimal_age: 'string',
            anime_kind: ['tv','movie','ova','ona','special','music','tv_13','tv_24','tv_48','movie','ova'],
            anime_status: ['anons','ongoing','released','ongoing','released'],
            drama_status: this.anime_status,
            all_status: this.anime_status,
            animes_studios: 'object',
            anime_licensed_by: 'object'
        },
        pool: 'https://kodikapi.com',
        _request(method,args){
            args = {...args,token:this.token}
            return new Promise((r,e)=>{
                let xhr = new XMLHttpRequest()
                xhr.onload = ()=>{
                    if(xhr.status === 200) r(JSON.parse(xhr.responseText))
                    else e(xhr)
                }
                xhr.onerror = ()=>e(xhr)
                let request = this.pool+method+'?'+Object.keys(args).map(i=>i+'='+args[i]).join('&')
                xhr.open('GET',this.proxy===undefined?request:this.proxy+encodeURIComponent(request))
                xhr.send()
            })
        }
    }
}()