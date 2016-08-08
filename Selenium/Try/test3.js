function getAllTags(element, lv, ary, el) {
    element.getTagName().then(function (tagName) {
        element.getText().then(function (value) {
            // console.log(' '.repeat(lv) + tagName + " " + value);
            ary.push({tagName: tagName, text: value, level: lv});
            ary[el].text = ary[el].text.replace(value, "");
            try {
                element.findElements(webdriver.By.xpath("*")).then(function (element2) {
                    lv++;
                    for (var i in element2) {
                        getAllTags(element2[i], lv, ary, ary.length - 1);
                    }
                });
            }
            catch (err) {

            }
            finally {
                // console.log(' '.repeat(lv) + tagName + " " + value);
            }
            return value;
        });
    });
}

var webdriver = require('selenium-webdriver');
var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
setTimeout(function () {
    driver.get('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/h1.html');
// driver.get('chrome://settings/');
    var ary = [];
    driver.findElement(webdriver.By.tagName('html')).then(function (element) {
        // getAllTags(element, 0, ary, 0);
        // driver.executeScript("alert('hello world');");
        // element.getAttribute('outerHTML').then(function (attr) {
        //    console.log(attr);
        // });
        driver.getPageSource().then(function (str) {
            console.log(str);
            setTimeout(function () {
                // console.log(ary);
                // driver.quit();
                driver.executeScript("return document.getElementById('aaa').outerHTML;").then(function (strr) {
                    console.log(strr);
                });
            }, 5000);
        });
    });
}, 10000);

// driver.quit();

