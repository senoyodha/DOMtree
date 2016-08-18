var fs = require('fs');
var pathIn = '../TestLib/CommonCrawl/';
var pathOut = '../TestLib/';
var arr = {NS: [], S: []};

var files = fs.readdirSync(pathIn);
for (var i in files) {

    console.log('Processing ' + files[i]);
    var html = fs.readFileSync(pathIn + files[i], 'utf8');
    if (html.indexOf('<script') != -1 || html.indexOf('<noscript') != -1)
        arr['S'].push(files[i]);
    else
        arr['NS'].push(files[i]);
}

for (var i in arr)
    fs.writeFileSync(pathOut + i + '.html', arr[i].join('\n'));