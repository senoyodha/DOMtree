var shuffle = function (v) {
    for (var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
    return v;
};

var fs = require('fs');
var pathIn = '../../CommonCrawl/';
var pathOut = '../../CommonCrawl/Picked/';
var set = {NS: {type: 'NoScript', arr: []}, S: {type: 'Scripted', arr: []}};
var mode = 'NS';
var percent = 0.25;

pathIn += set[mode].type + '/';
var files = fs.readdirSync(pathIn);
console.log('Shuffling ' + files.length + ' files..');
files = shuffle(files);
var arr = [];
var pick = Math.ceil(percent * files.length);

console.log('Picking ' + pick + ' files (' + (percent * 100) + '%) out of ' + files.length + ' files...');
for (var i = 0; i < pick; i++) {
    // console.log(1 + ' ' + files[i]);
    var modified = 0;
    // console.log(2);
    var read = fs.readFileSync(pathIn + files[i], 'utf8');
    // console.log(3);
    var str = [read.substr(0, read.indexOf('>') + 1), read.substr(read.indexOf('>') + 1)];
    // console.log(4);
    while (str[1][0] != '<')
        str[1] = str[1].substr(1);
    // console.log(5);
    while (str[0].substr(0, 5).toLowerCase() != '<html' && str[1].substr(0, 5).toLowerCase() != '<html') {
        modified = 1;
        read = str[1];
        while (read[0] != '<')
            read = read.substr(1);
        str = [read.substr(0, read.indexOf('>') + 1), read.substr(read.indexOf('>') + 1)];
        while (str[1][0] != '<')
            str[1] = str[1].substr(1);
    }
    // console.log(6);
    if (['<htm', '<!do', '<!--'].indexOf(str[0].substr(0, 4).toLowerCase()) == -1) {
        modified = 2;
        read = str[1];
    }
    // console.log(7);
    var name = ('0000' + (i + 1)).slice(-4) + '.html';
    // console.log(8);
    fs.writeFileSync(pathOut + set[mode].type + '/' + name, read);
    // console.log(9);
    arr.push(name + ': ' + files[i] + (modified > 0 ? ' (M)' : ''));
    // console.log(10);
    console.log('Processing ' + (i + 1) + ': ' + files[i] + ' ' + modified);
}
fs.writeFileSync(pathOut + mode + '.txt', arr.join('\n'));