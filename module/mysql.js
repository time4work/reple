/////////////////////////////////////////////
const mysql 		= require('mysql');
/////////////////////////////////////////////
module.exports = function(params){
	var connection 	= mysql.createConnection({
	  host     : params.host || 'localhost',
	  user     : params.user || 'test',
	  password : params.password || 'test',
	  database : 'replecon'
	});
	return connection;
}



