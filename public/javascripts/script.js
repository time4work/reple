'use strict'
console.log('script');
///////////////////////////////////////////////////////////
window.onload = function() {
    // var projs    = document.getElementById('projects-form');
    // var proj    = document.getElementById('project-form');
    var newproj    = document.getElementById('new-project-form');
    var tag     = document.getElementById('tag-info-form');
    var key     = document.getElementById('key-form');
    var json    = document.getElementById('json-form');
    var rewrite = document.getElementById('rewrite-form');
    var rewriter = document.getElementById('rewriter-form');
    var query = document.getElementById('query-form');

    // if(projs) projs.addEventListener("submit", projsForm); else
    if(newproj) newproj.addEventListener("submit", newprojProjForm); else
    // if(proj) proj.addEventListener("submit", projForm); else
    if(tag) tag.addEventListener("submit", tagForm); else
    if(key) key.addEventListener("submit", keyForm); else
    if(json) json.addEventListener("submit", jsonForm); else
    if(rewrite) rewrite.addEventListener("submit", rewriteForm); else
    if(rewriter) rewriter.addEventListener("submit", rewriterForm); else
    if(query) query.addEventListener("submit", queryForm);
}
///////////////////////////////////////////////////////////
function projForm(e) {
    if (e.preventDefault) e.preventDefault();
    console.log(e);

    var project_id = e.target.getAttribute('project-id');

    // var input = e.target.getElementsByTagName("input")[0];
    // var tag_name = input.value;

    var select = e.target.getElementsByTagName("select")[0];
    var tag_id = select.options[select.selectedIndex].getAttribute('tag-id');

    // console.log(x);
    // console.log(y);
    // console.log(y.options[y.selectedIndex]);
    // console.log(y.options[y.selectedIndex].text);
    // console.log(y.options[y.selectedIndex].getAttribute('tag-id'));

    var body = 'project_id=' + encodeURIComponent(project_id) +
    '&tag_id=' + encodeURIComponent(tag_id);
    var xhr = new XMLHttpRequest();

    xhr.open("POST", '/project/'+project_id, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function (){
        console.log(xhr.response);
    //     if(xhr.readyState == 4)
    //         window.location.replace(xhr.responseURL);
    };
    xhr.send(body);

    return false;
}
function newprojProjForm(e) {
    if (e.preventDefault) e.preventDefault();
    console.log(e);

    var project_name = document.getElementById('name-input').value;
    if(!project_name)
        return false;
    var project_description = document.getElementById('description-textarea').value;
    var assoc_tags = $('#assoc-tag').val();
    var stop_tags = $('#stop-tag').val();

    var data = {};
    data.name = project_name;
    
    if(project_description)
        data.description = project_description;

    data.tags = {};
    if(assoc_tags)
        data.tags.assoc = assoc_tags;
    if(stop_tags)
        data.tags.stop = stop_tags;

    console.log(project_name);    
    console.log(project_description);    
    console.log(assoc_tags);    
    console.log(stop_tags);   

    var xhr = new XMLHttpRequest();

    xhr.open("POST", '/newproject', true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.onreadystatechange = function (){
        console.log(xhr);
        if(xhr.readyState == 4)
            window.location.replace(xhr.responseURL);
    };
    xhr.send(JSON.stringify(data));
    return false;
}
// function projsForm(e) {
//     if (e.preventDefault) e.preventDefault();
//     var x = e.target.getElementsByTagName("input")[0];
//     var name = x.value;

//     var body = 'name=' + encodeURIComponent(name);
//     var xhr = new XMLHttpRequest();

//     xhr.open("POST", '/projects', true);
//     xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
//     xhr.onreadystatechange = function (){
//         console.log(xhr);
//         if(xhr.readyState == 4)
//             window.location.replace(xhr.responseURL);
//     };
//     xhr.send(body);

//     return false;
// }
function tagForm(e) {    
    if (e.preventDefault) e.preventDefault();
    if ( !confirm("are you sure") )
        return
    var name = document.getElementById("name-input");
    var syns = $('#syns-tag').val()
    var tag_id = document.getElementById('tag-details').getAttribute('tag-id');
    var x = e.target.getElementsByTagName("input")[0];
    var name = x.value;
    var data = {name:name, syns:syns, type:'save'};

    // ajax('/query', data, (result)=>{
    //     console.log(result);

    //     var output = '';
    //     for(var i=0; i<result.length; i++){
    //         output += JSON.stringify(result[i], null, 4);
    //     }
    //     $('#response-textarea').val(output);
    // });
    // /////////////////////////////////////////////////////////////
    var body = 'name=' + encodeURIComponent(name)
        // +"&syns=" + encodeURIComponent(syns)
        +"&syns=" + syns
        +'&type=save';
    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/tag/'+tag_id, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function (){
        console.log(xhr);
        if(xhr.readyState == 4)
            window.location.replace(xhr.responseURL);
    };
    xhr.send(body);
    // xhr.send(JSON.stringify({name:name, syns:syns, type:'save'}));
    // xhr.send( JSON.stringify({name:name, syns:syns, type:'save'}) );
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
        console.log(xhr);
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

    var y = e.target.getElementsByTagName("select")[0];
    var id = y.options[y.selectedIndex].getAttribute('proj-id');
    
    var xhr = new XMLHttpRequest();
    var body = 'project=' + encodeURIComponent(id);

    xhr.open("POST", '/rewrite', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function (){
        console.log(xhr);
        if(xhr.readyState == 4)
            window.location.replace(xhr.responseURL);
    };
    xhr.send(body);

    return false;
}

function rewriterForm(e) {
    if (e.preventDefault) e.preventDefault();
    console.log(e);

    var original_id  = document.getElementById('original-id').value;
    var project_id  = document.getElementById('project-id').value;
    var description = document.getElementById('object-desc').value;
    var title       = document.getElementById('object-title').value;

    if(!title || !description || !project_id)
        return;

    var data = {
        title: title,
        description: description,
        project_id: project_id,
        original_id: original_id
    };

    console.log(data);    

    var xhr = new XMLHttpRequest();

    xhr.open("POST", '/rewriter', true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.onreadystatechange = function (){
        console.log(xhr);
        if(xhr.readyState == 4)
            window.location.replace(xhr.responseURL);
    };
    xhr.send(JSON.stringify(data));
    return false;
}


function queryForm(e) {
    if (e.preventDefault) e.preventDefault();
    console.log(e);

    var ssh_host     = document.getElementById('host-ssh-input').value;
    var ssh_user     = document.getElementById('user-ssh-input').value;
    var ssh_password = document.getElementById('password-ssh-input').value;
    var ssh_port     = document.getElementById('port-ssh-input').value;
    
    var db_host     = document.getElementById('host-db-input').value;
    var db_port     = document.getElementById('port-db-input').value;
    var db_user     = document.getElementById('user-db-input').value;
    var db_password = document.getElementById('password-db-input').value;
    var db_name     = document.getElementById('name-db-input').value;
    var db_query    = document.getElementById('query-db-textarea').value;

    if(!ssh_host || !ssh_user || !ssh_password || 
        !db_host || !db_user || !db_password || 
        !db_query)
        return;

    var ssh = {
        'host': ssh_host
        // ,port: ssh_port
        ,'user': ssh_user
        ,'password': ssh_password
    };
    if(ssh_port) ssh.port = ssh_port;

    var db = {
        'host': db_host
        // ,port: db_port
        ,'user': db_user
        ,'password': db_password
        // ,name: db_name
        ,'query': db_query
    };
    if(db_name) db.name = db_name;
    if(db_port) db.port = db_port;

    var data = {
        ssh:ssh
        ,db:db
    };
    // var data = [ssh, db];
    console.log(data);  

    ajax('/query', data, (result)=>{
        console.log(result);

        var output = '';
        for(var i=0; i<result.length; i++){
            output += JSON.stringify(result[i], null, 4);
        }
        $('#response-textarea').val(output);
    });
}
function search(url){
    // var search = document.getElementById('search');
    console.log('search engine');
    if( $('#search') ){
        $('#search').on('keyup', ()=>{
            console.log('search typing...');

            var val = $('#search').val();

            if( val.length > 0 ){

                $("#list-tbody").hide();

                ajax(url, {type:'search',name:val}, (tags)=>{
                    console.log(tags);
                    var html = '';
                    for(var i in tags){
                        console.log(tags[i]);
                        html += ''
                        + "<tr>"
                        + "<td class='number'>" 
                        + tags[i].id 
                        + "</td>"
                        + "<td>"
                        + tags[i].name
                        + "</td>"
                        + "<td><a href=''><i class='fa fa-times' aria-hidden='true'></i></a></td>"
                        + "</tr>";
                    }  
                    $("#search-tbody").empty().append(html).show();        
                });
            }else{
                $("#list-tbody").show();
                $("#search-tbody").hide();
            }
        });
    }
}
function ajax(url, data, callback){
    return $.ajax({
      type: "POST"
      ,url: url
      ,data: data
      ,dataType: 'json'
      ,success: function(response){
        if(callback)
            callback(response);
      },
    });
}
