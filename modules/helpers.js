/////////////////////////////////////////////
const fs 		= require('fs');
const async 	= require('async');
const PythonShell = require('python-shell');

const MYSQL 	= require('./mysql').connection;
const MYSQL_SSH	= require('./mysql').sshcon;
const ASYNSQL 	= require('./mysql').asynccon;
const CHILDCON 	= require('./mysql').childcon;
const POOLCON 	= require('./mysql').pool;
const scraperModule 	= require('./scraper');
const ffmpegModule 	= require('./ffmpeg');

const punctREGEX = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/g;

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

module.exports.selectProjectOriginalSize = async (projectID, callback) => {
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

		let originalIDarr = await findFilteredOriginal(connection, projectID,  {positive:positiveArr, negetive:negetiveArr});
		console.log(originalIDarr);

		if(callback)
			await callback(originalIDarr.length);
		// 	})
		// });
	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.createProjectOriginal = async (projectID, size, callback) => {
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

		let originalIDarr = await findFilteredOriginal(connection, projectID, {positive:positiveArr, negetive:negetiveArr});
		// let originalIDarr = await findFilteredOriginal(connection, {positive:positiveArr, negetive:negetiveArr});
		// query += " ORDER BY RAND() LIMIT 1 ";
		console.log(originalIDarr);

		if(size>originalIDarr.length)
			size = originalIDarr.length;

		console.log(" < logID > ");
		var logID = await createObjectLog(projectID);
		console.log(logID);

		for(var j=0; j<size; j++){
			var originalID = originalIDarr[j].originalID;

			await selectOriginal(connection, originalID, async (original) => {	
				console.log(original);

				let video_link = original.video;
				console.log(' < video_link >');
				console.log(video_link);

				let donor_link = original.link;
				console.log(' < donor_link >');
				console.log(donor_link);

				let originalTags = await selectOriginalTags(connection, originalID);
				console.log(' < originalTags >');
				console.log(originalTags);
				let synTags = [];
				for(var i=0; i<originalTags.length; i++){
					console.log(' < originalTags[i].tagID >');
					console.log(originalTags[i].tagID);
					let syns = await selectTagSyns(originalTags[i].tagID);
					
					if(syns.length > 0)
						for(var j=0; j<syns.length; j++){
							synTags.push(syns[j]);
						}
					else	
						synTags.push(originalTags[i].tagID);				
				}
				console.log(' < synTags >');
				console.log(synTags);
				let d_tmpl_pack = await selectProjectDescriptionTemplate(projectID,synTags);
				// console.log(' < tmpl_pack >');
				// console.log(tmpl_pack);
				let d_tmpl = await parseTmplObj(d_tmpl_pack);
				// console.log(' < tmpl >');
				// console.log(tmpl);

				let description = await templateParse( d_tmpl['talk'], d_tmpl );
				console.log(' < description >');
				console.log(description);	

					

				let t_tmpl_pack = await selectProjectTitleTemplate(projectID, synTags);
				// console.log(' < tmpl_pack >');
				// console.log(tmpl_pack);
				let t_tmpl = await parseTmplObj(t_tmpl_pack);
				// console.log(' < tmpl >');
				// console.log(tmpl);

				let title = await templateParse( t_tmpl['talk'], t_tmpl );
				console.log(' < title >');
				console.log(title);

				console.log(' < createObject >');
				let objID = await createObject(projectID,originalID,title, description, video_link,donor_link,logID);
				console.log(' < createRelationTagObj >');
				await createRelationTagObj(objID, originalTags);
			});
		}

		// 		console.log(tags);
		// 		console.log(result);
		// 		result.tags = tags;

		// 		var obj = JSON.parse(fs.readFileSync('./modules/template2.json', 'utf8'));
		// 		result.description = await templateParse( obj['start'], obj );
		result = originalIDarr;
		if(callback)
			await callback(result);
		// 	})
		// });
	} catch (e) {
		console.log(e);
		return 0;
	}
};
async function createRelationTagObj(objID, tags){
	try {
		var query = ""
				+ " Insert Into"
				+ " relationTagObject "
				+ " (tagID, objectID)"
				+ " values (?,?)";
		for(var i=0; i<tags.length; i++){
			let tagID = tags[i].tagID;
			console.log({tag: tagID, obj: objID});
			await myquery(query, [ tagID, objID ]);
		}

	} catch (e) {
		console.log(e);
		return 0;
	}	
}
async function createObjectLog(projectID ){
	try {
		var type = 'import'
		var query = ""
				+ " Insert Into"
				+ " projectLog "
				+ " (projectID, type, date)"
				+ " values (?,?,NOW())";
		var log = await myquery(query, [ projectID, type ]);
		return log.insertId;
	} catch (e) {
		console.log(e);
		return 0;
	}	
}
async function createObject(projectID,originalID,title, description, videolink, donorlink, logID){
	try {
		console.log([projectID,originalID,title, description, videolink, donorlink, logID]);
		var query = ""
				+ " Insert Into"
				+ " object "
				+ " (DataTitle1, DataLink1, DataText1, FootPrint1, FootPrint2, DataKey1)"
				+ " values (?,?,?,?,?,?)";
		let object = await myquery(query, 
			[ title, videolink, description, originalID, donorlink, logID ]);
		console.log(object);
		let objectID = object.insertId;

		query = ""
			+ " Insert Into"
			+ " relationProjectObject"
			+ " (projectID, objectID)"
			+ " values (?,?)";
		let relation = await myquery(query, [ projectID,objectID ]);
		console.log(relation);

		query = ""
				+ " Insert Into"
				+ " relationProjectOriginal"
				+ " (projectID, originalID)"
				+ " values (?,?)";
		let relation2 = await myquery(query, [ projectID,originalID ]);
		console.log(relation2);

		// if(callback)
		// 	await callback(result);
		return objectID;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function parseTmplObj(json){
	var tmpl_arr= json.map((item)=>{
		var obj = {};
		obj[item['keyword']] = [];
		return obj;
	});
	var tmpls = {};
	Array.prototype.forEach.call(tmpl_arr,function(elem) {
	   var keys = Object.keys(elem);
	   tmpls[keys[0]] = elem[keys[0]];
	});
	for(var i=0; i<json.length; i++){
		var key = json[i]['keyword']
		// console.log(key);
		var val = json[i]['val']
		// console.log(val);
		tmpls[key].push(val);
	}
	return tmpls;
}
async function selectProjectDescriptionTemplate (projectID, tagIDs, callback)  {
	try {
		var query = ""
			+ " SELECT *"
			+ " FROM relationTmplProject"
			+ " WHERE projectID = ? and type = 'description'"
			+ " ORDER BY RAND() LIMIT 1 ";
		let relation = await myquery(query, [ projectID ]);
		console.log(relation);
		if(!relation[0])
			return;
		let tmplID = relation[0].tmplID;
		console.log(tmplID);

		query = ""
			+ " SELECT *"
			+ " FROM templateKey"
			+ " WHERE tmplID = ?";
		let keys = await myquery(query, [ tmplID ]);
		console.log(keys);

// ----------------------------------------------------

		// console.log(tags);
		// let tagIDs = [];
		// for(var i=0; i<tags.length; i++){
		// 	tagIDs.push(tags[i].id);
		// }
		// console.log(" < tagIDs >");
		// console.log(tagIDs);

		query = ""
			+ " SELECT *"
			+ " FROM templateCondition"
			+ " WHERE tmplKeyID in "
			+ " ("
			+ " 	SELECT id "
			+ " 	FROM templateKey"
			+ " 	WHERE tmplID = ?"
			+ " )";
		let condition = await myquery(query, [ tmplID ]);
		console.log(" < tmpl condition >");
		console.log(condition);

		var result = [];
		if(!condition)
			result = keys;
		else{
			var n_condition = [],
				p_condition = [];
			for(var i=0; i<condition.length; i++){
				if(condition[i].positive)
					p_condition.push(condition[i]);
				else
					n_condition.push(condition[i]);
			}
			console.log(" < p_condition >");
			console.log(p_condition);
			console.log(" < n_condition >");
			console.log(n_condition);
			

			console.log(" < tmpl condition check >");
			for(var i=0; i<keys.length; i++){
				var bool = true;

				for(var j=0; j<p_condition.length; j++){
					if( p_condition[j].tmplKeyID == keys[i].id ){ // есть положительное условие для ключа

						bool = false;
						if( tagIDs.indexOf(p_condition[j].tagID) ){
							bool = true;
							break;
						} 
					}
				}

				for(var j=0; j<n_condition.length; j++){
					if( n_condition[j].tmplKeyID == keys[i].id ){

						bool = true;
						if( tagIDs.indexOf(n_condition[j].tagID) ){
							bool = false;
							break;
						} 
					}
				}
				if( bool ) result.push(keys[i]);
			}
		}

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectProjectTitleTemplate (projectID, tagIDs, callback)  {
	try {
		var query = ""
			+ " SELECT *"
			+ " FROM relationTmplProject"
			+ " WHERE projectID = ? and type = 'title'"
			+ " ORDER BY RAND() LIMIT 1 ";
		let relation = await myquery(query, [ projectID ]);
		console.log(relation);
		if(!relation[0])
			return;
		let tmplID = relation[0].tmplID;
		// console.log(tmplID);

		query = ""
			+ " SELECT *"
			+ " FROM templateKey"
			+ " WHERE tmplID = ?";
		let keys = await myquery(query, [ tmplID ]);
		console.log(keys);

// ----------------------------------------------------

		// console.log(tags);
		// let tagIDs = [];
		// for(var i=0; i<tags.length; i++){
		// 	tagIDs.push(tags[i].id);
		// }
		// console.log(" < tagIDs >");
		// console.log(tagIDs);

		query = ""
			+ " SELECT *"
			+ " FROM templateCondition"
			+ " WHERE tmplKeyID in "
			+ " ("
			+ " 	SELECT id "
			+ " 	FROM templateKey"
			+ " 	WHERE tmplID = ?"
			+ " )";
		let condition = await myquery(query, [ tmplID ]);
		console.log(" < tmpl condition >");
		console.log(condition);

		var result = [];
		if(!condition)
			result = keys;
		else{
			var n_condition = [],
				p_condition = [];
			for(var i=0; i<condition.length; i++){
				if(condition[i].positive)
					p_condition.push(condition[i]);
				else
					n_condition.push(condition[i]);
			}
			console.log(" < p_condition >");
			console.log(p_condition);
			console.log(" < n_condition >");
			console.log(n_condition);
			

			console.log(" < tmpl condition check >");
			for(var i=0; i<keys.length; i++){
				var bool = true;

				for(var j=0; j<p_condition.length; j++){
					if( p_condition[j].tmplKeyID == keys[i].id ){ // есть положительное условие для ключа
						console.log('p_condition[j].tmplKeyID');
						console.log(p_condition[j].tmplKeyID);
						bool = false;
						if( tagIDs.indexOf(p_condition[j].tagID) > -1 ){
							console.log('tagIDs.indexOf(p_condition[j].tagID)');
							console.log(true);
							bool = true;
							// break;
						} 
					}
				}

				for(var j=0; j<n_condition.length; j++){
					if( n_condition[j].tmplKeyID == keys[i].id ){

						bool = true;
						if( tagIDs.indexOf(n_condition[j].tagID > -1 ) ){
							bool = false;
							// break;
						} 
					}
				}
				if( bool ) result.push(keys[i]);
			}
		}
		// 	for(var i=0; i<keys.length; i++){
		// 		console.log();
		// 		var bool = true;
		// 		console.log(keys[i]);

		// 		for(var j=0; j<condition.length; j++){
		// 			console.log(condition[j]);
				
		// 			if( keys[i].id == condition[j].tmplKeyID ){
		// 				// condition[j].positive
		// 				if(condition[j].positive)
		// 					bool = false;
		// 				else
		// 					bool = true;

		// 				for(var g=0; g<tags.length; g++){
		// 					console.log(tags[g]);
		// 					console.log(condition[j].tagID + " == " + tags[g].tagID);
		// 					console.log(condition[j].positive);
		// 					if( condition[j].tagID == tags[g].tagID ){
		// 						bool = condition[j].positive 
		// 						? true
		// 						: false;
		// 					}
		// 					console.log("bool "+ bool);
		// 				}
		// 			}
		// 		}
		// 		console.log(keys[i]);
		// 		if( bool ) result.push(keys[i]);
		// 	}
		console.log(result);
// ----------------------------------------------------
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
 async function selectFlagTemplates (tagID, callback)  {
	try {
		var query = ""
			+ " SELECT *"
			+ " FROM tagTemplates"
			+ " WHERE flag ="
			+ " ("
			+ " SELECT flag"
			+ " FROM tag"
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
async function findFilteredOriginal(connection, projectID, tagIDs){
	try {
		let query = " SELECT originalID " +
					" FROM relationTagOriginal ";
		if(tagIDs.positive.length > 0){
			query += " WHERE tagID in ( "

			for(var j=0; j<tagIDs.positive.length; j++){
				if(j == tagIDs.positive.length-1)
					query += " " + tagIDs.positive[j] + " ";
				else
					query += " " + tagIDs.positive[j] + ", ";
			}
			query += " ) ";			
			// for(var j=0; j<tagIDs.positive.length; j++){
			// 	if(j==0)
			// 		query += " WHERE tagID = " + tagIDs.positive[j];
			// 	else
			// 		query += " OR tagID = " + tagIDs.positive[j];
			// }
		}

		if(tagIDs.negetive.length > 0){
			if( !tagIDs.positive.length )
				query += " WHERE ";
			else
				query += " AND ";

			query += " originalID not in " +
					" ( " +
					" SELECT originalID " +
					" FROM relationTagOriginal ";
			for(var j=0; j<tagIDs.negetive.length; j++){
				if(j==0)
					query += " WHERE tagID = " + tagIDs.negetive[j];
				else
					query += " OR tagID = " + tagIDs.negetive[j];
			}
			query += " ) ";
		}
		query += ""
			+	"AND originalID not in ("
			+	"select originalID "
			+	"from relationProjectOriginal "
			+	"where projectID = "+projectID
			+	")";
		query += "GROUP BY originalID";
		// query += " ORDER BY RAND() LIMIT 1 ";
		console.log(query);

		let fields = await connection.execute( query ); // !
		let result = fields[0];

		console.log(result);
		return result;
		// await callback(results);
	} catch (e) {
		console.log(e);
		return -1;
	}
}
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
module.exports.createLibraryKey = async (name, callback) => {
	try {
		var query = "INSERT INTO libraryKey (`name`) VALUES (?)";
		let result = await myquery(query, [ name ]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.deleteLibraryKey = async (keyID, callback) => {
	try {
		await new Promise(async(resolve, reject)=>{
			
			var query = 'SELECT valueID FROM libraryRelation '
					+	'WHERE keyID = ? ';
			let result = await myquery(query, [ keyID ]);
			console.log('result');
			console.log(result);
			resolve(result);

		}).then(async(values)=>{

			for(var i=0; i<values.length; i++){
				var query = 'DELETE FROM libraryValue '
						+	'WHERE id = ? ';
						console.log(values[i]);
				let result2 = await myquery(query, [ values[i].valueID ]);
				console.log('result2');
				console.log(result2);
			}
			return;

		}).then(async()=>{

			var query = 'DELETE FROM libraryRelation '
					+	'WHERE keyID = ? ';
			let result3 = await myquery(query, [ keyID ]);
			console.log('result3');
			console.log(result3);
			return;

		}).then(async()=>{

			var query = 'DELETE FROM libraryKey '
					+	'WHERE id = ? ';
			let result4 = await myquery(query, [ keyID ]);
			console.log('result4');
			console.log(result4);
			
		}).catch((e)=>{
			console.log('my promis error');
			console.log(e);
		})

		if(callback)
			await callback();
		return;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.deleteLibraryKeyValue = async (valueID, callback) => {
	try {
		await new Promise(async(resolve, reject)=>{

			var query = 'DELETE FROM libraryRelation '
					+	'WHERE valueID = ? ';
			let result3 = await myquery(query, [ valueID ]);
			console.log('result3');
			console.log(result3);
			resolve();

		}).then(async()=>{

			var query = 'DELETE FROM libraryValue '
					+	'WHERE id = ? ';
			let result2 = await myquery(query, [ valueID ]);
			console.log('result2');
			console.log(result2);
			return;

		}).catch((e)=>{
			console.log('my promis error');
			console.log(e);
		})

		if(callback)
			await callback();
		return;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.addLibraryKeyValue = async (value, callback) => {
	try {
		var query = "INSERT INTO libraryValue (`value`) VALUES (?)";
		let result = await myquery(query, [ value ]);

		if(callback)
			await callback(result.insertId);
		return result.insertId;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.createRelationLibraryKeyValue = async (keyID, valueID, callback) => {
	try {
		var query = "INSERT INTO libraryRelation (`keyID`,`valueID`) VALUES (?,?)";
		let result = await myquery(query, [ keyID, valueID ]);

		if(callback)
			await callback(result.insertId);
		return result.insertId;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.selectLibraryItems = async (callback) => {
	try {
		var query = ""
			+ " SELECT r.id as `keyID`, r.name as `key`, res2.id as `valueID`, res2.value "
			+ " FROM replecon.libraryKey r "
			+ " left join "
			+ " 	( "
			+ " 		select * "
			+ " 		from  replecon.libraryRelation "
			+ " 	) as res on res.keyID = r.id  "
			+ " left join "
			+ " ( "
			+ " 	select * "
			+ " 	from  replecon.libraryValue "
			+ " ) as res2 on res2.id = res.valueID ";
		let result = await myquery(query, []);
		// console.log(result);
		let list = [...new Set(result.map(item => item.key))]
		.map((key)=>{
			return {key: key, values: []}
		});
		// console.log(list);
		result.forEach((item,i,arr)=>{
			let _key = result[i].key;

			for(var j=0; j<list.length; j++){
				if( list[j].key==_key ){
					list[j].id = item.keyID;
					if(item.value!=null)
						list[j].values.push( {id:item.valueID,value:item.value});
				}
			}
		});
		console.log(list);


		if(callback)
			await callback(list);
		return list;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.selectProjectReadyObjects = async (objects, callback) => {
	var x = 0;
	for(var i=0; i<objects.length; i++){
		if( objects[i].DataLink2 && objects[i].DataLink3 && objects[i].DataLink4 && objects[i].DataText3 ) 
			x++;
	}
	if(callback)
		await callback(x);
	return x;
}
module.exports.pageScraper = async (page, callback) => {
	try {
		console.log('pageScraper');
		var link = await scraperModule.getLink(page);
		console.log('link');
		console.log(link);
		console.log();
		if(!link) return;
		
		var result = await ffmpegModule.makeThumbs(link, async (res)=>{
			console.log("filenames");
			console.log(res);
			if(callback)
				await callback(res);
		});
		console.log();
		// return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.makeObjectThumbs = async (objects, callback) => {
	for(var i=0; i<objects.length; i++){
		if( !objects[i].DataLink2 ) {
			await pageScraper(objects[i].DataLink1, async (res)=>{
				var text = res.names.join(',');
				console.log("text");
				console.log(text);
				console.log("objects[i].id");
				console.log(objects[i].id);
				await addThumbsToObject(objects[i].id, text);
			});
		}
	}
	if(callback)
		await callback();
}
module.exports.selectProjectObjects = async (projectID, callback) => {
	try {
		var query = ""
				+	" SELECT *" 
				+	" FROM object"
				+	" WHERE id in"
				+	" (SELECT objectID"
				+	" FROM relationProjectObject"
				+	" WHERE projectID = ?)";
		let result = await myquery(query, [ projectID ]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.selectProjectUnmappedObjects = async (projectID, callback) => {
	try {
		var query = ""
				+	" SELECT *" 
				+	" FROM object"
				+	" WHERE id in"
				+	" (SELECT objectID"
				+	" FROM relationProjectObject"
				+	" WHERE projectID = ?)"
				+	" AND DataFlag1 IS NULL"
				+	" AND DataFlag2 IS NULL";
		let result = await myquery(query, [ projectID ]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectProjectUnmappedObjects(projectID, callback) {
	try {
		var query = ""
				+	" SELECT *" 
				+	" FROM object"
				+	" WHERE id in"
				+	" (SELECT objectID"
				+	" FROM relationProjectObject"
				+	" WHERE projectID = ?)"
				+	" AND DataFlag1 IS NULL"
				+	" AND DataFlag2 IS NULL";
		let result = await myquery(query, [ projectID ]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.selectProjectLogs = async (projectID, callback) => {
	try {
		var query = ""
				// +	" SELECT *" 
				// +	" FROM exportLog"
				// +	" WHERE projectID = ?";
				+	"	select "
				+	"	l.projectID, l.type, l.date, l.id, count(o.id) as `length`"
				+	"	from projectLog l"
				+	"	left join object as o"
				+	"	on o.DataKey1 = l.id"
				+	"	where projectID = ?"
				+	"	group by l.id";
		let result = await myquery(query, [ projectID ]);

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
module.exports.exportObjects = async (projectID, db_params, callback) => {
	try {
		const connection = await CHILDCON(db_params); // !

		var query = ""
				+	" INSERT INTO wp_posts("

				+	" post_author, "
				+	" post_status, "
				+	" comment_status, "
				+	" ping_status, "

				+	" menu_order, "
				+	" post_type, "
				+	" comment_count,"
				+	" post_parent,"

				+	" post_date, "
				+	" post_date_gmt, "
				+	" post_modified, "
				+	" post_modified_gmt, "

				+	" post_content,"
				+	" post_title, "
				+	" post_name, "
				+	" guid, " 

				+	" to_ping,"
				+	" post_excerpt,"
				+	" pinged,"
				+	" post_content_filtered,"
				+	" post_password "
				+	" ) VALUES ("
				+	" '1','publish','open','open', "
				+	" '0', 'post', '0', '0', " 
				+	" (now() - INTERVAL ? MINUTE),"//date
				+	" (now() - INTERVAL ? MINUTE),"//date
				+	" (now() - INTERVAL ? MINUTE),"//date
				+	" (now() - INTERVAL ? MINUTE),"//date
				+	" ?," //'descr'
				+	" ?, "//'title'
				+	" ?,"//'convert title'
				+	" ?, "//link
				+	" '','','','','' "
				+	" ) ";
		var query2 = ""
				+	" UPDATE object SET "
				+	" DataFlag1=1, "
				+	" DataKey2=? "
				+	" WHERE id=? ";


		console.log(" < objs > ");
		var objs = await selectProjectUnmappedObjects(projectID);
		console.log(objs);

		if(objs.length == 0) return;




		for(var i=0; i<objs.length; i++){
			let objResult = await connection.execute( query, 
			[
				(5*i+i),
				(5*i+i),
				(5*i+i),
				(5*i+i),
				objs[i].DataText1,
				objs[i].DataTitle1,
				objs[i].DataTitle1
					.toLowerCase()
					.replace(punctREGEX, '')
					.replace(/(^\s*)|(\s*)$/g, '')
					.replace(/\s+/g,'-'),
				"no link"
			] ); // !
			console.log(" < objResult > ");
			console.log(objResult[0]);
			
			let tag_query = "select term_id from wp_terms where name = ?";
			
			let new_tag_query = "insert into wp_terms"
			+ " (name, slug, term_group) "
			+ " VALUES (?, ?, 0) ";
			
			let relation_query = "insert into wp_term_relationships"
			+ " (object_id, term_taxonomy_id, term_order) "
			+ " VALUES (?, ?, 0) "
			
			let tags = await selectObjectTags(objs[i].id);
			for(var j=0; j<tags.length; j++){
				
				let foreignTagId = await connection.execute( tag_query, [
					tags[j].name
				]);
				console.log(" < foreign Tag Id > ");
				console.log(foreignTagId[0]);

				if( foreignTagId[0] != 0 ){ // we catched the foreign Tag
					let res = await connection.execute(relation_query, [
						objResult[0].insertId,
						foreignTagId[0][0].term_id
					]);
					console.log(" < search and create relation foreignTag > ");
					console.log(res[0]);
				}else{
					let res2 = await connection.execute(new_tag_query,[
						tags[j].name,
						tags[j].name
							.toLowerCase()
							.replace(punctREGEX, '')
							.replace(/(^\s*)|(\s*)$/g, '')
							.replace(/\s+/g,'_')
					]);
					console.log(" < new foreign Tag Id > ");
					console.log(res2[0]);

					foreignTagId = res2[0].insertId;
					console.log("< foreignTagId >");
					console.log(foreignTagId);
					let res = await connection.execute(relation_query, [
						objResult[0].insertId,
						foreignTagId
					]);
					console.log(" < insert foreignTag > ");
					console.log(res[0]);
				}
			}

			console.log(" < logID > ");
			var logID = await createExportLog(projectID);
			console.log( logID );

			let mapTheObjRes = await myquery( query2, [logID, objs[i].id]);
			console.log(" < mapTheObjRes > ");
			console.log(mapTheObjRes);
		}

		connection.end();
		result = '';
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return ;
	}
}
async function selectObjectTags(objectID,callback){
	try {
		let query = ""
		+	"	Select r.id, r.tagID, r.objectID, res.name FROM "
		+	"	replecon.relationTagObject r"
		+	"	left join("
		+	"	select name, id from"
		+	"	replecon.tag"
		+	"	)as res on res.id = r.tagID"
		+	"	where objectID = ?"
		+	"	order by r.id "

		let result = await myquery( query, [objectID] );
		console.log(result);

		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function createExportLog(projectID,callback){
	try {
		let query = ""
				+	" insert into "
				+	" exportLog(projectID, date) "
				+	" values( ?, NOW() ) ";

		let result = await myquery( query, [projectID] );
		
		console.log(result);
		result = result.insertId;

		if(callback)
			await callback(result);
		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////SELECT * FROM replecon.exportLog;

module.exports.selectExportLogs = async (projectID, callback) => {
	try {

		// let query = "SELECT * FROM tag WHERE MATCH(name) AGAINST(?);";
		let query = " SELECT * FROM exportLog WHERE projectID = ? ";
		let result = await myquery(query, [projectID]);

		// console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}/////////////////////////////////////////////
module.exports.selectExportLog = async (logID, callback) => {
	try {

		// let query = "SELECT * FROM tag WHERE MATCH(name) AGAINST(?);";
		let query = " SELECT * FROM exportLog WHERE id = ? ";
		let result = await myquery(query, [logID]);

		// console.log(result);
		if(callback)
			await callback(result[0]);
		return result[0];

	} catch (e) {
		console.log(e);
		return 0;
	}
}/////////////////////////////////////////////
module.exports.selectExportLogObjects = async (logID, callback) => {
	try {

		// let query = "SELECT * FROM tag WHERE MATCH(name) AGAINST(?);";
		let query = " SELECT * FROM object WHERE DataKey2 = ? ";
		let result = await myquery(query, [logID]);

		// console.log(result);
		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}/////////////////////////////////////////////

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
module.exports.saveProjectChanges = async (id, name, info, tags, t_tmpls, d_tmpls, db, callback) => {
	try {
		console.log({name, info, tags, t_tmpls, d_tmpls, db, callback});
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

		query = "select tmplID "
			+	"from relationTmplProject "
			+	"where projectID = ? and type = 'title'"
		let p_tmpls_res = await myquery(query, [ id ]);
		console.log(p_tmpls_res);

		var p_tmpls = [];
		for(var i=0; i<p_tmpls_res.length;i++){
			await p_tmpls.push(p_tmpls_res[i].tmplID);
		}
		console.log(" < p_tmpls >");
		console.log(p_tmpls);

		var new_tmpls = [];
		var lost_tmpls = [];

		if(!t_tmpls)
			t_tmpls = [];

		for(var i=0;i<t_tmpls.length; i++){

		    if( p_tmpls.indexOf(t_tmpls[i]) < 0 )
		
		        await new_tmpls.push(t_tmpls[i])
		
		}
		for(var i=0;i<p_tmpls.length; i++){
		
		    if( t_tmpls.indexOf(p_tmpls[i]) < 0 )
	    
	        	await lost_tmpls.push(p_tmpls[i])
		
		}
		console.log('< new_tmpls >');
		console.log(new_tmpls);
		console.log('< lost_tmpls >');
		console.log(lost_tmpls);

		console.log('< tmpl_res >');
		query = 'insert into '
			+	'relationTmplProject(tmplID, projectID, type) '
			+	'values(?,?,?)';
		for(var i=0; i<new_tmpls.length; i++){
			let tmpl_res = await myquery(query, [ new_tmpls[i], id, 'title' ]);
			console.log(tmpl_res);
		}
		query = "DELETE FROM relationTmplProject "
			+	"WHERE tmplID = ? "
			+	"and projectID = ? and type = 'title'";
		for(var i=0; i<lost_tmpls.length; i++){
			let tmpl_res = await myquery(query, [ lost_tmpls[i], id ]);
			console.log(tmpl_res);
		}
		////////////////////////////////////////////
		query = "select tmplID "
			+	"from relationTmplProject "
			+	"where projectID = ? and type = 'description'"
		let _p_tmpls_res = await myquery(query, [ id ]);
		console.log(_p_tmpls_res);

		var _p_tmpls = [];
		for(var i=0; i<_p_tmpls_res.length;i++){
			await _p_tmpls.push(_p_tmpls_res[i].tmplID);
		}

		var _new_tmpls = [];
		var _lost_tmpls = [];

		if(!d_tmpls)
			d_tmpls = [];

		for(var i=0;i<d_tmpls.length; i++){
		    if( _p_tmpls.indexOf(d_tmpls[i]) < 0 )
		        await _new_tmpls.push(d_tmpls[i])
		}
		for(var i=0;i<_p_tmpls.length; i++){
		    if( d_tmpls.indexOf(_p_tmpls[i]) < 0 )
	        	await _lost_tmpls.push(_p_tmpls[i])
		}
		console.log('< new_tmpls >');
		console.log(_new_tmpls);
		console.log('< lost_tmpls >');
		console.log(_lost_tmpls);

		console.log('< tmpl_res >');
		query = 'insert into '
			+	'relationTmplProject(tmplID, projectID, type) '
			+	'values(?,?,?)';
		for(var i=0; i<_new_tmpls.length; i++){
			let tmpl_res = await myquery(query, [ _new_tmpls[i], id, 'description' ]);
			console.log(tmpl_res);
		}
		query = "DELETE FROM relationTmplProject "
			+	"WHERE tmplID = ? "
			+	"and projectID = ? and type = 'description'";
		for(var i=0; i<_lost_tmpls.length; i++){
			let tmpl_res = await myquery(query, [ _lost_tmpls[i], id ]);
			console.log(tmpl_res);
		}
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
		let query = 'SELECT name FROM tag WHERE id = ?';
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
		let query = 'UPDATE tag SET name = ? WHERE id = ?';
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
			let query = 'UPDATE tag SET flag = ? WHERE id = ?';
			let result = await myquery( query, [flag, newTag[i]] );
			console.log(result);
		}
		for(var i=0; i<lostTag.length; i++){
			let query = 'UPDATE tag SET flag = null WHERE id = ?';
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
			+ " from tag r "
			+ " where r.flag = "
			+ " ( "
			+ " 	select flag "
			+ " 	from tag "
			+ " 	where id = ? "
			+ " ) "
			+ " GROUP BY r.id ";
		let result = await myquery( query, [tagID] );

		console.log('selectTagSyns result');
		console.log(result);
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
			+ " FROM tagTemplates"
			+ " WHERE flag ="
			+ " ("
			+ " SELECT flag"
			+ " FROM tag"
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
		var query = "select * from templateKey where tmplID = ?";
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
		+ " select * from templateCondition tc "
		+ " left join"
		+ " (select id, name from tag)as res "
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

		var tmplKeyID = await insertTmplKey(tmplID, keyword, val);
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
		var query = "INSERT INTO templateKey (keyword, val, tmplID) values (? ,?, ?)";
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
		var query = "INSERT INTO templateCondition (tagID, tmplKeyID, positive) values (? ,?, ?)";
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
		var query = "INSERT INTO tagTemplates (flag, keyword, val) values (? ,?, ?)";
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
		var query3 = "SELECT id FROM templateKey WHERE tmplID = ?";
		var query4 = "DELETE FROM templateCondition WHERE tmplKeyID = ?";
		var query5 = "DELETE FROM templateKey WHERE id = ?";

		let result = await myquery(query, [ tmplID ]);
		let result2 = await myquery(query2, [ tmplID ]);
		let ids = await myquery(query3, [ tmplID ]);
		for(i=0; i<ids.length; i++){
			await myquery(query4, [ ids[i] ]);
			await myquery(query5, [ ids[i] ]);
		}

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
			"DELETE FROM templateCondition WHERE tmplKeyID = ?"
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
module.exports.deleteTag = async (tagID, callback) => {
	try {
		var query = "DELETE FROM tag WHERE id = ?";
		var query2 = "DELETE FROM relationTagObject WHERE tagID = ?";
		var query3 = "DELETE FROM relationTagOriginal WHERE tagID = ?";
		var query4 = "DELETE FROM relationTagProject WHERE tagID = ?";
		var query5 = "DELETE FROM templateCondition WHERE tagID = ?";

		var result1 = await myquery(query2, [ tagID ]);
		var result2 = await myquery(query3, [ tagID ]);
		var result3 = await myquery(query4, [ tagID ]);
		var result4 = await myquery(query5, [ tagID ]);
		var result5 = await myquery(query, [ tagID ]);
		// console.log(result);
		if(callback)
			await callback();
		// return result[0];

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.deleteProject = async (projectID, callback) => {
	try {
		var query = "DELETE FROM project WHERE id = ?";
		var query2 = "DELETE FROM relationTagProject WHERE projectID = ?";
		var query3 = "DELETE FROM relationTmplProject WHERE projectID = ?";
		var query4 = "DELETE FROM relationProjectOriginal WHERE projectID = ?";
		var query5 = "DELETE FROM projectLog WHERE projectID = ?";
		var query6 = "DELETE FROM exportLog WHERE projectID = ?";

		var result1 = await myquery(query2, [ projectID ]);
		var result2 = await myquery(query3, [ projectID ]);
		var result3 = await myquery(query4, [ projectID ]);
		var result4 = await myquery(query5, [ projectID ]);
		var result5 = await myquery(query6, [ projectID ]);
		
		var db_query = "SELECT sshhID, dbhID FROM projectDB WHERE projectID = ?";
		var projectDB = await myquery(db_query, [ projectID ]);
		if(projectDB[0]){
			projectDB = projectDB[0];
			if(projectDB.sshhID){
				var sshhID_query = "DELETE FROM sshhost WHERE id = ?";
				var sshh = await myquery(sshhID_query, [ projectDB.sshhID ]);
			}
			if(projectDB.dbhID){
				var dbhID_query = "DELETE FROM sshhost WHERE id = ?";
				var dbh = await myquery(sshhID_query, [ projectDB.dbhID ]);
			}
		}
		var query7 = "DELETE FROM projectDB WHERE projectID = ?";
		var result6 = await myquery(query7, [ projectID ]);
	
		var objs_query = "SELECT objectID FROM relationProjectObject WHERE projectID = ?";
		var projectObjs = await myquery(objs_query, [ projectID ]);
		if(projectObjs.length > 0){
			var obj_query = "DELETE FROM object WHERE id = ?";
			for(var i=0; i<projectObjs.length; i++){
				var obj = await myquery(obj_query, [ projectObjs[i] ]);
			}
		}
		var objs_relation_query = "DELETE FROM relationProjectObject WHERE projectID = ?";
		var objs_relation = await myquery(objs_relation_query, [ projectID ]);

		var result = await myquery(query, [ projectID ]);

		// console.log(result);
		if(callback)
			await callback();
		// return result[0];

	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function selectTagFlag(tagID, callback){
	try {
		let query = 'SELECT flag FROM tag WHERE id = ?';
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
		let query = 'UPDATE tag SET flag = id WHERE id = ?';
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
			await callback(result[0]);
		return result[0];

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
		console.log(" < selectProjectTags > ");
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
		let query = "SELECT res.id, res.name, type FROM relationTmplProject left join (select id, name from template)as res on res.id = tmplID WHERE projectID = ?";
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
			+ " from tag r "
			+ " where r.flag = "
			+ " ( "
			+ " 	select flag "
			+ " 	from tag "
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
module.exports.selectProjectDB = async (id, callback) => {
	try {		
		let query = "SELECT * FROM projectDB WHERE projectID = ?";
		let projectDB = await myquery(query, [id]);
		let result = projectDB[0];

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}

module.exports.selectProjectDBlocalhost = async (id, callback) => {
	try {		
		let query = "SELECT * FROM dbhost WHERE id = ?";
		let localhost = await myquery(query, [id]);
		let result = localhost[0];

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.selectProjectDBsshhost = async (id, callback) => {
	try {		
		let query = "SELECT * FROM sshhost WHERE id = ?";
		let sshhost = await myquery(query, [id]);
		let result = sshhost[0];

		if(callback)
			await callback(result);
		return result;

	} catch (e) {
		console.log(e);
		return 0;
	}
}
module.exports.saveProjectDB = async (projID, pack, callback) => {
	try {		
		let query = "SELECT * FROM projectDB WHERE projectID = ?";
		let projectDB = await myquery(query, [projID]);
			console.log(17);
		console.log(projectDB);
			console.log(16);
		// if()

		if(!projectDB || projectDB.length == 0){
			console.log(15);
			query = "INSERT INTO projectDB (projectID, flag) VALUES (?,?)";
			let flag = ( pack.db_type == 'localhost' ) ? 0 : 1;

			console.log(14);
			projectDB = await myquery(query, [projID, flag]);
			let pdbID = projectDB.insertId;

			console.log(13);
			if(!flag){
				console.log(12);
				query = "INSERT INTO dbhost (host, user, password, name) VALUES (?,?,?,?)";
				
				let host = pack.db_adr,
					user = pack.db_usr,
					password = pack.db_pass,
					name = pack.db_name;
				if( !host || !user || !password || !name) return;

				let dbhost = await myquery(query, [host, user, password, name]);
				let dbhID = dbhost.insertId;

				query = "UPDATE projectDB SET dbhID = ? WHERE projectID = ?";
				let updatePDB = await myquery(query, [dbhID, projID]);
			}else{
			console.log(11);

				let l_host = pack.db_adr,
					l_port = pack.db_port,
					l_user = pack.db_usr,
					l_password = pack.db_pass,
					l_name = pack.db_name;

				let f_host = pack.host_adr
					f_port = pack.host_port,
					f_user = pack.host_usr,
					f_password =pack.host_pass;

				let f_options = [],
					l_options = [];

				if( !l_host || !l_user || !l_password || !l_name ) return;
				if( !f_host || !f_user || !f_password ) return;

			console.log(10);
				/* foreign ssh host */
				if(f_port){
			console.log(9);
					query = "INSERT INTO sshhost (host, port, user, password) VALUES (?,?,?,?)";
					f_options = [f_host, f_port, f_user, f_password];				
				}else{
			console.log(8);
					query = "INSERT INTO sshhost (host, user, password) VALUES (?,?,?)";
					f_options = [f_host, f_user, f_password];
				}
			console.log(7);
				let sshhost = await myquery(query, f_options);
				let sshhID = sshhost.insertId;

			console.log(6);
				/* local db host */
				if(l_port){
			console.log(5);
					query = "INSERT INTO dbhost (host, port, user, password, name) VALUES (?,?,?,?,?)";
					let l_options = [l_host, l_port, l_user, l_password, l_name];
				}else{
			console.log(4);
					query = "INSERT INTO dbhost (host, user, password, name) VALUES (?,?,?,?)";
					let l_options = [l_host, l_user, l_password, l_name];
				}
			console.log(3);
				let dbhost = await myquery(query, l_options);
				let dbhID = dbhost.insertId;

			console.log(2);
				/* project DB config */
				query = "UPDATE projectDB SET dbhID = ?, sshhID = ? WHERE projectID = ?";
				let updatePDB = await myquery(query, [dbhID, sshhID, projID]);

			console.log(1);
			}
		}
			console.log(0);

		result = null;
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

			let query3 	= "SELECT t.name, r.tagID, r.positive FROM relationTagProject r, tag t WHERE projectID = ? AND t.id = r.tagID";
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
		let query = "SELECT * FROM tag order by name";
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
			+ " order by name";
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
			+ " select r.id, r.name, r.flag, res.syns "
			// + " ,res2.tmpls"
			+ " from tag r"
			+ " left join"
			+ " ("
			+ " 	SELECT flag, count(*) as syns"
			+ " 	FROM tag"
			+ " 	group by flag"
			+ " ) as res on r.flag = res.flag" 
			// + " left join"
			// + " ("
			// + " 	SELECT flag, count(*) as tmpls"
			// + " 	FROM replecon.tagTemplates"
			// + " 	group by flag"
			// + " ) as res2 on r.flag = res2.flag "
			+ " order by name";
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
// module.exports.selectRandomOriginal = async (projectID, callback) => {
// 	const connection 	= await ASYNSQL(); // !
// 	try {
// 		let positiveArr = [];
// 		let negetiveArr = [];
// 		await selectProjectTags(connection, projectID, async (result) => {
// 			console.log(result);
// 			for(var i=0; i < result.length; i++){
// 				if(result[i].positive == 0){
// 					await negetiveArr.push(result[i].tagID);
// 				}else{
// 					await positiveArr.push(result[i].tagID);
// 				}
// 			}
// 		});
// 		console.log(positiveArr);
// 		console.log(negetiveArr);

// 		let originalID = await findOriginal(connection, {positive:positiveArr, negetive:negetiveArr});
// 		await selectOriginal(connection, originalID, async (result) => {
// 			await selectOriginalTags(connection, originalID, async (tags) => {
// 				console.log(tags);
// 				console.log(result);
// 				result.tags = tags;

// 				var obj = JSON.parse(fs.readFileSync('./modules/template2.json', 'utf8'));
// 				result.description = await templateParse( obj['start'], obj );

// 				await callback(result);
// 			})
// 		});
// 	} catch (e) {
// 		console.log(e);
// 		return 0;
// 	}
// };
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
		console.log(" < selectProjectTags > ");
		let query = 'SELECT r.tagID, r.positive, t.flag FROM relationTagProject r, tag t WHERE projectID = ? AND t.id = r.tagID';
		let fields = await connection.execute( query, [projectID] ); // !

		let results = fields[0];
		// console.log(results);

		query = " select id as tagID"
			+	" from tag"
			+	" where flag = "
			+	" ("
			+	" 	select flag"
			+	" 	from tag"
			+	" 	where id = ?"
			+	" )"
			+	" and id not in (?)";
		for(var i=0; i<results.length; i++){
			if(results[i].flag != null){
				// console.log(results[i].tagID);
				let id = results[i].tagID;
				let more_result = await myquery(query, [id,id]);
				for(var j=0; j<more_result.length; j++){
					more_result[j].positive = results[i].positive;
					results.push(more_result[j]);
				}
			}
		}
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
		if(callback)
			await callback(results);
		return results;
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
			query += " AND originalID not in " +
					" ( " +
					" SELECT originalID " +
					" FROM relationTagOriginal ";
			for(var j=0; j<tagIDs.negetive.length; j++){
				if(j==0)
					query += " WHERE tagID = " + tagIDs.negetive[j];
				else
					query += " OR tagID = " + tagIDs.negetive[j];
			}
			query += " ) ";
		}
		// query += " ORDER BY RAND() LIMIT 1 ";
		console.log(query);

		let fields = await connection.execute( query ); // !
		let result = fields[0];

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
module.exports.getJsons = async function(callback){
	try {
		let query = "SELECT * FROM jsonFiles";
		let result = await myquery( query, [] );

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
module.exports.getJson = async function(id, callback){
	try {
		await getJsonName(id, async (obj)=>{
			fs.readFile('./json/'+obj[0].name, async (err, data) => {  
		    	if (err) throw err;

    			if(callback)
					await callback( JSON.parse(data) );
			});
		});

	} catch (e) {
		console.log(e);
		return 0;
	}
}
/////////////////////////////////////////////
async function getJsonName(id, callback){
	try {
		let query = "SELECT name FROM jsonFiles WHERE id = ?";
		let result = await myquery( query, [id] );

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
async function saveJson(name,date,size,callback){
	try {
		let query = "INSERT INTO jsonFiles (`name`,`date`,`size`) VALUES (?,?,?)";
		let result = await myquery( query, [name,date,size] );

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
module.exports.saveJson = async function(json, name, callback){
	let length = json.length;
	let data = JSON.stringify(json);  
	var date = new Date();
	var _name = "./json/"+name;

	await fs.writeFileSync(_name, data); 
	await saveJson(name,date,length);

	console.log(' Json Saaved ! ');
	if(callback)
		await callback();
}
/////////////////////////////////////////////
module.exports.importJson = async function(json, callback){ // !
	// var connection 	= await ASYNSQL(); // !
	try {
		var connection 		= await POOLCON();
		// console.log(json.length);
		for (var iter=0; iter<json.length; iter++) {
			let item = json[iter];
			console.log(" - - - - - - - - - - - - JSON ");
			console.log(" -[ "+iter+" ] - - - - - JSON ");
			console.log(" - - - - - - - - - - - - JSON ");
				if(await uniqItem(connection,item)){
					let ids = await magic(connection,item); // !
					console.log(ids);
					await originalRelation(connection,ids); // !
				}

		}
		console.log(' Json Loaded ! ');
		if(callback)
			await callback();
		await connection.end();
	} catch (e) {
		console.log(e);
	}
};
async function uniqItem(connection, item){
	console.log(' - uniqItem');
	let query 	= "SELECT * FROM original WHERE `video` = ?";
	let result = await connection.query(query, [item.video] ); // !
	console.log(result[0]);
	console.log(' = uniqItem');
	return result[0].length ? false : true;
}
async function tagInsert(connection, tag){ // !
	console.log(' - tagInsert');
	let query 	= "INSERT INTO tag (`name`) VALUES (?)";
	let result = await connection.query(query, [tag] ); // !

	console.log(' = tagInsert result f()');
	console.log({result: result});
	return result[0];
}
async function tagSearch(connection, tag){ // !
	console.log(' - tagSearch');
	let query = 'SELECT * FROM tag WHERE `name` = ?';
	let [rows, fields] = await connection.query(query, [tag] ); // !

	console.log(' = tagSearch result f()');
	console.log({rows: rows, fields: fields});
	return {rows: rows, fields: fields};
}
async function originalCreate(connection, item){ // !
	console.log(' - originalCreate');
	console.log(item);

	let query = 'INSERT INTO original (`title`,`link`,`video`,`description`) VALUES (?,?,?,?)';
	let result = await connection.query(query, [ item.title, item.href, item.video, item.desc] ); // !

	console.log(' = originalCreate result f()');
	console.log(result);
	return result[0];
}
async function originalRelation(connection, ids){
	console.log(' - originalRelation');

	let query = 'INSERT INTO relationTagOriginal (`tagID`,`originalID`) VALUES (?,?)';
	await ids.tags.forEach( async (item, i , arr) => {
		let [row] = await connection.query( query, [ ids.tags[i], ids.original] );
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
	
	tags = arrayLowerCase(tags);
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
	let tags = item.tags.split(/,/g);
	let ids = {};

	ids.tags = await tagsParse(connection, tags);

	original = await originalCreate(connection, item); // !
	console.log( 'original id: ' + original.insertId );
	ids.original = original.insertId;

	return ids;
}
function templateParse(e, obj){
	var regexp = /<\w*>/ig;

	// console.log('- e:');
	// console.log(e);
	// console.log('-----');

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
			result += e.substring(last_pos,e.length);
			return result;
		}else{
			return e;
		}
	}
}
function arrayUniq(a) {
   return Array.from(new Set(a));
}
function arrayLowerCase(a) {
	var tmp = [];
	for(var i=0; i<a.length; i++){
		tmp.push( a[i].toLowerCase() )
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