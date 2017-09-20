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
		query = "SELECT * FROM tag";
		helpers.sqlPull(query, (result) => {
			response.render('pages/index',{title : 'Happy ejs', arr : result});
		});
	});
	app.post('/', (request, response) => {
		query = "INSERT INTO tag(`name`) VALUES('"+request.body.str+"')";
		helpers.sqlPush(query);
	});

	app.get('/projects', (request, response) => {
		// query = "SELECT p.id, p.name, t.name as 'tag' FROM project p, tag t where p.tagID = t.id";
		query = "SELECT * FROM project";
		query2 = "SELECT * FROM tag";
		helpers.sqlPull(query, (result) => {
			helpers.sqlPull(query2, (result2) => {
				response.render('pages/project',{object : {projects:result,keywords:result2 }});
			});
		});
	});
	app.post('/projects', (request, response) => {
		query = "INSERT INTO project(`name`) VALUES('"+request.body.name+"')";
		helpers.sqlPush(query, () => {
			response.redirect('/projects');
		});		
	});

	app.get('/tags', (request, response) => {
		query = "SELECT * FROM tag";
		helpers.sqlPull(query, (result) => {
			response.render('pages/tags',{array : result});
		});
	});
	app.post('/tags', (request, response) => {
		query = "INSERT INTO tag(`name`) VALUES('"+request.body.name+"')";
		helpers.sqlPush(query, (result) => {
			response.redirect('/tags');
		});
	});

	app.get('/keywords', (request, response) => {
		query = "SELECT * FROM keyword";
		helpers.sqlPull(query, (result) => {
			response.render('pages/keywords',{array : result});
		});	
	});
	app.post('/keywords', (request, response) => {
		query = "INSERT INTO keyword(`name`) VALUES('"+request.body.name+"')";
		console.log('new tag name: ' + request.body.name);
		helpers.sqlPush(query, (result) => {
			response.redirect('/keywords');
		});
	});


	app.get('/json', (request, response) => {
		response.render('pages/json',{title : 'Sad ejs'});
	});
	app.post('/json', async (request, response) => {
		console.log(-2);
		await helpers.loadJson(JSON.parse(request.body.data), (result) => {
			console.log('end');
			response.redirect('/json');
		});
		console.log('await end')
		// helpers.query( JSON.parse(request.body.data), (result) => {
		// 	response.redirect('/json');
		// });
	});

	app.get('/rewrite', (request, response) => {
		query = "SELECT * FROM project";
		helpers.sqlPull(query, (result) => {
			response.render('pages/rewrite',{array : result});
		});
	});
	app.post('/rewrite', (request, response) => {
		console.log(request.body);		
		response.redirect('rewriter');
	});
	app.get('/rewriter', (request, response) => {
		response.render('pages/rewriter');
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



