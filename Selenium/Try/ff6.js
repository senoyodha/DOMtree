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
// profile.addExtension('./noscript.xpi');
var options = new firefox.Options().setProfile(profile);
var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.firefox()).setFirefoxOptions(options).build();
// var script = 'return 12345;';
var script = fs.readFileSync('./domscript.js', 'utf8');


driver.get('file:///C:/dell/00CODE/HTML5%20Parser/HTMLCompare/TestSuite/Both/0001.html');
driver.executeScript(script).then(function (ta) {
    console.log(ta);
});
driver.wait(function () {
    return false;
}, 120000);
