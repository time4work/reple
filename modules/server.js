/////////////////////////////////////////////
// const url 			= require('url');
const querystring 	= require('querystring');
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
		response.render('pages/index',{title : 'Happy ejs' });
	}); 

	app.get('/projects', async (request, response) => {
		await helpers.selectProjectsRelation( (result) => {
			console.log(result);
			response.render('pages/projects',{scope : result});
		});
	});

	app.get('/newproject', async (request, response) => {
		await helpers.selectTags((result) => {
			response.render('pages/newproject',{scope : {tags:result }});
		});
	});
	app.post('/newproject', async (request, response) => {
		await helpers.createProject(request.body, () => {
			response.redirect('/projects');
		});		
	});

	app.get('/project/:id', async (request, response)=>{ 
		let project_id = request.params.id;

		await helpers.selectProject(project_id, async (result) => {
			await helpers.selectTags( async (result2) => {
				await helpers.selectProjectTags(project_id, async (result3) => {
					await helpers.selectProjectSize(project_id, (result4) => {
						response.render('pages/project',{ scope : { project:result[0], tags:result2, relation: result3, size: result4 } } );
					});
				});
			});
		});
	}); 
	app.post('/project/:id', async function(request, response){ // <<<<<<<<<<<<<<<<<<<<<<<
		console.log(request.body);
		var pi = request.body.project_id;
		var ti = request.body.tag_id;
		var query = "INSERT INTO relationTagProject (`tagID`, `projectID`, `positive`) VALUES (?, ?, ?);";
		
		await helpers.query(query, [ti, pi, 1], (result) => {
			console.log(result);
	    	response.send('All done');
		});
	}); // <<<<<<<<<<<<<<<<<<<<<<<

	app.get('/tags', async (request, response) => {
		await helpers.selectTags((result) => {
			response.render('pages/tags',{array : result});
		});
	});
	app.post('/tags', async (request, response) => {
		let name = request.body.name;

		await helpers.createTag(name, (result) => {
			response.redirect('/tags');
		});
	});

	app.get('/json', (request, response) => {
		response.render('pages/json');
	});
	app.post('/json', async (request, response) => {
		let obj = JSON.parse(request.body.data);
		await helpers.loadJson(obj, async (result) => {
			response.redirect('/json');
		});
		console.log('await end')
	});

	app.get('/rewrite', async (request, response) => {
		await helpers.selectProjects( (result) => {
			response.render('pages/rewrite',{array : result});
		});
	});
	app.post('/rewrite', async (request, response) => {
		// console.log(request.body);
		let query = await querystring.stringify({
			project: request.body.project
		});
		response.redirect('/rewriter?' + query);
	});
	
	app.get('/rewriter', async (request, response) => {
		await helpers.selectRandomOriginal(request.query.project, async (data) => {	
			console.log({object: data});
			response.render('pages/rewriter', {object: data, project:{id:request.query.project}});
		});
	});
	app.post('/rewriter', async (request, response) => {
		console.log(request.body);
		await helpers.saveObject(request.body, async (result)=>{
			console.log('Object saved');
			response.status(200);
			response.redirect('/rewriter?project=' + request.body.project_id);
		});
		// response.redirect('/rewriter?' + query);
	});

	app.get('/query', async (request, response) => {
		response.render('pages/query');
	});
	app.post('/query', async (request, response) => {
		console.log(request.body);
		await helpers.sshQuery(request.body, async (result)=>{
			response.send(result);
		});
	});

	// 404, 500
    app.use( (error, request, response, next) => {
		console.log('error' + error);
        response.status(error.status || 500);
        response.render('error', {
            message: error.message,
            error: error
        });
    });
	// app.listen('8080', '127.0.0.1');
	app.listen(app.get('port'), () => {
	  console.log('Node app is running on port', app.get('port'));
	});
	return app;
}



