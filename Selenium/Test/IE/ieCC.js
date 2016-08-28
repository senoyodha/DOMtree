function abc(start, stop) {
    function write(err) {
        if (doms.length > 0) {
            if (err != null)
                log += tools.logDouble(err);
            // log += tools.logDouble('Wrapping DOM and write into file');
            // for (var i = start; i < start + doms.length; i++) {
            //     log += tools.logDouble('--Wrapping DOM into ' + files[i].replace('.html', '.txt'));
            //     fs.writeFileSync(set[mode].pathOut + files[i].replace('.html', '.txt'), tools.DOMWrapper(doms[i - start], files[i]));
            // }
            t = process.hrtime(t);
            var rt = 'Running time: ' + (t[0] + (t[1] / 1000000000)) + ' sec';
            console.log('\n' + rt);
            log = rt + '\n\n' + log + '\n\n' + rt;
            fs.writeFileSync(pathLog + 'IEVsCC_' + set[mode].mode + (mode[0] == 'B' ? mode.slice(1) : '') + '_' + (start + 1) + 'to' + (doms.length + start) + '_' + curdate + '.txt', log);
            console.log('\nEND: ' + files[(start + doms.length - 1)]);
        }
    }

    var t = process.hrtime();
    var set = {
        NS: {
            pathIn: '../../../HTMLCompare/TestSuite/CommonCrawl/NoScript/',
            pathOut: '../../../HTMLCompare/DOM/CommonCrawl/NoScript/IE/',
            mode: 'Out_NS',
            scriptOn: false
        },
        S: {
            pathIn: '../../../HTMLCompare/TestSuite/CommonCrawl/Scripted/',
            pathOut: '../../../HTMLCompare/DOM/CommonCrawl/Scripted/IE/',
            mode: 'Out_S',
            scriptOn: true
        }
    };
    var mode = 'S';

    if (!set[mode].scriptOn)
        console.log('Scripting cannot be turned off on IE. Program is terminated.');
    else {

        var curdate = (new Date()).toISOString().substr(2, 17).replace("T", " ").replace(/\-/g, "").replace(/\:/g, "");
        var pathLog = '../../../HTMLCompare/Log/';
        var fs = require('fs');
        var tools = require('./../tools');
        var comparator = require('../../../HTMLCompare/JS/comparator');
        var webdriver = require('selenium-webdriver'), By = webdriver.By, Key = webdriver.Key;
        var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.ie()).build();
        driver.manage().timeouts().pageLoadTimeout(120000);
        var script = fs.readFileSync('./domscript.js', 'utf8');
        var files = fs.readdirSync(set[mode].pathIn);
        var doms = [];
        var pathTest = tools.convertNameURL(set[mode].pathIn, __dirname);
        // var start = 0;
        // var stop = 452;
        var log = '';

// driver.manage().timeouts().pageLoadTimeout(66000);

        if (start > stop && stop != 0) {
            var temp = start;
            start = stop;
            stop = temp;
        }
        var limit = stop > 0 ? stop : files.length;
        driver.get(pathTest + files[0]);
        driver.switchTo().alert().then(function () {
            driver.switchTo().alert().accept();
        }, function (err) {
        });
        log += tools.logDouble('DOM extraction. Test file: ' + (limit - start) + '. Browser: IE. Test mode: ' + set[mode].mode);
        if (!set[mode].scriptOn)
            for (var i = 0; i < 10; i++) {
                driver.navigate().refresh();
                driver.switchTo().alert().then(function () {
                    driver.switchTo().alert().accept();
                }, function (err) {
                });
            }
        var cnt = start;
        var t2 = process.hrtime();
        for (var i = start; i < limit; i++) {
            driver.navigate().to(pathTest + files[i]).then(function () {
                driver.switchTo().alert().then(function () {
                    driver.switchTo().alert().getText().then(function (text) {
                        log += tools.logDouble('[01] Unexpected alert : ' + text);
                    });
                    driver.switchTo().alert().accept();
                }, function (err) {
                });
                driver.executeScript(script).then(function (dom) {
                    fs.writeFileSync(set[mode].pathOut + files[cnt].replace('.html', '.txt'), tools.DOMWrapper(dom, files[cnt]));
                    t2 = process.hrtime(t2);
                    log += tools.logDouble('--DOM extracted from ' + files[cnt++] + ' ' + (t2[0] + (t2[1] / 1000000000)) + ' sec');
                    t2 = process.hrtime();
                    arr.shift();
                }, function (err) {
                    driver.switchTo().alert().then(function () {
                        driver.switchTo().alert().getText().then(function (text) {
                            log += tools.logDouble('[02] Error : ' + err.message + '. Unexpected alert : ' + text);
                        });
                        driver.switchTo().alert().accept();
                        driver.executeScript(script).then(function (dom) {
                            fs.writeFileSync(set[mode].pathOut + files[cnt].replace('.html', '.txt'), tools.DOMWrapper(dom, files[cnt]));
                            log += tools.logDouble('--DOM extracted from ' + files[cnt++] + ' ' + (t2[0] + (t2[1] / 1000000000)) + ' sec');
                            t2 = process.hrtime();
                            console.log('1 ' + arr.length);
                            arr.shift();
                            console.log('1 ' + arr.length);
                        }, function (err2) {
                            // write('[03] + ' + err2.message);
                            // i--;
                            // driver.quit();
                            log += tools.logDouble('Skipped: ' + files[cnt++] + '. [03] Unexpected error : ' + err2.message);
                            t2 = process.hrtime();
                            arr.shift();
                        });
                    }, function (err2) {
                        log += tools.logDouble('[04] Unexpected error : ' + err2.message);
                        driver.executeScript(script).then(function (dom) {
                            fs.writeFileSync(set[mode].pathOut + files[cnt].replace('.html', '.txt'), tools.DOMWrapper(dom, files[cnt]));
                            log += tools.logDouble('--DOM extracted from ' + files[cnt++] + ' ' + (t2[0] + (t2[1] / 1000000000)) + ' sec');
                            t2 = process.hrtime();
                            arr.shift();
                        }, function (err3) {
                            // write('[03] + ' + err2.message);
                            // i--;
                            // driver.quit();
                            log += tools.logDouble('Skipped: ' + files[cnt++] + '. [05] Unexpected error : ' + err3.message);
                            t2 = process.hrtime();
                            arr.shift();
                        });
                    });
                });
            }, function (err) {
                driver.switchTo().alert().then(function () {
                    driver.switchTo().alert().accept();
                }, function (err) {
                });
                // write('[06] + ' + err.message);
                // i--;
                // driver.quit();
                log += tools.logDouble('Skipped: ' + files[cnt++] + '. [06] Unexpected error : ' + err.message);
                t2 = process.hrtime();
                arr.shift();
            });
        }
        driver.wait(function () {
            driver.switchTo().alert().then(function () {
                driver.switchTo().alert().accept();
            }, function (err) {
            });
            return cnt == limit;
        }, 50000000).then(function () {
            write();
            console.log(cnt + ' ' + limit + ' ' + arr[0] + ' ' + arr[arr.length - 1]);
            driver.quit();
            if (cnt < arr[arr.length - 1])
                abc(arr[0] - 1, arr[0]);
        }, function (err) {
            write('[07] + ' + err.message);
            console.log(cnt + ' ' + limit + ' ' + arr[0] + ' ' + arr[arr.length - 1]);
            driver.quit();
            if (cnt < arr[arr.length - 1])
                abc(arr[0] - 1, arr[0]);
        });
    }
}

var arr = [5, 37, 41, 73, 83, 135, 146, 193, 200, 273, 305, 329, 340, 350, 432, 494, 524, 526, 534, 547, 551, 553, 588, 592];
abc(arr[0] - 1, arr[0]);