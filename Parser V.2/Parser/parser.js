// WHATWG ver. 22-06-2016
function parsing(stream, testTokenizer) {
    try {
        // Import modules
        var algo = require('./algorithm');
        var cls = require('./class');
        var prepro = require('./preprocessing');
        var sprt = require('./support');
        var tknz = require('./tokenization');
        var tree = require('./treeconstruction');

        // Variable Declaration
        var logs = [];
        var logsFirst = [];
        var emitList = [];
        var tokenList = [];
        var labelProcess = 0;
        var scriptFlag = false;
        var fragmentParse = false;
        var insertionPoint = null;
        var context = new nodes();
        var document = new cls.documents('root');

        function parsingProcess(stream) {
            // Variable declaration
            var framesetFlag = "ok";
            var listFormat = [];
            var nextInput = 0;
            var currentInput = -1;
            var state = ["Data state"];
            var mode = ["Initial"]; //Insertion mode
            var stackOpen = [];
            var stackTemplate = [];
            var pendingCharTable = [];
            var adjustedNode = null;
            var headPointer = null;
            var formPointer = null;
            var returnMode = null;
            var foster = false;
            var reProcess = true;
            var callBack = "";
            var ignoreTokenFlag = false;
            var specialTag = ["address", "applet", "area", "article", "aside", "base", "basefont", "bgsound", "blockquote", "body",
                "br", "button", "caption", "center", "col", "colgroup", "dd", "details", "dir", "div", "dl", "dt", "embed", "fieldset",
                "figcaption", "figure", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header",
                "hgroup", "hr", "html", "iframe", "img", "input", "isindex", "li", "link", "listing", "main", "marquee", "menu",
                "menuitem", "meta", "nav", "noembed", "noframes", "noscript", "object", "ol", "p", "param", "plaintext", "pre", "script",
                "section", "select", "source", "style", "summary", "table", "tbody", "td", "template", "textarea", "tfoot", "th",
                "thead", "title", "tr", "track", "ul", "wbr", "and xmp; mi", "mo", "mn", "ms", "mtext", "annotation-xml", "foreignObject",
                "desc", "title"];
            var scopeEl = ["applet", "caption", "html", "table", "td", "th", "marquee", "object", "template", "mi", "mo", "mn", "ms",
                "mtext", "annotation-xml", "foreignObject", "desc", "title"];
            var nsEl = {
                html: "http://www.w3.org/1999/xhtml",
                mathml: "http://www.w3.org/1998/Math/MathML",
                svg: "http://www.w3.org/2000/svg",
                xlink: "http://www.w3.org/1999/xlink",
                xml: "http://www.w3.org/XML/1998/namespace",
                xmlns: "http://www.w3.org/2000/xmlns/"
            };
            var nsList = ["http://www.w3.org/1999/xhtml", "http://www.w3.org/1998/Math/MathML", "http://www.w3.org/2000/svg",
                "http://www.w3.org/1999/xlink", "http://www.w3.org/XML/1998/namespace", "http://www.w3.org/2000/xmlns/"];

            // Start the function
            logs.push('Input: ' + stream);
            logs.push('Call function PARSINGPROCESS (12.2) (parser.js)');


            // Parsing cycle


        }

        // Preprocess stream
        var resPre = prepro.preprocessing(stream);
        stream = resPre.stream;

        // First parsing process (tokenization only)
        logs.push('--FIRST PARSING PROCESS--');
        parsingProcess(stream);

        // Second parsing process (tokenization + tree construction)
        if (!testTokenizer) {
            labelProcess++;
            emitList = [];
            logsFirst = logs;
            logs = [];
            logs.push('--SECOND PARSING PROCESS--');
            parsingProcess(stream);
        }
    }
    catch (err) {
        return ({token: emitList, doc: document, logs: logsFirst.concat(logs), err: err});
    }
}

module.exports = {
    parsing: parsing
};