function tokenAdapter(token) {
    var resToken = [];
    var i = 0;
    while (true) {
        if (token[i] == "End-of-file" || i >= token.length)
            break;
        else if (token[i][0] == "DOCTYPE")
            token[i][4] = !token[i][4];
        else if (token[i][0].indexOf("Tag") != -1){
            token[i].pop();
            if(token[i][3] == null)
                token[i].pop();
            if(token[i][0] == "EndTag")
                token[i].splice(2, 1);
        }
        else if (token[i][0] == "Character") {
            while (token[i + 1][0] == "Character") {
                token[i][1] += token[i + 1][1];
                token.splice(i + 1, 1);
            }
        }
        resToken.push(token[i]);
        i++;
    }
    return resToken;
}

function tokenTest(path) {
    var parse = require('./parser');
    fs = require('fs');
    var pathTest = path;
    var pathLog = './Log/';
    var files = fs.readdirSync(pathTest);
    var arfile = [[], []];
    var nar = [0, 0];
    var arlast = [];
    console.log("!!TOKEN TEST!!")
    console.log("PATH: " + pathTest);
    for (var i in files) {
        var test = JSON.parse(fs.readFileSync(pathTest + files[i], 'utf8'));
        var pos = arfile[0].length;
        var nars = [0, 0];
        arfile[0].push(files[i].toUpperCase());
        arfile[1].push("\n");
        console.log("  " + files[i].toUpperCase() + "(" + test.tests.length + ")");
        for (var j in test.tests) {
            console.log("    " + test.tests[j].input);
            var res = parse.parser(test.tests[j].input, true);
            var output = tokenAdapter(res.token);
            var nr = (JSON.stringify(output) == JSON.stringify(test.tests[j].output) ? 0 : 1);
            arfile[nr].push(test.tests[j].input + (nr == 0 ? "" : ":\t" + JSON.stringify(test.tests[j].output) + " | " + JSON.stringify(output)));
            nars[nr] += 1;
        }
        nar[0] += nars[0];
        nar[1] += nars[1];
        arfile[1][pos] = "(T: " + (nars[0] + nars[1]) + " | A: " + nars[0] + " | D: " + nars[1] + ")\n----------------------------------------------";
        arlast.push(files[i] + "\t(Cases: " + (nars[0] + nars[1]) + ", Agree: " + nars[0] + ", Disagree: " + nars[1] + ")");
        for (var k = arfile[0].length; k < arfile[1].length; k++)
            arfile[0].push("n/a");
        for (var k = arfile[1].length; k < arfile[0].length; k++)
            arfile[1].push("");
        arfile[0].push("----------------------------------------------");
        arfile[1].push("");
        console.log("");
    }
    var arr = [];
    for (var i in arfile[0])
        arr.push(arfile[0][i] + "\t\t" + arfile[1][i]);
    arr.unshift("Path: " + pathTest + " (T: " + (nar[0] + nar[1]) + " | A: " + nar[0] + " (" + (nar[0]*100/(nar[0] + nar[1])).toFixed(1) + "%) | " + "D: " + nar[1] + " (" + (nar[1]*100/(nar[0] + nar[1])).toFixed(1) + "%))\n----------------------------------------------\n");
    arr[0] += arlast.join("\n") + "\n----------------------------------------------";
    var dt = (new Date()).toISOString().substr(2,17).replace("T", " ").replace(/\-/g, "").replace(/\:/g, "");
    fs.appendFileSync(pathLog + dt + ".txt", arr.join("\n"));
    console.log("Files: " + files.length + ", Cases: " + (nar[0] + nar[1]) + ", Agree: " + nar[0] + " (" + (nar[0]*100/(nar[0] + nar[1])).toFixed(1) + "%), Dis: " + nar[1] + " (" + (nar[1]*100/(nar[0] + nar[1])).toFixed(1) + "%)");
    for (var i in arlast)
    console.log(arlast[i]);
    return (arr);
}

function treeAdapter(doc) {

}

function treeViewer(doc) {
    var structure = "";
    var currentNode = doc.firstChild;
    var rpt = 1;
    structure += "#document: " + doc.type;
    var dd = 0
    out:
        while (currentNode.parent != null) {
            dd++;
            structure += "\n" + " ".repeat(rpt) + "-" + currentNode.type + ": " + JSON.stringify(currentNode.attr);
            if (currentNode.firstChild.type != null) {
                currentNode = currentNode.firstChild;
                rpt++;
            }
            else if (currentNode.next != null)
                currentNode = currentNode.next;
            else {
                while (currentNode.next == null) {
                    if (currentNode.parent == null)
                        break out;
                    currentNode = currentNode.parent;
                    rpt--;
                }
            }
        }
    return structure;
}

module.exports = {
    tokenAdapter: tokenAdapter,
    treeAdapter: treeAdapter,
    treeViewer: treeViewer,
    tokenTest: tokenTest
}