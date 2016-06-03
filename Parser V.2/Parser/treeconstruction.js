// WHATWG ver. 22-06-2016
// Variable declaration
var cls = require('./class');
var sprt = require('./support');
var tknz = require('./tokenization');
var logs = [];
var framesetFlag = 'ok'; //35
var nextInput = 0; //458
var currentInput = -1; //378
var pendingCharTable = []; //5
var headPointer = null; //35
var formPointer = null; //35
var returnMode = null; //35
var foster = false; //35
var reProcess = true; //356
var callBack = ''; //35
var ignoreTokenFlag = false; //57
var specialTag = ['address', 'applet', 'area', 'article', 'aside', 'base', 'basefont', 'bgsound', 'blockquote', 'body',
    'br', 'button', 'caption', 'center', 'col', 'colgroup', 'dd', 'details', 'dir', 'div', 'dl', 'dt', 'embed', 'fieldset',
    'figcaption', 'figure', 'footer', 'form', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header',
    'hgroup', 'hr', 'html', 'iframe', 'img', 'input', 'isindex', 'li', 'link', 'listing', 'main', 'marquee', 'menu',
    'menuitem', 'meta', 'nav', 'noembed', 'noframes', 'noscript', 'object', 'ol', 'p', 'param', 'plaintext', 'pre', 'script',
    'section', 'select', 'source', 'style', 'summary', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th',
    'thead', 'title', 'tr', 'track', 'ul', 'wbr', 'and xmp; mi', 'mo', 'mn', 'ms', 'mtext', 'annotation-xml', 'foreignObject',
    'desc', 'title']; //35
var scopeEl = ['applet', 'caption', 'html', 'table', 'td', 'th', 'marquee', 'object', 'template', 'mi', 'mo', 'mn', 'ms',
    'mtext', 'annotation-xml', 'foreignObject', 'desc', 'title']; //3
var nsEl = {
    html: 'http://www.w3.org/1999/xhtml',
    mathml: 'http://www.w3.org/1998/Math/MathML',
    svg: 'http://www.w3.org/2000/svg',
    xlink: 'http://www.w3.org/1999/xlink',
    xml: 'http://www.w3.org/XML/1998/namespace',
    xmlns: 'http://www.w3.org/2000/xmlns/'
}; //3578
var defaultMode = 'Initial';
var fragmentParse = false;
var modeList = {
    mode: [],
    listFormat: [],
    stackOpen: [],
    stackTemplate: [],
    adjustedNode: null,
    document: new cls.documents('root')

};
var emit = [];

// State reference
var modeRef = {
    initial: ['Initial', '12.2.5.4.1'],
    before_html: ['Before html', '12.2.5.4.2'],
    before_head: ['Before head', '12.2.5.4.3'],
    in_head: ['In head', '12.2.5.4.4'],
    in_head_noscript: ['In head noscript', '12.2.5.4.5'],
    after_head: ['After head', '12.2.5.4.6'],
    in_body: ['In body', '12.2.5.4.7'],
    text: ['Text', '12.2.5.4.8'],
    in_table: ['In table', '12.2.5.4.9'],
    in_table_text: ['In table text', '12.2.5.4.10'],
    in_caption: ['In caption', '12.2.5.4.11'],
    in_column_group: ['In column group', '12.2.5.4.12'],
    in_table_body: ['In table body', '12.2.5.4.13'],
    in_row: ['In row', '12.2.5.4.14'],
    in_cell: ['In cell', '12.2.5.4.15'],
    in_select: ['In select', '12.2.5.4.16'],
    in_select_in_table: ['In select in table', '12.2.5.4.17'],
    in_template: ['In template', '12.2.5.4.18'],
    after_body: ['After body', '12.2.5.4.19'],
    in_frameset: ['In frameset', '12.2.5.4.20'],
    after_frameset: ['After frameset', '12.2.5.4.21'],
    after_after_body: ['After after body', '12.2.5.4.22'],
    after_after_frameset: ['After after frameset', '12.2.5.4.23']
};

