(function(){
    window.storage = {
        STORAGE_PREFIX: 'storage-',
        VERSION: 1,
        CONTENT_LENGTH_LIMIT: 1e6,
        CHECK_FILE_AFTER_ACTION: true,
        SAVE_CONFIG_AFTER_ACTION: true,
        createFile(name, content){
            if(!this._checkTypes([name,content],['string','string'])) throw `Invalid input variables`
            if(content.length > this.CONTENT_LENGTH_LIMIT) throw `File content length must be less ${this.CONTENT_LENGTH_LIMIT}`
            if(this._storage.indexes.indexOf(name) !== -1) throw `File with name "${name}" is already exists`
            localStorage.setItem(this.STORAGE_PREFIX+name,content)
            if(this.CHECK_FILE_AFTER_ACTION&&localStorage.getItem(this.STORAGE_PREFIX+name)===null) throw `Unable to save file "${name}"`
            this._storage.indexes.push(name)
            return this.SAVE_CONFIG_AFTER_ACTION&&this._saveConfig(),this
        },
        deleteFile(name){
            if(!this._checkTypes([name],['string'])) throw `Invalid input variables`
            let index = this._storage.indexes.indexOf(name)
            if(index === -1) throw `File with name "${name}" isn't exists`
            localStorage.removeItem(this.STORAGE_PREFIX+name)
            if(this.CHECK_FILE_AFTER_ACTION&&localStorage.getItem(this.STORAGE_PREFIX+name)!==null) throw `Unable to delete file "${name}"`
            this._storage.indexes.splice(index,1)
            return this.SAVE_CONFIG_AFTER_ACTION&&this._saveConfig(),this
        },
        get(name){
            if(!this._checkTypes([name],['string'])) throw `Invalid input variables`
            if(this._storage.indexes.indexOf(name) === -1) throw `File with name "${name}" isn't exists`
            return localStorage.getItem(this.STORAGE_PREFIX+name)
        },
        embed(name,type){
            if(!this._checkTypes([name,type],['string','string'])) throw `Invalid input variables`
            if(this._storage.indexes.indexOf(name) === -1) throw `File with name "${name}" isn't exists`
            let content = localStorage.getItem(this.STORAGE_PREFIX+name),blob,element
            switch(type){
                case 'script':
                    blob = new Blob([content],{type:'text/javascript'})
                    element = document.createElement('script')
                    element.src = URL.createObjectURL(blob)
                    return document.getElementsByTagName('head')[0].appendChild(element)
                case 'style':
                    blob = new Blob([content],{type:'text/css'})
                    element = document.createElement('link')
                    element.href = URL.createObjectURL(blob)
                    element.rel = 'stylesheet'
                    return document.getElementsByTagName('head')[0].appendChild(element)
                case 'html':
                default:
                    this._onload.push(()=>{
                        document.getElementsByTagName('body')[0].innerHTML += content
                    })
            }

        },
        build(sources,closed=true){
            let scripts='',styles='',html=''
            sources.forEach(i=>{
                let file
                try {file=this.get(i.name)}
                catch(e){throw 'Unable to build sources'}
                switch(i.type){
                    case 'script':scripts += `${file};\n`;break
                    case 'style':styles += file.split(/\n/).join('');break
                    default: case 'html':html += file.split(/\n/).join('')
                }
            })
            if(scripts!==''){
                let blob = new Blob([closed?`(function(){${scripts}})()`:scripts],{type:'text/javascript'})
                let element = document.createElement('script')
                element.src = URL.createObjectURL(blob)
                element.type = 'text/javascript'
                this.domQuery.add(()=>document.getElementsByTagName('head')[0].appendChild(element))
            }
            if(styles!==''){
                let blob = new Blob([styles],{type:'text/css'})
                let element = document.createElement('link')
                element.href = URL.createObjectURL(blob)
                element.rel = 'stylesheet'
                this.domQuery.add(()=>document.getElementsByTagName('head')[0].appendChild(element))
            }
            if(html!==''){
                this.domQuery.add(()=>{
                    document.getElementsByTagName('body')[0].innerHTML += html
                })
            }
        },
        domQuery: {
            loaded: false,
            init(){
                if(document.readyState!=='loading') return this.loaded=true
                document.addEventListener('DOMContentLoaded',()=>{
                    this._handlers.forEach(f=>f())
                    this.loaded = true
                })
            },
            _handlers: [],
            add(handler){
                if(typeof handler !== 'function') throw 'Handler must be a function'
                if(this.loaded) handler()
                return this._handlers.push(handler), this
            },

        },
        isExists: name => storage._storage.indexes.indexOf(name) !== -1,
        repairIndexes(action = 'delete'){
            if(!this._checkTypes([action],['string'])) throw `Invalid input variables`
            let state = this._checkIndexes()
            this._storage.forEach((e,i)=>{
                if(state[i]) return
                switch(action){
                    case 'create':
                        localStorage.setItem(this.STORAGE_PREFIX+e[0],'')
                        break;
                    case 'delete':
                    default:
                        this._storage.indexes.splice(e[1],1)
                }
            })
            if(this._checkIndexes().length===this._storage.indexes.length) return this._saveConfig(),true
            else throw `Unable to recovery, changes ain't saved`
        },
        _saveConfig(){localStorage.setItem('storageConfig',JSON.stringify(this._storage))},
        _checkTypes(variables, types){
            if(typeof variables !== 'object' || typeof types !== 'object' || variables.length !== types.length) throw `Invalid construction`
            return variables.filter((o,i)=>{if(typeof o === types[i])return o}).length === variables.length
        },
        _init(){
            let storageConfig = localStorage.getItem('storageConfig')
            if(storageConfig===null){
                storageConfig=JSON.stringify({version:1,indexes:[]})
                localStorage.setItem('storageConfig',storageConfig)
            }
            this.domQuery.init()
            this._storage = JSON.parse(storageConfig)
        },
        _checkIndexes(){
            return this._storage.indexes.map(index => localStorage.getItem(this.STORAGE_PREFIX+index)!==null)
        },
        _storage: undefined
    }
    storage._init()
})()