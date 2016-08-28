var fs = require('fs');
var comparator = require('../HTMLCompare/JS/comparator');
var path = '../HTMLCompare/DOM/CommonCrawl/Scripted/';
var pathOut = '../HTMLCompare/Log/';
var b = ['Chrome', 'Edge', 'Firefox', 'IE', 'Opera', 'PhantomJS', 'Safari', 'Original', 'Parser'];
/**          0        1        2        3      4          5          6           7          8  **/
var c = [];
var d = [0, 1];
for (var i in b)
    c[i] = path + b[i] + '/';
// console.log('Comparing between ' + c[d[0]] + ' and ' + c[d[1]]);
for (var i = 0; i <= 5; i++)
    for (var j = i + 1; j <= 6; j++) {
        var log = comparator.compareMiss(c[i], c[j], 0, false);
        fs.writeFileSync(pathOut + 'CC_S_' + b[i] + 'Vs' + b[j] + '_' + (new Date()).toISOString().substr(2, 17).replace("T", " ").replace(/\-/g, "").replace(/\:/g, "") + '.txt', log.join('\n'));
    }

