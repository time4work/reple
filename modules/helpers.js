/////////////////////////////////////////////
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
module.exports.createProject = async (data, callback) => {
	try {
		var query = "INSERT INTO project (`name`, `description`) VALUES (? , ?)";
		
		let result = await myquery(query, [ data.name, data.description ]);
		
		if(data.tags)
		{	
			var query2 = "INSERT INTO relationTagProject (`tagID`, `projectID`, `positive`) VALUES (?, ?, ?)";
			for( var i=0; i < data.tags.assoc.length; i++ ){
				await myquery(query2, [ data.tags.assoc[i], result.insertId, 1 ]);
			}		
			for( var i=0; i < data.tags.stop.length; i++ ){
				await myquery(query2, [ data.tags.stop[i], result.insertId, 0 ]);
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
/////////////////////////////////////////////

module.exports.createTag = async (name, callback) => {
	try {
		let query = "INSERT INTO tag(`name`) VALUES('?')";
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
module.exports.saveObject = async (data, callback)=>{
	console.log(' - objectCreate');

	let query = 'INSERT INTO object (`title`,`description`,`originID`) VALUES (?,?,?)';
	let result = await myquery(query, [ data.title, data.description, data.original_id] ); // !

	let query2 = 'INSERT INTO relationProjectObject (`projectID`, `objectID`) VALUES (?, ?);';
	await myquery(query2, [ data.project_id, result.insertId ] ); // !

	console.log(' = objectCreate result f()');
	console.log(result);
	await callback(result[0]);
	return result[0];
}
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
				await callback(result);
			})
		});
	} catch (e) {
		console.log(e);
		return 0;
	}
};
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
async function selectOriginal(connection, originalID, callback){
	try {
		let query = 'SELECT * FROM original WHERE id = ?';
		let fields = await connection.execute( query, [originalID] ); // !
		let result = fields[0][0];

		console.log('/__T_H_E_P_L_A_C_E__');
		console.log(result);
		await spinText(result.title, async (title)=>{
			console.log(title);
			result.title = title;
			await spinText(result.description, async (description)=>{
				console.log(description);
				result.description = description;
				await callback(result);
				return result;
			});
		});
		console.log('\\__T_H_E_P_L_A_C_E__');
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

	let tagIds = [];
	await Promise.all(tags.map( async (tag) => {  // !

		var id = await tagInit(connection,tag);

		console.log('tag id: '+id);

		await tagIds.push( id );
		
		console.log('tags id:');
		console.log(tagIds);
	}));

	return tagIds;
}
async function magic(connection, item){
	let tags 			= item.tags.split(/,/g);
	// let ids 			= {original:[],tags:[]};
	let ids 			= {};

	ids.tags = await tagsParse(connection, tags);
	// console.log('tags ids: ' + ids.tags);

	original = await originalCreate(connection, item); // !
	console.log('original id: '+original.insertId);
	ids.original = original.insertId;

	return ids;
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