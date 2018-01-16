
const ffmpeg = require('fluent-ffmpeg');
const dir = './screens/';

module.exports.makeThumbs = async function(url, callback) {
    console.log('start getScreenShoot ffmpeg');

    var filenames,
    	duration;

    // var result = 
    await takeScreen(url, 1, '15%' , async (screen1)=>{
    	await takeScreen(url, 2, '30%' , async (screen2)=>{
	    	await takeScreen(url, 3, '45%' , async (screen3)=>{
		    	await takeScreen(url, 4, '60%' , async (screen4)=>{
		    		await takeScreen(url, 5, '75%' , async (screen5)=>{
						if(callback){
							names = [
								screen1.name, 
								screen2.name, 
								screen3.name, 
								screen4.name, 
								screen5.name,
							];
							await callback({
								names: names,
								duration: screen1.duration
							});
						}
						return {
								names: names,
								duration: screen1.duration
							}
		    		});
		    	});
		    });
    	});
    });

	// if(callback)
	// 	await callback(result);
		// await callback({
		// 	filenames : filenames,
		// 	duration: duration
		// });
}
function makeid(length) {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	if(!length) length = 6

	for (var i = 0; i < length; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}
async function takeScreen(url, prefix, timemark, callback){
	var duration;
	var name;

	new Promise((resolve, reject) => {
		ffmpeg(url)
			.videoBitrate('800k')
			.on('codecData', function(data) {
				console.log('Input duration is [' + data.duration + '] with ' + data.video + ' video');
				duration = data.duration;
			})
			.on('filenames', function(filenames) {
			    console.log(' - Will generate ' + filenames.join(', ') + ' into tempfiles.');
			    name = filenames[0];
			})
			.on('end', function() {
			    console.log('Screenshots successfully taken');
			    resolve({duration,name});
			})
			.on('error', function(err, stdout, stderr) {
				console.log(" [*] ffmpeg err:\n" + err);
				console.log(" [*] ffmpeg stdout:\n" + stdout);
				console.log(" [*] ffmpeg stderr:\n" + stderr);
				reject( new Error("screen failed 2 create") );
			})
			.takeScreenshots({
				count: 1,
				filename: 'thumb_'+ makeid(7) +'_%w_'+prefix,
				timemarks: [ timemark ]
			}, dir);
	}).then(
		async result => {
			// первая функция-обработчик - запустится при вызове resolve
			console.log("Fulfilled: " ); // result - аргумент resolve
			console.log(result);

			if(callback)
				await callback(result);
			return result;
		},
		error => {
			// вторая функция - запустится при вызове reject
			console.log("Rejected ffmpeg Promise: " + error.message); // error - аргумент reject
	    }
	);
}
// filename
// %s - offset in seconds
// %w - screenshot width
// %h - screenshot height
// %r - screenshot resolution ( widthxheight )
// %f - input filename
// %b - input basename ( filename w/o extension )
// %i - number of screenshot in timemark array ( can be zeropadded by using it like %000i )

// .screenshots({
//     filename: filename,
//     timemarks: ['20:50.123'],
//     size: '320x240',
//     folder: dir
// })