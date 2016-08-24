function abc(start, stop) {
    function writeDOM(dom) {
        for (var k in dom) {
            var st = '';
            for (var l in dom[k].nodeValue)
                st += String.fromCodePoint(dom[k].nodeValue[l]);
            dom[k].nodeValue = st;
        }
        fs.writeFileSync(pathOut + bcnt + '/' + files[cnt].replace('.html', '.txt'), tools.DOMWrapper(dom, files[cnt], false));
    }

    function nextBrowser() {
        bcnt = bgen.next().value;
        if (bcnt == null) {
            bgen = gen();
            bcnt = bgen.next().value;
            cnt++;
            // console.log('Processing ' + files[cnt]);
        }
    }

    var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key, Capabilities = webdriver.Capabilities, Builder = webdriver.Builder;

// -------------------------------------- //
    var browser = {
        Chrome: {test: false},
        Safari: {test: false},
        Firefox: {test: false},
        Opera: {test: false},
        IE: {test: false},
        Edge: {test: true},
        PhantomJS: {test: false}
    };
// -------------------------------------- //

    function* gen() {
        var arr = [];
        for (var i in browser)
            arr.push(i);
        yield* arr;
    }

    var fs = require('fs');
    var tools = require('./../tools');
    var curdate = (new Date()).toISOString().substr(2, 17).replace("T", " ").replace(/\-/g, "").replace(/\:/g, "");
    var pathIn = '../../../HTMLCompare/TestSuite/CommonCrawl/Scripted/';
    var pathOut = '../../../HTMLCompare/DOM/CommonCrawl/Scripted/';
    var pathLog = '../../../HTMLCompare/Log/';
    var script = fs.readFileSync('./domscriptS.js', 'utf8');
    var files = fs.readdirSync(pathIn);
    var initial = '';
    var flaginit = false;

// -------------------------------------- //
//     var start = 236;
//     var stop = 593;
// -------------------------------------- //

    if (start > stop && stop != 0) {
        var temp = start;
        start = stop;
        stop = temp;
    }
    var limit = stop > 0 ? stop : files.length;
// var limitadd = 475;
    var cnt = start;
    var lstcnt = cnt;
    var bgen = gen();
    var bcnt = bgen.next().value;


    for (var i in browser) {
        if (browser[i].test) {
            if (!flaginit) {
                initial = i;
                flaginit = true;
            }
            // console.log('Initializing ' + bcnt + ' browser...');
            browser[i].driver = new Builder().withCapabilities(Capabilities[i.toLowerCase()]()).build();
            browser[i].driver.get('http://localhost/examples/');
            // browser[i].driver.manage().timeouts().pageLoadTimeout(120000);
            browser[i].pathTest = (i == 'Safari' ? tools.convertNameURL(pathIn, __dirname, 3, 'examples/') : tools.convertNameURL(pathIn, __dirname));
            var str = pathLog + i + 'VsCC_Out_S' + '_' + (start + 1) + 'to' + (limit) + '_' + curdate + '.txt';
            browser[i].logFile = str;
            try {
                fs.accessSync(str);
            } catch (e) {
                fs.writeFileSync(str, '');
            }
        }
    }
    setTimeout(function () {
        var t2 = process.hrtime();
// console.log('Processing ' + files[cnt]);
        console.log('Starts from: ' + files[cnt]);
        browser[initial].driver.wait(function () {
            if (browser[bcnt].test) {
                browser[bcnt].driver.navigate().to(browser[bcnt].pathTest + files[cnt]).then(function () {
                    // if (cnt == limitadd - 1)
                    //     browser[initial].driver.manage().timeouts().pageLoadTimeout(62000);
                    var bl = false;
                    browser[bcnt].driver.wait(function () {
                        browser[bcnt].driver.switchTo().alert().accept().then(function () {
                        }, function (err) {
                            bl = true;
                        });
                    }, 5000).then(function () {
                    }, function (err) {
                    });
                    browser[bcnt].driver.executeScript(script).then(function (dom) {
                        writeDOM(dom);
                        var dt = new Date();
                        t2 = process.hrtime(t2);
                        var str = files[cnt] + ': ' + bcnt + ': DOM extracted: ' + Math.round(t2[0] + (t2[1] / 1000000000)) + ' sec (' + dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds() + ')';
                        fs.appendFileSync(browser[bcnt].logFile, tools.logDouble(str));
                        t2 = process.hrtime();
                        nextBrowser();
                        lstcnt = cnt;
                        console.log(cnt + ' ' + limit + ' ' + (cnt >= limit));
                    }, function (err) {
                        var dt = new Date();
                        fs.appendFileSync(browser[bcnt].logFile, tools.logDouble(files[cnt] + ': ' + bcnt + ': Skipped. [01] Unable to execute script (' + dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds() + '): ' + err.message));
                        nextBrowser();
                    });
                }, function (err) {
                    // var bol = false;
                    // browser[bcnt].driver.wait(function () {
                    //     browser[bcnt].driver.switchTo().alert().accept().then(function () {
                    //     }, function (err2) {
                    //         bol = true;
                    //     });
                    //     return bol;
                    // }, 60000).then(function () {
                    //     if (bcnt == initial) {
                    //         fs.appendFileSync(browser[bcnt].logFile, tools.logDouble(files[cnt] + ': ' + bcnt + ': Skipped. [02] Alert opened more than 60s: ' + err.message));
                    //         cnt++;
                    //         t2 = process.hrtime();
                    //         // console.log('Processing ' + files[cnt]);
                    //     }
                    //     else {
                    //         fs.appendFileSync(browser[bcnt].logFile, tools.logDouble(files[cnt] + ': ' + bcnt + ': Skipped. [03] Unable to navigate: ' + err.message));
                    //         nextBrowser();
                    //         t2 = process.hrtime();
                    //     }
                    // }, function (err2) {
                    //     fs.appendFileSync(browser[bcnt].logFile, tools.logDouble(files[cnt] + ': ' + bcnt + ': Skipped. [04] Fatal error on page: ' + err.message));
                    //     cnt++;
                    //     t2 = process.hrtime();
                    //     // console.log('Processing ' + files[cnt]);
                    // });
                    var dt = new Date();
                    fs.appendFileSync(browser[bcnt].logFile, tools.logDouble(files[cnt] + ': ' + bcnt + ': Skipped. [00] Unable to navigate (' + dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds() + '): ' + err.message));
                    nextBrowser();
                    t2 = process.hrtime();
                    console.log(cnt + ' ' + limit + ' ' + (cnt >= limit));
                });
            }
            else
                nextBrowser();
            return cnt >= limit;
            // return false;
        }, 1000000000).then(function () {
            for (var i in browser) {
                if (browser[i].test)
                    browser[i].driver.quit().then(function () {
                    }, function () {
                    });
            }
            console.log('ALL FINISHED!');
            if (++lstcnt < limit)
                abc(lstcnt, limit);
        }, function (err) {
            for (var i in browser) {
                if (browser[i].test)
                    browser[i].driver.quit().then(function () {
                    }, function () {
                    });
            }
            var dt = new Date();
            console.log('[05] Fatal error. Execution discontinued (' + dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds() + '): ' + err.message);
            console.log(err.stack);
            if (++lstcnt < limit)
                abc(lstcnt, limit);
        });
    }, 10000);
}

var arr = [106, 124, 148, 154, 176, 182, 200, 206, 207, 226, 236, 263, 282, 302, 313, 337, 491, 511, 517, 521, 531, 532, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543, 592];
for (var i in arr)
    abc(arr[i] - 1, arr[i]);