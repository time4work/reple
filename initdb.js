#!/usr/bin/env nodejs
/////////////////////////////////////////////
const Mysql = require('./module/mysql');
/////////////////////////////////////////////
var sql 	= new Mysql({});
var queries = {
	'setting': 		'SET foreign_key_checks=0',
	'database': 	'CREATE DATABASE IF NOT EXISTS  replecon',
	'video': 		'CREATE TABLE IF NOT EXISTS replecon.video (id INT AUTO_INCREMENT PRIMARY KEY, link VARCHAR(255))ENGINE = InnoDB',
	// 'thumb':'CREATE TABLE replecon.thumb (id INT AUTO_INCREMENT PRIMARY KEY, link VARCHAR(255), videoID INT(4) NOT NULL, FOREIGN KEY (videoID) REFERENCES replecon.video(id))',
	'title': 		'CREATE TABLE IF NOT EXISTS replecon.title (id INT AUTO_INCREMENT PRIMARY KEY, text VARCHAR(255))ENGINE = InnoDB',
	'description': 	'CREATE TABLE IF NOT EXISTS replecon.desc (id INT AUTO_INCREMENT PRIMARY KEY, text VARCHAR(600))ENGINE = InnoDB',
	'tag': 			'CREATE TABLE IF NOT EXISTS replecon.tag (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))ENGINE = InnoDB',
	'keyword': 		'CREATE TABLE IF NOT EXISTS replecon.keyword (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))ENGINE = InnoDB',
	'object': 		'CREATE TABLE IF NOT EXISTS replecon.object (id INT AUTO_INCREMENT PRIMARY KEY, videoID INT(4) NOT NULL, descriptionID INT(4) NOT NULL, titleID INT(4) NOT NULL, FOREIGN KEY (videoID) REFERENCES replecon.video(id), FOREIGN KEY (descriptionID) REFERENCES replecon.description(id), FOREIGN KEY (titleID) REFERENCES replecon.title(id))ENGINE = InnoDB',
	'project': 		'CREATE TABLE IF NOT EXISTS replecon.project (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), tagID INT(4) NOT NULL, FOREIGN KEY (tagID) REFERENCES replecon.tag(id))ENGINE = InnoDB',
	'relation-tag-object': 		'CREATE TABLE IF NOT EXISTS replecon.relationTagObject (id INT AUTO_INCREMENT PRIMARY KEY, tagID INT(4) NOT NULL,  objectID INT(4) NOT NULL, FOREIGN KEY (tagID) REFERENCES replecon.tag(id), FOREIGN KEY (objectID) REFERENCES replecon.object(id))ENGINE = InnoDB',
	'relation-keyword-object': 	'CREATE TABLE IF NOT EXISTS replecon.relationKeywordObject (id INT AUTO_INCREMENT PRIMARY KEY, keywordID INT(4) NOT NULL,  objectID INT(4) NOT NULL, FOREIGN KEY (keywordID) REFERENCES replecon.keyword(id), FOREIGN KEY (objectID) REFERENCES replecon.object(id))ENGINE = InnoDB',
	// 'relation-category-object':'CREATE TABLE replecon.relationTag (id INT AUTO_INCREMENT PRIMARY KEY, categoryID INT(4) NOT NULL,  objectID INT(4) NOT NULL, FOREIGN KEY (categoryID) REFERENCES replecon.category(id), FOREIGN KEY (objectID) REFERENCES replecon.object(id))',
	'relation-project-object': 	'CREATE TABLE IF NOT EXISTS replecon.relationProjectObject (id INT AUTO_INCREMENT PRIMARY KEY,  objectID INT(4) NOT NULL, projectID INT(4) NOT NULL, FOREIGN KEY (projectID) REFERENCES replecon.project(id), FOREIGN KEY (objectID) REFERENCES replecon.object(id))ENGINE = InnoDB',
};  
connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
});
Object.keys(queries).map(function(objectKey, index) {
	console.log(objectKey);
	var sql = queries[objectKey];
	
	sql.query(sql, function (err, result) {
		if (err) throw err;
	});
});
console.log("DB created");
sql.end();
// connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
//   if (error) throw error;
//   console.log('The solution is: ', results[0].solution);
// });

