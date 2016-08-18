var parse = require('./Parser/parser');
var tools = require('./Tools/tools');
var pathLog = './ParserV.2/Log/';
var fs = require('fs');
// var res = tools.tokenTest('./TestLib/HTML5lib/Tokenizer2/', null, true);
var res = tools.tokenTest('./TestLib/HTML5lib/Tokenizer/', true, true);
fs.appendFileSync(pathLog + tools.getDateString() + ".txt", res.detail.join("\n"));