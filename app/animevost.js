(!function(){
    window.animevost = function(){}
    window.animevost.prototype = {
        POOL: 'https://api.animevost.org',
        _request(action,data,post=false){
            let xhr = new XMLHttpRequest()
            return new Promise((r,e)=>{
                xhr.onload = () => {
                    try {
                        r(JSON.parse(xhr.responseText))
                    } catch (err) {
                        e(err)
                    }
                }
                xhr.onerror = () => {
                    e(xhr.error)
                }
                xhr.open(post?'POST':'GET',this.POOL+action+(!post?'?'+this._buildQuery(data):''))
                xhr.send(post?data:null)
            })
        },
        _buildQuery(query){
            if(typeof query !== 'object') return query
            return Object.keys(query).map(k=>k+'='+query[k]).join('&')
        }
    }
}())

