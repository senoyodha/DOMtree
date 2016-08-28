function tagAttrAdapter(attribute) {
    var temp = {};
    for (var i in attribute) {
        temp[attribute[i]['name']] = attribute[i]['value'];
    }
    return temp;
}
function tokenAdapter(token) {
    var resToken = [];
    var i = 0;
    loop:
        while (true) {
            switch (token[i].type) {
                case 'Character':
                    var char = '';
                    while (true) {
                        if (token[i].type != 'Character') {
                            i--;
                            break;
                        }
                        char += token[i].data;
                        i++;
                    }
                    resToken.push([token[i].type, char]);
                    break;
                case 'Comment':
                    resToken.push([token[i].type, token[i].data]);
                    break;
                case 'DOCTYPE':
                    resToken.push([token[i].type, token[i].name, token[i].publicId, token[i].systemId, (token[i].flag == 'off')]);
                    break;
                case 'StartTag':
                case 'EndTag':
                    var arrTemp = [];
                    arrTemp.push(token[i].type, token[i].name);
                    if (token[i].type == 'StartTag') {
                        arrTemp.push(tagAttrAdapter(token[i].attribute));
                        if (token[i].flag)
                            arrTemp.push(token[i].flag);
                    }
                    resToken.push(arrTemp);
                    break;
                case 'End-of-file':
                    break loop;
                case 'ParseError':
                    resToken.push(token[i].type);
                    break;
                default:
                    // console.log('Invalid token type: ' + token[i].type);
                    return;
            }
            i++;
        }
    return resToken;
}
function tokenTest(path, showLog, falseOnly) {
    function logShown(str) {
        if (showLog)
            console.log(str);
    }

    var parse = require('../Parser/parser');
    var fs = require('fs');
    var files = fs.readdirSync(path);
    var detailTemp = [[], []];
    var summary = [];
    var nar = [0, 0];
    var arlast = [];
    logShown('[TOKEN TEST]');
    logShown('PATH: ' + path);
    for (var i in files) {
        var test = JSON.parse(fs.readFileSync(path + files[i], 'utf8'));
        var pos = detailTemp[0].length;
        var nars = [0, 0];
        detailTemp[0].push(files[i].toUpperCase());
        detailTemp[1].push('\n');
        logShown('  ' + files[i].toUpperCase() + '(' + test.tests.length + ')');
        for (var j in test.tests) {
            logShown('    ' + test.tests[j].input);
            var add = {};
            add['initialStates'] = (test.tests[j].initialStates != null ? test.tests[j].initialStates[test.tests[j].initialStates.length - 1] : null);
            add['lastStartTag'] = (test.tests[j].lastStartTag != null ? test.tests[j].lastStartTag : null);
            if (test.tests[j].doubleEscaped) {
                test.tests[j].input = doubleEscapeAdapter(test.tests[j].input);
                for (var k in test.tests[j].output)
                    if (['Character', 'Comment'].indexOf(test.tests[j].output[k][0]) != -1)
                        test.tests[j].output[k][1] = doubleEscapeAdapter(test.tests[j].output[k][1]);
            }
            var res = parse.parsing(test.tests[j].input, true, add);
            var output = tokenAdapter(res.state.emit);
            var nr = (JSON.stringify(output) == JSON.stringify(test.tests[j].output) ? 0 : 1);
            if (!falseOnly)
                detailTemp[nr].push(test.tests[j].input + (nr == 0 ? '' : ':\t' + JSON.stringify(test.tests[j].output) + ' | ' + JSON.stringify(output)));
            else if (nr == 1)
                detailTemp[0].push(test.tests[j].input + ':\t' + JSON.stringify(test.tests[j].output) + ' | ' + JSON.stringify(output));
            nars[nr] += 1;
        }
        nar[0] += nars[0];
        nar[1] += nars[1];
        detailTemp[1][pos] = '(T: ' + (nars[0] + nars[1]) + ' | A: ' + nars[0] + ' | D: ' + nars[1] + ')\n----------------------------------------------';
        arlast.push(files[i] + '\t(Cases: ' + (nars[0] + nars[1]) + ', Agree: ' + nars[0] + ', Disagree: ' + nars[1] + ')');
        for (var k = detailTemp[0].length; k < detailTemp[1].length; k++)
            detailTemp[0].push('n/a');
        if (falseOnly)
            for (var k = detailTemp[1].length; k < detailTemp[0].length; k++)
                detailTemp[1].push('');
        detailTemp[0].push('----------------------------------------------');
        detailTemp[1].push('');
        logShown('');
    }
    var detail = [];
    for (var i in detailTemp[0]) {
        detail.push(detailTemp[0][i] + '\t\t' + detailTemp[1][i]);
    }
    detail.unshift('Path: ' + path + ' (T: ' + (nar[0] + nar[1]) + ' | A: ' + nar[0] + ' (' + (nar[0] * 100 / (nar[0] + nar[1])).toFixed(1) + '%) | ' + 'D: ' + nar[1] + ' (' + (nar[1] * 100 / (nar[0] + nar[1])).toFixed(1) + '%))\n----------------------------------------------\n');
    detail[0] += arlast.join('\n') + '\n----------------------------------------------';
    logShown('Files: ' + files.length + ', Cases: ' + (nar[0] + nar[1]) + ', Agree: ' + nar[0] + ' (' + (nar[0] * 100 / (nar[0] + nar[1])).toFixed(1) + '%), Dis: ' + nar[1] + ' (' + (nar[1] * 100 / (nar[0] + nar[1])).toFixed(1) + '%)');
    for (var i in arlast)
        logShown(arlast[i]);
    return ({detail: detail, summary: summary});
}
function treeViewer(doc) {
    var structure = '#document: ';
    if (doc.doctype != null)
        structure += doc.doctype.name + ' ' + doc.doctype.publicId + ' ' + doc.doctype.systemId;
    var cnode = doc.firstChild;
    var rpt = 1;
    loop:
        while (true) {
            var attr = '';
            if (cnode.attribute != null && Object.keys(cnode.attribute).length > 0)
                attr = JSON.stringify(cnode.attribute);
            structure += '\n' + ' '.repeat(rpt * 2) + '-' + cnode.type + ':' + attr + (cnode.name != null ? ' ' + cnode.name : '') + (cnode.data != null ? ' ' + cnode.data : '');
            if (cnode.firstChild.type != null) {
                cnode = cnode.firstChild;
                rpt++;
            }
            else {
                if (cnode.next != null)
                    cnode = cnode.next;
                else {
                    while (true) {
                        cnode = cnode.parent;
                        rpt--;
                        if (cnode.next != null) {
                            cnode = cnode.next;
                            break;
                        }
                        else if (cnode.constructor.name == 'documents')
                            break loop;
                    }
                }
            }
        }
    return structure;
}
function getDateString() {
    return (new Date()).toISOString().substr(2, 17).replace("T", " ").replace(/\-/g, "").replace(/\:/g, "");
}
function doubleEscapeAdapter(stream) {
    while (stream.indexOf('\\u') != -1) {
        var pos = stream.indexOf('\\u{');
        if (pos != -1) {
            var pos2 = stream.indexOf('}');
            stream = stream.substr(0, pos) + String.fromCodePoint(parseInt(stream.substring(pos + 3, pos2), 16)) + stream.substr(pos2 + 1);
        }
        else {
            pos = stream.indexOf('\\u');
            stream = stream.substr(0, pos) + String.fromCodePoint(parseInt(stream.substr(pos + 2, 4), 16)) + stream.substr(pos + 6);
        }
    }
    return stream;
}
function treeAdapter(doc) {
    var structure = '#document';
    if (doc.doctype != null)
        structure += (doc.doctype.name != null ? ' ' + doc.doctype.name : '') + (doc.doctype.publicId != null ? ' ' + doc.doctype.publicId : '') + (doc.doctype.systemId != null ? ' ' + doc.doctype.systemId : '');
    var cnode = doc.firstChild;
    var rpt = 1;
    var cnt = 0;
    // console.log(1);
    loop:
        while (true) {
            cnt++;
            var attr = '';
            // console.log(cnt + " " + cnode.type + " " + cnode.data);
            // console.log();
            if (cnode.attribute != null && Object.keys(cnode.attribute).length > 0)
                attr = JSON.stringify(cnode.attribute);
            if (cnode.type == 'text') {
                structure += '\n|' + ' '.repeat(rpt * 2 - 1) + '"' + cnode.data + '"';
                // console.log(3);
            }
            else {
                structure += '\n|' + ' '.repeat(rpt * 2 - 1) + '<' + cnode.type + '>';
                // console.log(4);
            }
            if (cnode.firstChild.type != null) {
                cnode = cnode.firstChild;
                rpt++;
                // console.log(5);
            }
            else {
                if (cnode.next != null) {
                    cnode = cnode.next;
                    // console.log(6);
                }
                else {
                    // console.log(7);
                    while (true) {
                        cnode = cnode.parent;
                        rpt--;
                        if (cnode.next != null) {
                            cnode = cnode.next;
                            break;
                        }
                        else if (cnode.constructor.name == 'documents')
                            break loop;
                    }
                }
            }
            // if (cnt > 30)
            //     break;
        }
    // console.log(0);
    return structure;
}
function treeTest(path, showLog, falseOnly) {
    function logShown(str) {
        if (showLog)
            console.log(str);
    }

    var parse = require('../Parser/parser');
    var fs = require('fs');
    var files = fs.readdirSync(path);
    var detailTemp = [[], []];
    var summary = [];
    var nar = [0, 0];
    var arlast = [];
    logShown('[TREE CONSTRUCTION TEST]');
    logShown('PATH: ' + path);
    var cnt = 0;
    for (var i in files) {
        var read = fs.readFileSync(path + files[i], 'utf8').replace(/\n\n/g, '\n').split('#data\n');
        read.shift();
        var test = [];
        for (var j in read)
            test.push({
                input: read[j].substr(0, read[j].indexOf('\n')),
                output: read[j].substring(read[j].indexOf('#document'), read[j].length - 1)
            });
        // // console.log(test[test.length - 1].input);
        var pos = detailTemp[0].length;
        var nars = [0, 0];
        detailTemp[0].push(files[i].toUpperCase());
        detailTemp[1].push('\n');
        logShown('  ' + files[i].toUpperCase() + '(' + test.length + ')');
        for (var j in test) {
            cnt++;
            // console.log(cnt + " " + files[i] + " " + test[j].input);
            logShown('    ' + test[j].input);
            var res = parse.parsing(test[j].input);
            var output = treeAdapter(res.modeList.document);
            var nr = (output == test[j].output ? 0 : 1);
            if (!falseOnly)
                detailTemp[nr].push(test[j].input + (nr == 0 ? '' : ':\t' + test[j].output.replace(/\n/g, '//n') + ' | ' + output.replace(/\n/g, '//n')));
            else if (nr == 1)
                detailTemp[0].push(test[j].input + ':\t' + test[j].output.replace(/\n/g, '//n') + ' | ' + output.replace(/\n/g, '//n'));
            nars[nr] += 1;
        }
        nar[0] += nars[0];
        nar[1] += nars[1];
        detailTemp[1][pos] = '(T: ' + (nars[0] + nars[1]) + ' | A: ' + nars[0] + ' | D: ' + nars[1] + ')\n----------------------------------------------';
        arlast.push(files[i] + '\t(Cases: ' + (nars[0] + nars[1]) + ', Agree: ' + nars[0] + ', Disagree: ' + nars[1] + ')');
        for (var k = detailTemp[0].length; k < detailTemp[1].length; k++)
            detailTemp[0].push('n/a');
        if (falseOnly)
            for (var k = detailTemp[1].length; k < detailTemp[0].length; k++)
                detailTemp[1].push('');
        detailTemp[0].push('----------------------------------------------');
        detailTemp[1].push('');
        logShown('');
    }
    var detail = [];
    for (var i in detailTemp[0]) {
        detail.push(detailTemp[0][i] + '\t\t' + detailTemp[1][i]);
    }
    detail.unshift('Path: ' + path + ' (T: ' + (nar[0] + nar[1]) + ' | A: ' + nar[0] + ' (' + (nar[0] * 100 / (nar[0] + nar[1])).toFixed(1) + '%) | ' + 'D: ' + nar[1] + ' (' + (nar[1] * 100 / (nar[0] + nar[1])).toFixed(1) + '%))\n----------------------------------------------\n');
    detail[0] += arlast.join('\n') + '\n----------------------------------------------';
    logShown('Files: ' + files.length + ', Cases: ' + (nar[0] + nar[1]) + ', Agree: ' + nar[0] + ' (' + (nar[0] * 100 / (nar[0] + nar[1])).toFixed(1) + '%), Dis: ' + nar[1] + ' (' + (nar[1] * 100 / (nar[0] + nar[1])).toFixed(1) + '%)');
    for (var i in arlast)
        logShown(arlast[i]);
    return ({detail: detail, summary: summary});
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
    if (svg[el.type] != null)
        return svg[el.type];
    else
        return el.type;
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
    for (var i in el.attribute) {
        var pos = listLow.indexOf(i.toLowerCase());
        if (pos != -1 && list[pos] != i) {
            el.attribute[list[pos]] = el.attribute[i];
            delete el.attribute[i];
        }
    }
    return el.attribute;
}
function fixMathAttr(el) {
    for (var i in el.attribute)
        if (i.toLowerCase() == 'definitionurl' && i != 'definitionURL') {
            el.attribute['definitionURL'] = el.attribute[i];
            delete el.attribute[i];
            break;
        }
    return el.attribute;
}
function fixForeignAttr(el) {
    var list = ['xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type',
        'xml:lang', 'xml:space', 'xmlns', 'xmlns:xlink'];
    for (var i in el.attribute) {
        var pos = list.indexOf(i.toLowerCase());
        if (pos != -1 && (isSvg(el) || isMath(el))) {
            el.attribute[list[pos].split(':').join(' ')] = el.attribute[i];
            delete el.attribute[i];
        }
    }
    return el.attribute;
}

