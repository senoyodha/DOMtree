var set = {
    B: {
        pathIn: '../../HTMLCompare/TestSuite/Both/',
        pathOut: '../../HTMLCompare/DOM/Both/Firefox/',
        pathCompare: '../../HTMLCompare/DOM/Both/Original/',
        mode: 'Out_B',
        scriptOn: true
    },
    NS: {
        pathIn: '../../HTMLCompare/TestSuite/NoScript/',
        pathOut: '../../HTMLCompare/DOM/NoScript/Firefox/',
        pathCompare: '../../HTMLCompare/DOM/NoScript/Original/',
        mode: 'Out_NS',
        scriptOn: false
    },
    S: {
        pathIn: '../../HTMLCompare/TestSuite/Scripted/',
        pathOut: '../../HTMLCompare/DOM/Scripted/Firefox/',
        pathCompare: '../../HTMLCompare/DOM/Scripted/Original/',
        mode: 'Out_S',
        scriptOn: true
    }
};
var mode = 'B';

var pathLog = '../../HTMLCompare/Log/';
var fs = require('fs');
var tools = require('./../Test/tools');
var comparator = require('../../HTMLCompare/JS/comparator');
var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;
var firefox = require('selenium-webdriver/firefox');
var profile = new firefox.Profile();
if (mode == 'NS')
    profile.addExtension('./noscript.xpi');
var options = new firefox.Options().setProfile(profile);
var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.firefox()).setFirefoxOptions(options).build();
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
driver.get(pathTest + files[0]);
if (mode == 'NS') {
    log += tools.logDouble('WARNING! This mode (' + mode + ') is still in experimental version. You may not get the expected results\n');
    driver.findElement(webdriver.By.tagName('body')).sendKeys(Key.CONTROL + '2');
    driver.findElement(webdriver.By.tagName('body')).sendKeys(Key.CONTROL + Key.F4);
}
log += tools.logDouble('DOM extraction. Test file: ' + files.length + '. Browser: Firefox. Test mode: ' + set[mode].mode);
driver.executeScript(script).then(function (ta) {
    console.log(ta);
});
// for (var i = start; i < limit; i++) {
//     log += tools.logDouble('--Extracting DOM from ' + files[i]);
//     driver.navigate().to(pathTest + files[i]);
//     driver.executeScript(script).then(function (dom) {
//         doms.push(dom);
//     });
// }
driver.wait(function () {
    return false;
}, 120000);
