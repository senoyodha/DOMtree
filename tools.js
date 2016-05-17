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
}
}