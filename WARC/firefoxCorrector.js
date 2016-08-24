var fs = require('fs');
var pathIn = '../HTMLCompare/DOM/CommonCrawl/Scripted/Firefox/';

var files = fs.readdirSync(pathIn);
for (var i in files) {
    console.log('Processing ' + files[i] + '...');
    var file = fs.readFileSync(pathIn + files[i], 'utf8');
    if (file.indexOf('webdriver="true"\n') != -1) {
        console.log('Detected!');
        file = file.split('webdriver="true"\n');
        file[0] = file[0].substr(0, file[0].lastIndexOf('|'));
        file = file.join('');
        fs.writeFileSync(pathIn + files[i], file);
    }
}