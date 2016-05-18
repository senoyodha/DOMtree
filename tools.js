module.exports = {
    tokenAdapter: function (token) {
        
    },
    treeAdapter: function (doc) {

    },
    treeViewer: function (doc) {
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
},
    tokenTest: function (path) {
        var parse = require('./parser');
        fs = require('fs');
        var pathTest = path;
        var pathLog = './Log/';
        var files = fs.readdirSync(pathTest);
        var arfile = [[], []];
        var nar = [0, 0];
        for (var i in files) {
            var test = JSON.parse(fs.readFileSync(pathTest + files[i], 'utf8'));
            var pos = arfile[0].length;
            var nars = [0, 0];
            arfile[0].push(files[i].toUpperCase());
            arfile[1].push("");
            for (var j in test.tests) {
                var res = parse.parser(test.tests[j].input);
                var output = tokenAdapter(res.token);
                var nr = (JSON.stringify(output) == JSON.stringify(test.tests[j].output) ? 0 : 1);
                arfile[nr].push(test.tests[j].input);
                nars[nr] += 1;
            }
            nar[0] += nars[0];
            nar[1] += nars[1];
            arfile[1][pos] = "(A: " + nars[0] + " | D: " + nars[1] + ")";
            for (var k = arfile[0].length; k < arfile[1].length; k++)
                arfile[0].push("n/a");
            for (var k = arfile[1].length; k < arfile[0].length; k++)
                arfile[1].push("n/a");
            arfile[0].push("");
            arfile[1].push("");
        }
        var arr = [];
        for (var i in arfile[0])
            arr.push(arfile[0][i] + "\t" + arfile[1][i]);
        arr.unshift("Path: " + pathTest + " (A: " + nar[0] + " | " + "D: " + nar[1] + ")\n");
        var dt = (new Date()).toISOString().substr(2,17).replace("T", " ").replace(/\-/g, "").replace(/\:/g, "");
        fs.writeFileSync(pathLog + dt + ".txt", arr.join("\n"));
        return (arr);
    }
}