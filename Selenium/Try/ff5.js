var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;
var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.firefox()).build();
var script = 'var dom = []; function getDom(el, lvl, tmplt) { if (el !== document) { if (el === document.doctype) dom.push({ nodeName: "DOCTYPE", name: document.doctype.name, publicId: document.doctype.publicId, systemId: document.doctype.systemId, attributes: {}, namespace: null, level: lvl }); else { dom.push({ nodeName: el.nodeName, attributes: (function(el2) { var attr = {}; if (el2.attributes != null) for (var j = 0; j < el2.attributes.length; j++) attr[el2.attributes[j].nodeName] = {value: el2.attributes[j].nodeValue, namespace: el2.attributes[j].namespaceURI}; return attr; })(el), nodeValue: encodeURI(el.nodeValue), namespace: el.namespaceURI, level: lvl, template: tmplt}); if (el.nodeName == "TEMPLATE") { el = el.content; tmplt++; } } } for (var i = 0; i < el.childNodes.length; i++) getDom(el.childNodes[i], lvl + 1, tmplt); } getDom(document, -1, 0); return dom;';
driver.get("file:///C:/dell/00CODE/HTML5%20Parser/Selenium/Try/h4.html");
// driver.findElement(webdriver.By.id('aaa')).click();
driver.switchTo().frame(0);
driver.findElement(webdriver.By.id('aaa')).then(function () {
    // driver.executeScript(script).then(function (t) {
    //     console.log(t);
    // });
});
driver.wait(function () {
    return false;
}, 120000);