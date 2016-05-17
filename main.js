var parse = require('./parser');
var tools = require('./tools');
var stream = '<!doctype html><html><head><title>Hello</title></head><body><p>World</p></body></html>';
var res = parse.parser(stream);
//console.log(tools.treeViewer(res.doc));
console.log(res.token);
//console.log(res.doc);
