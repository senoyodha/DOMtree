var inputori = "";
var input = inputori;
//12.2.2.5 Preprocessing the input stream

/*
 <script>
 document.write('\uD83D\uDCA9');
 document.write('\u{1F4A9}');
 document.write('\uD84D\uDC04');
 document.write('\u{23404}');
 document.write(Array.from("💩").length);
 document.write([..."💩"].length);
 document.write("💩".length);
 </script>
 */


function preprocess(n) {

}
preprocess();
var a = '\u{1F4A9}';
var b = '\uD83D\uDCA9';
var str = '🐄';
//console.log(a);
/*console.log(/[\x60-\x64]/.test("a"));
 console.log(String.fromCharCode(0xD83D&0xDCA9));
 console.log(/\uD83D[\uDCA9-\uDCAF]/.test('\uD83D\uDCAB'));
 //console.log('\x{1D401}');
 console.log(a.length+":"+ b.length);
 console.log(str);
 console.log('\u{1F404}')
 console.log('\uD83D\uDC04')*/
console.log(/[[\u0001-\u0008\u000E-\u001F\u007F-\u009F\uFDD0-\uFDEF]|\u000B|\uFFFE|\uFFFF/.test("\uFFFE"));