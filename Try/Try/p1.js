var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;
var cap = webdriver.Capabilities.phantomjs();
// cap.set("phantomjs.page.settings.javascriptEnabled", false);
var driver = new webdriver.Builder().withCapabilities(cap).build();
var script = 'var dom = []; function getDom(el, lvl, tmplt) { if (el !== document) { if (el === document.doctype) dom.push({ nodeName: "DOCTYPE", name: document.doctype.name, publicId: document.doctype.publicId, systemId: document.doctype.systemId, attributes: {}, namespace: null, level: lvl }); else { dom.push({ nodeName: el.nodeName, attributes: (function(el2) { var attr = {}; if (el2.attributes != null) for (var j = 0; j < el2.attributes.length; j++) attr[el2.attributes[j].nodeName] = {value: el2.attributes[j].nodeValue, namespace: el2.attributes[j].namespaceURI}; return attr; })(el), nodeValue: encodeURI(el.nodeValue), namespace: el.namespaceURI, level: lvl, template: tmplt}); if (el.nodeName == "TEMPLATE") { el = el.content; tmplt++; } } } for (var i = 0; i < el.childNodes.length; i++) getDom(el.childNodes[i], lvl + 1, tmplt); } getDom(document, -1, 0); return dom;';
driver.get('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/Try/h1.html');
driver.executeScript(script).then(function (tit) {
    console.log(tit);
});
driver.getPageSource().then(function (src) {
    console.log(src);
});
driver.quit();