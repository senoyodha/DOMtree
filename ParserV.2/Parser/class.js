// WHATWG ver. 22-06-2016
// Class declaration
function documents(type, token) {
    this.type = type;
    this.firstChild = {parent: this};
    this.lastChild = {parent: this};
    this.document = this;
    this.prev = null;
    this.next = null;
    this.readiness = 'loading';
    this.DOMContentLoaded = function () {
        //empty
    };
    this.window = {
        content: '', load: function (override) {
            //empty
        }
    };
    this.token = token;
}
function nodes(type, doc, namespace, token) {
    this.type = type;
    this.prev = null;
    this.next = null;
    this.firstChild = {parent: this};
    this.lastChild = {parent: this};
    this.parent = null;
    this.namespace = namespace == null ? 'http://www.w3.org/1999/xhtml' : namespace;
    this.attribute = {};
    this.document = doc == null ? new documents() : doc;
    this.token = token;
}
function tokenTag(type, name) {
    this.type = type;
    this.name = (name == null ? '' : name);
    this.flag = false;
    this.attribute = [];
    this.namespace = null;
}
tokenTag.prototype.newAttr = function (name) {
    this.attribute.push({name: name == null ? '' : name, value: ''});
};
function tokenDOCTYPE(name, flag) {
    this.type = 'DOCTYPE';
    this.name = name;
    this.publicId = null;
    this.systemId = null;
    this.flag = (flag == null || flag != 'on' ? 'off' : 'on');
    this.namespace = null;
}
function tokenCharCom(type, data) {
    this.type = type;
    this.data = (data == null ? '' : data);
}
function tokenParEr(data) {
    this.type = 'ParseError';
    this.data = data;
}
function tokenEOF(data) {
    this.type = 'End-of-file';
    this.data = data;
}
module.exports = {
    documents: documents,
    nodes: nodes,
    tokenTag: tokenTag,
    tokenDOCTYPE: tokenDOCTYPE,
    tokenCharCom: tokenCharCom,
    tokenParEr: tokenParEr,
    tokenEOF: tokenEOF,
};