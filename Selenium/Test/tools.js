module.exports = {
    logDouble: logDouble,
    DOMWrapper: DOMWrapper,
    convertNameURL: convertNameURL
};

function logDouble(str) {
    if (str == null)
        str = '';
    console.log(str);
    return str + '\n';
}

function fixSVGName(el) {
    var svg = {
        altglyph: 'altGlyph',
        altglyphdef: 'altGlyphDef',
        altglyphitem: 'altGlyphItem',
        animatecolor: 'animateColor',
        animatemotion: 'animateMotion',
        animatetransform: 'animateTransform',
        clippath: 'clipPath',
        feblend: 'feBlend',
        fecolormatrix: 'feColorMatrix',
        fecomponenttransfer: 'feComponentTransfer',
        fecomposite: 'feComposite',
        feconvolvematrix: 'feConvolveMatrix',
        fediffuselighting: 'feDiffuseLighting',
        fedisplacementmap: 'feDisplacementMap',
        fedistantlight: 'feDistantLight',
        fedropshadow: 'feDropShadow',
        feflood: 'feFlood',
        fefunca: 'feFuncA',
        fefuncb: 'feFuncB',
        fefuncg: 'feFuncG',
        fefuncr: 'feFuncR',
        fegaussianblur: 'feGaussianBlur',
        feimage: 'feImage',
        femerge: 'feMerge',
        femergenode: 'feMergeNode',
        femorphology: 'feMorphology',
        feoffset: 'feOffset',
        fepointlight: 'fePointLight',
        fespecularlighting: 'feSpecularLighting',
        fespotlight: 'feSpotLight',
        fetile: 'feTile',
        feturbulence: 'feTurbulence',
        foreignobject: 'foreignObject',
        glyphref: 'glyphRef',
        lineargradient: 'linearGradient',
        radialgradient: 'radialGradient',
        textpath: 'textPath'
    };
    if (svg[el.nodeName] != null)
        return svg[el.nodeName];
    else
        return el.nodeName;
}

function fixSVGAttr(el) {
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
    for (var i in el.attributes) {
        var pos = listLow.indexOf(i.toLowerCase());
        if (pos != -1 && list[pos] != i) {
            el.attributes[list[pos]] = el.attributes[i];
            delete el.attributes[i];
        }
    }
    return el.attributes;
}

function fixMathAttr(el) {
    for (var i in el.attributes)
        if (i.toLowerCase() == 'definitionurl' && i != 'definitionURL') {
            el.attributes['definitionURL'] = el.attributes[i];
            delete el.attributes[i];
            break;
        }
    return el.attributes;
}

function fixForeignAttr(el) {
    var ns = {xlink: 'http://www.w3.org/1999/xlink', xml: 'http://www.w3.org/XML/1998/namespace', xmlns: ''};
    var list = ['xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type',
        'xml:lang', 'xml:space', 'xmlns', 'xmlns:xlink'];
    for (var i in el.attributes) {
        var pos = list.indexOf(i.toLowerCase());
        if (pos != -1 && ns[list[pos].split(':')[0]] == el.attributes[i].namespace) {
            el.attributes[list[pos].split(':').join(' ')] = el.attributes[i];
            delete el.attributes[i];
        }
    }
    return el.attributes;
}

function DOMWrapper(dom, file, decode) {
    var ns = {svg: 'http://www.w3.org/2000/svg', math: 'http://www.w3.org/1998/Math/MathML'};
    var s = '#document\n';
    var prefix = '';
    for (var i in dom) {
        if (i == 0 && dom[i].nodeName == 'DOCTYPE') {
            s += '| <!DOCTYPE ' + dom[0].name +
                (dom[0].publicId ? ' "' + dom[0].publicId + '"' : '')
                + (!dom[0].publicId && dom[0].systemId ? ' ""' : '')
                + (dom[0].publicId || dom[0].systemId ? ' "' + dom[0].systemId + '"' : '') + '>\n';
        }
        else {
            switch (dom[i].nodeName) {
                case '#text':
                    s += '|' + '  '.repeat(dom[i].level + dom[i].template) + ' "' + (decode == false ? dom[i].nodeValue : decodeURI(dom[i].nodeValue)) + '"\n';
                    break;
                case '#comment':
                    s += '|' + '  '.repeat(dom[i].level + dom[i].template) + ' <!-- ' + (decode == false ? dom[i].nodeValue : decodeURI(dom[i].nodeValue)) + ' -->\n';
                    break;
                default:
                    prefix = '';
                    dom[i].nodeName = dom[i].nodeName.toLowerCase();
                    if (dom[i].namespace == ns['svg']) {
                        prefix = 'svg ';
                        dom[i].nodeName = fixSVGName(dom[i]);
                        dom[i].attributes = fixSVGAttr(dom[i]);
                    }
                    else if (dom[i].namespace == ns['math']) {
                        prefix = 'math ';
                        dom[i].attributes = fixMathAttr(dom[i]);
                    }
                    dom[i].attributes = fixForeignAttr(dom[i]);
                    s += '|' + '  '.repeat(dom[i].level + dom[i].template) + ' <' + prefix + dom[i].nodeName + '>\n';
                    if (dom[i].attributes != null && Object.keys(dom[i].attributes).length > 0) {
                        var attra = Object.keys(dom[i].attributes);
                        attra.sort();
                        for (var j in attra)
                            s += '|' + '  '.repeat(dom[i].level + dom[i].template + 1) + ' ' + attra[j] + '="' + dom[i].attributes[attra[j]].value + '"\n';
                    }
                    if (dom[i].nodeName == 'template')
                        s += '|' + '  '.repeat(dom[i].level + dom[i].template + 1) + ' content\n';
                    break;
            }
        }
    }
    return s.substr(0, s.length - 1);
}

function convertNameURL(pathTest, pathCur, host, hostAdd) {
    if (host != null && host > 0)
        return 'http://localhost/' + (hostAdd ? hostAdd : '') + pathTest.split('/').slice(-host - 1).join('/');
    else {
        var pathArr = pathTest.split('../');
        if (pathCur.substr(-1) == '\\')
            pathCur = pathCur.substr(0, pathCur.length - 1);
        for (var i = 0; i < pathArr.length - 1; i++)
            pathCur = pathCur.substr(0, pathCur.lastIndexOf('\\'));
        pathCur = 'file:///' + pathCur.replace(/\\/g, '/') + '/' + pathArr[pathArr.length - 1];
        return pathCur;
    }
}

