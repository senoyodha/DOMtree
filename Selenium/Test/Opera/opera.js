var t = process.hrtime();
var set = {
    B: {
        pathIn: '../../../HTMLCompare/TestSuite/Both/',
        pathOut: '../../../HTMLCompare/DOM/Both/Opera/',
        pathCompare: '../../../HTMLCompare/DOM/Both/Original/',
        mode: 'Out_B',
        scriptOn: false
    },
    NS: {
        pathIn: '../../../HTMLCompare/TestSuite/NoScript/',
        pathOut: '../../../HTMLCompare/DOM/NoScript/Opera/',
        pathCompare: '../../../HTMLCompare/DOM/NoScript/Original/',
        mode: 'Out_NS',
        scriptOn: false
    },
    S: {
        pathIn: '../../../HTMLCompare/TestSuite/Scripted/',
        pathOut: '../../../HTMLCompare/DOM/Scripted/Opera/',
        pathCompare: '../../../HTMLCompare/DOM/Scripted/Original/',
        mode: 'Out_S',
        scriptOn: true
    }
};
var mode = 'B';

var pathLog = '../../../HTMLCompare/Log/';
var fs = require('fs');
var tools = require('./../tools');
var comparator = require('../../../HTMLCompare/JS/comparator');
var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;
var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.opera()).build();
var script = fs.readFileSync('./domscript.js', 'utf8');
var files = fs.readdirSync(set[mode].pathIn);
var doms = [];
var pathTest = tools.convertNameURL(set[mode].pathIn, __dirname);
var start = 0;
var stop = 0;
var log = '';

// var files2 = fs.readdirSync(set[mode].pathOut);
// for (var i in files2)
//     fs.unlinkSync(set[mode].pathOut + files2[i]);

if (start > stop && stop != 0) {
    var temp = start;
    start = stop;
    stop = temp;
}
var limit = stop > 0 ? stop : files.length;
driver.get('about:config');
driver.findElement(By.id('search-field')).sendKeys('javascript');
driver.findElement(By.tagName('body')).sendKeys(Key.CONTROL + 't');
driver.getAllWindowHandles().then(function (tabs) {
    driver.switchTo().window(tabs[1]);
    driver.get(pathTest + files[start]);
    driver.switchTo().window(tabs[0]);
    driver.findElements(By.name('javascript')).then(function (el) {
        el[set[mode].scriptOn ? 0 : 1].click();
    });
    driver.switchTo().window(tabs[1]);
    log += tools.logDouble('DOM extraction. Test file: ' + (limit - start) + '. Browser: Opera. Test mode: ' + set[mode].mode);
    if (!set[mode].scriptOn)
        for (var i = 0; i < 10; i++)
            driver.navigate().refresh();
    for (var i = start; i < limit; i++) {
        log += tools.logDouble('--Extracting DOM from ' + files[i]);
        driver.navigate().to(pathTest + files[i]);
        driver.executeScript(script).then(function (dom) {
            doms.push(dom);
        });
    }
    driver.wait(function () {
        return doms.length == limit - start;
    }, 600000).then(function () {
        log += tools.logDouble('Wrapping DOM and write into file');
        for (var i = start; i < limit; i++) {
            log += tools.logDouble('--Wrapping DOM into ' + files[i].replace('.html', '.txt'));
            fs.writeFileSync(set[mode].pathOut + files[i].replace('.html', '.txt'), tools.DOMWrapper(doms[i - start], files[i]));
        }
        log += tools.logDouble();
        log += comparator.compare(set[mode].pathOut, set[mode].pathCompare, set[mode].mode, '../');
        t = process.hrtime(t);
        var rt = 'Running time: ' + (t[0] + (t[1] / 1000000000)) + ' sec';
        console.log('\n' + rt);
        log = rt + '\n\n' + log + '\n\n' + rt;
        fs.writeFileSync(pathLog + 'OperaVsHTML5lib_' + set[mode].mode + '_' + (new Date()).toISOString().substr(2, 17).replace("T", " ").replace(/\-/g, "").replace(/\:/g, "") + '.txt', log);
    });
    driver.quit();
});


// var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;
// var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.opera()).build();
// driver.get('about:config');
// driver.findElement(By.id('search-field')).sendKeys('javascript');
// driver.findElement(By.tagName('body')).sendKeys(Key.CONTROL + 't');
// driver.getAllWindowHandles().then(function (tabs) {
//     driver.switchTo().window(tabs[1]);
//     driver.get('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/Try/h1.html');
//     driver.switchTo().window(tabs[0]);
//             driver.findElements(By.name('javascript')).then(function (el) {
//                 el[1].click();
//             });
//             driver.switchTo().window(tabs[1]);
//             driver.navigate().refresh();
//     driver.get('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/Try/h1.html');
//     driver.findElement(By.tagName('body')).sendKeys(Key.CONTROL + 't');
//     driver.getAllWindowHandles().then(function (tabs2) {
//         driver.switchTo().window(tabs2[2]);
//         driver.get('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/Try/h1.html');
//     });
// });