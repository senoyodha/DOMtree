function wrapper(dom) {
    var s = '';
    for (var i in dom) {
        if (i == 0 && dom[i].nodeName == 'DOCTYPE')
            s += 'DOCTYPE: ' + dom[0].name +
                (dom[0].publicId ? ' PUBLIC "' + dom[0].publicId + '"' : '')
                + (!dom[0].publicId && dom[0].systemId ? ' SYSTEM' : '')
                + (dom[0].systemId ? ' "' + dom[0].systemId + '"' : '') + '\n';
        else
            s += '--'.repeat(dom[i].level) + dom[i].nodeName + (Object.keys(dom[i].attributes).length > 0 ? ' ' + JSON.stringify(dom[i].attributes) : '') + (dom[i].nodeName == '#text' ? ': ' + dom[i].nodeValue.replace(/\t/g, ' ').replace(/\n/g, ' ') : '') + '\n';
        if (dom[i].nodeName == 'HTML')
            console.log(Object.keys(dom[i].attributes).length);
    }
    return s;
}
var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;
var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
// var script = 'return ';
// // var script = 'var dom = []; function getDom(el, lvl) { if (el !== document) { if (el === document.doctype) dom.push({ nodeName: "DOCTYPE", name: document.doctype.name, publicId: document.doctype.publicId, systemId: document.doctype.systemId, attributes: {}, level: lvl }); else dom.push({ nodeName: el.nodeName, attributes: (function(el2) { var attr = {}; if (el2.attributes != null) for (var j = 0; j < el2.attributes.length; j++) attr[el2.attributes[j].nodeName] = el2.attributes[ j].nodeValue; return attr; })(el), nodeValue: el.nodeValue, level: lvl }); } for (var i = 0; i < el.childNodes.length; i++) getDom(el.childNodes[i], lvl + 1); } getDom(document, -1); return dom;';
// driver.get('chrome://settings/content');
// driver.findElement(webdriver.By.tagName('body')).sendKeys(Key.CONTROL + 't');
// driver.getAllWindowHandles().then(function (tabs) {
//     driver.switchTo().window(tabs[1]);
//     driver.get('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/Try/h1.html');
//     driver.switchTo().window(tabs[0]);
//     driver.switchTo().frame(driver.findElement(By.name('settings')));
//     driver.findElements(By.name('javascript')).then(function (el) {
//         el[1].click();
//     });
//     driver.switchTo().window(tabs[1]);
//     driver.navigate().to('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/Try/h1.html');
//     var dom;
//     driver.executeScript(script).then(function (doms) {
//         dom = doms;
//         console.log(dom);
//     });
//     // console.log(3);
//     // driver.get('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/Try/h2.html').then(function (s) {
//     //     console.log(4);
//     // });
//     // console.log(5);
//     // driver.getPageSource().then(function (src) {
//     //     console.log(6);
//     // });
//     // console.log(7);
//     // driver.quit();
// });
