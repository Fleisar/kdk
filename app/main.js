$(function(){
    window.url = new URI('#')
    window.binds = {
        aWindow: new Bind('a[data-window]','click'),
        hover: new Bind('header .hover','mousemove'),
        bodyScroll: new Bind('main','scroll'),
        lazyLoad: new LazyLoad({})
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
        pages.init()
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
            return `<a data-page="player" data-add='{"id":${id}}' title="${name}\n${original_name}" class="tile-href"><div class="tile"><div class="tile-preview"><img alt="${original_name}" class="lazy" data-src="//shikimori.one${poster}"></div><span>${name}</span></div></a>`
        },
        loadingResults(){
            return '<div class="load-block"><span class="material-icons">hourglass_empty</span></div>'
        },
        noResults(text='Не удалось ничего найти'){
            return '<div class="error-block"><div><span class="material-icons">announcement</span><h5>'+text+'</h5></div></div>'
        }
    }
    let config = {
        init(){

        }
    }
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
                    $('.windows-container').removeClass('use')
                    this.container = false
                }else{
                    this.current!==null&&$('.window.'+this.current).removeClass('active')
                    !this.container&&$('.windows-container').addClass('use')
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
        init(){
            switch (true) {
                case window.url.address.startsWith('pl-'): return this.set('player')
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
                    $('main>.vcontainer').html('')
                    this._scrollUpdate()
                },
                update(){},
                load(page=1){
                    this.state = 'loading'
                    this.shikimori.page(page).then(r=>{
                        if(r.length===0) return $('main>.vcontainer').append(collections.noResults('Не удалось загрузить больше.'))
                        r.forEach(t=>{
                            $('main>.vcontainer').append(collections.title(t.id,t.image.preview,t.russian||t.name,t.name))
                        })
                        this.state = null
                        binds.lazyLoad.update()
                        binds.aWindow.update()
                    },e=>{
                        $('main>.vcontainer').html(collections.noResults())
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
                main(){},
                update(){},
                unload(){}
            }
        }
    }
    let workers = {
        search: {
            dom: {
                results: $('.window.search .results')
            },
            search: (text) => {
                this.dom.results.html(collections.loadingResults())
                shikimori.animes().status('').order('').search(text).then(r=>{
                    this.dom.results.html('')
                    if(r.length===0)$('.window.search .results').html(collections.noResults())
                    r.forEach(t=>{
                        this.dom.results.append(collections.title(t.id,t.image.preview,t.russian||t.name,t.name))
                    })
                    binds.lazyLoad.update()
                    binds.aWindow.update()
                })
            }
        }
    }
    windows.bind()
    config.init()
    console.log('KDK Anime v3.0.28.2259')
})