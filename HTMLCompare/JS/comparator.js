function compare(path1, path2, mode, add) {
    var path = [path1, path2];
    var fs = require('fs');
    var tools = require('./tools');
    var filetmp = [fs.readdirSync(path[0]), fs.readdirSync(path[1])];
    var arfile = [{}, {}];
    var agree = [[], []];
    var log = '';
    if (add == null)
        add = '';

    var list = {};
    var listFile = fs.readFileSync(add + '../../HTMLCompare/TestSuite/list_' + mode + '.txt', 'utf8');
    listFile = listFile.split('\n');
    for (var i in listFile)
        list[listFile[i].split(': ')[0]] = listFile[i].split(': ')[1];

    for (var i in arfile)
        for (var j in filetmp[i])
            arfile[i][filetmp[i][j]] = fs.readFileSync(path[i] + filetmp[i][j], 'utf8');
    var c = [0, 1];
    if (filetmp[0].length > filetmp[1].length)
        c = [1, 0];
    log += tools.logDouble('Comparing DOM from files between:\n' + tools.convertNameFolder(path[0], __dirname) + ' (' + filetmp[0].length + ' files)\n' + tools.convertNameFolder(path[1], __dirname) + ' (' + filetmp[1].length + ' files)');
    for (var i in filetmp[c[0]]) {
        var st = '--Comparing ' + filetmp[c[0]][i] + ': ';
        if (arfile[c[0]][filetmp[c[0]][i]] == arfile[c[1]][filetmp[c[0]][i]]) {
            st += 'Agree';
            agree[0].push(filetmp[c[0]][i]);
        }
        else {
            st += 'Disagree';
            agree[1].push(filetmp[c[0]][i]);
        }
        log += tools.logDouble(st);
    }
    log += tools.logDouble('TOTAL: Agree: ' + agree[0].length + ' (' + (agree[0].length / filetmp[c[0]].length * 100).toFixed(2) +
        '%), Disagree: ' + agree[1].length + ' (' + (agree[1].length / filetmp[c[0]].length * 100).toFixed(2) + '%)');
    if (agree[1].length > 0) {
        log += tools.logDouble('\nList of disagreement:');
        for (var i in agree[1])
            log += tools.logDouble('--' + agree[1][i] + ' --> ' + agree[1][i].replace('.txt', '.html') + ' --> ' + list[agree[1][i].slice(0, -4)]);
        log += tools.logDouble('TOTAL: Agree: ' + agree[0].length + ' (' + (agree[0].length / filetmp[c[0]].length * 100).toFixed(2) +
            '%), Disagree: ' + agree[1].length + ' (' + (agree[1].length / filetmp[c[0]].length * 100).toFixed(2) + '%)');
    }
    return log;
}

module.exports = {
    compare: compare
};

// compare('../DOM/NoScript/Chrome/', '../DOM/NoScript/Original/');