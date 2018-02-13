////////////////////////////////////////////////////////
//////////////////TMPL Tree////////////////////////////
//////////////////////////////////////////////////////
let Tree = class{

    constructor(startkey, keys, lib){
        // if(startkey) this.start = startkey;
        // if(keys) this.keys = keys;
        if(lib) this.lib = lib;
        this._mappedKeyId = [];
        
    }
    // setStart(string){
    //     this.startkey = string;
    // }
    // setKeys(keys){
    //     this.keys = keys;
    // }
    // setLib(lib){
    //     this.lib = lib;
    // }
    // async createProcess(projectID, objects, time){

    // }
    // ["test".toUpperCase()]() {
    //     alert("PASSED!");
    // }

    static rand(items){
        return items[~~(Math.random() * items.length)];
    }

    static parseTmplObj(json){
        var tmpl_arr= json.map((item)=>{
            var obj = {};
            obj[item['keyword']] = [];
            return obj;
        });
        var tmpl = {};
        Array.prototype.forEach.call(tmpl_arr,function(elem) {
           var keys = Object.keys(elem);
           tmpl[keys[0]] = elem[keys[0]];
        });
        for(var i=0; i<json.length; i++){
            var key = json[i]['keyword'];
            var val = json[i]['val'];
            console.log(key);
            console.log(val);
            tmpl[key].push(val);
        }
        return tmpl;
    }
    static parseLibObj(json){
        var lib_arr= json.map((item)=>{
            var obj = {};
            obj[item['key']] = [];
            return obj;
        });
        var lib = {};
        Array.prototype.forEach.call(lib_arr,function(elem) {
           var keys = Object.keys(elem);
           lib[keys[0]] = elem[keys[0]];
        });
        for(var i=0; i<json.length; i++){
            var key = json[i]['key'];
            var val_arr = json[i]['values'];
            console.log(key);
            console.log(val_arr);
            for(var j=0; j<val_arr.length; j++){
                lib[key].push(val_arr[j].value);
            }
        }
        return lib;
    }

    static templateParse(e, obj){
        var regexp = /<\w*>/ig;
        console.log('- e: '+e);
        if ( Array.isArray(e) ){
            return templateParse( this.rand(e), obj);
        }
        else{
            if( /<\w*>/i.test(e) ){
                var result = '';
                var last_pos = 0;
                while ( foo = regexp.exec(e)) {
                    result += e.substring(last_pos,foo.index);
                    
                    var ind = foo[0].replace(/[<>]*/g,'');
                    result += templateParse( obj[ind], obj);
                    last_pos = regexp.lastIndex;
                    // console.log('[ result ]: '+result);
                }
                result += e.substring(last_pos,e.length);
                return result;
            }else{
                return e;
            }
        }
    }
    static libraryKeyParse(e, lib){
        var regexp = /\[\w*\]/ig;
        console.log('- e: '+e);
        if ( Array.isArray(e) ){
            return templateParse( this.rand(e), lib);
        }
        else{
            if( /\[\w*\]/i.test(e) ){
                var result = '';
                var last_pos = 0;
                while ( foo = regexp.exec(e)) {
                    result += e.substring(last_pos,foo.index);
                    
                    var ind = foo[0].replace(/[\[\]]*/g,'');
                    result += templateParse( lib[ind], lib );
                    last_pos = regexp.lastIndex;
                    console.log('[ result ]: '+result);
                }
                result += e.substring(last_pos,e.length);
                return result;
            }else{
                return e;
            }
        }
    }
}





module.exports = Tree;

// module.exports.thumbManager = thumbManager;