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
                        for (var j = el2.attributes.length - 1; j >= 0; j--)
                            if (!(el.nodeName == "HTML" && el2.attributes[j].nodeName == "webdriver" && el2.attributes[j].value == "true"))
                                attr[el2.attributes[j].nodeName] = {
                                    value: el2.attributes[j].value,
                                    namespace: el2.attributes[j].namespaceURI
                                };
                    return attr;
                })(el),
                nodeValue: encodeURI(el.nodeValue),
                namespace: el.namespaceURI,
                level: lvl,
                template: tmplt
            });
            if (el.nodeName == "TEMPLATE") {
                el = el.content;
                tmplt++;
            }
        }
    }
    for (var i = 0; i < el.childNodes.length; i++)
        getDom(el.childNodes[i], lvl + 1, tmplt);
}
getDom(document, -1, 0);
alert(JSON.stringify(dom));