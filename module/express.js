/////////////////////////////////////////////
const path 			= require('path');
const express 		= require('express');
const favicon 		= require('serve-favicon');
const expressLogging= require('express-logging');
const logger 		= require('logops');
const bodyParser 	= require('body-parser');
const helpers 		= require('./helpers');
/////////////////////////////////////////////
module.exports = function(params){
	var dir 		= params.rootdir;
	var port 		= process.env.port || 5000;
	var app 		= express();

	app.set('port', (process.env.PORT || port) );
	app.set('views', dir + '/views');
	app.set('view engine', 'ejs');
	app.set('env', 'development');
	app.use( expressLogging(logger)) ;
	app.use( express.static(dir + '/public') );
	app.use( bodyParser.json({limit: '50mb'}) );
	app.use( bodyParser.urlencoded({ extended: false,limit: '50mb', parameterLimit:50000 }) );
	app.use( favicon('public/favicon.ico'));
	app.use( (request, response, next) => {
		var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
		console.log('________');
		console.log('Client IP:', ip);
		console.log(request.method);
		console.log(request.url);
		next();
	});	

	app.get('/', (request, response) => {
		sql_script = "SELECT * FROM tag";
		helpers.sqlPull(sql_script, (result) => {
			response.render('pages/index',{title : 'Happy ejs', arr : result});
		});
	});
	app.post('/', (request, response) => {
		sql_script = "INSERT INTO tag(`name`) VALUES('"+request.body.str+"')";
		helpers.sqlPush(sql_script);
	});

	app.get('/projects', (request, response) => {
		sql_script = "SELECT p.id, p.name, t.name as 'tag' FROM project p, tag t where p.tagID = t.id";
		sql_script2 = "SELECT * FROM tag";
		helpers.sqlPull(sql_script, (result) => {
			helpers.sqlPull(sql_script2, (result2) => {
				response.render('pages/project',{object : {projects:result,keywords:result2 }});
			});
		});
	});
	app.post('/projects', (request, response) => {
		sql_script = "INSERT INTO project(`name`,`tagID`) VALUES('"+request.body.name+"',"+request.body.tag+")";
		helpers.sqlPush(sql_script, () => {
			response.redirect('/projects');
		});		
	});

	app.get('/tags', (request, response) => {
		sql_script = "SELECT * FROM tag";
		helpers.sqlPull(sql_script, (result) => {
			response.render('pages/tags',{array : result});
		});
	});
	app.post('/tags', (request, response) => {
		sql_script = "INSERT INTO tag(`name`) VALUES('"+request.body.name+"')";
		helpers.sqlPush(sql_script, (result) => {
			response.redirect('/tags');
		});
	});

	app.get('/keywords', (request, response) => {
		sql_script = "SELECT * FROM keyword";
		helpers.sqlPull(sql_script, (result) => {
			response.render('pages/keywords',{array : result});
		});	
	});
	app.post('/keywords', (request, response) => {
		sql_script = "INSERT INTO keyword(`name`) VALUES('"+request.body.name+"')";
		console.log('new tag name: ' + request.body.name);
		helpers.sqlPush(sql_script, (result) => {
			response.redirect('/keywords');
		});
	});


	app.get('/json', (request, response) => {
		response.render('pages/json',{title : 'Sad ejs'});
	});
	app.post('/json', (request, response) => {
		// sql_script = "INSERT INTO keyword(`name`) VALUES('"+request.body.name+"')";
		console.log(request.body);
		// helpers.sqlPush(sql_script, (result) => {
			response.redirect('/json');
		// });
	});

	app.get('/rewrite', (request, response) => {
		sql_script = "SELECT * FROM project";
		helpers.sqlPull(sql_script, (result) => {
			response.render('pages/rewrite',{array : result});
		});
	});
	app.post('/rewrite', (request, response) => {
		console.log(request.body);

		// sql_script = "INSERT INTO keyword(`name`) VALUES('"+request.body.name+"')";
		// console.log('new tag name: ' + request.body.name);
		// sql_script2 = "SELECT * FROM keyword";
		// sql_script3 = "DELETE FROM `tag` WHERE `id`='"+request.body.id+"';";
		// helpers.sqlPush(sql_script, (result) => {			
			response.render('pages/rewriter');
		// });
	});


	// 404, 500
    app.use( (err, req, res, next) => {
		console.log('error' + err);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
	// app.listen('8080', '127.0.0.1');
	app.listen(app.get('port'), () => {
	  console.log('Node app is running on port', app.get('port'));
	});
	return app;
}



