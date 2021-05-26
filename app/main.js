$(function(){
    window.url = new URI('#')
    window.binds = {
        aPage: new Bind('a[data-page]','click'),
        aWindow: new Bind('a[data-window]','click'),
        hover: new Bind('header a','mousemove'),
        bodyScroll: new Bind('.page.general','scroll'),
        lazyLoad: new LazyLoad({}),
        titleHover: new hoverMenu('.ui-title',[
            'Открыть',
            '<span class="material-icons icon">info</span>Информация',
            {text:'<span class="material-icons icon">favorite</span>Любимое',action:'stay',classes:['ui-disabled']},
            '<span class="material-icons icon">content_copy</span>Скопировать название',
            {text:'<span class="icon" style="background-color:rgba(var(--colorFill),0.5)"><img alt="sk" src="https://shikimori.one/assets/layouts/l-top_menu-v2/glyph.svg" height="24"></span>Открыть в Shikimori',classes:['externalLink']}
        ],{classes:['icon-list','ui-hovermenu','ui-material-list']}),
        config: new configCollector(),
        anilibria: new Anilibria()
    }
    $(function(){
        binds.hover.bind(function(e){
            $(this).css({
                '--x': e.offsetX+'px',
                '--y': e.offsetY+'px'
            })
        },'jq.custom')
        pages.init()
        binds.aPage.bind(function(){
            pages.set($(this).attr('data-page'))
        },'jq.custom')
    })
    url.onRedirect(st=>{
        console.groupCollapsed('Redirected to #'+url.address)
        console.log(st)
        console.groupEnd()
        pages.processor()
    })
    window.toRGB = function(hex){
        let hex_code = hex.split(""),
            red = parseInt(hex_code[1]+hex_code[2],16),
            green = parseInt(hex_code[3]+hex_code[4],16),
            blue = parseInt(hex_code[5]+hex_code[6],16)
        return [red,green,blue]
    }
    let collections = {
        title(id,poster,name,original_name,data){
            return `
                <a data-page="player" href="#player/shikimori/${id}" title="${original_name}">
                    <div class="ui-title" data-add='${JSON.stringify(data)}'>
                        <img alt="${original_name}" class="lazy" data-src="//shikimori.one${poster}">
                        <div></div>
                    </div>
                </a>
            `
        },
        textTitle(text){
            return `<h2>${text}</h2>`
        },
        minTitle(name,time,from){
            return `<a data-window="search" data-add='{"text":"${name}"}'><div class="ui-min-title" style="--from:'${from}'" title="Время: ${time}"><h4>${name}</h4></div></a>`
        },
        titleEx(id,poster,name,original_name,data){
            return `
                <a data-page="player" href="#player/shikimori/${id}" title="${original_name}">
                    <div>
                        <div class="ui-title" data-add='${JSON.stringify(data)}'>
                            <img alt="${original_name}" class="lazy" data-src="//shikimori.one${poster}">
                        </div>
                        <span>${name||original_name}</span>
                    </div>
                </a>
            `
        },
        titleInfo(data){
            return `
                <div class="ui-title" data-add='${JSON.stringify(data)}' style="margin:auto">
                    <img alt="${data.name}" src="//shikimori.one${data.image.original}">
                </div>
                <h2 style="margin:auto" title="${data.name}">${data.russian||data.name} [${data.kind}]</h2>
                <hr/>
                <table class="ui-table-v">
                    <tbody>
                        <tr>
                            <td>Статус</td>
                            <td>${data.status||'Неизвестно'}</td>
                        </tr>
                        <tr>
                            <td>Рейтинг</td>
                            <td>${data.score}</td>
                        </tr>
                        <tr>
                            <td>Анонсирован</td>
                            <td>${data.aired_on||'Неизвестно'}</td>
                        </tr>
                        <tr>
                            <td>Закончен</td>
                            <td>${data.released_on||'Неизвестно'}</td>
                        </tr>
                        <tr>
                            <td>Оригинал</td>
                            <td>${data.name}</td>
                        </tr>
                        <tr>
                            <td>Эпизоды</td>
                            <td>${data.episodes_aired}/${data.episodes}</td>
                        </tr>
                    </tbody>
                </table>
                <ui class="icon-list ui-material-list">
                    <li onclick="url.set('#player/shikimori/${data.id}',{})">Открыть</li>
                    <li class="ui-disabled"><span class="material-icons icon">favorite</span>Любимое</li>
                    <li onclick="window.open('//shikimori.one${data.url}')"><span class="icon" style="background-color:rgba(var(--colorFill),0.5)"><img alt="sk" src="https://shikimori.one/assets/layouts/l-top_menu-v2/glyph.svg" height="24"></span>Открыть в Shikimori</li>
                </ui>
            `
        },
        loadingResults(){
            return '<div class="ui-load"><span class="material-icons">hourglass_empty</span></div>'
        },
        noResults(text='Не удалось ничего найти'){
            return '<div class="ui-error"><div><span class="material-icons">announcement</span><h5>'+text+'</h5></div></div>'
        }
    }
    let config = (k,v)=>{
        let body = $('body')
        switch (k) {
            case 'disableAnimations': return body.attr('disableAnimations',v.toString())
            case 'showTime': return $('.ui-clock').attr('display',v.toString());
            case 'showReleases': return $('header [data-window=releases]').attr('display',v.toString())
            case 'showHistory': return $('header [data-window=history]').attr('display',v.toString())
            case 'showFavorite': return $('header [data-window=favorite]').attr('display',v.toString())
            case 'colorBG': return body.css('--colorBackground',toRGB(v).join(', '))
            case 'colorText': return body.css('--colorText',toRGB(v).join(', '))
            case 'colorFill': return body.css('--colorFill',toRGB(v).join(', '))
            case 'colorHref': return body.css('--colorHref',toRGB(v).join(', '))
            case 'highEffects': return body.attr('highEffects',v.toString())
            case 'playerMode':
                $('div.page.player, div.window.config div.player-preview').attr('playerMode', v)
                break;
        }
    }
    binds.config.change(config)
    let windows = {
        container: false,
        current: null,
        bind(){
            binds.aWindow.bind(e=>{
                let data = JSON.parse(e.delegateTarget.dataset.add||"{}")
                    ,name = e.delegateTarget.dataset.window

                if(name===this.current&&this.container) return this.close()
                return this.open(name,data)
            },'windows.bind')
        },
        open(name,data={}){
            if(this.current!==null) $('.window.'+this.current).removeClass('active')
            else !this.container&&$('.windows').addClass('use')
            $('.window.'+name).addClass('active')
            this.current = name
            this.container = true
            this.array[name]&&this.array[name](data)
        },
        close(){
            $('.window.'+this.current).removeClass('active')
            this.current = null
            $('.windows').removeClass('use')
            this.container = false
        },
        array: {
            config: () => {

            },
            'title-info': title => {
                console.log(title)
                $('.windows .window.title-info .ui-grid').html(collections.titleInfo(title))
            },
            search: data => {
                if(data.text) {
                    $('.window.search input[type=text]').val(data.text)
                    workers.search.search(data.text)
                }
                $('.window.search .search-input>input[type=text]').focus().unbind('keypress').keypress(e=>{
                    if(e.key === 'Enter' || ($('.window.search input[type=text]').val().length>=3&&binds.config.config.realtimeSearch)) workers.search.search($('.window.search input[type=text]').val())
                })
                $('.window.search .search-input>button').unbind('click').click(()=>{
                    workers.search.search($('.window.search input[type=text]').val())
                })
            },
            releases: () => {
                let select = $('.releases-filter')
                let container = $('.window.releases .results')
                let results = [[],[],[],[],[],[],[]]
                let titles = [
                    'Понедельник',
                    'Вторник',
                    'Среда',
                    'Четверг',
                    'Пятница',
                    'Суббота',
                    'Воскресенье'
                ]
                select.unbind('change').change(()=>load(select.val()))
                let onload = () => {
                    container.html('')
                    results.forEach((t,d)=>{
                        container.append(collections.textTitle(titles[d]))
                        t.forEach(i=>{
                            container.append(collections.minTitle(i.name,i.time,i.from))
                        })
                    })
                    binds.aWindow.update()
                }
                let load = (order) => {
                    container.html(collections.loadingResults())
                    switch (order){
                        case 'animevost':
                            workers.schedule.animevost().then(r=>{
                                results = r
                                onload()
                            })
                            break;
                        case 'anilibria':
                            workers.schedule.anilibria().then(r=>{
                                results = r
                                onload()
                            })
                            break;
                        default:
                            workers.schedule.all().then(r=>{
                                results = r
                                onload()
                            })
                            break;
                    }
                }
                load(select.val())
            }
        }
    }
    let pages = {
        _current: 'general',
        _working: [],
        levels: [],
        init(){
            return this.processor()
        },
        processor(){
            this.levels = url.address.split('/')
            switch (this.levels[0]){
                case 'player': return this.set('player')
                case 'general':
                default: return this.set('general')
            }
        },
        set(name){
            if(Object.keys(this.array).indexOf(name)===-1) throw 'This page doesn\'t exist'
            windows.close()
            $('.page.'+this._current).css('display','none')
            'unload'in this.array[this._current]&&this.array[this._current].unload(...Array(...arguments).splice(1))
            this._current = name
            if(this._working.indexOf(name)!==-1)'update'in this.array[name]&&this.array[name].update(...Array(...arguments).splice(1))
            else this._working.push(name),this.array[name].main(...Array(...arguments).splice(1))
            $('.page.'+name).css('display','inline-block')
        },
        array: {
            general: {
                state: null,
                shikimori: shikimori.animes(),
                main(){
                    $('main>.vcontainer').html('')
                    this._scrollUpdate()
                },
                update(){},
                load(page=1){
                    this.state = 'loading'
                    this.shikimori.page(page).then(r=>{
                        if(r.length===0) return $('.page.general div.all').append(collections.noResults('Не удалось загрузить больше.'))
                        r.forEach(t=>{
                            $('.page.general div.all').append(collections.title(t.id,t.image.preview,t.russian||t.name,t.name,t))
                        })
                        App.loaded()
                        this.state = null
                        binds.lazyLoad.update()
                        binds.aWindow.update()
                        binds.titleHover.update()
                    },e=>{
                        $('.page.general>.vcontainer').html(collections.noResults())
                        console.groupCollapsed('Unable to load titles')
                        Array(...arguments).forEach(a=>console.error(a))
                        console.groupEnd()
                    })
                },
                _scrollUpdate(){
                    let pages = 1
                    this.load(pages++)
                    binds.bodyScroll.bind(e=>{
                        let toBottom = e.target.children[0].clientHeight - e.target.scrollTop - e.target.clientHeight
                        if(toBottom < 500 && this.state!=='loading') this.load(pages++)
                    },'pages.general._scrollUpdate')
                }
            },
            player: {
                _current: 'kodik',
                _title: undefined,
                _data: undefined,
                main(){
                    App.loaded()
                    this.update()
                },
                load(){},
                update(){
                    if(this._title!==pages.levels[1].toString()+pages.levels[2].toString())
                        this.setPlayer(pages.levels[1],pages.levels[2])
                    $('header>nav>a.player-show').hide()
                },
                setPlayer(name,id){
                    this._title = name.toString()+id.toString()
                    shikimori.anime(id).then(r=>{
                        this._data = r
                    })
                    $('.page.player .player-'+this._current).hide()
                    let players = {
                        kodik: $('.page.player .player-kodik')
                    }
                    switch (name){
                        case 'animetop': break;
                        case 'shikimori':
                            players.kodik.show()
                            this.players.kodik.setShikimori(id)
                            break;
                        case 'kodik':
                        default:
                            players.kodik.show()
                            this.players.kodik.setVideo(id)
                            break;

                    }
                },
                players: {
                    kodik: {
                        setShikimori(id){
                            $('.page.player .player-kodik').attr('src',`//kodik.cc/find-player?shikimoriID=${id}`)
                        },
                        setVideo(id){}
                    }
                },
                unload(){
                    $('header>nav>a.player-show').show().attr('title',this._data.russian||this._data.name||'Плеер')
                }
            }
        }
    }
    let workers = {
        search: {
            dom: {
                results: $('.window.search .results')
            },
            search(text){
                this.dom.results.html(collections.loadingResults())
                shikimori.animes().status('').order('').search(text).then(r=>{
                    this.dom.results.html('')
                    if(r.length===0)$('.window.search .results').html(collections.noResults())
                    r.forEach(t=>{
                        this.dom.results.append(collections.titleEx(t.id,t.image.preview,t.russian||t.name,t.name,t))
                    })
                    binds.titleHover.update()
                    binds.lazyLoad.update()
                    binds.aWindow.update()
                })
            }
        },
        favorite: {
            init(){},
            toggle(data){},
        },
        clock: {
            set(){
                let date = new Date()
                $('.ui-clock').text((date.getHours()>9?date.getHours():'0'+date.getHours())+':'+(date.getMinutes()>9?date.getMinutes():'0'+date.getMinutes()))
                window.clock = setInterval(function(){
                    let date = new Date(),
                        elem = $('.ui-clock'),
                        format = (date.getHours()>9?date.getHours():'0'+date.getHours())+':'+(date.getMinutes()>9?date.getMinutes():'0'+date.getMinutes())
                    if(elem.text()!==format)elem.text(format)
                },1e3)
            }
        },
        hotkeys(){
            hotkeys('esc,alt+o,alt+s',function(e,h){
                switch(h.key){
                    case 'esc':
                        if(windows.current!==null)windows.close()
                        else pages.set('general')
                        break;
                    case 'alt+o': windows.open('config'); break;
                    case 'alt+s': windows.open('search'); break;
                }
            })
        },
        metric: {
            state: false,
            init(){
                this.state = Boolean(binds.config._value('collectInformation'))
            }
        },
        hoverMenu(){
            binds.titleHover.on('click',n=>{
                console.log(n,tile)
                switch (Number(n)) {
                    case 0: return url.set('#player/shikimori/'+tile.id,{})
                    case 1: return windows.open('title-info',tile)
                    case 2: return workers.favorite.toggle(tile)
                    case 3: return navigator.clipboard.writeText(tile.name)
                    case 4: return window.open('https://shikimori.one'+tile.url)
                }
            }).on('open',e=>{
                tile = JSON.parse(e.delegateTarget.dataset.add||"{}")
                console.log(tile)
            })
        },
        schedule: {
            _cache: {},
            async animevost(){
                let result = [[],[],[],[],[],[],[]]
                if(this._cache.animevost!==undefined)
                    return this._cache.animevost
                await animetop.timetable().then((r,e)=>{
                    if(e!==undefined)return err(e)
                    r.forEach(i=>{
                        result[i.day].push({
                            name: i.name,
                            time: i.time,
                            from: 'AnimeVost'
                        })
                    })
                })
                return this._cache.animevost=result
            },
            async anilibria(){
                let result = [[],[],[],[],[],[],[]]
                if(this._cache.anilibria!==undefined)
                    return this._cache.anilibria
                await binds.anilibria.getSchedule().then((r,e)=>{
                    if(e!==undefined)return err(e)
                    r.forEach((data,day)=>{
                        data.list.forEach(i=>{
                            result[day].push({
                                name: i.names.ru,
                                time: 'неизвестно',
                                from: 'Anilibria'
                            })
                        })
                    })
                })
                return this._cache.anilibria=result
            },
            _list: ['animevost','anilibria'],
            all(){
                return new Promise(res=>{
                    let results = [[],[],[],[],[],[],[]]
                    this._list.forEach((a,i)=>{
                        this[a]().then(r=>{
                            r.forEach((d,i)=>{
                                results[i]=results[i].concat(d)
                            })
                            if(i===this._list.length-1)
                                return res(results)
                        })
                    })
                })
            }
        },
        styles(){
            document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        }
    }
    workers.styles()
    workers.hoverMenu()
    workers.hotkeys()
    workers.clock.set()
    App.chrome.sw()
    windows.bind()
    window.workers = workers
    console.log('KDK Anime v3.0.28.2259')
})