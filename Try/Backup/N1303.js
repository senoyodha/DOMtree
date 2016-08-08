var a = ["\u{10FFFD}", "\u{10FFFF}", "\u{10FFFF}"];
console.log(0x1F4A9);
console.log(a.indexOf(1114111));
console.log(a.indexOf("\uD83F\uDFFE"));
console.log(a.indexOf("\u{10FFFF}"));
console.log("--------");
var a = "💩";
console.log(a.codePointAt(0));
console.log(a.codePointAt(0).toString(16));
console.log(a.length);
console.log("--------");
var a = ["💩", "\u{1F4A9}", "\uD83D\uDCA9", String.fromCharCode(0x1F4A9)];
for (var i in a) {
    console.log(i);
    console.log(a[i] + " " + a.length + " " + a[i].codePointAt(0) + " " + a[i].codePointAt(0).toString(16) + " " + (a[i].codePointAt(0) == 0x1F4A9));
    for (var j in a[i])
        console.log(a[i][j] + " " + a[i].length + " " + a[i][j].codePointAt(0) + " " + a[i][j].codePointAt(0).toString(16) + " " + (a[i][j].codePointAt(0) == 0x1F4A9));
    console.log((a[i][0] + a[i][1]) + " " + a[i].length + " " + (a[i][0] + a[i][1]).codePointAt(0) + " " + (a[i][0] + a[i][1]).codePointAt(0).toString(16) + " " + ((a[i][0] + a[i][1]).codePointAt(0) == 0x1F4A9));
    console.log("--------");
}
var a = ["\u{1F4A9}"];
console.log(a[0] == "\uD83D\uDCA9");
console.log(a.indexOf("\uD83D\uDCA9"));
console.log("--------");
var a = [0x1F4A9];
console.log(a[0] == "\uD83D\uDCA9".codePointAt(0));
console.log(a.indexOf("\uD83D\uDCA9".codePointAt(0)));
console.log("--------");

var stream = '\u{1F4A9}';
console.log("\uD83D\uDCA9");
console.log(String.fromCodePoint(0x1F4A9));
console.log(String.fromCodePoint(stream.codePointAt(0)));
console.log(stream);
console.log(0x1F4A9);
console.log(stream.codePointAt(0));
console.log();
var a = '34';
console.log(0x30);

var a = 'abcde';
// console.log(/[a-z]/.test(a[5]) + " " + a[5]);
console.log('\uDBC0\uDC00'.codePointAt(0));

var fs = require('fs');
var res = JSON.parse(fs.readFileSync('./TestLib/HTML5lib/TreeConstructor2/tests1.dat', 'utf8'));