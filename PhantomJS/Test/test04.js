var page = require('webpage').create();
page.open('https://html5test.com/', function () {
    setTimeout(function () {
        page.evaluate(function () {
            document.querySelector('span.button.save').click();
        });
        setTimeout(function () {
            page.render('test1.jpg');
            phantom.exit();
        }, 3000);
    }, 3000);
});