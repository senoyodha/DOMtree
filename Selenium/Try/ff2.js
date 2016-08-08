var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;
var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.firefox()).build();
var script = 'return 1;';
var script2 = 'return 2;';
var script3 = 'document.write("<?php header(' + "'Refresh:0'" + '); ?>");';
var act = new webdriver.ActionSequence(driver);
var act2 = new webdriver.ActionSequence(driver);
var act3 = new webdriver.ActionSequence(driver);

driver.get('about:config');
act.sendKeys(Key.CONTROL + 'n').perform();
driver.getAllWindowHandles().then(function (tabs) {
    driver.switchTo().window(tabs[1]);
    driver.get('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/Try/h1.html');
    driver.switchTo().window(tabs[0]);
    act.sendKeys(Key.RETURN).sendKeys("javascript.enabled").perform().then(function () {
        setTimeout(function () {
            act2.sendKeys(Key.TAB).sendKeys(Key.RETURN).perform();
            driver.switchTo().window(tabs[1]);
            driver.executeScript(script).then(function (t) {
                console.log(t);
            });
            // driver.navigate().refresh();
            driver.executeScript(script3);
            driver.executeScript(script2).then(function (t) {
                console.log(t);
            });
            // driver.switchTo().window(tabs[0]);
            // act3.sendKeys(Key.RETURN).perform();
            // driver.switchTo().window(tabs[1]);
            // driver.navigate().refresh();
            // driver.executeScript(script);
        }, 1000);
    });
});


//
// driver.findElement(webdriver.By.tagName('body')).sendKeys(Key.CONTROL + 't');
// driver.getAllWindowHandles().then(function (tabs) {
//     driver.switchTo().window(tabs[1]);
//     driver.get(pathTest + files[0]);
//     driver.switchTo().window(tabs[0]);
//     driver.switchTo().frame(driver.findElement(By.name('settings')));
//     driver.findElements(By.name('javascript')).then(function (el) {
//         el[scriptOn ? 0 : 1].click();
//     });
//     driver.switchTo().window(tabs[1]);
//     log += tools.logDouble('DOM extraction. Test file: ' + files.length + '. Browser: Chrome. Test mode: ' + mode);
//     driver.navigate().refresh();

driver.wait(function () {
    return false;
}, 60000);