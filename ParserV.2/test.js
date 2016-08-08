function treeViewer(doc) {
    var structure = "";
    var currentNode = doc.firstChild;
    var rpt = 1;
    structure += "#document: " + doc.type;
    var dd = 0;
    out:
        while (currentNode.parent != null) {
            dd++;
            structure += "\n" + " ".repeat(rpt) + "-" + currentNode.type + ": " + JSON.stringify(currentNode.attribute);
            if (currentNode.firstChild.type != null) {
                currentNode = currentNode.firstChild;
                rpt++;
            }
            else if (currentNode.next != null)
                currentNode = currentNode.next;
            else {
                while (currentNode.next == null) {
                    if (currentNode.constructor.name == 'documents')
                        break out;
                    currentNode = currentNode.parent;
                    rpt--;
                }
            }
            if (dd > 20)
                break;
        }
    return structure;
}

function tree2(doc) {
    var structure = "#document: " + doc.doctype.name + " " + doc.doctype.publicId + " " + doc.doctype.systemId;
    var cnode = doc.firstChild;
    var rpt = 1;
    loop:
        while (true) {
            var attr = "";
            if (cnode.attribute != null && Object.keys(cnode.attribute).length > 0)
                attr = JSON.stringify(cnode.attribute);
            structure += "\n" + " ".repeat(rpt * 2) + "-" + cnode.type + ":" + attr + (cnode.name != null ? " " + cnode.name : "") + (cnode.data != null ? " " + cnode.data : "");
            if (cnode.firstChild.type != null) {
                cnode = cnode.firstChild;
                rpt++;
            }
            else {
                if (cnode.next != null)
                    cnode = cnode.next;
                else {
                    while (true) {
                        cnode = cnode.parent;
                        rpt--;
                        if (cnode.next != null) {
                            cnode = cnode.next;
                            break;
                        }
                        else if (cnode.doctype != null)
                            break loop;
                    }
                }
            }
        }
    return structure;
}

var tree = require('./Parser/treeconstruction');
var tknz = require('./Parser/tokenization');
var parse = require('./Parser/parser');
var tools = require('./Tools/tools');
var stream = '<!DOCTYPE html><body><b><nobr id="a">1<div id="b"><nobr id="c"></b><i id="d"><nobr id="e">2<nobr id="f"></i>3';
// var stream = "<!doctype html><html><head><title>Halo semua</title></head><body>12345<p id='tektok'>hello</p><br /><div name='saya'><b><i>kamu</i> dia</b></div></body></html>";
// var stream = "<!doctype html><html><head><title>Halo semua</title>";
// var stream = "<!doctype html>";
// var stream = '<';
// var stream = '\u{1F4A9}a\u{1F4A9}b';
// console.log(String.fromCharCode(0x1F4A9));
// console.log("\uD83D\uDCA9");
// console.log(String.fromCodePoint(0x1F4A9));
// console.log(String.fromCodePoint(stream.codePointAt(0)));
// console.log(stream);
// console.log(0x1F4A9);
// console.log(stream.codePointAt(0));

// var res = (JSON.parse(JSON.stringify(tknz.tokenization('<b>123',-1,null,null))));
// var res2 = (JSON.parse(JSON.stringify(tknz.tokenization('<a>345',2,'Data state', null))));
// var res = tknz.tokenization('<b>123',-1,null,null);
// // var res2 = tknz.tokenization('<a>345',2,'Data state', null);
// var adds = {initialStates: "RCDATA state", doubleEscaped: true};
var res = parse.parsing(stream);
for (var i in res.logs)
    res.logs[i] = res.logs[i] + '\n';
fs = require('fs');
fs.writeFileSync('./ParserV.2/log.txt', res.logs);
// console.log(res.modeList.document);
// console.log(res.modeList.document.lastChild.lastChild.lastChild.lastChild.lastChild);
console.log(tools.treeAdapter(res.modeList.document));
// console.log(tools.treeViewer(res.modeList.document));
// console.log(treeViewer(res.modeList.document));
// console.log(res.err.stack);
// console.log(JSON.stringify(res.state.emit));
// console.log(res.state.emit);
// var res = tknz.tokenization(stream,0);
// console.log(res.logs);
// var a = '\uB123';
// console.log(a);
// console.log(0xB123);
// console.log(a.charCodeAt(-1));
// console.log(a.codePointAt(-1));
