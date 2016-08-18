var fs = require('fs');
var parse = require('../Parser/parser');
var tools = require('./tools');

function extract(path, mode, html5lib) {
    var arr = ['Path\t: ' + path, 'Mode\t: ' + mode, 'Html5lib\t: ' + html5lib];
    var token = {
        Character: {tot: 0},
        Comment: {tot: 0},
        DOCTYPE: {tot: 0, name: {tot: 0}, publicId: {tot: 0}, systemId: {tot: 0}},
        EndTag: {tot: 0},
        StartTag: {tot: 0},
        EndOfFile: {tot: 0},
        ParseError: {tot: 0},
        TAG: {tot: 0}
    };
    var html = [];
    var addarr = [];

    var files = fs.readdirSync(path);
    if (html5lib)
        for (var i in files) {
            var test = JSON.parse(fs.readFileSync(path + files[i], 'utf8'));
            for (var j in test.tests) {
                var add = {};
                add['initialStates'] = (test.tests[j].initialStates != null ? test.tests[j].initialStates[test.tests[j].initialStates.length - 1] : null);
                add['lastStartTag'] = (test.tests[j].lastStartTag != null ? test.tests[j].lastStartTag : null);
                if (test.tests[j].doubleEscaped)
                    test.tests[j].input = tools.doubleEscapeAdapter(test.tests[j].input);
                html.push(test.tests[j].input);
                addarr.push(add);
            }
        }
    else
        for (var i in files)
            html.push(fs.readFileSync(path + files[i], 'utf8'));
    arr.push('Input test\t: ' + html.length, '----------');

    for (var i in html) {
        var res = parse.parsing(html[i], true, addarr[i]).state.emit;
        for (var j in res) {
            res[j].type = res[j].type.replace('End-of-file', 'EndOfFile');
            token[res[j].type].tot++;
            if (['StartTag', 'EndTag'].indexOf(res[j].type) != -1) {
                token.TAG.tot++;
                if (token[res[j].type][res[j].name] == null) {
                    token[res[j].type][res[j].name] = 1;
                    token['TAG'][res[j].name] = 1;
                }
                else {
                    token[res[j].type][res[j].name]++;
                    token['TAG'][res[j].name]++;
                }
            }
            else if (res[j].type == 'DOCTYPE') {
                if (res[j].name != null) {
                    token.DOCTYPE.name.tot++;
                    if (token.DOCTYPE.name[res[j].name] == null)
                        token.DOCTYPE.name[res[j].name] = 1;
                    else
                        token.DOCTYPE.name[res[j].name]++;
                }
                if (res[j].publicId != null) {
                    token.DOCTYPE.publicId.tot++;
                    if (token.DOCTYPE.publicId[res[j].publicId] == null)
                        token.DOCTYPE.publicId[res[j].publicId] = 1;
                    else
                        token.DOCTYPE.publicId[res[j].publicId]++;
                }
                if (res[j].systemId != null) {
                    token.DOCTYPE.systemId.tot++;
                    if (token.DOCTYPE.systemId[res[j].systemId] == null)
                        token.DOCTYPE.systemId[res[j].systemId] = 1;
                    else
                        token.DOCTYPE.systemId[res[j].systemId]++;
                }
            }
        }
    }

    for (var i in token)
        arr.push(i + '\t: ' + token[i].tot);
    arr.push('----------', 'STARTTAG:', '----------');
    var artemp = [];
    for (var i in token['StartTag'])
        artemp.push([i, token['StartTag'][i]]);
    artemp.sort(function (a, b) {
        return b[1] - a[1];
    });
    for (var i in artemp) {
        if (artemp[i][0] == 'tot')
            continue;
        arr.push(artemp[i][0] + '\t: ' + artemp[i][1]);
    }
    arr.push('----------', 'ENDTAG:', '----------');
    artemp = [];
    for (var i in token['EndTag'])
        artemp.push([i, token['EndTag'][i]]);
    artemp.sort(function (a, b) {
        return b[1] - a[1];
    });
    for (var i in artemp) {
        if (artemp[i][0] == 'tot')
            continue;
        arr.push(artemp[i][0] + '\t: ' + artemp[i][1]);
    }
    arr.push('----------', 'TAG:', '----------');
    artemp = [];
    for (var i in token['TAG'])
        artemp.push([i, token['TAG'][i]]);
    artemp.sort(function (a, b) {
        return b[1] - a[1];
    });
    for (var i in artemp) {
        if (artemp[i][0] == 'tot')
            continue;
        arr.push(artemp[i][0] + '\t: ' + artemp[i][1]);
    }
    arr.push('----------', 'DOCTYPE name:', '----------');
    artemp = [];
    for (var i in token['DOCTYPE']['name'])
        artemp.push([i, token['DOCTYPE']['name'][i]]);
    artemp.sort(function (a, b) {
        return b[1] - a[1];
    });
    for (var i in artemp) {
        if (artemp[i][0] == 'tot')
            continue;
        arr.push(artemp[i][0] + '\t: ' + artemp[i][1]);
    }
    arr.push('----------', 'DOCTYPE public id:', '----------');
    artemp = [];
    for (var i in token['DOCTYPE']['publicId'])
        artemp.push([i, token['DOCTYPE']['publicId'][i]]);
    artemp.sort(function (a, b) {
        return b[1] - a[1];
    });
    for (var i in artemp) {
        if (artemp[i][0] == 'tot')
            continue;
        arr.push(artemp[i][0] + '\t: ' + artemp[i][1]);
    }
    arr.push('----------', 'DOCTYPE system id:', '----------');
    artemp = [];
    for (var i in token['DOCTYPE']['systemId'])
        artemp.push([i, token['DOCTYPE']['systemId'][i]]);
    artemp.sort(function (a, b) {
        return b[1] - a[1];
    });
    for (var i in artemp) {
        if (artemp[i][0] == 'tot')
            continue;
        arr.push(artemp[i][0] + '\t: ' + artemp[i][1]);
    }
    return arr;
}

var path = '../../HTMLCompare/TestSuite/ALL/';
// var path = '../../TestLib/HTML5lib/Tokenizer/';
var mode = 'tree';
var html5lib = false;
var pathLog = '../Log/';
extract(path, mode, html5lib);
fs.appendFileSync(pathLog + 'extract-' + mode + '-' + tools.getDateString() + ".txt", extract(path, mode, html5lib).join("\n"));