var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;
var firefox = require('selenium-webdriver/firefox');
var profile = new firefox.Profile();
profile.addExtension('./noscript.xpi');
var options = new firefox.Options().setProfile(profile);
var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.firefox()).setFirefoxOptions(options).build();
var act = new webdriver.ActionSequence(driver);
// var script = 'var dom = []; function getDom(el, lvl, tmplt) { if (el !== document) { if (el === document.doctype) dom.push({ nodeName: "DOCTYPE", name: document.doctype.name, publicId: document.doctype.publicId, systemId: document.doctype.systemId, attributes: {}, namespace: null, level: lvl }); else { dom.push({ nodeName: el.nodeName, attributes: (function(el2) { var attr = {}; if (el2.attributes != null) for (var j = el2.attributes.length - 1; j >= 0; j--) if (!(el.nodeName == "HTML" && el2.attributes[j].nodeName == "webdriver" && el2.attributes[j].value == "true")) attr[el2.attributes[j].nodeName] = {value: el2.attributes[j].value, namespace: el2.attributes[j].namespaceURI}; return attr; })(el), nodeValue: encodeURI(el.nodeValue), namespace: el.namespaceURI, level: lvl, template: tmplt}); if (el.nodeName == "TEMPLATE") { el = el.content; tmplt++; } } } for (var i = 0; i < el.childNodes.length; i++) getDom(el.childNodes[i], lvl + 1, tmplt); } getDom(document, -1, 0); alert(JSON.stringify(dom));';
var script = 'alert(document.lastChild);';
setTimeout(function () {
    driver.findElement(webdriver.By.tagName('body')).sendKeys(Key.CONTROL + Key.F4);
    driver.get('file:///C:/dell/00CODE/HTML5%20Parser/HTMLCompare/TestSuite/NoScript/0001.html');


    driver.findElement(webdriver.By.tagName('body')).sendKeys(Key.CONTROL + Key.SHIFT + 'k');
    driver.switchTo().activeElement().sendKeys(Key.RETURN);
    act.sendKeys(script).sendKeys(Key.RETURN).perform();
    driver.switchTo().alert().getText().then(function (b) {
        console.log(b);
    });
    driver.switchTo().alert().accept();


    // driver.getAllWindowHandles().then(function (tabs) {
    //     driver.switchTo().window(tabs[0]);
    // });
    driver.navigate().to('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/Try/h1.html');
    // driver.findElement(webdriver.By.tagName('body')).sendKeys(Key.CONTROL + Key.SHIFT + 'k');
    // driver.switchTo().activeElement().sendKeys(Key.RETURN);
    act.perform();
    driver.switchTo().alert().getText().then(function (b) {
        console.log(b);
    });
    driver.switchTo().alert().accept();
}, 7000);
driver.wait(function () {
    return false;
}, 600000);


// var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;
// var firefox = require('selenium-webdriver/firefox');
// var profile = new firefox.Profile();
// profile.addExtension('./noscript.xpi');
// var options = new firefox.Options().setProfile(profile);
// options.setLoggingPreferences(webdriver.logging.browser, webdriver.logging.all);
// var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.firefox()).setFirefoxOptions(options).build();
// var act = new webdriver.ActionSequence(driver);
// setTimeout(function () {
//     driver.findElement(webdriver.By.tagName('body')).sendKeys(Key.CONTROL + Key.F4);
//     driver.get('file:///C:/dell/00CODE/HTML5%20Parser/HTMLCompare/TestSuite/NoScript/0001.html');
//     driver.findElement(webdriver.By.tagName('body')).sendKeys(Key.CONTROL + Key.SHIFT + 'k');
//     driver.switchTo().activeElement().sendKeys(Key.RETURN);
//     act.sendKeys('console.log("abcde");').sendKeys(Key.RETURN).perform();
//     act.sendKeys('"abcde";').sendKeys(Key.RETURN).perform();
//     act.sendKeys('return "abcde";').sendKeys(Key.RETURN).perform().then(function (a) {
//         console.log(a);
//         driver.manage().logs().getAvailableLogTypes().then(function (l) {
//             console.log(l);
//             driver.manage().logs().get(l[0]).then(function (j) {
//                 console.log(JSON.stringify(j));
//             });
//         });
//
//         // console.log(driver.)
//     });
// }, 7000);
// driver.wait(function () {
//     return false;
// }, 600000);