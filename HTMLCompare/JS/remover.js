var path = '../TestSuite/';
var mode = 'NoScript';
var fs = require('fs');
var ext = '.html';
var opt = ['219-276', '312-319'];
var list = [];
for (var i in opt) {
    if (opt[i].indexOf('-') != -1)
        for (var j = opt[i].split('-')[0]; j <= opt[i].split('-')[1]; j++)
            list.push(j);
    else
        list.push(opt[i]);
}
console.log('Moving files from ' + mode + '/ to Exclude/' + mode + '/...');
for (var i in list) {
    try {
        fs.unlinkSync(path + mode + '/' + ('0000' + list[i]).substr(-4) + ext);
        console.log('--' + ('0000' + list[i]).substr(-4) + ext);
    } catch (err) {
        console.log('No such file: ' + ('0000' + list[i]).substr(-4) + ext);
    }
}

// --> move file to excluded
// --> DOM as well