// var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;
// var firefox = require('selenium-webdriver/firefox');
// const Capabilities = require('selenium-webdriver/lib/capabilities').Capabilities;
// var capabilities = Capabilities.firefox();
// capabilities.set('marionette', true);
// var profile = new firefox.Profile();
// var options = new firefox.Options().setProfile(profile);
// var driver = new webdriver.Builder().withCapabilities(capabilities).build();
// driver.get('http://google.com');
// driver.navigate().to('http://google.com');
// driver.getAllWindowHandles().then(function (a) {
//     console.log(a);
// });
var firefox = require('selenium-webdriver/firefox');
const webdriver = require('selenium-webdriver');
const Capabilities = require('selenium-webdriver/lib/capabilities').Capabilities;

var capabilities = Capabilities.firefox();
capabilities.set('marionette', true);
console.log(1);
var driver = new webdriver.Builder().withCapabilities(capabilities).build();
console.log(2);
driver.get('http://google.com').then(function (a) {
    console.log('b');
});
console.log(3);
driver.navigate().to('http://google.com').then(function (a) {
    console.log('c');
});
console.log(4);
driver.getAllWindowHandles().then(function (a) {
    console.log(5);
    console.log(a);
});