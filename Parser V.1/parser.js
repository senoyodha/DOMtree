// Version 11 Apr 2016
module.exports = {
    parser: function (stream, testTokenizer) {
        try {
            var stream = stream;

            function documents(type) {
                this.type = type;
                this.firstChild = {parent: this};
                this.lastChild = {parent: this};
                this.document = this;
                this.prev = null;
                this.next = null;
                this.readiness = "loading";
                this.DOMContentLoaded = function () {
                    //**/
                };
                this.window = {
                    content: "", load: function (override) {
                        //**/
                    }
                };
            }

            var document = new documents("root");

            function nodes(type, doc, namespace) {
                this.type = type;
                this.parent = null;
                this.namespace = namespace == null ? "http://www.w3.org/1999/xhtml" : namespace;
                this.firstChild = {parent: this};
                this.lastChild = {parent: this};
                this.prev = null;
                this.next = null;
                this.attr = {};
                this.document = doc == null ? document : doc;
            }

            var logall = [];
            var emitList = [];
            var tokenList = [];
            var labelProcess = 0;
            var scriptFlag = false;
            var fragmentParse = false;
            var context = new nodes();
            var insertionPoint = null;

//12.2.2.5 Preprocessing the input stream
            var preprocessing = function (stream) {
                var nextInput = null;
                var currentInput = null;
                var next = null;
                var flag = false;
                var streamTemp = "";
                var charEq = ["\u{1FFFE}", "\u{1FFFF}", "\u{2FFFE}", "\u{2FFFF}", "\u{3FFFE}", "\u{3FFFF}", "\u{4FFFE}", "\u{4FFFF}", "\u{5FFFE}", "\u{5FFFF}", "\u{6FFFE}", "\u{6FFFF}", "\u{7FFFE}", "\u{7FFFF}", "\u{8FFFE}", "\u{8FFFF}", "\u{9FFFE}", "\u{9FFFF}", "\u{AFFFE}", "\u{AFFFF}", "\u{BFFFE}", "\u{BFFFF}", "\u{CFFFE}", "\u{CFFFF}", "\u{DFFFE}", "\u{DFFFF}", "\u{EFFFE}", "\u{EFFFF}", "\u{FFFFE}", "\u{FFFFF}", "\u{10FFFE}", "\u{10FFFF}"];
                logall.push("\nCall function Preprocessing (12.2.2.5)");
                for (var i = 0; i < stream.length; i++) {
                    if (flag == true) {
                        flag = false;
                        continue;
                    }
                    nextInput = stream[i];
                    currentInput = stream[i - 1];
                    next = stream[i + 1];
                    if (charEq.indexOf(nextInput + next) != -1) {
                        logall.push("> Preprocess " + nextInput + next + " (U+" + (nextInput + next).codePointAt(0).toString(16).toUpperCase() + ")");
                        logall.push(">> Parse error|Preprocess: Control character (astral)|Ignored");
                        flag = true;
                        continue;
                    }
                    var utfCode = nextInput.codePointAt(0).toString(16).toUpperCase();
                    utfCode = utfCode.length > 4 ? utfCode : ("0000" + utfCode).slice(-4);
                    logall.push("> Preprocess " + nextInput + " (U+" + utfCode + ")");
                    if (/[\u0001-\u0008\u000E-\u001F\u007F-\u009F\uFDD0-\uFDEF]|\u000B|\uFFFE|\uFFFF/.test(nextInput)) {
                        logall.push(">> Parse error|Preprocess: Control character|Ignored");
                    }
                    else if (nextInput == "\u000A" && stream[currentInput] == "\u000D") {
                        logall.push(">> Ignored|Preprocess: LF follows CR|Ignored");
                    }
                    else if (nextInput == "\u000D") {
                        streamTemp += "\u000A";
                        logall.push(">> Consumed|Preprocess: CR character|Converted to LF");
                    }
                    else {
                        streamTemp += nextInput;
                        logall.push(">> Consumed|Preprocess: Normal character|Consumed");
                    }
                }
                logall.push("End function Preprocessing\n");
                return streamTemp;
            };

//Parsing: Tokenization and Tree Construction
            var parsing = function (stream) {
                var framesetFlag = "ok"; //35
                var listFormat = []; //35
                var nextInput = 0; //458
                var currentInput = -1; //378
                var state = ["Data state"]; //3478
                var mode = ["Initial"]; //35
                var stackOpen = []; //356
                var currentNode = function () {
                    return stackOpen[stackOpen.length - 1];
                }; //356
                var stackTemplate = []; //5
                var pendingCharTable = []; //5
                var currentTemplate = function () {
                    return stackTemplate[stackTemplate.length - 1];
                }; //3
                var adjustedNode = null; //68
                var headPointer = null; //35
                var formPointer = null; //35
                var returnMode = null; //35
                var foster = false; //35
                var reProcess = true; //356
                var callBack = ""; //35
                var ignoreTokenFlag = false; //57
                var specialTag = ["address", "applet", "area", "article", "aside", "base", "basefont", "bgsound", "blockquote", "body",
                    "br", "button", "caption", "center", "col", "colgroup", "dd", "details", "dir", "div", "dl", "dt", "embed", "fieldset",
                    "figcaption", "figure", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header",
                    "hgroup", "hr", "html", "iframe", "img", "input", "isindex", "li", "link", "listing", "main", "marquee", "menu",
                    "menuitem", "meta", "nav", "noembed", "noframes", "noscript", "object", "ol", "p", "param", "plaintext", "pre", "script",
                    "section", "select", "source", "style", "summary", "table", "tbody", "td", "template", "textarea", "tfoot", "th",
                    "thead", "title", "tr", "track", "ul", "wbr", "and xmp; mi", "mo", "mn", "ms", "mtext", "annotation-xml", "foreignObject",
                    "desc", "title"]; //35
                var scopeEl = ["applet", "caption", "html", "table", "td", "th", "marquee", "object", "template", "mi", "mo", "mn", "ms",
                    "mtext", "annotation-xml", "foreignObject", "desc", "title"]; //3
                var nsEl = {
                    html: "http://www.w3.org/1999/xhtml",
                    mathml: "http://www.w3.org/1998/Math/MathML",
                    svg: "http://www.w3.org/2000/svg",
                    xlink: "http://www.w3.org/1999/xlink",
                    xml: "http://www.w3.org/XML/1998/namespace",
                    xmlns: "http://www.w3.org/2000/xmlns/"
                }; //3578
                var nsList = ["http://www.w3.org/1999/xhtml", "http://www.w3.org/1998/Math/MathML", "http://www.w3.org/2000/svg",
                    "http://www.w3.org/1999/xlink", "http://www.w3.org/XML/1998/namespace", "http://www.w3.org/2000/xmlns/"]; //7
                logall.push("Call function Parsing");

                // Tree algorithm
                function switchMode(target, reprocess, returnFlag, callback) {
                    reProcess = reprocess ? reprocess : false;
                    returnMode = returnFlag ? mode[mode.length - 1] : null;
                    callBack = callback != null ? callback : "";
                    mode.push(target);
                }

                function resetModeProperly(reprocess) {
                    var last = false;
                    var node = currentNode();
                    loop:
                        while (true) {
                            if (node == stackOpen[0]) {
                                last = true;
                                if (fragmentParse)
                                    node = context;
                            }
                            if (node.type == "select") {
                                if (!last) {
                                    var ancestor = node;
                                    while (true) {
                                        if (ancestor == stackOpen[0])
                                            break;
                                        else {
                                            ancestor = stackOpen[stackOpen.indexOf(ancestor) - 1];
                                            if (ancestor.type == "template")
                                                break;
                                            else if (ancestor.type == "table") {
                                                switchMode("In select in table", reprocess);
                                                break loop;
                                            }
                                        }
                                    }
                                }
                                switchMode("In select", reprocess);
                                break;
                            }
                            if (["td", "th"].indexOf(node.type) != -1 && !last) {
                                switchMode("In cell", reprocess);
                                break;
                            }
                            if (node.type == "tr") {
                                switchMode("In row", reprocess);
                                break;
                            }
                            if (["tbody", "thead", "tfoot"].indexOf(node.type) != -1 && !last) {
                                switchMode("In table body", reprocess);
                                break;
                            }
                            if (node.type == "caption") {
                                switchMode("In caption", reprocess);
                                break;
                            }
                            if (node.type == "colgroup") {
                                switchMode("In column group", reprocess);
                                break;
                            }
                            if (node.type == "table") {
                                switchMode("In table", reprocess);
                                break;
                            }
                            if (node.type == "template") {
                                switchMode(currentTemplate(), reprocess);
                                break;
                            }
                            if (node.type == "head" && !last) {
                                switchMode("In head", reprocess);
                                break;
                            }
                            if (node.type == "body") {
                                switchMode("In body", reprocess);
                                break;
                            }
                            if (node.type == "frameset") {
                                switchMode("In frameset", reprocess);
                                break;
                            }
                            if (node.type == "html") {
                                if (headPointer == null)
                                    switchMode("Before head", reprocess);
                                else
                                    switchMode("After head", reprocess);
                                break;
                            }
                            if (last) {
                                switchMode("In body", reprocess);
                                break;
                            }
                            node = stackOpen[stackOpen.indexOf(node) - 1];
                        }
                }

                function isHTMLNamespace(node) {
                    if (node.namespace == nsEl["html"])
                        return true;
                    return false;
                }

                function isMathMLIntegration(node) {
                    var list = ["mi", "mo", "mn", "ms", "mtext"];
                    if (list.indexOf(node.type) != -1)
                        return true;
                    return false;
                }

                function isMathMLAnnotation(node) {
                    if (node.type == "annotation-xml")
                        return true;
                    return false;
                }

                function isHTMLIntegration(node, token) {
                    if ((isMathMLAnnotation(node) && token[0] == "StartTag" && (token[2].encoding.toLowerCase() == "text/html" || token[2].encoding.toLowerCase() == "application/xhtml+xml")) || node.type == "foreignObject" || node.type == "desc" || node.type == "title")
                        return true;
                    return false;
                }

                function createElement(type, parent, namespace, token) {
                    function reset(node) {
                        //**/
                    }

                    function noTemplate() {
                        for (var i in stackOpen)
                            if (stackOpen[i].type == "template")
                                return false;
                        return true;
                    }

                    function isSameHomeTree(node1, node2) {
                        var comp = [node1, node2];
                        while (true) {
                            if (comp[0].parent != null)
                                comp[0] = comp[0].parent;
                            if (comp[1].parent != null)
                                comp[1] = comp[1].parent;
                            if (comp[0].parent == null && comp[1].parent == null)
                                break;
                        }
                        return (comp[0] == comp[1]);
                    }

                    var newNode = new nodes(type, parent.document, namespace);
                    newNode.attr = token[2];
                    if ((token[2]["xmlns"] != null && token[2].xmlns != "xmlns") || (token[2]["xmlns:xlink"] != null && token[2]["xmlns:xlink"] != "xlink"))
                        emit("ParseError");
                    if (["input", "keygen", "output", "select", "textarea"].indexOf(newNode.type) != -1)
                        reset(newNode);
                    if (["button", "fieldset", "input", "keygen", "label", "object", "output", "select", "textarea", "img"].indexOf(newNode.type) &&
                        formPointer != null && noTemplate() && (!["button", "fieldset", "input", "keygen", "label", "object", "output",
                            "select", "textarea"].indexOf(newNode) || token[2]["form"] == null) && isSameHomeTree(parent, formPointer))
                        newNode.formOwner = formPointer;
                    return newNode;
                }

                function parsingForeignContent(token) {
                    //**/
                    var flag = false;
                    switch (token[0]) {
                        case "Character":
                            if (token[1] == "\u0000") {
                                emit("ParseError");
                                insertCharacter("\uFFFD");
                            }
                            else if (["\u0009", "\u000A", "\u000C", "\u000D", "\u0020"].indexOf(token[1]) != -1)
                                insertCharacter(token[1]);
                            else {
                                insertCharacter(token[1]);
                                framesetFlag = "not ok";
                            }
                            break;
                        case "Comment":
                            insertComment();
                            break;
                        case "DOCTYPE":
                            emit("ParseError");
                            break;
                        case "StartTag":
                            if (["b", "big", "blockquote", "body", "br", "center", "code", "dd", "div", "dl", "dt", "em", "embed", "h1",
                                    "h2", "h3", "h4", "h5", "h6", "head", "hr", "i", "img", "li", "listing", "menu", "meta", "nobr",
                                    "ol", "p", "pre", "ruby", "s", "small", "span", "strong", "strike", "sub", "sup", "table", "tt",
                                    "u", "ul", "var"].indexOf(token[1]) != -1 || (token[1] == "font" && (token[2]["color"] != null || token[2]["face"] != null || token[2]["size"] != null))) {
                                emit("ParseError");
                                if (fragmentParse)
                                    flag = true;
                                else {
                                    stackOpen.pop();
                                    while (!isMathMLIntegration(currentNode()) && !isHTMLIntegration(currentNode()) && !isHTMLNamespace(currentNode()))
                                        stackOpen.pop();
                                    return {reprocess: true};
                                }
                            }
                            else {

                            }
                            break;
                        case "EndTag":
                            break;
                        case "End-of-file":
                            break;
                        default:
                            break;
                    }
                    if (flag) {

                    }
                }

                function insertHTMLElement(token) {
                    return insertForeignElement(token, token[4]);
                }

                function insertNode(target, newNode, mode) {
                    if (mode == "first" || mode == "last") {
                        newNode.parent = target;
                        if (target.lastChild.type == null) {
                            target.firstChild = newNode;
                            target.lastChild = newNode;
                        }
                        else if (mode == "first") {
                            target.firstChild.prev = newNode;
                            newNode.next = target.firstChild;
                            target.firstChild = newNode;
                        }
                        else {
                            target.lastChild.next = newNode;
                            newNode.prev = target.lastChild;
                            target.lastChild = newNode;
                        }
                    }
                    else if (mode == "before") {
                        newNode.parent = target.parent;
                        if (target.prev == null) {
                            newNode.next = target;
                            target.prev = newNode;
                            target.parent.firstChild = newNode;
                        }
                        else {
                            newNode.prev = target.prev;
                            newNode.next = target;
                            target.prev.next = newNode;
                            target.prev = newNode;
                        }
                    }
                    else if (mode == "after") {
                        newNode.parent = target.parent;
                        if (target.next == null) {
                            newNode.prev = target;
                            target.next = newNode;
                            target.parent.lastChild = newNode;
                        }
                        else {
                            newNode.next = target.next;
                            newNode.prev = target;
                            target.next.prev = newNode;
                            target.next = newNode;
                        }
                    }
                }

                function removeNode(node) {
                    if (node.parent.firstChild == node) {
                        if (node.next == null) {
                            node.parent.firstChild = {parent: node.parent};
                            node.parent.lastChild = {parent: node.parent};
                        }
                        else {
                            node.parent.firstChild = node.next;
                            node.next.prev = null;
                            node.next = null;
                        }
                    }
                    else if (node.parent.firstChild == node) {
                        node.parent.lastChild = node.prev;
                        node.prev.next = null;
                        node.prev = null;
                    }
                    else {
                        node.prev.next = node.next;
                        node.next.prev = node.prev;
                        node.prev = null;
                        node.next = null;
                    }
                    node.parent = null;
                }

                function appropriateInsert(override) {
                    var target = override != null ? override : currentNode();
                    var adjusted = (function () {
                        var targetType = ["table", "tbody", "tfoot", "thead", "tr"];
                        if (foster && targetType.indexOf(target.type) != -1) {
                            var lastTemplate = null;
                            var lastTable = null;
                            for (var i in stackOpen) {
                                if (stackOpen[i].type == "template")
                                    lastTemplate = i;
                                if (stackOpen[i].type == "table")
                                    lastTable = i;
                            }
                            if (lastTemplate != null && (lastTable == null || (lastTable != null && lastTemplate > lastTable)))
                                return {target: stackOpen[lastTemplate].contents, mode: "last"};
                            if (lastTable == null)
                                return {target: stackOpen[0], mode: "last"};
                            if (stackOpen[lastTable].parent != null)
                                return {target: stackOpen[lastTable], mode: "before"};
                            var prevElement = stackOpen[lastTable - 1];
                            return {target: prevElement, mode: "last"};
                        }
                        else
                            return {target: target, mode: "last"};
                    })();
                    if (adjusted.target.type == "template")
                        adjusted.target = adjusted.target.contents;
                    return adjusted;
                }

                function reconstructActiveFormat() {
                    var lastEntry = function () {
                        return listFormat[listFormat.length - 1];
                    }
                    if (listFormat.length = 0)
                        return;
                    var flag = function () {
                        for (var i in stackOpen)
                            if (lastEntry() == stackOpen[i])
                                return true;
                        return false;
                    };
                    if (lastEntry().type == "marker" || flag())
                        return;
                    var entry = lastEntry();
                    var flagCreate = false;
                    while (true) {
                        if (entry == listFormat[0]) {
                            flagCreate = true;
                            break;
                        }
                        entry = listFormat[listFormat.indexOf(entry) - 1];
                        if (lastEntry().type == "marker" || flag())
                            break;
                    }
                    while (true) {
                        if (!flagCreate)
                            entry = listFormat[listFormat.indexOf(entry) + 1];
                        flagCreate = false;
                        var newElement = insertHTMLElement(["StartTag", entry.type, entry.attr]);
                        listFormat.splice(listFormat.indexOf(entry), 1, newElement);
                        if (newElement == lastEntry())
                            break;
                    }

                }

                function hasScope(tag, list, except) {
                    var node = currentNode();
                    while (true) {
                        if (node.type == tag)
                            return true;
                        else if ((list.indexOf(node.type) != -1 && except != true) || (list.indexOf(node.type) == -1 && except))
                            return false;
                        else
                            node = stackOpen[stackOpen.indexOf(node) - 1];
                    }
                }

                function hasTableScope(tag) {
                    return hasScope(tag, ["html", "table", "template"]);
                }

                function hasSelectScope(tag) {
                    return hasScope(tag, ["optgroup", "option"], true);
                }

                function hasButtonScope(tag) {
                    return hasScope(tag, scopeEl.concat("button"));
                }

                function hasListScope(tag) {
                    return hasScope(tag, scopeEl.concat("ol", "ul"));
                }

                function hasElementScope(tag) {
                    return hasScope(tag, scopeEl);
                }

                function generateImpliedEndTags(exceptTag) {
                    var list = ["dd", "dt", "li", "optgroup", "option", "p", "rb", "rp", "rt", "rtc"];
                    if (exceptTag != null)
                        list.splice(list.indexOf(exceptTag), 1);
                    while (true) {
                        if (list.indexOf(currentNode().type) != -1)
                            stackOpen.pop();
                        else
                            break;
                    }
                }

                function generateAllImpliedEndTags() {
                    var list = ["caption", "colgroup", "dd", "dt", "li", "optgroup", "option", "p", "rb", "rp", "rt", "rtc", "tbody",
                        "td", "tfoot", "th", "thead", "tr"];
                    while (true) {
                        if (list.indexOf(currentNode().type) != -1)
                            stackOpen.pop();
                        else
                            break;
                    }
                }

                function clearActiveFormat() {
                    while (true) {
                        var entry = listFormat[listFormat.length - 1];
                        listFormat.pop();
                        if (entry.type == "marker")
                            break;
                    }
                }

                function stopParsing() {
                    logall.push("\nCall function Stop Parsing (12.2.6)");
                    var taskQueue = [];
                    document.readiness = "interactive";
                    insertionPoint = null;
                    stackOpen.splice(0, stackOpen.length);
                    //**/
                    taskQueue.push(function () {
                        document.DOMContentLoaded();
                    });
                    //**/
                    taskQueue.push(function () {
                        document.readiness = "complete";
                    });
                    taskQueue.push(function () {
                        //**/ Browsing context
                        document.window.load(document);
                    });
                    //**/ Browsing context
                    if (!document.pageShowing) {
                        document.pageShowing = true;
                        //**/ Pageshow
                    }
                    //**/ Pending application cache & print when loaded
                    document.readyForPostLoadTasks = true;
                    taskQueue.push(function () {
                        document.completelyLoaded = true;
                    })
                    logall.push("End function Tree Construction\n");
                }

                function pushListFormat(node) {
                    var lastMarker = 0;
                    for (var i in listFormat)
                        if (listFormat[listFormat.length - i - 1].type == "marker") {
                            lastMarker = listFormat.length - i;
                            break;
                        }
                    var cnt = [0, []];
                    for (var i = lastMarker; i < listFormat.length; i++) {
                        if (listFormat[i].type == node.type && listFormat[i].namespace == node.namespace && Object.keys(listFormat[i].attr).length == Object.keys(node.attr).length) {
                            var flag = true;
                            for (var j in node.attr)
                                if (listFormat[i].attr[j] != node.attr[j])
                                    flag = false;
                            if (flag) {
                                cnt[0]++;
                                cnt[1].push(i);
                            }
                        }
                    }
                    if (cnt[0] == 3)
                        listFormat.splice(cnt[1][0], 1);
                    listFormat.push(node);
                }

                function adoptionAgency(subject, namespace, token) {
                    if (currentNode().type == subject && listFormat.indexOf(currentNode()) == -1) {
                        stackOpen.pop();
                        return;
                    }
                    var outerLoopN = 0;
                    while (true) {
                        if (outerLoopN >= 8)
                            return;
                        outerLoopN++;
                        var formatEl = (function () {
                            var elem = 0;
                            var marker = 0;
                            for (var i in listFormat)
                                if (listFormat[listFormat.length - i - 1].type == "marker") {
                                    marker = listFormat.length - i - 1;
                                }
                            for (var i = marker + 1; i < listFormat.length - 1; i++)
                                if (listFormat[i].type == subject)
                                    elem = i;
                            if (elem > 0)
                                return listFormat[elem];
                            return;
                        })();
                        if (formatEl == null)
                            return -1;
                        if (stackOpen.indexOf(formatEl) == -1) {
                            emit("ParseError");
                            listFormat.splice(listFormat.indexOf(formatEl), 1);
                            return;
                        }
                        if (stackOpen.indexOf(formatEl) != -1 && !hasElementScope(formatEl.type)) {
                            emit("ParseError");
                            return;
                        }
                        if (formatEl != currentNode())
                            emit("ParseError");
                        var furthestBlock = (function () {
                            for (var i = stackOpen.indexOf(formatEl) + 1; i < stackOpen.length; i++)
                                if (specialTag.indexOf(stackOpen[i].type) != -1)
                                    return stackOpen[i];
                            return;
                        })();
                        if (furthestBlock == null) {
                            while (true) {
                                var popEl = stackOpen.pop();
                                if (popEl == formatEl)
                                    break;
                            }
                            listFormat.splice(listFormat.indexOf(formatEl), 1);
                            return;
                        }
                        var commonAncestor = stackOpen[stackOpen.indexOf(formatEl) - 1];
                        var bookmark = listFormat.indexOf(formatEl);
                        var node = furthestBlock;
                        var lastNode = furthestBlock;
                        var innerLoopN = 0;
                        var removeNode = [];
                        while (true) {
                            innerLoopN++;
                            var posTemp = stackOpen.indexOf(node);
                            if (posTemp != -1)
                                node = stackOpen[posTemp - 1];
                            else
                                node = stackOpen[removeNode[0] - 1];
                            if (node == formatEl)
                                break;
                            if (innerLoopN > 3 && listFormat.indexOf(node) != -1)
                                listFormat.splice(listFormat.indexOf(node), 1);
                            if (listFormat.indexOf(node) == -1) {
                                removeNode = [stackOpen.indexOf(node), node];
                                stackOpen.splice(stackOpen.indexOf(node), 1);
                                continue;
                            }
                            var newNode = createElement(node.type, commonAncestor, namespace, token);
                            removeNode = [stackOpen.indexOf(node), node];
                            listFormat.splice(listFormat.indexOf(node), 1, newNode);
                            stackOpen.splice(stackOpen.indexOf(node), 1, newNode);
                            node = newNode;
                            if (lastNode == furthestBlock)
                                bookmark = listFormat.indexOf(node) + 1;
                            if (lastNode == lastNode.parent.lastChild)
                                lastNode.parent.lastChild = lastNode.prev;
                            if (lastNode == lastNode.parent.firstChild)
                                lastNode.parent.firstChild = lastNode.next;
                            if (lastNode.prev != null) {
                                lastNode.prev.next = null;
                                lastNode.prev = null;
                            }
                            if (lastNode.next != null) {
                                lastNode.next.prev = null;
                                lastNode.next = null;
                            }
                            insertNode(node, lastNode, "last");
                            lastNode = node;
                        }
                        var insertTemp = appropriateInsert(commonAncestor);
                        insertNode(insertTemp.target, lastNode, insertTemp.mode);
                        var newEl = createElement(formatEl.type, furthestBlock, namespace, token);
                        while (furthestBlock.firstChild != null) {
                            insertNode(newEl, furthestBlock.firstChild, "last");
                            furthestBlock.firstChild = furthestBlock.firstChild.next;
                            newEl.lastChild.next = null;
                        }
                        furthestBlock.lastChild = null;
                        insertNode(furthestBlock, newEl, "last");
                        listFormat.splice(listFormat.indexOf(formatEl), 1);
                        listFormat.splice(bookmark, 0, newEl);
                        stackOpen.splice(stackOpen.indexOf(formatEl), 1);
                        stackOpen.splice(stackOpen.indexOf(furthestBlock) + 1, 0, newEl);
                    }
                }

                function getNextToken() {
                    for (var i in tokenList)
                        if (tokenList[i][0] == currentInput)
                            return tokenList[parseInt(i) + 1][1];
                }

                function genericRawTextParsing() {
                    insertHTMLElement(token);
                    state.push("RAWTEXT state");
                    switchMode("Text", null, true);
                }

                function genericRCDATAParsing(token) {
                    insertHTMLElement(token);
                    state.push("RCDATA state");
                    switchMode("Text", null, true);
                }

                function adjustMathMLAttr(token) {
                    for (var key in token[2])
                        if (key.toLowerCase() == "definitionurl") {
                            token[2]["definitionURL"] = token[2][key];
                            delete token[2][key];
                            break;
                        }
                }

                function adjustSVGAttr(token) {
                    var list = ["attributeName", "attributeType", "baseFrequency", "baseProfile", "calcMode", "clipPathUnits", "diffuseConstant",
                        "edgeMode", "filterUnits", "glyphRef", "gradientTransform", "gradientUnits", "kernelMatrix", "kernelUnitLength",
                        "keyPoints", "keySplines", "keyTimes", "lengthAdjust", "limitingConeAngle", "markerHeight", "markerUnits", "markerWidth",
                        "maskContentUnits", "maskUnits", "numOctaves", "pathLength", "patternContentUnits", "patternTransform", "patternUnits",
                        "pointsAtX", "pointsAtY", "pointsAtZ", "preserveAlpha", "preserveAspectRatio", "primitiveUnits", "refX", "refY",
                        "repeatCount", "repeatDur", "requiredExtensions", "requiredFeatures", "specularConstant", "specularExponent",
                        "spreadMethod", "startOffset", "stdDeviation", "stitchTiles", "surfaceScale", "systemLanguage", "tableValues",
                        "targetX", "targetY", "textLength", "viewBox", "viewTarget", "xChannelSelector", "yChannelSelector", "zoomAndPan"];
                    var listLow = ["attributename", "attributetype", "basefrequency", "baseprofile", "calcmode", "clippathunits", "diffuseconstant",
                        "edgemode", "filterunits", "glyphref", "gradienttransform", "gradientunits", "kernelmatrix", "kernelunitlength",
                        "keypoints", "keysplines", "keytimes", "lengthadjust", "limitingconeangle", "markerheight", "markerunits", "markerwidth",
                        "maskcontentunits", "maskunits", "numoctaves", "pathlength", "patterncontentunits", "patterntransform", "patternunits",
                        "pointsatx", "pointsaty", "pointsatz", "preservealpha", "preserveaspectratio", "primitiveunits", "refx", "refy",
                        "repeatcount", "repeatdur", "requiredextensions", "requiredfeatures", "specularconstant", "specularexponent",
                        "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "surfacescale", "systemlanguage", "tablevalues",
                        "targetx", "targety", "textlength", "viewbox", "viewtarget", "xchannelselector", "ychannelselector", "zoomandpan",];
                    for (var key in token[2]) {
                        var pos = listLow.indexOf(key.toLowerCase());
                        if (pos != -1) {
                            token[2][list[pos]] = token[2][key];
                            delete token[2][key];
                            break;
                        }
                    }
                }

                function adjustForeignAttr(token) {
                    var list = ["xlink:actuate", "xlink:arcrole", "xlink:href", "xlink:role", "xlink:show", "xlink:title", "xlink:type", "xml:lang", "xml:space", "xmlns", "xmlns:xlink"];
                    for (var key in token[2])
                        if (list.indexOf(key.toLowerCase()) != -1) {
                            var value = key.split(":");
                            if (value.length > 1)
                                token[2][key] = {
                                    prefix: value[0],
                                    localName: value[1],
                                    namespace: nsEl[value[0]],
                                    value: token[2][key]
                                };
                            else
                                token[2][key] = {
                                    prefix: null,
                                    localName: value[0],
                                    namespace: nsEl[value[0]],
                                    value: token[2][key]
                                };
                            break;
                        }
                }

                function insertForeignElement(token, namespace) {
                    var adjustInsert = appropriateInsert();
                    var newNode = createElement(token[1], adjustInsert.mode == "last" ? adjustInsert.target : adjustInsert.target.parent, namespace, token);
                    insertNode(adjustInsert.target, newNode, adjustInsert.mode);
                    stackOpen.push(newNode);
                    return newNode;
                }

                function consumeNext(eof) {
                    currentInput = nextInput;
                    nextInput++;
                    var utfCode = (currentInput < stream.length ? stream[currentInput].codePointAt(0).toString(16).toUpperCase() : "EOF");
                    utfCode = utfCode.length > 4 ? utfCode : ("0000" + utfCode).slice(-4);
                    if (eof)
                        logall.push(">> Consumed " + (currentInput < stream.length ? stream[currentInput] + " (U+" + utfCode + ")" : "EOF"));
                    else
                        logall.push(">> Consumed " + stream[currentInput] + " (U+" + utfCode + ")");
                }

                function reconsumeCurrent() {
                    var utfCode = (currentInput < stream.length ? stream[currentInput].codePointAt(0).toString(16).toUpperCase() : "EOF");
                    utfCode = utfCode.length > 4 ? utfCode : ("0000" + utfCode).slice(-4);
                    logall.push(">> Reconsume: " + (currentInput < stream.length ? stream[currentInput] + " (U+" + utfCode + ")" : "EOF"));
                    nextInput = currentInput;
                    currentInput--;
                }

                //12.2.5 Tree construction
                var treeConstruction = function (token) {
                    function insertComment(position) {
                        var data = token[1];
                        var adjustInsert = position;
                        if (adjustInsert == null)
                            adjustInsert = appropriateInsert();
                        var newNode = new nodes("comment", adjustInsert.target.document);
                        newNode.data = data;
                        insertNode(adjustInsert.target, newNode, adjustInsert.mode);
                    }

                    function insertCharacter(character) {
                        var data = character;
                        var adjustInsert = appropriateInsert();
                        if (adjustInsert.target.parent == null)
                            return;
                        if (adjustInsert.mode == "last")
                            var prevEl = adjustInsert.target.lastChild;
                        else if (adjustInsert.mode == "before")
                            var prevEl = adjustInsert.target.prev;
                        if (prevEl.type == "text")
                            prevEl.data += data;
                        else {
                            var newNode = new nodes("text", adjustInsert.target.document);
                            newNode.data = data;
                            insertNode(adjustInsert.target, newNode, adjustInsert.mode);
                        }
                    }

                    function acknowledgeSelfClose(token) {
                        if ((token[0] == "StartTag" && !token[3]) || (token[0] == "EndTag" && (token[2] != null || token[3])))
                            emit("ParseError");
                    }

                    function insertMarker() {
                        listFormat.push(new nodes("marker"));
                    }

                    function clearTableContext() {
                        var list = ["table", "template", "html"];
                        while (true) {
                            if (list.indexOf(currentNode().type) != -1)
                                break;
                            stackOpen.pop();
                        }
                    }

                    function clearTableBody() {
                        var list = ["tbody", "tfoot", "thead", "template", "html"];
                        while (true) {
                            if (list.indexOf(currentNode().type) != -1)
                                break;
                            stackOpen.pop();
                        }
                    }

                    function clearTableRow() {
                        var list = ["tr", "template", "html"];
                        while (true) {
                            if (list.indexOf(currentNode().type) != -1)
                                break;
                            stackOpen.pop();
                        }
                    }

                    function closeCell(reprocess) {
                        generateImpliedEndTags();
                        if (["td", "th"].indexOf(currentNode().type) == -1)
                            emit("ParseError");
                        while (true) {
                            var popEl = stackOpen.pop();
                            if (["td", "th"].indexOf(popEl.type) != -1)
                                break;
                        }
                        clearActiveFormat();
                        switchMode("In row", reprocess);
                    }

                    function closePElement() {
                        generateImpliedEndTags("p");
                        if (currentNode().type != "p")
                            emit("ParseError");
                        while (true) {
                            var popEl = stackOpen.pop();
                            if (popEl.type == "p")
                                break;
                        }
                    }

                    logall.push("\nCall function Tree Construction (12.2.5)");
                    while (reProcess) {
                        reProcess = false;
                        logall.push('> Switch to the "' + mode[mode.length - 1] + '" insertion mode');
                        switch (mode[mode.length - 1]) {
                            case 'Initial': //12.2.5.4.1 The "initial" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.1)";
                                var flag = false;
                                switch (token[0]) {
                                    case "Character":
                                        var tempList = ["\u0009", "\u000A", "\u000C", "\u000D", "\u0020"];
                                        if (tempList.indexOf(token[1]) == -1)
                                            flag = true;
                                        break;
                                    case "Comment":
                                        insertComment({target: document, mode: "last"});
                                        break;
                                    case "DOCTYPE":
                                        var flagDOC = token[1] == "html" && ((token[2] == "-//W3C//DTD HTML 4.0//EN" && (token[3] == null || token[3] == "http://www.w3.org/TR/REC-html40/strict.dtd" || token[3] == "http://www.w3.org/TR/html4/strict.dtd"))
                                            || (token[2] == "-//W3C//DTD XHTML 1.0 Strict//EN" && token[3] == "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd") || (token[2] == "-//W3C//DTD XHTML 1.1//EN" && token[3] == "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"));
                                        if (token[1] != "html" || token[2] != null || token[3] != null || token[3] != "about:legacy-compat" || !flagDOC)
                                            emit("ParseError");
                                        var newNode = new nodes("DocumentType", document);
                                        insertNode(newNode.document, newNode, "last");
                                        newNode.name = token[1] != null ? token[1] : "";
                                        newNode.publicId = token[2] != null ? token[2] : "";
                                        newNode.systemId = token[3] != null ? token[3] : "";
                                        document.doctype = newNode;

                                        var arrayPublic = ["-//W3O//DTD W3 HTML Strict 3.0//EN//".toUpperCase(), "-/W3C/DTD HTML 4.0 Transitional/EN".toUpperCase(), "HTML"];
                                        var flagStart = function () {
                                            var arrayPublic = ["+//Silmaril//dtd html Pro v0r11 19970101//", "-//AS//DTD HTML 3.0 asWedit + extensions//", "-//AdvaSoft Ltd//DTD HTML 3.0 asWedit + extensions//",
                                                "-//IETF//DTD HTML 2.0 Level 1//", "-//IETF//DTD HTML 2.0 Level 2//", "-//IETF//DTD HTML 2.0 Strict Level 1//", "-//IETF//DTD HTML 2.0 Strict Level 2//",
                                                "-//IETF//DTD HTML 2.0 Strict//", "-//IETF//DTD HTML 2.0//", "-//IETF//DTD HTML 2.1E//", "-//IETF//DTD HTML 3.0//", "-//IETF//DTD HTML 3.2 Final//",
                                                "-//IETF//DTD HTML 3.2//", "-//IETF//DTD HTML 3//", "-//IETF//DTD HTML Level 0//", "-//IETF//DTD HTML Level 1//", "-//IETF//DTD HTML Level 2//",
                                                "-//IETF//DTD HTML Level 3//", "-//IETF//DTD HTML Strict Level 0//", "-//IETF//DTD HTML Strict Level 1//", "-//IETF//DTD HTML Strict Level 2//",
                                                "-//IETF//DTD HTML Strict Level 3//", "-//IETF//DTD HTML Strict//", "-//IETF//DTD HTML//", "-//Metrius//DTD Metrius Presentational//",
                                                "-//Microsoft//DTD Internet Explorer 2.0 HTML Strict//", "-//Microsoft//DTD Internet Explorer 2.0 HTML//", "-//Microsoft//DTD Internet Explorer 2.0 Tables//",
                                                "-//Microsoft//DTD Internet Explorer 3.0 HTML Strict//", "-//Microsoft//DTD Internet Explorer 3.0 HTML//", "-//Microsoft//DTD Internet Explorer 3.0 Tables//",
                                                "-//Netscape Comm. Corp.//DTD HTML//", "-//Netscape Comm. Corp.//DTD Strict HTML//", "-//O'Reilly and Associates//DTD HTML 2.0//", "-//O'Reilly and Associates//DTD HTML Extended 1.0//",
                                                "-//O'Reilly and Associates//DTD HTML Extended Relaxed 1.0//", "-//SQ//DTD HTML 2.0 HoTMetaL + extensions//", "-//SoftQuad Software//DTD HoTMetaL PRO 6.0::19990601::extensions to HTML 4.0//",
                                                "-//SoftQuad//DTD HoTMetaL PRO 4.0::19971010::extensions to HTML 4.0//", "-//Spyglass//DTD HTML 2.0 Extended//", "-//Sun Microsystems Corp.//DTD HotJava HTML//",
                                                "-//Sun Microsystems Corp.//DTD HotJava Strict HTML//", "-//W3C//DTD HTML 3 1995-03-24//", "-//W3C//DTD HTML 3.2 Draft//", "-//W3C//DTD HTML 3.2 Final//", "-//W3C//DTD HTML 3.2//",
                                                "-//W3C//DTD HTML 3.2S Draft//", "-//W3C//DTD HTML 4.0 Frameset//", "-//W3C//DTD HTML 4.0 Transitional//", "-//W3C//DTD HTML Experimental 19960712//",
                                                "-//W3C//DTD HTML Experimental 970421//", "-//W3C//DTD W3 HTML//", "-//W3O//DTD W3 HTML 3.0//", "-//WebTechs//DTD Mozilla HTML 2.0//", "-//WebTechs//DTD Mozilla HTML//"];
                                            for (var i in arrayPublic)
                                                if (newNode.publicId.substr(0, arrayPublic[i].length).toUpperCase() == arrayPublic[i].toUpperCase())
                                                    return true;
                                            var arrayPublic = ["-//W3C//DTD HTML 4.01 Frameset//", "-//W3C//DTD HTML 4.01 Transitional//"];
                                            for (var i in arrayPublic)
                                                if (newNode.systemId == null && newNode.publicId.substr(0, arrayPublic[i].length).toUpperCase() == arrayPublic[i].toUpperCase())
                                                    return true;
                                            return false;
                                        }
                                        var flagStart2 = function () {
                                            var arrayPublic = ["-//W3C//DTD XHTML 1.0 Frameset//", "-//W3C//DTD XHTML 1.0 Transitional//"];
                                            for (var i in arrayPublic)
                                                if (newNode.publicId.substr(0, arrayPublic[i].length).toUpperCase() == arrayPublic[i].toUpperCase())
                                                    return true;
                                            arrayPublic = ["-//W3C//DTD HTML 4.01 Frameset//", "-//W3C//DTD HTML 4.01 Transitional//"];
                                            for (var i in arrayPublic)
                                                if (newNode.systemId != null && newNode.publicId.substr(0, arrayPublic[i].length).toUpperCase() == arrayPublic[i].toUpperCase())
                                                    return true;
                                            return false;
                                        }
                                        var flagQuirks = token[4] || newNode.name != "html" || arrayPublic.indexOf(newNode.publicId.toUpperCase()) != -1 || newNode.systemId.toUpperCase() == "http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd".toUpperCase() || flagStart();
                                        if (document.type != "iframe" && flagQuirks)
                                            document.mode = "quirks";
                                        else if (document.type != "iframe" && flagStart2())
                                            document.mode = "limited-quirks";
                                        switchMode("Before html");
                                        break;
                                    default:
                                        flag = true;
                                        break;
                                }
                                if (flag) {
                                    if (document.type != "iframe") {
                                        emit("ParseError");
                                        document.mode = "quirks";
                                    }
                                    switchMode("Before html", true);
                                }
                                break;
                            case 'Before html': //12.2.5.4.2 The "before html" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.2)";
                                var flag = false;
                                switch (token[0]) {
                                    case "DOCTYPE":
                                        emit("ParseError");
                                        break;
                                    case "Comment":
                                        insertComment({target: document, mode: "last"});
                                        break;
                                    case "Character":
                                        var tempList = ["\u0009", "\u000A", "\u000C", "\u000D", "\u0020"];
                                        if (tempList.indexOf(token[1]) == -1)
                                            flag = true;
                                        break;
                                    case "StartTag":
                                        if (token[1] == "html") {
                                            var newNode = createElement(token[1], document, token[4], token);
                                            insertNode(document, newNode, "last");
                                            stackOpen.push(newNode);
                                            //**/
                                            switchMode("Before head");
                                        }
                                        else
                                            flag = true;
                                        break;
                                    case "EndTag":
                                        if (["head", "body", "html", "br"].indexOf(token[1]) != -1)
                                            flag = true;
                                        else
                                            emit("ParseError");
                                        break;
                                    default:
                                        flag = true;
                                        break;
                                }
                                if (flag) {
                                    var newNode = createElement("html", document, nsEl["html"], ["StartTag", "html", {}]);
                                    insertNode(document, newNode, "last");
                                    stackOpen.push(newNode);
                                    //**/
                                    switchMode("Before head", true);
                                }
                                break;
                            case 'Before head': //12.2.5.4.3 The "before head" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.3)";
                                var flag = false;
                                switch (token[0]) {
                                    case "DOCTYPE":
                                        emit("ParseError");
                                        break;
                                    case "Comment":
                                        insertComment();
                                        break;
                                    case "Character":
                                        if (["\u0009", "\u000A", "\u000C", "\u000D", "\u0020"].indexOf(token[1]) == -1)
                                            flag = true;
                                        break;
                                    case "StartTag":
                                        if (token[1] == "html")
                                            switchMode("In body", true, true);
                                        else if (token[1] == "head") {
                                            var newNode = insertHTMLElement(token);
                                            headPointer = newNode;
                                            switchMode("In head");
                                        }
                                        else
                                            flag = true;
                                        break;
                                    case "EndTag":
                                        if (["head", "body", "html", "br"].indexOf(token[1]) != -1)
                                            flag = true;
                                        else
                                            emit("ParseError");
                                        break;
                                    default:
                                        flag = true;
                                        break;
                                }
                                if (flag) {
                                    var newNode = insertHTMLElement(["StartTag", "head", {}]);
                                    headPointer = newNode;
                                    switchMode("In head", true);
                                }
                                break;
                            case 'In head': //12.2.5.4.4 The "in head" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.4)";
                                var flag = false;
                                switch (token[0]) {
                                    case "DOCTYPE":
                                        emit("ParseError");
                                        break;
                                    case "Comment":
                                        insertComment();
                                        break;
                                    case "Character":
                                        if (["\u0009", "\u000A", "\u000C", "\u000D", "\u0020"].indexOf(token[1]) != -1)
                                            insertCharacter(token[1]);
                                        else
                                            flag = true;
                                        break;
                                    case "StartTag":
                                        if (token[1] == "html")
                                            switchMode("In body", true, true);
                                        else if (["base", "basefont", "bgsound", "link"].indexOf(token[1]) != -1) {
                                            var newNode = insertHTMLElement(token);
                                            stackOpen.pop();
                                            acknowledgeSelfClose(token);
                                        }
                                        else if (token[1] == "meta") {
                                            var newNode = insertHTMLElement(token);
                                            stackOpen.pop();
                                            acknowledgeSelfClose(token);
                                            //**/
                                        }
                                        else if (token[1] == "title")
                                            genericRCDATAParsing(token);
                                        else if (token[1] == "noscript" && !scriptFlag) {
                                            var newNode = insertHTMLElement(token);
                                            switchMode("In head noscript");
                                        }
                                        else if (token[1] == "script") {
                                            var adjustInsert = appropriateInsert();
                                            var newNode = insertHTMLElement(token);
                                            newNode.parent = adjustInsert.mode == "last" ? adjustInsert.target : adjustInsert.target.parent;
                                            newNode.parserInserted = true;
                                            newNode.nonBlocking = false;
                                            if (fragmentParse)
                                                newNode.alreadyStarted = true;
                                            insertNode(adjustInsert.target, newNode, adjustInsert.mode);
                                            stackOpen.push(newNode);
                                            state.push("Script data state");
                                            switchMode("Text", null, true);
                                        }
                                        else if (token[1] == "template") {
                                            var newNode = insertHTMLElement(token);
                                            var newMarker = insertMarker();
                                            framesetFlag = "not ok";
                                            switchMode("In template");
                                            stackTemplate.push("in template")
                                        }
                                        else if (token[1] == "head")
                                            emit("ParseError");
                                        else
                                            flag = true;
                                        break;
                                    case "EndTag":
                                        if (token[1] == "head") {
                                            stackOpen.pop();
                                            switchMode("After head");
                                        }
                                        else if (["body", "html", "br"].indexOf(token[1]) != -1)
                                            flag = true;
                                        else if (token[1] == "template") {
                                            var flag = false;
                                            for (var i in stackOpen)
                                                if (stackOpen[i].type == "template") {
                                                    flag = true;
                                                    break;
                                                }
                                            if (!flag)
                                                emit("ParseError");
                                            else {
                                                generateAllImpliedEndTags();
                                                if (currentNode().type != "template")
                                                    emit("ParseError");
                                                while (true) {
                                                    var popEl = stackOpen.pop();
                                                    if (popEl.type == "template")
                                                        break;
                                                }
                                                clearActiveFormat();
                                                stackTemplate.pop();
                                                resetModeProperly();
                                            }
                                        }
                                        else
                                            emit("ParseError");
                                        break;
                                    default:
                                        flag = true;
                                        break;
                                }
                                if (flag) {
                                    stackOpen.pop();
                                    switchMode("After head", true);
                                }
                                break;
                            case 'In head noscript': //12.2.5.4.5 The "in head noscript" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.5)";
                                var flag = false;
                                switch (token[0]) {
                                    case "DOCTYPE":
                                        emit("ParseError");
                                        break;
                                    case "Comment":
                                        switchMode("In head", true, true);
                                        break;
                                    case "Character":
                                        if (["\u0009", "\u000A", "\u000C", "\u000D", "\u0020"].indexOf(token[1]) != -1)
                                            switchMode("In head", true, true);
                                        else
                                            flag = true;
                                        break;
                                    case "StartTag":
                                        if (token[1] == "html")
                                            switchMode("In body", true, true);
                                        else if (["basefont", "bgsound", "link", "meta", "noframes", "style"].indexOf(token[1]) != -1)
                                            switchMode("In head", true, true);
                                        else if (token[1] == "head" || token[1] == "noscript")
                                            emit("ParseError");
                                        else
                                            flag = true;
                                        break;
                                    case "EndTag":
                                        if (token[1] == "noscript") {
                                            stackOpen.pop();
                                            switchMode("In head");
                                        }
                                        else if (token[1] == "br")
                                            flag = true;
                                        else
                                            emit("ParseError");
                                        break;
                                    default:
                                        flag = true;
                                        break;
                                }
                                if (flag) {
                                    emit("ParseError");
                                    stackOpen.pop();
                                    switchMode("In head", true);
                                }
                                break;
                            case 'After head': //12.2.5.4.6 The "after head" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.6)";
                                var flag = false;
                                switch (token[0]) {
                                    case "DOCTYPE":
                                        emit("ParseError");
                                        break;
                                    case "Comment":
                                        insertComment();
                                        break;
                                    case "Character":
                                        if (["\u0009", "\u000A", "\u000C", "\u000D", "\u0020"].indexOf(token[1]) != -1)
                                            insertCharacter(token[1]);
                                        else
                                            flag = true;
                                        break;
                                    case "StartTag":
                                        if (token[1] == "html")
                                            switchMode("In body", true, true);
                                        else if (token[1] == "body") {
                                            var newNode = insertHTMLElement(token);
                                            framesetFlag = "not ok";
                                            switchMode("In body");
                                        }
                                        else if (token[1] == "frameset") {
                                            var newNode = insertHTMLElement(token);
                                            switchMode("In frameset");
                                        }
                                        else if (["base", "basefont", "bgsound", "link", "meta", "noframes", "script", "style", "template", "title"].indexOf(token[1]) != -1) {
                                            emit("ParseError");
                                            stackOpen.push(headPointer);
                                            switchMode("In head", true, true, "stackOpen.splice(stackOpen.indexOf(headPointer), 1):");
                                        }
                                        else if (token[1] == "head")
                                            emit("ParseError");
                                        else
                                            flag = true;
                                        break;
                                    case "EndTag":
                                        if (token[1] == "template")
                                            switchMode("In head", true, true);
                                        else if (["body", "html", "br"].indexOf(token[1]) != -1)
                                            flag = true;
                                        else
                                            emit("ParseError");
                                        break;
                                    default:
                                        flag = true;
                                        break;
                                }
                                if (flag) {
                                    var newNode = insertHTMLElement(["StartTag", "body", {}]);
                                    switchMode("In body", true);
                                }
                                break;
                            case 'In body': //12.2.5.4.7 The "in body" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.7)";
                                var flag = false;
                                var flagBody = function () {
                                    for (var i in stackOpen)
                                        if (["dd", "dt", "li", "optgroup", "option", "p", "rb", "rp", "rt", "rtc", "tbody",
                                                "td", "tfoot", "th", "thead", "tr", "body", "html"].indexOf(stackOpen[i].type) == -1)
                                            return true
                                    return false;
                                }
                                var flagTemplate = function () {
                                    for (var i in stackOpen)
                                        if (stackOpen[i].type == "template")
                                            return true;
                                    return false;
                                };
                                switch (token[0]) {
                                    case "DOCTYPE":
                                        emit("ParseError");
                                        break;
                                    case "Comment":
                                        insertComment();
                                        break;
                                    case "Character":
                                        if (token[1] == "\u0000")
                                            emit("ParseError");
                                        else if (["\u0009", "\u000A", "\u000C", "\u000D", "\u0020"].indexOf(token[1]) != -1) {
                                            reconstructActiveFormat();
                                            insertCharacter(token[1]);
                                        }
                                        else {
                                            reconstructActiveFormat();
                                            insertCharacter(token[1]);
                                            framesetFlag = "not ok";
                                        }
                                        break;
                                    case "StartTag":
                                        if (token[1] == "html") {
                                            emit("ParseError");
                                            if (!flagTemplate()) {
                                                for (var i in token[2])
                                                    if (stackOpen[0].attr[i] == null)
                                                        stackOpen[0].attr[i] = token[2][i];
                                            }
                                        }
                                        else if (["base", "basefont", "bgsound", "link", "meta", "noframes", "script", "style", "template", "title"].indexOf(token[1]) != -1)
                                            switchMode("In head", true, true);
                                        else if (token[1] == "body") {
                                            emit("ParseError");
                                            if (stackOpen[1].type == "body" && stackOpen.length != 1 && !flagTemplate()) {
                                                framesetFlag = "not ok";
                                                for (var i in token[2])
                                                    if (stackOpen[1].attr[i] == null)
                                                        stackOpen[1].attr[i] = token[2][i];
                                            }
                                        }
                                        else if (token[1] == "frameset") {
                                            emit("ParseError");
                                            if (stackOpen[1].type == "body" && stackOpen.length != 1 && framesetFlag != "not ok") {
                                                if (stackOpen[1].parent != null)
                                                    removeNode(stackOpen[1]);
                                                while (true) {
                                                    if (currentNode().type == "html")
                                                        break;
                                                    stackOpen.pop();
                                                }
                                                insertHTMLElement(token);
                                                switchMode("In frameset");
                                            }
                                        }
                                        else if (["address", "article", "aside", "blockquote", "center", "details", "dialog", "dir",
                                                "div", "dl", "fieldset", "figcaption", "figure", "footer", "header", "hgroup", "main",
                                                "menu", "nav", "ol", "p", "section", "summary", "ul"].indexOf(token[1]) != -1) {
                                            if (hasButtonScope("p"))
                                                closePElement();
                                            insertHTMLElement(token);
                                        }
                                        else if (["h1", "h2", "h3", "h4", "h5", "h6"].indexOf(token[1]) != -1) {
                                            if (hasButtonScope("p"))
                                                closePElement();
                                            if (["h1", "h2", "h3", "h4", "h5", "h6"].indexOf(currentNode().type)) {
                                                emit("ParseError");
                                                stackOpen.pop();
                                            }
                                            insertHTMLElement(token);
                                        }
                                        else if (["pre", "listing"].indexOf(token[1]) != -1) {
                                            if (hasButtonScope("p"))
                                                closePElement();
                                            insertHTMLElement(token);
                                            if (getNextToken() == ["Character", "\u000A"])
                                                ignoreTokenFlag = true;
                                            framesetFlag = "not ok";
                                        }
                                        else if (token[1] == "form") {
                                            if (formPointer != null && !flagTemplate())
                                                emit("ParseError");
                                            else {
                                                if (hasButtonScope("p"))
                                                    closePElement();
                                                var newNode = insertHTMLElement(token);
                                                if (!flagTemplate())
                                                    formPointer = newNode;
                                            }
                                        }
                                        else if (token[1] == "li") {
                                            framesetFlag = "not ok";
                                            var node = currentNode();
                                            while (true) {
                                                if (node.type == "li") {
                                                    generateImpliedEndTags("li");
                                                    if (currentNode().type != "li")
                                                        emit("ParseError");
                                                    while (true) {
                                                        var popEl = stackOpen.pop();
                                                        if (popEl.type == "li")
                                                            break;
                                                    }
                                                }
                                                if (specialTag.indexOf(node.type) == -1 || ["address", "div", "p"].indexOf(node.type) != -1) {
                                                    node = stackOpen[stackOpen.indexOf(node) - 1];
                                                    continue;
                                                }
                                                if (hasButtonScope("p"))
                                                    closePElement();
                                                insertHTMLElement(token);
                                            }
                                        }
                                        else if (["dd", "dt"].indexOf(token[1]) != -1) {
                                            framesetFlag = "not ok";
                                            var node = currentNode();
                                            while (true) {
                                                var flagDone = false;
                                                if (node.type == "dd") {
                                                    generateImpliedEndTags("dd");
                                                    if (currentNode().type != "dd")
                                                        emit("ParseError");
                                                    while (true) {
                                                        var popEl = stackOpen.pop();
                                                        if (popEl.type == "dd")
                                                            break;
                                                    }
                                                    flagDone = true;
                                                }
                                                if (!flagDone && node.type == "dd") {
                                                    generateImpliedEndTags("dd");
                                                    if (currentNode().type != "dd")
                                                        emit("ParseError");
                                                    while (true) {
                                                        var popEl = stackOpen.pop();
                                                        if (popEl.type == "dd")
                                                            break;
                                                    }
                                                    flagDone = true;
                                                }
                                                if (specialTag.indexOf(node.type) == -1 || ["address", "div", "p"].indexOf(node.type) != -1) {
                                                    node = stackOpen[stackOpen.indexOf(node) - 1];
                                                    continue;
                                                }
                                                if (hasButtonScope("p"))
                                                    closePElement();
                                                insertHTMLElement(token);
                                            }
                                        }
                                        else if (token[1] == "plaintext") {
                                            if (hasButtonScope("p"))
                                                closePElement();
                                            insertHTMLElement(token);
                                            state.push("PLAINTEXT state");
                                        }
                                        else if (token[1] == "button") {
                                            if (hasElementScope("button")) {
                                                emit("ParseError");
                                                generateImpliedEndTags();
                                                while (true) {
                                                    var popEl = stackOpen.pop();
                                                    if (popEl.type == "button")
                                                        break;
                                                }
                                            }
                                            reconstructActiveFormat();
                                            insertHTMLElement(token);
                                            framesetFlag = "not ok";
                                        }
                                        else if (token[1] == "a") {
                                            var lastMarker = 0;
                                            for (var i in listFormat)
                                                if (listFormat[listFormat.length - i - 1].type == "marker") {
                                                    lastMarker = i;
                                                    break;
                                                }
                                            var flag = -1;
                                            for (var i = lastMarker; i < listFormat.length; i++)
                                                if (listFormat[i].type == "a") {
                                                    flag = i;
                                                    break;
                                                }
                                            if (flag != -1) {
                                                emit("ParseError");
                                                var resAdopt = adoptionAgency(token[1], token[4], token);
                                                if (resAdopt == -1)
                                                    flag = true;
                                                else {
                                                    stackOpen.splice(stackOpen.indexOf(listFormat[flag]), 1);
                                                    listFormat.splice(flag, 1);
                                                }
                                            }

                                            reconstructActiveFormat();
                                            var newNode = insertHTMLElement(token);
                                            pushListFormat(newNode);
                                        }
                                        else if (["b", "big", "code", "em", "font", "i", "s", "small", "strike", "strong", "tt", "u"].indexOf(token[1]) != -1) {
                                            reconstructActiveFormat();
                                            var newNode = insertHTMLElement(token);
                                            pushListFormat(newNode);
                                        }
                                        else if (token[1] == "nobr") {
                                            reconstructActiveFormat();
                                            var resAdopt;
                                            if (hasElementScope("nobr")) {
                                                emit("ParseError");
                                                resAdopt = adoptionAgency(token[1], token[4], token);
                                                if (resAdopt == -1)
                                                    flag = true;
                                                else
                                                    reconstructActiveFormat();
                                            }
                                            if (resAdopt != -1) {
                                                var newNode = insertHTMLElement(token);
                                                pushListFormat(newNode)
                                            }
                                        }
                                        else if (["applet", "marquee", "object"].indexOf(token[1]) != -1) {
                                            reconstructActiveFormat();
                                            insertHTMLElement(token);
                                            insertMarker();
                                            framesetFlag = "not ok";
                                        }
                                        else if (token[1] == "table") {
                                            if (document.mode != "quirks" && hasButtonScope("p"))
                                                closePElement();
                                            insertHTMLElement(token);
                                            framesetFlag = "not ok";
                                            switchMode("In table");
                                        }
                                        else if (["area", "br", "embed", "img", "keygen", "wbr"].indexOf(token[1]) != -1) {
                                            reconstructActiveFormat();
                                            insertHTMLElement(token);
                                            stackOpen.pop();
                                            acknowledgeSelfClose(token);
                                            framesetFlag = "not ok";
                                        }
                                        else if (token[1] == "input") {
                                            reconstructActiveFormat();
                                            insertHTMLElement(token);
                                            stackOpen.pop();
                                            acknowledgeSelfClose(token);
                                            if (token[2]["type"] == null || token[2]["type"].toLowerCase() != "hidden")
                                                framesetFlag = "not ok";
                                        }
                                        else if (["menuitem", "param", "source", "track"].indexOf(token[1]) != -1) {
                                            insertHTMLElement(token);
                                            stackOpen.pop();
                                            acknowledgeSelfClose(token);
                                        }
                                        else if (token[1] == "hr") {
                                            if (hasButtonScope("p"))
                                                closePElement();
                                            insertHTMLElement(token);
                                            stackOpen.pop();
                                            acknowledgeSelfClose(token);
                                            framesetFlag = "not ok";
                                        }
                                        else if (token[1] == "image") {
                                            token[1] = "img";
                                            switchMode(mode[mode.length - 1], true);
                                        }
                                        else if (token[1] == "isindex") {
                                            emit("ParseError");
                                            function insertPromptCharacter(n) {
                                                if (token[2]["prompt"] != null) {
                                                    if (n == 1)
                                                        insertCharacter(token[2]["prompt"]);
                                                    else if (n == 2)
                                                        insertCharacter();
                                                }
                                                else {
                                                    insertCharacter("This is a searchable index. Enter search keywords: (input field)");
                                                }
                                            }

                                            if (flagTemplate() || formPointer == null) {
                                                acknowledgeSelfClose(token);
                                                framesetFlag = "not ok";
                                                if (hasButtonScope("p"))
                                                    closePElement();
                                                var newNode = insertHTMLElement(["StartTag", "form", {}]);
                                                if (!flagTemplate())
                                                    formPointer = newNode;
                                                if (token[2]["action"] != null)
                                                    newNode.attr["action"] = token[2]["action"];
                                                insertHTMLElement(["StartTag", "hr", {}]);
                                                stackOpen.pop();
                                                reconstructActiveFormat();
                                                insertHTMLElement(["StartTag", "label", {}]);
                                                insertPromptCharacter(1);
                                                var el = ["StartTag", "input", token[2]];
                                                el[2]["name"] = "isindex";
                                                delete el[2]["action"];
                                                delete el[2]["prompt"];
                                                insertHTMLElement(el);
                                                stackOpen.pop();
                                                insertPromptCharacter(2);
                                                stackOpen.pop();
                                                insertHTMLElement(["StartTag", "hr", {}]);
                                                stackOpen.pop();
                                                stackOpen.pop();
                                                if (!flagTemplate())
                                                    formPointer = null;
                                            }
                                        }
                                        else if (token[1] == "textarea") {
                                            insertHTMLElement(token);
                                            if (getNextToken() == ["Character", "\u000A"])
                                                ignoreTokenFlag = true;
                                            state.push("RCDATA state");
                                            framesetFlag = "not ok";
                                            switchMode("Text", null, true);
                                        }
                                        else if (token[1] == "xmp") {
                                            if (hasButtonScope("p"))
                                                closePElement();
                                            reconstructActiveFormat();
                                            framesetFlag = "not ok";
                                            genericRawTextParsing(token);
                                        }
                                        else if (token[1] == "iframe") {
                                            framesetFlag = "not ok";
                                            genericRawTextParsing(token);
                                        }
                                        else if (token[1] == "noembed" || (token[1] == "noscript" && scriptFlag)) {
                                            genericRawTextParsing(token);
                                        }
                                        else if (token[1] == "select") {
                                            reconstructActiveFormat();
                                            insertHTMLElement(token);
                                            framesetFlag = "not ok";
                                            if (["in table", "in caption", "in table body", "in row", "in cell"].indexOf(mode[mode.length - 1]))
                                                switchMode("In select in table");
                                            else
                                                switchMode("In select")
                                        }
                                        else if (["optgroup", "option"].indexOf(token[1]) != -1) {
                                            if (currentNode().type == "option")
                                                stackOpen.pop();
                                            reconstructActiveFormat();
                                            insertHTMLElement(token);
                                        }
                                        else if (["rb", "rtc"].indexOf(token[1]) != -1) {
                                            if (hasElementScope("ruby"))
                                                generateImpliedEndTags();
                                            if (currentNode().type != "ruby")
                                                emit("ParseError");
                                            insertHTMLElement(token);
                                        }
                                        else if (["rp", "rt"].indexOf(token[1]) != -1) {
                                            if (hasElementScope("ruby"))
                                                generateImpliedEndTags("rtc");
                                            if (["rtc", "ruby"].indexOf(currentNode().type))
                                                emit("ParseError");
                                            insertHTMLElement(token);
                                        }
                                        else if (token[1] == "math") {
                                            reconstructActiveFormat();
                                            adjustMathMLAttr(token);
                                            adjustForeignAttr(token);
                                            insertForeignElement(token, token[4]);
                                            if (token[3]) {
                                                stackOpen.pop();
                                                acknowledgeSelfClose(token);
                                            }
                                        }
                                        else if (token[1] == "svg") {
                                            reconstructActiveFormat();
                                            adjustSVGAttr(token);
                                            adjustForeignAttr(token);
                                            insertForeignElement(token, token[4]);
                                            if (token[3]) {
                                                stackOpen.pop();
                                                acknowledgeSelfClose(token);
                                            }
                                        }
                                        else if (["caption", "col", "colgroup", "frame", "head", "tbody", "td", "tfoot", "th", "thead", "tr"].indexOf(token[1]) != -1)
                                            emit("ParseError");
                                        else {
                                            reconstructActiveFormat();
                                            insertHTMLElement(token);
                                        }
                                        break;
                                    case "EndTag":
                                        if (token[1] == "template")
                                            switchMode("In head", true, true);
                                        else if (token[1] == "body") {
                                            if (!hasElementScope("body"))
                                                emit("ParseError");
                                            else if (flagBody()) {
                                                emit("ParseError");
                                                switchMode("After body");
                                            }
                                        }
                                        else if (token[1] == "html") {
                                            if (!hasElementScope("body"))
                                                emit("ParseError");
                                            else if (flagBody()) {
                                                emit("ParseError");
                                                switchMode("After body", true);
                                            }
                                        }
                                        else if (["address", "article", "aside", "blockquote", "button", "center", "details", "dialog",
                                                "dir", "div", "dl", "fieldset", "figcaption", "figure", "footer", "header", "hgroup",
                                                "listing", "main", "menu", "nav", "ol", "pre", "section", "summary", "ul"].indexOf(token[1]) != -1) {
                                            if (!hasElementScope(token[1]))
                                                emit("ParseError");
                                            else {
                                                generateImpliedEndTags();
                                                if (currentNode().type != token[1])
                                                    emit("ParseError");
                                                while (true) {
                                                    var popEl = stackOpen.pop();
                                                    if (popEl.type == token[1])
                                                        break;
                                                }
                                            }
                                        }
                                        else if (token[1] == "form") {
                                            if (!flagTemplate()) {
                                                var node = formPointer.length == 0 ? null : formPointer;
                                                formPointer = null;
                                                if (node = null || !hasElementScope(node.type)) {
                                                    emit("ParseError");
                                                    break;
                                                }
                                                generateImpliedEndTags();
                                                if (currentNode() != node)
                                                    emit("ParseError");
                                                stackOpen.splice(stackOpen.indexOf(node), 1);
                                            }
                                            if (flagTemplate()) {
                                                if (!hasElementScope("form")) {
                                                    emit("ParseError");
                                                    break;
                                                }
                                                generateImpliedEndTags();
                                                if (currentNode().type != "form")
                                                    emit("ParseError");
                                                while (true) {
                                                    var popEl = stackOpen.pop();
                                                    if (popEl.type == "form")
                                                        break;
                                                }
                                            }
                                        }
                                        else if (token[1] == "p") {
                                            if (!hasElementScope("p")) {
                                                emit("ParseError");
                                                insertHTMLElement(["StartTag", "p", {}]);
                                            }
                                            closePElement();
                                        }
                                        else if (token[1] == "li") {
                                            if (!hasListScope("li"))
                                                emit("ParseError");
                                            else {
                                                generateImpliedEndTags("li");
                                                if (currentNode().type != "li")
                                                    while (true) {
                                                        var popEl = stackOpen.pop();
                                                        if (popEl == "li")
                                                            break;
                                                    }
                                            }
                                        }
                                        else if (["dd", "dt"].indexOf(token[1]) != -1) {
                                            if (!hasElementScope(token[1]))
                                                emit("ParseError");
                                            else {
                                                generateImpliedEndTags(token[1]);
                                                if (currentNode().type != token[1])
                                                    emit("ParseError");
                                                while (true) {
                                                    var popEl = stackOpen.pop();
                                                    if (popEl.type == token[1])
                                                        break;
                                                }
                                            }
                                        }
                                        else if (["h1", "h2", "h3", "h4", "h5", "h6"].indexOf(token[1]) != -1) {
                                            if (!hasElementScope(["h1", "h2", "h3", "h4", "h5", "h6"]))
                                                emit("ParseError");
                                            else {
                                                generateImpliedEndTags();
                                                if (currentNode().type != token[1])
                                                    emit("ParseError");
                                                while (true) {
                                                    var popEl = stackOpen.pop();
                                                    if (["h1", "h2", "h3", "h4", "h5", "h6"].indexOf(popEl.type) != -1)
                                                        break;
                                                }
                                            }
                                        }
                                        else if (["a", "b", "big", "code", "em", "font", "i", "nobr", "s", "small", "strike", "strong", "tt", "u"].indexOf(token[1]) != -1)
                                            var resAdopt = adoptionAgency(token[1], token[4], token);
                                        if (resAdopt == -1)
                                            flag = true;
                                        else if (["applet", "marquee", "object"].indexOf(token[1]) != -1) {
                                            if (!hasElementScope(token[1]))
                                                emit("ParseError");
                                            else {
                                                generateImpliedEndTags();
                                                if (currentNode().type != token[1])
                                                    emit("ParseError");
                                                while (true) {
                                                    var popEl = stackOpen.pop();
                                                    if (popEl.type == token[1])
                                                        break;
                                                }
                                                clearActiveFormat();
                                            }
                                        }
                                        else if (token[1] == "br") {
                                            emit("ParseError");
                                            token[2] = {};
                                            reconstructActiveFormat();
                                            insertHTMLElement(token);
                                            stackOpen.pop();
                                            acknowledgeSelfClose(token);
                                            framesetFlag = "not ok";
                                        }
                                        else
                                            flag = true;
                                        break;
                                    case "End-of-file":
                                        if (stackTemplate.length != 0)
                                            switchMode("In template", true, true);
                                        else {
                                            if (flagBody())
                                                emit("ParseError");
                                            stopParsing();
                                        }
                                        break;
                                }
                                if (flag) {
                                    var node = currentNode();
                                    loop:
                                        while (true) {
                                            if (node.type == token[1]) {
                                                generateImpliedEndTags(token[1]);
                                                if (node != currentNode())
                                                    emit("ParseError");
                                                while (true) {
                                                    var popEl = stackOpen.pop();
                                                    if (popEl == node)
                                                        break loop;
                                                }
                                            }
                                            else if (specialTag.indexOf(node.type)) {
                                                emit("ParseError");
                                                break;
                                            }
                                            node = stackOpen[stackOpen.indexOf(node) - 1];
                                        }
                                }
                                break;
                            case 'Text': //12.2.5.4.8 The "text" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.8)";
                                switch (token[0]) {
                                    case "Character":
                                        insertCharacter(token[1]);
                                        break;
                                    case "EndTag":
                                        if (token[1] == "script") {
                                            //**/
                                            var script = currentNode();
                                            stackOpen.pop();
                                            switchMode(returnMode);
                                            var oldInsertionPoint = insertionPoint;
                                            insertionPoint = nextInput - 1;
                                            //**/
                                        }
                                        else {
                                            stackOpen.pop();
                                            switchMode(returnMode);
                                        }
                                        break;
                                    case "End-of-file":
                                        emit("ParseError");
                                        if (currentNode().type == "script")
                                            currentNode().alreadyStarte = true;
                                        stackOpen.pop();
                                        switchMode(returnMode, true);
                                        break;
                                }
                                break;
                            case 'In table': //12.2.5.4.9 The "in table" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.9)";
                                var flag = false;
                                switch (token[0]) {
                                    case "DOCTYPE":
                                        emit("ParseError");
                                        break;
                                    case "Comment":
                                        insertComment();
                                        break;
                                    case "Character":
                                        if (["table", "tbody", "tfoot", "thead", "tr"].indexOf(currentNode().type)) {
                                            pendingCharTable = [];
                                            switchMode("In table text", true, true);
                                        }
                                        else
                                            flag = true;
                                        break;
                                    case "StartTag":
                                        if (token[1] == "caption") {
                                            clearTableContext();
                                            insertMarker();
                                            insertHTMLElement(token);
                                            switchMode("In caption");
                                        }
                                        else if (token[1] == "colgroup") {
                                            clearTableContext();
                                            insertHTMLElement(token);
                                            switchMode("In column group");
                                        }
                                        else if (token[1] == "col") {
                                            clearTableContext();
                                            insertHTMLElement(["StartTag", "colgroup", {}]);
                                            switchMode("In column group", true);
                                        }
                                        else if (["tbody", "tfoot", "thead"].indexOf(token[1])) {
                                            clearTableContext();
                                            insertHTMLElement(token);
                                            switchMode("In table body");
                                        }
                                        else if (["td", "th", "tr"].indexOf(token[1])) {
                                            clearTableContext();
                                            insertHTMLElement(["StartTag", "tbody", {}]);
                                            switchMode("In table body", true);
                                        }
                                        else if (token[1] == "table") {
                                            emit("ParseError");
                                            if (hasTableScope("table")) {
                                                while (true) {
                                                    var popEl = stackOpen.pop();
                                                    if (popEl.type == "table")
                                                        break;
                                                }
                                                resetModeProperly(true);
                                                reProcess = true;
                                            }
                                        }
                                        else if (["style", "script", "template"].indexOf(token[1]) != -1)
                                            switchMode("In head", true, true);
                                        else if (token[1] == "input") {
                                            if (token[2]["type"] == null || token[2]["type"].toLowerCase() != "hidden")
                                                flag = true;
                                            else {
                                                emit("ParseError");
                                                insertHTMLElement(token);
                                                for (var i in stackOpen)
                                                    if (stackOpen[stackOpen.length - i - 1].type == "input") {
                                                        stackOpen.splice(stackOpen.length - i - 1, 1);
                                                        break;
                                                    }
                                                acknowledgeSelfClose(token);
                                            }
                                        }
                                        else if (token[1] == "form") {
                                            emit("ParseError");
                                            if (!(function () {
                                                    for (var i in stackOpen)
                                                        if (stackOpen[i].type == "template")
                                                            return true;
                                                    return false;
                                                })() && formPointer == null) {
                                                formPointer = insertHTMLElement(token);
                                                for (var i in stackOpen)
                                                    if (stackOpen[stackOpen.length - i - 1].type == "form") {
                                                        stackOpen.splice(stackOpen.length - i - 1, 1);
                                                        break;
                                                    }
                                            }
                                        }
                                        else
                                            flag = true;
                                        break;
                                    case "EndTag":
                                        if (token[1] == "table") {
                                            if (!hasTableScope("table"))
                                                emit("ParseError");
                                            else {
                                                while (true) {
                                                    var popEl = stackOpen.pop();
                                                    if (popEl.type == "table")
                                                        break;
                                                }
                                                resetModeProperly();
                                            }
                                        }
                                        else if (["body", "caption", "col", "colgroup", "html", "tbody", "td", "tfoot", "th", "thead", "tr"].indexOf(token[1]) != -1)
                                            emit("ParseError");
                                        else if (token[1] == "template")
                                            switchMode("In head", true, true);
                                        else
                                            flag = true;
                                        break;
                                    case "End-of-file":
                                        switchMode("In body", true, true);
                                        break;
                                    default:
                                        flag = true;
                                        break;
                                }
                                if (flag) {
                                    emit("ParseError");
                                    foster = true;
                                    switchMode("In body", true, true, "foster = false;")
                                }
                                break;
                            case 'In table text': //12.2.5.4.10 The "in table text" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.10)";
                                switch (token[0]) {
                                    case "Character":
                                        if (token[1] == "\u0000")
                                            emit("ParseError");
                                        else
                                            pendingCharTable.push(token);
                                        break;
                                    default:
                                        var flag = false;
                                        for (var i in pendingCharTable)
                                            if (pendingCharTable[i][0] == "Character" && ["\u0020", "\u0009", "\u000A", "\u000C", "\u000D"].indexOf(pendingCharTable[i][1]) == -1) {
                                                flag = true;
                                                break;
                                            }
                                        if (flag) {
                                            emit("ParseError");
                                            for (var i in pendingCharTable) {
                                                emit("ParseError");
                                                foster = true;
                                                reconstructActiveFormat();
                                                insertCharacter(pendingCharTable[i][1]);
                                                if (["\u0009", "\u000A", "\u000C", "\u000D", "\u0020"].indexOf(pendingCharTable[i][1]) == -1)
                                                    framesetFlag = "not ok";
                                                foster = false;

                                            }
                                        }
                                        else {
                                            for (var i in pendingCharTable)
                                                insertCharacter(pendingCharTable[i][1]);
                                            switchMode(returnMode, true);
                                        }
                                        break;
                                }
                                break;
                            case 'In caption': //12.2.5.4.11 The "in caption" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.11)";
                                var flag = false;
                                var flag2 = false;
                                switch (token[0]) {
                                    case "StartTag":
                                        if (["caption", "col", "colgroup", "tbody", "td", "tfoot", "th", "thead", "tr"].indexOf(token[1]) != -1) {
                                            flag = true;
                                            flag2 = true;
                                        }
                                        else
                                            switchMode("In body", true, true);
                                        break;
                                    case "EndTag":
                                        if (token[1] == "caption")
                                            flag = true;
                                        else if (token[1] == "table") {
                                            flag = true;
                                            flag2 = true;
                                        }
                                        else if (["body", "col", "colgroup", "html", "tbody", "td", "tfoot", "th", "thead", "tr"].indexOf(token[1]) != -1)
                                            emit("ParseError");
                                        else
                                            switchMode("In body", true, true);
                                        break;
                                    default:
                                        switchMode("In body", true, true);
                                        break;
                                }
                                if (flag) {
                                    if (!hasTableScope("caption"))
                                        emit("ParseError");
                                    else {
                                        generateImpliedEndTags();
                                        if (currentNode().type != "caption")
                                            emit("ParseError");
                                        while (true) {
                                            var popEl = stackOpen.pop();
                                            if (popEl.type == "caption")
                                                break;
                                        }
                                        clearActiveFormat();
                                        flag2 ? switchMode("In table", true) : switchMode("In table");
                                    }
                                }
                                break;
                            case 'In column group': //12.2.5.4.12 The "in column group" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.12)";
                                var flag = false;
                                switch (token[0]) {
                                    case "DOCTYPE":
                                        emit("ParseError");
                                        break;
                                    case "Comment":
                                        insertComment();
                                        break;
                                    case "Character":
                                        if (["\u0009", "\u000A", "\u000C", "\u000D", "\u0020"].indexOf(token[1]) != -1)
                                            insertCharacter(token[1]);
                                        else
                                            flag = true;
                                        break;
                                    case "StartTag":
                                        if (token[1] == "html")
                                            switchMode("In body", true, true);
                                        else if (token[1] == "col") {
                                            var newNode = insertHTMLElement(token);
                                            stackOpen.pop();
                                            acknowledgeSelfClose(token);
                                        }
                                        else if (token[1] == "template")
                                            switchMode("In head", true, true);
                                        else
                                            flag = true;
                                        break;
                                    case "EndTag":
                                        if (token[1] = "colgroup") {
                                            if (currentNode().type != "colgroup")
                                                emit("ParseError");
                                            else {
                                                stackOpen.pop();
                                                switchMode("In table");
                                            }
                                        }
                                        else if (token[1] == "col")
                                            emit("ParseError");
                                        else if (token[1] == "template")
                                            switchMode("In head", true, true);
                                        else
                                            flag = true;
                                        break;
                                    case "End-of-file":
                                        switchMode("In body", true, true);
                                        break;
                                    default:
                                        flag = true;
                                        break;
                                }
                                if (flag) {
                                    if (currentNode().type != "colgroup")
                                        emit("ParseError");
                                    else {
                                        stackOpen.pop();
                                        switchMode("In table", true);
                                    }
                                }
                                break;
                            case 'In table body': //12.2.5.4.13 The "in table body" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.13)";
                                var flag = false;
                                switch (token[0]) {
                                    case "StartTag":
                                        if (token[1] == "tr") {
                                            clearTableBody();
                                            var newNode = insertHTMLElement(token);
                                            switchMode("In row");
                                        }
                                        else if (token[1] == "th" || token[1] == "td") {
                                            emit("ParseError");
                                            clearTableBody();
                                            var newNode = insertHTMLElement(["StartTag", "tr", {}]);
                                            switchMode("In row", true);
                                        }
                                        else if (["caption", "col", "colgroup", "tbody", "tfoot", "thead"].indexOf(token[1]) != -1)
                                            flag = true;
                                        else
                                            switchMode("In table", true, true);
                                        break;
                                    case "EndTag":
                                        if (["tbody", "tfoot", "thead"].indexOf(token[1]) != -1) {
                                            if (!hasTableScope(token[1]))
                                                emit("ParseError");
                                            else {
                                                clearTableBody();
                                                stackOpen.pop();
                                                switchMode("In table");
                                            }
                                        }
                                        else if (token[1] == "table")
                                            flag = true;
                                        else if (["body", "caption", "col", "colgroup", "html", "td", "th", "tr"].indexOf(token[1]) != -1)
                                            emit("ParseError");
                                        else
                                            switchMode("In table", true, true);
                                        break;
                                    default:
                                        switchMode("In table", true, true);
                                        break;
                                }
                                if (flag) {
                                    if (!hasTableScope("tbody") || !hasTableScope("thead") || !hasTableScope("tfoot"))
                                        emit("ParseError");
                                    else {
                                        clearTableBody();
                                        stackOpen.pop();
                                        switchMode("In table", true);
                                    }
                                }
                                break;
                            case 'In row': //12.2.5.4.14 The "in row" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.14)";
                                switch (token[0]) {
                                    case "StartTag":
                                        if (token[1] == "th" || token[1] == "td") {
                                            clearTableRow();
                                            var newNode = insertHTMLElement(token);
                                            switchMode("In cell");
                                            insertMarker();
                                        }
                                        else if (["caption", "col", "colgroup", "tbody", "tfoot", "thead", "tr"].indexOf(token[1]) != -1)
                                            flag = true;
                                        else
                                            switchMode("In table", true, true);
                                    case "EndTag":
                                        if (token[1] == "tr") {
                                            if (!hasTableScope(token[1]))
                                                emit("ParseError");
                                            else {
                                                clearTableRow();
                                                stackOpen.pop();
                                                switchMode("In table body");
                                            }
                                        }
                                        else if (token[1] == "table")
                                            flag = true;
                                        else if (["tbody", "tfoot", "thead"].indexOf(token[1]) != -1) {
                                            if (!hasTableScope(token[1]))
                                                emit("ParseError");
                                            else if (hasTableScope("tr")) {
                                                clearTableRow();
                                                stackOpen.pop();
                                                switchMode("In table body", true);
                                            }
                                        }
                                        else if (["body", "caption", "col", "colgroup", "html", "td", "th", "tr"].indexOf(token[1]) != -1)
                                            emit("ParseError");
                                        else
                                            switchMode("In table", true, true)
                                        break;
                                    default:
                                        switchMode("In table", true, true);
                                        break;
                                }
                                if (flag) {
                                    if (!hasTableScope("tr"))
                                        emit("ParseError");
                                    else {
                                        clearTableRow();
                                        stackOpen.pop();
                                        switchMode("In table body", true);
                                    }
                                }
                                break;
                            case 'In cell': //12.2.5.4.15 The "in cell" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.15)";
                                switch (token[0]) {
                                    case "StartTag":
                                        if (["caption", "col", "colgroup", "tbody", "td", "tfoot", "th", "thead", "tr"].indexOf(token[1]) != -1) {
                                            if (!hasTableScope("td") || !hasTableScope("th"))
                                                emit("ParseError");
                                            else
                                                closeCell(true);
                                        }
                                        else
                                            switchMode("In body", true, true);
                                        break;
                                    case "EndTag":
                                        if (token[1] == "td" || token[1] == "th") {
                                            if (!hasTableScope(token[1]))
                                                emit("ParseError");
                                            else {
                                                generateImpliedEndTags();
                                                if (currentNode().type != token[1])
                                                    emit("ParseError");
                                                while (true) {
                                                    var popEl = stackOpen.pop();
                                                    if (popEl.type == token[1])
                                                        break;
                                                }
                                                clearActiveFormat();
                                                switchMode("In row");
                                            }
                                        }
                                        else if (["body", "caption", "col", "colgroup", "html"].indexOf(token[1]) != -1)
                                            emit("ParseError");
                                        else if (["table", "tbody", "tfoot", "thead", "tr"].indexOf(token[1]) != -1) {
                                            if (!hasTableScope(token[1]))
                                                emit("ParseError");
                                            else
                                                closeCell(true);
                                        }
                                        else
                                            switchMode("In body", true, true);
                                        break;
                                    default:
                                        switchMode("In body", true, true);
                                        break;
                                }
                                break;
                            case 'In select': //12.2.5.4.16 The "in select" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.16)";
                                var flag = false;
                                switch (token[0]) {
                                    case "DOCTYPE":
                                        emit("ParseError");
                                        break;
                                    case "Comment":
                                        insertComment();
                                        break;
                                    case "Character":
                                        if (token[1] == "\u0000")
                                            emit("ParseError");
                                        else
                                            insertCharacter(token[1]);
                                        break;
                                    case "StartTag":
                                        if (token[1] == "html")
                                            switchMode("In body", true, true);
                                        else if (token[1] == "option") {
                                            if (currentNode().type == "option")
                                                stackOpen.pop();
                                            var newNode = insertHTMLElement(token);
                                        }
                                        else if (token[1] == "optgroup") {
                                            if (currentNode().type == "option")
                                                stackOpen.pop();
                                            if (currentNode().type == "optgroup")
                                                stackOpen.pop();
                                            var newNode = insertHTMLElement(token);
                                        }
                                        else if (token[1] == "select") {
                                            emit("ParseError");
                                            if (hasSelectScope("select")) {
                                                while (true) {
                                                    var popEl = stackOpen.pop();
                                                    if (popEl.type == "select")
                                                        break;
                                                }
                                                resetModeProperly();
                                            }
                                        }
                                        else if (["input", "keygen", "textarea"].indexOf(token[1]) != -1) {
                                            emit("ParseError");
                                            if (hasSelectScope("select")) {
                                                while (true) {
                                                    var popEl = stackOpen.pop();
                                                    if (popEl.type == "select")
                                                        break;
                                                }
                                                resetModeProperly(true);
                                            }
                                        }
                                        else if (token[1] == "script" || token[1] == "template")
                                            switchMode("In head", true, true);
                                        else
                                            emit("ParseError");
                                        break;
                                    case "EndTag":
                                        if (token[1] == "optgroup") {
                                            if (currentNode().type == "option" && stackOpen[stackOpen.length - 2].type == "optgroup")
                                                stackOpen.pop();
                                            if (currentNode().type == "optgroup")
                                                stackOpen.pop();
                                            else
                                                emit("ParseError");
                                        }
                                        else if (token[1] == "option") {
                                            if (currentNode().type == "option")
                                                stackOpen.pop();
                                            else
                                                emit("ParseError");
                                        }
                                        else if (token[1] == "select") {
                                            if (!hasSelectScope("select"))
                                                emit("ParseError");
                                            else {
                                                while (true) {
                                                    var popEl = stackOpen.pop();
                                                    if (popEl.type == "select")
                                                        break;
                                                }
                                                resetModeProperly();
                                            }
                                        }
                                        else if (token[1] == "template")
                                            switchMode("In head", true, true);
                                        else
                                            emit("ParseError");
                                        break;
                                    case "End-of-file":
                                        switchMode("In body", true, true);
                                        break;
                                    default:
                                        emit("ParseError");
                                        break;
                                }
                                break;
                            case 'In select in table': //12.2.5.4.17 The "in select in table" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.17)";
                                switch (token[0]) {
                                    case "StartTag":
                                        if (["caption", "table", "tbody", "tfoot", "thead", "tr", "td", "th"].indexOf(token[1]) != -1) {
                                            emit("ParseError");
                                            while (true) {
                                                var popEl = stackOpen.pop();
                                                if (popEl.type == "select")
                                                    break;
                                            }
                                            resetModeProperly(true);
                                        }
                                        else
                                            switchMode("In select", true, true);
                                        break;
                                    case "EndTag":
                                        if (["caption", "table", "tbody", "tfoot", "thead", "tr", "td", "th"].indexOf(token[1]) != -1) {
                                            emit("ParseError");
                                            if (hasTableScope(token[1])) {
                                                while (true) {
                                                    var popEl = stackOpen.pop();
                                                    if (popEl.type == "select")
                                                        break;
                                                }
                                                resetModeProperly(true);
                                            }
                                        }
                                        else
                                            switchMode("In select", true, true);
                                        break;
                                    default:
                                        switchMode("In select", true, true);
                                        break;
                                }
                                break;
                            case 'In template': //12.2.5.4.18 The "in template" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.18)";
                                switch (token[0]) {
                                    case "DOCTYPE":
                                    case "Comment":
                                    case "Character":
                                        switchMode("In body", true, true);
                                        break;
                                    case "StartTag":
                                        if (["base", "basefont", "bgsound", "link", "meta", "noframes", "script", "style", "template", "title"].indexOf(token[1]) != -1)
                                            switchMode("In head", true, true);
                                        else if (["caption", "colgroup", "tbody", "tfoot", "thead"].indexOf(token[1]) != -1) {
                                            stackTemplate.pop();
                                            stackTemplate.push("In table");
                                            switchMode("In table", true);
                                        }
                                        else if (token[1] == "col") {
                                            stackTemplate.pop();
                                            stackTemplate.push("In column group");
                                            switchMode("In column group", true);
                                        }
                                        else if (token[1] == "tr") {
                                            stackTemplate.pop();
                                            stackTemplate.push("In table body");
                                            switchMode("In table body", true);
                                        }
                                        else if (token[1] == "td" || token[1] == "th") {
                                            stackTemplate.pop();
                                            stackTemplate.push("In row");
                                            switchMode("In row", true);
                                        }
                                        else {
                                            stackTemplate.pop();
                                            stackTemplate.push("In body");
                                            switchMode("In body", true);
                                        }
                                        break;
                                    case "EndTag":
                                        if (token[1] == "template")
                                            switchMode("In head", true, true);
                                        else
                                            emit("ParseError");
                                        break;
                                    case "End-of-file":
                                        var flag = false;
                                        for (var i in stackOpen)
                                            if (stackOpen[i].type == "template") {
                                                flag = true;
                                                break;
                                            }
                                        if (!flag)
                                            stopParsing();
                                        else {
                                            emit("ParseError");
                                            while (true) {
                                                var popEl = stackOpen.pop();
                                                if (popEl.type == "template")
                                                    break;
                                            }
                                            clearActiveFormat();
                                            stackTemplate.pop();
                                            resetModeProperly(true);
                                        }
                                }
                                break;
                            case 'After body': //12.2.5.4.19 The "after body" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.19)";
                                switch (token[0]) {
                                    case "DOCTYPE":
                                        emit("ParseError");
                                    case "Comment":
                                        insertComment({target: stackOpen[0], mode: "last"});
                                        break;
                                    case "Character":
                                        if (["\u0009", "\u000A", "\u000C", "\u000D", "\u0020"].indexOf(token[1]) != -1)
                                            switchMode("In body", true, true);
                                        else {
                                            emit("ParseError");
                                            switchMode("In body", true);
                                        }
                                        break;
                                    case "StartTag":
                                        if (token[1] == "html")
                                            switchMode("In body", true, true);
                                        else {
                                            emit("ParseError");
                                            switchMode("In body", true);
                                        }
                                        break;
                                    case "EndTag":
                                        if (token[1] == "html") {
                                            if (fragmentParse)
                                                emit("ParseError");
                                            else
                                                switchMode("After after body");
                                        }
                                        else {
                                            emit("ParseError");
                                            switchMode("In body", true);
                                        }
                                        break;
                                    case "End-of-file":
                                        stopParsing();
                                        break;
                                    default:
                                        emit("ParseError");
                                        switchMode("In body", true);
                                        break;
                                }
                                break;
                            case 'In frameset': //12.2.5.4.20 The "in frameset" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.20)";
                                switch (token[0]) {
                                    case "DOCTYPE":
                                        emit("ParseError");
                                        break;
                                    case "Comment":
                                        insertComment();
                                        break;
                                    case "Character":
                                        if (["\u0009", "\u000A", "\u000C", "\u000D", "\u0020"].indexOf(token[1]) != -1)
                                            insertCharacter(token[1]);
                                        else
                                            emit("ParseError");
                                        break;
                                    case "StartTag":
                                        if (token[1] == "html")
                                            switchMode("In body", true, true);
                                        else if (token[1] == "frameset")
                                            var newNode = insertHTMLElement(token);
                                        else if (token[1] == "frame") {
                                            var newNode = insertHTMLElement(token);
                                            stackOpen.pop();
                                            acknowledgeSelfClose(token);
                                        }
                                        else if (token[1] == "noframes")
                                            switchMode("In head", true, true);
                                        else
                                            emit("ParseError");
                                        break;
                                    case "EndTag":
                                        if (token[1] == "frameset") {
                                            if (currentNode() == stackOpen[0])
                                                emit("ParseError");
                                            else {
                                                stackOpen.pop();
                                                if (!fragmentParse && currentNode().type != "frameset")
                                                    switchMode("After frameset");
                                            }
                                        }
                                        else
                                            emit("ParseError");
                                        break;
                                    case "End-of-file":
                                        if (currentNode() != stackOpen[0])
                                            emit("ParseError");

                                    default:
                                        emit("ParseError");
                                        break;
                                }
                                break;
                            case 'After frameset': //12.2.5.4.21 The "after frameset" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.21)";
                                switch (token[0]) {
                                    case "DOCTYPE":
                                        emit("ParseError");
                                        break;
                                    case "Comment":
                                        insertComment();
                                        break;
                                    case "Character":
                                        if (["\u0009", "\u000A", "\u000C", "\u000D", "\u0020"].indexOf(token[1]) != -1)
                                            insertCharacter(token[1]);
                                        break;
                                    case "StartTag":
                                        if (token[1] == "html")
                                            switchMode("In body", true, true);
                                        else if (token[1] == "noframes")
                                            switchMode("In head", true, true);
                                        break;
                                    case "EndTag":
                                        if (token[1] == "html")
                                            switchMode("After after frameset");
                                        break;
                                    case "End-of-file":
                                        stopParsing();
                                        break;
                                    default:
                                        emit("ParseError");
                                        break;
                                }
                                break;
                            case 'After after body': //12.2.5.4.22 The "after after body" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.22)";
                                switch (token[0]) {
                                    case "DOCTYPE":
                                        switchMode("In body", true, true);
                                        break;
                                    case "Comment":
                                        insertComment({target: document, mode: "last"});
                                        break;
                                    case "Character":
                                        if (["\u0009", "\u000A", "\u000C", "\u000D", "\u0020"].indexOf(token[1]) != -1)
                                            switchMode("In body", true, true);
                                        else {
                                            emit("ParseError");
                                            switchMode("In body", true);
                                        }
                                        break;
                                    case "StartTag":
                                        if (token[1] == "html")
                                            switchMode("In body", true, true);
                                        else {
                                            emit("ParseError");
                                            switchMode("In body", true);
                                        }
                                        break;
                                    case "End-of-file":
                                        stopParsing();
                                        break
                                    default:
                                        emit("ParseError");
                                        switchMode("In body", true);
                                        break;
                                }
                                break;
                            case 'After after frameset': //12.2.5.4.23 The "after after frameset" insertion mode
                                logall[logall.length - 1] += " (12.2.5.4.23)";
                                switch (token[0]) {
                                    case "DOCTYPE":
                                        switchMode("In body", true, true);
                                        break;
                                    case "Comment":
                                        insertComment({target: document, mode: "last"});
                                        break;
                                    case "Character":
                                        if (["\u0009", "\u000A", "\u000C", "\u000D", "\u0020"].indexOf(token[1]) != -1)
                                            switchMode("In body", true, true);
                                        else
                                            emit("ParseError");
                                        break;
                                    case "StartTag":
                                        if (token[1] == "html")
                                            switchMode("In body", true, true);
                                        else if (token[1] == "noframes")
                                            switchMode("In head", true, true);
                                        else
                                            emit("ParseError");
                                        break;
                                    case "End-of-file":
                                        stopParsing();
                                        break
                                    default:
                                        emit("ParseError");
                                        break;
                                }
                                break;
                            default:
                                emit("Comment", "Mode not found!");
                                switchMode();
                                break;
                        }
                        if (returnMode != null && !reProcess) {
                            if (mode[mode.length - 1] != "Text" && mode[mode.length - 1] != "In table text") {
                                eval(callBack);
                                switchMode(returnMode);
                            }
                        }
                    }
                    logall.push("End function Tree Construction\n");
                };

                //12.2.5
                function treeConstructionDispatcher(token) {
                    //logall.push("\nCall function Tree Construction Dispatcher (12.2.5)");
                    reProcess = true;
                    adjustedNode = fragmentParse ? context : currentNode();
                    var resForeign = {reprocess: true};
                    while (resForeign.reprocess) {
                        resForeign.reprocess = false;
                        if (stackOpen.length == 0 || isHTMLNamespace(adjustedNode) || (isMathMLIntegration(adjustedNode) && ((token[0] == "StartTag" && token[1] != "mglyph" && token[1] != "malignmark") || (token[0] == "Character"))) || (isMathMLAnnotation(adjustedNode) && token[0] == "StartTag" && token[1] == "svg") || (isHTMLIntegration(adjustedNode, token) && (token[0] == "StartTag" || token[0] == "Character")) || token == "End-of-file")
                            treeConstruction(token);
                        else
                            resForeign = parsingForeignContent(token);
                    }
                    //logall.push("End function Tree Construction Dispatcher (12.2.5)\n");
                }

                //Handling emitation of function Tokenization
                function emit(type, value) {
                    var emits;
                    if (type == "End-of-file" || type == "ParseError") {
                        emits = type;
                        logall.push("STATE: " + state[state.length - 1] + " | CURRENT: " + stream[currentInput]);
                    }
                    else if (type == "StartTag" || type == "EndTag") {
                        var emitAttr = {};
                        for (var i in value.attribute) {
                            if (emitAttr[value.attribute[i].name] != null)
                                emit("ParseError");
                            else
                                emitAttr[value.attribute[i].name] = value.attribute[i].value;
                        }
                        var ns;
                        if (value.name.indexOf(":") == -1)
                            ns = nsEl["html"];
                        else {
                            var pos = value.name.lastIndexOf(":");
                            ns = value.name.substring(0, pos)
                            value.name = value.name.substring(pos + 1);
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
                        emits = [type, value.name, emitAttr, value.flag ? true : null, ns];
                        if (type == "EndTag" && (value.flag || Object.keys(emitAttr).length > 0))
                            emit("ParseError");
                    }
                    else if (type == "DOCTYPE")
                        emits = [type, value.name, value.publicId, value.systemId, value.flag == "on"];
                    else emits = [type, value];
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

                //12.2.4 Tokenization
                var tokenization = function (stream) {
                    var tokenTag = [];
                    var tokenStart = [];
                    var tokenEnd = [];
                    var tokenComment = [];
                    var tokenDOCTYPE = [];
                    var tempBuffer = null;
                    var addChar = null;
                    var refReturn = "";

                    function tokenTags(type, name) {
                        this.type = type;
                        this.name = name;
                        this.flag = false;
                        this.attribute = [];
                    }

                    tokenTags.prototype.newAttr = function (name) {
                        this.attribute.push({name: name == null ? "" : name, value: ""});
                    }

                    function tokenDOCTYPEs(name, flag) {
                        this.name = name;
                        this.publicId = null;
                        this.systemId = null;
                        this.flag = (flag == null ? "off" : flag);
                    }

//12.2.4.69 Tokenizing character references
                    var characterReference = function (addChar) {
                        logall.push("\nCall function Character Reference (12.2.4.69)");
                        var hex;
                        var consume = "";
                        var charList = [[0x00, "\uFFFD"], [0x80, "\u20AC"], [0x82, "\u201A"], [0x83, "\u0192"], [0x84, "\u201E"], [0x85, "\u2026"], [0x86, "\u2020"], [0x87, "\u2021"], [0x88, "\u02C6"], [0x89, "\u2030"], [0x8A, "\u0160"], [0x8B, "\u2039"], [0x8C, "\u0152"], [0x8E, "\u017D"], [0x91, "\u2018"], [0x92, "\u2019"], [0x93, "\u201C"], [0x94, "\u201D"], [0x95, "\u2022"], [0x96, "\u2013"], [0x97, "\u2014"], [0x98, "\u02DC"], [0x99, "\u2122"], [0x9A, "\u0161"], [0x9B, "\u203A"], [0x9C, "\u0153"], [0x9E, "\u017E"], [0x9F, "\u0178"]];
                        switch (stream[nextInput]) {
                            case "\u0009": //Character tabulation (Tab)
                            case "\u000A": //Line feed (LF)
                            case "\u000C": //Form feed (FF)
                            case "\u0020": //Space ( )
                            case "\u003C": //Less-than sign (<)
                            case "\u0026": //Ampersand (&)
                            case addChar:
                                break;
                            case "\u0023": //Number sign (#)
                                consumeNext(false);
                                switch (stream[nextInput]) {
                                    case "\u0078": //Latin small letter x
                                    case "\u0058": //Latin capital letter X
                                        consumeNext(false);
                                        hex = true;
                                        break;
                                    default:
                                        hex = false;
                                        break;
                                }
                                var till = true;
                                while (till) {
                                    till = false;
                                    if (hex) {
                                        if (/[0-9a-fA-F]/.test(stream[nextInput]) && stream[nextInput] != undefined) {
                                            consumeNext(false);
                                            consume += stream[currentInput];
                                            till = true;
                                        }
                                    }
                                    else {
                                        if ((/[0-9]/.test(stream[nextInput]))) {
                                            consumeNext(false);
                                            consume += stream[currentInput];
                                            till = true;
                                        }
                                    }
                                }
                                if (consume == "") {
                                    if (hex)
                                        reconsumeCurrent();
                                    reconsumeCurrent();
                                    emit("ParseError");
                                }
                                else {
                                    if (stream[nextInput] == "\u003B") //Semicolon
                                        consumeNext(false);
                                    else
                                        emit("ParseError");

                                    //Make decimal as common ground (hex -> decimal)
                                    if (hex)
                                        consume = parseInt(consume, 16);

                                    for (var i in charList)
                                        if (consume == charList[i][0]) {
                                            emit("ParseError");
                                            return charList[i][1];
                                        }
                                    if ((0xD800 <= consume && consume <= 0xDFFF) || 0x10FFFF < consume) {
                                        emit("ParseError");
                                        return "\uFFFD";
                                    }
                                    else {
                                        var btwn = function (start, end) {
                                            return start <= consume && consume <= end;
                                        };
                                        var charEq = [0x000B, 0xFFFE, 0xFFFF, 0x1FFFE, 0x1FFFF, 0x2FFFE, 0x2FFFF, 0x3FFFE, 0x3FFFF, 0x4FFFE, 0x4FFFF, 0x5FFFE, 0x5FFFF, 0x6FFFE, 0x6FFFF, 0x7FFFE, 0x7FFFF, 0x8FFFE, 0x8FFFF, 0x9FFFE, 0x9FFFF, 0xAFFFE, 0xAFFFF, 0xBFFFE, 0xBFFFF, 0xCFFFE, 0xCFFFF, 0xDFFFE, 0xDFFFF, 0xEFFFE, 0xEFFFF, 0xFFFFE, 0xFFFFF, 0x10FFFE, 0x10FFFF];
                                        if (btwn(0x0001, 0x0008) || btwn(0x000D, 0x001F) || btwn(0x007F, 0x009F) || btwn(0xFDD0, 0xFDEF) || charEq.indexOf(consume) != -1)
                                            emit("ParseError");
                                        return String.fromCharCode(consume);
                                    }
                                }
                                break;
                            default:
                                if (currentInput >= stream.length) ;
                                else {
                                    var refSpec = require('./entities.json');
                                    var ln = 0;
                                    for (var key in refSpec)
                                        if (key.length > ln)
                                            ln = key.length;
                                    var currentInputOri = currentInput;
                                    var match = null;
                                    var nextMatch = null;
                                    consume = "&";
                                    for (var i = 0; i < ln; i++) {
                                        consumeNext(true);
                                        if (currentInput >= stream.length)
                                            break;
                                        consume += stream[currentInput];
                                        if (refSpec[consume] != null) {
                                            match = consume;
                                            nextMatch = nextInput;
                                        }
                                    }
                                    if (match == null) {
                                        currentInput = currentInputOri;
                                        nextInput = currentInput + 1;
                                        var currentInputTmp = nextInput;
                                        while (/[0-9a-zA-Z]/.test(stream[currentInputTmp]) && currentInputTmp < stream.length) {
                                            currentInputTmp++;
                                        }
                                        if (stream[currentInputTmp] == "\u003B")
                                            emit("ParseError");
                                    }
                                    else {

                                        if (addChar != null && match.slice(-1) != "\u003B" && (stream[nextMatch] == "\u003D" || /[0-9a-zA-Z]/.test(stream[nextMatch]))) {
                                            currentInput = currentInputOri;
                                            nextInput = currentInput + 1;
                                            if (stream[nextMatch] == "\u003D")
                                                emit("ParseError");
                                        }
                                        else {
                                            currentInput = currentInputOri + match.length - 1;
                                            nextInput = currentInput + 1;
                                            if (match.slice(-1) != "\u003B")
                                                emit("ParseError");
                                            return refSpec[match]["characters"];
                                        }
                                    }
                                }
                                break;

                        }
                    };

//Handling emitation of tag token
                    var emitTag = function (tag) {
                        emit(tag.type, tag);
                        if (tag.type == "StartTag")
                            tokenStart.push(tag);
                        else
                            tokenEnd.push(tag);
                    };

                    logall.push("\nCall function Tokenization (12.2.4)");

                    while (state[state.length - 1] !== null) {
                        logall.push("> Switch to " + state[state.length - 1]);
                        switch (state[state.length - 1]) {
                            case 'Data state': //12.2.4.1 Data state
                                logall[logall.length - 1] += " (12.2.4.1)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0026": //Ampersand (&)
                                        state.push("Character reference in data state");
                                        break;
                                    case "\u003C": //Less-than sign (<)
                                        state.push("Tag open state");
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        emit("Character", stream[currentInput]);
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("End-of-file", null);
                                            state.push(null);
                                        }
                                        else
                                            emit("Character", stream[currentInput]);
                                        break;
                                }
                                break;
                            case 'Character reference in data state': //12.2.4.2 Character reference in data state
                                logall[logall.length - 1] += " (12.2.4.2)";
                                state.push("Data state");
                                var tokenRef = characterReference(null);
                                if (tokenRef == null)
                                    emit("Character", "\u0026");
                                else
                                    emit("Character", tokenRef);
                                break;
                            case 'RCDATA state': //12.2.4.3 RCDATA state
                                logall[logall.length - 1] += " (12.2.4.3)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0026": //Ampersand (&)
                                        state.push("Character reference in RCDATA state");
                                        break;
                                    case "\u003C": //Less-than sign (<)
                                        state.push("RCDATA less-than sign state");
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        emit("Character", "\uFFFD");
                                        break;
                                    default:
                                        if (currentInput >= stream.length)
                                            emit("End-of-file", null);
                                        else
                                            emit("Character", stream[currentInput]);
                                        break;
                                }
                                break;
                            case 'Character reference in RCDATA state': //12.2.4.4 Character reference in RCDATA state
                                logall[logall.length - 1] += " (12.2.4.4)";
                                state.push("RCDATA state");
                                var tokenRef = characterReference(null);
                                if (tokenRef == null)
                                    emit("Character", "\u0026");
                                else
                                    emit("Character", tokenRef);
                                break;
                            case 'RAWTEXT state': //12.2.4.5 RAWTEXT state
                                logall[logall.length - 1] += " (12.2.4.5)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u003C": //Less-than sign (<)
                                        state.push("RAWTEXT less-than sign state");
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        emit("Character", "\uFFFD");
                                        break;
                                    default:
                                        if (currentInput >= stream.length)
                                            emit("End-of-file", null);
                                        else
                                            emit("Character", stream[currentInput]);
                                        break;
                                }
                                break;
                            case 'Script data state': //12.2.4.6 Script data state
                                logall[logall.length - 1] += " (12.2.4.6)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u003C": //Less-than sign (<)
                                        state.push("Script data less-than sign state");
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        emit("Character", "\uFFFD");
                                        break;
                                    default:
                                        if (currentInput >= stream.length)
                                            emit("End-of-file", null);
                                        else
                                            emit("Character", stream[currentInput]);
                                        break;
                                }
                                break;
                            case 'PLAINTEXT state': //12.2.4.7 PLAINTEXT state
                                logall[logall.length - 1] += " (12.2.4.7)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        emit("Character", "\uFFFD");
                                        break;
                                    default:
                                        if (currentInput >= stream.length)
                                            emit("End-of-file", null);
                                        else
                                            emit("Character", stream[currentInput]);
                                        break;
                                }
                                break;
                            case 'Tag open state': //12.2.4.8 Tag open state
                                logall[logall.length - 1] += " (12.2.4.8)";
                                consumeNext(false);
                                switch (stream[currentInput]) {
                                    case "\u0021": //Exclamation mark (!)
                                        state.push("Markup declaration open state");
                                        break;
                                    case "\u002F": //Solidus (/)
                                        state.push("End tag open state");
                                        break;
                                    case "\u003F": //Question mark (!)
                                        emit("ParseError");
                                        state.push("Bogus comment state");
                                        break;
                                    default:
                                        if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z') {
                                            tokenTag.push(new tokenTags("StartTag", stream[currentInput].toLowerCase()));
                                            state.push("Tag name state");
                                        }
                                        else if ('a' <= stream[currentInput] && stream[currentInput] <= 'z') {
                                            tokenTag.push(new tokenTags("StartTag", stream[currentInput]));
                                            state.push("Tag name state");
                                        }
                                        else {
                                            emit("ParseError");
                                            emit("Character", "\u003C");
                                            state.push("Data state");
                                            reconsumeCurrent();
                                        }
                                        break;
                                }
                                break;
                            case 'End tag open state': //12.2.4.9 End tag open state
                                logall[logall.length - 1] += " (12.2.4.9)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u003E": //Greater-than sign (>)
                                        emit("ParseError");
                                        state.push("Data state");
                                        break;
                                    default:
                                        if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z') {
                                            tokenTag.push(new tokenTags("EndTag", stream[currentInput].toLowerCase()));
                                            state.push("Tag name state");
                                        }
                                        else if ('a' <= stream[currentInput] && stream[currentInput] <= 'z') {
                                            tokenTag.push(new tokenTags("EndTag", stream[currentInput]));
                                            state.push("Tag name state");
                                        }
                                        else if (currentInput >= stream.length) {
                                            state.push("Data state");
                                            emit("ParseError");
                                            emit("Character", "\u003C");
                                            emit("Character", "\u002F");
                                            reconsumeCurrent();
                                        }
                                        else {
                                            emit("ParseError");
                                            state.push("Bogus comment state");
                                        }
                                        break;
                                }
                                break;
                            case 'Tag name state': //12.2.4.10 Tag name state
                                logall[logall.length - 1] += " (12.2.4.10)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        state.push("Before attribute name state");
                                        break;
                                    case "\u002F": //Solidus (/)
                                        state.push("Self-closing start tag state");
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        state.push("Data state");
                                        emitTag(tokenTag[tokenTag.length - 1]);
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        emit("Character", "\uFFFD");
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            reconsumeCurrent();
                                        }
                                        else if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z')
                                            tokenTag[tokenTag.length - 1].name += stream[currentInput].toLowerCase();

                                        else
                                            tokenTag[tokenTag.length - 1].name += stream[currentInput];
                                        break;
                                }
                                break;
                            case 'RCDATA less-than sign state': //12.2.4.11 RCDATA less-than sign state
                                logall[logall.length - 1] += " (12.2.4.11)";
                                consumeNext(false);
                                switch (stream[currentInput]) {
                                    case "\u002F": //Solidus (/)
                                        tempBuffer = "";
                                        state.push("RCDATA end tag open state");
                                        break;
                                    default:
                                        state.push("RCDATA state");
                                        emit("Character", "\u003C");
                                        reconsumeCurrent();
                                        break;
                                }
                                break;
                            case 'RCDATA end tag open state': //12.2.4.12 RCDATA end tag open state
                                logall[logall.length - 1] += " (12.2.4.12)";
                                consumeNext(false);
                                if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z') {
                                    tokenTag.push(new tokenTags("EndTag", stream[currentInput].toLowerCase()));
                                    tempBuffer += stream[currentInput].toLowerCase();
                                    state.push("RCDATA end tag name state");
                                }
                                else if ('a' <= stream[currentInput] && stream[currentInput] <= 'z') {
                                    tokenTag.push(new tokenTags("EndTag", stream[currentInput]));
                                    tempBuffer += stream[currentInput];
                                    state.push("RCDATA end tag name state");
                                }
                                else {
                                    state.push("RCDATA state");
                                    emit("ParseError");
                                    emit("Character", "\u003C");
                                    emit("Character", "\u002F");
                                    reconsumeCurrent();
                                }
                                break;
                            case 'RCDATA end tag name state': //12.2.4.13 RCDATA end tag name state
                                logall[logall.length - 1] += " (12.2.4.13)";
                                consumeNext(false);
                                var flagAny = false;
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        if (tokenTag[tokenTag.length - 1].name == tokenStart[tokenStart.length - 1].name)
                                            state.push("Before attribute name state");
                                        else
                                            flagAny = true;
                                        break;
                                    case "\u002F": //Solidus (/)
                                        if (tokenTag[tokenTag.length - 1].name == tokenStart[tokenStart.length - 1].name)
                                            state.push("Self-closing start tag state");
                                        else
                                            flagAny = true;
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        if (tokenTag[tokenTag.length - 1].name == tokenStart[tokenStart.length - 1].name) {
                                            state.push("Data state");
                                            emitTag(tokenTag[tokenTag.length - 1]);
                                        }
                                        else
                                            flagAny = true;
                                        break;
                                    default:
                                        if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z') {
                                            tokenTag[tokenTag.length - 1].name += stream[currentInput].toLowerCase();
                                            tempBuffer += stream[currentInput].toLowerCase();
                                        }
                                        else if ('a' <= stream[currentInput] && stream[currentInput] <= 'z') {
                                            tokenTag[tokenTag.length - 1].name += stream[currentInput];
                                            tempBuffer += stream[currentInput];
                                        }
                                        else
                                            flagAny = true;
                                        break;
                                }
                                if (flagAny) {
                                    state.push("RCDATA state");
                                    emit("Character", "\u003C");
                                    emit("Character", "\u002F");
                                    for (var i in tempBuffer)
                                        emit("Character", tempBuffer[i]);
                                    reconsumeCurrent();
                                }
                                break;
                            case 'RAWTEXT less-than sign state': //12.2.4.14 RAWTEXT less-than sign state
                                logall[logall.length - 1] += " (12.2.4.14)";
                                consumeNext(false);
                                if (stream[currentInput] == "\u002F") { //Solidus (/)
                                    tempBuffer = "";
                                    state.push("RAWTEXT end tag open state");
                                }
                                else {
                                    state.push("RAWTEXT state");
                                    emit("Character", "\u003C");
                                    reconsumeCurrent();
                                }
                                break;
                            case 'RAWTEXT end tag open state': //12.2.4.15 RAWTEXT end tag open state
                                logall[logall.length - 1] += " (12.2.4.15)";
                                consumeNext(false);
                                if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z') {
                                    tokenTag.push(new tokenTags("EndTag", stream[currentInput].toLowerCase()));
                                    tempBuffer += stream[currentInput].toLowerCase();
                                    state.push("RAWTEXT end tag name state");
                                }
                                else if ('a' <= stream[currentInput] && stream[currentInput] <= 'z') {
                                    tokenTag.push(new tokenTags("EndTag", stream[currentInput]));
                                    tempBuffer += stream[currentInput];
                                    state.push("RAWTEXT end tag name state");
                                }
                                else {
                                    state.push("RAWTEXT state");
                                    emit("ParseError");
                                    emit("Character", "\u003C");
                                    emit("Character", "\u002F");
                                    reconsumeCurrent();
                                }
                                break;
                            case 'RAWTEXT end tag name state': //12.2.4.16 RAWTEXT end tag name state
                                logall[logall.length - 1] += " (12.2.4.16)";
                                consumeNext(false);
                                var flagAny = false;
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        if (tokenTag[tokenTag.length - 1].name == tokenStart[tokenStart.length - 1].name)
                                            state.push("Before attribute name state");
                                        else
                                            flagAny = true;
                                        break;
                                    case "\u002F": //Solidus (/)
                                        if (tokenTag[tokenTag.length - 1].name == tokenStart[tokenStart.length - 1].name)
                                            state.push("Self-closing start tag state");
                                        else
                                            flagAny = true;
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        if (tokenTag[tokenTag.length - 1].name == tokenStart[tokenStart.length - 1].name) {
                                            state.push("Data state");
                                            emitTag(tokenTag[tokenTag.length - 1]);
                                        }
                                        else
                                            flagAny = true;
                                        break;
                                    default:
                                        if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z') {
                                            tokenTag[tokenTag.length - 1].name += stream[currentInput].toLowerCase();
                                            tempBuffer += stream[currentInput].toLowerCase();
                                        }
                                        else if ('a' <= stream[currentInput] && stream[currentInput] <= 'z') {
                                            tokenTag[tokenTag.length - 1].name += stream[currentInput];
                                            tempBuffer += stream[currentInput];
                                        }
                                        else
                                            flagAny = true;
                                        break;
                                }
                                if (flagAny) {
                                    state.push("RAWTEXT state");
                                    emit("Character", "\u003C");
                                    emit("Character", "\u002F");
                                    for (var i in tempBuffer)
                                        emit("Character", tempBuffer[i]);
                                    reconsumeCurrent();
                                }
                                break;
                            case 'Script data less-than sign state': //12.2.4.17 Script data less-than sign state
                                logall[logall.length - 1] += " (12.2.4.17)";
                                consumeNext(false);
                                switch (stream[currentInput]) {
                                    case "\u002F": //Solidus (/)
                                        tempBuffer = "";
                                        state.push("Script data end tag open state");
                                        break;
                                    case "\u0021": //Exclamation mark (!)
                                        state.push("Script data escape start state");
                                        emit("Character", "\u003C");
                                        emit("Character", "\u0021");
                                        break;
                                    default:
                                        state.push("Script data state");
                                        emit("Character", "\u003C");
                                        reconsumeCurrent();
                                        break;
                                }
                                break;
                            case 'Script data end tag open state': //12.2.4.18 Script data end tag open state
                                logall[logall.length - 1] += " (12.2.4.18)";
                                consumeNext(false);
                                if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z') {
                                    tokenTag.push(new tokenTags("EndTag", stream[currentInput].toLowerCase()));
                                    tempBuffer += stream[currentInput].toLowerCase();
                                    state.push("Script data end tag name state");
                                }
                                else if ('a' <= stream[currentInput] && stream[currentInput] <= 'z') {
                                    tokenTag.push(new tokenTags("EndTag", stream[currentInput]));
                                    tempBuffer += stream[currentInput];
                                    state.push("Script data end tag name state");
                                }
                                else {
                                    state.push("Script data state");
                                    emit("ParseError");
                                    emit("Character", "\u003C");
                                    emit("Character", "\u002F");
                                    reconsumeCurrent();
                                }
                                break;
                            case 'Script data end tag name state': //12.2.4.19 Script data end tag name state
                                logall[logall.length - 1] += " (12.2.4.19)";
                                consumeNext(false);
                                var flagAny = false;
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        if (tokenTag[tokenTag.length - 1].name == tokenStart[tokenStart.length - 1].name)
                                            state.push("Before attribute name state");
                                        else
                                            flagAny = true;
                                        break;
                                    case "\u002F": //Solidus (/)
                                        if (tokenTag[tokenTag.length - 1].name == tokenStart[tokenStart.length - 1].name)
                                            state.push("Self-closing start tag state");
                                        else
                                            flagAny = true;
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        if (tokenTag[tokenTag.length - 1].name == tokenStart[tokenStart.length - 1].name) {
                                            state.push("Data state");
                                            emitTag(tokenTag[tokenTag.length - 1]);
                                        }
                                        else
                                            flagAny = true;
                                        break;
                                    default:
                                        if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z') {
                                            tokenTag[tokenTag.length - 1].name += stream[currentInput].toLowerCase();
                                            tempBuffer += stream[currentInput].toLowerCase();
                                        }
                                        else if ('a' <= stream[currentInput] && stream[currentInput] <= 'z') {
                                            tokenTag[tokenTag.length - 1].name += stream[currentInput];
                                            tempBuffer += stream[currentInput];
                                        }
                                        else
                                            flagAny = true;
                                        break;
                                }
                                if (flagAny) {
                                    state.push("Script data state");
                                    emit("Character", "\u003C");
                                    emit("Character", "\u002F");
                                    for (var i in tempBuffer)
                                        emit("Character", tempBuffer[i]);
                                    reconsumeCurrent();
                                }
                                break;
                            case 'Script data escape start state': //12.2.4.20 Script data escape start state
                                logall[logall.length - 1] += " (12.2.4.20)";
                                consumeNext(false);
                                if (stream[currentInput] == "\u002D") { //Hypen-minus (-)
                                    state.push("Script data escape start dash state");
                                    emit("Character", "\u002D");
                                }
                                else {
                                    state.push("Script data state");
                                    reconsumeCurrent();
                                }
                                break;
                            case 'Script data escape start dash state': //12.2.4.21 Script data escape start dash state
                                logall[logall.length - 1] += " (12.2.4.21)";
                                consumeNext(false);
                                if (stream[currentInput] == "\u002D") { //Hypen-minus (-)
                                    state.push("Script data escaped dash dash state");
                                    emit("Character", "\u002D");
                                }
                                else {
                                    state.push("Script data state");
                                    reconsumeCurrent();
                                }
                                break;
                            case 'Script data escaped state': //12.2.4.22 Script data escaped state
                                logall[logall.length - 1] += " (12.2.4.22)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u002D": //Hyphen-minus (-)
                                        state.push("Script data escaped dash state");
                                        emit("Character", "\u002D");
                                        break;
                                    case "\u003C": //Less-than sign (<)
                                        state.push("Script data escaped less-than sign state");
                                        break;
                                    case "\u0000": //Less-than sign (<)
                                        emit("ParseError");
                                        emit("Character", "\uFFFD");
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            reconsumeCurrent();
                                        }
                                        else
                                            emit("Character", stream[currentInput]);
                                        break;
                                }
                                break;
                            case 'Script data escaped dash state': //12.2.4.23 Script data escaped dash state
                                logall[logall.length - 1] += " (12.2.4.23)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u002D": //Hyphen-minus (-)
                                        state.push("Script data escaped dash dash state");
                                        emit("Character", "\u002D");
                                        break;
                                    case "\u003C": //Less-than sign (<)
                                        state.push("Script data escaped less-than sign state");
                                        break;
                                    case "\u0000": //Less-than sign (<)
                                        state.push("Script data escaped state");
                                        emit("ParseError");
                                        emit("Character", "\uFFFD");
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            reconsumeCurrent();
                                        }
                                        else {
                                            state.push("Script data escaped state");
                                            emit("Character", stream[currentInput]);
                                        }
                                        break;
                                }
                                break;
                            case 'Script data escaped dash dash state': //12.2.4.24 Script data escaped dash dash state
                                logall[logall.length - 1] += " (12.2.4.24)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u002D": //Hyphen-minus (-)
                                        emit("Character", "\u002D");
                                        break;
                                    case "\u003C": //Less-than sign (<)
                                        state.push("Script data escaped less-than sign state");
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        state.push("Script data state");
                                        emit("Character", "\u003E");
                                        break;
                                    case "\u0000": //Less-than sign (<)
                                        state.push("Script data escaped state");
                                        emit("ParseError");
                                        emit("Character", "\uFFFD");
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            reconsumeCurrent();
                                        }
                                        else {
                                            state.push("Script data escaped state");
                                            emit("Character", stream[currentInput]);
                                        }
                                        break;
                                }
                                break;
                            case 'Script data escaped less-than sign state': //12.2.4.25 Script data escaped less-than sign state
                                logall[logall.length - 1] += " (12.2.4.25)";
                                consumeNext(false);
                                if (stream[currentInput] == "\u002F") { //Solidus (/)
                                    tempBuffer = "";
                                    state.push("Script data escaped end tag open state");
                                }
                                else if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z') {
                                    tempBuffer = "";
                                    tempBuffer += stream[currentInput].toLowerCase();
                                    state.push("Script data double escape start state");
                                    emit("Character", "\u003C");
                                    emit("Character", stream[currentInput]);
                                }
                                else if ('a' <= stream[currentInput] && stream[currentInput] <= 'z') {
                                    tempBuffer = "";
                                    tempBuffer += stream[currentInput];
                                    state.push("Script data double escape start state");
                                    emit("Character", "\u003C");
                                    emit("Character", stream[currentInput]);
                                }
                                else {
                                    state.push("script data escaped state");
                                    emit("Character", "\u003C");
                                    reconsumeCurrent();
                                }
                                break;
                            case 'Script data escaped end tag open state': //12.2.4.26 Script data escaped end tag open state
                                logall[logall.length - 1] += " (12.2.4.26)";
                                consumeNext(false);
                                if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z') {
                                    tokenTag.push(new tokenTags("EndTag", stream[currentInput].toLowerCase()));
                                    tempBuffer += stream[currentInput].toLowerCase();
                                    state.push("Script data escaped end tag name state");
                                }
                                else if ('a' <= stream[currentInput] && stream[currentInput] <= 'z') {
                                    tokenTag.push(new tokenTags("EndTag", stream[currentInput]));
                                    tempBuffer += stream[currentInput];
                                    state.push("Script data escaped end tag name state");
                                }
                                else {
                                    state.push("Script data escaped state");
                                    emit("ParseError");
                                    emit("Character", "\u003C");
                                    emit("Character", "\u002F");
                                    reconsumeCurrent();
                                }
                                break;
                            case 'Script data escaped end tag name state': //12.2.4.27 Script data escaped end tag name state
                                logall[logall.length - 1] += " (12.2.4.27)";
                                consumeNext(false);
                                var flagAny = false;
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        if (tokenTag[tokenTag.length - 1].name == tokenStart[tokenStart.length - 1].name)
                                            state.push("Before attribute name state");
                                        else
                                            flagAny = true;
                                        break;
                                    case "\u002F": //Solidus (/)
                                        if (tokenTag[tokenTag.length - 1].name == tokenStart[tokenStart.length - 1].name)
                                            state.push("Self-closing start tag state");
                                        else
                                            flagAny = true;
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        if (tokenTag[tokenTag.length - 1].name == tokenStart[tokenStart.length - 1].name) {
                                            state.push("Data state");
                                            emitTag(tokenTag[tokenTag.length - 1]);
                                        }
                                        else
                                            flagAny = true;
                                        break;
                                    default:
                                        if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z') {
                                            tokenTag[tokenTag.length - 1].name += stream[currentInput].toLowerCase();
                                            tempBuffer += stream[currentInput].toLowerCase();
                                        }
                                        else if ('a' <= stream[currentInput] && stream[currentInput] <= 'z') {
                                            tokenTag[tokenTag.length - 1].name += stream[currentInput];
                                            tempBuffer += stream[currentInput];
                                        }
                                        else
                                            flagAny = true;
                                        break;
                                }
                                if (flagAny) {
                                    state.push("script data escaped state");
                                    emit("Character", "\u003C");
                                    emit("Character", "\u002F");
                                    for (var i in tempBuffer)
                                        emit("Character", tempBuffer[i]);
                                    reconsumeCurrent();
                                }
                                break;
                            case 'Script data double escape start state': //12.2.4.28 Script data double escape start state
                                logall[logall.length - 1] += " (12.2.4.28)";
                                consumeNext(false);
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                    case "\u002F": //Solidus (/)
                                    case "\u003E": //Greater-than sign (>)
                                        if (tempBuffer == "script")
                                            state.push("Script data double escaped state");
                                        else
                                            state.push("Script data escaped state");
                                        emit("Character", stream[currentInput]);
                                        break;
                                    default:
                                        if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z') {
                                            tempBuffer += stream[currentInput].toLowerCase();
                                            emit("Character", stream[currentInput]);
                                        }
                                        else if ('a' <= stream[currentInput] && stream[currentInput] <= 'z') {
                                            tempBuffer += stream[currentInput];
                                            emit("Character", stream[currentInput]);
                                        }
                                        else {
                                            state.push("Script data escaped state");
                                            reconsumeCurrent();
                                        }
                                        break;
                                }
                                break;
                            case 'Script data double escaped state': //12.2.4.29 Script data double escaped state
                                logall[logall.length - 1] += " (12.2.4.29)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u002D": //Hyphen-minus (-)
                                        state.push("Script data double escaped dash state");
                                        emit("Character", "\u002D");
                                        break;
                                    case "\u003C": //Less-than sign (<)
                                        state.push("Script data double escaped less-than sign state");
                                        emit("Character", "\u003C");
                                        break;
                                    case "\u0000": //Less-than sign (<)
                                        emit("ParseError");
                                        emit("Character", "\uFFFD");
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            reconsumeCurrent();
                                        }
                                        else {
                                            emit("Character", stream[currentInput]);
                                        }
                                        break;
                                }
                                break;
                            case 'Script data double escaped dash state': //12.2.4.30 Script data double escaped dash state
                                logall[logall.length - 1] += " (12.2.4.30)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u002D": //Hyphen-minus (-)
                                        state.push("Script data double escaped dash dash state");
                                        emit("Character", "\u002D");
                                        break;
                                    case "\u003C": //Less-than sign (<)
                                        state.push("Script data double escaped less-than sign state");
                                        emit("Character", "\u003C");
                                        break;
                                    case "\u0000": //Less-than sign (<)
                                        state.push("Script data double escaped state");
                                        emit("ParseError");
                                        emit("Character", "\uFFFD");
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            reconsumeCurrent();
                                        }
                                        else {
                                            state.push("Script data double escaped state");
                                            emit("Character", stream[currentInput]);
                                        }
                                        break;
                                }
                                break;
                            case 'Script data double escaped dash dash state': //12.2.4.31 Script data double escaped dash dash state
                                logall[logall.length - 1] += " (12.2.4.31)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u002D": //Hyphen-minus (-)
                                        emit("Character", "\u002D");
                                        break;
                                    case "\u003C": //Less-than sign (<)
                                        state.push("Script data double escaped less-than sign state");
                                        emit("Character", "\u003C");
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        state.push("Script data state");
                                        emit("Character", "\u003E");
                                        break;
                                    case "\u0000": //Less-than sign (<)
                                        state.push("Script data double escaped state");
                                        emit("ParseError");
                                        emit("Character", "\uFFFD");
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            reconsumeCurrent();
                                        }
                                        else {
                                            state.push("Script data double escaped state");
                                            emit("Character", stream[currentInput]);
                                        }
                                        break;
                                }
                                break;
                            case 'Script data double escaped less-than sign state': //12.2.4.32 Script data double escaped less-than sign state
                                logall[logall.length - 1] += " (12.2.4.32)";
                                consumeNext(false);
                                if (stream[currentInput] == "\u002F") { //Solidus (/)
                                    tempBuffer = "";
                                    state.push("Script data double escape end state");
                                    emit("Character", "\u002F");
                                }
                                else {
                                    state.push("Script data double escaped state");
                                    reconsumeCurrent();
                                }
                                break;
                            case 'Script data double escape end state': //12.2.4.33 Script data double escape end state
                                logall[logall.length - 1] += " (12.2.4.33)";
                                consumeNext(false);
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                    case "\u002F": //Solidus (/)
                                    case "\u003E": //Greater-than sign (>)
                                        if (tempBuffer == "script")
                                            state.push("Script data escaped state");
                                        else
                                            state.push("Script data double escaped state");
                                        emit("Character", stream[currentInput]);
                                        break;
                                    default:
                                        if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z') {
                                            tempBuffer += stream[currentInput].toLowerCase();
                                            emit("Character", stream[currentInput]);
                                        }
                                        else if ('a' <= stream[currentInput] && stream[currentInput] <= 'z') {
                                            tempBuffer += stream[currentInput];
                                            emit("Character", stream[currentInput]);
                                        }
                                        else {
                                            state.push("Script data double escaped state");
                                            reconsumeCurrent();
                                        }
                                        break;
                                }
                                break;
                            case 'Before attribute name state': //12.2.4.34 Before attribute name state
                                logall[logall.length - 1] += " (12.2.4.34)";
                                consumeNext(true);
                                var flagAny = false;
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        break;
                                    case "\u002F": //Solidus (/)
                                        state.push("Self-closing start tag state");
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        state.push("Data state");
                                        emitTag(tokenTag[tokenTag.length - 1]);
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenTag[tokenTag.length - 1].newAttr("\uFFFD");
                                        state.push("Attribute name state");
                                        break;
                                    case "\u0022": //Quotation mark (")
                                    case "\u0027": //Apostrophe (')
                                    case "\u003C": //Less-than sign (<)
                                    case "\u003D": //Equals sign (=)
                                        emit("ParseError");
                                        flagAny = true;
                                        break;
                                    default:
                                        if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z') {
                                            tokenTag[tokenTag.length - 1].newAttr(stream[currentInput].toLowerCase());
                                            state.push("Attribute name state");
                                        }
                                        else if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            reconsumeCurrent();
                                        }
                                        else
                                            flagAny = true;
                                        break;
                                }
                                if (flagAny) {
                                    tokenTag[tokenTag.length - 1].newAttr(stream[currentInput]);
                                    state.push("Attribute name state");
                                }
                                break;
                            case 'Attribute name state': //12.2.4.35 Attribute name state
                                logall[logall.length - 1] += " (12.2.4.35)";
                                consumeNext(true);
                                var flagAny = false;
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        state.push("After attribute name state");
                                        break;
                                    case "\u002F": //Solidus (/)
                                        state.push("Self-closing start tag state");
                                        break;
                                    case "\u003D": //Equals sign (=)
                                        state.push("Before attribute value state");
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        state.push("Data state");
                                        emitTag(tokenTag[tokenTag.length - 1]);
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenTag[tokenTag.length - 1].attribute[tokenTag[tokenTag.length - 1].attribute.length - 1].name += "\uFFFD";
                                        break;
                                    case "\u0022": //Quotation mark (")
                                    case "\u0027": //Apostrophe (')
                                    case "\u003C": //Less-than sign (<)
                                        emit("ParseError");
                                        flagAny = true;
                                        break;
                                    default:
                                        if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z')
                                            tokenTag[tokenTag.length - 1].attribute[tokenTag[tokenTag.length - 1].attribute.length - 1].name += stream[currentInput].toLowerCase();
                                        else if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            reconsumeCurrent();
                                        }
                                        else
                                            flagAny = true;
                                        break;
                                }
                                if (flagAny)
                                    tokenTag[tokenTag.length - 1].attribute[tokenTag[tokenTag.length - 1].attribute.length - 1].name += stream[currentInput];
                                break;
                            case 'After attribute name state': //12.2.4.36 After attribute name state
                                logall[logall.length - 1] += " (12.2.4.36)";
                                consumeNext(true);
                                var flagAny = false;
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        break;
                                    case "\u002F": //Solidus (/)
                                        state.push("Self-closing start tag state");
                                        break;
                                    case "\u003D": //Equals sign (=)
                                        state.push("Before attribute value state");
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        state.push("Data state");
                                        emitTag(tokenTag[tokenTag.length - 1]);
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenTag[tokenTag.length - 1].newAttr("\uFFFD");
                                        state.push("Attribute name state");
                                        break;
                                    case "\u0022": //Quotation mark (")
                                    case "\u0027": //Apostrophe (')
                                    case "\u003C": //Less-than sign (<)
                                        emit("ParseError");
                                        flagAny = true;
                                        break;
                                    default:
                                        if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z') {
                                            tokenTag[tokenTag.length - 1].newAttr(stream[currentInput].toLowerCase());
                                            state.push("Attribute name state");
                                        }
                                        else if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            reconsumeCurrent();
                                        }
                                        else
                                            flagAny = true;
                                        break;
                                }
                                if (flagAny) {
                                    tokenTag[tokenTag.length - 1].newAttr(stream[currentInput]);
                                    state.push("Attribute name state");
                                }
                                break;
                            case 'Before attribute value state': //12.2.4.37 Before attribute value state
                                logall[logall.length - 1] += " (12.2.4.37)";
                                consumeNext(true);
                                var flagAny = false;
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        break;
                                    case "\u0022": //Quotation mark (")
                                        state.push("Attribute value (double-quoted) state");
                                        break;
                                    case "\u0026": //Ampersand (&)
                                        state.push("Attribute value (unquoted) state");
                                        reconsumeCurrent();
                                        break;
                                    case "\u0027": //Apostrophe (')
                                        state.push("Attribute value (single-quoted) state");
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenTag[tokenTag.length - 1].attribute[tokenTag[tokenTag.length - 1].attribute.length - 1].value += "\uFFFD";
                                        state.push("Attribute value (unquoted) state");
                                        break;
                                    case "\u003E": //Greater-than sign (/)
                                        state.push("Data state");
                                        emit("ParseError");
                                        emitTag(tokenTag[tokenTag.length - 1]);
                                        break;
                                    case "\u003C": //Less-than sign (<)
                                    case "\u003D": //Equals sign (=)
                                    case "\u0060": //Grave accent (`)
                                        emit("ParseError");
                                        flagAny = true;
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            reconsumeCurrent();
                                        }
                                        else
                                            flagAny = true;
                                        break;
                                }
                                if (flagAny) {
                                    tokenTag[tokenTag.length - 1].attribute[tokenTag[tokenTag.length - 1].attribute.length - 1].value += stream[currentInput];
                                    state.push("Attribute value (unquoted) state");
                                }
                                break;
                            case 'Attribute value (double-quoted) state': //12.2.4.38 Attribute value (double-quoted) state
                                logall[logall.length - 1] += " (12.2.4.38)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0022": //Quotation mark (")
                                        state.push("After attribute value (quoted) state");
                                        break;
                                    case "\u0026": //Ampersand (&)
                                        refReturn = state[state.length - 1];
                                        state.push("Character reference in attribute value state");
                                        addChar = "\u0022";
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenTag[tokenTag.length - 1].attribute[tokenTag[tokenTag.length - 1].attribute.length - 1].value += "\uFFFD";
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            reconsumeCurrent();
                                        }
                                        else
                                            tokenTag[tokenTag.length - 1].attribute[tokenTag[tokenTag.length - 1].attribute.length - 1].value += stream[currentInput];
                                        break;
                                }
                                break;
                            case 'Attribute value (single-quoted) state': //12.2.4.39 Attribute value (single-quoted) state
                                logall[logall.length - 1] += " (12.2.4.39)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0027": //Apostrophe (')
                                        state.push("After attribute value (quoted) state");
                                        break;
                                    case "\u0026": //Ampersand (&)
                                        refReturn = state[state.length - 1];
                                        state.push("Character reference in attribute value state");
                                        addChar = "\u0027";
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenTag[tokenTag.length - 1].attribute[tokenTag[tokenTag.length - 1].attribute.length - 1].value += "\uFFFD";
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            reconsumeCurrent();
                                        }
                                        else
                                            tokenTag[tokenTag.length - 1].attribute[tokenTag[tokenTag.length - 1].attribute.length - 1].value += stream[currentInput];
                                        break;
                                }
                                break;
                            case 'Attribute value (unquoted) state': //12.2.4.40 Attribute value (unquoted) state
                                logall[logall.length - 1] += " (12.2.4.40)";
                                consumeNext(true);
                                var flagAny = false;
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        state.push("Before attribute name state");
                                        break;
                                    case "\u0026": //Ampersand (&)
                                        refReturn = state[state.length - 1];
                                        state.push("Character reference in attribute value state");
                                        addChar = "\u003E";
                                        break;
                                    case "\u003E": //Greater-than sign (/)
                                        state.push("Data state");
                                        emitTag(tokenTag[tokenTag.length - 1]);
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenTag[tokenTag.length - 1].attribute[tokenTag[tokenTag.length - 1].attribute.length - 1].value += "\uFFFD";
                                        break;
                                    case "\u0022": //Quotation mark (")
                                    case "\u0027": //Apostrophe (')
                                    case "\u003C": //Less-than sign (<)
                                    case "\u003D": //Equals sign (=)
                                    case "\u0060": //Grave accent (`)
                                        emit("ParseError");
                                        flagAny = true;
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            reconsumeCurrent();
                                        }
                                        else
                                            flagAny = true;
                                        break;
                                }
                                if (flagAny)
                                    tokenTag[tokenTag.length - 1].attribute[tokenTag[tokenTag.length - 1].attribute.length - 1].value += stream[currentInput];
                                break;
                            case 'Character reference in attribute value state': //12.2.4.41 Character reference in attribute value state
                                logall[logall.length - 1] += " (12.2.4.41)";
                                var tokenRef = characterReference(addChar);
                                if (tokenRef == null)
                                    tokenTag[tokenTag.length - 1].attribute[tokenTag[tokenTag.length - 1].attribute.length - 1].value += "\u0026";
                                else
                                    tokenTag[tokenTag.length - 1].attribute[tokenTag[tokenTag.length - 1].attribute.length - 1].value += tokenRef;
                                state.push(refReturn);
                                break;
                            case 'After attribute value (quoted) state': //12.2.4.42 After attribute value (quoted) state
                                logall[logall.length - 1] += " (12.2.4.42)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        state.push("Before attribute name state");
                                        break;
                                    case "\u000C": //Solidus (/)
                                        state.push("Self-closing start tag state");
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        state.push("Data state");
                                        emitTag(tokenTag[tokenTag.length - 1]);
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            reconsumeCurrent();
                                        }
                                        else {
                                            emit("ParseError");
                                            state.push("Before attribute name state");
                                            reconsumeCurrent();
                                        }
                                        break;
                                }
                                break;
                            case 'Self-closing start tag state': //12.2.4.43 Self-closing start tag state
                                logall[logall.length - 1] += " (12.2.4.43)";
                                consumeNext(true);
                                if (stream[currentInput] == "\u003E") {
                                    tokenTag[tokenTag.length - 1].flag = true;
                                    state.push("Data state");
                                    emitTag(tokenTag[tokenTag.length - 1]);
                                }
                                else if (currentInput >= stream.length) {
                                    emit("ParseError");
                                    state.push("Data state");
                                    reconsumeCurrent();
                                }
                                else {
                                    emit("ParseError");
                                    state.push("Before attribute name state");
                                    reconsumeCurrent();
                                }
                                break;
                            case 'Bogus comment state': //12.2.4.44 Bogus comment state
                                logall[logall.length - 1] += " (12.2.4.44)";
                                var trigger = stream[currentInput];
                                var consume = "";
                                while (stream[currentInput] != "\u003E" && currentInput < stream.length) {
                                    consumeNext(true);
                                    if (currentInput >= stream.length)
                                        consume += "\u0000";
                                    else
                                        consume += stream[currentInput];
                                }
                                if ((trigger + consume).length > 1)
                                    emit("Comment", (trigger != null ? trigger : "") + consume.slice(0, consume.length - 1).replace(/\u0000/g, "\uFFFD"));
                                else
                                    emit("Comment", "");
                                state.push("Data state");
                                if (currentInput >= stream.length)
                                    reconsumeCurrent();
                                break;
                            case 'Markup declaration open state': //12.2.4.45 Markup declaration open state
                                logall[logall.length - 1] += " (12.2.4.45)";
                                if (stream.slice(currentInput + 1, currentInput + 3) == "\u002D\u002D") {
                                    for (var i = 0; i < 2; i++)
                                        consumeNext(false);
                                    tokenComment.push("");
                                    state.push("Comment start state");
                                }
                                else if (stream.slice(currentInput + 1, currentInput + 8).toUpperCase() == "DOCTYPE") {
                                    for (var i = 0; i < 7; i++)
                                        consumeNext(false);
                                    state.push("DOCTYPE state");
                                }
                                else if (adjustedNode != null && adjustedNode.namespace != nsEl["html"] && stream.slice(currentInput + 1, currentInput + 8) == "\u005BCDATA\u005B") {
                                    for (var i = 0; i < 7; i++)
                                        consumeNext(false);
                                    state.push("CDATA section state");
                                }
                                else {
                                    emit("ParseError");
                                    consumeNext(true);
                                    state.push("Bogus comment state");
                                }
                                break;
                            case 'Comment start state': //12.2.4.46 Comment start state
                                logall[logall.length - 1] += " (12.2.4.46)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u002D": //Hypen-minus (-)
                                        state.push("Comment start dash state");
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenComment[tokenComment.length - 1] += "\uFFFD";
                                        state.push("Comment state");
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        emit("ParseError");
                                        state.push("Data state");
                                        emit("Comment", tokenComment[tokenComment.length - 1]);
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            emit("Comment", tokenComment[tokenComment.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else {
                                            tokenComment[tokenComment.length - 1] += stream[currentInput];
                                            state.push("Comment state");
                                        }
                                        break;
                                }
                                break;
                            case 'Comment start dash state': //12.2.4.47 Comment start dash state
                                logall[logall.length - 1] += " (12.2.4.47)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u002D": //Hypen-minus (-)
                                        state.push("Comment end state");
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenComment[tokenComment.length - 1] += "\u002D\uFFFD";
                                        state.push("Comment state");
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        emit("ParseError");
                                        state.push("Data state");
                                        emit("Comment", tokenComment[tokenComment.length - 1]);
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            emit("Comment", tokenComment[tokenComment.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else {
                                            tokenComment[tokenComment.length - 1] += "\u002D" + stream[currentInput];
                                            state.push("Comment state");
                                        }
                                        break;
                                }
                                break;
                            case 'Comment state': //12.2.4.48 Comment state
                                logall[logall.length - 1] += " (12.2.4.48)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u002D": //Hypen-minus (-)
                                        state.push("Comment end dash state");
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenComment[tokenComment.length - 1] += "\uFFFD";
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            emit("Comment", tokenComment[tokenComment.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else
                                            tokenComment[tokenComment.length - 1] += stream[currentInput];
                                        break;
                                }
                                break;
                            case 'Comment end dash state': //12.2.4.49 Comment end dash state
                                logall[logall.length - 1] += " (12.2.4.49)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u002D": //Hypen-minus (-)
                                        state.push("Comment end state");
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenComment[tokenComment.length - 1] += "\u002D\uFFFD";
                                        state.push("Comment state");
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            emit("Comment", tokenComment[tokenComment.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else {
                                            tokenComment[tokenComment.length - 1] += "\u002D" + stream[currentInput];
                                            state.push("Comment state");
                                        }
                                        break;
                                }
                                break;
                            case 'Comment end state': //12.2.4.50 Comment end state
                                logall[logall.length - 1] += " (12.2.4.50)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u003E": //Greater-than sign (>)
                                        state.push("Data state");
                                        emit("Comment", tokenComment[tokenComment.length - 1]);
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenComment[tokenComment.length - 1] += "\u002D\u002D\uFFFD";
                                        state.push("Comment state");
                                        break;
                                    case "\u0021": //Exclamation mark (!)
                                        state.push("Comment end bang state");
                                        break;
                                    case "\u002D": //Hypen-minus (-)
                                        emit("ParseError");
                                        tokenComment[tokenComment.length - 1] += "\u002D";
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            emit("Comment", tokenComment[tokenComment.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else {
                                            emit("ParseError");
                                            tokenComment[tokenComment.length - 1] += "\u002D\u002D" + stream[currentInput];
                                            state.push("Comment state");
                                        }
                                        break;
                                }
                                break;
                            case 'Comment end bang state': //12.2.4.51 Comment end bang state
                                logall[logall.length - 1] += " (12.2.4.51)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u002D": //Hypen-minus (-)
                                        tokenComment[tokenComment.length - 1] += "\u002D\u002D\u0021";
                                        state.push("Comment end dash state");
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        state.push("Data state");
                                        emit("Comment", tokenComment[tokenComment.length - 1]);
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenComment[tokenComment.length - 1] += "\u002D\u002D\u0021\uFFFD";
                                        state.push("Comment state");
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            emit("Comment", tokenComment[tokenComment.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else {
                                            tokenComment[tokenComment.length - 1] += "\u002D\u002D\u0021" + stream[currentInput];
                                            state.push("Comment state");
                                        }
                                        break;
                                }
                                break;
                            case 'DOCTYPE state': //12.2.4.52 DOCTYPE state
                                logall[logall.length - 1] += " (12.2.4.52)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        state.push("Before DOCTYPE name state");
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            tokenDOCTYPE.push(new tokenDOCTYPEs());
                                            emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else {
                                            emit("ParseError");
                                            state.push("Before DOCTYPE name state");
                                            reconsumeCurrent();
                                        }
                                        break;
                                }
                                break;
                            case 'Before DOCTYPE name state': //12.2.4.53 Before DOCTYPE name state
                                logall[logall.length - 1] += " (12.2.4.53)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenDOCTYPE.push(new tokenDOCTYPEs("\uFFFD"));
                                        state.push("DOCTYPE name state");
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        emit("ParseError");
                                        tokenDOCTYPE.push(new tokenDOCTYPEs(null, "on"));
                                        state.push("Data state");
                                        emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            tokenDOCTYPE.push(new tokenDOCTYPEs(null, "on"));
                                            emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z') {
                                            tokenDOCTYPE.push(new tokenDOCTYPEs(stream[currentInput].toLowerCase()));
                                            state.push("DOCTYPE name state");
                                        }
                                        else {
                                            tokenDOCTYPE.push(new tokenDOCTYPEs(stream[currentInput]));
                                            state.push("DOCTYPE name state");
                                        }
                                        break;
                                }
                                break;
                            case 'DOCTYPE name state': //12.2.4.54 DOCTYPE name state
                                logall[logall.length - 1] += " (12.2.4.54)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        state.push("After DOCTYPE name state");
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        state.push("Data state");
                                        emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].name += "\uFFFD";
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else if ('A' <= stream[currentInput] && stream[currentInput] <= 'Z')
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].name += stream[currentInput].toLowerCase();
                                        else
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].name += stream[currentInput];
                                        break;
                                }
                                break;
                            case 'After DOCTYPE name state': //12.2.4.55 After DOCTYPE name state
                                logall[logall.length - 1] += " (12.2.4.55)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        state.push("Data state");
                                        emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else if (stream.slice(currentInput, currentInput + 6).toUpperCase() == "PUBLIC") {
                                            for (var i = 0; i < 5; i++)
                                                consumeNext(false);
                                            state.push("After DOCTYPE public keyword state");
                                        }
                                        else if (stream.slice(currentInput, currentInput + 6).toUpperCase() == "SYSTEM") {
                                            for (var i = 0; i < 5; i++)
                                                consumeNext(false);
                                            state.push("After DOCTYPE system keyword state");
                                        }
                                        else {
                                            emit("ParseError");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            state.push("Bogus DOCTYPE state");
                                        }
                                        break;
                                }
                                break;
                            case 'After DOCTYPE public keyword state': //12.2.4.56 After DOCTYPE public keyword state
                                logall[logall.length - 1] += " (12.2.4.56)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        state.push("Before DOCTYPE public identifier state");
                                        break;
                                    case "\u0022": //Quotation mark (")
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].publicId = "";
                                        state.push("DOCTYPE public identifier (double-quoted) state");
                                        break;
                                    case "\u0027": //Apostrophe (')
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].publicId = "";
                                        state.push("DOCTYPE public identifier (single-quoted) state");
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                        state.push("Data state");
                                        emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else {
                                            emit("ParseError");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            state.push("Bogus DOCTYPE state");
                                        }
                                        break;
                                }
                                break;
                            case 'Before DOCTYPE public identifier state': //12.2.4.57 Before DOCTYPE public identifier state
                                logall[logall.length - 1] += " (12.2.4.57)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        break;
                                    case "\u0022": //Quotation mark (")
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].publicId = "";
                                        state.push("DOCTYPE public identifier (double-quoted) state");
                                        break;
                                    case "\u0027": //Apostrophe (')
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].publicId = "";
                                        state.push("DOCTYPE public identifier (single-quoted) state");
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                        state.push("Data state");
                                        emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else {
                                            emit("ParseError");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            state.push("Bogus DOCTYPE state");
                                        }
                                        break;
                                }
                                break;
                            case 'DOCTYPE public identifier (double-quoted) state': //12.2.4.58 DOCTYPE public identifier (double-quoted) state
                                logall[logall.length - 1] += " (12.2.4.58)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0022": //Quotation mark (")
                                        state.push("After DOCTYPE public identifier state");
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].publicId += "\uFFFD";
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                        state.push("Data state");
                                        emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].publicId += stream[currentInput];
                                        break;
                                }
                                break;
                            case 'DOCTYPE public identifier (single-quoted) state': //12.2.4.59 DOCTYPE public identifier (single-quoted) state
                                logall[logall.length - 1] += " (12.2.4.59)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0027": //Apostrophe (')
                                        state.push("After DOCTYPE public identifier state");
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].publicId += "\uFFFD";
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                        state.push("Data state");
                                        emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].publicId += stream[currentInput];
                                        break;
                                }
                                break;
                            case 'After DOCTYPE public identifier state': //12.2.4.60 After DOCTYPE public identifier state
                                logall[logall.length - 1] += " (12.2.4.60)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        state.push("Between DOCTYPE public and system identifiers state");
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        state.push("Data state");
                                        emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                        break;
                                    case "\u0022": //Quotation mark (")
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].systemId = "";
                                        state.push("DOCTYPE system identifier (double-quoted) state");
                                        break;
                                    case "\u0027": //Apostrophe (')
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].systemId = "";
                                        state.push("DOCTYPE system identifier (single-quoted) state");
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else {
                                            emit("ParseError");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            state.push("Bogus DOCTYPE state");
                                        }
                                        break;
                                }
                                break;
                            case 'Between DOCTYPE public and system identifiers state': //12.2.4.61 Between DOCTYPE public and system identifiers state
                                logall[logall.length - 1] += " (12.2.4.61)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        state.push("Data state");
                                        emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                        break;
                                    case "\u0022": //Quotation mark (")
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].systemId = "";
                                        state.push("DOCTYPE system identifier (double-quoted) state");
                                        break;
                                    case "\u0027": //Apostrophe (')
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].systemId = "";
                                        state.push("DOCTYPE system identifier (single-quoted) state");
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else {
                                            emit("ParseError");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            state.push("Bogus DOCTYPE state");
                                        }
                                        break;
                                }
                                break;
                            case 'After DOCTYPE system keyword state': //12.2.4.62 After DOCTYPE system keyword state
                                logall[logall.length - 1] += " (12.2.4.62)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        state.push("Before DOCTYPE system identifier state");
                                        break;
                                    case "\u0022": //Quotation mark (")
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].systemId = "";
                                        state.push("DOCTYPE system identifier (double-quoted) state");
                                        break;
                                    case "\u0027": //Apostrophe (')
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].systemId = "";
                                        state.push("DOCTYPE system identifier (single-quoted) state");
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                        state.push("Data state");
                                        emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else {
                                            emit("ParseError");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            state.push("Bogus DOCTYPE state");
                                        }
                                        break;
                                }
                                break;
                            case 'Before DOCTYPE system identifier state': //12.2.4.63 Before DOCTYPE system identifier state
                                logall[logall.length - 1] += " (12.2.4.63)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        break;
                                    case "\u0022": //Quotation mark (")
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].systemId = "";
                                        state.push("DOCTYPE system identifier (double-quoted) state");
                                        break;
                                    case "\u0027": //Apostrophe (')
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].systemId = "";
                                        state.push("DOCTYPE system identifier (single-quoted) state");
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                        state.push("Data state");
                                        emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else {
                                            emit("ParseError");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            state.push("Bogus DOCTYPE state");
                                        }
                                        break;
                                }
                                break;
                            case 'DOCTYPE system identifier (double-quoted) state': //12.2.4.64 DOCTYPE system identifier (double-quoted) state
                                logall[logall.length - 1] += " (12.2.4.64)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0022": //Quotation mark (")
                                        state.push("After DOCTYPE system identifier state");
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].systemId += "\uFFFD";
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                        state.push("Data state");
                                        emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].systemId += stream[currentInput];
                                        break;
                                }
                                break;
                            case 'DOCTYPE system identifier (single-quoted) state': //12.2.4.65 DOCTYPE system identifier (single-quoted) state
                                logall[logall.length - 1] += " (12.2.4.65)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0027": //Apostrophe (')
                                        state.push("After DOCTYPE system identifier state");
                                        break;
                                    case "\u0000": //NULL
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].systemId += "\uFFFD";
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        emit("ParseError");
                                        tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                        state.push("Data state");
                                        emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].systemId += stream[currentInput];
                                        break;
                                }
                                break;
                            case 'After DOCTYPE system identifier state': //12.2.4.66 After DOCTYPE system identifier state
                                logall[logall.length - 1] += " (12.2.4.66)";
                                consumeNext(true);
                                switch (stream[currentInput]) {
                                    case "\u0009": //Character tabulation (tab)
                                    case "\u000A": //Line feed (LF)
                                    case "\u000C": //Form feed (FF)
                                    case "\u0020": //Space ( )
                                        break;
                                    case "\u003E": //Greater-than sign (>)
                                        state.push("Data state");
                                        emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                        break;
                                    default:
                                        if (currentInput >= stream.length) {
                                            emit("ParseError");
                                            state.push("Data state");
                                            tokenDOCTYPE[tokenDOCTYPE.length - 1].flag = "on";
                                            emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                            reconsumeCurrent();
                                        }
                                        else {
                                            emit("ParseError");
                                            state.push("Bogus DOCTYPE state");
                                        }
                                        break;
                                }
                                break;
                            case 'Bogus DOCTYPE state': //12.2.4.67 Bogus DOCTYPE state
                                logall[logall.length - 1] += " (12.2.4.67)";
                                consumeNext(true);
                                if (stream[currentInput] == "\u003E") {
                                    state.push("Data state");
                                    emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                }
                                else if (currentInput >= stream.length) {
                                    state.push("Data state");
                                    emit("DOCTYPE", tokenDOCTYPE[tokenDOCTYPE.length - 1]);
                                    reconsumeCurrent();
                                }
                                else;
                                break;
                            case 'CDATA section state': //12.2.4.68 CDATA section state
                                logall[logall.length - 1] += " (12.2.4.68)";
                                var consume = "";
                                state.push("Data state");
                                while (consume.slice(-3) != "\u005D\u005D\u003E" && currentInput < stream.length) {
                                    consumeNext(true);
                                    if (currentInput >= stream.length)
                                        consume += "\u0000";
                                    else
                                        consume += stream[currentInput];
                                }
                                if (consume.slice(-1) != "\u0000")
                                    for (var i = 0; i < consume.length - 3; i++)
                                        emit("Character", consume[i]);
                                else {
                                    for (var i = 0; i < consume.length - 1; i++)
                                        emit("Character", consume[i]);
                                    reconsumeCurrent();
                                }
                                break;
                            default: //Other value - Parse error
                                emit("Comment", "State not found!");
                                state.push(null);
                                break;
                        }
                    }
                    logall.push("End function Tokenization\n");
                };

                tokenization(stream);
                nextInput++;
                logall.push("End function Parsing");
            };

            var streamR = preprocessing(stream);
            parsing(streamR);
            if (!testTokenizer || testTokenizer == null) {
                labelProcess++;
                emitList = [];
                logall.push("PARSING");
                logall = [];
                parsing(streamR);
            }
            //console.log(emitList);
            //console.log(document);
            //console.log(logall);
            //console.log(streamR);
            //console.log(treeViewer(document));
            //console.log(document);
            return ({token: emitList, doc: document, logs: logall});
        }
        catch (err) {
            return ({token: emitList, doc: document, logs: logall, err: err});
        }
    }
}