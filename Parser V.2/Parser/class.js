// WHATWG ver. 22-06-2016
// Class declaration
function documents(type) {
    this.type = type;
    this.firstChild = {parent: this};
    this.lastChild = {parent: this};
    this.document = this;
    this.prev = null;
    this.next = null;
    this.readiness = "loading";
    this.DOMContentLoaded = function () {
        //empty
    };
    this.window = {
        content: "", load: function (override) {
            //empty
        }
    };
}
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
function tokenTag(type, name) {
    this.type = type;
    this.name = (name == null ? "" : name);
    this.flag = false;
    this.attribute = [];
}
tokenTag.prototype.newAttr = function (name) {
    this.attribute.push({name: name == null ? "" : name, value: ""});
}
function tokenDOCTYPE(name, flag) {
    this.type = "DOCTYPE";
    this.name = name;
    this.publicId = null;
    this.systemId = null;
    this.flag = (flag == null ? "off" : flag);
}
function tokenCharCom(type, value) {
    this.type = type;
    this.value = value;
}
function tokenParEr(value) {
    this.type = "ParseError";
    this.value = value;
}
function tokenEOF(value) {
    this.type = "End-of-file";
    this.value = value;
}
module.exports = {
    documents: documents,
    nodes: nodes,
    tokenTag: tokenTag,
    tokenDOCTYPE: tokenDOCTYPE,
    tokenCharCom: tokenCharCom,
    tokenParEr: tokenParEr,
    tokenEOF: tokenEOF
};