var t = process.hrtime();
var set = {
    BNS: {
        pathIn: '../../../HTMLCompare/TestSuite/Both/',
        pathOut: '../../../HTMLCompare/DOM/Both/Safari/',
        pathCompare: '../../../HTMLCompare/DOM/Both/Original/',
        mode: 'Out_B',
        scriptOn: false
    },
    BS: {
        pathIn: '../../../HTMLCompare/TestSuite/Both/',
        pathOut: '../../../HTMLCompare/DOM/Both/Safari/',
        pathCompare: '../../../HTMLCompare/DOM/Both/Original/',
        mode: 'Out_B',
        scriptOn: true
    },
    NS: {
        pathIn: '../../../HTMLCompare/TestSuite/NoScript/',
        pathOut: '../../../HTMLCompare/DOM/NoScript/Safari/',
        pathCompare: '../../../HTMLCompare/DOM/NoScript/Original/',
        mode: 'Out_NS',
        scriptOn: false
    },
    S: {
        pathIn: '../../../HTMLCompare/TestSuite/Scripted/',
        pathOut: '../../../HTMLCompare/DOM/Scripted/Safari/',
        pathCompare: '../../../HTMLCompare/DOM/Scripted/Original/',
        mode: 'Out_S',
        scriptOn: true
    }
};
var mode = 'NS';

var pathLog = '../../../HTMLCompare/Log/';
var fs = require('fs');
var tools = require('./../tools');
var comparator = require('../../../HTMLCompare/JS/comparator');
var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;
var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.safari()).build();
var script = fs.readFileSync('./domscript.js', 'utf8');
var files = fs.readdirSync(set[mode].pathIn);
var doms = [];
var pathTest = tools.convertNameURL(set[mode].pathIn, __dirname, 2, 'examples/');
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
driver.get(pathTest + files[start]);
if (!set[mode].scriptOn)
    driver.executeScript('alert("Please disable JavaScript manually through the settings!");').then(function () {

    }, function (err) {
        console.log(err.message);
    });
setTimeout(function () {
    driver.switchTo().alert().then(function () {
        driver.switchTo().alert().accept();
    }, function (err) {
    });
    log += tools.logDouble('DOM extraction. Test file: ' + (limit - start) + '. Browser: Safari. Test mode: ' + set[mode].mode);
    for (var i = start; i < limit; i++) {
        log += tools.logDouble('--Extracting DOM from ' + (pathTest + files[i]));
        driver.navigate().to(pathTest + files[i]).then(function () {
            driver.executeScript(script).then(function (dom) {
                for (var j in dom) {
                    var st = '';
                    for (var k in dom[j].nodeValue)
                        st += String.fromCodePoint(dom[j].nodeValue[k]);
                    dom[j].nodeValue = st;
                }
                doms.push(dom);
            });
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
        fs.writeFileSync(pathLog + 'SafariVsHTML5lib_' + set[mode].mode + (mode[0] == 'B' ? mode.slice(1) : '') + '_' + (start != 0 || stop != 0 ? (start + 1) + 'to' + (doms.length + start) + '_' : '') + (new Date()).toISOString().substr(2, 17).replace("T", " ").replace(/\-/g, "").replace(/\:/g, "") + '.txt', log);
        driver.quit();
    });
}, 10000);