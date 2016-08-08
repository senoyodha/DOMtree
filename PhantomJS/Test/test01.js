var phantomProxy = require('phantom-proxy').create({}, function (proxy) {
    var page = proxy.page,
        phantom = proxy.phantom;
    page.settings.userAgent = 'SpecialAgent';
    page.open('file:///C:/dell/00CODE/HTML5%20Parser/HTMLCompare/TestSuite/Both/0187.html', function (status) {

        var title = page.evaluate(function () {
            return document.lastChild.lastChild.lastChild.nodeValue.charCodeAt(3);
        }, function (res) {
            console.log(res);
        });

        phantom.exit();

    });
});