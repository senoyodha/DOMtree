var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;
var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.firefox()).build();
// var script = 'var dom = []; function getDom(el, lvl, tmplt) { if (el !== document) { if (el === document.doctype) dom.push({ nodeName: "DOCTYPE", name: document.doctype.name, publicId: document.doctype.publicId, systemId: document.doctype.systemId, attributes: {}, namespace: null, level: lvl }); else { dom.push({ nodeName: el.nodeName, attributes: (function(el2) { var attr = {}; if (el2.attributes != null) for (var j = 0; j < el2.attributes.length; j++) attr[el2.attributes[j].nodeName] = {value: el2.attributes[j].nodeValue, namespace: el2.attributes[j].namespaceURI}; return attr; })(el), nodeValue: encodeURI(el.nodeValue), namespace: el.namespaceURI, level: lvl, template: tmplt}); if (el.nodeName == "TEMPLATE") { el = el.content; tmplt++; } } } for (var i = 0; i < el.childNodes.length; i++) getDom(el.childNodes[i], lvl + 1, tmplt); } getDom(document, -1, 0); return dom;';
var script = 'return 123;';
var act = new webdriver.ActionSequence(driver);
var act2 = new webdriver.ActionSequence(driver);

// driver.get('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/Try/h1.html');
// driver.findElement(webdriver.By.tagName('body')).sendKeys(Key.CONTROL + 't');
// driver.getAllWindowHandles().then(function (tabs) {
//     // driver.findElement(webdriver.By.tagName('body')).sendKeys(Key.CONTROL + Key.PAGE_DOWN);
//     driver.get('about:config');
//     act.sendKeys(Key.RETURN);
//     act.sendKeys("javascript.enabled");
//     act.perform().then(function () {
//         // act.sendKeys(Key.TAB);
//         // act.sendKeys(Key.RETURN);
//         // act.perform();
//         setTimeout(function () {
//             act.sendKeys(Key.TAB);
//             act.sendKeys(Key.RETURN);
//             act.perform();
//         }, 5000);
//     });

// act.sendKeys(Key.TAB);
// act.sendKeys(Key.RETURN);
// act.perform();
// driver.switchTo().window(tabs[1]);
// log += tools.logDouble('DOM extraction. Test file: ' + files.length + '. Browser: Chrome. Test mode: ' + mode);
// driver.navigate().refresh();
// });

driver.get('about:config');
act.sendKeys(Key.CONTROL + 't').perform();
driver.get('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/Try/h1.html');
driver.findElement(webdriver.By.tagName('body')).sendKeys(Key.CONTROL + '1');
act.sendKeys(Key.RETURN).sendKeys("javascript.enabled").perform().then(function () {
    setTimeout(function () {
        act2.sendKeys(Key.TAB).sendKeys(Key.RETURN).perform();
        // act2.sendKeys(Key.CONTROL + Key.PAGE_DOWN).perform();
        act2.sendKeys(Key.CONTROL + '2').perform();
        driver.navigate().refresh();
        driver.executeAsyncScript(script).then(function (dom) {
            // doms.push(dom);
            console.log(dom);
        });
    }, 1000);
});


// act.sendKeys(Key.RETURN);
// act.sendKeys("javascript.enabled");
// act.perform();


//
//
//
//
//
// driver.get('about:config');
// act.sendKeys(Key.RETURN);
// act.sendKeys("javascript.enabled");
// act.perform();
// act.sendKeys(Key.TAB);
// act.sendKeys(Key.RETURN);
// act.perform();
// // act.sendKeys(Key.CONTROL + 't');
// // act.perform();
// driver.navigate().to('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/Try/h1.html');
// driver.findElement(webdriver.By.tagName('body')).sendKeys(Key.CONTROL + 't');
// driver.get('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/Try/h1.html');
// var doms = [];
// driver.executeScript(script).then(function (dom) {
//     // doms.push(dom);
//     console.log(dom);
// });
driver.wait(function () {
    return false;
}, 60000);