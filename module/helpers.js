/////////////////////////////////////////////
const Mysql 	= require('./mysql');	
/////////////////////////////////////////////

module.exports.sqlPush = function(sql_script, callback){
	var sql 	= new Mysql({});

	sql.connect(function(err) {
	  if (err) {
	    console.error('error connecting: ' + err.stack);
	    return;
	  }
	});
	sql.query(sql_script, function (err, result) {
		if (err) throw err;
		console.log("Data pushed in 2 DB");
		callback();
	});
	sql.end();
};

module.exports.sqlPull = function(sql_script, callback){
	var sql 	= new Mysql({});
	sql.connect(function(err) {
	  if (err) {
	    console.error('error connecting: ' + err.stack);
	    return;
	  }
	});
	sql.query(sql_script, function (error, results, fields) {
		// console.log(results);
		var response = JSON.stringify(results);
        var json =  JSON.parse(response);
		if (error) throw err;
		console.log("Data pulled from DB");
		callback(json);
	});
	sql.end();
};

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