// States definition and supporting algorithm
try {
    var modeSup = {
        now: function () {
            return modeList.mode[modeList.mode.length - 1];
        },
        currentNode: function () {
            return modeList.stackOpen[modeList.stackOpen.length - 1];
        },
        currentTemplate: function () {
            return modeList.stackTemplate[modeList.stackTemplate.length - 1];
        },
        convert: function (modeName) {
            return modeName.toLowerCase().replace(/\s/g, '_');
        },
        emitTag: function (token) {
            if (token.constructor.name == "tokenParEr")
                logs.push('\t\tParse error: ' + token.data);
            emit.push(token);
        },
        switch: function (newMode, returnState) {
            modeList.mode.push(newMode);
            logs.push('\t' + (returnState ? 'Return' : 'Switch') + ' to The "' + newMode + '" insertion mode (' + modeRef[this.convert(newMode)][1] + ')');
        },
        reprocessIn: function (newMode, returnMode) {
            logs.push('\t\tReconsume the token in The "' + newMode + '" insertion mode (' + modeRef[this.convert(newMode)][1] + ')');
            reProcess = true;
            this.switch(newMode, returnMode);
        },
        preprocess: function (token) {
            logs.push('\tRun Preprocess function');
            if (token.type == 'ParseError') {
                logs.push('\t\tParseError token: skip token');
                return false;
            }
            else if (['DOCTYPE', 'StartTag', 'EndTag'].indexOf(token.type) != -1) {
                if (token.name.indexOf(':') == -1)
                    token.namespace = nsEl['html'];
                else {
                    var pos = token.name.lastIndexOf(':');
                    token.namespace = token.name.substr(0, pos)
                    token.name = token.name.substr(pos + 1);
                    var flag = false;
                    for (var i in nsEl)
                        if (nsEl[i].toLowerCase() == token.namespace.toLowerCase()) {
                            flag = true;
                            token.namespace = nsEl[i];
                            break;
                        }
                    if (!flag) {
                        if (nsEl[token.namespace.toLowerCase()] != null)
                            token.namespace = nsEl[token.namespace.toLowerCase()];
                        else
                            token.namespace = nsEl['html'];
                    }
                }
                logs.push('\t\tToken name: ' + token.name + '. Namespace added: ' + token.namespace);
                if (token.attribute.length > 0) {
                    var tempAttr = {};
                    for (var i in token.attribute)
                        tempAttr[token.attribute[i].name] = token.attribute[i].value;
                    token.attribute = tempAttr;
                    logs.push("\t\tToken's attribute(s) converted from array to object");
                }
                else
                    token.attribute = {};
                return true;
            }
            logs.push('\t\tNothing to be preprocessed');
            return true;
        },
        isMathMLIntegration: function (node) {
            return (['mi', 'mo', 'mn', 'ms', 'mtext'].indexOf(node.type) != -1);
        },
        isHTMLNamespace: function (node) {
            return (node.namespace == nsEl['html']);
        },
        isMathMLAnnotation: function (node) {
            return (node.type == 'annotation-xml');
        },
        isHTMLIntegration: function (node, token) {
            return ((this.isMathMLAnnotation(node) && token.type == 'StartTag' && (token.attribute['encoding'].toLowerCase() == 'text/html' ||
            token.attribute['encoding'].toLowerCase() == 'application/xhtml+xml')) || node.type == 'foreignObject' || node.type == 'desc' ||
            node.type == 'title');
        },
        insertNode: function (target, newNode, mode) {
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
    };
    var modeAlgo = {
        dispatcher: function (token) {
            logs.push('\tRun Tree construction dispatcher (12.2.5)');
            if (modeList.stackOpen.length == 0 || modeSup.isHTMLNamespace(modeList.adjustedNode) || (modeSup.isMathMLIntegration(modeList.adjustedNode) &&
                ((token.type == 'StartTag' && token.name != 'mglyph' && token.name != 'malignmark') || (token.type == 'Character'))) ||
                (modeSup.isMathMLAnnotation(modeList.adjustedNode) && token.type == 'StartTag' && token.name == 'svg') ||
                (modeSup.isHTMLIntegration(modeList.adjustedNode, token) && (token.type == 'StartTag' || token.type == 'Character')) ||
                token.type == 'End-of-file') {
                logs.push('\t\tProcess normally');
                return true;
            }
            else {
                logs.push('\t\tParsing foreign content: Currently not supported. Skip the token');
                return false;
            }
            // logs.push('\tEnd Tree construction dispatcher (12.2.5)');
        },
        insertComment: function (token, position) {
            logs.push('\tCall Insert comment algorithm:');
            logs.push('\t\tToken: ' + JSON.stringify(token) + ', position: ' + (position == null ? 'not provided' : 'provided'));
            var data = token.data;
            var adjustInsert = position;
            if (adjustInsert == null)
                adjustInsert = this.appropriateInsert();
            var newNode = new cls.nodes('comment', adjustInsert.target.document);
            newNode.data = data;
            modeSup.insertNode(adjustInsert.target, newNode, adjustInsert.mode);
        },
        appropriateInsert: function (override) {
            logs.push('\tCall Appropriate insert algorithm:');
            logs.push('\t\tOverride: ' + (override == null ? 'not provided' : 'provided'));
            var target = override != null ? override : modeSup.currentNode();
            var adjusted = (function () {
                var targetType = ['table', 'tbody', 'tfoot', 'thead', 'tr'];
                if (foster && targetType.indexOf(target.type) != -1) {
                    var lastTemplate = null;
                    var lastTable = null;
                    for (var i in modeList.stackOpen) {
                        if (modeList.stackOpen[i].type == 'template')
                            lastTemplate = i;
                        if (modeList.stackOpen[i].type == 'table')
                            lastTable = i;
                    }
                    if (lastTemplate != null && (lastTable == null || (lastTable != null && lastTemplate > lastTable)))
                        return {target: modeList.stackOpen[lastTemplate].contents, mode: 'last'};
                    else if (lastTable == null)
                        return {target: modeList.stackOpen[0], mode: 'last'};
                    else if (modeList.stackOpen[lastTable].parent != null)
                        return {target: modeList.stackOpen[lastTable], mode: 'before'};
                    var prevElement = modeList.stackOpen[lastTable - 1];
                    return {target: prevElement, mode: 'last'};
                }
                else
                    return {target: target, mode: 'last'};
            })();
            if ((adjusted.target.type == 'template' && adjusted.mode == 'last') || (adjusted.target.parent.type == 'template' && adjusted.mode == 'before'))
                adjusted.target = adjusted.target.contents;
            return adjusted;
        },
        createElement: function (parent, namespace, token) {
            function lookupCustomEl(document, namespace, localName, is) {
                logs.push('\tCall Lookup custom element function:');
                logs.push('\t\tThis function is not yet supported. Return to main function');
                return null;
            }

            function createAnEl(document, localName, namespace, prefix, is, syncFlag) {
                logs.push('\tCall Creating an element function:');
                logs.push('\t\tThis function is not yet supported. Return to main function');
                new cls.nodes(token.type, parent.document, namespace); // !Improvisation
            }

            function reset(element) {
                logs.push('\tCall Reset algorithm:');
                logs.push('\t\tThis algorithm is not yet supported. Return to main function');
            }

            function noTemplate() {
                for (var i in modeList.stackOpen)
                    if (modeList.stackOpen[i].type == "template")
                        return false;
                return true;
            }

            function isSameHomeTree(node1, node2) {
                while (true) {
                    if (node1.parent != null)
                        node1 = node1.parent;
                    if (node2.parent != null)
                        node2 = node2.parent;
                    if (node1.parent == null && node2.parent == null)
                        break;
                }
                return (node1 == node2);
            }

            var document = parent.document;
            var localName = token.name;
            var is = token.attribute['is'];
            logs.push('\tCall Create element algorithm:');
            logs.push('\t\tParent: ' + parent.type + ', token: ' + JSON.stringify(token) + ', namespace: ' + namespace);
            var definition = lookupCustomEl(document, namespace, localName, is);
            var execScript = (definition != null && fragmentParse);
            if (execScript)
                logs.push('\t\tScript execution is not yet supported');
            var element = createAnEl(document, localName, namespace, null, is, execScript);
            logs.push('\t\tAssigning HTMLUnknownELement process is not yet supported');
            element.attr = token.attribute;
            if (execScript)
                logs.push('\t\tScript execution is not yet supported');
            if ((element.attr['xmlns'] != null && element.attr['xmlns'] != element.namespace) || (element.attr['xmlns:xlink'] != null && element.attr['xmlns:xlink'] != nsEl['xlink']))
                modeSup.emitTag(new cls.tokenParEr('Invalid XMLNS attribute on the element (PE121)'));
            if (['input', 'keygen', 'output', 'select', 'textarea'].indexOf(element.type) != -1)
                reset(element);
            if (['button', 'fieldset', 'input', 'keygen', 'object', 'output', 'select', 'textarea', 'img'].indexOf(newNode.type) != -1 &&
                formPointer != null && noTemplate() && (['button', 'fieldset', 'input', 'keygen', 'object', 'output', 'select', 'textarea'].indexOf(newNode) == -1 ||
                token.attribute['form'] == null) && isSameHomeTree(parent, formPointer))
                element.formOwner = formPointer;
            return element;
        }
    };
    var modeDef = {
        $$$initial: function (token) { // Initial (12.2.5.4.1)
            var flag = false;
            switch (token.type) {
                case 'Character':
                    var tempList = ['\u0009', '\u000A', '\u000C', '\u000D', '\u0020']; // Character tabulation, Line feed (LF), Form feed (FF), Carriage return (CR), and Space
                    if (tempList.indexOf(token.data) == -1)
                        flag = true;
                    break;
                case 'Comment':
                    modeAlgo.insertComment(token, {target: modeList.document, mode: 'last'});
                    break;
                case 'DOCTYPE':
                    var flagDOC = token.name == 'html' && ((token.publicId == '-//W3C//DTD HTML 4.0//EN' && (token.systemId == null ||
                        token.systemId == 'http://www.w3.org/TR/REC-html40/strict.dtd' || token.systemId == 'http://www.w3.org/TR/html4/strict.dtd'))
                        || (token.publicId == '-//W3C//DTD XHTML 1.0 Strict//EN' && token.systemId == 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd') ||
                        (token.publicId == '-//W3C//DTD XHTML 1.1//EN' && token.systemId == 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'));
                    if (token.name != 'html' || token.publicId != null || token.systemId != null || token.systemId != 'about:legacy-compat' || !flagDOC)
                        modeSup.emitTag(new cls.tokenParEr('Invalid DOCTYPE token (PE117)'));
                    var newNode = new cls.nodes('DocumentType', modeList.document);
                    modeSup.insertNode(newNode.document, newNode, 'last');
                    newNode.name = token.name != null ? token.name : '';
                    newNode.publicId = token.publicId != null ? token.publicId : '';
                    newNode.systemId = token.systemId != null ? token.systemId : '';
                    modeList.document.doctype = newNode;

                    var arrayPublic = ['-//W3O//DTD W3 HTML Strict 3.0//EN//'.toUpperCase(), '-/W3C/DTD HTML 4.0 Transitional/EN'.toUpperCase(), 'HTML'];
                    var flagStart = function () {
                        var arrayPublic2 = ['+//Silmaril//dtd html Pro v0r11 19970101//', '-//AS//DTD HTML 3.0 asWedit + extensions//', '-//AdvaSoft Ltd//DTD HTML 3.0 asWedit + extensions//',
                            '-//IETF//DTD HTML 2.0 Level 1//', '-//IETF//DTD HTML 2.0 Level 2//', '-//IETF//DTD HTML 2.0 Strict Level 1//', '-//IETF//DTD HTML 2.0 Strict Level 2//',
                            '-//IETF//DTD HTML 2.0 Strict//', '-//IETF//DTD HTML 2.0//', '-//IETF//DTD HTML 2.1E//', '-//IETF//DTD HTML 3.0//', '-//IETF//DTD HTML 3.2 Final//',
                            '-//IETF//DTD HTML 3.2//', '-//IETF//DTD HTML 3//', '-//IETF//DTD HTML Level 0//', '-//IETF//DTD HTML Level 1//', '-//IETF//DTD HTML Level 2//',
                            '-//IETF//DTD HTML Level 3//', '-//IETF//DTD HTML Strict Level 0//', '-//IETF//DTD HTML Strict Level 1//', '-//IETF//DTD HTML Strict Level 2//',
                            '-//IETF//DTD HTML Strict Level 3//', '-//IETF//DTD HTML Strict//', '-//IETF//DTD HTML//', '-//Metrius//DTD Metrius Presentational//',
                            '-//Microsoft//DTD Internet Explorer 2.0 HTML Strict//', '-//Microsoft//DTD Internet Explorer 2.0 HTML//', '-//Microsoft//DTD Internet Explorer 2.0 Tables//',
                            '-//Microsoft//DTD Internet Explorer 3.0 HTML Strict//', '-//Microsoft//DTD Internet Explorer 3.0 HTML//', '-//Microsoft//DTD Internet Explorer 3.0 Tables//',
                            '-//Netscape Comm. Corp.//DTD HTML//', '-//Netscape Comm. Corp.//DTD Strict HTML//', "-//O'Reilly and Associates//DTD HTML 2.0//", "-//O'Reilly and Associates//DTD HTML Extended 1.0//",
                            "-//O'Reilly and Associates//DTD HTML Extended Relaxed 1.0//", '-//SQ//DTD HTML 2.0 HoTMetaL + extensions//', '-//SoftQuad Software//DTD HoTMetaL PRO 6.0::19990601::extensions to HTML 4.0//',
                            '-//SoftQuad//DTD HoTMetaL PRO 4.0::19971010::extensions to HTML 4.0//', '-//Spyglass//DTD HTML 2.0 Extended//', '-//Sun Microsystems Corp.//DTD HotJava HTML//',
                            '-//Sun Microsystems Corp.//DTD HotJava Strict HTML//', '-//W3C//DTD HTML 3 1995-03-24//', '-//W3C//DTD HTML 3.2 Draft//', '-//W3C//DTD HTML 3.2 Final//', '-//W3C//DTD HTML 3.2//',
                            '-//W3C//DTD HTML 3.2S Draft//', '-//W3C//DTD HTML 4.0 Frameset//', '-//W3C//DTD HTML 4.0 Transitional//', '-//W3C//DTD HTML Experimental 19960712//',
                            '-//W3C//DTD HTML Experimental 970421//', '-//W3C//DTD W3 HTML//', '-//W3O//DTD W3 HTML 3.0//', '-//WebTechs//DTD Mozilla HTML 2.0//', '-//WebTechs//DTD Mozilla HTML//'];
                        for (var i in arrayPublic2)
                            if (newNode.publicId.substr(0, arrayPublic2[i].length).toUpperCase() == arrayPublic2[i].toUpperCase())
                                return true;
                        arrayPublic2 = ['-//W3C//DTD HTML 4.01 Frameset//', '-//W3C//DTD HTML 4.01 Transitional//'];
                        for (var i in arrayPublic2)
                            if (newNode.systemId == null && newNode.publicId.substr(0, arrayPublic2[i].length).toUpperCase() == arrayPublic2[i].toUpperCase())
                                return true;
                        return false;
                    };
                    var flagStart2 = function () {
                        var arrayPublic2 = ['-//W3C//DTD XHTML 1.0 Frameset//', '-//W3C//DTD XHTML 1.0 Transitional//'];
                        for (var i in arrayPublic2)
                            if (newNode.publicId.substr(0, arrayPublic2[i].length).toUpperCase() == arrayPublic2[i].toUpperCase())
                                return true;
                        arrayPublic2 = ['-//W3C//DTD HTML 4.01 Frameset//', '-//W3C//DTD HTML 4.01 Transitional//'];
                        for (var i in arrayPublic2)
                            if (newNode.systemId != null && newNode.publicId.substr(0, arrayPublic2[i].length).toUpperCase() == arrayPublic2[i].toUpperCase())
                                return true;
                        return false;
                    };
                    var flagQuirks = token.flag || newNode.name != 'html' || arrayPublic.indexOf(newNode.publicId.toUpperCase()) != -1 || newNode.systemId.toUpperCase() == 'http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd'.toUpperCase() || flagStart();
                    if (modeList.document.type != 'iframe' && flagQuirks)
                        modeList.document.mode = 'quirks';
                    else if (modeList.document.type != 'iframe' && flagStart2())
                        modeList.document.mode = 'limited-quirks';
                    modeSup.switch('Before html');
                    break;
                default:
                    flag = true;
                    break;
            }
            if (flag) {
                if (modeList.document.type != 'iframe') {
                    modeSup.emitTag(new cls.tokenParEr('Invalid token: Not an iframe srcdoc document (PE118)'));
                    modeList.document.mode = 'quirks';
                }
                modeSup.reprocessIn('Before html');
            }
        },
        $$$before_html: function (token) { // Before html (12.2.5.4.2)
            var flag = false;
            switch (token.type) {
                case 'DOCTYPE':
                    modeSup.emitTag(new cls.tokenParEr('DOCTYPE token in the wrong place (PE119)'));
                    break;
                case 'Comment':
                    modeAlgo.insertComment(token, {target: modeList.document, mode: 'last'});
                    break;
                case 'Character':
                    var tempList = ['\u0009', '\u000A', '\u000C', '\u000D', '\u0020'];
                    if (tempList.indexOf(token.data) == -1)
                        flag = true;
                    break;
                case 'StartTag':
                    if (token.name == 'html') {
                        var newNode = modeAlgo.createElement(modeList.document, nsEl['html'], token);
                        modeSup.insertNode(modeList.document, newNode, 'last');
                        modeList.stackOpen.push(newNode);
                        // The navigation of a browsing context part is not handled
                        logs.push('\t\t The navigation of a browsing context part of this token is not handled')
                        modeSup.switch('Before head');
                    }
                    else
                        flag = true;
                    break;
                case 'EndTag':
                    if (['head', 'body', 'html', 'br'].indexOf(token.name) != -1)
                        flag = true;
                    else
                        modeSup.emitTag(new cls.tokenParEr('EndTag token in the wrong place (PE120)'));
                    break;
                default:
                    flag = true;
                    break;
            }
            if (flag) {
                var newNode = new cls.nodes('html', modeList.document);
                modeSup.insertNode(modeList.document, newNode, 'last');
                modeList.stackOpen.push(newNode);
                // The navigation of a browsing context part is not handled
                logs.push('\t\t The navigation of a browsing context part of this token is not handled')
                modeSup.reprocessIn('Before head');
            }
        },
        before_head: function (token) { // Before head (12.2.5.4.3)

        },
        in_head: function (token) { // In head (12.2.5.4.4)

        },
        in_head_noscript: function (token) { // In head noscript (12.2.5.4.5)

        },
        after_head: function (token) { // After head (12.2.5.4.6)

        },
        in_body: function (token) { // In body (12.2.5.4.7)

        },
        text: function (token) { // Text (12.2.5.4.8)

        },
        in_table: function (token) { // In table (12.2.5.4.9)

        },
        in_table_text: function (token) { // In table text (12.2.5.4.10)

        },
        in_caption: function (token) { // In caption (12.2.5.4.11)

        },
        in_column_group: function (token) { // In column group (12.2.5.4.12)

        },
        in_table_body: function (token) { // In table body (12.2.5.4.13)

        },
        in_row: function (token) { // In row (12.2.5.4.14)

        },
        in_cell: function (token) { // In cell (12.2.5.4.15)

        },
        in_select: function (token) { // In select (12.2.5.4.16)

        },
        in_select_in_table: function (token) { // In select in table (12.2.5.4.17)

        },
        in_template: function (token) { // In template (12.2.5.4.18)

        },
        after_body: function (token) { // After body (12.2.5.4.19)

        },
        in_frameset: function (token) { // In frameset (12.2.5.4.20)

        },
        after_frameset: function (token) { // After frameset (12.2.5.4.21)

        },
        after_after_body: function (token) { // After after body (12.2.5.4.22)

        },
        after_after_frameset: function (token) { // After after frameset (12.2.5.4.23)

        }
    };
}
catch (err) {
    console.log(err.stack);
    return ({err: err});
}

// Main function
function treeConstruction(modeListIn, currentInput, state) {
    try {
        // Start the function
        logs.push('Call function TREECONSTRUCTION (12.2.5) (treeconstruction.js)');

        // Initialising state
        logs.push('\tmodeList variable: ' + (modeListIn.mode.length == 0 ? 'empty. Set to default' : 'provided'));
        modeList = (modeListIn.mode.length == 0 ? modeList : modeListIn);
        modeList.mode.push(modeListIn.mode.length == 0 ? defaultMode : modeListIn.mode[modeListIn.mode.length - 1]);
        logs.push('\tTree construction stage starts from: The "' + modeSup.now() + '" insertion mode (' + modeRef[modeSup.convert(modeSup.now())][1] + ') ' + (modeListIn.mode.length == 0 ?
                '(initialisation)' : '(continuation)'));

        // Main process
        for (var i in state.emit) {
            var token = state.emit[i];
            logs.push('\tProcessing token: ' + JSON.stringify(token));
            var res = modeDef.preprocess(token);
            if (res) { // If the token is not a ParseError token
                res = modeAlgo.dispatcher(token);
                if (res) { // If not parsing fragment context
                    while (reProcess) {
                        reProcess = false;
                        modeDef[modeSup.convert(modeSup.now())](token);
                    }
                }
            }
        }

        // End of function
        logs.push('End function TREECONSTRUCTION');
        return ({emit: emit, mode: mode});
    }
    catch (err) {
        return ({err: err});
    }
}

module.exports = {
    modeAlgo: modeAlgo,
    modeDef: modeDef,
    modeSup: modeSup,
    treeConstruction: treeConstruction
}