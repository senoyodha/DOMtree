var webdriver = require('selenium-webdriver'), By = webdriver.By;
var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
driver.get('chrome://settings/content');
driver.switchTo().frame(driver.findElement(By.name("settings")));
// driver.findElement(By.id('search-field')).sendKeys('javascript');
driver.findElements(By.name('javascript')).then(function (el) {
    el[1].click();
    // driver.getPageSource().then(function (str) {
    //     console.log(1);
    // });
    // driver.quit();
});
driver.manage().timeouts().pageLoadTimeout(1000);
driver.manage().timeouts().setScriptTimeout(1000);
driver.manage().timeouts().implicitlyWait(1000);
driver.navigate().to('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/h1.html');
// driver.quit();
driver.get('chrome://settings/content');
driver.switchTo().frame(driver.findElement(By.name("settings")));
driver.findElements(By.name('javascript')).then(function (el) {
    el[0].click();
});
driver.navigate().to('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/h2.html');
driver.executeScript('alert ("hello");');
