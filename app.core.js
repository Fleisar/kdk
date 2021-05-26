(function(){
    window.App = {
        DEFAULT_MANIFEST: 'app.json',
        info: false,
        install(manifest,reload=false){
            let startInstalling = (new Date()).getTime()
            this._downloadManifest(manifest||this.DEFAULT_MANIFEST,r=>{
                if(!this._checkTypes([r.name,r.version,r.sources],['string','number','object'])) throw `Invalid manifest`
                this.uninstall()
                App.info = r
                let sources = 0
                if(App.info.logo) document.querySelector('#app-ui>.loadScreen img').setAttribute('src',App.info.logo)
                if(App.info.name) document.querySelector('#app-ui>.loadScreen h1').innerHTML = App.info.name
                App.info.sources.forEach((source,i)=>{
                    fetch(source.url).then(r=>{
                        if(r.ok){
                            let name = (new Date()).getTime()
                            r.text().then(t=>{
                                storage.createFile((name.toString()+i.toString()).toString(),t)
                                App.info.sources[i].name = name.toString()+i.toString()
                                sources++
                                if(sources===App.info.sources.length){
                                    this._saveConfig()
                                    reload?window.location.reload():this.run(true)
                                    App.info.dev_mode&&console.info(`App installed and ran for ${(new Date()).getTime()-startInstalling}ms`)
                                }
                            })
                        } else throw `App's file cannot be downloaded`
                    })
                })
            })
        },
        uninstall(){
            App.info&&App.info.sources.forEach(source=>storage.deleteFile(source.name.toString()))
        },
        run(install=false){
            storage.build(App.info.sources)
            let dom = ()=>{
                if(App.info.application.name!==undefined){
                    let meta = document.createElement('meta')
                    meta.name = 'application-name'
                    meta.content = App.info.application.name
                    document.getElementsByTagName('head')[0].appendChild(meta)
                }
                if(App.info.application.manifest!==undefined){
                    let link = document.createElement('link')
                    link.rel = 'manifest'
                    link.href = App.info.application.manifest
                    document.getElementsByTagName('head')[0].appendChild(link)
                }
                if(App.info.logo) document.querySelector('#app-ui>.loadScreen img').setAttribute('src',App.info.logo)
                if(App.info.name) document.querySelector('#app-ui>.loadScreen h1').innerHTML = App.info.name
                if(App.info.icon) App.icon(App.info.icon[0],App.info.icon[1]||'icon')
                App.title(App.info.short_name||App.info.name||'Application')
                if(App.info.timeout) setTimeout(App.loaded, Number(App.info.timeout))
                else if(!App.info.load_type||App.info.load_type==='default') this._load.add(this.loaded)
            }
            document.readyState==='loading'?document.addEventListener('DOMContentLoaded',dom):dom()
            if(install===true) App.info.install&&eval(`${App.info.install}()`)
            App.info.running&&eval(`${App.info.running}()`)
        },
        title(text) {
            if(text === undefined) return document.querySelector('head>title').innerText
            return document.querySelector('head>title').innerText = text.toString(), this
        },
        icon(url,rel='icon') {
            let icon = document.querySelector('head>link#icon')
            if(url === undefined) return icon.getAttribute('href')
            icon.setAttribute('href',url)
            icon.setAttribute('rel',rel)
            return this
        },
        loaded() {
            let dom = ()=>{
                let scene = document.querySelector('#app-ui>.loadScreen')
                if(!scene.classList.contains('fade')) scene.classList.add('fade')
            }
            document.readyState==='loading'?document.addEventListener('DOMContentLoaded',dom):dom()
        },
        skipUpdate(){
            return App.info.update.release = Math.floor((new Date()).getTime()/1e3), this
        },
        chrome: {
            sw(){
                if(window.location.protocol!=='https:')return false
                if (navigator.serviceWorker.controller) {
                    console.log('[PWA Builder] active service worker found, no need to register')
                } else {
                    navigator.serviceWorker.register('sw.js').then(function(reg) {
                        console.log('Service worker has been registered for scope:'+ reg.scope);
                    });
                }
            }
        },
        ui: {
            updateDialog(manifest){
                let versions = document.querySelectorAll('#app-ui>.window.updateRequest>span>a')
                versions[0].innerText = `${App.info.update.version} (${App.info.update.release})`
                versions[1].innerText = `${manifest.update.version} (${manifest.update.release})`
                document.querySelector('#app-ui>.window.updateRequest>h3>a.name').innerText = App.info.name
                document.querySelector('#app-ui>.window.updateRequest>p').innerHTML = manifest.update.description
                this.window.open('updateRequest')
            },
            window: {
                current: null,
                open(name){
                    if(this.current!==null) this.close()
                    document.querySelector('#app-ui>.window.'+name).style.display = 'block'
                    return this.current = name, this
                },
                close(){
                    document.querySelector('#app-ui>.window.'+this.current).style.display = 'none'
                    return this.current = null, this
                }
            }
        },
        checkUpdate(manifest){
            this._checkUpdate(manifest||this.DEFAULT_MANIFEST,(m,v)=>{
                !v&&this.ui.updateDialog(m)
            })
        },
        _checkUpdate(manifest,handler){
            this._downloadManifest(manifest||this.DEFAULT_MANIFEST,r=>{
                handler(r,r.update.type==='release'?r.update.release<=App.info.update.release:true)
            })
        },
        _load: {
            state: false,
            init(){
                if(document.readyState==='complete') return (this.state=true, this.query.length>0&&this.query.forEach(f=>f()))
                document.addEventListener('readystatechange',()=>{
                    if(document.readyState==='complete') this.query.length>0&&this.query.forEach(f=>f())
                    this.state = true
                })
            },
            query: [],
            add(handler){
                if(typeof handler !== 'function') throw 'Handler must be a function'
                if(this.state||document.readyState==='complete') return handler(), this
                return this.query.push(handler), this
            }
        },
        _init(){
            let app = localStorage.getItem('Application')
            if(app!==null){
                this._load.init()
                App.info = JSON.parse(app)
                if(App.info.dev_mode) this.install()
                else this.run()
                if(App.info.update_policy.auto) this.checkUpdate(this.DEFAULT_MANIFEST)
            }
        },
        _saveConfig(){localStorage.setItem('Application',JSON.stringify(App.info))},
        _downloadManifest(manifest,callback){
            if(!this._checkTypes([manifest,callback],['string','function'])) throw `Invalid input variables`
            fetch(manifest+"?"+(new Date()).getTime()).then(r=>{
                if(r.ok) r.json().then(j=>callback(j))
                else throw `Unable to download manifest`
            })
        },
        _checkTypes(variables, types){
            if(typeof variables !== 'object' || typeof types !== 'object' || variables.length !== types.length) throw `Invalid construction`
            return variables.filter((o,i)=>{if(typeof o === types[i])return o}).length === variables.length
        }
    }
    App._init()
})()