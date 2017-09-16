'use strict'
console.log('script');
///////////////////////////////////////////////////////////
window.onload = function() {
    var proj    = document.getElementById('project-form');
    var tag     = document.getElementById('tag-form');
    var key     = document.getElementById('key-form');
    var json    = document.getElementById('json-form');
    var rewrite = document.getElementById('rewrite-form');
    var rewriter = document.getElementById('rewriter-form');

    if(proj) proj.addEventListener("submit", projForm); else
    if(tag) tag.addEventListener("submit", tagForm); else
    if(key) key.addEventListener("submit", keyForm); else
    if(json) json.addEventListener("submit", jsonForm); else
    if(rewrite) rewrite.addEventListener("submit", rewriteForm); else
    if(rewriter) rewriter.addEventListener("submit", rewriterForm);
}
///////////////////////////////////////////////////////////
function projForm(e) {
    if (e.preventDefault) e.preventDefault();
    // console.log(e);
    var x = e.target.getElementsByTagName("input")[0];
    var y = e.target.getElementsByTagName("select")[0];
    var name = x.value;
    var id = y.options[y.selectedIndex].getAttribute('tag-id');

    // console.log(x);
    // console.log(y);
    // console.log(y.options[y.selectedIndex]);
    // console.log(y.options[y.selectedIndex].text);
    // console.log(y.options[y.selectedIndex].getAttribute('tag-id'));

    var body = 'name=' + encodeURIComponent(name) +
    '&tag=' + encodeURIComponent(id);
    var xhr = new XMLHttpRequest();

    xhr.open("POST", '/projects', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function (){
        console.log(xhr);
        if(xhr.readyState == 4)
            window.location.replace(xhr.responseURL);
    };
    xhr.send(body);

    return false;
}
function tagForm(e) {
    if (e.preventDefault) e.preventDefault();

    var x = e.target.getElementsByTagName("input")[0];
    var name = x.value;
    var body = 'name=' + encodeURIComponent(name);
    var xhr = new XMLHttpRequest();

    xhr.open("POST", '/tags', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function (){
        console.log(xhr);
        if(xhr.readyState == 4)
            window.location.replace(xhr.responseURL);
    };
    xhr.send(body);

    return false;
}
function keyForm(e) {
    if (e.preventDefault) e.preventDefault();

    var x = e.target.getElementsByTagName("input")[0];
    var name = x.value;
    var body = 'name=' + encodeURIComponent(name);
    var xhr = new XMLHttpRequest();

    xhr.open("POST", '/keywords', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function (){
        // console.log(xhr);
        if(xhr.readyState == 4)
            window.location.replace(xhr.responseURL);
    };
    xhr.send(body);

    return false;
}


function onReaderLoad(e){
    console.log(e.target.result);
    // var obj = JSON.parse(e.target.result);
    // alert_data(obj.name, obj.family);
}
function jsonForm(e) {
    if (e.preventDefault) e.preventDefault();
    // console.log(e);

    var file = e.target.getElementsByTagName("input")[0].files[0];
    var reader = new FileReader();
    var xhr = new XMLHttpRequest();
    if (file.type == "application/json" ) {
        reader.readAsText(file);
        reader.onload = (e) => {
            
            
                var body = 'data=' + encodeURIComponent(e.target.result);

                xhr.open("POST", '/json', true);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.onprogress = function (e) {
                    if (e.lengthComputable) {
                        console.log(e.loaded+  " / " + e.total)
                    }
                }
                xhr.onloadstart = function (e) {
                    console.log("start")
                }
                xhr.onloadend = function (e) {
                    console.log("end")
                }
                xhr.onreadystatechange = function (){
                    console.log(xhr);
                    // if(xhr.readyState == 4)
                    //     window.location.replace(xhr.responseURL);
                };
                xhr.send(body); 
            
        };
    }else console.log('error'); 
    

    return false;
}

function rewriteForm(e) {
    if (e.preventDefault) e.preventDefault();
    // console.log(e);

    var x = e.target.getElementsByTagName("input")[0];
    var y = e.target.getElementsByTagName("select")[0];
    
    var name = x.value;
    var id = y.options[y.selectedIndex].getAttribute('tag-id');
    
    // var xhr = new XMLHttpRequest();
    // var body = 'name=' + encodeURIComponent(name) +
    // '&tag=' + encodeURIComponent(id);

    // xhr.open("POST", '/projects', true);
    // xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    // xhr.onreadystatechange = function (){
    //     console.log(xhr);
    //     if(xhr.readyState == 4)
    //         window.location.replace(xhr.responseURL);
    // };
    // xhr.send(body);

    return false;
}