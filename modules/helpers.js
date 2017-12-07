/////////////////////////////////////////////
const fs 		= require('fs');
const MYSQL 	= require('./mysql').connection;
const MYSQL_SSH	= require('./mysql').sshcon;
const ASYNSQL 	= require('./mysql').asynccon;
// const sqlPool = require('./mysql').pool;
const PythonShell = require('python-shell');
PythonShell.defaultOptions = {
    scriptPath: './modules/py/',
  	mode: 'text',
    pythonPath: 'python3'
};
/////////////////////////////////////////////
async function myquery(query, params, callback){ // !
	try {
		const connection 	= await ASYNSQL(); // !
		let result = await connection.execute( query, params ); // !
		connection.end();

		if(callback)
			await  callback( result, params ); // !
		return result[0];

	} catch (e) {
		console.log(e);
		return 0;
	}
};
/////////////////////////////////////////////
module.exports.query = async function(query, params, callback){ // !
	try {
		const connection 	= await ASYNSQL(); // !
		let result = await connection.execute( query, params ); // !

		await  callback( result, params ); // !
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.sshQuery = async function(params, callback){
	try {
		const connection = await MYSQL_SSH(params); // !
		await connection.query(params['db[query]'], async (err, results, fields) => {
	        let result;
	        if (err) result = [err]; else
	        	result = [results,fields];

	        console.log(result);
	    	await callback( result );
	        await connection.close();
	    });
	} catch (e){
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.createProject = async (name, callback) => {
	try {
		var query = "INSERT INTO project (`name`) VALUES (?)";
		let result = await myquery(query, [ name ]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.searchProject = async (name, callback) => {
	try {
		console.log(name);

		// let query = "SELECT * FROM tag WHERE MATCH(name) AGAINST(?);";
		let query = "SELECT * FROM project WHERE name like ?";
		let result = await myquery(query, [ '%'+name+'%' ]);

		// console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.searchTag = async (name, callback) => {
	try {
		console.log(name);

		// let query = "SELECT * FROM tag WHERE MATCH(name) AGAINST(?);";
		let query = "SELECT * FROM tag WHERE name like ?";
		let result = await myquery(query, [ '%'+name+'%' ]);

		// console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.searchTmpl = async (name, callback) => {
	try {
		console.log(name);

		// let query = "SELECT * FROM tag WHERE MATCH(name) AGAINST(?);";
		let query = "SELECT * FROM template WHERE name like ?";
		let result = await myquery(query, [ '%'+name+'%' ]);

		// console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.createTag = async (name, callback) => {
	try {
		console.log(name);
		let query = "INSERT INTO tag(`name`) VALUES(?)";
		let result = await myquery(query, [ name ]);

		// console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.createTmpl = async (name, callback) => {
	try {
		console.log(name);
		let query = "INSERT INTO template(`name`) VALUES(?)";
		let result = await myquery(query, [ name ]);

		// console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.setProjectTags = async (tagID,projID,positive, callback) => {
	try {
		console.log(name);
		var query = "INSERT INTO relationTagProject (`tagID`, `projectID`, `positive`) VALUES (?, ?, ?);";
		let result = await myquery(query, [ name ]);

		// console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.saveProjectChanges = async (id, name, info, tags, tmpls, db, callback) => {
	try {
		console.log({name, info, tags, tmpls, db, callback});
		if(!name )
			return
		let query;
		///////////////////////////////////////////
				console.log("< base_save >");
				query = "UPDATE project "
					+	"SET name=?, description=? "
					+	"WHERE id=?;";
				let base_save = await myquery(query, [ name, info, id ]);
				console.log(base_save);
	///////////////////////////////////////////
	console.log("< project_tags >");
	query = "select r.id, res.id as `tagID`, r.positive from relationTagProject r left join (select id, name from tag) as res on res.id = r.tagID where r.projectID = ? order by res.id";
	let p_t = await myquery(query, [ id ]);
	console.log(p_t);

	var p_t_a = [],
		p_t_s = [];

	for(var i=0; i<p_t.length; i++){
		if(p_t[i].positive == 1)
			await p_t_a.push(p_t[i].tagID);
		else 
			await p_t_s.push(p_t[i].tagID);
	}
	console.log("< p_t_a >");
	console.log(p_t_a);
	console.log("< p_t_s >");
	console.log(p_t_s);
	///////////////////////////////////////////
		var new_p_t_a = [];
		var lost_p_t_a = [];

		for(var i=0;i<tags.assoc.length; i++){
		    if( p_t_a.indexOf(tags.assoc[i]) < 0 )
		        await new_p_t_a.push(tags.assoc[i]);
		}
		for(var i=0;i<p_t_a.length; i++){
		    if( tags.assoc.indexOf(p_t_a[i]) < 0 )
	        	await lost_p_t_a.push(p_t_a[i]);
		}
		console.log("< new_p_t_a >");
		console.log(new_p_t_a);
		console.log("< lost_p_t_a >");
		console.log(lost_p_t_a);
		///////////////////////////////////////////
			var new_p_t_s = [];
			var lost_p_t_s = [];

			for(var i=0;i<tags.stop.length; i++){
			    if( p_t_s.indexOf(tags.stop[i]) < 0 )
			        await new_p_t_s.push(tags.stop[i]);
			}
			for(var i=0;i<p_t_s.length; i++){
			    if( tags.stop.indexOf(p_t_s[i]) < 0 )
		        	await lost_p_t_s.push(p_t_s[i]);
			}
			console.log("< new_p_t_s >");
			console.log(new_p_t_s);
			console.log("< lost_p_t_s >");
			console.log(lost_p_t_s);


			console.log("< tag_res >");
			query = 'insert into '
				+	'relationTagProject(tagID, projectID, positive) '
				+	'values(?,?,?)';
			// for(var a_t in new_p_t_a){
			// 	console.log(a_t);
			// 	positive = 1;
			// 	let tag_res = await myquery(query, [ a_t, id, positive ]);
			// 	console.log(tag_res);
			// }
			for(var i=0; i<new_p_t_a.length;i++){
				console.log(new_p_t_a[i]);
				positive = 1;
				let tag_res = await myquery(query, [ new_p_t_a[i], id, positive ]);
				console.log(tag_res);
			}
			for(var i=0; i<new_p_t_s.length;i++){
				console.log(new_p_t_s[i]);
				positive = 0;
				let tag_res = await myquery(query, [ new_p_t_s[i], id, positive ]);
				console.log(tag_res);
			}
			query = 'DELETE FROM relationTagProject '
				+	'WHERE tagID = ? '
				+	'and projectID = ? '
				+	'and positive = ? ';
			for(var i=0; i<lost_p_t_a.length;i++){
				console.log(lost_p_t_a[i]);
				positive = 1;
				let tag_res = await myquery(query, [ lost_p_t_a[i], id, positive ]);
				console.log(tag_res);
			}
			for(var i=0; i<lost_p_t_s.length;i++){
				console.log(lost_p_t_s[i]);
				positive = 0;
				let tag_res = await myquery(query, [ lost_p_t_s[i], id, positive ]);
				console.log(tag_res);
			}
		///////////////////////////////////////////
		console.log('< p_tmpls_res >');
		// query = "select r.id, res.id as `tmplID` "
		// 	+	"from relationTmplProject r "
		// 	+	"left join "
		// 	+	"(select id, name from template) "
		// 	+	"as res on res.id = r.tmplID "
		// 	+	"where r.projectID = ? "
		// 	+	"order by res.id";
		query = "select tmplID "
			+	"from relationTmplProject "
			+	"where projectID = ? "
		let p_tmpls_res = await myquery(query, [ id ]);
		console.log(p_tmpls_res);

		var p_tmpls = [];
		for(var i=0; i<p_tmpls_res.length;i++){
			await p_tmpls.push(p_tmpls_res[i].tmplID);
		}

		var new_tmpls = [];
		var lost_tmpls = [];

		if(!tmpls)
			tmpls = [];

		for(var i=0;i<tmpls.length; i++){
		    if( p_tmpls.indexOf(tmpls[i]) < 0 )
		        await new_tmpls.push(tmpls[i])
		}
		for(var i=0;i<p_tmpls.length; i++){
		    if( tmpls.indexOf(p_t_a[i]) < 0 )
	        	await lost_tmpls.push(p_tmpls[i])
		}
		console.log('< new_tmpls >');
		console.log(new_tmpls);
		console.log('< lost_tmpls >');
		console.log(lost_tmpls);

		console.log('< tmpl_res >');
		query = 'insert into '
			+	'relationTmplProject(tmplID, projectID) '
			+	'values(?,?)';
		for(var i=0; i<new_tmpls.length; i++){
			let tmpl_res = await myquery(query, [ new_tmpls[i], id ]);
			console.log(tmpl_res);
		}
		query = 'DELETE FROM relationTmplProject '
			+	'WHERE tmplID = ? '
			+	'and projectID = ? ';
		for(var i=0; i<lost_tmpls.length; i++){
			let tmpl_res = await myquery(query, [ lost_tmpls[i], id ]);
			console.log(tmpl_res);
		}
		// console.log(" < tmpl_res > ");
		// query = "UPDATE relationTagProject "
		// 		  + "SET name=?, info=? "
		// 		  + "WHERE id=?;";
		// let result2 = await myquery(query, [ name, info, tagID ]);
		// console.log(result2);

		if (callback)
			await callback();
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function segregateProjectTags(projectID, income_tags, callback){
	try {


		if(callback)
			await callback();
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.saveTmplChanges = async (tagID, name, callback) => {
	try {
		let query = "UPDATE template SET name=? WHERE id=?;";
		let result = await myquery(query, [ name, tagID ]);
		if(callback)
			await callback();
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.saveTagChanges = async (tagID, name, newsyns, callback) => {
	try {
		await tagNameCheck(tagID, name, async (res)=>{
			if(!res)
				await tagNameUpdate(tagID, name);
		});
		await selectTagSyns(tagID, async (arr)=>{
			var newTag = [];
			var lostTag = [];
			for(var i=0;i<newsyns.length; i++){
			    if( arr.indexOf(newsyns[i]) < 0 )
			        await newTag.push(newsyns[i])
			}
			for(var i=0;i<arr.length; i++){
			    if( newsyns.indexOf(arr[i]) < 0 )
			    	if(arr[i] != tagID)
			        	await lostTag.push(arr[i])
			}
			var flag;
			await selectTagFlag(tagID, async (_flag)=>{
				console.log("flag:"+_flag.flag);
				flag = _flag.flag
				if(flag == null)
					await createTagFlag(tagID, async (newflag)=>{
						flag = newflag.flag;
					});
				await saveTagSyns({new:newTag,lost:lostTag},flag);
			});
		});

		if(callback)
			await callback();
		// return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function tagNameCheck(tagID,name,callback){
	try {
		let query = 'SELECT name FROM replecon.tag WHERE id = ?';
		let result = await myquery( query, [tagID] );
		
		console.log(result);
		var resp = result.name == name;
		if(callback)
			await callback(resp);
		return resp;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function tagNameUpdate(tagID,name,callback){
	try {
		console.log(" - tagNameUpdate");
		let query = 'UPDATE replecon.tag SET name = ? WHERE id = ?';
		let result = await myquery( query, [name,tagID] );
		console.log(result);

		if(callback)
			await callback(result[0]);
		return result[0];
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function saveTagSyns(obj, flag, callback){
	try {
		var newTag = obj.new;
		var lostTag = obj.lost;
		console.log(" - saveTagSyns");
		console.log(flag);
		console.log(newTag);
		console.log(lostTag);

		for(var i=0; i<newTag.length; i++){
			let query = 'UPDATE replecon.tag SET flag = ? WHERE id = ?';
			let result = await myquery( query, [flag, newTag[i]] );
			console.log(result);
		}
		for(var i=0; i<lostTag.length; i++){
			let query = 'UPDATE replecon.tag SET flag = null WHERE id = ?';
			let result = await myquery( query, [lostTag[i]] );
			console.log(result);
		}

		if(callback)
			await callback();
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectTagSyns(tagID,callback){
	try {
		let query = ""	
			+ " select r.id "
			+ " from replecon.tag r "
			+ " where r.flag = "
			+ " ( "
			+ " 	select flag "
			+ " 	from replecon.tag "
			+ " 	where id = ? "
			+ " ) "
			+ " GROUP BY r.id ";
		let result = await myquery( query, [tagID] );

		var arr = [];
		for(var i=0; i<result.length; i++){
			arr.push(result[i].id);		
		}
		console.log(arr);

		if(callback)
			await callback(arr);
		return arr;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.selectFlagTemplates = async (tagID, callback) => {
	try {
		var query = ""
			+ " SELECT *"
			+ " FROM replecon.tagTemplates"
			+ " WHERE flag ="
			+ " ("
			+ " SELECT flag"
			+ " FROM replecon.tag"
			+ " WHERE id = ?"
			+ " )"
		let result = await myquery(query, [ tagID ]);

		console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.selectTmplTemplates = async (tmplID, callback) => {
	try {
		console.log("< selectTmplTemplates >");
		console.log(tmplID);
		let result = await selectTmplKey(tmplID);
		for(var i in result){
			result[i].tags = {assocs:[], stops:[]};
			let conditions = await selectTmplCondition(result[i].id);
			for(var j in conditions){
				let tag = {id:conditions[j].tagID, name:conditions[j].name}
				if( conditions[j].positive == 1 ){
					result[i].tags.assocs.push(tag);
				}else{
					result[i].tags.stops.push(tag);
				}
			}
		}

		console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectTmplKey(tmplID){
	try {
		console.log("< selectTmplKey >");
		console.log(tmplID);
		var query = "select * from replecon.templateKey where tmplID = ?";
		let result = await myquery( query, [tmplID] );

		console.log(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectTmplCondition(tmplKeyID){
	try {
		console.log("< selectTmplCondition >");
		console.log(tmplKeyID);
		var query = ""
		+ " select * from replecon.templateCondition tc "
		+ " left join"
		+ " (select id, name from replecon.tag)as res "
		+ " on res.id = tc.tagID"
		+ " where tc.tmplKeyID = ?"
		+ " order by tc.id";
		let result = await myquery( query, [tmplKeyID] );

		console.log(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.createTmplTemplate = async (tmplID, keyword, val, tags, callback) => {
	try {
		console.log('< createTmplTemplate >');
		console.log({tmplID, keyword, val, tags});

		var tmplKeyID = await insertTmplKey(tmplID, keyword, val)
		var tagID,
			positive;
		if(tags.assocs)
			for(var i in tags.assocs){
				tagID = tags.assocs[i];
				positive = 1;
				await insertTmplCondition(tagID, tmplKeyID, positive);
			}
		if(tags.stops)
			for(var i in tags.stops){
				tagID = tags.stops[i];
				positive = 0;
				await insertTmplCondition(tagID, tmplKeyID, positive);
			}
		if(callback)
			await callback('tmpl inserted');
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function insertTmplKey(tmplID, key, val){
	try {
		var query = "INSERT INTO replecon.templateKey (keyword, val, tmplID) values (? ,?, ?)";
		let result = await myquery( query, [key, val, tmplID] );

		console.log(result);
		return result.insertId;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function insertTmplCondition(tagID, tmplKeyID, positive){
	try {
		console.log('< insertTmplCondition >');
		console.log({tagID, tmplKeyID, positive});
		var query = "INSERT INTO replecon.templateCondition (tagID, tmplKeyID, positive) values (? ,?, ?)";
		let result = await myquery( query, [tagID, tmplKeyID, positive] );

		console.log(result);
		return result.insertId;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.createTagTemplate = async (tagID,keyword,val, callback) => {
	try {
		var query = "INSERT INTO replecon.tagTemplates (flag, keyword, val) values (? ,?, ?)";
		var flag = await selectTagFlag(tagID).flag;
		console.log(flag);
		if(!flag){				
			await createTagFlag(tagID);
			flag = tagID;
		}
		let result = await myquery(query, [ flag, keyword, val ]);
		console.log(result);
		if(callback)
			await callback(result[0]);
		return result[0];

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.deleteTmpl = async (tmplID, callback) => {
	try {
		var query = "DELETE FROM template WHERE id = ?";
		var query2 = "DELETE FROM relationTmplProject WHERE tmplID = ?";

		let result = await myquery(query, [ tmplID ]);
		let result2 = await myquery(query2, [ tmplID ]);
		console.log(result);

		if(callback)
			await callback(result);
	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.deleteTmplTemplate = async (tmplID, callback) => {
	try {
		let result = await myquery(
			"DELETE FROM templateKey WHERE tmplKeyID = ?"
			, [ tmplID ]);
		console.log(result);

		let result2 = await myquery(
			"DELETE FROM templateKey WHERE id = ?"
			, [ tmplID ]);
		console.log(result2);

		if(callback)
			await callback(result[0]);
		return result[0];

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.deleteTagTemplate = async (tagID,tmplID, callback) => {
	try {
		var query = "DELETE FROM tagTemplates WHERE id = ?";
		var flag = await selectTagFlag(tagID).flag;
		console.log(flag);
		// if(!flag){				
		// 	await createTagFlag(tagID);
		// 	flag = tagID;
		// }
		let result = await myquery(query, [ tmplID ]);
		console.log(result);
		if(callback)
			await callback(result[0]);
		return result[0];

	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectTagFlag(tagID, callback){
	try {
		let query = 'SELECT flag FROM replecon.tag WHERE id = ?';
		let result = await myquery( query, [tagID] );

		console.log(result);
		if(callback)
			await callback(result[0]);
		return result[0];
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function createTagFlag(tagID, callback){
	try {
		let query = 'UPDATE replecon.tag SET flag = id WHERE id = ?';
		let result = await myquery( query, [tagID] );

		console.log(result);
		if(callback)
			await callback(result[0]);
		return result[0];
	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.selectProject = async (id, callback) => {
	try {
		let query = "SELECT * FROM project WHERE id = ?";
		let result = await myquery(query, [id]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.selectTag = async (id, callback) => {
	try {
		let query = "SELECT * FROM tag WHERE id = ?";
		let result = await myquery(query, [id]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.selectProjectTags = async (id, callback) => {
	try {		
		let query = "SELECT t.name, r.tagID, r.positive FROM relationTagProject r, tag t WHERE projectID = ? AND t.id = r.tagID";
		let result = await myquery(query, [id]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.selectProjectTmpls = async (projID, callback) => {
	try {		
		let query = "SELECT res.id, res.name FROM relationTmplProject left join (select id, name from template)as res on res.id = tmplID WHERE projectID = ?";
		let result = await myquery(query, [projID]);
		console.log(result);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.selectTagSyns = async (id, callback) => {
	try {	
		let query = ""	
			+ " select r.id, r.name "
			+ " from replecon.tag r "
			+ " where r.flag = "
			+ " ( "
			+ " 	select flag "
			+ " 	from replecon.tag "
			+ " 	where id = ? "
			+ " ) "
			+ " GROUP BY r.id ";

		// let query = ""
		// 	+ " select r.tagID as `id`, res2.name "
		// 	+ " from replecon.relationTagSyn r "
		// 	+ " left join "
		// 	+ " ( "
		// 	+	" select * "
		// 	+	" from  replecon.tag "
		// 	+ " ) as res2 on r.tagID = res2.id "
		// 	+ " where r.flag = "
		// 	+ " ( "
		// 	+	" select flag "
		// 	+	" from replecon.relationTagSyn "
		// 	+	" where tagID = ? "
		// 	+ " ) " 
		// 	+ " GROUP BY tagID ";
		// let query = " select tagID as `id` "
		// 	+ " from replecon.relationTagSyn "
		// 	+ " where flag = "
		// 	// + " where flagID = "
		// 	+ " ( "
		// 	+ " select flag "
		// 	// + " select flagID "
		// 	+ " from replecon.relationTagSyn "
		// 	+ " where tagID = ? "
		// 	+ " ) ;"
		let result = await myquery(query, [id]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.selectOriginalAllSize = async (callback) => {
	try {		
		let query = "SELECT count(*) FROM original";
		let size = await myquery(query, []);
		let result = size[0]['count(*)'];

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}/////////////////////////////////////////////

module.exports.selectProjectSize = async (id, callback) => {
	try {		
		let query = "SELECT count(*) FROM relationProjectObject WHERE projectID = ?";
		let size = await myquery(query, [id]);
		let result = size[0]['count(*)'];

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.selectProjects = async (callback) => {
	try {
		let query = "SELECT * FROM project";
		let result = await myquery(query, []);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////

module.exports.selectProjectsRelation = async (callback) => {
	try {
		let result = [];
		let query = "SELECT * FROM project";
		let projects = await myquery(query, []);
		for(var i=0; i<projects.length; i++){
			let project = {};
			project.id = projects[i].id;
			project.name = projects[i].name;
			project.tags = {assoc:[], stop:[]};

			let query2 	= "SELECT count(*) FROM relationProjectObject WHERE projectID = ?";
			let size = await myquery(query2, [ projects[i].id ] );
			project.size = size[0]['count(*)'];

			let query3 	= "SELECT t.name, r.tagID, r.positive FROM replecon.relationTagProject r, replecon.tag t WHERE projectID = ? AND t.id = r.tagID";
			let tags = await myquery(query3, [ projects[i].id ] );
			for(var j=0; j<tags.length; j++){
				if( tags[j].positive == 0 ){
					await project.tags.stop.push(tags[j].name);
				}else{
					await project.tags.assoc.push(tags[j].name);
				}
			}
			await result.push(project);
		}

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.selectTags = async (callback) => {
	try {
		let query = "SELECT * FROM tag";
		let result = await myquery(query, []);

		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.selectTmpls = async (callback) => {
	try {
		let query = "SELECT * FROM template";
		let result = await myquery(query, []);

		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.selectTmpl = async (tmplID, callback) => {
	try {
		let query = "SELECT * FROM template WHERE id = ?";
		let result = await myquery(query, [tmplID]);

		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.selectNullTags = async (callback) => {
	try {
		// let query = "SELECT * FROM tag WHERE flag is null";

		let query = ""
			+ " select r.id, r.name, r.flag, res.syns"
			+ " from tag r"
			+ " left join"
			+ " ("
			+ " 	SELECT flag, count(*) as syns"
			+ " 	FROM tag r2"
			+ " 	group by flag"
			+ " ) as res on r.flag = res.flag "
			+ " where res.syns < 2 OR r.flag is null "
			+ " order by id";
		let result = await myquery(query, []);

		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.selectTagsEx = async (callback) => {
	try {
		// let query = ""
		// 	+ " select r.id, r.name, r.flag, res.size"
		// 	+ " from tag r"
		// 	+ " left join"
		// 	+ " ("
		// 	+ " 	SELECT flag, count(*) as size"
		// 	+ " 	FROM tag r2"
		// 	+ " 	group by flag"
		// 	+ " ) as res on r.flag = res.flag "
		// 	+ " order by id";
		let query = ""
			+ " select r.id, r.name, r.flag, res.syns, res2.tmpls"
			+ " from replecon.tag r"
			+ " left join"
			+ " ("
			+ " 	SELECT flag, count(*) as syns"
			+ " 	FROM replecon.tag"
			+ " 	group by flag"
			+ " ) as res on r.flag = res.flag" 
			+ " left join"
			+ " ("
			+ " 	SELECT flag, count(*) as tmpls"
			+ " 	FROM replecon.tagTemplates"
			+ " 	group by flag"
			+ " ) as res2 on r.flag = res2.flag "
			+ " order by id";
		let result = await myquery(query, []);

		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
// module.exports.saveObject = async (data, callback)=>{
// 	console.log(' - objectCreate');

// 	let query = 'INSERT INTO object (`title`,`description`,`originID`) VALUES (?,?,?)';
// 	let result = await myquery(query, [ data.title, data.description, data.original_id] ); // !

// 	let query2 = 'INSERT INTO relationProjectObject (`projectID`, `objectID`) VALUES (?, ?);';
// 	await myquery(query2, [ data.project_id, result.insertId ] ); // !

// 	console.log(' = objectCreate result f()');
// 	console.log(result);
// 	await callback(result[0]);
// 	return result[0];
// }
/////////////////////////////////////////////
module.exports.selectRandomOriginal = async (projectID, callback) => {
	const connection 	= await ASYNSQL(); // !
	try {
		let positiveArr = [];
		let negetiveArr = [];
		await selectProjectTags(connection, projectID, async (result) => {
			console.log(result);
			for(var i=0; i < result.length; i++){
				if(result[i].positive == 0){
					await negetiveArr.push(result[i].tagID);
				}else{
					await positiveArr.push(result[i].tagID);
				}
			}
		});
		console.log(positiveArr);
		console.log(negetiveArr);

		let originalID = await findOriginal(connection, {positive:positiveArr, negetive:negetiveArr});
		await selectOriginal(connection, originalID, async (result) => {
			await selectOriginalTags(connection, originalID, async (tags) => {
				console.log(tags);
				console.log(result);
				result.tags = tags;

				var obj = JSON.parse(fs.readFileSync('./modules/template2.json', 'utf8'));
				result.description = await templateParse( obj['start'], obj );

				await callback(result);
			})
		});
	} catch (e) {
		console.log(e);
		return 0;
	}
};
async function selectOriginal(connection, originalID, callback){
	try {
		let query = 'SELECT * FROM original WHERE id = ?';
		let fields = await connection.execute( query, [originalID] ); // !
		let result = fields[0][0];

		console.log('/__T_H_E_P_L_A_C_E__');
		// console.log(result);
		// await spinText(result.title, async (title)=>{
		// 	console.log(title);
		// 	result.title = title;
		// 	await spinText(result.description, async (description)=>{
		// 		console.log(description);
		// 		result.description = description;
		// 		await callback(result);
		// 		return result;
		// 	});
		// });
		console.log('\\__T_H_E_P_L_A_C_E__');
		await callback(result);
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectProjectTags(connection, projectID, callback){
	try {
		let query = 'SELECT tagID, positive FROM relationTagProject WHERE projectID = ?';
		let fields = await connection.execute( query, [projectID] ); // !
		let results = fields[0];

		// console.log(results);
		await callback(results);
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectOriginalTags(connection, originalID, callback){
	try {
		let query = 'SELECT t.name, r.tagID FROM relationTagOriginal r, tag t  WHERE t.id = r.tagID AND r.originalID = ?';
		let fields = await connection.execute( query, [originalID] ); // !
		let results = fields[0];

		// console.log(results);
		await callback(results);
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function findOriginal(connection, tagIDs){
	try {
		let query = " SELECT originalID " +
		" FROM relationTagOriginal ";
		if(tagIDs.positive.length > 0){
			for(var j=0; j<tagIDs.positive.length; j++){
				if(j==0)
					query += " WHERE tagID = " + tagIDs.positive[j];
				else
					query += " OR tagID = " + tagIDs.positive[j];
			}
		}
		if(tagIDs.negetive.length > 0){
			query += " AND originalID not in "+
			" ( "+
			" SELECT originalID "+
			" FROM relationTagOriginal ";
			for(var j=0; j<tagIDs.negetive.length; j++){
				if(j==0)
					query += " WHERE tagID = " + tagIDs.negetive[j];
				else
					query += " OR tagID = " + tagIDs.negetive[j];
			}
			query += " ) ";
		}
		query += " ORDER BY RAND() LIMIT 1 ";
		console.log(query);

		let fields = await connection.execute( query ); // !
		let result = fields[0][0];

		console.log(result);
		console.log(result.originalID);
		return result.originalID;
		// await callback(results);
	} catch (e) {
		console.log(e);
		return -1;
	}
}
/////////////////////////////////////////////
async function spinText(text, callback){ // !
	try {
		var pyshell = await new PythonShell('spinner.py'); // !
		var result;
		console.log('<<'+text);
		await pyshell.send(text); // !
		
		console.log(0);
		await pyshell.on('message', function (msg) { // !
			console.log('> text: ' + msg);
			result = msg;
		});

		console.log(1);
		await pyshell.end(function (err) { // !
			if (err) throw err;
			console.log('> spinner done his do');
			callback(result);	
		});

		console.log(2);
		// if(callback)
		// 		callback(msg);
		// return msg;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.loadJson = async function(json){ // !
	const connection 	= await ASYNSQL(); // !

	for (var iter=0; iter<json.length; iter++) {
		let item = json[iter];
		try {
			let ids = await magic(connection,item); // !
			console.log(ids);
			await originalRelation(connection,ids); // !

		} catch (e) {
			console.log(e);
			return 0;
		}
	}
	console.log(' Json Loaded ! ');
};
async function tagInsert(connection, tag){ // !
	console.log(' - tagInsert');
	let query 	= "INSERT INTO tag (`name`) VALUES (?)";
	let result = await connection.execute(query, [tag] ); // !

	console.log(' = tagInsert result f()');
	console.log({result: result});
	return result[0];
}
async function tagSearch(connection, tag){ // !
	console.log(' - tagSearch');
	let query = 'SELECT * FROM replecon.tag WHERE `name` = ?';
	let [rows, fields] = await connection.execute(query, [tag] ); // !

	console.log(' = tagSearch result f()');
	console.log({rows: rows, fields: fields});
	return {rows: rows, fields: fields};
}
async function originalCreate(connection, item){ // !
	console.log(' - originalCreate');
	console.log(item);

	let query = 'INSERT INTO original (`title`,`link`,`video`,`description`) VALUES (?,?,?,?)';
	let result = await connection.execute(query, [ item.title, item.href, item.video, item.desc] ); // !

	console.log(' = originalCreate result f()');
	console.log(result);
	return result[0];
}
async function originalRelation(connection, ids){
	console.log(' - originalRelation');

	let query = 'INSERT INTO relationTagOriginal (`tagID`,`originalID`) VALUES (?,?)';
	await ids.tags.forEach( async (item, i , arr) => {
		let [row] = await connection.execute( query, [ ids.tags[i], ids.original] );
	console.log(' = originalRelation result f()');
	console.log(row);
	});
}
async function tagInit(connection, tag){
	console.log(' - tagInit');
	console.log(tag);

		// let id = -1;
		let result = await tagSearch(connection, tag); // !

		if(result.rows.length != 0){
			console.log('old tag');
			return result.rows[0].id;
		}else{
			console.log('new tag');
			var tmp = await tagInsert(connection, tag); // !
			console.log(tmp);
			return  tmp.insertId;
		}
}
async function tagsParse(connection, tags){
	console.log(' - tagsParse');
	console.log(tags);

	tags = arrayUpperCase(tags);
	tags = arrayUniq(tags);
	
	let tagIds = [];
	await Promise.all(tags.map( async (tag) => {  // !

		var id = await tagInit(connection,tag);

		console.log('tag id: '+id);

		if( !tagIds.includes(id) )
			await tagIds.push( id );
		
		console.log('tags id:');
		console.log(tagIds);
	}));
	return tagIds;
}
async function magic(connection, item){
	let tags 			= item.tags.split(/,/g);
	let ids 			= {};

	ids.tags = await tagsParse(connection, tags);

	original = await originalCreate(connection, item); // !
	console.log( 'original id: ' + original.insertId );
	ids.original = original.insertId;

	return ids;
}
function templateParse(e, obj){
	var regexp = /<\w*>/ig;

	console.log('- e:');
	console.log(e);
	console.log('-----');

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
			}
			return result;
		}else{
			return e;
		}
	}
}
function arrayUniq(a) {
   return Array.from(new Set(a));
}
function arrayUpperCase(a) {
	var tmp = [];
	for(var i=0; i<a.length; i++){
		tmp.push( a[i].toUpperCase() )
	}
	return tmp;
}
function rand(items){
    return items[~~(Math.random() * items.length)];
}
/////////////////////////////////////////////
// module.exports.sqlPush = (query, callback) => {
// 	var connection 		= new MYSQL();
// 	connection.query(query, (error, result) => {
// 		if (error) {
// 			console.error('query error: ' + err.stack);
// 			return;
// 		}
// 		console.log("Data pushed in 2 DB");
// 		callback();
// 	});
// 	connection.end();
// }
/////////////////////////////////////////////
// module.exports.sqlPull = (query, callback) => {
// 	var connection 		= new MYSQL();
// 	connection.query(query, (error, results, fields) => {
// 		if (error) {
// 			console.error('query error: ' + error.stack);
// 			return;
// 		}
// 		var response = JSON.stringify(results);
//         var json =  JSON.parse(response);
// 		console.log("Data pulled from DB");
// 		callback(json);
// 	});
// 	connection.end();
// }
/////////////////////////////////////////////
// module.exports.saveJson = function(filename, obj){
    // $file = 'form2.txt';

    // $postdata = file_get_contents("php://input");
    // $data = json_decode($postdata, true);


    // $data_insert = "Name: " . $data['firstname'] .
    //         ", Email: " . $data['emailaddress'] . 
    //         ", Description: " . $data['textareacontent'] . 
    //         ", Gender: " . $data['gender'] . 
    //         ", Is a member: " . $data['member'];


    // //print $data_insert;

    // file_put_contents($file, $data_insert, FILE_APPEND | LOCK_EX);
// };

// module.exports.sqlPush = (query, callback) => {
// 	var connection 	= new sqlConnection({});
// 	connection.connect(function(err) {
// 		if (err) {
// 			console.error('error connecting: ' + err.stack);
// 			return;
// 		}
// 	});
// 	var connection 		= new SQL();
// 	connection.query(query, (error, result) => {
// 		if (error) {
// 			console.error('query error: ' + err.stack);
// 			return;
// 		}
// 		console.log("Data pushed in 2 DB");
// 		callback();
// 	});
// 	connection.end();
// };

// module.exports.loadJson = function(json, callback){
// 	var pool 	= new sqlPool({});

// 	pool.getConnection(function(err, connection){
//         if (err) {
//           console.log({"code" : 100, "status" : "Error in connection database"});
//           return;
//         }

//         console.log('connected as id ' + connection.threadId);
//         var item = json[0]; 
// 		// json.forEach( (item, i, json) => {
// 			var tags = item.tags.split(',');
// 			// var tags = item.tags;
// 			// console.log(tags);

// 			var tag = tags[0];
// 			// tags.forEach( (tag, j, tags) => {

// 				var search_query = 'SELECT * FROM replecon.tag WHERE ?';
// 				var id = -1;
// 				connection.query(search_query,{name: tag}, (error, results, fields) => {
// 					if (error) {
// 						console.log( error ); 
// 						// return;
// 						return connection.release();
// 					}
// 					else {
// // ---------------------------------------------------------------
// 						if(results.length > 0){
// 							console.log('old');
// 							console.log(results[0].id); 
// 						}else{
// 							console.log('new');
// 							var query 	= "INSERT INTO tag SET ?";
// 							connection.query(query,{name: tag},(error, results, fields)=>{
// 								return connection.release();
// 								if (error) {
// 									console.log( error ); 
// 									return;
// 								}
// 								console.log(results[0].id); 
// 								console.log(results); 
// 							});
// 						}
// // ---------------------------------------------------------------
// 						// console.log(results);
// 						// console.log(results.length);
// 						// console.log(results[0]);
// 						// var row = results[0].user_id
// 					}
// 				});
// 				console.log(id);
// 			// });

// 			// break;

// 			var query 	= "INSERT INTO original SET ?";
// 			var table_data =  { title: item.title,
// 								link: item.href,
// 								video: item.video,
// 								description: item.desc};

// 			// console.log("[ "+table_data.title+" ]");

// 			// connection.query(query, table_data, (error, results, fields) => {
// 			// 	// pool.on('release', function (connection) {
// 			// 	// 	console.log('Connection %d released', connection.threadId);
// 			// 	// });
// 			// 	// connection.release();
// 			// 	// Handle error after the release.
// 			// 	if (error) 
// 			// 		console.log( error ); 
// 			// 	else 
// 			// 		console.log("[ "+table_data.title+" ]: "+results.insertId );
// 			// });
// 		// });
// 		pool.end();
// 		callback();
//     });

// };
/////////////////////////////////////////////
// module.exports.newQuery = async function(params, callback){ // !
// 	try {
// 		const mysqlssh = require('mysql-ssh');
// 		const fs = require('fs');
// 		const mysql = require('mysql2/promise');
// 		const connection = await mysql.createConnection({
// 			host     : params.host,
// 			user     : params.user,
// 			password : params.password,
// 			database : params.name
// 		    ,multipleStatements: true
// 		    ,waitForConnections : true
// 		    ,debug    :  false
// 		    ,wait_timeout : 28800
// 		});
// 		if(!params.arguments) params.arguments = [];
// 		let result = await connection.execute( params.query, params.arguments, (err, results, fields) => {
// 		    console.log(results); // results contains rows returned by server
// 		    console.log(fields); // fields contains extra meta data about results, if available
// 	  	}); // !
// 		console.log(result);
// 		console.log(" - DonE >");
// 		await connection.end();

// 		await  callback( result ); // !
// 		return result;
// 	} catch (e) {
// 		console.log(e);
// 		return 0;
// 	}
// }