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
	'setting-FK-check': 	'SET foreign_key_checks=0',
	'database': 	'CREATE DATABASE IF NOT EXISTS  replecon',
	'project': 		'CREATE TABLE IF NOT EXISTS replecon.project (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255),  description VARCHAR(1500))ENGINE = InnoDB',
	'tag': 			'CREATE TABLE IF NOT EXISTS replecon.tag (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), flag INT(4) )ENGINE = InnoDB',
	'original': 	'CREATE TABLE IF NOT EXISTS replecon.original (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), link VARCHAR(600), video VARCHAR(600),  description VARCHAR(1500))ENGINE = InnoDB',
	'object': 		'CREATE TABLE IF NOT EXISTS replecon.object (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description VARCHAR(1500) NOT NULL, originID INT(4) NOT NULL, FOREIGN KEY (originID) REFERENCES replecon.original(id))ENGINE = InnoDB',
	'template': 	"CREATE TABLE IF NOT EXISTS replecon.template(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(255))ENGINE = InnoDB",
	'template-key': "CREATE TABLE IF NOT EXISTS replecon.templateKey(id INT AUTO_INCREMENT PRIMARY KEY, keyword VARCHAR(255),val VARCHAR(255),tmplID int(4) NOT NULL,FOREIGN KEY (tmplID) REFERENCES replecon.template(id))ENGINE = InnoDB",
	'template-condition': "CREATE TABLE IF NOT EXISTS replecon.templateCondition(id INT AUTO_INCREMENT PRIMARY KEY, tagID int(4) NOT NULL,tmplKeyID int(4) NOT NULL,keyword BOOLEAN NOT NULL,FOREIGN KEY (tagID) REFERENCES replecon.tag(id),FOREIGN KEY (tmplKeyID) REFERENCES replecon.templateKey(id))ENGINE = InnoDB",

	'tag-template': 	'CREATE TABLE IF NOT EXISTS replecon.tagTemplates (id INT AUTO_INCREMENT PRIMARY KEY, keyword VARCHAR(255), val VARCHAR(600), flag INT(4) )ENGINE = InnoDB'

	'relation-tag-original': 	'CREATE TABLE IF NOT EXISTS replecon.relationTagOriginal (id INT AUTO_INCREMENT PRIMARY KEY, tagID INT(4) NOT NULL,  originalID INT(4) NOT NULL, FOREIGN KEY (tagID) REFERENCES replecon.tag(id), FOREIGN KEY (originalID) REFERENCES replecon.original(id))ENGINE = InnoDB',
	'relation-tag-project': 	'CREATE TABLE IF NOT EXISTS replecon.relationTagProject (id INT AUTO_INCREMENT PRIMARY KEY, tagID INT(4) NOT NULL,  projectID INT(4) NOT NULL, positive BOOLEAN NOT NULL , FOREIGN KEY (projectID) REFERENCES replecon.project(id), FOREIGN KEY (tagID) REFERENCES replecon.tag(id))ENGINE = InnoDB',
	// 'relation-tag-syn': 		'CREATE TABLE IF NOT EXISTS replecon.relationTagSyn (id INT AUTO_INCREMENT PRIMARY KEY, tagID INT(4) UNIQUE NOT NULL,  flag INT(4) NOT NULL, FOREIGN KEY (tagID) REFERENCES replecon.tag(id))ENGINE = InnoDB',
	'relation-project-object': 	'CREATE TABLE IF NOT EXISTS replecon.relationProjectObject (id INT AUTO_INCREMENT PRIMARY KEY, projectID INT(4) NOT NULL,  objectID INT(4) NOT NULL, FOREIGN KEY (projectID) REFERENCES replecon.project(id), FOREIGN KEY (objectID) REFERENCES replecon.object(id))ENGINE = InnoDB',

	// 'tag-index': 'CREATE FULLTEXT INDEX `sad_idx_tag_name`  ON tag (name) COMMENT '' ALGORITHM DEFAULT LOCK DEFAULT',
	// 'project-index': 'CREATE FULLTEXT INDEX `sad_idx_project_name`  ON project (name) COMMENT '' ALGORITHM DEFAULT LOCK DEFAULT',
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

