$(function(){
    let url = new URI('#'),
        binds = {
            aPage: new Bind('a[data-page]','click'),
            aWindow: new Bind('a[data-window]','click'),
            hover: new Bind('header a','mousemove'),
            bodyScroll: new Bind('.page.general','scroll'),
            lazyLoad: new LazyLoad({}),
            titleHover: new hoverMenu('.ui-title',[
                'Открыть',
                '<span class="material-icons icon">info</span>Информация',
                {text:'<span class="material-icons icon">favorite</span>Любимое',action:'stay',classes:['ui-disabled']},
                {text:'<span class="material-icons icon">gps_not_fixed</span>Отслеживать',action:'stay',classes:['ui-disabled']},
                '<span class="material-icons icon">content_copy</span>Скопировать название',
                {text:'<span class="icon" style="background-color:rgba(var(--colorFill),0.5)"><img alt="sk" src="https://shikimori.one/assets/layouts/l-top_menu-v2/glyph.svg" height="24"></span>Открыть в Shikimori',classes:['externalLink']}
            ],{classes:['icon-list','ui-hovermenu','ui-material-list']}),
            config: new configCollector(),
            anilibria: new Anilibria(),
            kodik: new kodik('.page.player .player-kodik'),
            kodikBackend: new kodikBackend('07e3119af111900bf95bd7c9554430a4'),
            sHistory: new listStorage('sHistory'),
            sFavorite: new listStorage('sFavorite'),
            titleHigh: new Bind('.ui-title','mousemove')
        },
        toRGB = function(hex){
            let hex_code = hex.split(""),
                red = parseInt(hex_code[1]+hex_code[2],16),
                green = parseInt(hex_code[3]+hex_code[4],16),
                blue = parseInt(hex_code[5]+hex_code[6],16)
            return [red,green,blue]
        },
        collections = {
            title(data){
                return `<a data-page="player" href="#player/shikimori/${data.id}" title="${(data.russian?data.russian+'\n':'')+data.name}">${this.titleBase(data)}</a>`
            },
            titleBase(data,bottom,options={}){
                return `
                    <div class="ui-title${options.classes?` ${options.classes.join(' ')}`:''}" data-add='${JSON.stringify(data)}' ${options.style?`style="${Object.keys(options.style).map(k=>k+':'+options.style[k]).join(';')}"`:''}>
                        <div class="lazy preview" data-bg="//shikimori.one${binds.config.config.highPreview?data.image.original||data.image.preview:data.image.preview}"></div>
                        <div>${bottom||""}</div>
                    </div>
                `
            },
            minTitle(name,time,from){
                return `<a data-window="search" data-add='{"text":"${name}"}'><div class="ui-min-title" style="--from:'${from}'" title="Время: ${time}"><h4>${name}</h4></div></a>`
            },
            titleInfo(data){
                return `
                    ${this.titleBase(data,'',{style:{margin:'auto'},classes:['inactive']})}
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
                    <hr>
                    <ui class="icon-list ui-material-list">
                        <li onclick="url.set('#player/shikimori/${data.id}',{})">Открыть</li>
                        <li class="ui-disabled"><span class="material-icons icon">favorite</span>Любимое</li>
                        <li class="ui-disabled"><span class="material-icons icon">gps_not_fixed</span>Отслеживать</li>
                        <li onclick="window.open('//shikimori.one${data.url}')"><span class="icon" style="background-color:rgba(var(--colorFill),0.5)"><img alt="sk" src="https://shikimori.one/assets/layouts/l-top_menu-v2/glyph.svg" height="24"></span>Открыть в Shikimori</li>
                    </ui>
                    <hr>
                    <h3>Хронология</h3>
                    <ui class="ui-material-list timeline">
                        ${collections.loadingResults()}
                    </ui>
                    <hr>
                    <h3>Ссылки</h3>
                    <ui class="ui-material-list icon-list links">
                        ${collections.loadingResults()}
                    </ui>
                `
            },
            loadingResults(){
                return '<div class="ui-load"><span class="material-icons">hourglass_empty</span></div>'
            },
            noResults(text='Не удалось ничего найти'){
                return '<div class="ui-error"><div><span class="material-icons">announcement</span><h5>'+text+'</h5></div></div>'
            },
            progress(statistic,digits=2){
                let data=statistic[1],progress=[],precent = 360/Object.keys(data).filter(k=>data[k].size!=='0B'?k:null).length,description=[]
                Object.keys(data).filter(k=>data[k].size!=='0B'?k:null).forEach((k,i)=>{
                    let precents = Math.ceil(data[k].part*10**(digits+2))/10**digits
                    progress.push(`<div title="${k} - ${precents}%" style="--color:${data[k].color||precent*i}deg;--part:${data[k].part}"></div>`)
                    description.push(`<div style="--color:${data[k].color||precent*i}deg" title="${precents}%" class="ui-progress-part">${data[k].description||k} (${data[k].size})</div>`)
                })
                return `<span>Всего: ${statistic[0]}</span><div class="ui-progress">${progress.join('')}</div>${description.join('')}`
            },
            playerBar(data){
                return `<a class="material-icons" data-window="title-info" data-add='${JSON.stringify(data)}' title="Информация">info</a><a class="material-icons" title="Пропустить">skip_next</a><span>${data.russian||data.name}</span>`
            },
            materialItem(text,data){
                return `${data.window||data.page||data.href?`<a ${data.data||data.href?` href="${data.data||data.href}"`:''} ${data.href?'target="_blank"':''} ${data.page?`data-page='${data.page}'`:''} ${data.window?`data-window='${data.window}'${data.data?` data-add="${data.data}"`:''}`:''}>`:''}<li ${data.active?'class="active"':''}>${text}</li>${data.window||data.page||data.href?`</a>`:''}`
            },
            consoleRow(text,color){
                return `<pre style="color:${color};margin:0">${text}</pre>`
            },
            filterItem(name,title,options){
                return `<div class="ui-select"><span>${title}</span><select name="${name}">${Object.values(options).map(i=>`<option value="${i.value}" ${i.selected?'selected':''}>${i.name}</option>`).join('')}</select><i class="material-icons">expand_more</i></div>`
            }
        },
        config = (k,v)=>{
            let body = $('body'),
                kodik=$('.page.player .player-kodik.player')
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
                case 'playerMode': return $('div.page.player, div.window.config div.player-preview').attr('playerMode', v)
                case 'showTracking': return $('header [data-window=tracking]').attr('display',v.toString())
                case 'disableAds': return v?kodik.attr('sandbox','allow-same-origin allow-scripts'):kodik.removeAttr('sandbox')
            }
        },
        windows = {
            container: false,
            current: null,
            bind(){
                binds.aWindow.bind(e=>{
                    let data = JSON.parse(e.delegateTarget.dataset.add||"{}")
                        ,name = e.delegateTarget.dataset.window
                    if(name===this.current&&this.container) return this.close()
                    return this.open(name,data)
                },'windows.bind')
                $('.windows').click(e=>{
                    if(e.target.classList.contains('windows'))
                        this.close()
                })
            },
            open(name,data={}){
                if(this.current!==null) $('.window.'+this.current).removeClass('active')
                else !this.container&&$('.windows').addClass('use')
                $('.window.'+name).addClass('active')
                this.current = name
                this.container = true
                workers.console.log('Window opened - '+name)
                this.array[name]&&this.array[name](data)
            },
            close(){
                $('.window.'+this.current).removeClass('active')
                workers.console.log('Windows closed')
                this.current = null
                $('.windows').removeClass('use')
                this.container = false
            },
            context: {
                opened: false,
                bind(){
                    $('div.windows>.context-window').click(e=>{
                        if(e.target.classList.contains('context-window'))
                            this.close()
                    })
                },
                open(content){
                    !this.container&&$('.windows').addClass('use')
                },
                close(closeWindow=true){

                }
            },
            array: {
                config: () => {
                    $('.window.config .version').text(`[${App.info.short_name}]${App.info.update.version}(rel:${App.info.update.release})`)
                    $('.window.config .storage').html(collections.progress(workers.storage._data()))
                },
                'title-info': title => {
                    $('.windows .window.title-info .ui-grid').html(collections.titleInfo(title))
                    binds.lazyLoad.update()
                    binds.titleHigh.update()
                    let timeline = $('.window.title-info .ui-material-list.timeline'),links=$('.window.title-info .ui-material-list.links')
                    shikimori.anime(title.id).franchise().then(r=>{
                        timeline.html('')
                        r.nodes.forEach(n=>{
                            timeline.append(collections.materialItem(n.name,{page:'player',data:`#player/shikimori/${n.id}`,active:n.id===title.id}))
                        })
                        binds.aPage.update()
                    })
                    shikimori.anime(title.id).external_links().then(r=>{
                        links.html('')
                        r.forEach(l=>{
                            let kind = workers.shikimori.linkTitle(l.kind)
                            links.append(collections.materialItem(`<span class="icon"><img src="https://shikimori.one/assets/blocks/b-external_links/${kind?l.kind:"official_site"}.png" alt="${kind||"official_site"}" height="100%"></span>${kind||l.kind}`,{href:l.url}))
                        })
                    })
                },
                search: data => {
                    if(data.text) {
                        $('.window.search input[type=text]').val(data.text)
                        workers.search.search(data.text)
                    }
                    $('.window.search .search-input>input[type=text]').focus().unbind('keypress').keypress(e=>{
                        let search = $('.window.search input[type=text]')
                        if(e.key === 'Enter' || (search.val().length>=3&&binds.config.config.realtimeSearch)) workers.search.search(search.val())
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
                },
                history(){
                    let results = $('.window.history .results'),hs=workers.metric.history()
                    results.html('')
                    if(hs===false) return results.html(collections.noResults('Сбор данных отключён'))
                    Object.values(hs.get()).reverse().forEach(d=>results.append(collections.title(d)))
                    binds.titleHigh.update()
                    binds.lazyLoad.update()
                },
                favorite(){
                    let results = $('.window.favorite .results'),fav=worker.metric.favorite()
                    results.html('')
                    if(fav===false) return results.html(collections.noResults('Сбор данных отключён'))
                    Object.values(fav.get()).reverse().forEach(d=>results.append(collections.title(d)))
                    binds.titleHigh.update()
                    binds.lazyLoad.update()
                }
            }
        },
        pages = {
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
                workers.console.log(`Page open - ${name}`)
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
                        let filters = {
                            order: [{name:'ID',value:'id'},'ranked','kind','popularity','name','aired_on','episodes','status','random',''],
                            kind: ['tv','movie','ova','ona','special','music','tv_13','tv_24','tv_48',''],
                            status: ['anons','ongoing','released','']
                        }
                        $('main>.vcontainer').html('')
                        this._scrollUpdate()
                    },
                    update(){},
                    load(page=1){
                        this.state = 'loading'
                        this.shikimori.page(page).then(r=>{
                            let results = $('.page.general div.all')
                            if(r.length===0) return results.append(collections.noResults('Не удалось загрузить больше.'))
                            r.forEach(t=>{
                                results.append(collections.title(t))
                            })
                            App.loaded()
                            this.state = null
                            binds.lazyLoad.update()
                            binds.titleHigh.update()
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
                        workers.console.log('Load titles in general page...')
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
                    _state: undefined,
                    main(){
                        App.loaded()
                        this.update()
                    },
                    load(){
                        workers.kodik()
                    },
                    update(){
                        if(this._title!==pages.levels[1].toString()+pages.levels[2].toString())
                            this.setPlayer(pages.levels[1],pages.levels[2])
                        $('header>nav>a.player-show').hide()
                    },
                    setPlayer(name,id){
                        workers.console.log(`Running player - ${name}:${id}`)
                        this._title = name.toString()+id.toString()
                        shikimori.animes().reset().ids([Number(id)]).then(r=>{
                            this._data = r[0]
                            App.title(`KDK - ${this._data.russian||this._data.name}`)
                            $('.page.player .ui-bar').html(collections.playerBar(this._data))
                            let hs=workers.metric.history()
                            hs&&hs.push({
                                id: this._data.id,
                                name: this._data.name,
                                russian: this._data.russian,
                                image: {preview:this._data.image.preview,original:this._data.image.original}
                            })
                            binds.aWindow.update()
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
                                binds.kodikBackend.search({shikimori_id:Number(id)}).then(d=>{
                                    if(d.results.length===0) return alert('anime not found')
                                    $('.page.player .player-kodik').attr('src',d.results[0].link)
                                })
                            },
                            setVideo(id){}
                        }
                    },
                    unload(){
                        $('header>nav>a.player-show').show().attr('title',this._data.russian||this._data.name||'Плеер')
                    }
                }
            }
        },
        workers = {
            ui(){
                binds.hover.bind(function(e){
                    $(this).css({
                        '--x': e.offsetX+'px',
                        '--y': e.offsetY+'px'
                    })
                },'jq.custom')
                pages.init()
                $('body').contextmenu(e=>{
                    if(windows.current!==null)windows.close()
                    else pages.set('general')
                    e.preventDefault()
                })
                binds.aPage.bind(function(){
                    pages.set($(this).attr('data-page'))
                },'jq.custom')
                binds.titleHigh.bind(function(e){
                    $(this).css({
                        "--x": e.offsetX,
                        "--y": e.offsetY
                    })
                }, 'worker.ui.title')
            },
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
                            this.dom.results.append(collections.title(t))
                        })
                        binds.titleHover.update()
                        binds.titleHigh.update()
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
                hotkeys('esc,alt+o,alt+s,alt+c',function(e,h){
                    switch(h.key){
                        case 'esc':
                            if(windows.current!==null)windows.close()
                            else pages.set('general')
                            break;
                        case 'alt+o': windows.open('config'); break;
                        case 'alt+s': windows.open('search'); break;
                        case 'alt+c': windows.open('console'); break;
                    }
                })
            },
            metric: {
                state:()=>binds.config.config.collectInformation,
                init(){

                },
                history(){
                    return workers.metric.state()?binds.sHistory:false
                },
                favorite(){
                    return workers.metric.state()?binds.sFavorite:false
                }
            },
            hoverMenu(){
                binds.titleHover.on('click',n=>{
                    switch (Number(n)) {
                        case 0: return url.set('#player/shikimori/'+tile.id,{})
                        case 1: return windows.open('title-info',tile)
                        case 2: return workers.favorite.toggle(tile)
                        case 4: return navigator.clipboard.writeText(tile.name)
                        case 5: return window.open('https://shikimori.one'+tile.url)
                    }
                }).on('open',e=>{
                    tile = JSON.parse(e.delegateTarget.dataset.add||"{}")
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
                let f=()=>{
                    let hd=document.querySelector('header'),cs=document.querySelector('#--headerCeilSize').offsetHeight
                    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
                    hd.children[0].style.height=((document.querySelectorAll('header>nav>a[display=true]').length+4)*cs>=hd.offsetHeight)?'fit-content':'100%'
                }
                window.addEventListener('resize',f)
                document.addEventListener("DOMContentLoaded",f)
                f()
            },
            oldConvert: {
                history(){
                    let list = localStorage.getItem('lsHistory')
                }
            },
            storage: {
                init(){
                    this.size._build()
                },
                size: {
                    _build(){
                        Object.keys(this._old).forEach(k=>this[`old${k}`]=()=>this._Processor(this._old[k]))
                        Object.keys(this._list).forEach(k=>this[k]=()=>this._Processor(this._list[k]))
                    },
                    _Processor(name){
                        let list = localStorage.getItem(name)
                        return list===null?0:new Blob([list]).size
                    },
                    _old: {
                        Favorite: 'lsfavorite',
                        Cache: 'cache',
                        History: 'lshistory'
                    },
                    _list: {
                        favorite: 'sFavorite',
                        history: 'sHistory'
                    },
                    all(){
                        let size = this.self()
                        Object.values(this._old).forEach(v=>size+=this._Processor(v))
                        Object.values(this.list).forEach(l=>size+=this._Processor(l))
                        return size
                    },
                    self(){
                        let file, size = 0
                        App.info.sources.forEach(s=>{
                            try{file=storage.get(s.name)}
                            catch(e){
                                console.groupCollapsed('Unable to load file')
                                console.error(e)
                                return console.groupEnd()
                            }
                            size += new Blob([file]).size
                        })
                        return size
                    }

                },
                _data(){
                    let data = {
                        system: {size: this.size.self(),description: 'Файлы сайта'},
                        oldcache: {size: this.size.oldCache(),description: 'Старые данные кэша'},
                        oldhistory: {size: this.size.oldHistory(),description: 'Старая история просмотров'},
                        oldfavorite: {size: this.size.oldFavorite(),description: 'Старый список любимого'},
                        favorite: {size: this.size.favorite(),description: 'Список любимого'},
                        history: {size: this.size.history(),description: 'История просмотров'}
                    }, all = Object.values(data).reduce((a,b)=>a+b.size,0)
                    return Object.keys(data).forEach(k=>(data[k].part=data[k].size/all,data[k].size=this._convert(data[k].size))),[this._convert(all),data]
                },
                _convert(bytes,digits=2){
                    let sizes = ["B","KB","MB"], step = 0
                    while (Math.floor(bytes/2**10)>=1&&step<sizes.length)
                        (bytes = bytes/2**10),step++
                    return (Math.floor(bytes*10**digits)/10**digits)+(sizes[step]||sizes[step-1])
                }
            },
            shikimori: {
                linkTitle(kind){
                    switch(kind){
                        case'wikipedia':return'Wikipedia'
                        case'anime_news_network':return'Anime News Network'
                        case'myanimelist':return'MyAnimeList'
                        case'anime_db':return'AniDB'
                        case'world_art':return'World Art'
                        case'twitter':return'Twitter'
                        case'official_site':return'Официальный сайт'
                        case'kage_project':return'Kage Project'
                        case'kinopoisk':return'Кинопоиск'
                        case'ruranobe':return'РуРанобэ'
                        case'readmanga':return'ReadManga'
                        case'novelupdates':return'NovelUpdates'
                        case'mangaupdates':return'MangaUpdates'
                        case'mangafox':return'MangaFox'
                        case'mangachan':return'Манга-тян'
                        case'mangahub':return'Mangahub'
                        case'smotret_anime':return'Смотреть аниме'
                        case'youtube_channel':return'YouTube'
                        case'novel_tl':return'Novel.tl'
                        case'mangalib':return'MangaLib'
                        case'ranobelib':return'RanobeLib'
                        case'remanga':return'ReManga'
                        case'mangadex':return'MangaDex'
                        case'more_tv':return'more.tv'
                        case'baike_baidu_wiki':return'Baike Baidu Wiki'
                        case'namu_wiki':return'Namu Wiki'
                    }
                }
            },
            console: {
                log(text,col='#fff'){
                    let log = $('.window.console .result')
                    log.append(collections.consoleRow(text,col))
                    $('.window.console').scrollTop(log.height())
                },
                error(text){return this.log(text,'#f77')},
                warn(text){return this.log(text,'#ff7')}
            },
            kodik(){
                binds.kodik.on('current_episode',d=>{
                    pages.array.player._state = d
                }).on('time_update',d=>{
                    let hs = workers.metric.history()
                    if(!hs) return false
                    let ls=hs.get(),ind = ls.map(e=>e.id).indexOf(pages.array.player._data.id)
                    if(ind===-1) return false
                    ls.episodes[pages.array.player._state.episode] = d
                    hs.modify(ind,ls[ind])
                })

            },
            redirect(){
                url.onRedirect(st=>{
                    console.groupCollapsed('Redirected to #'+url.address)
                    console.log(st)
                    console.groupEnd()
                    workers.console.log('Page changed to '+url.address)
                    pages.processor()
                })
            }
        }
    // config load
    binds.config.change(config)
    // ui preload
    workers.ui()
    workers.styles()
    workers.hoverMenu()
    workers.clock.set()
    // internal init
    workers.storage.init()
    workers.hotkeys()
    workers.redirect()
    // app link
    windows.bind()
    App.chrome.sw()
    // debug info
    workers.console.log('Start loading...')
    workers.console.log(`Current version: ${App.info.update.version}(${App.info.update.release})`)
    console.log(`KDK Anime ${App.info.update.version}(${App.info.update.release})`)
})