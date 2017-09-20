/////////////////////////////////////////////
/////////////////////////////////////////////
module.exports.connection = function(params){
	const  mysql = require('mysql2');
	return mysql.createConnection({
		host     : process.env.DB_HOST 		|| 'localhost',
		user     : process.env.DB_USER 		|| 'test',
		password : process.env.DB_PASSWORD 	|| 'test',
		database : process.env.DB_DATABASE 	|| 'replecon'
	});
};
/////////////////////////////////////////////
/////////////////////////////////////////////
module.exports.synccon = async function(){
	// const connection = await mysql.createConnection(/* ... */) or mysql.createConnection(/* ... */).then( connection => { /* .... */ })
	const  mysql = require('mysql2/promise');
	return await mysql.createConnection({
		host     : process.env.DB_HOST 		|| 'localhost',
		user     : process.env.DB_USER 		|| 'test',
		password : process.env.DB_PASSWORD 	|| 'test',
		database : process.env.DB_DATABASE 	|| 'replecon'
	});
};
/////////////////////////////////////////////
/////////////////////////////////////////////
// const mysql = require('mysql');
// const mysql = require('mysql-pool');
// module.exports.pool = function(params){
// 	var pool 	= mysql.createPool({
// 	    // connectionLimit : 100, //important
// 		host     : params.host || 'localhost',
// 		user     : params.user || 'test',
// 		password : params.password || 'test',
// 		database : 'replecon',
// 	    debug    :  false
// 	});
// 	return pool;
// };



