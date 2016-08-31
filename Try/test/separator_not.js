var fs = require('fs');
var input = '../TestLib/';
var input2 = '../../CommonCrawl/';
var out = '../TestLib/CommonCrawl/NoScript/';
var mode = 'NS';
var read = fs.readFileSync(input + mode + '.html', 'utf8').split('\n');
var arr = [];
for (var i in read) {
    if (i == 10)
        break;
    var str = ('00000' + (parseInt(i) + 1)).slice(-5) + '.html';
    console.log('Copying ' + read[i] + ' to ' + str);
    // fs.createReadStream(input2 + read[i]).pipe(fs.createWriteStream(out + str));
    var file = fs.readFileSync(input2 + read[i], 'utf8');
    fs.writeFileSync(out + str, file);
    arr.push(str + ': ' + read.slice(0, -5));
}
fs.writeFileSync(input + mode + '.txt', arr.join('\n'));


// var a = '123.html';
// console.log(a.slice(0,-5));