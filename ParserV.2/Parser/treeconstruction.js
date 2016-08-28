// WHATWG ver. 22-06-2016
// Variable declaration
var cls = require('./class');
var tknz = require('./tokenization');
var tools = require('../Tools/tools');
var logs = [];
var pendingCharTable = [];
var returnMode = null;
var foster = false;
var reProcess = true;
var reProcess2 = true;
var specialTag = ['address', 'applet', 'area', 'article', 'aside', 'base', 'basefont', 'bgsound', 'blockquote', 'body',
    'br', 'button', 'caption', 'center', 'col', 'colgroup', 'dd', 'details', 'dir', 'div', 'dl', 'dt', 'embed', 'fieldset',
    'figcaption', 'figure', 'footer', 'form', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header',
    'hgroup', 'hr', 'html', 'iframe', 'img', 'input', 'isindex', 'li', 'link', 'listing', 'main', 'marquee', 'menu',
    'menuitem', 'meta', 'nav', 'noembed', 'noframes', 'noscript', 'object', 'ol', 'p', 'param', 'plaintext', 'pre', 'script',
    'section', 'select', 'source', 'style', 'summary', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th',
    'thead', 'title', 'tr', 'track', 'ul', 'wbr', 'and xmp; mi', 'mo', 'mn', 'ms', 'mtext', 'annotation-xml', 'foreignObject',
    'desc', 'title'];
var scopeEl = ['applet', 'caption', 'html', 'table', 'td', 'th', 'marquee', 'object', 'template', 'mi', 'mo', 'mn', 'ms',
    'mtext', 'annotation-xml', 'foreignObject', 'desc', 'title'];
