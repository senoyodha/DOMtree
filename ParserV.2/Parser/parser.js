// WHATWG ver. 22-06-2016
function parsing(stream, testToken, additional) {
    try {
        // Import modules
        var cls = require('./class');
        var prepro = require('./preprocessing');
        var tknz = require('./tokenization');
        var tree = require('./treeconstruction');

        // Variable Declaration
        var state = {list: [], emit: []};
        var modeList = {
            mode: null,
            listFormat: null,
            stackOpen: null,
            stackTemplate: null,
            adjustedNode: null,
            document: null,
            framesetFlag: null,
            headPointer: null,
            formPointer: null,
            stateNew: null,
            ignoreTokenFlag: null,
            emit: null,
            context: null,
            fragmentParse: null
        };
        var logs = [];

        // Handle additional options
        if (additional != null && Object.keys(additional).length > 0)
            if (additional['initialStates'] != null) {
                state.list.push(additional['initialStates']);
                delete additional['initialStates'];
            }

        function parsingProcess(stream) {
            // Variable declaration
            var currentInput = -1;
            // state = {list: [], emit: []};
            // modeList = {
            //     mode: null,
            //     listFormat: null,
            //     stackOpen: null,
            //     stackTemplate: null,
            //     adjustedNode: null,
            //     document: null,
            //     framesetFlag: null,
            //     headPointer: null,
            //     formPointer: null,
            //     stateNew: null,
            //     ignoreTokenFlag: null,
            //     emit: null,
            //     context: null,
            //     fragmentParse: null
            // };
            // logs = [];

            // Start the function
            logs.push('Input: ' + stream);
            logs.push('Call function PARSINGPROCESS (12.2) (parser.js)');

            // Parsing cycle
            // var cnt = 0;
            do {
                // console.log(stream + ":" + currentInput + ":" + (state.list.length == 0 ? null : state.list[state.list.length - 1]) + ":" + modeList.adjustedNode + ":" + additional);
                // console.log("### " + currentInput + " : "  + stream[currentInput] + " : " + state.list[state.list.length - 1]);
                var resTkn = tknz.tokenization(stream, currentInput, (state.list.length == 0 ? null : state.list[state.list.length - 1]), modeList.adjustedNode, additional);
                // console.log(resTkn);
                // console.log(resTkn.err.stack);
                // console.log("### " + resTkn.currentInput + " : "  + stream[resTkn.currentInput] + " : " + resTkn.state.list[resTkn.state.list.length - 1]);
                // console.log("### " + JSON.stringify(resTkn.state.emit));
                // if(resTkn.err != null)
                //     console.log(resTkn.err.stack);
                currentInput = resTkn.currentInput;
                if (state.list.length == 0) // Initialisation
                    state.list = state.list.concat(resTkn.state.list);
                else // Continuation
                    state.list = state.list.concat(resTkn.state.list.slice(1));
                state.emit = state.emit.concat(resTkn.state.emit);
                logs = logs.concat(resTkn.logs);
                // console.log(resTkn.state.emit);
                if (!testToken) {
                    logs.push('---------------------');
                    if (modeList.ignoreTokenFlag) {
                        modeList.ignoreTokenFlag = null;
                        continue;
                    }
                    // console.log(resTkn.state.emit);
                    var resTree = tree.treeConstruction(resTkn.state, stream, modeList, currentInput);
                    if (resTree.err != null)
                        console.log(resTree.err.stack);
                    logs = logs.concat(resTree.logs);
                    modeList = resTree.modeList;
                    if (modeList.stateNew != null) {
                        state.list.push(modeList.stateNew);
                        modeList.stateNew = null;
                    }
                }
                logs.push('=====================');

                // cnt++;
                // if (cnt > 2)
                //     break;
            } while (state.emit[state.emit.length - 1].type != 'End-of-file');
        }

        // Preprocess stream
        var resPre = prepro.preprocessing(stream);
        if (resPre.parseError > 0) {
            state.emit.push(new cls.tokenParEr('Control or surrogate character in preprocessing stage (PE000)'));
            logs.push('Control or surrogate character in preprocessing stage (PE000)');
        }
        stream = resPre.stream;

        // Parsing process
        logs.push('--PARSING PROCESS--');
        parsingProcess(stream);
        logs.push('--END OF PARSING PROCESS--');

        return ({state: state, modeList: modeList, logs: logs});
    }
    catch (err) {
        return ({state: state, modeList: modeList, logs: logs, err: err});
    }
}

module.exports = {
    parsing: parsing
};