var page = require('webpage').create();
page.content = '<!DOCTYPE html><body><b><nobr id="a">1<div id="b"><nobr id="c"></b><i id="d"><nobr id="e">2<nobr id="f"></i>3'
var title = page.evaluate(function () {
    var node = document.doctype;
    var html = "<!DOCTYPE "
        + node.name
        + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '')
        + (!node.publicId && node.systemId ? ' SYSTEM' : '')
        + (node.systemId ? ' "' + node.systemId + '"' : '')
        + '>';
    return html;
});
console.log(title);
phantom.exit();
