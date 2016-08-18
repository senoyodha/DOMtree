function process(start, limit) {
    var t = process.hrtime();
    var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
    var doms = [];
    var log = '';

    driver.get('chrome://settings/content');
    driver.findElement(By.tagName('body')).sendKeys(Key.CONTROL + 't');
    driver.getAllWindowHandles().then(function (tabs) {
        driver.switchTo().window(tabs[1]);
        driver.get(pathTest + files[start]);
        driver.switchTo().window(tabs[0]);
        driver.switchTo().frame(driver.findElement(By.name('settings')));
        driver.findElements(By.name('javascript')).then(function (el) {
            el[set[mode].scriptOn ? 0 : 1].click();
        });
        driver.switchTo().window(tabs[1]);
        log += tools.logDouble('DOM extraction. Start: ' + files[start] + '. End: ' + files[limit - 1] + '. Browser: Chrome. Test mode: ' + set[mode].mode);
        if (!set[mode].scriptOn)
            for (var i = 0; i < 10; i++)
                driver.navigate().refresh();
        var cnt = start;
        for (var i = start; i < limit; i++) {
            log += tools.logDouble('--Extracting DOM from ' + files[i]);
            driver.navigate().to(pathTest + files[i]);
            driver.switchTo().alert().then(function () {
                driver.switchTo().alert().getText().then(function (text) {
                    log += tools.logDouble('[001] Unexpected alert : ' + text);
                });
                driver.switchTo().alert().accept();
            }, function (err) {
                log += tools.logDouble('[002] Unexpected error : ' + err.message);
            });
            driver.executeScript(script).then(function (dom) {
                console.log(files[cnt++]);
                doms.push(dom);
            }, function (err) {
                driver.switchTo().alert().then(function () {
                    log += tools.logDouble('[003] Unexpected error : ' + err.message);
                    driver.switchTo().alert().accept();
                    driver.executeScript(script).then(function (dom) {
                        doms.push(dom);
                    });
                }, function (err) {
                    log += tools.logDouble('[004] Unexpected error : ' + err.message);
                    driver.executeScript(script).then(function (dom) {
                        doms.push(dom);
                    });
                });
            });
        }
        driver.wait(function () {
            return doms.length == limit - start;
        }, 10000000).then(function () {

        });
        driver.quit();
    });
}

function write(content) {

}

var b = process.hrtime();

var pathLog = '../../../HTMLCompare/Log/';
var fs = require('fs');
var tools = require('./../tools');
var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;
var script = fs.readFileSync('./domscript.js', 'utf8');

var set = {
    NS: {
        pathIn: '../../../HTMLCompare/TestSuite/CommonCrawl/NoScript/',
        pathOut: '../../../HTMLCompare/DOM/CommonCrawl/NoScript/Chrome/',
        mode: 'Out_NS',
        scriptOn: false
    },
    S: {
        pathIn: '../../../HTMLCompare/TestSuite/CommonCrawl/Scripted/',
        pathOut: '../../../HTMLCompare/DOM/CommonCrawl/Scripted/Chrome/',
        mode: 'Out_S',
        scriptOn: true
    }
};
var mode = 'S';
var start = 0;
var stop = 0;
var pathTest = tools.convertNameURL(set[mode].pathIn, __dirname);
var files = fs.readdirSync(set[mode].pathIn);

if (stop <= 0)
    stop = files.length;
if (start > stop && stop != 0) {
    var temp = start;
    start = stop;
    stop = temp;
}
var index = start;

while (index < stop) {
    write(process(index, stop));
}


var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();

var doms = [];

var start = 0;
var stop = 0;
var log = '';


var limit = stop > 0 ? stop : files.length;
driver.get('chrome://settings/content');
driver.findElement(By.tagName('body')).sendKeys(Key.CONTROL + 't');
driver.getAllWindowHandles().then(function (tabs) {
    driver.switchTo().window(tabs[1]);
    driver.get(pathTest + files[start]);
    driver.switchTo().window(tabs[0]);
    driver.switchTo().frame(driver.findElement(By.name('settings')));
    driver.findElements(By.name('javascript')).then(function (el) {
        el[set[mode].scriptOn ? 0 : 1].click();
    });
    driver.switchTo().window(tabs[1]);
    log += tools.logDouble('DOM extraction. Test file: ' + (limit - start) + '. Browser: Chrome. Test mode: ' + set[mode].mode);
    if (!set[mode].scriptOn)
        for (var i = 0; i < 10; i++)
            driver.navigate().refresh();
    var cnt = start;
    for (var i = start; i < limit; i++) {
        log += tools.logDouble('--Extracting DOM from ' + files[i]);
        driver.navigate().to(pathTest + files[i]);
        driver.switchTo().alert().then(function () {
            driver.switchTo().alert().getText().then(function (text) {
                console.log('##A ' + text);
            });
            driver.switchTo().alert().accept();
        }, function () {
        });
        driver.executeScript(script).then(function (dom) {
            console.log(files[cnt++]);
            doms.push(dom);
        }, function (err) {
            driver.switchTo().alert().then(function () {
                console.log('##B ' + err);
                driver.switchTo().alert().accept();
                driver.executeScript(script).then(function (dom) {
                    doms.push(dom);
                });
            }, function (err) {
                console.log('##C ' + err);
                driver.executeScript(script).then(function (dom) {
                    doms.push(dom);
                });
            });
        });
    }
    driver.wait(function () {
        return doms.length == limit - start;
    }, 10000000).then(function () {
        log += tools.logDouble('Wrapping DOM and write into file');
        for (var i = start; i < limit; i++) {
            log += tools.logDouble('--Wrapping DOM into ' + files[i].replace('.html', '.txt'));
            fs.writeFileSync(set[mode].pathOut + files[i].replace('.html', '.txt'), tools.DOMWrapper(doms[i - start], files[i]));
        }
        t = process.hrtime(t);
        var rt = 'Running time: ' + (t[0] + (t[1] / 1000000000)) + ' sec';
        console.log('\n' + rt);
        log = rt + '\n\n' + log + '\n\n' + rt;
        fs.writeFileSync(pathLog + 'ChromeVsCommonCrawl_' + set[mode].mode + '_' + (start != 0 || stop != 0 ? (start + 1) + 'to' + (doms.length + start) + '_' : '') + (new Date()).toISOString().substr(2, 17).replace("T", " ").replace(/\-/g, "").replace(/\:/g, "") + '.txt', log);
    });
    driver.quit();
});
