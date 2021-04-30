$(function(){
    window.url = new URI('#')
    window.binds = {
        aWindow: new Bind('a[data-window]','click'),
        hover: new Bind('header a','mousemove'),
        bodyScroll: new Bind('.page.general','scroll'),
        lazyLoad: new LazyLoad({}),
        titleHover: new hoverMenu('.ui-title',[
            'Открыть',
            '<span class="material-icons icon">info</span>Информация',
            {text:'<span class="material-icons icon">favorite</span>Любимое',action:'stay'},
            '<span class="material-icons icon">content_copy</span>Скопировать название',
            {text:'<span class="icon" style="background-color:rgba(var(--colorFill),0.5)"><img src="https://shikimori.one/assets/layouts/l-top_menu-v2/glyph.svg" height="24"></span>Открыть в Shikimori',classes:['externalLink']}
        ],{classes:['icon-list','ui-hovermenu']}),
        config: new configCollector()
    }
    $(function(){
        binds.hover.bind(function(e){
            $(this).css({
                '--x': e.offsetX+'px',
                '--y': e.offsetY+'px'
            })
        },'jq.custom')
        pages.init()
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
        title(id,poster,name,original_name){
            return `
                <a data-page="player" href="#player/shikimori/${id}">
                    <div class="ui-title" data='{"id":${id},"name":"${original_name}"}'>
                        <img alt="${original_name}" class="lazy" data-src="//shikimori.one${poster}">
                        <div></div>
                    </div>
                </a>
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
                console.log(e)
                let data = JSON.parse(e.currentTarget.dataset.add||"{}")
                if(e.target.dataset.window===this.current&&this.container){
                    $('.window.'+this.current).removeClass('active')
                    this.current = null
                    $('.windows').removeClass('use')
                    this.container = false
                }else{
                    this.current!==null&&$('.window.'+this.current).removeClass('active')
                    !this.container&&$('.windows').addClass('use')
                    $('.window.'+e.currentTarget.dataset.window).addClass('active')
                    this.current = e.currentTarget.dataset.window
                    this.container = true
                }
                this.array[e.currentTarget.dataset.window]&&this.array[e.currentTarget.dataset.window](data)
            },'windows.bind')
        },
        array: {
            config: () => {

            },
            player: data => {
                console.log(data)
            },
            search: () => {
                $('.window.search input[type=text]').unbind('keypress').keypress(e=>{
                    if(e.key === 'Enter') workers.search.search($('.window.search input[type=text]').val())
                })
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
                    let tile = {}
                    $('main>.vcontainer').html('')
                    this._scrollUpdate()
                    binds.titleHover.on('click',n=>{
                        console.log(n,tile)
                        switch (Number(n)) {
                            case 0: return url.set('#player/shikimori/'+tile.id,{})
                            case 1: break
                            case 2: break
                            case 3: return window.open('https://shikimori.one/animes/'+tile.id)
                        }
                    }).on('open',e=>{
                        tile = JSON.parse($(e.delegateTarget).attr('data'))
                        console.log(tile)
                    })
                },
                update(){},
                load(page=1){
                    this.state = 'loading'
                    this.shikimori.page(page).then(r=>{
                        if(r.length===0) return $('.page.general div.all').append(collections.noResults('Не удалось загрузить больше.'))
                        r.forEach(t=>{
                            $('.page.general div.all').append(collections.title(t.id,t.image.preview,t.russian||t.name,t.name))
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
                main(){
                    App.loaded()
                    this.update()
                },
                load(){},
                update(){
                    this.setPlayer(pages.levels[1],pages.levels[2])
                },
                setPlayer(name,id){
                    $('.page.player .player-'+this._current).hide()
                    switch (name){
                        case 'animetop': break;
                        case 'shikimori':
                            $('.page.player .player-kodik').show()
                            this.players.kodik.setShikimori(id)
                            break;
                        case 'kodik':
                        default:
                            $('.page.player .player-kodik').show()
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
                unload(){}
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
                        this.dom.results.append(collections.title(t.id,t.image.preview,t.russian||t.name,t.name))
                    })
                    binds.titleHover.update()
                    binds.lazyLoad.update()
                    binds.aWindow.update()
                })
            }
        },
        clock: {
            set(){
                let date = new Date()
                $('.ui-clock').text((date.getHours()>9?date.getHours():'0'+date.getHours())+':'+(date.getMinutes()>9?date.getMinutes():'0'+date.getMinutes()))
                window.clock = setInterval(function(){
                    let date = new Date()
                    $('.ui-clock').text((date.getHours()>9?date.getHours():'0'+date.getHours())+':'+(date.getMinutes()>9?date.getMinutes():'0'+date.getMinutes()))
                },1e3)
            }
        },
        hotkeys: {

        }
    }
    workers.clock.set()
    App.chrome.sw()
    windows.bind()
    console.log('KDK Anime v3.0.28.2259')
})