console.log("😸".codePointAt(0).toString(16));
console.log("\u0061" == "a");
var a = "abcde";
for (var i in a)
    console.log(a[i]);
var c, b = 1;
console.log(c + " " + b)
var ar = [55358, 55359, 55360, 55422, 55423, 55424, 55486, 55487, 55488, 55550, 55551, 55552, 55614, 55615, 55616, 55678, 55679, 55680, 55742, 55743, 55744, 55806, 55807, 55808, 55870, 55871, 55872, 55934, 55935, 55936, 55998, 55999, 56000, 56062, 56063, 56064, 56126, 56127, 56128, 56190, 56191, 56192, 56254, 56255, 56256, 56318, 56319, 56320, 57341, 57342, 57343, 57342, 57343, 57344];
var ar1 = [55358, 55358, 55358, 55359, 55358, 55360, 55358, 57341, 55358, 57342, 55358, 57343, 55359, 55358, 55359, 55359, 55359, 55360, 55359, 57341, 55359, 57342, 55359, 57343, 55360, 55358, 55360, 55359, 55360, 55360, 55360, 57341, 55360, 57342, 55360, 57343, 57341, 55358, 57341, 55359, 57341, 55360, 57341, 57341, 57341, 57342, 57341, 57343, 57342, 55358, 57342, 55359, 57342, 55360, 57342, 57341, 57342, 57342, 57342, 57343, 57343, 55358, 57343, 55359, 57343, 55360, 57343, 57341, 57343, 57342, 57343, 57343];
for (var i in ar1)
    stream += String.fromCharCode(ar1[i]);
var d = "\u{1FFFE}";
var e = "\uD83F\uDFFE";
var f = "\uDFFE\uD83F";
var g = "\uD83F";
var h = "\uDFFE";
console.log(/\uD83F\uDFFE/.test(d + h));
console.log(/\uD83F\uDFFE/.test(e + h));
console.log(/\uD83F\uDFFE/.test(f + h));
console.log(/\uD83F\uDFFE/.test(g + h));
console.log(/\uD83F\uDFFE/.test(h + h));
console.log(d >= 0xD800 && d <= 0xDBFF);
console.log(e >= 0xD800 && e <= 0xDBFF);
console.log(f >= 0xD800 && f <= 0xDBFF);
console.log(g.codePointAt(0) >= 0xD800 && g.codePointAt(0) <= 0xDBFF);
console.log(h >= 0xD800 && h <= 0xDBFF);
console.log(0xDBFF);
console.log("----------");
console.log((g + h).codePointAt(0).toString(16).toUpperCase());
console.log((g + h));
console.log(g + h + "..");