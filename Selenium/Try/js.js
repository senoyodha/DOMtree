var dom = [];
function getDom(el, lvl) {
    dom.push({
        nodeName: el.nodeName, attributes: (function (el2) {
            var attr = {};
            if (el2.attributes != null)
                for (var j = 0; j < el2.attributes.length; j++)
                    attr[el2.attributes[j].nodeName] = el2.attributes[j].nodeValue;
            return attr;
        })(el), nodeValue: el.nodeValue, level: lvl
    });
    for (var i = 0; i < el.childNodes.length; i++)
        getDom(el.childNodes[i], lvl + 1);
}
if (document.doctype != null)
    dom.push({
        nodeName: 'DOCTYPE',
        name: document.doctype.name,
        publicId: document.doctype.publicId,
        systemId: document.doctype.systemId,
        level: 0
    });
getDom(document.documentElement, 0);
console.log(dom);
