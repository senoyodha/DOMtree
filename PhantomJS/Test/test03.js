var webPage = require('webpage');
var page = webPage.create();

page.settings.javascriptEnabled = false;
page.open('file:///C:/dell/00CODE/HTML5%20Parser/HTMLCompare/TestSuite/Both/0378.html', function (status) {

    var title = page.evaluate(function () {
        return document.lastChild.lastChild.lastChild.childNodes[0].nodeName;
    });

    console.log(title);
    var content = page.content;
    console.log(content);
    phantom.exit();

});