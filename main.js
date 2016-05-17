//var stream = '<!doctype html><html><head><title>Hello</title></head><body><p>World</p></body></html>';
//var stream = '<p hihi="hoho">Hello</p><div>heheii</div><br /><b>jojoeoeo</b>';
//var stream = 'token';
var stream = '<!doctype html><html><head><title>Hello</title></head><body><p>World</p></body></html>';
var parse = require('./parser');
var tools = require('./tools');
var res = parse.parser(stream);
//console.log(tools.treeViewer(res.doc));
//console.log(res.token);
//console.log(res.doc);
var fs = require('fs');
var dt = (new Date()).toISOString().substr(2,17).replace("T", " ").replace(/\-/g, "").replace(/\:/g, "");
var log = res.logs.join("\n");
fs.writeFile("./Log/" + dt + ".txt", log, function(err) {
    if(err)
        return console.log(err);
    console.log("The file was saved!");
});