var nsEl = {
    html: 'http://www.w3.org/1999/xhtml',
    mathml: 'http://www.w3.org/1998/Math/MathML',
    svg: 'http://www.w3.org/2000/svg',
    xlink: 'http://www.w3.org/1999/xlink',
    xml: 'http://www.w3.org/XML/1998/namespace',
    xmlns: 'http://www.w3.org/2000/xmlns/'
};
var defaultMode = 'Initial';
var scriptFlag = false;
var insertionPoint = null;
var stream;
var currentInput;
var state;

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
var modeList = {
    mode: [defaultMode],
    listFormat: [],
    stackOpen: [],
    stackTemplate: [],
    adjustedNode: function () {
        if (this.fragmentParse && this.stackOpen.length == 1)
            return this.context;
        else
            return this.stackOpen[this.stackOpen.length - 1];
    },
    document: new cls.documents('root'),
    framesetFlag: 'ok',
    headPointer: null,
    formPointer: null,
    stateNew: null,
    ignoreTokenFlag: false,
    emit: [],
    context: null,
    fragmentParse: false
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
            if (token.constructor.name == 'tokenParEr')
                logs.push('\t\tParse error: ' + token.data);
            modeList.emit.push(token);
        },
        switch: function (newMode) {
            modeList.mode.push(newMode);
            logs.push('\tSwitch to The "' + newMode + '" insertion mode (' + modeRef[this.convert(newMode)][1] + ')');
        },
        reprocessIn: function (newMode) {
            logs.push('\t\tReprocess the token in The ' + (newMode == null ? 'same: "' + this.now() : '"' + newMode) + '" insertion mode (' + modeRef[this.convert((newMode == null ? this.now() : newMode))][1] + ')');
            reProcess = true;
            if (newMode != null)
                this.switch(newMode);
        },
        usingRules: function (mode, token) {
            var main = this.now();
            logs.push('\t\tUsing the rules for The "' + mode + '" insertion mode (' + modeRef[this.convert(mode)][1] + ') to process token: ' + JSON.stringify(token));
            modeDef[this.convert(mode)](token);
            logs.push('\t\tGo back to the original insertion mode: The "' + main + '" insertion mode (' + modeRef[this.convert(main)][1] + ')' + (this.now() != main ? '. Insertion mode changed to: The "' + this.now() + '" insertion mode (' + modeRef[this.convert(this.now())][1] + ')' : ''));
        },
        switchTemp: function (newMode, reprocess, retMode) {
            returnMode = (retMode == null ? this.now() : retMode);
            if (reprocess)
                reProcess = true;
            modeList.mode.push(newMode);
            logs.push('\tSwitch temporary to The "' + newMode + '" insertion mode (' + modeRef[this.convert(newMode)][1] + '), with return mode The "' + returnMode + '" insertion mode (' + modeRef[this.convert(returnMode)][1] + ')');
        },
        preprocess: function (token) {
            logs.push('\tRun Preprocess function');
            switch (token.type) {
                case 'ParseError':
                    logs.push('\t\tParseError token: skip token');
                    return false;
                    break;
                case 'DOCTYPE':
                    return true;
                    break;
                case 'StartTag':
                case 'EndTag':
                    if (token.name.indexOf(':') == -1)
                        token.namespace = nsEl['html'];
                    else {
                        var pos = token.name.lastIndexOf(':');
                        token.namespace = token.name.substr(0, pos);
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
                    if (token.attribute == null)
                        token.attribute = [];
                    if (token.attribute.length > 0) {
                        var tempAttr = {};
                        for (var i in token.attribute)
                            tempAttr[token.attribute[i].name] = token.attribute[i].value;
                        token.attribute = tempAttr;
                        logs.push('\t\tToken attribute(s) converted from array to object: ' + JSON.stringify(token.attribute));
                    }
                    else
                        token.attribute = {};
                    return true;
                    break;
                case 'Character':
                case 'Comment':
                case 'End-of-file':
                    logs.push('\t\t' + token.type + ' token. Nothing to be preprocessed');
                    return true;
                    break;
                default:
                    logs.push('\t\tInvalid token type: ' + token.type + '. Ignore the token');
                    return false;
                    break;
            }
        },
        isMathMLIntegration: function (node) {
            var list = ['mi', 'mo', 'mn', 'ms', 'mtext'];
            return (list.indexOf(node.type) != -1);
        },
        isMathMLAnnotation: function (node) {
            return (node.type == 'annotation-xml');
        },
        isHTMLIntegration: function (node) {
            return ((this.isMathMLAnnotation(node) && node.token.type == 'StartTag' && (node.token.attribute['encoding'].toLowerCase() == 'text/html' ||
            node.token.attribute['encoding'].toLowerCase() == 'application/xhtml+xml')) || node.type == 'foreignObject' || node.type == 'desc' ||
            node.type == 'title');
        },
        insertNode: function (target, newNode, mode) {
            // if (currentInput == 54) {
            //     // console.log(target.type + " " + mode + " " + newNode.type);
            //     // console.log(newNode);
            // }
            logs.push('\tCall Insert node function');
            // console.log('111 ' + newNode.type);
            logs.push('\t\tInsert ' + newNode.type.toProperCase() + ' element to ' + target.type.toProperCase() + ' element. Mode: ' + mode);
            if (mode == 'first' || mode == 'last') {
                newNode.parent = target;
                if (target.lastChild.type == null) {
                    target.firstChild = newNode;
                    target.lastChild = newNode;
                }
                else if (mode == 'first') {
                    target.firstChild.prev = newNode;
                    newNode.next = target.firstChild;
                    target.firstChild = newNode;
                }
                else {
                    // if (currentInput == 54) // console.log('ok');
                    target.lastChild.next = newNode;
                    newNode.prev = target.lastChild;
                    target.lastChild = newNode;
                }
            }
            else {
                newNode.parent = target.parent;
                if (mode == 'before') {
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
                else if (mode == 'after') {
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
            return newNode;
        },
        acknowledgeSelfClose: function (token) {
            logs.push('\tCall Acknowledge the tokens self-closing flag function');
            if (token.type == 'StartTag' && !token.flag)
                this.emitTag(new cls.tokenParEr('Self-closing flag is not acknowledged (PE125)'));
            else if (token.type == 'EndTag' && token.flag)
                this.emitTag(new cls.tokenParEr('Self-closing flag in end tag token (PE252)'));
        },
        removeNode: function (node) {
            logs.push('\tCall Remove node function');
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
            else if (node.parent.lastChild == node) {
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
            return node;
        },
        getNextToken: function () {
            logs.push('\tCall Get next token function');
            var res = tknz.tokenization(stream, currentInput, (modeList.stateNew == null ? state : modeList.stateNew), modeList.adjustedNode());
            return res.state.emit;
        }

    };
    var modeAlgo = {
        dispatcher: function (token) {
            logs.push('\tRun Tree construction dispatcher (12.2.5)');
            var adjustTemp = modeList.adjustedNode() == null ? {} : modeList.adjustedNode();
            if (modeList.stackOpen.length == 0 || adjustTemp.namespace == nsEl['html'] || (modeSup.isMathMLIntegration(adjustTemp) &&
                ((token.type == 'StartTag' && token.name != 'mglyph' && token.name != 'malignmark') || (token.type == 'Character'))) ||
                (modeSup.isMathMLAnnotation(adjustTemp) && token.type == 'StartTag' && token.name == 'svg') ||
                (modeSup.isHTMLIntegration(adjustTemp) && (token.type == 'StartTag' || token.type == 'Character')) ||
                token.type == 'End-of-file') {
                logs.push('\t\tProcess normally');
                return true;
            }
            else {
                logs.push('\tCall The rules for parsing tokens in foreign content (12.2.5.5)');
                return (modeDef.parsing_foreign_content);
            }
            // logs.push('\tEnd Tree construction dispatcher (12.2.5)');
        },
        insertComment: function (token, position) {
            logs.push('\tCall Insert comment algorithm:');
            logs.push('\t\tToken: ' + JSON.stringify(token) + ', position: ' + (position == null ? 'not provided' : 'provided'));
            var data = token.data;
            var adjustInsert = (position != null ? position : this.appropriateInsert());
            var newNode = new cls.nodes('comment', adjustInsert.target.document, token.namespace, token);
            newNode.data = data;
            modeSup.insertNode(adjustInsert.target, newNode, adjustInsert.mode);
        },
        appropriateInsert: function (override) {
            logs.push('\tCall Appropriate insert algorithm:');
            logs.push('\t\tOverride: ' + (override == null ? 'not provided' : 'provided'));
            var target = override != null ? override : modeSup.currentNode();
            var adjusted = (function () {
                if (foster && ['table', 'tbody', 'tfoot', 'thead', 'tr'].indexOf(target.type) != -1) {
                    var lastTemplate = null;
                    var lastTable = null;
                    for (var i in modeList.stackOpen) {
                        if (modeList.stackOpen[i].type == 'template')
                            lastTemplate = i;
                        if (modeList.stackOpen[i].type == 'table')
                            lastTable = i;
                    }
                    if (lastTemplate != null && (lastTable == null || (lastTable != null && lastTemplate > lastTable)))
                        return {target: modeList.stackOpen[lastTemplate], mode: 'last'};
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
            if (adjusted.target.type == 'template' && adjusted.mode == 'last')
                adjusted.target = adjusted.target; // --> If needed to change to Contents
            else if (adjusted.target.parent.type == 'template' && adjusted.mode == 'before')
                adjusted = {target: adjusted.target.parent, mode: 'last'};
            // console.log(adjusted.target == null ? '333 ' + adjusted : '222 ' + adjusted.target.type);
            // Improvisation: NO CONTENTS ON THE TEMPLATE ELEMENT!
            return adjusted;
        },
        createElement: function (parent, namespace, token) {
            function lookupCustomEl(document, namespace, localName, is) {
                logs.push('\tCall Lookup custom element function:');
                logs.push('\t\tThis function is not yet supported. Return to main function');
                return null;
            }

            function createAnEl(document, localName, namespace, prefix, is, syncFlag, token) {
                logs.push('\tCall Creating an element function:');
                logs.push('\t\tThis function is not yet supported. Return to main function');
                return (new cls.nodes(token.name, parent.document, namespace, token)); // !Improvisation
            }

            function reset(element) {
                logs.push('\tCall Reset algorithm:');
                logs.push('\t\tThis algorithm is not yet supported. Return to main function');
            }

            function noTemplate() {
                for (var i in modeList.stackOpen)
                    if (modeList.stackOpen[i].type == 'template')
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
            var execScript = (definition != null && !modeList.fragmentParse);
            if (execScript)
                logs.push('\t\tScript execution is not yet supported');
            var element = createAnEl(document, localName, namespace, null, is, execScript, token);
            logs.push('\t\tAssigning HTMLUnknownElement process is not yet supported');
            element.attribute = token.attribute;
            if (execScript)
                logs.push('\t\tScript execution is not yet supported');
            if ((element.attribute['xmlns'] != null && element.attribute['xmlns'] != element.namespace) || (element.attribute['xmlns:xlink'] != null && element.attribute['xmlns:xlink'] != nsEl['xlink']))
                modeSup.emitTag(new cls.tokenParEr('Invalid XMLNS attribute on the element (PE124)'));
            if (['input', 'keygen', 'output', 'select', 'textarea'].indexOf(element.type) != -1)
                reset(element);
            if (['button', 'fieldset', 'input', 'keygen', 'object', 'output', 'select', 'textarea', 'img'].indexOf(element.type) != -1 &&
                modeList.formPointer != null && noTemplate() && (['button', 'fieldset', 'input', 'keygen', 'object', 'output',
                    'select', 'textarea'].indexOf(element.type) == -1 || token.attribute['form'] == null) && isSameHomeTree(parent, modeList.formPointer))
                element.formOwner = modeList.formPointer;
            return element;
        },
        insertHTMLElement: function (token) {
            logs.push('\tCall Insert an HTML element function');
            return this.insertForeignElement(token, nsEl['html']);
        },
        insertForeignElement: function (token, namespace) {
            logs.push('\tCall Insert a foreign element function');
            var adjustInsert = this.appropriateInsert();
            var newNode = this.createElement(adjustInsert.mode == 'last' ? adjustInsert.target : adjustInsert.target.parent, namespace, token);
            modeSup.insertNode(adjustInsert.target, newNode, adjustInsert.mode);
            modeList.stackOpen.push(newNode);
            return newNode;
        },
        insertCharacter: function (character) {
            logs.push('\tCall Insert a character function');
            var data = character;
            // console.log('111 ' + character);
            var adjustInsert = this.appropriateInsert();
            // console.log(adjustInsert);
            var type = (adjustInsert.mode == 'last' ? adjustInsert.target.constructor.name : adjustInsert.target.parent.constructor.name);
            if (type == 'documents')
                return;
            if (adjustInsert.mode == 'last')
                var prevEl = adjustInsert.target.lastChild;
            else if (adjustInsert.mode == 'before')
                var prevEl = adjustInsert.target.prev;
            if (prevEl != null && prevEl.type == 'text')
                prevEl.data += data;
            else {
                var newNode = new cls.nodes('text', adjustInsert.target.document, null, new cls.tokenCharCom('Character', character));
                newNode.data = data;
                modeSup.insertNode(adjustInsert.target, newNode, adjustInsert.mode);
            }
        },
        genericParsing: function (token, mode) {
            logs.push('\tCall Generic ' + mode + ' element parsing algorithm');
            this.insertHTMLElement(token);
            modeList.stateNew = mode.toUpperCase() + ' state';
            modeSup.switchTemp('Text');
        },
        insertMarker: function () {
            logs.push('\tCall Insert a marker at the end of the list of active formatting elements');
            modeList.listFormat.push(new cls.nodes('marker'));
        },
        generateAllImpliedEndTags: function () {
            logs.push('\tCall Generate all implied end tags thoroughly function');
            var list = ['caption', 'colgroup', 'dd', 'dt', 'li', 'optgroup', 'option', 'p', 'rb', 'rp', 'rt', 'rtc', 'tbody',
                'td', 'tfoot', 'th', 'thead', 'tr'];
            while (true) {
                if (list.indexOf(modeSup.currentNode().type) != -1)
                    modeList.stackOpen.pop();
                else
                    break;
            }
        },
        generateImpliedEndTags: function (exceptTag) {
            logs.push('\tCall Generate implied end tags function');
            var list = ['dd', 'dt', 'li', 'menuitem', 'optgroup', 'option', 'p', 'rb', 'rp', 'rt', 'rtc'];
            if (exceptTag != null)
                list.splice(list.indexOf(exceptTag), 1);
            while (true) {
                if (list.indexOf(modeSup.currentNode().type) != -1)
                    modeList.stackOpen.pop();
                else
                    break;
            }
        },
        clearActiveFormat: function () {
            logs.push('\tCall Clear the list of active formatting elements up to the last marker function');
            while (true) {
                if (modeList.listFormat.pop().type == 'marker')
                    break;
            }
        },
        resetModeAppropriately: function () {
            logs.push('\tCall Reset the insertion mode appropriately function');
            var last = false;
            var node = modeSup.currentNode();
            loop:
                while (true) {
                    if (node == modeList.stackOpen[0]) {
                        last = true;
                        if (modeList.fragmentParse)
                            node = modeList.context;
                    }
                    if (node.type == 'select') {
                        if (!last) {
                            var ancestor = node;
                            while (true) {
                                if (ancestor == modeList.stackOpen[0])
                                    break;
                                else {
                                    ancestor = modeList.stackOpen[modeList.stackOpen.indexOf(ancestor) - 1];
                                    if (ancestor.type == 'template')
                                        break;
                                    else if (ancestor.type == 'table') {
                                        modeSup.switch('In select in table');
                                        break loop;
                                    }
                                }
                            }
                        }
                        modeSup.switch('In select');
                        break;
                    }
                    if (['td', 'th'].indexOf(node.type) != -1 && !last) {
                        modeSup.switch('In cell');
                        break;
                    }
                    if (node.type == 'tr') {
                        modeSup.switch('In row');
                        break;
                    }
                    if (['tbody', 'thead', 'tfoot'].indexOf(node.type) != -1) {
                        modeSup.switch('In table body');
                        break;
                    }
                    if (node.type == 'caption') {
                        modeSup.switch('In caption');
                        break;
                    }
                    if (node.type == 'colgroup') {
                        modeSup.switch('In column group');
                        break;
                    }
                    if (node.type == 'table') {
                        modeSup.switch('In table');
                        break;
                    }
                    if (node.type == 'template') {
                        modeSup.switch(modeSup.currentTemplate());
                        break;
                    }
                    if (node.type == 'head' && !last) {
                        modeSup.switch('In head');
                        break;
                    }
                    if (node.type == 'body') {
                        modeSup.switch('In body');
                        break;
                    }
                    if (node.type == 'frameset') {
                        modeSup.switch('In frameset');
                        break;
                    }
                    if (node.type == 'html') {
                        if (modeList.headPointer == null)
                            modeSup.switch('Before head');
                        else
                            modeSup.switch('After head');
                        break;
                    }
                    if (last) {
                        modeSup.switch('In body');
                        break;
                    }
                    node = modeList.stackOpen[modeList.stackOpen.indexOf(node) - 1];
                }
        },
        hasSpecificScope: function (tag, list, except) {
            logs.push('\tCall Have an element target node in a specific scope function');
            var node = modeSup.currentNode();
            while (true) {
                if (node.type == tag)
                    return true;
                else if ((list.indexOf(node.type) != -1 && except != true) || (list.indexOf(node.type) == -1 && except))
                    return false;
                else
                    node = modeList.stackOpen[modeList.stackOpen.indexOf(node) - 1];
            }
        },
        hasTableScope: function (tag) {
            logs.push('\tCall Have a particular element in table scope function');
            return this.hasSpecificScope(tag, ['html', 'table', 'template']);
        },
        hasSelectScope: function (tag) {
            logs.push('\tCall Have a particular element in select scope function');
            return this.hasSpecificScope(tag, ['optgroup', 'option'], true);
        },
        stopParsing: function () {
            logs.push('\tCall function Stop Parsing (12.2.6)');
            modeList.document.readiness = 'interactive';
            insertionPoint = null;
            modeList.stackOpen.splice(0, modeList.stackOpen.length);
            logs.push('\t\tScript, spin, queue a task sections are currently not supported');
            logs.push('\tEnd function Tree Construction');
        },
        clearTableContext: function () {
            logs.push('\tCall Clear the stack back to a table context function');
            var list = ['table', 'template', 'html'];
            while (true) {
                if (list.indexOf(modeSup.currentNode().type) != -1)
                    break;
                modeList.stackOpen.pop();
            }
        },
        clearTableBody: function () {
            logs.push('\tCall Clear the stack back to a table body context function');
            var list = ['tbody', 'tfoot', 'thead', 'template', 'html'];
            while (true) {
                if (list.indexOf(modeSup.currentNode().type) != -1)
                    break;
                modeList.stackOpen.pop();
            }
        },
        clearTableRow: function () {
            logs.push('\tCall Clear the stack back to a table row context function');
            var list = ['tr', 'template', 'html'];
            while (true) {
                if (list.indexOf(modeSup.currentNode().type) != -1)
                    break;
                modeList.stackOpen.pop();
            }
        },
        closeCell: function () {
            logs.push('\tCall Close the cell function');
            this.generateImpliedEndTags();
            if (['td', 'th'].indexOf(modeSup.currentNode().type) == -1)
                modeSup.emitTag(new cls.tokenParEr('Current node is not td or th element (PE168)'));
            while (true) {
                if (['td', 'th'].indexOf(modeList.stackOpen.pop().type) != -1)
                    break;
            }
            this.clearActiveFormat();
            modeSup.switch('In row');
        },
        reconstructActiveFormat: function () {
            function lastEntry() {
                return modeList.listFormat[modeList.listFormat.length - 1];
            }

            function flag(entry) {
                for (var i in modeList.stackOpen)
                    if (entry == modeList.stackOpen[i])
                        return true;
                return false;
            }

            logs.push('\tCall Reconstruct the active formatting elements function');
            if (modeList.listFormat.length == 0)
                return;
            if (lastEntry().type == 'marker' || flag(lastEntry()))
                return;
            var entry = lastEntry();
            var flagCreate = false;
            while (true) {
                if (entry == modeList.listFormat[0]) {
                    flagCreate = true;
                    break;
                }
                entry = modeList.listFormat[modeList.listFormat.indexOf(entry) - 1];
                if (!(entry.type == 'marker' || flag(entry)))
                    continue;
                break;
            }
            while (true) {
                if (!flagCreate)
                    entry = modeList.listFormat[modeList.listFormat.indexOf(entry) + 1];
                flagCreate = false;
                var newElement = this.insertHTMLElement(entry.token);
                modeList.listFormat.splice(modeList.listFormat.indexOf(entry), 1, newElement);
                entry = newElement;
                if (newElement != lastEntry())
                    continue;
                break;
            }
        },
        hasButtonScope: function (tag) {
            logs.push('\tCall Have a particular element in button scope function');
            return this.hasSpecificScope(tag, scopeEl.concat('button'));
        },
        hasElementScope: function (tag) {
            logs.push('\tCall Have a particular element in scope function');
            return this.hasSpecificScope(tag, scopeEl);
        },
        hasListScope: function (tag) {
            logs.push('\tCall Have a particular element in list scope function');
            return this.hasSpecificScope(tag, scopeEl.concat('ol', 'ul'));
        },
        closePElement: function () {
            logs.push('\tCall Close a p element function');
            this.generateImpliedEndTags('p');
            if (modeSup.currentNode().type != 'p')
                modeSup.emitTag(new cls.tokenParEr('Current node is not p element (PE208)'));
            while (true) {
                if (modeList.stackOpen.pop().type == 'p')
                    break;
            }
        },
        adjustMathMLAttr: function (token) {
            logs.push('\tCall Adjust MathML attributes');
            for (var key in token.attribute)
                if (key.toLowerCase() == 'definitionurl' && key != 'definitionURL') {
                    token.attribute['definitionURL'] = token.attribute[key];
                    delete token.attribute[key];
                    break;
                }
        },
        adjustSVGAttr: function (token) {
            logs.push('\tCall Adjust SVG attributes');
            var list = ['attributeName', 'attributeType', 'baseFrequency', 'baseProfile', 'calcMode', 'clipPathUnits', 'diffuseConstant',
                'edgeMode', 'filterUnits', 'glyphRef', 'gradientTransform', 'gradientUnits', 'kernelMatrix', 'kernelUnitLength',
                'keyPoints', 'keySplines', 'keyTimes', 'lengthAdjust', 'limitingConeAngle', 'markerHeight', 'markerUnits', 'markerWidth',
                'maskContentUnits', 'maskUnits', 'numOctaves', 'pathLength', 'patternContentUnits', 'patternTransform', 'patternUnits',
                'pointsAtX', 'pointsAtY', 'pointsAtZ', 'preserveAlpha', 'preserveAspectRatio', 'primitiveUnits', 'refX', 'refY',
                'repeatCount', 'repeatDur', 'requiredExtensions', 'requiredFeatures', 'specularConstant', 'specularExponent',
                'spreadMethod', 'startOffset', 'stdDeviation', 'stitchTiles', 'surfaceScale', 'systemLanguage', 'tableValues',
                'targetX', 'targetY', 'textLength', 'viewBox', 'viewTarget', 'xChannelSelector', 'yChannelSelector', 'zoomAndPan'];
            var listLow = [];
            for (var i in list)
                listLow[i] = list[i].toLowerCase();
            for (var key in token.attribute) {
                var pos = listLow.indexOf(key.toLowerCase());
                if (pos != -1 && list[pos] != key) {
                    token.attribute[list[pos]] = token.attribute[key];
                    delete token.attribute[key];
                }
            }
        },
        adjustForeignAttr: function (token) {
            logs.push('\tCall Adjust Foreign attributes');
            var list = ['xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type',
                'xml:lang', 'xml:space', 'xmlns', 'xmlns:xlink'];
            for (var key in token.attribute) {
                var pos = list.indexOf(key.toLowerCase());
                if (pos != -1) {
                    delete token.attribute[key];
                    var value = list[pos].split(':');
                    token.attribute[list[pos]] = {
                        prefix: value.length > 1 ? value[0] : null,
                        localName: value.length > 1 ? value[1] : value[0],
                        namespace: nsEl[value[0]],
                        value: list[pos]
                    };
                }
            }
        },
        pushListFormat: function (element) {
            logs.push('\tCall Push onto the list of active formatting elements function');
            var lastMarker = 0;
            for (var i in modeList.listFormat)
                if (modeList.listFormat[modeList.listFormat.length - i - 1].type == 'marker') {
                    lastMarker = modeList.listFormat.length - i;
                    break;
                }
            var cnt = [0, []];
            for (var i = lastMarker; i < modeList.listFormat.length; i++) {
                if (modeList.listFormat[i].type == element.type && modeList.listFormat[i].namespace == element.namespace &&
                    Object.keys(modeList.listFormat[i].attribute).length == Object.keys(element.attribute).length) {
                    var flag = true;
                    for (var j in element.attribute)
                        if (modeList.listFormat[i].attribute[j] != element.attribute[j])
                            flag = false;
                    if (flag) {
                        cnt[0]++;
                        cnt[1].push(i);
                    }
                }
            }
            if (cnt[0] >= 3) {
                var cntTemp = cnt[0] - 3;
                for (var i = cntTemp; i >= 0; i--)
                    modeList.listFormat.splice(cnt[1][i], 1);
            }
            modeList.listFormat.push(element);
        },
        adoptionAgency: function (subject) {
            logs.push('\tCall Adoption agency algorithm');
            if (modeSup.currentNode().type == subject && modeList.listFormat.indexOf(modeSup.currentNode()) == -1) {
                modeList.stackOpen.pop();
                return;
            }
            var outerLoopN = 0;
            while (true) {
                if (outerLoopN >= 8)
                    return;
                outerLoopN++;
                var formatEl = (function () {
                    var elem = -1;
                    var marker = 0;
                    for (var i in modeList.listFormat)
                        if (modeList.listFormat[modeList.listFormat.length - i - 1].type == 'marker') {
                            marker = modeList.listFormat.length - i - 1;
                            break;
                        }
                    for (var i = marker + 1; i < modeList.listFormat.length; i++)
                        if (modeList.listFormat[i].type == subject)
                            elem = i;
                    if (elem >= 0)
                        return modeList.listFormat[elem];
                })();
                if (formatEl == null)
                    return -1;
                else if (modeList.stackOpen.indexOf(formatEl) == -1) {
                    modeSup.emitTag(new cls.tokenParEr('Formatting element is not in the stack (PE209)'));
                    modeList.listFormat.splice(modeList.listFormat.indexOf(formatEl), 1);
                    return;
                }
                else if (modeList.stackOpen.indexOf(formatEl) != -1 && !this.hasElementScope(formatEl.type)) {
                    modeSup.emitTag(new cls.tokenParEr('Formatting element is not in scope (PE210)'));
                    return;
                }
                else if (formatEl != modeSup.currentNode())
                    modeSup.emitTag(new cls.tokenParEr('Formatting element is not current node (PE212)'));
                var furthestBlock = (function () {
                    for (var i = modeList.stackOpen.indexOf(formatEl) + 1; i < modeList.stackOpen.length; i++)
                        if (specialTag.indexOf(modeList.stackOpen[i].type) != -1)
                            return modeList.stackOpen[i];
                })();
                if (furthestBlock == null) {
                    while (true) {
                        if (modeList.stackOpen.pop() == formatEl)
                            break;
                    }
                    modeList.listFormat.splice(modeList.listFormat.indexOf(formatEl), 1);
                    return;
                }
                var commonAncestor = modeList.stackOpen[modeList.stackOpen.indexOf(formatEl) - 1];
                var bookmark = modeList.listFormat.indexOf(formatEl);
                var node = furthestBlock;
                var lastNode = furthestBlock;
                var innerLoopN = 0;
                var removeNode = [];
                var removeNode2 = [];
                while (true) {
                    innerLoopN++;
                    var posTemp = modeList.stackOpen.indexOf(node);
                    if (posTemp != -1)
                        node = modeList.stackOpen[posTemp - 1];
                    else {
                        node = modeList.stackOpen[removeNode[0] - 1];
                        removeNode = [];
                        removeNode2 = [];
                    }
                    if (node == formatEl)
                        break;
                    if (innerLoopN > 3 && modeList.listFormat.indexOf(node) != -1) {
                        removeNode2 = [modeList.listFormat.indexOf(node), node];
                        modeList.listFormat.splice(modeList.listFormat.indexOf(node), 1);
                    }
                    if (modeList.listFormat.indexOf(node) == -1) {
                        removeNode = [modeList.stackOpen.indexOf(node), node];
                        modeList.stackOpen.splice(modeList.stackOpen.indexOf(node), 1);
                        continue;
                    }
                    var newNode = this.createElement(commonAncestor, nsEl['html'], node.token);
                    if (modeList.listFormat.indexOf(node) != -1) {
                        removeNode2 = [modeList.listFormat.indexOf(node), node];
                        modeList.listFormat.splice(modeList.listFormat.indexOf(node), 1, newNode);
                    }
                    else
                        modeList.listFormat.splice(removeNode2[0], 0, newNode);
                    if (modeList.stackOpen.indexOf(node) != -1) {
                        removeNode = [modeList.stackOpen.indexOf(node), node];
                        modeList.stackOpen.splice(modeList.stackOpen.indexOf(node), 1, newNode);
                    }
                    else
                        modeList.stackOpen.splice(removeNode[0], 0, newNode);
                    node = newNode;
                    if (lastNode == furthestBlock)
                        bookmark = modeList.listFormat.indexOf(node) + 1;
                    modeSup.removeNode(lastNode);
                    modeSup.insertNode(node, lastNode, 'last');
                    lastNode = node;
                }
                var insertTemp = this.appropriateInsert(commonAncestor);
                // if (currentInput == 54) // console.log('----------');
                modeSup.insertNode(insertTemp.target, lastNode, insertTemp.mode);
                // if (currentInput == 54) // console.log('----------');
                var newEl = this.createElement(furthestBlock, nsEl['html'], formatEl.token);
                // console.log(furthestBlock);
                if (furthestBlock.firstChild.type != null)
                    while (true) {
                        var rem = modeSup.removeNode(furthestBlock.firstChild);
                        modeSup.insertNode(newEl, rem, 'last');
                        if (furthestBlock.firstChild.type == null)
                            break;
                    }
                // console.log(furthestBlock);
                modeSup.insertNode(furthestBlock, newEl, 'last');
                modeList.listFormat.splice(modeList.listFormat.indexOf(formatEl), 1);
                modeList.listFormat.splice(bookmark, 0, newEl);
                modeList.stackOpen.splice(modeList.stackOpen.indexOf(formatEl), 1);
                modeList.stackOpen.splice(modeList.stackOpen.indexOf(furthestBlock) + 1, 0, newEl);
            }
        }
    };
    var modeDef = {
        initial: function (token) { // Initial (12.2.5.4.1)
            var flag = false;
            switch (token.type) {
                case 'Character':
                    switch (token.data) {
                        case '\u0009':
                        case '\u000A':
                        case '\u000C':
                        case '\u000D':
                        case '\u0020':
                            logs.push('\t\tIgnore the token');
                            break;
                        default:
                            flag = true;
                            break;
                    }
                    break;
                case 'Comment':
                    modeAlgo.insertComment(token, {target: modeList.document, mode: 'last'});
                    break;
                case 'DOCTYPE':
                    var flagDOC = token.name == 'html' && ((token.publicId == '-//W3C//DTD HTML 4.0//EN' && (token.systemId == null ||
                        token.systemId == 'http://www.w3.org/TR/REC-html40/strict.dtd' || token.systemId == 'http://www.w3.org/TR/html4/strict.dtd'))
                        || (token.publicId == '-//W3C//DTD XHTML 1.0 Strict//EN' && token.systemId == 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd') ||
                        (token.publicId == '-//W3C//DTD XHTML 1.1//EN' && token.systemId == 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'));
                    if (token.name != 'html' || token.publicId != null || (token.systemId != null && token.systemId != 'about:legacy-compat') || !flagDOC)
                        modeSup.emitTag(new cls.tokenParEr('Invalid DOCTYPE token (PE117)'));
                    var newNode = new cls.nodes('DocumentType', modeList.document, token.namespace, token);
                    modeSup.insertNode(modeList.document, newNode, 'last');
                    newNode.name = token.name != null ? token.name : '';
                    newNode.publicId = token.publicId != null ? token.publicId : '';
                    newNode.systemId = token.systemId != null ? token.systemId : '';
                    // console.log(newNode);
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
                    var flagQuirks = newNode.flag == 'on' || newNode.name != 'html' || arrayPublic.indexOf(newNode.publicId.toUpperCase()) != -1 || newNode.systemId.toUpperCase() == 'http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd'.toUpperCase() || flagStart();
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
        before_html: function (token) { // Before html (12.2.5.4.2)
            var flag = false;
            switch (token.type) {
                case 'DOCTYPE':
                    modeSup.emitTag(new cls.tokenParEr('DOCTYPE token in the wrong place. Ignore the token (PE119)'));
                    break;
                case 'Comment':
                    modeAlgo.insertComment(token, {target: modeList.document, mode: 'last'});
                    break;
                case 'Character':
                    switch (token.data) {
                        case '\u0009':
                        case '\u000A':
                        case '\u000C':
                        case '\u000D':
                        case '\u0020':
                            break;
                        default:
                            flag = true;
                            break;
                    }
                    break;
                case 'StartTag':
                    switch (token.name) {
                        case 'html':
                            var newNode = modeAlgo.createElement(modeList.document, nsEl['html'], token);
                            modeSup.insertNode(modeList.document, newNode, 'last');
                            modeList.stackOpen.push(newNode);
                            // The navigation of a browsing context part is not handled
                            logs.push('\t\t The navigation of a browsing context part is not yet supported');
                            modeSup.switch('Before head');
                            break;
                        default:
                            flag = true;
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'head':
                        case 'body':
                        case 'html':
                        case 'br':
                            flag = true;
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('End tag token in the wrong place. Ignore the token (PE120)'));
                            break;
                    }
                    break;
                default:
                    flag = true;
                    break;
            }
            if (flag) {
                var newNode = new cls.nodes('html', modeList.document, nsEl['html'], new cls.tokenTag('StartTag', 'html'));
                modeSup.insertNode(modeList.document, newNode, 'last');
                modeList.stackOpen.push(newNode);
                // The navigation of a browsing context part is not handled
                logs.push('\t\t The navigation of a browsing context part is not yet supported');
                modeSup.reprocessIn('Before head');
            }
        },
        before_head: function (token) { // Before head (12.2.5.4.3)
            var flag = false;
            switch (token.type) {
                case 'DOCTYPE':
                    modeSup.emitTag(new cls.tokenParEr('DOCTYPE token before head element. Ignore the token (PE121)'));
                    break;
                case 'Comment':
                    modeAlgo.insertComment(token);
                    break;
                case 'Character':
                    switch (token.data) {
                        case '\u0009':
                        case '\u000A':
                        case '\u000C':
                        case '\u000D':
                        case '\u0020':
                            break;
                        default:
                            flag = true;
                            break;
                    }
                    break;
                case 'StartTag':
                    switch (token.name) {
                        case 'html':
                            modeSup.usingRules('In body', token);
                            break;
                        case 'head':
                            var newNode = modeAlgo.insertHTMLElement(token);
                            modeList.headPointer = newNode;
                            modeSup.switch('In head');
                            break;
                        default:
                            flag = true;
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'head':
                        case 'body':
                        case 'html':
                        case 'br':
                            flag = true;
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('End tag token in a wrong place. Ignore the token (PE122)'));
                            break;
                    }
                    break;
                default:
                    flag = true;
                    break;
            }
            if (flag) {
                var newNode = modeAlgo.insertHTMLElement(new cls.tokenTag('StartTag', 'head'));
                modeList.headPointer = newNode;
                modeSup.reprocessIn('In head');
            }
        },
        in_head: function (token) { // In head (12.2.5.4.4)
            var flag = false;

            switch (token.type) {
                case 'DOCTYPE':
                    modeSup.emitTag(new cls.tokenParEr('DOCTYPE token in head (PE123)'));
                    break;
                case 'Comment':
                    modeAlgo.insertComment(token);
                    break;
                case 'Character':
                    switch (token.data) {
                        case '\u0009':
                        case '\u000A':
                        case '\u000C':
                        case '\u000D':
                        case '\u0020':
                            modeAlgo.insertCharacter(token.data);
                            break;
                        default:
                            flag = true;
                            break;
                    }
                    break;
                case 'StartTag':
                    switch (token.name) {
                        case 'html':
                            modeSup.usingRules('In body', token);
                            break;
                        case 'base':
                        case 'basefont':
                        case 'bgsound':
                        case 'link':
                            modeAlgo.insertHTMLElement(token);
                            modeList.stackOpen.pop();
                            modeSup.acknowledgeSelfClose(token);
                            break;
                        case 'meta':
                            modeAlgo.insertHTMLElement(token);
                            modeList.stackOpen.pop();
                            modeSup.acknowledgeSelfClose(token);
                            logs.push('\t\tMeta token in head: Currently not supported. Skip the process');
                            break;
                        case 'title':
                            modeAlgo.genericParsing(token, 'RCDATA');
                            break;
                        case 'noscript':
                            if (scriptFlag)
                                modeAlgo.genericParsing(token, 'RAWTEXT');
                            else {
                                modeAlgo.insertHTMLElement(token);
                                modeSup.switch('In head noscript');
                            }
                            break;
                        case 'noframes':
                        case 'style':
                            modeAlgo.genericParsing(token, 'RAWTEXT');
                            break;
                        case 'script':
                            var adjustInsert = modeAlgo.appropriateInsert();
                            var newNode = modeAlgo.createElement(adjustInsert.mode == 'last' ? adjustInsert.target : adjustInsert.target.parent, nsEl['html'], token);
                            newNode.parserInserted = true;
                            newNode.nonBlocking = false;
                            if (modeList.fragmentParse)
                                newNode.alreadyStarted = true;
                            modeSup.insertNode(adjustInsert.mode == 'last' ? adjustInsert.target : adjustInsert.target.parent, newNode, adjustInsert.mode);
                            modeList.stackOpen.push(newNode);
                            modeList.stateNew = 'Script data state';
                            modeSup.switchTemp('Text');
                            break;
                        case 'template':
                            modeAlgo.insertHTMLElement(token);
                            modeAlgo.insertMarker();
                            modeList.framesetFlag = 'not ok';
                            modeSup.switch('In template');
                            modeList.stackTemplate.push('In template');
                            break;
                        case 'head':
                            modeSup.emitTag(new cls.tokenParEr('Head token in head. Ignore the token (PE126)'));
                            break;
                        default:
                            flag = true;
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'head':
                            modeList.stackOpen.pop();
                            modeSup.switch('After head');
                            break;
                        case 'body':
                        case 'html':
                        case 'br':
                            flag = true;
                            break;
                        case 'template':
                            var flag2 = false;
                            for (var i in modeList.stackOpen)
                                if (modeList.stackOpen[i].type == 'template') {
                                    flag2 = true;
                                    break;
                                }
                            if (!flag2)
                                modeSup.emitTag(new cls.tokenParEr('Template end token without the start token. Ignore the token (PE127)'));
                            else {
                                modeAlgo.generateAllImpliedEndTags();
                                if (modeSup.currentNode().type != 'template')
                                    modeSup.emitTag(new cls.tokenParEr('End token of Template but not the current node (PE128)'));
                                while (true) {
                                    if (modeList.stackOpen.pop().type == 'template')
                                        break;
                                }
                                modeAlgo.clearActiveFormat();
                                modeList.stackTemplate.pop();
                                modeAlgo.resetModeAppropriately();
                            }
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid end tag token in head. Ignore the token (PE129)'));
                            break;
                    }
                    break;
                default:
                    flag = true;
                    break;
            }
            if (flag) {
                modeList.stackOpen.pop();
                modeSup.reprocessIn('After head');
            }
        },
        in_head_noscript: function (token) { // In head noscript (12.2.5.4.5)
            var flag = false;
            switch (token.type) {
                case 'DOCTYPE':
                    modeSup.emitTag(new cls.tokenParEr('DOCTYPE token in head noscript. Ignore the token (PE130)'));
                    break;
                case 'Comment':
                    modeSup.usingRules('In head', token);
                    break;
                case 'Character':
                    switch (token.data) {
                        case '\u0009':
                        case '\u000A':
                        case '\u000C':
                        case '\u000D':
                        case '\u0020':
                            modeSup.usingRules('In head', token);
                            break;
                        default:
                            flag = true;
                            break;
                    }
                    break;
                case 'StartTag':
                    switch (token.name) {
                        case 'html':
                            modeSup.usingRules('In body', token);
                            break;
                        case 'basefont':
                        case 'bgsound':
                        case 'link':
                        case 'meta':
                        case 'noframes':
                        case 'style':
                            modeSup.usingRules('In head', token);
                            break;
                        case 'head':
                        case 'noscript':
                            modeSup.emitTag(new cls.tokenParEr('Invalid start tag token in head noscript. Ignore the token (PE131)'));
                            break;
                        default:
                            flag = true;
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'noscript':
                            modeList.stackOpen.pop();
                            modeSup.switch('In head');
                            break;
                        case 'br':
                            flag = true;
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid end tag token in head noscript. Ignore the token (PE132)'));
                            break;
                    }
                    break;
                default:
                    flag = true;
                    break;
            }
            if (flag) {
                modeSup.emitTag(new cls.tokenParEr('Invalid token in head noscript (PE133)'));
                modeList.stackOpen.pop();
                modeSup.reprocessIn('In head');
            }
        },
        after_head: function (token) { // After head (12.2.5.4.6)
            var flag = false;
            switch (token.type) {
                case 'DOCTYPE':
                    modeSup.emitTag(new cls.tokenParEr('DOCTYPE token after head. Ignore the token (PE134)'));
                    break;
                case 'Comment':
                    modeAlgo.insertComment(token);
                    break;
                case 'Character':
                    switch (token.data) {
                        case '\u0009':
                        case '\u000A':
                        case '\u000C':
                        case '\u000D':
                        case '\u0020':
                            modeAlgo.insertCharacter(token.data);
                            break;
                        default:
                            flag = true;
                            break;
                    }
                    break;
                case 'StartTag':
                    switch (token.name) {
                        case 'html':
                            modeSup.usingRules('In body', token);
                            break;
                        case 'body':
                            modeAlgo.insertHTMLElement(token);
                            modeList.framesetFlag = 'not ok';
                            modeSup.switch('In body');
                            break;
                        case 'frameset':
                            modeAlgo.insertHTMLElement(token);
                            modeSup.switch('In frameset');
                            break;
                        case 'base':
                        case 'basefont':
                        case 'bgsound':
                        case 'link':
                        case 'meta':
                        case 'noframes':
                        case 'script':
                        case 'style':
                        case 'template':
                        case 'title':
                            modeSup.emitTag(new cls.tokenParEr('Invalid start tag token (PE135)'));
                            modeList.stackOpen.push(modeList.headPointer);
                            modeSup.usingRules('In head', token);
                            modeList.stackOpen.splice(modeList.stackOpen.indexOf(modeList.headPointer), 1);
                            break;
                        case 'head':
                            modeSup.emitTag(new cls.tokenParEr('Head token after head. Ignore the token (PE136)'));
                            break;
                        default:
                            flag = true;
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'template':
                            modeSup.usingRules('In head', token);
                            break;
                        case 'body':
                        case 'html':
                        case 'br':
                            flag = true;
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid end tag token. Ignore the token (PE206)'));
                            break;
                    }
                    break;
                default:
                    flag = true;
                    break;
            }
            if (flag) {
                modeAlgo.insertHTMLElement(new cls.tokenTag('StartTag', 'body'));
                modeSup.reprocessIn('In body');
            }
        },
        in_body: function (token) { // In body (12.2.5.4.7)
            var flag = false;

            function flagBody() {
                for (var i in modeList.stackOpen)
                    if (['dd', 'dt', 'li', 'menuitem', 'optgroup', 'option', 'p', 'rb', 'rp', 'rt', 'rtc', 'tbody',
                            'td', 'tfoot', 'th', 'thead', 'tr', 'body', 'html'].indexOf(modeList.stackOpen[i].type) == -1)
                        return true;
                return false;
            }

            function flagTemplate() {
                for (var i in modeList.stackOpen)
                    if (modeList.stackOpen[i].type == 'template')
                        return true;
                return false;
            }

            switch (token.type) {
                case 'DOCTYPE':
                    modeSup.emitTag(new cls.tokenParEr('DOCTYPE token in body. Ignore the token (PE213)'));
                    break;
                case 'Comment':
                    modeAlgo.insertComment(token);
                    break;
                case 'Character':
                    switch (token.data) {
                        case '\u0000':
                            modeSup.emitTag(new cls.tokenParEr('NULL character token in body. Ignore the token (PE214)'));
                            break;
                        case '\u0009':
                        case '\u000A':
                        case '\u000C':
                        case '\u000D':
                        case '\u0020':
                            modeAlgo.reconstructActiveFormat();
                            modeAlgo.insertCharacter(token.data);
                            break;
                        default:
                            modeAlgo.reconstructActiveFormat();
                            modeAlgo.insertCharacter(token.data);
                            modeList.framesetFlag = 'not ok';
                            break;
                    }
                    break;
                case 'StartTag':
                    switch (token.name) {
                        case 'html':
                            modeSup.emitTag(new cls.tokenParEr('Html token in body (PE215)'));
                            if (!flagTemplate()) {
                                for (var i in token.attribute)
                                    if (modeList.stackOpen[0].attribute[i] == null)
                                        modeList.stackOpen[0].attribute[i] = token.attribute[i];
                            }
                            break;
                        case 'base':
                        case 'basefont':
                        case 'bgsound':
                        case 'link':
                        case 'meta':
                        case 'noframes':
                        case 'script':
                        case 'style':
                        case 'template':
                        case 'title':
                            modeSup.usingRules('In head', token);
                            break;
                        case 'body':
                            modeSup.emitTag(new cls.tokenParEr('Body token in body (PE216)'));
                            if (!(modeList.stackOpen[1].type != 'body' || modeList.stackOpen.length == 1 || flagTemplate())) {
                                modeList.framesetFlag = 'not ok';
                                for (var i in token.attribute)
                                    if (modeList.stackOpen[1].attribute[i] == null)
                                        modeList.stackOpen[1].attribute[i] = token.attribute[i];
                            }
                            break;
                        case 'frameset':
                            modeSup.emitTag(new cls.tokenParEr('Frameset token in body (PE217)'));
                            if (!(modeList.stackOpen.length == 1 || modeList.stackOpen[1].type != 'body' || modeList.framesetFlag == 'not ok')) {
                                if (modeList.stackOpen[1].parent != null)
                                    modeSup.removeNode(modeList.stackOpen[1]);
                                while (true) {
                                    if (modeSup.currentNode().type == 'html')
                                        break;
                                    modeList.stackOpen.pop();
                                }
                                modeAlgo.insertHTMLElement(token);
                                modeSup.switch('In frameset');
                            }
                            break;
                        case 'address':
                        case 'article':
                        case 'aside':
                        case 'blockquote':
                        case 'center':
                        case 'details':
                        case 'dialog':
                        case 'dir':
                        case 'div':
                        case 'dl':
                        case 'fieldset':
                        case 'figcaption':
                        case 'figure':
                        case 'footer':
                        case 'header':
                        case 'hgroup':
                        case 'main':
                        case 'nav':
                        case 'ol':
                        case 'p':
                        case 'section':
                        case 'summary':
                        case 'ul':
                            if (modeAlgo.hasButtonScope('p'))
                                modeAlgo.closePElement();
                            modeAlgo.insertHTMLElement(token);
                            break;
                        case 'menu':
                            if (modeAlgo.hasButtonScope('p'))
                                modeAlgo.closePElement();
                            if (modeSup.currentNode().type == 'menuitem')
                                modeList.stackOpen.pop();
                            modeAlgo.insertHTMLElement(token);
                            break;
                        case 'h1':
                        case 'h2':
                        case 'h3':
                        case 'h4':
                        case 'h5':
                        case 'h6':
                            if (modeAlgo.hasButtonScope('p'))
                                modeAlgo.closePElement();
                            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].indexOf(modeSup.currentNode().type) != -1) {
                                modeSup.emitTag(new cls.tokenParEr('Current node is a heading element (PE218)'));
                                modeList.stackOpen.pop();
                            }
                            modeAlgo.insertHTMLElement(token);
                            break;
                        case 'pre':
                        case 'listing':
                            if (modeAlgo.hasButtonScope('p'))
                                modeAlgo.closePElement();
                            modeAlgo.insertHTMLElement(token);
                            var nextToken = modeSup.getNextToken();
                            if (nextToken.type == 'Character' && nextToken.data == '\u000A')
                                modeList.ignoreTokenFlag = true;
                            modeList.framesetFlag = 'not ok';
                            break;
                        case 'form':
                            if (modeList.formPointer != null && !flagTemplate())
                                modeSup.emitTag(new cls.tokenParEr('Form pointer not null and no template element in stack. Ignore the token (PE219)'));
                            else {
                                if (modeAlgo.hasButtonScope('p'))
                                    modeAlgo.closePElement();
                                var newNode = modeAlgo.insertHTMLElement(token);
                                if (!flagTemplate())
                                    modeList.formPointer = newNode;
                            }
                            break;
                        case 'li':
                            modeList.framesetFlag = 'not ok';
                            var node = modeSup.currentNode();
                            while (true) {
                                if (node.type == 'li') {
                                    modeAlgo.generateImpliedEndTags('li');
                                    if (modeSup.currentNode().type != 'li')
                                        modeSup.emitTag(new cls.tokenParEr('Current node is not a li element (PE220)'));
                                    while (true) {
                                        if (modeList.stackOpen.pop().type == 'li')
                                            break;
                                    }
                                }
                                else if (!(specialTag.indexOf(node.type) != -1 && ['address', 'div', 'p'].indexOf(node.type) == -1)) {
                                    node = modeList.stackOpen[modeList.stackOpen.indexOf(node) - 1];
                                    continue;
                                }
                                if (modeAlgo.hasButtonScope('p'))
                                    modeAlgo.closePElement();
                                modeAlgo.insertHTMLElement(token);
                                break;
                            }
                            break;
                        case 'dd':
                        case 'dt':
                            modeList.framesetFlag = 'not ok';
                            var node = modeSup.currentNode();
                            while (true) {
                                if (node.type == token.name) {
                                    modeAlgo.generateImpliedEndTags(token.name);
                                    if (modeSup.currentNode().type != token.name)
                                        modeSup.emitTag(new cls.tokenParEr('Current node is not a dd or dt element (PE221)'));
                                    while (true) {
                                        if (modeList.stackOpen.pop().type == token.name)
                                            break;
                                    }
                                }
                                else if (!(specialTag.indexOf(node.type) != -1 && ['address', 'div', 'p'].indexOf(node.type) == -1)) {
                                    node = modeList.stackOpen[modeList.stackOpen.indexOf(node) - 1];
                                    continue;
                                }
                                if (modeAlgo.hasButtonScope('p'))
                                    modeAlgo.closePElement();
                                modeAlgo.insertHTMLElement(token);
                                break;
                            }
                            break;
                        case 'plaintext':
                            if (modeAlgo.hasButtonScope('p'))
                                modeAlgo.closePElement();
                            modeAlgo.insertHTMLElement(token);
                            modeList.stateNew = 'PLAINTEXT state';
                            break;
                        case 'button':
                            if (modeAlgo.hasElementScope('button')) {
                                modeSup.emitTag(new cls.tokenParEr('Stack has button element in scope (PE223)'));
                                modeAlgo.generateImpliedEndTags();
                                while (true) {
                                    if (modeList.stackOpen.pop().type == 'button')
                                        break;
                                }
                            }
                            modeAlgo.reconstructActiveFormat();
                            modeAlgo.insertHTMLElement(token);
                            modeList.framesetFlag = 'not ok';
                            break;
                        case 'a':
                            var lastMarker = 0;
                            for (var i in modeList.listFormat)
                                if (modeList.listFormat[modeList.listFormat.length - i - 1].type == 'marker') {
                                    lastMarker = modeList.listFormat.length - i - 1;
                                    break;
                                }
                            var flag2 = -1;
                            for (var i = lastMarker; i < modeList.listFormat.length; i++)
                                if (modeList.listFormat[i].type == 'a') {
                                    flag2 = i;
                                    break;
                                }
                            if (flag2 != -1) {
                                var posTemp = modeList.stackOpen.indexOf(modeList.listFormat[flag2]);
                                var nodeTemp = [modeList.listFormat[flag2], modeList.stackOpen[posTemp]];
                                modeSup.emitTag(new cls.tokenParEr('List active format contains a element (PE224)'));
                                var resAdopt = modeAlgo.adoptionAgency('a');
                                if (resAdopt == -1)
                                    flag = true;
                                else {
                                    if (modeList.listFormat[flag2] == nodeTemp[0]) {
                                        if (modeList.stackOpen[posTemp] == nodeTemp[1])
                                            modeList.stackOpen.splice(posTemp, 1);
                                        modeList.listFormat.splice(flag2, 1);
                                    }
                                }
                            }

                            modeAlgo.reconstructActiveFormat();
                            var newNode = modeAlgo.insertHTMLElement(token);
                            modeAlgo.pushListFormat(newNode);
                            break;
                        case 'b':
                        case 'big':
                        case 'code':
                        case 'em':
                        case 'font':
                        case 'i':
                        case 's':
                        case 'small':
                        case 'strike':
                        case 'strong':
                        case 'tt':
                        case 'u':
                            modeAlgo.reconstructActiveFormat();
                            var newNode = modeAlgo.insertHTMLElement(token);
                            modeAlgo.pushListFormat(newNode);
                            break;
                        case 'nobr':
                            modeAlgo.reconstructActiveFormat();
                            var resAdopt;
                            if (modeAlgo.hasElementScope('nobr')) {
                                modeSup.emitTag(new cls.tokenParEr('Stack has nobr in element scope (PE225)'));
                                if (currentInput == 54) {
                                    // console.log(tools.treeViewer(modeList.document));
                                }
                                resAdopt = modeAlgo.adoptionAgency('nobr');
                                if (resAdopt == -1)
                                    flag = true;
                                else
                                    modeAlgo.reconstructActiveFormat();
                            }
                            if (resAdopt != -1) {
                                var newNode = modeAlgo.insertHTMLElement(token);
                                modeAlgo.pushListFormat(newNode)
                            }
                            break;
                        case 'applet':
                        case 'marquee':
                        case 'object':
                            modeAlgo.reconstructActiveFormat();
                            modeAlgo.insertHTMLElement(token);
                            modeAlgo.insertMarker();
                            modeList.framesetFlag = 'not ok';
                            break;
                        case 'table':
                            if (modeList.document.mode != 'quirks' && modeAlgo.hasButtonScope('p'))
                                modeAlgo.closePElement();
                            modeAlgo.insertHTMLElement(token);
                            modeList.framesetFlag = 'not ok';
                            modeSup.switch('In table');
                            break;
                        case 'area':
                        case 'br':
                        case 'embed':
                        case 'img':
                        case 'keygen':
                        case 'wbr':
                            modeAlgo.reconstructActiveFormat();
                            modeAlgo.insertHTMLElement(token);
                            modeList.stackOpen.pop();
                            modeSup.acknowledgeSelfClose(token);
                            modeList.framesetFlag = 'not ok';
                            break;
                        case 'input':
                            modeAlgo.reconstructActiveFormat();
                            modeAlgo.insertHTMLElement(token);
                            modeList.stackOpen.pop();
                            modeSup.acknowledgeSelfClose(token);
                            if (token.attribute['type'] == null || token.attribute['type'].toLowerCase() != 'hidden')
                                modeList.framesetFlag = 'not ok';
                            break;
                        case 'param':
                        case 'source':
                        case 'track':
                            modeAlgo.insertHTMLElement(token);
                            modeList.stackOpen.pop();
                            modeSup.acknowledgeSelfClose(token);
                            break;
                        case 'hr':
                            if (modeAlgo.hasButtonScope('p'))
                                modeAlgo.closePElement();
                            if (modeSup.currentNode().type == 'menuitem')
                                modeList.stackOpen.pop();
                            modeAlgo.insertHTMLElement(token);
                            modeList.stackOpen.pop();
                            modeSup.acknowledgeSelfClose(token);
                            modeList.framesetFlag = 'not ok';
                            break;
                        case 'image':
                            modeSup.emitTag(new cls.tokenParEr('Token tag name is image (PE222)'));
                            token.name = 'img';
                            modeSup.reprocessIn();
                            break;
                        case 'textarea':
                            modeAlgo.insertHTMLElement(token);
                            var nextToken = modeSup.getNextToken();
                            // console.log(nextToken);
                            if (nextToken.type == 'Character' && nextToken.name == '\u000A') // Line feed character (LF)
                                modeList.ignoreTokenFlag = true;
                            modeList.stateNew = 'RCDATA state';
                            modeList.framesetFlag = 'not ok';
                            modeSup.switchTemp('Text');
                            break;
                        case 'xmp':
                            if (modeAlgo.hasButtonScope('p'))
                                modeAlgo.closePElement();
                            modeAlgo.reconstructActiveFormat();
                            modeList.framesetFlag = 'not ok';
                            modeAlgo.genericParsing(token, 'RawText');
                            break;
                        case 'iframe':
                            modeList.framesetFlag = 'not ok';
                            modeAlgo.genericParsing(token, 'RawText');
                            break;
                        case 'noembed':
                            modeAlgo.genericParsing(token, 'RawText');
                            break;
                        case 'noscript':
                            if (!scriptFlag)
                                flag = true;
                            else
                                modeAlgo.genericParsing(token, 'RawText');
                            break;
                        case 'select':
                            modeAlgo.reconstructActiveFormat();
                            modeAlgo.insertHTMLElement(token);
                            modeList.framesetFlag = 'not ok';
                            if (['In table', 'In caption', 'In table body', 'In row', 'In cell'].indexOf(modeSup.now()))
                                modeSup.switch('In select in table');
                            else
                                modeSup.switch('In select');
                            break;
                        case 'optgroup':
                        case 'option':
                            if (modeSup.currentNode().type == 'option')
                                modeList.stackOpen.pop();
                            modeAlgo.reconstructActiveFormat();
                            modeAlgo.insertHTMLElement(token);
                            break;
                        case 'menuitem':
                            if (modeSup.currentNode().type == 'menuitem')
                                modeList.stackOpen.pop();
                            modeAlgo.insertHTMLElement(token);
                            break;
                        case 'rb':
                        case 'rtc':
                            if (modeAlgo.hasElementScope('ruby'))
                                modeAlgo.generateImpliedEndTags();
                            if (modeSup.currentNode().type != 'ruby')
                                modeSup.emitTag(new cls.tokenParEr('Current node is not a ruby element (PE226)'));
                            modeAlgo.insertHTMLElement(token);
                            break;
                        case 'rp':
                        case 'rt':
                            if (modeAlgo.hasElementScope('ruby'))
                                modeAlgo.generateImpliedEndTags('rtc');
                            if (['rtc', 'ruby'].indexOf(modeSup.currentNode().type) == -1)
                                modeSup.emitTag(new cls.tokenParEr('Current node is not rtc or ruby element (PE227)'));
                            modeAlgo.insertHTMLElement(token);
                            break;
                        case 'math':
                            modeAlgo.reconstructActiveFormat();
                            modeAlgo.adjustMathMLAttr(token);
                            modeAlgo.adjustForeignAttr(token);
                            modeAlgo.insertForeignElement(token, nsEl['mathml']);
                            if (token.flag) {
                                modeList.stackOpen.pop();
                                modeSup.acknowledgeSelfClose(token);
                            }
                            break;
                        case 'svg':
                            modeAlgo.reconstructActiveFormat();
                            modeAlgo.adjustSVGAttr(token);
                            modeAlgo.adjustForeignAttr(token);
                            modeAlgo.insertForeignElement(token, nsEl['svg']);
                            if (token.flag) {
                                modeList.stackOpen.pop();
                                modeSup.acknowledgeSelfClose(token);
                            }
                            break;
                        case 'caption':
                        case 'col':
                        case 'colgroup':
                        case 'frame':
                        case 'head':
                        case 'tbody':
                        case 'td':
                        case 'tfoot':
                        case 'th':
                        case 'thead':
                        case 'tr':
                            modeSup.emitTag(new cls.tokenParEr('Invalid token in body. Ignore the token (PE228)'));
                            break;
                        default:
                            modeAlgo.reconstructActiveFormat();
                            modeAlgo.insertHTMLElement(token);
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'template':
                            modeSup.usingRules('In head', token);
                            break;
                        case 'body':
                            if (!modeAlgo.hasElementScope('body'))
                                modeSup.emitTag(new cls.tokenParEr('Stack has no body element in scope. Ignore the token (PE229)'));
                            else if (flagBody()) {
                                modeSup.emitTag(new cls.tokenParEr('There is exceptional node in stack (PE230)'));
                                modeSup.switch('After body');
                            }
                            break;
                        case 'html':
                            if (!modeAlgo.hasElementScope('body'))
                                modeSup.emitTag(new cls.tokenParEr('Stack has no body element in scope. Ignore the token (PE231)'));
                            else if (flagBody()) {
                                modeSup.emitTag(new cls.tokenParEr('There is exceptional node in stack (PE232)'));
                                modeSup.reprocessIn('After body');
                            }
                            break;
                        case 'address':
                        case 'article':
                        case 'aside':
                        case 'blockquote':
                        case 'button':
                        case 'center':
                        case 'details':
                        case 'dialog':
                        case 'dir':
                        case 'div':
                        case 'dl':
                        case 'fieldset':
                        case 'figcaption':
                        case 'figure':
                        case 'footer':
                        case 'header':
                        case 'hgroup':
                        case 'listing':
                        case 'main':
                        case 'menu':
                        case 'nav':
                        case 'ol':
                        case 'pre':
                        case 'section':
                        case 'summary':
                        case 'ul':
                            if (!modeAlgo.hasElementScope(token.name))
                                modeSup.emitTag(new cls.tokenParEr('No token element in scope. Ignore the token (PE233)'));
                            else {
                                modeAlgo.generateImpliedEndTags();
                                if (modeSup.currentNode().type != token.name)
                                    modeSup.emitTag(new cls.tokenParEr('Current node is not the token (PE234)'));
                                while (true) {
                                    if (modeList.stackOpen.pop().type == token.name)
                                        break;
                                }
                            }
                            break;
                        case 'form':
                            if (!flagTemplate()) {
                                var node = modeList.formPointer;
                                modeList.formPointer = null;
                                if (node == null || !modeAlgo.hasElementScope(node.type)) {
                                    modeSup.emitTag(new cls.tokenParEr('Node is null or no node element in scope. Ignore the token (PE235)'));
                                    break;
                                }
                                modeAlgo.generateImpliedEndTags();
                                if (modeSup.currentNode() != node)
                                    modeSup.emitTag(new cls.tokenParEr('Current node is not the node (PE236)'));
                                modeList.stackOpen.splice(modeList.stackOpen.indexOf(node), 1);
                            }
                            else {
                                if (!modeAlgo.hasElementScope('form')) {
                                    modeSup.emitTag(new cls.tokenParEr('No form element in scope. Ignore the token (PE237)'));
                                    break;
                                }
                                modeAlgo.generateImpliedEndTags();
                                if (modeSup.currentNode().type != 'form')
                                    modeSup.emitTag(new cls.tokenParEr('Current node is not a form element (PE238)'));
                                while (true) {
                                    if (modeList.stackOpen.pop().type == 'form')
                                        break;
                                }
                            }
                            break;
                        case 'p':
                            if (!modeAlgo.hasButtonScope('p')) {
                                modeSup.emitTag(new cls.tokenParEr('No p element in button scope (PE239)'));
                                modeAlgo.insertHTMLElement(new cls.tokenTag('StartTag', 'p'));
                            }
                            modeAlgo.closePElement();
                            break;
                        case 'li':
                            if (!modeAlgo.hasListScope('li'))
                                modeSup.emitTag(new cls.tokenParEr('No li element in list item scope. Ignore the token (PE240)'));
                            else {
                                modeAlgo.generateImpliedEndTags('li');
                                if (modeSup.currentNode().type != 'li')
                                    modeSup.emitTag(new cls.tokenParEr('Current node is not a li element (PE251)'));
                                while (true) {
                                    if (modeList.stackOpen.pop().type == 'li')
                                        break;
                                }
                            }
                            break;
                        case 'dd':
                        case 'dt':
                            if (!modeAlgo.hasElementScope(token.name))
                                modeSup.emitTag(new cls.tokenParEr('No token element in scope. Ignore the token (PE241)'));
                            else {
                                modeAlgo.generateImpliedEndTags(token.name);
                                if (modeSup.currentNode().type != token.name)
                                    modeSup.emitTag(new cls.tokenParEr('Current node is not the token element (PE242)'));
                                while (true) {
                                    if (modeList.stackOpen.pop().type == token.name)
                                        break;
                                }
                            }
                            break;
                        case 'h1':
                        case 'h2':
                        case 'h3':
                        case 'h4':
                        case 'h5':
                        case 'h6':
                            var arrH = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
                            var flag2 = false;
                            for (var i in arrH)
                                if (modeAlgo.hasElementScope(arrH[i]))
                                    flag2 = true;
                            if (!flag2)
                                modeSup.emitTag(new cls.tokenParEr('No heading element in scope. Ignore the token (PE243)'));
                            else {
                                modeAlgo.generateImpliedEndTags();
                                if (modeSup.currentNode().type != token.name)
                                    modeSup.emitTag(new cls.tokenParEr('Current node is not the token element (PE244)'));
                                while (true) {
                                    if (arrH.indexOf(modeList.stackOpen.pop().type) != -1)
                                        break;
                                }
                            }
                            break;
                        case 'a':
                        case 'b':
                        case 'big':
                        case 'code':
                        case 'em':
                        case 'font':
                        case 'i':
                        case 'nobr':
                        case 's':
                        case 'small':
                        case 'strike':
                        case 'strong':
                        case 'tt':
                        case 'u':
                            var resAdopt = modeAlgo.adoptionAgency(token.name);
                            if (resAdopt == -1)
                                flag = true;
                            break;
                        case 'applet':
                        case 'marquee':
                        case 'object':
                            if (!modeAlgo.hasElementScope(token.name))
                                modeSup.emitTag(new cls.tokenParEr('No token element in scope. Ignore the token (PE245)'));
                            else {
                                modeAlgo.generateImpliedEndTags();
                                if (modeSup.currentNode().type != token.name)
                                    modeSup.emitTag(new cls.tokenParEr('Current node is not the token element (PE246)'));
                                while (true) {
                                    if (modeList.stackOpen.pop().type == token.name)
                                        break;
                                }
                                modeAlgo.clearActiveFormat();
                            }
                            break;
                        case 'br':
                            modeSup.emitTag(new cls.tokenParEr('End tag br token in body (PE247)'));
                            token.attribute = {};
                            modeAlgo.reconstructActiveFormat();
                            modeAlgo.insertHTMLElement(token);
                            modeList.stackOpen.pop();
                            modeSup.acknowledgeSelfClose(token);
                            modeList.framesetFlag = 'not ok';
                            break;
                        default:
                            flag = true;
                            break;
                    }
                    break;
                case 'End-of-file':
                    if (modeList.stackTemplate.length != 0)
                        modeSup.usingRules('In template', token);
                    else {
                        if (flagBody())
                            modeSup.emitTag(new cls.tokenParEr('There is exceptional node in stack (PE248)'));
                        modeAlgo.stopParsing();
                    }
                    break;
            }
            if (flag) {
                var node = modeSup.currentNode();
                loop:
                    while (true) {
                        if (node.type == token.name) {
                            modeAlgo.generateImpliedEndTags(token.name);
                            if (node != modeSup.currentNode())
                                modeSup.emitTag(new cls.tokenParEr('Current node is not the node (PE249)'));
                            while (true) {
                                if (modeList.stackOpen.pop() == node)
                                    break loop;
                            }
                        }
                        else if (specialTag.indexOf(node.type) != -1) {
                            modeSup.emitTag(new cls.tokenParEr('Node is in special category (PE250)'));
                            break;
                        }
                        node = modeList.stackOpen[modeList.stackOpen.indexOf(node) - 1];
                    }
            }
        },
        text: function (token) { // Text (12.2.5.4.8)
            switch (token.type) {
                case 'Character':
                    modeAlgo.insertCharacter(token.data);
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'script':
                            logs.push('\t\tMicrotask checkpoint is currently not yet supported');
                            var script = modeList.stackOpen.pop();
                            modeSup.switch(returnMode);
                            returnMode = null;
                            logs.push('\t\tScript token on text insertion mode: Currently not supported. Skip the process');
                            break;
                        default:
                            modeList.stackOpen.pop();
                            modeSup.switch(returnMode);
                            returnMode = null;
                            break;
                    }
                    break;
                case 'End-of-file':
                    modeSup.emitTag(new cls.tokenParEr('EOF token on Text insertion mode (PE137)'));
                    if (modeSup.currentNode().type == 'script')
                        modeSup.currentNode().alreadyStarted = true;
                    modeList.stackOpen.pop();
                    modeSup.switch(returnMode);
                    reProcess = true;
                    returnMode = null;
                    return;
                    modeSup.reprocessIn(returnMode);
                    returnMode = null;
                    break;
            }
        },
        in_table: function (token) { // In table (12.2.5.4.9)
            var flag = false;
            switch (token.type) {
                case 'DOCTYPE':
                    modeSup.emitTag(new cls.tokenParEr('DOCTYPE token in table. Ignore the token (PE141)'));
                    break;
                case 'Comment':
                    modeAlgo.insertComment(token);
                    break;
                case 'Character':
                    if (['table', 'tbody', 'tfoot', 'thead', 'tr'].indexOf(modeSup.currentNode().type) != -1) {
                        pendingCharTable = [];
                        modeSup.switchTemp('In table text', true);
                    }
                    else
                        flag = true;
                    break;
                case 'StartTag':
                    switch (token.name) {
                        case 'caption':
                            modeAlgo.clearTableContext();
                            modeAlgo.insertMarker();
                            modeAlgo.insertHTMLElement(token);
                            modeSup.switch('In caption');
                            break;
                        case 'colgroup':
                            modeAlgo.clearTableContext();
                            modeAlgo.insertHTMLElement(token);
                            modeSup.switch('In column group');
                            break;
                        case 'col':
                            modeAlgo.clearTableContext();
                            modeAlgo.insertHTMLElement(new cls.tokenTag('StartTag', 'colgroup'));
                            modeSup.reprocessIn('In column group');
                            break;
                        case 'tbody':
                        case 'tfoot':
                        case 'thead':
                            modeAlgo.clearTableContext();
                            modeAlgo.insertHTMLElement(token);
                            modeSup.switch('In table body');
                            break;
                        case 'td':
                        case 'th':
                        case 'tr':
                            modeAlgo.clearTableContext();
                            modeAlgo.insertHTMLElement(new cls.tokenTag('StartTag', 'tbody'));
                            modeSup.reprocessIn('In table body');
                            break;
                        case 'table':
                            modeSup.emitTag(new cls.tokenParEr('Table token in table (PE142)'));
                            if (modeAlgo.hasTableScope('table')) {
                                while (true) {
                                    if (modeList.stackOpen.pop().type == 'table')
                                        break;
                                }
                                modeAlgo.resetModeAppropriately();
                                modeSup.reprocessIn();
                            }
                            break;
                        case 'style':
                        case 'script':
                        case 'template':
                            modeSup.usingRules('In head', token);
                            break;
                        case 'input':
                            if (token.attribute['type'] == null || token.attribute['type'].toLowerCase() != 'hidden')
                                flag = true;
                            else {
                                modeSup.emitTag(new cls.tokenParEr('Input token in table (PE143)'));
                                modeAlgo.insertHTMLElement(token);
                                modeList.stackOpen.pop();
                                modeSup.acknowledgeSelfClose(token);
                            }
                            break;
                        case 'form':
                            modeSup.emitTag(new cls.tokenParEr('Form token in table (PE144)'));
                            if (!(function () {
                                    for (var i in modeList.stackOpen)
                                        if (modeList.stackOpen[i].type == 'template')
                                            return true;
                                    return false;
                                })() && modeList.formPointer == null) {
                                modeList.formPointer = modeAlgo.insertHTMLElement(token);
                                modeList.stackOpen.pop();
                            }
                            break;
                        default:
                            flag = true;
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'table':
                            if (!modeAlgo.hasTableScope('table'))
                                modeSup.emitTag(new cls.tokenParEr('No table element in table scope. Ignore the token (PE145)'));
                            else {
                                while (true) {
                                    if (modeList.stackOpen.pop().type == 'table')
                                        break;
                                }
                                modeAlgo.resetModeAppropriately();
                            }
                            break;
                        case 'body':
                        case 'caption':
                        case 'col':
                        case 'colgroup':
                        case 'html':
                        case 'tbody':
                        case 'td':
                        case 'tfoot':
                        case 'th':
                        case 'thead':
                        case 'tr':
                            modeSup.emitTag(new cls.tokenParEr('Invalid token in table. Ignore the token (PE146)'));
                            break;
                        case 'template':
                            modeSup.usingRules('In head', token);
                            break;
                        default:
                            flag = true;
                            break;
                    }
                    break;
                case 'End-of-file':
                    modeSup.usingRules('In body', token);
                    break;
                default:
                    flag = true;
                    break;
            }
            if (flag) {
                modeSup.emitTag(new cls.tokenParEr('Invalid token in table (PE147)'));
                foster = true;
                modeSup.usingRules('In body', token);
                foster = false;
            }
        },
        in_table_text: function (token) { // In table text (12.2.5.4.10)
            switch (token.type) {
                case 'Character':
                    switch (token.data) {
                        case '\u0000':
                            modeSup.emitTag(new cls.tokenParEr('Invalid NULL character token. Ignore the token (PE138)'));
                            break;
                        default:
                            pendingCharTable.push(token);
                            break;
                    }
                    break;
                default:
                    var flag = false;
                    for (var i in pendingCharTable)
                        if (pendingCharTable[i].type == 'Character' && ['\u0020', '\u0009', '\u000A', '\u000C', '\u000D'].indexOf(pendingCharTable[i].data) == -1) {
                            flag = true;
                            break;
                        }
                    if (flag) {
                        modeSup.emitTag(new cls.tokenParEr('There is a not space character token. Reprocess the tokens in the pending list using "In Table anything else" rules (PE139)'));
                        for (var i in pendingCharTable) {
                            modeSup.emitTag(new cls.tokenParEr('Invalid token in table text (PE140)'));
                            foster = true;
                            modeSup.usingRules('In body', pendingCharTable[i]);
                            foster = false;
                        }
                    }
                    else
                        for (var i in pendingCharTable)
                            modeAlgo.insertCharacter(pendingCharTable[i].data);
                    modeSup.reprocessIn(returnMode);
                    returnMode = null;
                    break;
            }
        },
        in_caption: function (token) { // In caption (12.2.5.4.11)
            var flag = false;
            var flag2 = false;
            switch (token.type) {
                case 'StartTag':
                    switch (token.name) {
                        case 'caption':
                        case 'col':
                        case 'colgroup':
                        case 'tbody':
                        case 'td':
                        case 'tfoot':
                        case 'th':
                        case 'thead':
                        case 'tr':
                            flag = true;
                            flag2 = true;
                            break;
                        default:
                            modeSup.usingRules('In body', token);
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'caption':
                            flag = true;
                            break;
                        case 'table':
                            flag = true;
                            flag2 = true;
                            break;
                        case 'body':
                        case 'col':
                        case 'colgroup':
                        case 'html':
                        case 'tbody':
                        case 'td':
                        case 'tfoot':
                        case 'th':
                        case 'thead':
                        case 'tr':
                            modeSup.emitTag(new cls.tokenParEr('Invalid token in caption. Ignore the token (PE148)'));
                            break;
                        default:
                            modeSup.usingRules('In body', token);
                            break;
                    }
                    break;
                default:
                    modeSup.usingRules('In body', token);
                    break;
            }
            if (flag) {
                if (!modeAlgo.hasTableScope('caption'))
                    modeSup.emitTag(new cls.tokenParEr('No caption element in table scope. Ignore the token (PE149)'));
                else {
                    modeAlgo.generateImpliedEndTags();
                    if (modeSup.currentNode().type != 'caption')
                        modeSup.emitTag(new cls.tokenParEr('Current node is not a caption element (PE150)'));
                    while (true) {
                        if (modeList.stackOpen.pop().type == 'caption')
                            break;
                    }
                    modeAlgo.clearActiveFormat();
                    flag2 ? modeSup.reprocessIn('In table') : modeSup.switch('In table');
                }
            }
        },
        in_column_group: function (token) { // In column group (12.2.5.4.12)
            var flag = false;
            switch (token.type) {
                case 'DOCTYPE':
                    modeSup.emitTag(new cls.tokenParEr('DOCTYPE token in column group. Ignore the token (PE151)'));
                    break;
                case 'Comment':
                    modeAlgo.insertComment(token);
                    break;
                case 'Character':
                    switch (token.data) {
                        case '\u0009':
                        case '\u000A':
                        case '\u000C':
                        case '\u000D':
                        case '\u0020':
                            modeAlgo.insertCharacter(token.data);
                            break;
                        default:
                            flag = true;
                            break;
                    }
                    break;
                case 'StartTag':
                    switch (token.name) {
                        case 'html':
                            modeSup.usingRules('In body', token);
                            break;
                        case 'col':
                            modeAlgo.insertHTMLElement(token);
                            modeList.stackOpen.pop();
                            modeSup.acknowledgeSelfClose(token);
                            break;
                        case 'template':
                            modeSup.usingRules('In head', token);
                            break;
                        default:
                            flag = true;
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'colgroup':
                            if (modeSup.currentNode().type != 'colgroup')
                                modeSup.emitTag(new cls.tokenParEr('Current node is not a colgroup element. Ignore the token (PE152)'));
                            else {
                                modeList.stackOpen.pop();
                                modeSup.switch('In table');
                            }
                            break;
                        case 'col':
                            modeSup.emitTag(new cls.tokenParEr('Col end tag token in column group. Ignore the token (PE153)'));
                            break;
                        case 'template':
                            modeSup.usingRules('In head', token);
                            break;
                        default:
                            flag = true;
                            break;
                    }
                    break;
                case 'End-of-file':
                    modeSup.usingRules('In body', token);
                    break;
                default:
                    flag = true;
                    break;
            }
            if (flag) {
                if (modeSup.currentNode().type != 'colgroup')
                    modeSup.emitTag(new cls.tokenParEr('Current node is not a colgroup element. Ignore the token (PE154)'));
                else {
                    modeList.stackOpen.pop();
                    modeSup.reprocessIn('In table');
                }
            }
        },
        in_table_body: function (token) { // In table body (12.2.5.4.13)
            var flag = false;
            switch (token.type) {
                case 'StartTag':
                    switch (token.name) {
                        case 'tr':
                            modeAlgo.clearTableBody();
                            modeAlgo.insertHTMLElement(token);
                            modeSup.switch('In row');
                            break;
                        case 'th':
                        case 'td':
                            modeSup.emitTag(new cls.tokenParEr('Invalid token in table body (PE155)'));
                            modeAlgo.clearTableBody();
                            modeAlgo.insertHTMLElement(new cls.tokenTag('StartTag', 'tr'));
                            modeSup.reprocessIn('In row');
                            break;
                        case 'caption':
                        case 'col':
                        case 'colgroup':
                        case 'tbody':
                        case 'tfoot':
                        case 'thead':
                            flag = true;
                            break;
                        default:
                            modeSup.usingRules('In table', token);
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'tbody':
                        case 'tfoot':
                        case 'thead':
                            if (!modeAlgo.hasTableScope(token.name))
                                modeSup.emitTag(new cls.tokenParEr('No token element in table scope. Ignore the token (PE156)'));
                            else {
                                modeAlgo.clearTableBody();
                                modeList.stackOpen.pop();
                                modeSup.switch('In table');
                            }
                            break;
                        case 'table':
                            flag = true;
                            break;
                        case 'body':
                        case 'caption':
                        case 'col':
                        case 'colgroup':
                        case 'html':
                        case 'td':
                        case 'th':
                        case 'tr':
                            modeSup.emitTag(new cls.tokenParEr('Invalid end tag token in table body. Ignore the token (PE157)'));
                            break;
                        default:
                            modeSup.usingRules('In table', token);
                            break;
                    }
                    break;
                default:
                    modeSup.usingRules('In table', token);
                    break;
            }
            if (flag) {
                if (!modeAlgo.hasTableScope('tbody') || !modeAlgo.hasTableScope('thead') || !modeAlgo.hasTableScope('tfoot'))
                    modeSup.emitTag(new cls.tokenParEr('No table token element in table scope. Ignore the token (PE158)'));
                else {
                    modeAlgo.clearTableBody();
                    modeList.stackOpen.pop();
                    modeSup.reprocessIn('In table');
                }
            }
        },
        in_row: function (token) { // In row (12.2.5.4.14)
            var flag = false;
            switch (token.type) {
                case 'StartTag':
                    switch (token.name) {
                        case 'th':
                        case 'td':
                            modeAlgo.clearTableRow();
                            modeAlgo.insertHTMLElement(token);
                            modeSup.switch('In cell');
                            modeAlgo.insertMarker();
                            break;
                        case 'caption':
                        case 'col':
                        case 'colgroup':
                        case 'tbody':
                        case 'tfoot':
                        case 'thead':
                        case 'tr':
                            flag = true;
                            break;
                        default:
                            modeSup.usingRules('In table', token);
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'tr':
                            if (!modeAlgo.hasTableScope(token.name))
                                modeSup.emitTag(new cls.tokenParEr('No token element in table scope. Ignore the token (PE159)'));
                            else {
                                modeAlgo.clearTableRow();
                                modeList.stackOpen.pop();
                                modeSup.switch('In table body');
                            }
                            break;
                        case 'table':
                            flag = true;
                            break;
                        case 'tbody':
                        case 'tfoot':
                        case 'thead':
                            if (!modeAlgo.hasTableScope(token.name))
                                modeSup.emitTag(new cls.tokenParEr('No token element in table scope. Ignore the token (PE160)'));
                            else if (modeAlgo.hasTableScope('tr')) {
                                modeAlgo.clearTableRow();
                                modeList.stackOpen.pop();
                                modeSup.reprocessIn('In table body');
                            }
                            break;
                        case 'body':
                        case 'caption':
                        case 'col':
                        case 'colgroup':
                        case 'html':
                        case 'td':
                        case 'th':
                            modeSup.emitTag(new cls.tokenParEr('Invalid token in row. Ignore the token (PE161)'));
                            break;
                        default:
                            modeSup.usingRules('In table', token);
                            break;
                    }
                    break;
                default:
                    modeSup.usingRules('In table', token);
                    break;
            }
            if (flag) {
                if (!modeAlgo.hasTableScope('tr'))
                    modeSup.emitTag(new cls.tokenParEr('No tr element in table scope. Ignore the token (PE162)'));

                else {
                    modeAlgo.clearTableRow();
                    modeList.stackOpen.pop();
                    modeSup.reprocessIn('In table body');
                }
            }
        },
        in_cell: function (token) { // In cell (12.2.5.4.15)
            switch (token.type) {
                case 'StartTag':
                    switch (token.name) {
                        case 'caption':
                        case 'col':
                        case 'colgroup':
                        case 'tbody':
                        case 'td':
                        case 'tfoot':
                        case 'th':
                        case 'thead':
                        case 'tr':
                            if (!modeAlgo.hasTableScope('td') || !modeAlgo.hasTableScope('th'))
                                modeSup.emitTag(new cls.tokenParEr('No tr or th element in table scope. Ignore the token (PE163)'));
                            else {
                                modeAlgo.closeCell();
                                modeSup.reprocessIn();
                            }
                            break;
                        default:
                            modeSup.usingRules('In body', token);
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'td':
                        case 'th':
                            if (!modeAlgo.hasTableScope(token.name))
                                modeSup.emitTag(new cls.tokenParEr('No token element in table scope. Ignore the token (PE164)'));
                            else {
                                modeAlgo.generateImpliedEndTags();
                                if (modeSup.currentNode().type != token.name)
                                    modeSup.emitTag(new cls.tokenParEr('Current node name is not the same with the token name (PE165)'));
                                while (true) {
                                    if (modeList.stackOpen.pop().type == token.name)
                                        break;
                                }
                                modeAlgo.clearActiveFormat();
                                modeSup.switch('In row');
                            }
                            break;
                        case 'body':
                        case 'caption':
                        case 'col':
                        case 'colgroup':
                        case 'html':
                            modeSup.emitTag(new cls.tokenParEr('Invalid end tag token. Ignore the token (PE166)'));
                            break;
                        case 'table':
                        case 'tbody':
                        case 'tfoot':
                        case 'thead':
                        case 'tr':
                            if (!modeAlgo.hasTableScope(token.name))
                                modeSup.emitTag(new cls.tokenParEr('No token element in table scope. Ignore the token (PE167)'));
                            else {
                                modeAlgo.closeCell();
                                modeSup.reprocessIn();
                            }
                            break;
                        default:
                            modeSup.usingRules('In body', token);
                            break;
                    }
                    break;
                default:
                    modeSup.usingRules('In body', token);
                    break;
            }
        },
        in_select: function (token) { // In select (12.2.5.4.16)
            switch (token.type) {
                case 'DOCTYPE':
                    modeSup.emitTag(new cls.tokenParEr('DOCTYPE token in select. Ignore the token (PE207)'));
                    break;
                case 'Comment':
                    modeAlgo.insertComment(token);
                    break;
                case 'Character':
                    switch (token.data) {
                        case '\u0000':
                            modeSup.emitTag(new cls.tokenParEr('NULL character token in select. Ignore the token (PE169)'));
                            break;
                        default:
                            modeAlgo.insertCharacter(token.data);
                            break;
                    }
                    break;
                case 'StartTag':
                    switch (token.name) {
                        case 'html':
                            modeSup.usingRules('In body', token);
                            break;
                        case 'option':
                            if (modeSup.currentNode().type == 'option')
                                modeList.stackOpen.pop();
                            modeAlgo.insertHTMLElement(token);
                            break;
                        case 'optgroup':
                            if (modeSup.currentNode().type == 'option')
                                modeList.stackOpen.pop();
                            if (modeSup.currentNode().type == 'optgroup')
                                modeList.stackOpen.pop();
                            modeAlgo.insertHTMLElement(token);
                            break;
                        case 'select':
                            modeSup.emitTag(new cls.tokenParEr('Select token in select (PE170)'));
                            if (modeAlgo.hasSelectScope('select')) {
                                while (true) {
                                    if (modeList.stackOpen.pop().type == 'select')
                                        break;
                                }
                                modeAlgo.resetModeAppropriately();
                            }
                            break;
                        case 'input':
                        case 'keygen':
                        case 'textarea':
                            modeSup.emitTag(new cls.tokenParEr('Invalid token in select (PE171)'));
                            if (modeAlgo.hasSelectScope('select')) {
                                while (true) {
                                    if (modeList.stackOpen.pop().type == 'select')
                                        break;
                                }
                                modeAlgo.resetModeAppropriately();
                                modeSup.reprocessIn();
                            }
                            break;
                        case 'script':
                        case 'template':
                            modeSup.usingRules('In head', token);
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid start tag token. Ignore the token (PE172)'));
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'optgroup':
                            if (modeSup.currentNode().type == 'option' && modeList.stackOpen[modeList.stackOpen.length - 2].type == 'optgroup')
                                modeList.stackOpen.pop();
                            if (modeSup.currentNode().type == 'optgroup')
                                modeList.stackOpen.pop();
                            else
                                modeSup.emitTag(new cls.tokenParEr('Invalid optgroup token. Ignore the token (PE173)'));
                            break;
                        case 'option':
                            if (modeSup.currentNode().type == 'option')
                                modeList.stackOpen.pop();
                            else
                                modeSup.emitTag(new cls.tokenParEr('Invalid option token. Ignore the token (PE174)'));
                            break;
                        case 'select':
                            if (!modeAlgo.hasSelectScope('select'))
                                modeSup.emitTag(new cls.tokenParEr('No select element in select scope. Ignore the token (PE175)'));
                            else {
                                while (true) {
                                    if (modeList.stackOpen.pop().type == 'select')
                                        break;
                                }
                                modeAlgo.resetModeAppropriately();
                            }
                            break;
                        case 'template':
                            modeSup.usingRules('In head', token);
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid end tag token. Ignore the token (PE176)'));
                            break;
                    }
                    break;
                case 'End-of-file':
                    modeSup.usingRules('In body', token);
                    break;
                default:
                    modeSup.emitTag(new cls.tokenParEr('Invalid token. Ignore the token (PE177)'));
                    break;
            }
        },
        in_select_in_table: function (token) { // In select in table (12.2.5.4.17)
            switch (token.type) {
                case 'StartTag':
                    switch (token.name) {
                        case 'caption':
                        case 'table':
                        case 'tbody':
                        case 'tfoot':
                        case 'thead':
                        case 'tr':
                        case 'td':
                        case 'th':
                            modeSup.emitTag(new cls.tokenParEr('Invalid token in select in table (PE178)'));
                            while (true) {
                                if (modeList.stackOpen.pop().type == 'select')
                                    break;
                            }
                            modeAlgo.resetModeAppropriately();
                            modeSup.reprocessIn();
                            break;
                        default:
                            modeSup.usingRules('In select', token);
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'caption':
                        case 'table':
                        case 'tbody':
                        case 'tfoot':
                        case 'thead':
                        case 'tr':
                        case 'td':
                        case 'th':
                            modeSup.emitTag(new cls.tokenParEr('Invalid token in select in table (PE179)'));
                            if (modeAlgo.hasTableScope(token.name)) {
                                while (true) {
                                    if (modeList.stackOpen.pop().type == 'select')
                                        break;
                                }
                                modeAlgo.resetModeAppropriately();
                                modeSup.reprocessIn();
                            }
                            break;
                        default:
                            modeSup.usingRules('In select', token);
                            break;
                    }
                    break;
                default:
                    modeSup.usingRules('In select', token);
                    break;
            }
        },
        in_template: function (token) { // In template (12.2.5.4.18)
            switch (token.type) {
                case 'DOCTYPE':
                case 'Comment':
                case 'Character':
                    modeSup.usingRules('In body', token);
                    break;
                case 'StartTag':
                    switch (token.name) {
                        case 'base':
                        case 'basefont':
                        case 'bgsound':
                        case 'link':
                        case 'meta':
                        case 'noframes':
                        case 'script':
                        case 'style':
                        case 'template':
                        case 'title':
                            modeSup.usingRules('In head', token);
                            break;
                        case 'caption':
                        case 'colgroup':
                        case 'tbody':
                        case 'tfoot':
                        case 'thead':
                            modeList.stackTemplate.pop();
                            modeList.stackTemplate.push('In table');
                            modeSup.reprocessIn('In table');
                            break;
                        case 'col':
                            modeList.stackTemplate.pop();
                            modeList.stackTemplate.push('In column group');
                            modeSup.reprocessIn('In column group');
                            break;
                        case 'tr':
                            modeList.stackTemplate.pop();
                            modeList.stackTemplate.push('In table body');
                            modeSup.reprocessIn('In table body');
                            break;
                        case 'td':
                        case 'th':
                            modeList.stackTemplate.pop();
                            modeList.stackTemplate.push('In row');
                            modeSup.reprocessIn('In row');
                            break;
                        default:
                            modeList.stackTemplate.pop();
                            modeList.stackTemplate.push('In body');
                            modeSup.reprocessIn('In body');
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'template':
                            modeSup.usingRules('In head', token);
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid end tag token. Ignore the token (PE180)'));
                            break;
                    }
                    break;
                case 'End-of-file':
                    var flag = false;
                    for (var i in modeList.stackOpen)
                        if (modeList.stackOpen[i].type == 'template') {
                            flag = true;
                            break;
                        }
                    if (!flag)
                        modeAlgo.stopParsing();
                    else {
                        modeSup.emitTag(new cls.tokenParEr('There is template element on the stack of open elements (PE181)'));
                        while (true) {
                            if (modeList.stackOpen.pop().type == 'template')
                                break;
                        }
                        modeAlgo.clearActiveFormat();
                        modeList.stackTemplate.pop();
                        modeAlgo.resetModeAppropriately();
                        modeSup.reprocessIn();
                    }
            }
        },
        after_body: function (token) { // After body (12.2.5.4.19)
            switch (token.type) {
                case 'DOCTYPE':
                    modeSup.emitTag(new cls.tokenParEr('DOCTYPE token after body. Ignore the token (PE182)'));
                    break;
                case 'Comment':
                    modeAlgo.insertComment(token, {target: modeList.stackOpen[0], mode: 'last'});
                    break;
                case 'Character':
                    switch (token.data) {
                        case '\u0009':
                        case '\u000A':
                        case '\u000C':
                        case '\u000D':
                        case '\u0020':
                            modeSup.usingRules('In body', token);
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid character token after body (PE183)'));
                            modeSup.reprocessIn('In body');
                            break;
                    }
                    break;
                case 'StartTag':
                    switch (token.name) {
                        case 'html':
                            modeSup.usingRules('In body', token);
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid start tag token after body (PE184)'));
                            modeSup.reprocessIn('In body');
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'html':
                            if (modeList.fragmentParse)
                                modeSup.emitTag(new cls.tokenParEr('Fragment parsing html tag. Ignore the token (PE185)'));
                            else
                                modeSup.switch('After after body');
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid end tag token after body (PE186)'));
                            modeSup.reprocessIn('In body');
                            break;
                    }
                    break;
                case 'End-of-file':
                    modeAlgo.stopParsing();
                    break;
                default:
                    modeSup.emitTag(new cls.tokenParEr('Invalid token after body (PE187)'));
                    modeSup.reprocessIn('In body');
                    break;
            }
        },
        in_frameset: function (token) { // In frameset (12.2.5.4.20)
            switch (token.type) {
                case 'DOCTYPE':
                    modeSup.emitTag(new cls.tokenParEr('DOCTYPE token in frameset. Ignore the token (PE188)'));
                    break;
                case 'Comment':
                    modeAlgo.insertComment(token);
                    break;
                case 'Character':
                    switch (token.data) {
                        case '\u0009':
                        case '\u000A':
                        case '\u000C':
                        case '\u000D':
                        case '\u0020':
                            modeAlgo.insertCharacter(token.data);
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid token. Ignore the token (PE189)'));
                            break;
                    }
                    break;
                case 'StartTag':
                    switch (token.name) {
                        case 'html':
                            modeSup.usingRules('In body', token);
                            break;
                        case 'frameset':
                            modeAlgo.insertHTMLElement(token);
                            break;
                        case 'frame':
                            modeAlgo.insertHTMLElement(token);
                            modeList.stackOpen.pop();
                            modeSup.acknowledgeSelfClose(token);
                            break;
                        case 'noframes':
                            modeSup.usingRules('In head', token);
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid token. Ignore the token (PE190)'));
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'frameset':
                            if (modeSup.currentNode() == modeList.stackOpen[0])
                                modeSup.emitTag(new cls.tokenParEr('Invalid root html. Ignore the token (PE191)'));
                            else {
                                modeList.stackOpen.pop();
                                if (!modeList.fragmentParse && modeSup.currentNode().type != 'frameset')
                                    modeSup.switch('After frameset');
                            }
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid token. Ignore the token (PE192)'));
                            break;
                    }
                    break;
                case 'End-of-file':
                    if (modeSup.currentNode() != modeList.stackOpen[0])
                        modeSup.emitTag(new cls.tokenParEr('Invalid root html (PE193)'));
                    modeAlgo.stopParsing();
                    break;
                default:
                    modeSup.emitTag(new cls.tokenParEr('Invalid token. Ignore the token (PE194)'));
                    break;
            }
        },
        after_frameset: function (token) { // After frameset (12.2.5.4.21)
            switch (token.type) {
                case 'DOCTYPE':
                    modeSup.emitTag(new cls.tokenParEr('DOCTYPE token after frameset. Ignore the token (PE195)'));
                    break;
                case 'Comment':
                    modeAlgo.insertComment(token);
                    break;
                case 'Character':
                    switch (token.data) {
                        case '\u0009':
                        case '\u000A':
                        case '\u000C':
                        case '\u000D':
                        case '\u0020':
                            modeAlgo.insertCharacter(token.data);
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid character token after frameset. Ignore the token (PE196)'));
                            break;
                    }
                    break;
                case 'StartTag':
                    switch (token.name) {
                        case 'html':
                            modeSup.usingRules('In body', token);
                            break;
                        case 'noframes':
                            modeSup.usingRules('In head', token);
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid start tag token after frameset. Ignore the token (PE197)'));
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'html':
                            modeSup.switch('After after frameset');
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid end tag token after frameset. Ignore the token (PE198)'));
                            break;
                    }
                    break;
                case 'End-of-file':
                    modeAlgo.stopParsing();
                    break;
                default:
                    modeSup.emitTag(new cls.tokenParEr('Invalid token after frameset. Ignore the token (PE199)'));
                    break;
            }
        },
        after_after_body: function (token) { // After after body (12.2.5.4.22)
            switch (token.type) {
                case 'DOCTYPE':
                    modeSup.usingRules('In body', token);
                    break;
                case 'Comment':
                    modeAlgo.insertComment(token, {target: modeList.document, mode: 'last'});
                    break;
                case 'Character':
                    switch (token.data) {
                        case '\u0009':
                        case '\u000A':
                        case '\u000C':
                        case '\u000D':
                        case '\u0020':
                            modeSup.usingRules('In body', token);
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid character token after after body (PE200)'));
                            modeSup.reprocessIn('In body');
                            break;
                    }
                    break;
                case 'StartTag':
                    switch (token.name) {
                        case 'html':
                            modeSup.usingRules('In body', token);
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid start tag token after after body (PE201)'));
                            modeSup.reprocessIn('In body');
                            break;
                    }
                    break;
                case 'End-of-file':
                    modeAlgo.stopParsing();
                    break;
                default:
                    modeSup.emitTag(new cls.tokenParEr('Invalid token after after body (PE202)'));
                    modeSup.reprocessIn('In body');
                    break;
            }
        },
        after_after_frameset: function (token) { // After after frameset (12.2.5.4.23)
            switch (token.type) {
                case 'DOCTYPE':
                    modeSup.usingRules('In body', token);
                    break;
                case 'Comment':
                    modeAlgo.insertComment(token, {target: modeList.document, mode: 'last'});
                    break;
                case 'Character':
                    switch (token.data) {
                        case '\u0009':
                        case '\u000A':
                        case '\u000C':
                        case '\u000D':
                        case '\u0020':
                            modeSup.usingRules('In body', token);
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid character token after after frameset. Ignore the token (PE203)'));
                            break;
                    }
                    break;
                case 'StartTag':
                    switch (token.name) {
                        case 'html':
                            modeSup.usingRules('In body', token);
                            break;
                        case 'noframes':
                            modeSup.usingRules('In head', token);
                            break;
                        default:
                            modeSup.emitTag(new cls.tokenParEr('Invalid start tag token after after frameset. Ignore the token (PE204)'));
                            break;
                    }
                    break;
                case 'End-of-file':
                    modeAlgo.stopParsing();
                    break;
                default:
                    modeSup.emitTag(new cls.tokenParEr('Invalid token after after frameset. Ignore the token (PE205)'));
                    break;
            }
        },
        parsing_foreign_content: function (token) {
            var flag = false;
            var flag2 = false;
            var flag3 = false;

            switch (token.type) {
                case 'DOCTYPE':
                    this.emitTag(new cls.tokenParEr('DOCTYPE token in parsing foreign content (PE253)'));
                    break;
                case 'Comment':
                    modeAlgo.insertComment(token);
                    break;
                case 'Character':
                    switch (token.data) {
                        case '\u0000':
                            modeSup.emitTag(new cls.tokenParEr('NULL character in parsing foreign content (PE254)'));
                            modeAlgo.insertCharacter('\uFFFD');
                            break;
                        case '\u0009':
                        case '\u000A':
                        case '\u000C':
                        case '\u000D':
                        case '\u0020':
                            modeAlgo.insertCharacter(token.data);
                            break;
                        default:
                            modeAlgo.insertCharacter(token.data);
                            modeList.framesetFlag = 'not ok';
                            break;
                    }
                    break;
                case 'StartTag':
                    switch (token.name) {
                        case 'b':
                        case 'big':
                        case 'blockquote':
                        case 'body':
                        case 'br':
                        case 'center':
                        case 'code':
                        case 'dd':
                        case 'div':
                        case 'dl':
                        case 'dt':
                        case 'em':
                        case 'embed':
                        case 'h1':
                        case 'h2':
                        case 'h3':
                        case 'h4':
                        case 'h5':
                        case 'h6':
                        case 'head':
                        case 'hr':
                        case 'i':
                        case 'img':
                        case 'li':
                        case 'listing':
                        case 'menu':
                        case 'meta':
                        case 'nobr':
                        case 'ol':
                        case 'p':
                        case 'pre':
                        case 'ruby':
                        case 's':
                        case 'small':
                        case 'span':
                        case 'strong':
                        case 'strike':
                        case 'sub':
                        case 'sup':
                        case 'table':
                        case 'tt':
                        case 'u':
                        case 'ul':
                        case 'var':
                        case 'font':
                            if (token.name == 'font' && !(token.attribute['color'] != null || token.attribute['face'] != null || token.attribute['size'] != null)) {
                                flag = true;
                                break;
                            }
                            modeSup.emitTag(new cls.tokenParEr('Invalid start tag token in parsing foreing content (PE255)'));
                            if (modeList.fragmentParse)
                                flag = true;
                            else {
                                while (true) {
                                    modeList.stackOpen.pop();
                                    var curNode = modeSup.currentNode();
                                    if (modeSup.isMathMLIntegration(curNode) || modeSup.isHTMLIntegration(curNode) || curNode.namespace == nsEl['html'])
                                        break;
                                }
                                reProcess2 = true;
                            }
                            break;
                        default:
                            flag = true;
                            break;
                    }
                    break;
                case 'EndTag':
                    switch (token.name) {
                        case 'script':
                            flag2 = true;
                            break;
                        default:
                            flag3 = true;
                            break;
                    }
                    break;
                default:
                    modeSup.emitTag(new cls.tokenParEr('Invalid token in parsing foreign content. Ignore the token (PE256)'));
                    break;
            }

            if (flag) {
                var adjustTemp = modeList.adjustedNode() == null ? {} : modeList.adjustedNode();
                if (adjustTemp.namespace == nsEl['mathml'])
                    modeAlgo.adjustMathMLAttr(token);
                if (adjustTemp.namespace == nsEl['svg']) {
                    var listName = ['altGlyph', 'altGlyphDef', 'altGlyphItem', 'animateColor', 'animateMotion', 'animateTransform',
                        'clipPath', 'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix',
                        'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feDropShadow', 'feFlood', 'feFuncA',
                        'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode', 'feMorphology',
                        'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence', 'foreignObject',
                        'glyphRef', 'linearGradient', 'radialGradient', 'textPath'];
                    var listNameLow = [];
                    for (var i in listName)
                        listNameLow[i] = listName[i].toLowerCase();
                    var pos = listNameLow.indexOf(token.name.toLowerCase());
                    if (pos != -1)
                        token.name = listName[pos];
                    modeAlgo.adjustSVGAttr(token);
                }
                modeAlgo.adjustForeignAttr(token);
                modeAlgo.insertForeignElement(token, adjustTemp.namespace);
                if (token.flag) {
                    if (token.name == 'script' && modeSup.currentNode().namespace == nsEl['svg'])
                        flag2 = true;
                    else
                        modeList.stackOpen.pop();
                    modeSup.acknowledgeSelfClose(token);
                }
            }
            if (flag2) {
                if (modeSup.currentNode().namespace == nsEl['svg']) {
                    modeList.stackOpen.pop();
                    logs.push('\t\tSVG script: Currently not supported. Pass the process');
                }
                else
                    flag3 = true;
            }
            if (flag3) {
                var node = modeSup.currentNode();
                if (node.type.toLowerCase() != token.name)
                    modeSup.emitTag(new cls.tokenParEr('Current node tag name is not the same with token tag name (PE257)'));

                loop:
                    while (true) {
                        if (node == modeList.stackOpen[0])
                            break;
                        if (node.type.toLowerCase() == token.name)
                            while (true) {
                                if (modeList.stackOpen.pop() == node)
                                    break loop;
                            }
                        node = modeList.stackOpen[modeList.stackOpen.indexOf(node) - 1];
                        if (!(node.namespace != nsEl['html']))
                            return true;
                    }
            }
            return false;
        }
    };
}
catch (err) {
    console.log(err.stack);
    return ({err: err});
}

// Main function
function treeConstruction(stateIn, streamIn, modeListIn, currentInputIn) {
    try {
        // Add function to proper case
        String.prototype.toProperCase = function () {
            return this.replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        };

        // Clear variable value
        logs = [];
        // pendingCharTable = [];
        foster = false;
        reProcess = true;
        reProcess2 = true;
        scriptFlag = false;
        insertionPoint = null;
        modeList = {
            mode: [defaultMode],
            listFormat: [],
            stackOpen: [],
            stackTemplate: [],
            adjustedNode: function () {
                if (this.fragmentParse && this.stackOpen.length == 1)
                    return this.context;
                else
                    return this.stackOpen[this.stackOpen.length - 1];
            },
            document: new cls.documents('root'),
            framesetFlag: 'ok',
            headPointer: null,
            formPointer: null,
            stateNew: null,
            ignoreTokenFlag: false,
            emit: [],
            context: null,
            fragmentParse: false
        };

        // Start the function
        logs.push('Call function TREECONSTRUCTION (12.2.5) (treeconstruction.js)');

        // Initialising state
        logs.push('\tmodeList variable: ' + (modeListIn == null || Object.keys(modeListIn).length == 0 ? 'empty. Set to default' : 'provided'));
        if (modeListIn != null)
            for (var i in modeList)
                if (modeListIn[i] != null && modeListIn[i] != '' && i != 'adjustedNode')
                    modeList[i] = modeListIn[i];
        stream = (streamIn == null ? '' : streamIn);
        currentInput = (currentInputIn == null ? -1 : currentInputIn);
        state = (stateIn == null ? 'Data state' : stateIn.list[stateIn.list.length - 1]);
        logs.push('\tTree construction stage starts from: The "' + modeSup.now() + '" insertion mode (' + modeRef[modeSup.convert(modeSup.now())][1] + ') ' + (modeListIn != null && (modeListIn.mode == null || modeListIn.mode.length == 0) ?
                '(initialisation)' : '(continuation)'));

        // Main process
        for (var i in stateIn.emit) {
            var token = stateIn.emit[i];
            // // console.log(token.type + " " + token.name);
            logs.push('\tProcessing token: ' + JSON.stringify(token));
            var res = modeSup.preprocess(token);
            if (res) { // If the token is not a ParseError token
                reProcess = true;
                reProcess2 = true;
                while (reProcess2) {
                    reProcess2 = false;
                    res = modeAlgo.dispatcher(token);
                    if (res) { // If not parsing foreign content
                        var cnt = 0;
                        while (reProcess) {
                            cnt++;
                            // if (cnt > 10)
                            //     break;
                            // // console.log(JSON.stringify(token) + " " + modeSup.now());
                            reProcess = false;
                            modeDef[modeSup.convert(modeSup.now())](token);
                        }
                        // // console.log(1);
                    }
                    // // console.log(2);
                }
                // // console.log(3);
            }
            // // console.log(4);
        }

        // // console.log('escape');
        // End of function
        // console.log(modeList.document.firstChild.firstChild.firstChild);
        logs.push('End function TREECONSTRUCTION');
        // // console.log(5);
        // Set the adjust current node
        modeList.adjustedNode = modeList.adjustedNode();
        return ({modeList: modeList, logs: logs});
    }
    catch (err) {
        console.log(err.stack);
        return ({modeList: modeList, logs: logs, err: err});
    }
}

module.exports = {
    modeAlgo: modeAlgo,
    modeDef: modeDef,
    modeSup: modeSup,
    treeConstruction: treeConstruction
};