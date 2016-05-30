// WHATWG ver. 22-06-2016
function currentNode(stackOpen) {
    return stackOpen[stackOpen.length - 1];
}
//***
function emit(token) {
    var emits;
    if (token.type == "End-of-file" || token.type == "ParseError") {
        emits = token.type;
        logall.push("STATE: " + state[state.length - 1] + " | CURRENT: " + stream[currentInput]);
    }
    else if (token.type == "StartTag" || token.type == "EndTag") {
        var emitAttr = {};
        for (var i in token.value.attribute) {
            if (emitAttr[token.value.attribute[i].name] != null)
                emit("ParseError");
            else
                emitAttr[token.value.attribute[i].name] = token.value.attribute[i].token.value;
        }
        var ns;
        if (token.value.name.indexOf(":") == -1)
            ns = nsEl["html"];
        else {
            var pos = token.value.name.lastIndexOf(":");
            ns = token.value.name.substring(0, pos)
            token.value.name = token.value.name.substring(pos + 1);
            var flag = false;
            for (var i in nsList)
                if (nsList[i].toLowerCase() == ns.toLowerCase()) {
                    flag = true;
                    ns = nsList[i];
                    break;
                }
            if (!flag) {
                if (nsEl[ns.toLowerCase()] != null)
                    ns = nsEl[ns.toLowerCase()];
                else
                    ns = nsEl["html"];
            }
        }
        emits = [token.type, token.value.name, emitAttr, token.value.flag ? true : null, ns];
        if (token.type == "EndTag" && (token.value.flag || Object.keys(emitAttr).length > 0))
            emit("ParseError");
    }
    else if (token.type == "DOCtoken.type")
        emits = [token.type, token.value.name, token.value.publicId, token.value.systemId, token.value.flag == "on"];
    else emits = [token.type, token.value];
    emitList.push(emits);
    logall.push("Emit: " + JSON.stringify(emits).replace(/\,/g, ", "));
    if (labelProcess > 0) {
        if (emits != "ParseError" && !ignoreTokenFlag && (!testTokenizer || testTokenizer == null))
            treeConstructionDispatcher(emits);
        else if (ignoreTokenFlag)
            ignoreTokenFlag = false;
    }
    else
        tokenList.push([currentInput, emits]);
}

module.exports = {
    currentNode: currentNode,
    emit: emit
};
