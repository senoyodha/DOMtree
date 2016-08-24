function write(err) {
    if (doms.length > 0) {
        if (err != null)
            log += tools.logDouble(err);
        // log += tools.logDouble('Wrapping DOM and write into file');
        // for (var i = start; i < start + doms.length; i++) {
        //     log += tools.logDouble('--Wrapping DOM into ' + files[i].replace('.html', '.txt'));
        //     fs.writeFileSync(set[mode].pathOut + files[i].replace('.html', '.txt'), tools.DOMWrapper(doms[i - start], files[i]));
        // }
        t = process.hrtime(t);
        var rt = 'Running time: ' + (t[0] + (t[1] / 1000000000)) + ' sec';
        console.log('\n' + rt);
        log = rt + '\n\n' + log + '\n\n' + rt;
        fs.writeFileSync(pathLog + 'FirefoxVsCC_' + set[mode].mode + (mode[0] == 'B' ? mode.slice(1) : '') + '_' + (start + 1) + 'to' + (doms.length + start) + '_' + curdate + '.txt', log);
        console.log('\nEND: ' + files[(start + doms.length - 1)]);
    }
}
var t = process.hrtime();
var set = {
    NS: {
        pathIn: '../../../HTMLCompare/TestSuite/CommonCrawl/NoScript/',
        pathOut: '../../../HTMLCompare/DOM/CommonCrawl/NoScript/Firefox/',
        mode: 'Out_NS',
        scriptOn: false
    },
    S: {
        pathIn: '../../../HTMLCompare/TestSuite/CommonCrawl/Scripted/',
        pathOut: '../../../HTMLCompare/DOM/CommonCrawl/Scripted/Firefox/',
        mode: 'Out_S',
        scriptOn: true
    }
};
var mode = 'NS';
var developer = false;
var curdate = (new Date()).toISOString().substr(2, 17).replace("T", " ").replace(/\-/g, "").replace(/\:/g, "");
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
var start = 251;
var stop = 452;
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
    var t2 = process.hrtime();
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
                });
                return flag;
            }, 60000).then(function () {
                driver.switchTo().alert().getText().then(function (dom) {
                    // console.log(++cnt);
                    fs.writeFileSync(set[mode].pathOut + files[cnt].replace('.html', '.txt'), tools.DOMWrapper(JSON.parse(dom), files[cnt]));
                    t2 = process.hrtime(t2);
                    log += tools.logDouble('--DOM extracted from ' + files[cnt++] + ' ' + (t2[0] + (t2[1] / 1000000000)) + ' sec');
                    t2 = process.hrtime();
                    // doms.push(JSON.parse(dom));
                });
                driver.switchTo().alert().accept();
            });
        }
        else
            driver.executeScript(script).then(function (dom) {
                fs.writeFileSync(set[mode].pathOut + files[cnt].replace('.html', '.txt'), tools.DOMWrapper(JSON.parse(dom), files[cnt]));
                t2 = process.hrtime(t2);
                log += tools.logDouble('--DOM extracted from ' + files[cnt++] + ' ' + (t2[0] + (t2[1] / 1000000000)) + ' sec');
                t2 = process.hrtime();
                // doms.push(dom);
            });
    }
}, 7000);
driver.wait(function () {
    driver.switchTo().alert().then(function () {
        driver.switchTo().alert().accept();
    }, function (err) {
    });
    return cnt == limit;
}, 50000000).then(function () {
    write();
    // driver.quit();
}, function (err) {
    write('[07] + ' + err.message);
    // driver.quit();
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