function templateParse(e, obj){
	var regexp = /<\w*>/ig;
	li = document.createElement('li');
	li.appendChild(document.createTextNode(" - element: [ "));
	li.appendChild(document.createTextNode(e));
	li.appendChild(document.createTextNode(" ]"));
	$('section.p-console ul.output').append( li );
	console.log('- e: '+e);

	if ( Array.isArray(e) ){
		return templateParse( rand(e), obj );
	}
	else{
		if( /<\w*>/i.test(e) ){
			var result = '';
			var last_pos = 0;
			while ( foo = regexp.exec(e)) {
				result += e.substring(last_pos,foo.index);
				
				var ind = foo[0].replace(/[<>]*/g,'');
				result += templateParse( obj[ind], obj );
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
		console.log(key);
		var val = tmpl_pack[i]['val'];
		console.log(val);
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
}

$(function(){
	var _console = $('section.p-console');
	if(_console){
		$('section.p-console input').on('keypress', function(event){
			console.log(event);
			if(event.keyCode == 13){
				var msg = $('section.p-console input').val();
				$('section.p-console ul.output').append( "<hr>" );
				var output = templateParse(msg,tmpl);
				$('section.p-console ul.output').append( "<li>"+output+"</li>" );
				$('section.p-console ul.output').append( "<hr>" );
			}
		});
	}
});