/////////////////////////////////////////////
const SQL 			 		= require('./mysql').connection;
// const SQLSync 			= require('./mysql').syncconnection;
const ASYNSQL 				= require('./mysql').synccon;
// const sqlPool 			= require('./mysql').pool;	
// const connection 		= new sqlConnection({});
// const pool 				= new sqlPool({});
/////////////////////////////////////////////

module.exports.sqlPush = (query, callback) => {
	// var connection 	= new sqlConnection({});
	// connection.connect(function(err) {
	// 	if (err) {
	// 		console.error('error connecting: ' + err.stack);
	// 		return;
	// 	}
	// });
	var connection 		= new SQL();
	connection.query(query, (error, result) => {
		if (error) {
			console.error('query error: ' + err.stack);
			return;
		}
		console.log("Data pushed in 2 DB");
		callback();
	});
	connection.end();
};
/////////////////////////////////////////////

module.exports.sqlPull = (query, callback) => {
	var connection 		= new SQL();
	connection.query(query, (error, results, fields) => {
		if (error) {
			console.error('query error: ' + error.stack);
			return;
		}
		var response = JSON.stringify(results);
        var json =  JSON.parse(response);
		console.log("Data pulled from DB");
		callback(json);
	});
	connection.end();
};
/////////////////////////////////////////////
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
	console.log(result);
	return result[0];
}
async function originalRelation(connection, ids){
	console.log(' - originalRelation');

	let query = 'INSERT INTO relationTagOriginal (`tagID`,`originalID`) VALUES (?,?)';
	await ids.tags.forEach( async (item, i , arr) => {
		let [row] = await connection.execute( query, [ ids.tags[i], ids.original] );
	});
}
async function tagsParse(connection, tags){
	console.log(' - tagsParse');
	console.log(tags);

	let tagIds = [];
	await tags.forEach( async function(tag, i, arr){  // !
		let id = await tagInit(connection,tag);
		await tagIds.push( id );
	});

	// console.log(' = tagsParse');
	// console.log(tagIds);
	return tagIds;
}
async function tagInit(connection, tag){
	console.log(' - tagInit');
	console.log(tag);
		let id = -1;
		let result = await tagSearch(connection, tag); // !

		if(result.rows.length != 0){
			id = result.rows[0].id;
		}else{
			var tmp = await tagInsert(connection, tag); // !
			console.log(tmp);
			id = tmp.insertId;
			console.log(id);
		}
		if(id == -1) {
			console.log("[!] TAG ID ERROR");
			return;
		}
		console.log(id);
		return id;
}
async function magic(connection, item){
	let tags 			= item.tags.split(/,/g);
	// let ids 			= {original:[],tags:[]};
	let ids 			= {};

	ids.tags = await tagsParse(connection, tags);

	original = await originalCreate(connection, item); // !
	console.log(original.insertId);
	ids.original = original.insertId;
	console.log(ids);

	return ids;
}
module.exports.loadJson = async function(json, callback){ // !

	for (var iter=0; iter<4; iter++) {
		console.log(-1);
		let item = json[iter];
	// await json.forEach( async (item, iter ,array) => {
		// await magic(item);
		try {
			// setTimeout( 
				// async ()=>{
				const connection 	= await ASYNSQL(); // !
				let ids = await magic(connection,item);
				console.log('[] relation');
				await originalRelation(connection,ids);
			// }
			// , 1000);


			// let success = await magic(item);
			// (success)
			// ? console.log('+')
			// : console.log('-');

		} catch (e) {
			console.log(e);
			return 0;
		}
	// });
	}
	console.log(' [] loadJson finished');
	callback();
};
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

module.exports.query = function(sql_script, callback){
	var connection 	= new sqlConnection({});
	console.log(0);
	connection.connect(function(err) {
		if (err) {
			console.error('error connecting: ' + err.stack);
			return;
		}
	});
	var query = 'SELECT * FROM replecon.tag WHERE ?';
	connection.query(query,{'name': 'tag'}, (error, results, fields) => {
		if (error) {
			console.log( error );
			return;
		}
		else {
			console.log( results );
			console.log( fields );
			callback();
		}
	});
	connection.end();
};
/////////////////////////////////////////////

module.exports.saveJson = function(filename, obj){
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
};