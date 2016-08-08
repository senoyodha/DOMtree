function codePointAt(str, position) {
    var string = str;
    var size = string.length;
    var index = position ? Number(position) : 0;
    if (index != index) {
        index = 0;
    }
    if (index < 0 || index >= size) {
        return undefined;
    }
    var first = string.charCodeAt(index);
    var second;
    if (first >= 0xD800 && first <= 0xDBFF && size > index + 1) {
        second = string.charCodeAt(index + 1);
        if (second >= 0xDC00 && second <= 0xDFFF) {
            return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
        }
    }
    return first;
}
var dom = [];

function getDom(el, lvl, tmplt) {
    if (el !== document) {
        if (el === document.doctype) dom.push({
            nodeName: "DOCTYPE",
            name: document.doctype.name,
            publicId: document.doctype.publicId,
            systemId: document.doctype.systemId,
            attributes: {},
            namespace: null,
            level: lvl
        });
        else {
            dom.push({
                nodeName: el.nodeName,
                attributes: (function (el2) {
                    var attr = {};
                    if (el2.attributes != null)
                        for (var j = 0; j < el2.attributes.length; j++)
                            attr[el2.attributes[j].nodeName] = {
                                value: el2.attributes[j].value,
                                namespace: el2.attributes[j]
                                    .namespaceURI
                            };
                    return attr;
                })(el),
                nodeValue: el.nodeValue ? (function (val) {
                    var arr = [];
                    var skip = false;
                    for (var i in val) {
                        if (skip) {
                            skip = false;
                            continue;
                        }
                        var cp = codePointAt(val, i);
                        if (cp > 65535) skip = true;
                        arr.push(cp);
                    }
                    return arr;
                })(el.nodeValue) : [null],
                namespace: el.namespaceURI,
                level: lvl,
                template: tmplt
            });
            if (el.nodeName == "TEMPLATE") {
                tmplt++;
            }
        }
    }
    for (var i = 0; i < el.childNodes.length; i++) getDom(el.childNodes[i],
        lvl + 1, tmplt);
}
getDom(document, -1, 0);
return dom;