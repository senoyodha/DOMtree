var fs = require('fs');
var pathIn = '../HTMLCompare/DOM/CommonCrawl/Scripted/';
var b = ['Chrome', 'Edge', 'Firefox', 'IE', 'Opera', 'PhantomJS', 'Safari'];
var c = 3;

pathIn += b[c] + '/';
var start = 1;
var stop = 593;
var not = 0;

console.log('Path: ' + pathIn);
console.log('Unavailable:');
for (var i = start; i <= stop; i++) {
    var str = ('0000' + i).slice(-4) + '.txt';
    try {
        fs.accessSync(pathIn + str);
    } catch (e) {
        console.log(str);
        not++;
    }
}
console.log('Not available: ' + not + ' of ' + (stop - start + 1));