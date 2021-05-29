(function(){
    window.listStorage = function(name){
        (this._list=localStorage.getItem(name))===null?(console.warn(`"${name}" list doesn't exist`),this._list=[]):this._list=JSON.parse(this._list)
        this.name = name
    }
    window.listStorage.prototype = {
        push(data){
            let ind
            if(data.id!==undefined&&(ind=this._list.map(d=>d.id).indexOf(data.id))!==-1)return this.delete(ind).push(data)
            return this._list.push(data),this._save(),this
        },
        get(id){
            if(id===undefined)return this._list
            return this._list[id]
        },
        delete(id){
            if(id===undefined)return this._list=[],this._save(),this
            return delete this._list[id], this
        },
        modify(id,data){
            if(id===undefined||typeof data !== 'object')throw 'Invalid type of inputs'
            return this._list[id]=data,this._save(),this
        },
        _save(){
            return localStorage.setItem(this.name,JSON.stringify(Object.values(this._list))),this
        }
    }
})()