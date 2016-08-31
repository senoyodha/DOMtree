var fs = require('fs')
    , util = require('util')
    , stream = require('stream')
    , es = require('event-stream');

var lineNr = 0;
var nr = 0;
var nr1 = 0;
var flag = true;
var str = '';
var stra = [];

var s = fs.createReadStream('test2.warc')
    .pipe(es.split())
    .pipe(es.mapSync(function (line) {

            // pause the readstream
            s.pause();

            lineNr += 1;
            if (line[0] == '<' && flag) {
                nr++;
                // console.log(nr + ' ' + lineNr + ' ' + line);
                flag = false;
            }
            else if (line.substr(0, 4) == 'WARC' && !flag) {
                flag = true;
                stra.push(str.slice(1, -1));
                str = '';
            }
            if (!flag)
                str += '\n' + line;
            if (line == 'WARC-Type: response')
                nr1++;
            // process line here and call s.resume() when rdy
            // function below was for logging memory usage
            // console.log(lineNr + ' ' + line);
            // console.log(lineNr);


            if (lineNr >= 900)
                s.end();
            // resume the readstream, possibly from a callback
            s.resume();
        })
            .on('error', function () {
                console.log('Error while reading file.');
            })
            .on('end', function () {
                console.log('Read entire file.');
                console.log(nr + ' ' + nr1);
                console.log("aa" + stra[0] + "aa");
            })
    );
