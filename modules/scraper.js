const Nightmare = require("nightmare");

module.exports.getLink = async function(url) {
    console.log('start getLink Nightmare');
    if (!url) return;
    var video_link;

    console.log('url');
    console.log(url);
    
    await Promise.resolve(
    	Nightmare({
	        'ignore-certificate-errors': true,
	        // show: true,
	    })
    	.goto(url)
        .viewport(1000, 1000)
        .wait(2000)
        .evaluate(function(url) {
            if (url.search(/pornhub\.com/i) != -1)
                return document.querySelector('#player video source').src;
            else if (url.search(/xhamster\.com/i) != -1)
                return document.querySelector('a.player-container__no-player.xplayer').href;
            else
                return " - - unknown donor link - - ";
        }, url)
        .end()
		.then(function(results) {
		    console.log(" - donor video link - ");
		    console.log(results);
		    return new Promise(function(resolve, reject) {
		        resolve(results);
		    })
		})
    )
    // ;
    .then((r) => {
	    console.log(" = donor video link = ");
    	console.log(r);
    	video_link = r;
        return r;
    });

    return video_link;
}


// .then(function(results) {
//     log(results)
//     return new Promise(function(resolve, reject) {
//         var leanLinks = results.map(function(result) {
//             return {
//                 post: {
//                     content: result.content,
//                     productLink: extractLinkFromFb(result.productLink),
//                     photo: result.photo
//                 }
//             }
//         })
//         resolve(leanLinks)
//     })
// })