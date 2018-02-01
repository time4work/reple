////////////////////////////////////////////////////////
//////////////////thumbMaker///////////////////////////
//////////////////////////////////////////////////////
const scraperModule     = require('./scraper');
const ffmpegModule  = require('./ffmpeg');
const ASYNSQL   = require('./mysql').asynccon;
const Xvfb    = require('xvfb');

let thumbMaker = class {
    constructor(dir){
        this.dir = dir;
        this.process = true;
        this.xvfb = new Xvfb();
    }
    kill(){
        this.process = false;
    }
    // main
    async make(objects){
        this.process = true;
        this.xvfb.startSync();
        console.log('._._._.');
        for(var i=0; i<=objects.length; i++){
			//  simpleThumbsNames
			// 	baseThumbName
			// 	bigThumbName
			// 	duration
            var namePrefix = makeid(7);

            console.log('catch obj ['+i+']');

            if(!this.process) break;

            if( !objects[i].DataLink2 || !objects[i].DataLink3 || !objects[i].DataLink4 ) 
                await scraperModule.getLink(objects[i].DataLink1)
            	.then((result)=>{
					console.log(' -> result video link');
            		console.log(result);

            		if(result) this.videolink = result;
            	})
            	.then(async()=>{ // do makeBaseThumb
            		console.log(' --> do baseThumb');
            		if(this.videolink && !objects[i].DataLink3){
                        let res = await this.makeBaseThumb(namePrefix);
                        if(res){
                            this.duration = res.duration;
                            this.baseThumbName = res.name;
                            return res;
                        }                        
            		}
            		return 0;
            	}) 
            	.then(async(params)=>{ // save makeBaseThumb,duration
            		console.log(' ---> save baseThumb');
            		if(params){
                        await this.saveBaseThumb(objects[i].id);
                        
                        if(!objects[i].DataText3)
                            await this.saveDuration(objects[i].id);
            		}
            	})
            	.then(async()=>{  // do bigThumbName
            		console.log(' --> do bigThumb');
            		if(this.videolink && !objects[i].DataLink4){
                        let res = await this.makeBigThumb(namePrefix);
                        if(res){
                            this.duration = res.duration;
                            this.bigThumbName = res.name;
                            return res;
                        }
            		}
            		return 0;
            	})
            	.then(async(params)=>{  // save bigThumbName,duration
            		console.log(' ---> save bigThumb');
            		if(params){
            			await this.saveBigThumb(objects[i].id);

                        if(!objects[i].DataText3)
                            await this.saveDuration(objects[i].id);
            		}
            	})
            	.then(async()=>{ // do makeSimpleThumbs
            		console.log(' --> do simpleThumbs');
            		if(this.videolink){
                        let res = await this.makeSimpleThumbs(namePrefix);
                        if(res){
                            this.duration = res.duration;
                            this.simpleThumbNames = res.names;
                            return res;
                        }
            			// return [simpleThumbsNames,duration] = await this.makeThumbs();
            			// return await this.makeSimpleThumbs();
            		}
            		return 0;
            	})
                .then(async(params)=>{ // save simpleThumbsNames,duration
                    console.log(' ---> save simpleThumbs');
                    if(params){
                        await this.saveSimpleThumbs(objects[i].id);
                        
                        if(!objects[i].DataText3)
                            await this.saveDuration(objects[i].id);
                    }
                }) 
            	.catch(err => console.error(err));
        }
        this.xvfb.stopSync();
    }
    // save duration
    async saveDuration(objectID){
        return await addDurationToObject(objectID, this.duration);
    }
    // save Thumbs
    async saveSimpleThumbs(objectID){
        let text = this.simpleThumbNames.join(',');
        return await addSimpleThumbsToObject(objectID, text);
    }
    async saveBaseThumb(objectID){
		return await addBaseThumbToObject(objectID, this.baseThumbName);
    }
    async saveBigThumb(objectID){
		return await addBigThumbToObject(objectID, this.bigThumbName);
    }
    // make Thumbs
    async makeSimpleThumbs(namePrefix){
        return await ffmpegModule.makeSimpleThumbs(this.videolink, namePrefix, this.dir);
    }
    async makeBaseThumb(namePrefix){
        return await ffmpegModule.makeBaseThumb(this.videolink, namePrefix, this.dir);
    }
    async makeBigThumb(namePrefix){
        return await ffmpegModule.makeBigThumb(this.videolink, namePrefix, this.dir);
    }
};
async function myquery(query, params, callback){ // !
    try {
        const connection    = await ASYNSQL(); // !
        let result = await connection.execute( query, params ); // !
        connection.end();

        if(callback)
            await  callback( result, params ); // !
        return result[0];

    } catch (e) {
        console.log(e);
        return 0;
    }
};
async function addDurationToObject(objectID, text) {
    try {
        let query = "UPDATE object"
        + " SET DataText3 = ?"
        + " WHERE id = ? ";
        let result = await myquery(query, [ text , objectID ]);
        console.log('addDurationToObject');
        console.log(result);

        return result;
    } catch (e) {
        console.log(e);
        return 0;
    }
}
async function addSimpleThumbsToObject(objectID, text) {
    try {
        let query = "UPDATE object"
        + " SET DataLink2 = ?"
        + " WHERE id = ? ";
        let result = await myquery(query, [ text , objectID ]);
        console.log('addSimpleThumbsToObject');
        console.log(result);

        return result;
    } catch (e) {
        console.log(e);
        return 0;
    }
}
async function addBaseThumbToObject(objectID, text) {
	try {
		let query = "UPDATE object"
		+ " SET DataLink3 = ?"
		+ " WHERE id = ? ";
		let result = await myquery(query, [ text , objectID ]);
		console.log('addBaseThumbToObject');
		console.log(result);

		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
async function addBigThumbToObject(objectID, text) {
	try {
		let query = "UPDATE object"
		+ " SET DataLink4 = ?"
		+ " WHERE id = ? ";
		let result = await myquery(query, [ text , objectID ]);
		console.log('addBigThumbToObject');
		console.log(result);

		return result;
	} catch (e) {
		console.log(e);
		return 0;
	}
}
function makeid(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    if(!length) length = 6

    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
module.exports = thumbMaker;