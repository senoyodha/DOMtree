var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;

var firefox = require('selenium-webdriver/firefox');
var profile = new firefox.Profile();
// profile.addExtension('./noscript.xpi');
var options = new firefox.Options().setProfile(profile);

var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.firefox()).setFirefoxOptions(options).build();
// var script = 'document.write(12345);';
var script = 'return 12345;';
// var script = '12345;';
// var script = 'alert(12345);';

driver.get('file:///C:/dell/00CODE/HTML5%20Parser/HTMLCompare/TestSuite/Both/0001.html');
driver.executeScript(script).then(function (ta) {
    t = process.hrtime(t);
    console.log((t[0] + (t[1] / 1000000000)) + ' sec');
    console.log(ta);
});
var t = process.hrtime();
// driver.executeScript(script).then(function (ta) {
//     t = process.hrtime(t);
//     console.log((t[0] + (t[1]/1000000000)) + ' sec');
//     console.log(ta);
// }, function (err) {
//     t = process.hrtime(t);
//     console.log((t[0] + (t[1]/1000000000)) + ' sec');
//     console.log(err);
// });
driver.wait(function () {
    return false;
}, 120000);
