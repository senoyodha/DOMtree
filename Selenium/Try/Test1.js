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
                console.log(' '.repeat(lv) + tagName + " " + value);
            }
            return value;
        });
    });
}

var webdriver = require('selenium-webdriver');
var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
driver.get('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/h1.html');
// driver.get('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/h2.html');
var ary = [];
driver.findElement(webdriver.By.tagName('html')).then(function (element) {
    getAllTags(element, 0, ary, 0);
    // setTimeout(function () {
    //     console.log(ary);
    // }, 300);
});
// driver.findElement(webdriver.By.tagName('body')).then(function(element){
//     element.getTagName().then(function(textValue) {
//         console.log(textValue);
//         element.findElement(webdriver.By.xpath(".//*")).then(function(element2){
//             element2.getTagName().then(function(textValue2) {
//                 console.log(textValue2);
//             });
//         });
//     });
// });
// driver.get('file:///C:/dell/00CODE/HTML5%20Parser/Selenium/h2.html');
// driver.findElement(webdriver.By.tagName('html')).then(function(element){
//     element.getText().then(function(textValue) {
//         console.log(textValue);
//     });
// });

// driver.quit();


//     .then(function (element) {
//     driver.executeScript("document.getElementById('aaa').style.borderColor = 'Red'");
// });

