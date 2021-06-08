window.structure = {
    dev_mode: 'boolean',
    short_name: 'string',
    name: 'string',
    logo: 'string',
    icon: ['string','string'],
    application: {
        name: 'string',
        manifest: 'string'
    },
    load_type: 'string',
    update: {
        release: 'number',
        type: 'string',
        version: 'string',
        description: 'string'
    },
    update_policy: {
        auto: 'boolean'
    },
    sources: [{
        url: 'string',
        type: 'string'
    }]
}
const tools = {
    _types: {
        boolean: 'checkbox',
        string: 'text',
        number: 'number'
    },
    typeAssoc(type){
        return (type=this._types[type])===undefined?this._types.string:type
    }
}
const blocks = {
    item(name,type,value){
        let id=`item-${(new Date()).getTime()}`,el=tools.typeAssoc(type)
        return `<tr class='manifest-item'><th><label for="${id}" class="title">${name}</label></th><td class="${name}"><input class="${id}" type="${el}" name="${name}" value="${value}" ${el==='checkbox'&&value?'checked':''}></td></tr>`
    },
    blockItems(data){
        let result=[]
        return Object.keys(data).forEach(k=>result.push(this.item(k,data[k]))),result.join('')
    },
    block(name,content){
        return `<tr><th><span class="title">${name}</span></th><td id="${name}" class="${name}">${content}</td></tr>`
    },
    log(text,level){return`<div class='log-row ${level}'>${text}</div>`}
}
const ui = {
    state: undefined,
    build(manifest){
        this.log.log('Building structure...')
        $(`#manifest-structure`).html('')
        this._build(manifest)
    },
    _build(data,level=[]){
        Object.keys(data).forEach(k=>{
            let sel = $(`#manifest-structure ${level.length>0?'#'+level.join('_'):''}`)
            if(typeof data[k]==='object'){
                sel.append(blocks.block([...level,k].join('_'),''))
                return this._build(data[k],[...level,k])
            }
            sel.append(blocks.item(k,typeof data[k],data[k]))
        })
    },
    bind(){
        $('#manifest-import').submit(e=>{
            worker.loadManifest($('#manifest-import input').val())
            e.preventDefault()
        })
    },
    log:{
        log(text,level){
            $('#log').prepend(blocks.log(text,level))
        },
        error(t){this.log(t,'error')},
        warn(t){this.log(t,'warn')}
    }
}
const worker = {
    init(){},
    loadManifest(url){
        $.ajax({
            url: url,
            success:d=>{
                let m,r=false
                try{m=typeof d==='object'?d:JSON.parse(d)}
                catch(e){
                    ui.log.error('Unable to parse manifest, check console for more information')
                    console.groupCollapsed('Manifest parse error')
                    console.error(e)
                    console.groupEnd()
                }
                try{r=this.checkManifest(m)}
                catch(e){
                    ui.log.error('Invalid structure of manifest, check console for more information')
                    console.groupCollapsed('Manifest verify error')
                    console.error(e)
                    console.groupEnd()
                }
                r&&ui.build(m)
            },
            error(e){
                ui.log.error('Unable to load manifest, check console for more information')
                console.groupCollapsed('Manifest load error')
                console.error(e)
                console.groupEnd()
            }
        })
    },
    checkManifest(manifest){
        if(typeof manifest !== 'object')throw 'Invalid type of manifest'
        this._levelCheck(manifest)
        let log=$('#log'),text=`Manifest check: ${this._check.errors.length} errors, ${this._check.warns.length} warns`
        console.groupCollapsed(text)
        this._check.errors.length>0&&this._check.errors.forEach(t=>(console.error(t),log.prepend(blocks.log(t,'error'))))
        this._check.warns.length>0&&this._check.warns.forEach(t=>(console.warn(t),log.prepend(blocks.log(t,'warn'))))
        console.groupEnd()
        ui.log.log(text)
        this._check={errors:[],warns:[]}
        return true
    },
    _check:{errors:[],warns:[]},
    _levelCheck(data,level){
        let structure=(level===undefined?window.structure:level.reduce((a,b)=>a[b],window.structure))
        Object.keys(data).forEach(k=>{
            let address = `${level===undefined?'':level.join('.')+'.'}${k}`
            if(!(k in structure))return this._check.warns.push([`Unknown key "${address}" in manifest`,data,address])
            if(typeof structure[k]==='string'&&typeof data[k]!==structure[k])
                return this._check.errors.push(`Invalid type of key "${address}" - ${typeof data[k]}, should be ${structure[k]}`)
            if(Array.isArray(data[k])){
                if(typeof structure[k][0]==='object'&&!Array.isArray(structure[k][0]))
                    return Object.values(data[k]).forEach(v=>this._levelCheck(v,level!==undefined?[...level,k,0]:[k,0]))
                if(data[k].length!==structure[k].length)this._check.warns.push(`Invalid number of arguments in ${address} - ${data[k].length}, should be ${structure[k].length}`)
                Object.values((v,i)=>{
                    if(typeof v !== structure[k][i])this.errors.push(`Invalid type of key "${address}[${i}]" - ${typeof data[k][i]}, should be ${structure[k][i]}`)
                })
            }
            else if(typeof data[k]==='object'){
                this._levelCheck(data[k],level!==undefined?[...level,k]:[k])
            }
        })
    },
    buildManifest(){
        let manifest
        $('#manifest-structure>tr>td').each((i,e)=>{

        })
    },
    _buildManifest(level){
        $(`#manifest-structure>tr>td${level!==undefined?'>tr>td.'+level.join('>tr>td.'):''}`).each((i,e)=>{

        })
    },
    _download(content,name){
        let a=document.createElement('a'),l=URL.createObjectURL(new Blob([content]))
        a.href=l;a.setAttribute('download',name);a.click()
    }
}
$(()=>{ui.bind()})
