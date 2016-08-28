function compare(path1, path2, mode, add, add2) {
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
    var listFile = fs.readFileSync(add + (add2 ? '' : '../') + '../HTMLCompare/TestSuite/list_' + mode + '.txt', 'utf8');
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
            st.push('Agree');
            agree[0].push(filetmp[c[0]][i]);
        }
        else {
            st.push('Disagree');
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

function compareMiss(path1, path2, override, log) {
    function doLog(txt) {
        if (log)
            console.log(txt);
        return txt;
    }

    var fs = require('fs');
    var path = [path1, path2];
    var st = [];
    var arr = [[], []];
    var miss = [[], []];
    var comp = {agr: [], dis: []};
    for (var i in path) {
        var dir = fs.readdirSync(path[i]);
        for (var j in dir) {
            arr[i][parseInt(dir[j].substr(0, 4))] = true;
        }
    }
    var max = (override ? override : Math.max(arr[0].length, arr[1].length) - 1);
    st.push(doLog('Comparing files between ' + path[0] + ' and ' + path[1] + '. Max: ' + max));
    console.log('Comparing files between ' + path[0] + ' and ' + path[1] + '. Max: ' + max);
    for (var i = 1; i <= max; i++) {
        var name = ('0000' + i).slice(-4) + '.txt';
        if (i % 200 == 0)
            console.log(i);
        var flag = true;
        var broM = [false, false];
        var broN = [path[0].split('/').slice(-2, -1), path[1].split('/').slice(-2, -1)];
        for (var j in arr)
            if (!arr[j][i]) {
                miss[j].push(name);
                broM[j] = true;
                flag = false;
            }
        if (!flag) {
            st.push(doLog('Processing ' + name + ': ' + (broM[0] ? broN[0] + ' miss.' : '') + (broM[1] ? broN[1] + ' miss' : '')));
        }
        else {
            if (fs.readFileSync(path[0] + name, 'utf8') == fs.readFileSync(path[1] + name, 'utf8')) {
                st.push(doLog('Processing ' + name + ': Agree'));
                comp.agr.push(name);
            }
            else {
                st.push(doLog('Processing ' + name + ': Disagree'));
                comp.dis.push(name);
            }
        }
    }
    st.push(doLog('TOTAL (out of ' + max + '): Agree: ' + comp.agr.length + '. Disagree: ' + comp.dis.length + '\n' + broN[0] + ': ' + miss[0].length + ' misses. ' + broN[1] + ': ' + miss[1].length + ' misses. '));
    console.log('TOTAL (out of ' + max + '): Agree: ' + comp.agr.length + '. Disagree: ' + comp.dis.length + '\n' + broN[0] + ': ' + miss[0].length + ' misses. ' + broN[1] + ': ' + miss[1].length + ' misses. ');
    console.log('-----------------------------');
    if (comp.dis.length > 0) {
        st.push(doLog('\nList of disagreements:'));
        for (var i in comp.dis) {
            st.push(doLog(comp.dis[i] + ' --> ' + comp.dis[i].substr(0, 4) + '.html'));
        }
        st.push(doLog('TOTAL (out of ' + max + '): Agree: ' + comp.agr.length + '. Disagree: ' + comp.dis.length + '\n' + broN[0] + ': ' + miss[0].length + ' misses. ' + broN[1] + ': ' + miss[1].length + ' misses. '));
    }
    return st;
}

module.exports = {
    compare: compare,
    compareMiss: compareMiss
};

// var a = [];
// a[1] = 1;
// a[4];
// console.log(a[3] == null);

// compare('../DOM/NoScript/Chrome/', '../DOM/NoScript/Original/');