function isSvg(node) {
    var tempNode = node.parent;
    if (node.type == 'svg')
        return true;
    else {
        while (tempNode.constructor.name != 'documents') {
            if (tempNode.type == 'svg')
                return true;
            tempNode = tempNode.parent;
        }
    }
    return false;
}
function isTemplate(node) {
    var tempNode = node.parent;
    var res = 0;
    while (tempNode.constructor.name != 'documents') {
        if (tempNode.type == 'template' && !isSvg(tempNode))
            res++;
        tempNode = tempNode.parent;
    }
    return res;
}
function isMath(node) {
    var tempNode = node.parent;
    if (node.type == 'math')
        return true;
    else {
        while (tempNode.constructor.name != 'documents') {
            if (tempNode.type == 'math')
                return true;
            tempNode = tempNode.parent;
        }
    }
    return false;
}
function treeWrapper(doc) {
    var structure = '#document';
    // if (doc.doctype != null)
    //     structure += (doc.doctype.name != null ? ' ' + doc.doctype.name : '') + (doc.doctype.publicId != null ? ' ' + doc.doctype.publicId : '') + (doc.doctype.systemId != null ? ' ' + doc.doctype.systemId : '');
    var cnode = doc.firstChild;
    var rpt = 1;
    var cnt = 0;
    // console.log(1);
    loop:
        while (true) {
            cnt++;
            var attr = '';
            // console.log(cnt + " " + cnode.type + " " + cnode.data);
            // console.log();
            if (cnode.type == 'text') {
                structure += '\n|' + ' '.repeat((rpt + isTemplate(cnode)) * 2 - 1) + '"' + cnode.data + '"';
                // console.log(3);
            }
            else if (cnode.type == 'comment') {
                structure += '\n|' + ' '.repeat((rpt + isTemplate(cnode)) * 2 - 1) + '<!-- ' + cnode.data + ' -->';
                // console.log(3);
            }
            else if (cnode.type == 'DocumentType' && cnt == 1) {
                structure += '\n| <!DOCTYPE ' + cnode.name +
                    (cnode.publicId ? ' "' + cnode.publicId + '"' : '')
                    + (!cnode.publicId && cnode.systemId ? ' ""' : '')
                    + (cnode.publicId || cnode.systemId ? ' "' + cnode.systemId + '"' : '') + '>';
            }
            else {
                var prefix = '';
                if (isSvg(cnode)) {
                    prefix = 'svg ';
                    cnode.type = fixSVGName(cnode);
                    cnode.attribute = fixSVGAttr(cnode);
                }
                else if (isMath(cnode)) {
                    prefix = 'math ';
                    cnode.attribute = fixMathAttr(cnode);
                }
                cnode.attribute = fixForeignAttr(cnode);
                structure += '\n|' + ' '.repeat((rpt + isTemplate(cnode)) * 2 - 1) + '<' + prefix + cnode.type + '>';
                if (cnode.attribute != null && Object.keys(cnode.attribute).length > 0) {
                    var attra = Object.keys(cnode.attribute);
                    attra.sort();
                    for (var i in attra)
                        structure += '\n|' + ' '.repeat((rpt + isTemplate(cnode)) * 2 + 1) + attra[i] + '="' + cnode.attribute[attra[i]] + '"';
                }
                if (cnode.type == 'template' && !isSvg(cnode))
                    structure += '\n|' + ' '.repeat((rpt + isTemplate(cnode)) * 2 + 1) + 'content';
                // console.log(4);
            }
            if (cnode.firstChild.type != null) {
                cnode = cnode.firstChild;
                rpt++;
                // console.log(5);
            }
            else {
                if (cnode.next != null) {
                    cnode = cnode.next;
                    // console.log(6);
                }
                else {
                    // console.log(7);
                    while (true) {
                        cnode = cnode.parent;
                        rpt--;
                        if (cnode.next != null) {
                            cnode = cnode.next;
                            break;
                        }
                        else if (cnode.constructor.name == 'documents')
                            break loop;
                    }
                }
            }
            // if (cnt > 30)
            //     break;
        }
    // console.log(0);
    return structure;
}
function treeTest2(mode, start, stop, showLog, falseOnly) {
    function logShown(str) {
        if (showLog)
            console.log(str);
        return str;
    }

    var set = {
        NS: {
            mode: 'NoScript',
            pathIn: 'HTMLCompare/TestSuite/NoScript/',
            pathOut: 'HTMLCompare/DOM/NoScript/Parser/',
            pathDom: 'HTMLCompare/DOM/NoScript/Original/'
        },
        B: {
            mode: 'Both',
            pathIn: 'HTMLCompare/TestSuite/Both/',
            pathOut: 'HTMLCompare/DOM/Both/Parser/',
            pathDom: 'HTMLCompare/DOM/Both/Original/'
        }
    };
    var parse = require('../Parser/parser');
    var fs = require('fs');
    var files = fs.readdirSync(set[mode].pathIn);
    var dis = [];

    if (start == null)
        start = 0;
    if (stop == 0 || stop == null)
        stop = files.length;
    if (start > stop) {
        var temp = start;
        start = stop;
        stop = temp;
    }

    logShown('[TREE CONSTRUCTION TEST]');
    logShown('Mode: ' + mode + '. Processing:');

    for (var i = start; i < stop; i++) {
        var read = fs.readFileSync(set[mode].pathIn + files[i], 'utf8');
        var res = parse.parsing(read);
        // JSON.stringify(res.modeList.document);
        var dom = treeWrapper(res.modeList.document);
        var readDom = fs.readFileSync(set[mode].pathDom + files[i].slice(0, -4) + 'txt', 'utf8');
        logShown(files[i] + ' --> ' + files[i].slice(0, -4) + 'txt: ' + (dom == readDom));
        if (dom != readDom)
            dis.push(files[i] + ': ' + read);
        // logShown(res.modeList.document);
        // console.log(dom);
        // console.log(readDom);
        // console.log(files[i] + ': ' + (dom == readDom));
        // console.log(dom);
        fs.writeFileSync(set[mode].pathOut + files[i].slice(0, -4) + 'txt', dom);
    }
    logShown(dis);
    logShown(dis.length);
}
module.exports = {
    tokenAdapter: tokenAdapter,
    treeAdapter: treeAdapter,
    treeViewer: treeViewer,
    tokenTest: tokenTest,
    treeTest: treeTest,
    treeWrapper: treeWrapper,
    treeTest2: treeTest2,
    getDateString: getDateString,
    doubleEscapeAdapter: doubleEscapeAdapter
};