function templateParse(e, obj){
	var regexp = /<\w*>/ig;
	li = document.createElement('li');
	li.appendChild(document.createTextNode(' - element:  '));
	li.appendChild(document.createTextNode(e));
	$('section.p-console ul.output').append( li );
	console.log('- e: '+e);

	if ( Array.isArray(e) ){
		return templateParse( rand(e), obj);
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
				console.log('[ result ]: '+result);
			}
			result += e.substring(last_pos,e.length);
			return result;
		}else{
			return e;
		}
	}
}
function libraryKeyParse(e, lib){
	var regexp = /\[\w*\]/ig;
	li = document.createElement('li');
	li.appendChild(document.createTextNode(' - element:  '));
	li.appendChild(document.createTextNode(e));
	$('section.p-console ul.output').append( li );
	console.log('- e: '+e);

	if ( Array.isArray(e) ){
		return templateParse( rand(e), lib);
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
function rand(items){
    return items[~~(Math.random() * items.length)];
}
function parseTmplObj(json){
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
	for(var i=0; i<tmpl_pack.length; i++){
		var key = tmpl_pack[i]['keyword'];
		var val = tmpl_pack[i]['val'];
		// console.log(key);
		// console.log(val);
		tmpl[key].push(val);
	}
	return tmpl;
}
function parseLibObj(json){
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
	for(var i=0; i<lib_pack.length; i++){
		var key = lib_pack[i]['key'];
		var val_arr = lib_pack[i]['values'];
		console.log(key);
		console.log(val_arr);
		for(var j=0; j<val_arr.length; j++){
			lib[key].push(val_arr[j].value);
		}
	}
	return lib;
}

$(function(){
	var _console = $('section.p-console');
	if(_console){
		$('section.p-console input').on('keypress', function(event){
			console.log(event);
			if(event.keyCode == 13){
				var msg = $('section.p-console input').val();
				$('section.p-console ul.output').append( "<hr>" );
				var output = libraryKeyParse(templateParse(msg,tmpl),lib);
				$('section.p-console ul.output').append( "<li>= result: "+output+"</li>" );
				$('section.p-console ul.output').append( "<hr>" );
			}
		});
	}
});