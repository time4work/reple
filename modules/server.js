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
		console.log(request.body);
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
	app.post('/projects', async (request, response) => {
		let name = request.body.name;

		switch(request.body.type){
			case "search":
				await helpers.searchProject(name, (result) => {
					response.send(result);
				});
				break;
			default:
				console.log("WRONG type: "+request.body.type);
		}
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

	app.get('/info', async (request, response) => {
		await helpers.selectOriginalSize((result) => {
			response.render('pages/info', {scope:{size:result}} );
		});
	});

	app.get('/templates', async (request, response) => {
		await helpers.selectTmpls( async (result) => {
			response.render('pages/templates', {array: result });
		});
		
	});
	app.post('/templates', async (request, response) => {
		let name = request.body.name;
		if(!name)
			response.send("oops");
		else
			switch(request.body.type){
				case "search":
					await helpers.searchTmpl(name, (result) => {
						response.send(result);
					});
					break;
				case "add":
					await helpers.createTmpl(name, (result) => {
						response.redirect('/templates');
					});
					break;
				default:
					response.send("oops");
			}
	});
	// app.get('/newtemplate', async (request, response) => {
	// 	response.render('pages/newtemplate');
	// });

	app.get('/template', async (request, response) => {
		response.render('pages/templatea');
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

	}); // <<<<<<<<<<<<<<<<<<<<<<< !!!!!!!!!!

	app.get('/tags', async (request, response) => {
		await helpers.selectTagsEx((result) => {
			console.log(result);
			response.render('pages/tags',{array : result});
		});
	});
	app.post('/tags', async (request, response) => {
		let name = request.body.name;

		switch(request.body.type){
			case "search":
				await helpers.searchTag(name, (result) => {
					response.send(result);
				});
				break;
			case "add":
				await helpers.createTag(name, (result) => {
					response.redirect('/tags');
				});
				break;
			default:
		}
	});

	app.get('/tag/:id', async (request, response) => {
		let tag_id = request.params.id;

		await helpers.selectTag(tag_id, async (result) => {
			console.log(result);
			await helpers.selectNullTags( async (result2) => {
				console.log(result2);
				await helpers.selectTagSyns(tag_id, async (result3) => {
					console.log(result3);
					await helpers.selectFlagTemplates(tag_id, async (result4) => {
						console.log(result4);
						response.render('pages/tag',{ scope : { tag:result[0], tags:result2, syns: result3, templates:result4 } } );
					});
					// response.render('pages/tag',{ scope : { tag:result[0], tags:result2, relation: result3 } } );
				});
			});
		});
	});
	app.post('/tag/:id', async function(request, response){ 
		let tag_id = request.params.id;

		switch(request.body.type){
			case "save":
				console.log("save");
				let name = request.body.name;
				let syns = request.body.syns;
				let syn_arr = syns.split(',').map((x)=>{ return parseInt(x)});

				await helpers.saveTagChanges(tag_id, name, syn_arr, ()=>{
					response.redirect('/tag/'+tag_id);
				})
				break;
			case "newTempl":
				console.log("newTemplate");
				let key = request.body.key;
				let val = request.body.val;
				await helpers.createTagTemplate(tag_id, key, val, (result) => {
					response.send(result);
				});
				break;
			case "delTmpl":
				let tmpl_id = request.body.id;
				await helpers.deleteTagTemplate(tag_id, tmpl_id, (result) => {
					response.send(result);
				});
				break;
			default:
				console.log(" O O O P S . . . ");
				response.send({err:'o o o p s'});
		}
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
	// app.post('/rewriter', async (request, response) => {
	// 	console.log(request.body);
	// 	await helpers.saveObject(request.body, async (result)=>{
	// 		console.log('Object saved');
	// 		response.status(200);

	// 		let query = await querystring.stringify({
	// 			project: request.body.project_id
	// 		});
	// 		response.redirect('/rewriter?' + query);
	// 	});
	// });

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
        // response.status(error.status || 500);
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



