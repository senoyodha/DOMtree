function Node(name) {
    this.child = {parent: this};
    this.parent = {parent: this};
    this.name = name;
}
/*function Node(name){
 this.child = {parent: this};
 this.parent = {parent: this};
 this.name = name;
 }

 var a = (function () {
 return new Node("aaa");
 })();
 var Document = {firstChild: {}, lastChild: {}};
 Document.firstChild.parent = Document;
 Document.lastChild.parent = Document;
 a.parent = Document;
 //console.log(Document.lastChild.name == null);
 Document.lastChild = a;
 //console.log(Document.lastChild.name);
 console.log((Document === Document.lastChild.parent) + ":" + (Document === a.parent) + ":" + (Document.lastChild.parent === a.parent));
 console.log(Document.lastChild === a);
 */
/*
 function document (type){
 this.type = type;
 this.firstChild = {parent: this};
 this.lastChild = {parent: this};
 this.document = this;
 this.prev = null;
 this.next = null;
 }
 var Document = new document("root");
 var doc = new document("iframe");
 Document.next = doc;
 doc.prev = Document;
 Document = doc;
 console.log(Document);
 console.log(doc);
 console.log(Document.prev);
 console.log(doc.prev);
 */
/*
 var a = new Node("aa");
 var b = new Node("bb");
 var c = new Node("cc");
 var abc = [a, b, c];
 var d = b;
 console.log(abc);
 abc.splice(abc.indexOf(d), 1);
 console.log(abc);
 */
//console.log("-".repeat(2));
//console.log(/e/.test(undefined));
/*
 var a =  "\u{1FFFE}\u{1FFFF}\u{10FFFF}";
 console.log(a);
 console.log(a[0]+a[1]);
 console.log(a.codePointAt(0).toString(16));
 //for(var i = 0; i<a.length;i++)
 //console.log((a[i]+a[i+1]).charCodeAt(0));
 */
var a = undefined;

console.log(!a);