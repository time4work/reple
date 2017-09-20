#!/usr/bin/env nodejs
/////////////////////////////////////////////
const mysql = require('mysql2');
/////////////////////////////////////////////
const connection 	= mysql.createConnection({
	host     : process.env.DB_HOST 		|| 'localhost',
	user     : process.env.DB_USER 		|| 'test',
	password : process.env.DB_PASSWORD 	|| 'test',
});
/////////////////////////////////////////////
var queries = {
	'setting': 		'SET foreign_key_checks=0',
	'database': 	'CREATE DATABASE IF NOT EXISTS  replecon',
	'project': 		'CREATE TABLE IF NOT EXISTS replecon.project (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))ENGINE = InnoDB',
	'tag': 			'CREATE TABLE IF NOT EXISTS replecon.tag (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))ENGINE = InnoDB',
	'original': 	'CREATE TABLE IF NOT EXISTS replecon.original (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), link VARCHAR(255), video VARCHAR(255),  description VARCHAR(600))ENGINE = InnoDB',
	'object': 		'CREATE TABLE IF NOT EXISTS replecon.object (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description VARCHAR(600) NOT NULL, originID INT(4) NOT NULL, FOREIGN KEY (originID) REFERENCES replecon.original(id))ENGINE = InnoDB',

	'relation-tag-original': 	'CREATE TABLE IF NOT EXISTS replecon.relationTagOriginal (id INT AUTO_INCREMENT PRIMARY KEY, tagID INT(4) NOT NULL,  originalID INT(4) NOT NULL, FOREIGN KEY (tagID) REFERENCES replecon.tag(id), FOREIGN KEY (originalID) REFERENCES replecon.original(id))ENGINE = InnoDB',
	'relation-tag-project': 	'CREATE TABLE IF NOT EXISTS replecon.relationTagProject (id INT AUTO_INCREMENT PRIMARY KEY, projectID INT(4) NOT NULL,  tagID INT(4) NOT NULL, positive BOOLEAN NOT NULL , FOREIGN KEY (projectID) REFERENCES replecon.project(id), FOREIGN KEY (tagID) REFERENCES replecon.tag(id))ENGINE = InnoDB',
	'relation-project-object': 	'CREATE TABLE IF NOT EXISTS replecon.relationProjectObject (id INT AUTO_INCREMENT PRIMARY KEY, projectID INT(4) NOT NULL,  objectID INT(4) NOT NULL, FOREIGN KEY (projectID) REFERENCES replecon.project(id), FOREIGN KEY (objectID) REFERENCES replecon.object(id))ENGINE = InnoDB',
	// 'relation-keyword-object': 	'CREATE TABLE IF NOT EXISTS replecon.relationKeywordObject (id INT AUTO_INCREMENT PRIMARY KEY, keywordID INT(4) NOT NULL,  objectID INT(4) NOT NULL, FOREIGN KEY (keywordID) REFERENCES replecon.keyword(id), FOREIGN KEY (objectID) REFERENCES replecon.object(id))ENGINE = InnoDB',
};  
connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
});
Object.keys(queries).map(function(key, index) {
	console.log("]["+key);
	var sql_queries = queries[key];
	
	connection.query(sql_queries, function (err, result) {
		if (err) throw err;
	});
});
console.log("DB created");
connection.end();

