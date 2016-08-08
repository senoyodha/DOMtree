var t = process.hrtime();
var firefox = require('selenium-webdriver/firefox');
var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;
var profile = new firefox.Profile();
profile.addExtension('./noscript.xpi');
// profile.addExtension('./firebug.xpi');
// profile.setPreference('extensions.firebug.showChromeErrors', true);

var script = 'var dom = []; function getDom(el, lvl, tmplt) { if (el !== document) { if (el === document.doctype) dom.push({ nodeName: "DOCTYPE", name: document.doctype.name, publicId: document.doctype.publicId, systemId: document.doctype.systemId, attributes: {}, namespace: null, level: lvl }); else { dom.push({ nodeName: el.nodeName, attributes: (function(el2) { var attr = {}; if (el2.attributes != null) for (var j = 0; j < el2.attributes.length; j++) attr[el2.attributes[j].nodeName] = {value: el2.attributes[j].nodeValue, namespace: el2.attributes[j].namespaceURI}; return attr; })(el), nodeValue: encodeURI(el.nodeValue), namespace: el.namespaceURI, level: lvl, template: tmplt}); if (el.nodeName == "TEMPLATE") { el = el.content; tmplt++; } } } for (var i = 0; i < el.childNodes.length; i++) getDom(el.childNodes[i], lvl + 1, tmplt); } getDom(document, -1, 0); return dom;';
// var script = 'return 123';
var options = new firefox.Options().setProfile(profile);
var driver = new firefox.Driver(options);
var act = new webdriver.ActionSequence(driver);
var act2 = new webdriver.ActionSequence(driver);

// driver.manage().timeouts().pageLoadTimeout(60000);
// driver.manage().timeouts().setScriptTimeout(60000);
// driver.manage().timeouts().implicitlyWait(60000);

// driver.findElement(webdriver.By.tagName('body')).sendKeys(Key.CONTROL + Key.F4);
driver.get('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/Try/h1.html');
// driver.get('about:addons');
// driver.findElement(webdriver.By.id('category-extension')).click();
// // driver.findElement(webdriver.By.id('category-extension')).sendKeys(Key.TAB + Key.TAB + Key.TAB + Key.TAB + Key.ARROW_DOWN + Key.TAB + Key.TAB + Key.RETURN);
// act.sendKeys(Key.TAB).sendKeys(Key.TAB).sendKeys(Key.TAB).sendKeys(Key.ARROW_DOWN).sendKeys(Key.TAB).sendKeys(Key.TAB).sendKeys(Key.RETURN).sendKeys(Key.TAB).sendKeys(Key.TAB).sendKeys(Key.RETURN).perform().then(function () {
//     driver.switchTo().defaultContent();
//     act2.sendKeys('aa').perform();
//     // driver.getAllWindowHandles().then(function (w) {
//     //     console.log(w);
//     // });
// });
// driver.get('file:///C:/dell/00CODE/HTML5%20Parser/HTMLCompare/TestSuite/NoScript/0001.html');
//
driver.executeScript(script).then(function (ta) {
    t = process.hrtime(t);
    console.log((t[0] + (t[1] / 1000000000)) + ' sec');
    console.log(ta);
});
driver.wait(function () {
    return false;
}, 120000);
