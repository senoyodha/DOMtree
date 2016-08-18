var fs = require('fs'),
    util = require('util'),
    stream = require('stream'),
    es = require('event-stream');

var input = './test2.warc';
var pathOut = '../TestLib/CommonCrawl/';
var limit = 0;
var curline = 0;
var nr = 0;
var nrr = 0;
var flag = true;
var str = '';
var mode = {NS: {out: 'NoScript', arr: []}, S: {out: 'Scripted', arr: []}};
var type = 'S';

// var files = fs.readdirSync(pathOut);
// for (var i in files)
//     fs.unlinkSync(pathOut + files[i]);

var test = fs.createReadStream(input).pipe(es.split()).pipe(es.mapSync(function (line) {
        test.pause();
        curline += 1;
        if (['<htm', '<!do', '<!--'].indexOf(line.substr(0, 4).toLowerCase()) != -1 && flag)
            flag = false;
        else if (line.substr(0, 4) == 'WARC' && !flag) {
            flag = true;
            nr++;
            if (str.indexOf('<script') != -1 || str.indexOf('<noscript') != -1)
                type = 'S';
            else
                type = 'NS';
            var fileName = ('00000' + (mode[type].arr.length + 1)).slice(-5) + '.html';
            mode[type].arr.push(fileName + ': ' + nr);

            console.log('Writing ' + fileName + ' (' + type + ')');
            while (str.slice(-7) != '</html>')
                str = str.slice(0, -1);
            fs.writeFileSync(pathOut + mode[type].out + '/' + fileName, str.slice(1));
            str = '';
        }
        if (!flag)
            str += '\n' + line;
        if (line == 'WARC-Type: response')
            nrr++;
        if (limit > 0 && curline == limit) {
            console.log('\n' + nr + ' tests have been written to ' + pathOut + (nr == nrr ? '' : '\n(Supposed to be: ' + nrr + ' tests)') + '\n');
            for (var j in mode) {
                fs.writeFileSync(pathOut + j + '.txt', mode[j].arr.join('\n'));
                console.log(mode[j].out + ': ' + mode[j].arr.length + ' files');
            }
            return;
        }
        test.resume();
    })
        .on('error', function (err) {
            console.log('Error while reading file.\n' + err.stack);
        })
        .on('end', function () {
            console.log('\n' + nr + ' tests have been written to ' + pathOut + (nr == nrr ? '' : '\n(Supposed to be: ' + nrr + ' tests)') + '\n');
            for (var j in mode) {
                fs.writeFileSync(pathOut + j + '.txt', mode[j].arr.join('\n'));
                console.log(mode[j].out + ': ' + mode[j].arr.length + ' files');
            }
        })
);
