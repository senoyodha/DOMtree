module.exports = {
    logDouble: logDouble,
    convertNameFolder: convertNameFolder
};

function logDouble(str) {
    console.log(str);
    if (str == null)
        str = '';
    return str + '\n';
}

function convertNameFolder(pathIn, pathCur) {
    var pathArr = pathIn.split('../');
    if (pathCur.substr(-1) == '\\')
        pathCur = pathCur.substr(0, pathCur.length - 1);
    for (var i = 0; i < pathArr.length - 1; i++)
        pathCur = pathCur.substr(0, pathCur.lastIndexOf('\\'));
    pathCur = pathCur + '\\' + pathArr[pathArr.length - 1].replace(/\//g, '\\');
    return pathCur;
}

