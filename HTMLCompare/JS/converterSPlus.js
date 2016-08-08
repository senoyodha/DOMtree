var path = {
    in: '../../TestLib/HTML5lib/TreeConstructor/Scripted/',
    out: {S: {DOM: '../DOM/Scripted/Original/', test: '../TestSuite/Scripted/'}},
    ex: {S: {DOM: '../DOM/Excluded/Scripted/', test: '../TestSuite/Excluded/Scripted/'}}
};
var fs = require('fs');

// for (var i in path) {
//     if (i == 'in')
//         continue;
//     for (var j in path[i])
//         for (var k in path[i][j]) {
//             var files2 = fs.readdirSync(path[i][j][k]);
//             for (var l in files2)
//                 fs.unlinkSync(path[i][j][k] + files2[l]);
//         }
// }

var id = {};
var test = {};
for (var i in path) {
    if (i == 'in')
        continue;
    for (var j in path[i]) {
        id[i + '_' + j] = Math.max(fs.readdirSync(path[i][j].test).length, fs.readdirSync(path[i][j].DOM).length) + 1;
        test[i + '_' + j] = [];
    }
}
var files = fs.readdirSync(path.in);


for (var i in files) {
    var read = fs.readFileSync(path.in + files[i], 'utf8').split('#data\n');
    read.shift();
    for (var j in read) {
        var mode = ['out', 'S', '#script-on'];
        if (read[j].indexOf('#document-fragment') != -1)
            mode[0] = 'ex';
        test[mode[0] + '_' + mode[1]].push({
            input: read[j].split('#errors')[0].split(mode[2])[0].slice(0, -1),
            output: read[j].substring(read[j].indexOf('#document'), read[j].length - (read[j].slice(-1) == '\n' ? (read[j].slice(-2, -1) == '\n' ? 2 : 1) : 0)),
            file: files[i]
        });
    }
}
var str = '';
for (var i in test) {
    str += ' ' + i.substr(0, 1).toUpperCase() + i.substr(1).replace('_', ' ') + ': ' + test[i].length + ',';
    if (test[i].length > 0) {
        console.log('Writing test input ' + i.substr(0, 1).toUpperCase() + i.substr(1).replace('_', ' ') + ': ' + test[i].length + ' files');
        var list = '';
        for (var j in test[i]) {
            console.log('--Test input & DOM of ' + i.substr(0, 1).toUpperCase() + i.substr(1).replace('_', ' ') + ': ' + ('000' + id[i]).slice(-4) + '.html')
            var splt = i.split('_');
            fs.writeFileSync(path[splt[0]][splt[1]].test + ('000' + id[i]).slice(-4) + '.html', test[i][j].input);
            fs.writeFileSync(path[splt[0]][splt[1]].DOM + ('000' + id[i]).slice(-4) + '.txt', test[i][j].output);
            list += ('000' + id[i]).slice(-4) + ': ' + test[i][j].file + '\n';
            id[i]++;
        }
        list = list.substr(0, list.length - 1);
        fs.appendFileSync('../TestSuite/list_' + i.substr(0, 1).toUpperCase() + i.substr(1) + '.txt', '\n' + list);
    }
}

console.log('Total: ' + str.slice(0, -1));