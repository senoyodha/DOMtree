var t = process.hrtime();
var set = {
    BNS: {
        pathIn: '../../../HTMLCompare/TestSuite/Both/',
        pathOut: '../../../HTMLCompare/DOM/Both/Firefox/',
        pathCompare: '../../../HTMLCompare/DOM/Both/Original/',
        mode: 'Out_B',
        scriptOn: false
    },
    BS: {
        pathIn: '../../../HTMLCompare/TestSuite/Both/',
        pathOut: '../../../HTMLCompare/DOM/Both/Firefox/',
        pathCompare: '../../../HTMLCompare/DOM/Both/Original/',
        mode: 'Out_B',
        scriptOn: true
    },
    NS: {
        pathIn: '../../../HTMLCompare/TestSuite/NoScript/',
        pathOut: '../../../HTMLCompare/DOM/NoScript/Firefox/',
        pathCompare: '../../../HTMLCompare/DOM/NoScript/Original/',
        mode: 'Out_NS',
        scriptOn: false
    },
    S: {
        pathIn: '../../../HTMLCompare/TestSuite/Scripted/',
        pathOut: '../../../HTMLCompare/DOM/Scripted/Firefox/',
        pathCompare: '../../../HTMLCompare/DOM/Scripted/Original/',
        mode: 'Out_S',
        scriptOn: true
    }
};
var mode = 'BS';
var developer = true;

var pathLog = '../../../HTMLCompare/Log/';
var fs = require('fs');
var tools = require('./../tools');
var comparator = require('../../../HTMLCompare/JS/comparator');
var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;
var firefox = require('selenium-webdriver/firefox');
var profile = new firefox.Profile();
if (!set[mode].scriptOn)
    profile.addExtension('./noscript.xpi');
var options = new firefox.Options().setProfile(profile);
var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.firefox().set('marionette', true));
if (developer)
    driver = driver.build();
else
    driver = driver.setFirefoxOptions(options).build();
var act = new webdriver.ActionSequence(driver);
var script = fs.readFileSync('./domscript.js', 'utf8');
var scriptNS = fs.readFileSync('./domscriptNS.js', 'utf8');
var files = fs.readdirSync(set[mode].pathIn);
var doms = [];
var pathTest = tools.convertNameURL(set[mode].pathIn, __dirname);
var start = 0;
var stop = 0;
var log = '';

// var files2 = fs.readdirSync(set[mode].pathOut);
// for (var i in files2)
//     fs.unlinkSync(set[mode].pathOut + files2[i]);

var limit = stop > 0 ? stop : files.length;
setTimeout(function () {
    if (!set[mode].scriptOn) {
        driver.findElement(By.tagName('body')).sendKeys(Key.CONTROL + Key.F4);
    }
    console.log(pathTest + " " + files[start]);
    driver.get(pathTest + files[start]);
    log += tools.logDouble('DOM extraction. Test file: ' + (limit - start) + '. Browser: Firefox. Test mode: ' + set[mode].mode);
    var cnt = start;
    for (var i = start; i < limit; i++) {
        log += tools.logDouble('--Extracting DOM from ' + files[i]);
        driver.navigate().to(pathTest + files[i]);
        if (!set[mode].scriptOn) {
            if (i == start) {
                driver.findElement(By.tagName('html')).sendKeys(Key.CONTROL + Key.SHIFT + 'k');
                driver.switchTo().activeElement().sendKeys(Key.RETURN);
                act.sendKeys(scriptNS).sendKeys(Key.RETURN).perform();
            }
            else
                act.perform();
            var flag = false;
            driver.wait(function () {
                driver.switchTo().alert().then(function () {
                    flag = true;
                }, function () {
                    flag = false;
                });
                return flag;
            }, 60000).then(function () {
                driver.switchTo().alert().getText().then(function (dom) {
                    // console.log(++cnt);
                    doms.push(JSON.parse(dom));
                });
                driver.switchTo().alert().accept();
            });
        }
        else
            driver.executeScript(script).then(function (dom) {
                doms.push(dom);
            });
    }
}, 7000);
driver.wait(function () {
    return doms.length == limit - start;
    // return false;
}, 5000000).then(function () {
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
    fs.writeFileSync(pathLog + 'FirefoxVsHTML5lib_' + (developer ? 'D_' : '') + set[mode].mode + (mode[0] == 'B' ? mode.slice(1) : '') + '_' + (start != 0 || stop != 0 ? (start + 1) + 'to' + (doms.length + start) + '_' : '') + (new Date()).toISOString().substr(2, 17).replace("T", " ").replace(/\-/g, "").replace(/\:/g, "") + '.txt', log);
}, function (err) {
    log += tools.logDouble('Error: ' + err.stack);
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
    fs.writeFileSync(pathLog + 'FirefoxVsHTML5lib_' + (developer ? 'D_' : '') + set[mode].mode + (mode[0] == 'B' ? mode.slice(1) : '') + '_' + (start + 1) + 'to' + (doms.length + start) + '_' + (new Date()).toISOString().substr(2, 17).replace("T", " ").replace(/\-/g, "").replace(/\:/g, "") + '.txt', log);
});
//
// const webdriver = require('selenium-webdriver');
// const Capabilities = require('selenium-webdriver/lib/capabilities').Capabilities;
//
// var capabilities = Capabilities.firefox();
//
// // Tell the Node.js bindings to use Marionette.
// // This will not be necessary in the future,
// // when Selenium will auto-detect what remote end
// // it is talking to.
// capabilities.set('marionette', true);
//
// var driver = new webdriver.Builder().withCapabilities(capabilities).build();