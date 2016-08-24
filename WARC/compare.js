var comparator = require('../HTMLCompare/JS/comparator');
var path = '../HTMLCompare/DOM/Both/';
var b = ['Chrome', ' Edge', 'Firefox', 'IE', 'Opera', 'PhantomJS', 'Safari', 'Original'];
var c = [];
var d = [5, 7];
for (var i in b)
    c[i] = path + b[i] + '/';
console.log('Comparing between ' + c[d[0]] + ' and ' + c[d[1]]);
console.log(comparator.compare(c[d[0]], c[d[1]], 'Out_B', null, true));