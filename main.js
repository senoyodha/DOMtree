//var stream = '<!doctype html><html><head><title>Hello</title></head><body><p>World</p></body></html>';
//var stream = '<p hihi="hoho">Hello</p><div>heheii</div><br /><b>jojoeoeo</b>';
var stream = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0//EN" SYSTEM "http://www.w3.org/TR/REC-html40/strict.dtd"';
//var stream = "<!doctype html><html><head></head><body><p>hello</p></body></html>";
var parse = require('./parser');
var tools = require('./tools');
var pathLog = './Log/';
var dt = (new Date()).toISOString().substr(2,17).replace("T", " ").replace(/\-/g, "").replace(/\:/g, "");
fs = require('fs');
//tools.tokenTest('./Test/HTML5lib/Tokenizer2/');

var res = parse.parser(stream);
console.log(tools.treeViewer(res.doc));
//console.log(res.logs);
console.log(res.token);
if (res.err != null)
    console.log("\nERROR\n" + res.err.stack);
//fs.writeFileSync(pathLog + dt + ".txt", res.logs);
//console.log(tools.treeViewer(res.doc));
//console.log(res.token);
//console.log(res.doc);