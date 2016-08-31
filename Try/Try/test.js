// var a = {s: '💩', cp: '💩'.codePointAt(0), cc: ['💩'.charCodeAt(0), '💩'.charCodeAt(1)]};
var a = '💩';
var b = '🐄';
var c = '😸';
var d = '𝐀';
var e = '\uFFFF';
var f = e.codePointAt(0);
var g = 'FFFF';
var arr = [70, 79, 79, 26950, 56775];

var s = '';
// for (var i = arr)
//     s += String.fromCodePoint(arr[i]);
console.log(String.fromCodePoint(arr[4]) + String.fromCodePoint(arr[3]));

// console.log(a.codePointAt(0) + ' ' + (a.charCodeAt(0)+ a.charCodeAt(1)) + ' ' + (a.codePointAt(0) - (a.charCodeAt(0)+ a.charCodeAt(1))));
// console.log(b.codePointAt(0) + ' ' + (b.charCodeAt(0)+ b.charCodeAt(1)) + ' ' + (b.codePointAt(0) - (b.charCodeAt(0)+ b.charCodeAt(1))));
// console.log(c.codePointAt(0) + ' ' + (c.charCodeAt(0)+ c.charCodeAt(1)) + ' ' + (c.codePointAt(0) - (c.charCodeAt(0)+ c.charCodeAt(1))));
// console.log(d.codePointAt(0) + ' ' + (d.charCodeAt(0)+ d.charCodeAt(1)) + ' ' + (d.codePointAt(0) - (d.charCodeAt(0)+ d.charCodeAt(1))));
// console.log(e.codePointAt(0) + ' ' + (e.charCodeAt(0)+ e.charCodeAt(1)) + ' ' + (e.codePointAt(0) - (e.charCodeAt(0)+ e.charCodeAt(1))));
//
//
//
// console.log(a.charCodeAt(0) + ' ' + a.charCodeAt(1));
// console.log(b.charCodeAt(0) + ' ' + b.charCodeAt(1));
// console.log(c.charCodeAt(0) + ' ' + c.charCodeAt(1));
// console.log(d.charCodeAt(0) + ' ' + d.charCodeAt(1));

console.log(f);
// console.log((11111111111).toString(16));

