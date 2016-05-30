// WHATWG ver. 22-06-2016
function preprocessing(stream) {
    try {
        // Variable declaration
        var parseError = 0;
        var logs = [];
        var charEqCode = [];
        var charEq = ['\u000B', '\uFFFE', '\uFFFF', '\u{1FFFE}', '\u{1FFFF}', '\u{2FFFE}', '\u{2FFFF}', '\u{3FFFE}', '\u{3FFFF}', '\u{4FFFE}', '\u{4FFFF}',
            '\u{5FFFE}', '\u{5FFFF}', '\u{6FFFE}', '\u{6FFFF}', '\u{7FFFE}', '\u{7FFFF}', '\u{8FFFE}', '\u{8FFFF}', '\u{9FFFE}',
            '\u{9FFFF}', '\u{AFFFE}', '\u{AFFFF}', '\u{BFFFE}', '\u{BFFFF}', '\u{CFFFE}', '\u{CFFFF}', '\u{DFFFE}', '\u{DFFFF}',
            '\u{EFFFE}', '\u{EFFFF}', '\u{FFFFE}', '\u{FFFFF}', '\u{10FFFE}', '\u{10FFFF}'];

        // Start the function
        logs.push('Call function PREPROCESSING (12.2.2.5) (preprocessing.js)');

        // Convert control characters into Unicode code point
        for (var i in charEq)
            charEqCode.push(charEq[i].codePointAt(0));

        // Processing control characters
        logs.push('\tPreprocessing control characters:');
        for (var i = 0; i < stream.length; i++) {
            if (charEqCode.indexOf(stream.codePointAt(i)) != -1 || /[\u0001-\u0008\u000E-\u001F\u007F-\u009F\uFDD0-\uFDEF]/.test(stream[i])) {
                logs.push('\t\tParse error: Control character "' + String.fromCharCode(stream.codePointAt(i)) + '" (U+' +
                    stream.codePointAt(i).toString(16).toUpperCase() + ')');
                parseError++;
            }
        }
        if (parseError == 0)
            logs.push('\t\tNo control characters');

        // Processing CR (U+000D) and LF (U+000A) characters
        logs.push('\tPreprocessing CR (U+000D) and LF (U+000A) characters:');
        var xChar = stream.split('\u000D\u000A').length - 1;
        if (xChar > 0) {
            stream = stream.replace(/\u000D\u000A/g, '\u000D');
            logs.push('\t\tIgnored ' + xChar + ' LF character(s) that immediately follows a CR character');
        }
        else
            logs.push('\t\tNo LF character that immediately follows a CR character');
        xChar = stream.split('\u000D').length - 1;
        if (xChar > 0) {
            stream = stream.replace(/\u000D/g, '\u000A');
            logs.push('\t\tConverted ' + xChar + ' CR character(s) into LF character(s)');
        }
        else
            logs.push('\t\tNo CR character found');

        //End of function
        logs.push('End function PREPROCESSING');
        return ({stream: stream, logs: logs, parseError: parseError});
    }
    catch (err) {
        return ({stream: stream, logs: logs, parseError: parseError, err: err});
    }
}

module.exports = {
    preprocessing: preprocessing
};