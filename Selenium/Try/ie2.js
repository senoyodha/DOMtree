var t = process.hrtime();
var set = {
    B: {
        pathIn: '../../../HTMLCompare/TestSuite/Both/',
        pathOut: '../../../HTMLCompare/DOM/Both/IE/',
        pathCompare: '../../../HTMLCompare/DOM/Both/Original/',
        mode: 'Out_B',
        scriptOn: true
    },
    NS: {
        pathIn: '../../../HTMLCompare/TestSuite/NoScript/',
        pathOut: '../../../HTMLCompare/DOM/NoScript/IE/',
        pathCompare: '../../../HTMLCompare/DOM/NoScript/Original/',
        mode: 'Out_NS',
        scriptOn: false
    },
    S: {
        pathIn: '../../../HTMLCompare/TestSuite/Scripted/',
        pathOut: '../../../HTMLCompare/DOM/Scripted/IE/',
        pathCompare: '../../../HTMLCompare/DOM/Scripted/Original/',
        mode: 'Out_S',
        scriptOn: true
    }
};
var mode = 'S';

if (!set[mode].scriptOn)
    console.log('Scripting cannot be turned off on IE. Program is terminated.');
else {
    var pathLog = '../../../HTMLCompare/Log/';
    var fs = require('fs');
    var tools = require('./../Test/tools');
    var comparator = require('../../HTMLCompare/JS/comparator');
    var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;
    var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.ie()).build();
    var script = fs.readFileSync('./domscript.js', 'utf8');
    var files = fs.readdirSync(set[mode].pathIn);
    var doms = [];
    var pathTest = tools.convertNameURL(set[mode].pathIn, __dirname);
    var start = 0;
    var stop = 0;
    var log = '';

    var files2 = fs.readdirSync(set[mode].pathOut);
    for (var i in files2)
        fs.unlinkSync(set[mode].pathOut + files2[i]);

    var limit = stop > 0 ? stop : files.length;
    var cnt = 0;
    driver.get(pathTest + files[start]);
    log += tools.logDouble('DOM extraction. Test file: ' + (limit - start) + '. Browser: IE. Test mode: ' + set[mode].mode);
    for (var i in files) {
        driver.navigate().to(pathTest + files[i]);
        driver.executeScript(script).then(function (dom) {
            console.log(++cnt);
            doms.push(dom);
        });
    }
    driver.wait(function () {
        return doms.length == limit - start;
    }, 600000).then(function () {
        console.log(doms.length);
        for (var i in doms)
            console.log(doms[i]);
        driver.quit();
    });
}