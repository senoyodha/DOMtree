//var stream = '<!doctype html><html><head><title>Hello</title></head><body><p>World</p></body></html>';
//var stream = '<p hihi="hoho">Hello</p><div>heheii</div><br /><b>jojoeoeo</b>';
//var stream = 'token';
var parse = require('./parser');
var tools = require('./tools');
fs = require('fs');
tools.tokenTest('./Test/HTML5lib/Tokenizer2/');

//console.log(tools.treeViewer(res.doc));
//console.log(res.token);
//console.log(res.doc);