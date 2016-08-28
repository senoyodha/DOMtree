// WHATWG ver. 22-06-2016
// Variable declaration
var cls = require('./class');
var tokens = {Character: [], Comment: [], DOCTYPE: [], EndTag: [], StartTag: [], TAG: []};
var logs = [];
var tempBuffer = null;
var adjustedNode = null;
var charRefCode = null;
var returnState = '';
var stream = '';
var currentInput = -1;
var defaultInitial = 'Data state';
var state = {list: [], emit: []};

// State reference
var stateRef = {
    data_state: ['Data state', '12.2.4.1'],
    rcdata_state: ['RCDATA state', '12.2.4.2'],
    rawtext_state: ['RAWTEXT state', '12.2.4.3'],
    script_data_state: ['Script data state', '12.2.4.4'],
    plaintext_state: ['PLAINTEXT state', '12.2.4.5'],
    tag_open_state: ['Tag open state', '12.2.4.6'],
    end_tag_open_state: ['End tag open state', '12.2.4.7'],
    tag_name_state: ['Tag name state', '12.2.4.8'],
    rcdata_less_than_sign_state: ['RCDATA less-than sign state', '12.2.4.9'],
    rcdata_end_tag_open_state: ['RCDATA end tag open state', '12.2.4.10'],
    rcdata_end_tag_name_state: ['RCDATA end tag name state', '12.2.4.11'],
    rawtext_less_than_sign_state: ['RAWTEXT less-than sign state', '12.2.4.12'],
    rawtext_end_tag_open_state: ['RAWTEXT end tag open state', '12.2.4.13'],
    rawtext_end_tag_name_state: ['RAWTEXT end tag name state', '12.2.4.14'],
    script_data_less_than_sign_state: ['Script data less-than sign state', '12.2.4.15'],
    script_data_end_tag_open_state: ['Script data end tag open state', '12.2.4.16'],
    script_data_end_tag_name_state: ['Script data end tag name state', '12.2.4.17'],
    script_data_escape_start_state: ['Script data escape start state', '12.2.4.18'],
    script_data_escape_start_dash_state: ['Script data escape start dash state', '12.2.4.19'],
    script_data_escaped_state: ['Script data escaped state', '12.2.4.20'],
    script_data_escaped_dash_state: ['Script data escaped dash state', '12.2.4.21'],
    script_data_escaped_dash_dash_state: ['Script data escaped dash dash state', '12.2.4.22'],
    script_data_escaped_less_than_sign_state: ['Script data escaped less-than sign state', '12.2.4.23'],
    script_data_escaped_end_tag_open_state: ['Script data escaped end tag open state', '12.2.4.24'],
    script_data_escaped_end_tag_name_state: ['Script data escaped end tag name state', '12.2.4.25'],
    script_data_double_escape_start_state: ['Script data double escape start state', '12.2.4.26'],
    script_data_double_escaped_state: ['Script data double escaped state', '12.2.4.27'],
    script_data_double_escaped_dash_state: ['Script data double escaped dash state', '12.2.4.28'],
    script_data_double_escaped_dash_dash_state: ['Script data double escaped dash dash state', '12.2.4.29'],
    script_data_double_escaped_less_than_sign_state: ['Script data double escaped less-than sign state', '12.2.4.30'],
    script_data_double_escape_end_state: ['Script data double escape end state', '12.2.4.31'],
    before_attribute_name_state: ['Before attribute name state', '12.2.4.32'],
    attribute_name_state: ['Attribute name state', '12.2.4.33'],
    after_attribute_name_state: ['After attribute name state', '12.2.4.34'],
    before_attribute_value_state: ['Before attribute value state', '12.2.4.35'],
    attribute_value_double_quoted_state: ['Attribute value (double-quoted) state', '12.2.4.36'],
    attribute_value_single_quoted_state: ['Attribute value (single-quoted) state', '12.2.4.37'],
    attribute_value_unquoted_state: ['Attribute value (unquoted) state', '12.2.4.38'],
    after_attribute_value_quoted_state: ['After attribute value (quoted) state', '12.2.4.39'],
    self_closing_start_tag_state: ['Self-closing start tag state', '12.2.4.40'],
    bogus_comment_state: ['Bogus comment state', '12.2.4.41'],
    markup_declaration_open_state: ['Markup declaration open state', '12.2.4.42'],
    comment_start_state: ['Comment start state', '12.2.4.43'],
    comment_start_dash_state: ['Comment start dash state', '12.2.4.44'],
    comment_state: ['Comment state', '12.2.4.45'],
    comment_less_than_sign_state: ['Comment less-than sign state', '12.2.4.46'],
    comment_less_than_sign_bang_state: ['Comment less-than sign bang state', '12.2.4.47'],
    comment_less_than_sign_bang_dash_state: ['Comment less-than sign bang dash state', '12.2.4.48'],
    comment_less_than_sign_bang_dash_dash_state: ['Comment less-than sign bang dash dash state', '12.2.4.49'],
    comment_end_dash_state: ['Comment end dash state', '12.2.4.50'],
    comment_end_state: ['Comment end state', '12.2.4.51'],
    comment_end_bang_state: ['Comment end bang state', '12.2.4.52'],
    doctype_state: ['DOCTYPE state', '12.2.4.53'],
    before_doctype_name_state: ['Before DOCTYPE name state', '12.2.4.54'],
    doctype_name_state: ['DOCTYPE name state', '12.2.4.55'],
    after_doctype_name_state: ['After DOCTYPE name state', '12.2.4.56'],
    after_doctype_public_keyword_state: ['After DOCTYPE public keyword state', '12.2.4.57'],
    before_doctype_public_identifier_state: ['Before DOCTYPE public identifier state', '12.2.4.58'],
    doctype_public_identifier_double_quoted_state: ['DOCTYPE public identifier (double-quoted) state', '12.2.4.59'],
    doctype_public_identifier_single_quoted_state: ['DOCTYPE public identifier (single-quoted) state', '12.2.4.60'],
    after_doctype_public_identifier_state: ['After DOCTYPE public identifier state', '12.2.4.61'],
    between_doctype_public_and_system_identifiers_state: ['Between DOCTYPE public and system identifiers state', '12.2.4.62'],
    after_doctype_system_keyword_state: ['After DOCTYPE system keyword state', '12.2.4.63'],
    before_doctype_system_identifier_state: ['Before DOCTYPE system identifier state', '12.2.4.64'],
    doctype_system_identifier_double_quoted_state: ['DOCTYPE system identifier (double-quoted) state', '12.2.4.65'],
    doctype_system_identifier_single_quoted_state: ['DOCTYPE system identifier (single-quoted) state', '12.2.4.66'],
    after_doctype_system_identifier_state: ['After DOCTYPE system identifier state', '12.2.4.67'],
    bogus_doctype_state: ['Bogus DOCTYPE state', '12.2.4.68'],
    cdata_section_state: ['CDATA section state', '12.2.4.69'],
    cdata_section_bracket_state: ['CDATA section bracket state', '12.2.4.70'],
    cdata_section_end_state: ['CDATA section end state', '12.2.4.71'],
    character_reference_state: ['Character reference state', '12.2.4.72'],
    numeric_character_reference_state: ['Numeric character reference state', '12.2.4.73'],
    hexadecimal_character_reference_start_state: ['Hexadecimal character reference start state', '12.2.4.74'],
    decimal_character_reference_start_state: ['Decimal character reference start state', '12.2.4.75'],
    hexadecimal_character_reference_state: ['Hexadecimal character reference state', '12.2.4.76'],
    decimal_character_reference_state: ['Decimal character reference state', '12.2.4.77'],
    numeric_character_reference_end_state: ['Numeric character reference end state', '12.2.4.78'],
    character_reference_end_state: ['Character reference end state', '12.2.4.79']
};

// States definition and supporting algorithm
try {
    var stateSup = {
        now: function () {
            return state.list[state.list.length - 1];
        },
        switch: function (newState, returnState) {
            state.list.push(newState);
            logs.push('\t' + (returnState ? 'Return' : 'Switch') + ' to "' + newState + '" (' + stateRef[this.convert(newState)][1] + ')');
        },
        isEOF: function () {
            return (currentInput >= stream.length);
        },
        switchRef: function () {
            returnState = this.now();
            this.switch('Character reference state');
        },
        returnRef: function () {
            this.reconsumeIn(returnState, true);
            returnState = '';
        },
        convert: function (stateName) {
            return stateName.toLowerCase().replace(/\s/g, '_').replace(/-/g, '_').replace(/\(/g, '').replace(/\)/g, '');
        },
        emitTag: function (token) {
            if (token.constructor.name == "tokenParEr")
                logs.push('\t\tParse error: ' + token.data);
            else {
                if (token.constructor.name == "tokenTag")
                    tokens[token.type].push(token);
                if (token.type == 'EndTag' && token.attribute.length > 0)
                    this.emitTag(new cls.tokenParEr('Attribute defined in end tag token (PE114)'));
                if (token.type == 'EndTag' && token.flag)
                    this.emitTag(new cls.tokenParEr('Self-closing flag set in end tag token (PE115)'));
                logs.push('\t\tEmit: ' + token.type + ' token (' + JSON.stringify(token) + ')');
            }
            state.emit.push(token);
        },
        consumeNext: function () {
            if (stream.codePointAt(currentInput) > 0xFFFF)
                currentInput++;             
            currentInput++;
            var utfCode = (currentInput < stream.length ? stream.codePointAt(currentInput).toString(16).toUpperCase() : 'EOF');
            utfCode = utfCode.length > 4 ? utfCode : ('0000' + utfCode).slice(-4);
            logs.push('\t\tConsume ' + (currentInput < stream.length ? stateSup.getCurrentChar() + ' (U+' + utfCode + ')' : 'EOF'));
        },
        reconsumeIn: function (newState, returnState) {
            var utfCode = (currentInput < stream.length ? stream.codePointAt(currentInput).toString(16).toUpperCase() : 'EOF');
            utfCode = utfCode.length > 4 ? utfCode : ('0000' + utfCode).slice(-4);
            logs.push('\t\tReconsume ' + (currentInput < stream.length ? stateSup.getCurrentChar() + ' (U+' + utfCode + ')' : 'EOF') + ' in "' + newState + '" (' + stateRef[this.convert(newState)][1] + ')');
            this.goPrevChar();
            this.switch(newState, returnState);
        },
        appropriateTag: function () {
            return (tokens.TAG[tokens.TAG.length - 1].name == tokens.StartTag[tokens.StartTag.length - 1].name);
        },
        checkAttr: function () {
            var tokTemp = tokens.TAG[tokens.TAG.length - 1];
            for (var i = 0; i < tokTemp.attribute.length - 1; i++)
                if (tokTemp.attribute[i].name == tokTemp.attribute[tokTemp.attribute.length - 1].name) {
                    tokTemp.attribute.pop();
                    this.emitTag(new cls.tokenParEr('Duplicate attribute name found (PE116)'));
                    return;
                }
        },
        getNextChar: function () {
            if (stream.codePointAt(currentInput) > 0xFFFF)
                return String.fromCodePoint(stream.codePointAt(currentInput + 2));
            return String.fromCodePoint(stream.codePointAt(currentInput + 1));
        },
        goPrevChar: function () {
            if (stream.codePointAt(currentInput - 2) > 0xFFFF)
                currentInput -= 2;
            else
                currentInput--;
        },
        checkEmit: function () {
            for (var i in state.emit)
                if (state.emit[i].type != 'ParseError')
                    return true;
            return false;
        },
        getCurrentChar: function () {
            return (this.isEOF() ? null : String.fromCodePoint(stream.codePointAt(currentInput)));
        }
    };
    var stateDef = {
        data_state: function () { // Data state (12.2.4.1)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0026': // Ampersand (&)
                    stateSup.switchRef();
                    break;
                case '\u003C': // Less-than sign (<)
                    stateSup.switch('Tag open state');
                    break;
                case '\u0000': // NULL
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE001)'));
                    stateSup.emitTag(new cls.tokenCharCom('Character', stateSup.getCurrentChar()));
                    break;
                default:
                    if (stateSup.isEOF())
                        stateSup.emitTag(new cls.tokenEOF(stateSup.now()));
                    else
                        stateSup.emitTag(new cls.tokenCharCom('Character', stateSup.getCurrentChar()));
                    break;
            }
        },
        rcdata_state: function () { // RCDATA state (12.2.4.2)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0026': // Ampersand (&)
                    stateSup.switchRef();
                    break;
                case '\u003C': // Less-than sign (<)
                    stateSup.switch('RCDATA less-than sign state');
                    break;
                case '\u0000': // NULL
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE002)'));
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\uFFFD')); // Replacement character
                    break;
                default:
                    if (stateSup.isEOF())
                        stateSup.emitTag(new cls.tokenEOF(stateSup.now()));
                    else
                        stateSup.emitTag(new cls.tokenCharCom('Character', stateSup.getCurrentChar()));
                    break;
            }
        },
        rawtext_state: function () { // RAWTEXT state (12.2.4.3)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u003C': // Less-than sign (<)
                    stateSup.switch('RAWTEXT less-than sign state');
                    break;
                case '\u0000': // NULL
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE003)'));
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\uFFFD')); // Replacement character
                    break;
                default:
                    if (stateSup.isEOF())
                        stateSup.emitTag(new cls.tokenEOF(stateSup.now()));
                    else
                        stateSup.emitTag(new cls.tokenCharCom('Character', stateSup.getCurrentChar()));
                    break;
            }
        },
        script_data_state: function () { // Script data state (12.2.4.4)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u003C': // Less-than sign (<)
                    stateSup.switch('Script data less-than sign state');
                    break;
                case '\u0000': // NULL
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE004)'));
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\uFFFD')); // Replacement character
                    break;
                default:
                    if (stateSup.isEOF())
                        stateSup.emitTag(new cls.tokenEOF(stateSup.now()));
                    else
                        stateSup.emitTag(new cls.tokenCharCom('Character', stateSup.getCurrentChar()));
                    break;
            }
        },
        plaintext_state: function () { // PLAINTEXT state (12.2.4.5)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0000': // NULL
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE005)'));
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\uFFFD')); // Replacement character
                    break;
                default:
                    if (stateSup.isEOF())
                        stateSup.emitTag(new cls.tokenEOF(stateSup.now()));
                    else
                        stateSup.emitTag(new cls.tokenCharCom('Character', stateSup.getCurrentChar()));
                    break;
            }
        },
        tag_open_state: function () { // Tag open state (12.2.4.6)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0021': // Exclamation mark (!)
                    stateSup.switch('Markup declaration open state');
                    break;
                case '\u002F': // Solidus (/)
                    stateSup.switch('End tag open state');
                    break;
                case '\u003F': // Question mark (?)
                    stateSup.emitTag(new cls.tokenParEr('Bogus comment on "?" (U+003F) (PE006)'));
                    tokens.Comment.push(new cls.tokenCharCom('Comment', ''));
                    stateSup.reconsumeIn('Bogus comment state');
                    break;
                default:
                    if (!stateSup.isEOF() && /[A-Za-z]/g.test(stateSup.getCurrentChar())) {
                        tokens.TAG.push(new cls.tokenTag('StartTag'));
                        stateSup.reconsumeIn('Tag name state');
                    }
                    else {
                        stateSup.emitTag(new cls.tokenParEr('Invalid open tag character (PE007)'));
                        stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                        stateSup.reconsumeIn('Data state');
                    }
                    break;
            }
        },
        end_tag_open_state: function () { // End tag open state (12.2.4.7)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(new cls.tokenParEr('Close end tag without tag name (PE008)'));
                    stateSup.switch('Data state');
                    break;
                default:
                    if (!stateSup.isEOF() && /[A-Za-z]/g.test(stateSup.getCurrentChar())) {
                        tokens.TAG.push(new cls.tokenTag('EndTag'));
                        stateSup.reconsumeIn('Tag name state');
                    }
                    else if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a tag (PE009)'));
                        stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                        stateSup.emitTag(new cls.tokenCharCom('Character', '\u002F')); // Solidus (/)
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        stateSup.emitTag(new cls.tokenParEr('Invalid open end tag character (PE010)'));
                        tokens.Comment.push(new cls.tokenCharCom('Comment', ''));
                        stateSup.reconsumeIn('Bogus comment state');
                    }
                    break;
            }
        },
        tag_name_state: function () { // Tag name state (12.2.4.8)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    stateSup.switch('Before attribute name state');
                    break;
                case '\u002F': // Solidus (/)
                    stateSup.switch('Self-closing start tag state');
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(tokens.TAG[tokens.TAG.length - 1]);
                    stateSup.switch('Data state');
                    break;
                case '\u0000': // NULL
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE011)'));
                    tokens.TAG[tokens.TAG.length - 1].name += '\uFFFD'; // Replacement character
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a tag (PE012)'));
                        stateSup.reconsumeIn('Data state');
                    }
                    else
                        tokens.TAG[tokens.TAG.length - 1].name += stateSup.getCurrentChar().toLowerCase();
                    break;
            }
        },
        rcdata_less_than_sign_state: function () { // RCDATA less-than sign state (12.2.4.9)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002F': // Solidus (/)
                    tempBuffer = '';
                    stateSup.switch('RCDATA end tag open state');
                    break;
                default:
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                    stateSup.reconsumeIn('RCDATA state');
                    break;
            }
        },
        rcdata_end_tag_open_state: function () { // RCDATA end tag open state (12.2.4.10)
            stateSup.consumeNext();
            if (!stateSup.isEOF() && /[A-Za-z]/g.test(stateSup.getCurrentChar())) {
                tokens.TAG.push(new cls.tokenTag('EndTag'));
                stateSup.reconsumeIn('RCDATA end tag name state');
            }
            else {
                stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                stateSup.emitTag(new cls.tokenCharCom('Character', '\u002F')); // Solidus (/)
                stateSup.reconsumeIn('RCDATA state');
            }
        },
        rcdata_end_tag_name_state: function () { // RCDATA end tag name state (12.2.4.11)
            stateSup.consumeNext();
            var flagAny = false;
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    if (stateSup.appropriateTag())
                        stateSup.switch('Before attribute name state');
                    else
                        flagAny = true;
                    break;
                case '\u002F': // Solidus (/)
                    if (stateSup.appropriateTag())
                        stateSup.switch('Self-closing start tag state');
                    else
                        flagAny = true;
                    break;
                case '\u003E': // Greater-than sign (>)
                    if (stateSup.appropriateTag()) {
                        stateSup.emitTag(tokens.TAG[tokens.TAG.length - 1]);
                        stateSup.switch('Data state');
                    }
                    else
                        flagAny = true;
                    break;
                default:
                    if (!stateSup.isEOF() && /[A-Za-z]/g.test(stateSup.getCurrentChar())) {
                        tokens.TAG[tokens.TAG.length - 1].name += stateSup.getCurrentChar().toLowerCase();
                        tempBuffer += stateSup.getCurrentChar().toLowerCase(); // !Improvisation
                    }
                    else
                        flagAny = true;
                    break;
            }
            if (flagAny) {
                stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                stateSup.emitTag(new cls.tokenCharCom('Character', '\u002F')); // Solidus (/)
                for (var i = 0; i < tempBuffer.length; i++)
                    stateSup.emitTag(new cls.tokenCharCom('Character', tempBuffer[i]));
                stateSup.reconsumeIn('RCDATA state');
            }
        },
        rawtext_less_than_sign_state: function () { // RAWTEXT less-than sign state (12.2.4.12)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002F': // Solidus (/)
                    tempBuffer = '';
                    stateSup.switch('RAWTEXT end tag open state');
                    break;
                default:
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                    stateSup.reconsumeIn('RAWTEXT state');
                    break;
            }
        },
        rawtext_end_tag_open_state: function () { // RAWTEXT end tag open state (12.2.4.13)
            stateSup.consumeNext();
            if (!stateSup.isEOF() && /[A-Za-z]/g.test(stateSup.getCurrentChar())) {
                tokens.TAG.push(new cls.tokenTag('EndTag'));
                stateSup.reconsumeIn('RAWTEXT end tag name state');
            }
            else {
                stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                stateSup.emitTag(new cls.tokenCharCom('Character', '\u002F')); // Solidus (/)
                stateSup.reconsumeIn('RAWTEXT state');
            }
        },
        rawtext_end_tag_name_state: function () { // RAWTEXT end tag name state (12.2.4.14)
            stateSup.consumeNext();
            var flagAny = false;
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    if (stateSup.appropriateTag())
                        stateSup.switch('Before attribute name state');
                    else
                        flagAny = true;
                    break;
                case '\u002F': // Solidus (/)
                    if (stateSup.appropriateTag())
                        stateSup.switch('Self-closing start tag state');
                    else
                        flagAny = true;
                    break;
                case '\u003E': // Greater-than sign (>)
                    if (stateSup.appropriateTag()) {
                        stateSup.emitTag(tokens.TAG[tokens.TAG.length - 1]);
                        stateSup.switch('Data state');
                    }
                    else
                        flagAny = true;
                    break;
                default:
                    if (!stateSup.isEOF() && /[A-Za-z]/g.test(stateSup.getCurrentChar())) {
                        tokens.TAG[tokens.TAG.length - 1].name += stateSup.getCurrentChar().toLowerCase();
                        tempBuffer += stateSup.getCurrentChar().toLowerCase();
                    }
                    else
                        flagAny = true;
                    break;
            }
            if (flagAny) {
                stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                stateSup.emitTag(new cls.tokenCharCom('Character', '\u002F')); // Solidus (/)
                for (var i = 0; i < tempBuffer.length; i++)
                    stateSup.emitTag(new cls.tokenCharCom('Character', tempBuffer[i]));
                stateSup.reconsumeIn('RAWTEXT state');
            }
        },
        script_data_less_than_sign_state: function () { // Script data less-than sign state (12.2.4.15)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002F': // Solidus (/)
                    tempBuffer = '';
                    stateSup.switch('Script data end tag open state');
                    break;
                case '\u0021': // Exclamation mark (!)
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u0021')); // Exclamation mark (!)
                    stateSup.switch('Script data escape start state');
                    break;
                default:
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                    stateSup.reconsumeIn('Script data state');
                    break;
            }
        },
        script_data_end_tag_open_state: function () { // Script data end tag open state (12.2.4.16)
            stateSup.consumeNext();
            if (!stateSup.isEOF() && /[A-Za-z]/g.test(stateSup.getCurrentChar())) {
                tokens.TAG.push(new cls.tokenTag('EndTag'));
                stateSup.reconsumeIn('Script data end tag name state');
            }
            else {
                stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                stateSup.emitTag(new cls.tokenCharCom('Character', '\u002F')); // Solidus (/)
                stateSup.reconsumeIn('Script data state');
            }
        },
        script_data_end_tag_name_state: function () { // Script data end tag name state (12.2.4.17)
            stateSup.consumeNext();
            var flagAny = false;
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    if (stateSup.appropriateTag())
                        stateSup.switch('Before attribute name state');
                    else
                        flagAny = true;
                    break;
                case '\u002F': // Solidus (/)
                    if (stateSup.appropriateTag())
                        stateSup.switch('Self-closing start tag state');
                    else
                        flagAny = true;
                    break;
                case '\u003E': // Greater-than sign (>)
                    if (stateSup.appropriateTag()) {
                        stateSup.emitTag(tokens.TAG[tokens.TAG.length - 1]);
                        stateSup.switch('Data state');
                    }
                    else
                        flagAny = true;
                    break;
                default:
                    if (!stateSup.isEOF() && /[A-Za-z]/g.test(stateSup.getCurrentChar())) {
                        tokens.TAG[tokens.TAG.length - 1].name += stateSup.getCurrentChar().toLowerCase();
                        tempBuffer += stateSup.getCurrentChar().toLowerCase(); // !Improvisation
                    }
                    else
                        flagAny = true;
                    break;
            }
            if (flagAny) {
                stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                stateSup.emitTag(new cls.tokenCharCom('Character', '\u002F')); // Solidus (/)
                for (var i = 0; i < tempBuffer.length; i++)
                    stateSup.emitTag(new cls.tokenCharCom('Character', tempBuffer[i]));
                stateSup.reconsumeIn('Script data state');
            }
        },
        script_data_escape_start_state: function () { // Script data escape start state (12.2.4.18)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002D': // Hyphen-minus (-)
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u002D')); // Hyphen-minus (-)
                    stateSup.switch('Script data escape start dash state');
                    break;
                default:
                    stateSup.reconsumeIn('Script data state');
                    break;
            }
        },
        script_data_escape_start_dash_state: function () { // Script data escape start dash state (12.2.4.19)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002D': // Hyphen-minus (-)
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u002D')); // Hyphen-minus (-)
                    stateSup.switch('Script data escaped dash dash state');
                    break;
                default:
                    stateSup.reconsumeIn('Script data state');
                    break;
            }
        },
        script_data_escaped_state: function () { // Script data escaped state (12.2.4.20)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002D': // Hyphen-minus (-)
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u002D')); // Hyphen-minus (-)
                    stateSup.switch('Script data escaped dash state');
                    break;
                case '\u003C': // Less-than sign (<)
                    stateSup.switch('Script data escaped less-than sign state');
                    break;
                case '\u0000': // NULL character
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE013)'));
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\uFFFD')); // Replacement character
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF in script declaration (PE014)'));
                        stateSup.reconsumeIn('Data state');
                    }
                    else
                        stateSup.emitTag(new cls.tokenCharCom('Character', stateSup.getCurrentChar()));
                    break;
            }
        },
        script_data_escaped_dash_state: function () { // Script data escaped dash state (12.2.4.21)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002D': // Hyphen-minus (-)
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u002D')); // Hyphen-minus (-)
                    stateSup.switch('Script data escaped dash dash state');
                    break;
                case '\u003C': // Less-than sign (<)
                    stateSup.switch('Script data escaped less-than sign state');
                    break;
                case '\u0000': // NULL character
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE015)'));
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\uFFFD')); // Replacement character
                    stateSup.switch('Script data escaped state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF in script declaration (PE016)'));
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        stateSup.emitTag(new cls.tokenCharCom('Character', stateSup.getCurrentChar()));
                        stateSup.switch('Script data escaped state');
                    }
                    break;
            }
        },
        script_data_escaped_dash_dash_state: function () { // Script data escaped dash dash state (12.2.4.22)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002D': // Hyphen-minus (-)
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u002D')); // Hyphen-minus (-)
                    break;
                case '\u003C': // Less-than sign (<)
                    stateSup.switch('Script data escaped less-than sign state');
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u003E')); // Greater-than sign (>)
                    stateSup.switch('Script data state');
                    break;
                case '\u0000': // NULL character
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE017)'));
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\uFFFD')); // Replacement character
                    stateSup.switch('Script data escaped state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF in script declaration (PE018)'));
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        stateSup.emitTag(new cls.tokenCharCom('Character', stateSup.getCurrentChar()));
                        stateSup.switch('Script data escaped state');
                    }
                    break;
            }
        },
        script_data_escaped_less_than_sign_state: function () { // Script data escaped less-than sign state (12.2.4.23)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002F': // Solidus (/)
                    tempBuffer = '';
                    stateSup.switch('Script data escaped end tag open state');
                    break;
                default:
                    if (!stateSup.isEOF() && /[A-Za-z]/g.test(stateSup.getCurrentChar())) {
                        tempBuffer = '';
                        stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                        stateSup.reconsumeIn('Script data double escape start state');
                    }
                    else {
                        stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                        stateSup.reconsumeIn('Script data escaped state');
                    }
                    break;
            }
        },
        script_data_escaped_end_tag_open_state: function () { // Script data escaped end tag open state (12.2.4.24)
            stateSup.consumeNext();
            if (!stateSup.isEOF() && /[A-Za-z]/g.test(stateSup.getCurrentChar())) {
                tokens.TAG.push(new cls.tokenTag('EndTag'));
                stateSup.reconsumeIn('Script data escaped end tag name state');
            }
            else {
                stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                stateSup.emitTag(new cls.tokenCharCom('Character', '\u002F')); // Solidus (/)
                stateSup.reconsumeIn('Script data escaped state');
            }
        },
        script_data_escaped_end_tag_name_state: function () { // Script data escaped end tag name state (12.2.4.25)
            stateSup.consumeNext();
            var flagAny = false;
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    if (stateSup.appropriateTag())
                        stateSup.switch('Before attribute name state');
                    else
                        flagAny = true;
                    break;
                case '\u002F': // Solidus (/)
                    if (stateSup.appropriateTag())
                        stateSup.switch('Self-closing start tag state');
                    else
                        flagAny = true;
                    break;
                case '\u003E': // Greater-than sign (>)
                    if (stateSup.appropriateTag()) {
                        stateSup.emitTag(tokens.TAG[tokens.TAG.length - 1]);
                        stateSup.switch('Data state');
                    }
                    else
                        flagAny = true;
                    break;
                default:
                    if (!stateSup.isEOF() && /[A-Za-z]/g.test(stateSup.getCurrentChar())) {
                        tokens.TAG[tokens.TAG.length - 1].name += stateSup.getCurrentChar().toLowerCase();
                        tempBuffer += stateSup.getCurrentChar().toLowerCase();
                    }
                    else
                        flagAny = true;
                    break;
            }
            if (flagAny) {
                stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                stateSup.emitTag(new cls.tokenCharCom('Character', '\u002F')); // Solidus (/)
                for (var i = 0; i < tempBuffer.length; i++)
                    stateSup.emitTag(new cls.tokenCharCom('Character', tempBuffer[i]));
                stateSup.reconsumeIn('Script data escaped state');
            }
        },
        script_data_double_escape_start_state: function () { // Script data double escape start state (12.2.4.26)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                case '\u002F': // Solidus (/)
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(new cls.tokenCharCom('Character', stateSup.getCurrentChar()));
                    if (tempBuffer == 'script')
                        stateSup.switch('Script data double escaped state');
                    else
                        stateSup.switch('Script data escaped state');
                    break;
                default:
                    if (!stateSup.isEOF() && /[A-Za-z]/g.test(stateSup.getCurrentChar())) {
                        tempBuffer += stateSup.getCurrentChar().toLowerCase();
                        stateSup.emitTag(new cls.tokenCharCom('Character', stateSup.getCurrentChar()));
                    }
                    else
                        stateSup.reconsumeIn('Script data escaped state');
                    break;
            }
        },
        script_data_double_escaped_state: function () { // Script data double escaped state (12.2.4.27)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002D': // Hyphen-minus (-)
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u002D')); // Hyphen-minus (-)
                    stateSup.switch('Script data double escaped dash state');
                    break;
                case '\u003C': // Less-than sign (<)
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                    stateSup.switch('Script data double escaped less-than sign state');
                    break;
                case '\u0000': // NULL character
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE019)'));
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\uFFFD')); // Replacement character
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF in script declaration (PE020)'));
                        stateSup.reconsumeIn('Data state');
                    }
                    else
                        stateSup.emitTag(new cls.tokenCharCom('Character', stateSup.getCurrentChar()));
                    break;
            }
        },
        script_data_double_escaped_dash_state: function () { // Script data double escaped dash state (12.2.4.28)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002D': // Hyphen-minus (-)
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u002D')); // Hyphen-minus (-)
                    stateSup.switch('Script data double escaped dash dash state');
                    break;
                case '\u003C': // Less-than sign (<)
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                    stateSup.switch('Script data double escaped less-than sign state');
                    break;
                case '\u0000': // NULL character
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE021)'));
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\uFFFD')); // Replacement character
                    stateSup.switch('Script data double escaped state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF in script declaration (PE022)'));
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        stateSup.emitTag(new cls.tokenCharCom('Character', stateSup.getCurrentChar()));
                        stateSup.switch('Script data double escaped state');
                    }
                    break;
            }
        },
        script_data_double_escaped_dash_dash_state: function () { // Script data double escaped dash dash state (12.2.4.29)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002D': // Hyphen-minus (-)
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u002D')); // Hyphen-minus (-)
                    break;
                case '\u003C': // Less-than sign (<)
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u003C')); // Less-than sign (<)
                    stateSup.switch('Script data double escaped less-than sign state');
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u003E')); // Greater-than sign (>)
                    stateSup.switch('Script data state');
                    break;
                case '\u0000': // NULL character
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE023)'));
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\uFFFD')); // Replacement character
                    stateSup.switch('Script data double escaped state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF in script declaration (PE024)'));
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        stateSup.emitTag(new cls.tokenCharCom('Character', stateSup.getCurrentChar()));
                        stateSup.switch('Script data double escaped state');
                    }
                    break;
            }
        },
        script_data_double_escaped_less_than_sign_state: function () { // Script data double escaped less-than sign state (12.2.4.30)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002F': // Solidus (/)
                    tempBuffer = '';
                    stateSup.switch('Script data double escape end state');
                    break;
                default:
                    stateSup.reconsumeIn('Script data double escaped state');
                    break;
            }
        },
        script_data_double_escape_end_state: function () { // Script data double escape end state (12.2.4.31)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                case '\u002F': // Solidus (/)
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(new cls.tokenCharCom('Character', stateSup.getCurrentChar()));
                    if (tempBuffer == 'script')
                        stateSup.switch('Script data escaped state');
                    else
                        stateSup.switch('Script data double escaped state');
                    break;
                default:
                    if (!stateSup.isEOF() && /[A-Za-z]/g.test(stateSup.getCurrentChar())) {
                        tempBuffer += stateSup.getCurrentChar().toLowerCase();
                        stateSup.emitTag(new cls.tokenCharCom('Character', stateSup.getCurrentChar()));
                    }
                    else
                        stateSup.reconsumeIn('Script data double escaped state');
                    break;
            }
        },
        before_attribute_name_state: function () { // Before attribute name state (12.2.4.32)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    break;
                case '\u002F': // Solidus (/)
                case '\u003E': // Greater-than sign (>)
                    stateSup.reconsumeIn('After attribute name state');
                    break;
                case '\u003D': // Equals sign ( )
                    stateSup.emitTag(new cls.tokenParEr('Equals sign (=) before declaring attribute name (PE025)'));
                    stateSup.checkAttr(); //
                    tokens.TAG[tokens.TAG.length - 1].newAttr(stateSup.getCurrentChar());
                    stateSup.switch('Attribute name state');
                    break;
                default:
                    if (stateSup.isEOF())
                        stateSup.reconsumeIn('After attribute name state');
                    else {
                        stateSup.checkAttr();
                        tokens.TAG[tokens.TAG.length - 1].newAttr();
                        stateSup.reconsumeIn('Attribute name state');
                    }
                    break;
            }
        },
        attribute_name_state: function () { // Attribute name state (12.2.4.33)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                case '\u002F': // Solidus (/)
                case '\u003E': // Greater-than sign (>)
                    stateSup.reconsumeIn('After attribute name state');
                    break;
                case '\u003D': // Equals sign (=)
                    stateSup.switch('Before attribute value state');
                    break;
                case '\u0000': // NULL
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE026)'));
                    tokens.TAG[tokens.TAG.length - 1].attribute[tokens.TAG[tokens.TAG.length - 1].attribute.length - 1].name += '\uFFFD'; // Replacement character
                    break;
                case '\u0022': // Quotation mark (")
                case '\u0027': // Apostrophe (')
                case '\u003C': // Less-than sign (<)
                    stateSup.emitTag(new cls.tokenParEr('Unexpected character for attribute name (PE027)'));
                    tokens.TAG[tokens.TAG.length - 1].attribute[tokens.TAG[tokens.TAG.length - 1].attribute.length - 1].name += stateSup.getCurrentChar();
                    break;
                default:
                    if (stateSup.isEOF())
                        stateSup.reconsumeIn('After attribute name state');
                    else
                        tokens.TAG[tokens.TAG.length - 1].attribute[tokens.TAG[tokens.TAG.length - 1].attribute.length - 1].name += stateSup.getCurrentChar().toLowerCase();
                    break;
            }
        },
        after_attribute_name_state: function () { // After attribute name state (12.2.4.34)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    break;
                case '\u002F': // Solidus (/)
                    stateSup.switch('Self-closing start tag state');
                    break;
                case '\u003D': // Equals sign (=)
                    stateSup.switch('Before attribute value state');
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.checkAttr();
                    stateSup.emitTag(tokens.TAG[tokens.TAG.length - 1]);
                    stateSup.switch('Data state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a tag (PE028)'));
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        stateSup.checkAttr();
                        tokens.TAG[tokens.TAG.length - 1].newAttr();
                        stateSup.reconsumeIn('Attribute name state');
                    }
                    break;
            }
        },
        before_attribute_value_state: function () { // Before attribute value state (12.2.4.35)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    break;
                case '\u0022': // Quotation mark (")
                    stateSup.switch('Attribute value (double-quoted) state');
                    break;
                case '\u0027': // Apostrophe (')
                    stateSup.switch('Attribute value (single-quoted) state');
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(new cls.tokenParEr('Unexpected character for attribute value (PE029)'));
                    stateSup.reconsumeIn('Attribute value (unquoted) state');
                    break;
                default:
                    stateSup.reconsumeIn('Attribute value (unquoted) state');
                    break;
            }
        },
        attribute_value_double_quoted_state: function () { // Attribute value (double-quoted) state (12.2.4.36)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0022': // Quotation mark (")
                    stateSup.switch('After attribute value (quoted) state');
                    break;
                case '\u0026': // Ampersand (&)
                    stateSup.switchRef();
                    break;
                case '\u0000': // NULL
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE030)'));
                    tokens.TAG[tokens.TAG.length - 1].attribute[tokens.TAG[tokens.TAG.length - 1].attribute.length - 1].value += '\uFFFD';
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a tag (PE031)'));
                        stateSup.reconsumeIn('Data state');
                    }
                    else
                        tokens.TAG[tokens.TAG.length - 1].attribute[tokens.TAG[tokens.TAG.length - 1].attribute.length - 1].value += stateSup.getCurrentChar();
                    break;
            }
        },
        attribute_value_single_quoted_state: function () { // Attribute value (single-quoted) state (12.2.4.37)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0027': // Apostrophe (')
                    stateSup.switch('After attribute value (quoted) state');
                    break;
                case '\u0026': // Ampersand (&)
                    stateSup.switchRef();
                    break;
                case '\u0000': // NULL
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE032)'));
                    tokens.TAG[tokens.TAG.length - 1].attribute[tokens.TAG[tokens.TAG.length - 1].attribute.length - 1].value += '\uFFFD';
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a tag (PE033)'));
                        stateSup.reconsumeIn('Data state');
                    }
                    else
                        tokens.TAG[tokens.TAG.length - 1].attribute[tokens.TAG[tokens.TAG.length - 1].attribute.length - 1].value += stateSup.getCurrentChar();
                    break;
            }
        },
        attribute_value_unquoted_state: function () { // Attribute value (unquoted) state (12.2.4.38)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    stateSup.switch('Before attribute name state');
                    break;
                case '\u0026': // Ampersand (&)
                    stateSup.switchRef();
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.checkAttr();
                    stateSup.emitTag(tokens.TAG[tokens.TAG.length - 1]);
                    stateSup.switch('Data state');
                    break;
                case '\u0000': // NULL
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE034)'));
                    tokens.TAG[tokens.TAG.length - 1].attribute[tokens.TAG[tokens.TAG.length - 1].attribute.length - 1].value += '\uFFFD'; // Replacement character
                    break;
                case '\u0022': // Quotation mark (")
                case '\u0027': // Apostrophe (')
                case '\u003C': // Less-than sign (<)
                case '\u003D': // Equals sign (=)
                case '\u0060': // Grave accent (`)
                    stateSup.emitTag(new cls.tokenParEr('Unexpected character for attribute value (PE035)'));
                    tokens.TAG[tokens.TAG.length - 1].attribute[tokens.TAG[tokens.TAG.length - 1].attribute.length - 1].value += stateSup.getCurrentChar();
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a tag (PE036)'));
                        stateSup.reconsumeIn('Data state');
                    }
                    else
                        tokens.TAG[tokens.TAG.length - 1].attribute[tokens.TAG[tokens.TAG.length - 1].attribute.length - 1].value += stateSup.getCurrentChar();
                    break;
            }
        },
        after_attribute_value_quoted_state: function () { // After attribute value (quoted) state (12.2.4.39)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    stateSup.switch('Before attribute name state');
                    break;
                case '\u002F': // Solidus (/)
                    stateSup.switch('Self-closing start tag state');
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.checkAttr();
                    stateSup.emitTag(tokens.TAG[tokens.TAG.length - 1]);
                    stateSup.switch('Data state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a tag (PE037)'));
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        stateSup.emitTag(new cls.tokenParEr('Unexpected character for between attributes (PE038)'));
                        stateSup.reconsumeIn('Before attribute name state');
                    }
                    break;
            }
        },
        self_closing_start_tag_state: function () { // Self-closing start tag state (12.2.4.40)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u003E': // Greater-than sign (>)
                    tokens.TAG[tokens.TAG.length - 1].flag = true;
                    stateSup.checkAttr();
                    stateSup.emitTag(tokens.TAG[tokens.TAG.length - 1]);
                    stateSup.switch('Data state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a tag (PE039)'));
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        stateSup.emitTag(new cls.tokenParEr('Unexpected character in a self-closing tag (PE040)'));
                        stateSup.reconsumeIn('Before attribute name state');
                    }
                    break;
            }
        },
        bogus_comment_state: function () { // Bogus comment state (12.2.4.41)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(tokens.Comment[tokens.Comment.length - 1]);
                    stateSup.switch('Data state');
                    break;
                case '\u0000': // NULL
                    tokens.Comment[tokens.Comment.length - 1].data += '\uFFFD'; // Replacement character
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(tokens.Comment[tokens.Comment.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else
                        tokens.Comment[tokens.Comment.length - 1].data += stateSup.getCurrentChar();
                    break;
            }
        },
        markup_declaration_open_state: function () { // Markup declaration open state (12.2.4.42)
            if (stream.substr(currentInput + 1, 2) == '\u002D\u002D') { // Hyphen-minus (-). Match "--"
                for (var i = 0; i < 2; i++)
                    stateSup.consumeNext();
                tokens.Comment.push(new cls.tokenCharCom('Comment'));
                stateSup.switch('Comment start state');
            }
            else if (stream.substr(currentInput + 1, 7).toUpperCase() == 'DOCTYPE') { // Match "DOCTYPE"
                for (var i = 0; i < 7; i++)
                    stateSup.consumeNext();
                stateSup.switch('DOCTYPE state');
            }
            else if (adjustedNode != null && adjustedNode.namespace != 'http:// www.w3.org/1999/xhtml' && stream.substr(currentInput + 1, 7) == '\u005BCDATA\u005B') { // Left square bracket ([). Match "[CDATA["
                for (var i = 0; i < 7; i++)
                    stateSup.consumeNext();
                stateSup.switch('CDATA section state');
            }
            else {
                stateSup.emitTag(new cls.tokenParEr('Unexpected character in markup declaration (PE041)'));
                tokens.Comment.push(new cls.tokenCharCom('Comment'));
                stateSup.switch('Bogus comment state');
            }
        },
        comment_start_state: function () { // Comment start state (12.2.4.43)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002D': // Hyphen-minus (-)
                    stateSup.switch('Comment start dash state');
                    break;
                // case '\u0000': // NULL
                //     stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE042)'));
                //     tokens.Comment[tokens.Comment.length - 1].data += '\uFFFD'; // Replacement character
                //     stateSup.switch('Comment state');
                //     break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(new cls.tokenParEr('Close the declaration before emit a comment tag (PE043)'));
                    stateSup.emitTag(tokens.Comment[tokens.Comment.length - 1]);
                    stateSup.switch('Data state');
                    break;
                default:
                    // if (stateSup.isEOF()) {
                    //     stateSup.emitTag(new cls.tokenParEr('EOF before emit a comment token (PE044)'));
                    //     stateSup.emitTag(tokens.Comment[tokens.Comment.length - 1]);
                    //     stateSup.reconsumeIn('Data state');
                    // }
                    // else {
                    //     tokens.Comment[tokens.Comment.length - 1].data += stateSup.getCurrentChar();
                    stateSup.reconsumeIn('Comment state');
                    // }
                    break;
            }
        },
        comment_start_dash_state: function () { // Comment start dash state (12.2.4.44)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002D': // Hyphen-minus (-)
                    stateSup.switch('Comment end state');
                    break;
                // case '\u0000': // NULL
                //     stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE045)'));
                //     tokens.Comment[tokens.Comment.length - 1].data += '\u002D\uFFFD'; // Hyphen-minus (-) and replacement character
                //     stateSup.switch('Comment state');
                //     break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(new cls.tokenParEr('Close the declaration before emit a comment tag (PE046)'));
                    stateSup.emitTag(tokens.Comment[tokens.Comment.length - 1]);
                    stateSup.switch('Data state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a comment token (PE047)'));
                        stateSup.emitTag(tokens.Comment[tokens.Comment.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        tokens.Comment[tokens.Comment.length - 1].data += '\u002D'; // Hyphen-minus (-)
                        stateSup.reconsumeIn('Comment state');
                    }
                    break;
            }
        },
        comment_state: function () { // Comment state (12.2.4.45)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u003C': // Less-than (<)
                    tokens.Comment[tokens.Comment.length - 1].data += stateSup.getCurrentChar();
                    stateSup.switch('Comment less-than sign state');
                    break;
                case '\u002D': // Hyphen-minus (-)
                    stateSup.switch('Comment end dash state');
                    break;
                case '\u0000': // NULL
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE048)'));
                    tokens.Comment[tokens.Comment.length - 1].data += '\uFFFD'; // Replacement character
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a comment token (PE049)'));
                        stateSup.emitTag(tokens.Comment[tokens.Comment.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        tokens.Comment[tokens.Comment.length - 1].data += stateSup.getCurrentChar();
                    }
                    break;
            }
        },
        comment_less_than_sign_state: function () { // Comment less-than sign state (12.2.4.46)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0021': // Exclamation mark (!)
                    tokens.Comment[tokens.Comment.length - 1].data += stateSup.getCurrentChar();
                    stateSup.switch('Comment less-than sign bang state');
                    break;
                case '\u003C': // Less-than (<)
                    tokens.Comment[tokens.Comment.length - 1].data += stateSup.getCurrentChar();
                    break;
                default:
                    stateSup.reconsumeIn('Comment state');
                    break;
            }
        },
        comment_less_than_sign_bang_state: function () { // Comment less-than sign bang state (12.2.4.47)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002D': // Hyphen-minus (-)
                    stateSup.switch('Comment less-than sign bang dash state');
                    break;
                default:
                    stateSup.reconsumeIn('Comment state');
                    break;
            }
        },
        comment_less_than_sign_bang_dash_state: function () { // Comment less-than sign bang dash state (12.2.4.48)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002D': // Hyphen-minus (-)
                    stateSup.switch('Comment less-than sign bang dash dash state');
                    break;
                default:
                    stateSup.reconsumeIn('Comment end dash state');
                    break;
            }
        },
        comment_less_than_sign_bang_dash_dash_state: function () { // Comment less-than sign bang dash dash state (12.2.4.49)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u003E': // Greater-than (>)
                    stateSup.reconsumeIn('Comment end state');
                    break;
                default:
                    if (stateSup.isEOF())
                        stateSup.reconsumeIn('Comment end state');
                    else {
                        stateSup.emitTag(new cls.tokenParEr('Supposed to be greater-than character (>) (PE042)'));
                        stateSup.reconsumeIn('Comment end state');
                    }
                    break;
            }
        },
        comment_end_dash_state: function () { // Comment end dash state (12.2.4.50)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002D': // Hyphen-minus (-)
                    stateSup.switch('Comment end state');
                    break;
                // case '\u0000': // NULL
                //     stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE050)'));
                //     tokens.Comment[tokens.Comment.length - 1].data += '\u002D\uFFFD'; // Hyphen-minus (-) and replacement character
                //     stateSup.switch('Comment state');
                //     break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a comment token (PE051)'));
                        stateSup.emitTag(tokens.Comment[tokens.Comment.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        tokens.Comment[tokens.Comment.length - 1].data += '\u002D'; // Hyphen-minus (-)
                        stateSup.reconsumeIn('Comment state');
                    }
                    break;
            }
        },
        comment_end_state: function () { // Comment end state (12.2.4.51)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u003E': // Greater-than (>)
                    stateSup.emitTag(tokens.Comment[tokens.Comment.length - 1]);
                    stateSup.switch('Data state');
                    break;
                // case '\u0000': // NULL
                //     stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE052)'));
                //     tokens.Comment[tokens.Comment.length - 1].data += '\u002D\u002D\uFFFD'; // Hyphen-minus (-) and replacement character
                //     stateSup.switch('Comment state');
                //     break;
                case '\u0021': // Exclamation mark (!)
                    // stateSup.emitTag(new cls.tokenParEr('Unexpected character before emit a comment tag (PE053)'));
                    stateSup.switch('Comment end bang state');
                    break;
                case '\u002D': // Hyphen-minus (-)
                    // stateSup.emitTag(new cls.tokenParEr('Unexpected character before emit a comment tag (PE054)'));
                    tokens.Comment[tokens.Comment.length - 1].data += '\u002D'; // Hyphen-minus (-)
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a comment token (PE055)'));
                        stateSup.emitTag(tokens.Comment[tokens.Comment.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        // stateSup.emitTag(new cls.tokenParEr('Unexpected character before emit a comment tag (PE056)'));
                        tokens.Comment[tokens.Comment.length - 1].data += '\u002D\u002D'; // Hyphen-minus (-)
                        stateSup.reconsumeIn('Comment state');
                    }
                    break;
            }
        },
        comment_end_bang_state: function () { // Comment end bang state (12.2.4.52)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u002D': // Hyphen-minus (-)
                    tokens.Comment[tokens.Comment.length - 1].data += '\u002D\u002D\u0021'; // Two Hyphen-minus (-) and an exclamation mark (!)
                    stateSup.switch('Comment end dash state');
                    break;
                case '\u003E': // Greater-than (>)
                    stateSup.emitTag(new cls.tokenParEr('Greater-than character (>) after bang (PE044)'));
                    stateSup.emitTag(tokens.Comment[tokens.Comment.length - 1]);
                    stateSup.switch('Data state');
                    break;
                // case '\u0000': // NULL
                //     stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE057)'));
                //     tokens.Comment[tokens.Comment.length - 1].data += '\u002D\u002D\u0021\uFFFD'; // Hyphen-minus (-), exclamation mark (!), and replacement character
                //     stateSup.switch('Comment state');
                //     break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a comment token (PE058)'));
                        stateSup.emitTag(tokens.Comment[tokens.Comment.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        tokens.Comment[tokens.Comment.length - 1].data += '\u002D\u002D\u0021'; // Hyphen-minus (-) and exclamation mark (!)
                        stateSup.reconsumeIn('Comment state');
                    }
                    break;
            }
        },
        doctype_state: function () { // DOCTYPE state (12.2.4.53)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    stateSup.switch('Before DOCTYPE name state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a DOCTYPE token (PE059)'));
                        tokens.DOCTYPE.push(new cls.tokenDOCTYPE(null, 'on'));
                        stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        stateSup.emitTag(new cls.tokenParEr('Unexpected character in DOCTYPE declaration (PE060)'));
                        stateSup.reconsumeIn('Before DOCTYPE name state');
                    }
                    break;
            }
        },
        before_doctype_name_state: function () { // Before DOCTYPE name state (12.2.4.54)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    break;
                case '\u0000': // NULL
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE061)'));
                    tokens.DOCTYPE.push(new cls.tokenDOCTYPE('\uFFFD')); // Replacement character
                    stateSup.switch('DOCTYPE name state');
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(new cls.tokenParEr('Close the DOCTYPE token before it is completed (PE062)'));
                    tokens.DOCTYPE.push(new cls.tokenDOCTYPE(null, 'on')); // Replacement character
                    stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                    stateSup.switch('Data state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a DOCTYPE token (PE063)'));
                        tokens.DOCTYPE.push(new cls.tokenDOCTYPE(null, 'on'));
                        stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        tokens.DOCTYPE.push(new cls.tokenDOCTYPE(stateSup.getCurrentChar().toLowerCase()));
                        stateSup.switch('DOCTYPE name state');
                    }
                    break;
            }
        },
        doctype_name_state: function () { // DOCTYPE name state (12.2.4.55)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    stateSup.switch('After DOCTYPE name state');
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                    stateSup.switch('Data state');
                    break;
                case '\u0000': // NULL
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE064)'));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].name += '\uFFFD'; // Replacement character
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a DOCTYPE token (PE065)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].name += stateSup.getCurrentChar().toLowerCase();
                    break;
            }
        },
        after_doctype_name_state: function () { // After DOCTYPE name state (12.2.4.56)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                    stateSup.switch('Data state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a DOCTYPE token (PE066)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else if (stream.substr(currentInput, 6).toUpperCase() == 'PUBLIC') {
                        for (var i = 0; i < 5; i++)
                            stateSup.consumeNext();
                        stateSup.switch('After DOCTYPE public keyword state');
                    }
                    else if (stream.substr(currentInput, 6).toUpperCase() == 'SYSTEM') {
                        for (var i = 0; i < 5; i++)
                            stateSup.consumeNext();
                        stateSup.switch('After DOCTYPE system keyword state');
                    }
                    else {
                        stateSup.emitTag(new cls.tokenParEr('Unexpected character in DOCTYPE declaration (PE067)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.switch('Bogus DOCTYPE state');
                    }
                    break;
            }
        },
        after_doctype_public_keyword_state: function () { // After DOCTYPE public keyword state (12.2.4.57)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    stateSup.switch('Before DOCTYPE public identifier state');
                    break;
                case '\u0022': // Quotation mark (")
                    stateSup.emitTag(new cls.tokenParEr('Quotation mark (") as DOCTYPE PUBLIC value without space (PE068)'));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].publicId = '';
                    stateSup.switch('DOCTYPE public identifier (double-quoted) state');
                    break;
                case '\u0027': // Apostrophe (')
                    stateSup.emitTag(new cls.tokenParEr("Apostrophe (') as DOCTYPE PUBLIC value without space (PE069)"));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].publicId = '';
                    stateSup.switch('DOCTYPE public identifier (single-quoted) state');
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(new cls.tokenParEr('Close the tag before emit a DOCTYPE token (PE070)'));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                    stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                    stateSup.switch('Data state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a DOCTYPE token (PE071)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        stateSup.emitTag(new cls.tokenParEr('Unexpected character before DOCTYPE PUBLIC declaration (PE072)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.switch('Bogus DOCTYPE state');
                    }
                    break;
            }
        },
        before_doctype_public_identifier_state: function () { // Before DOCTYPE public identifier state (12.2.4.58)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    break;
                case '\u0022': // Quotation mark (")
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].publicId = '';
                    stateSup.switch('DOCTYPE public identifier (double-quoted) state');
                    break;
                case '\u0027': // Apostrophe (')
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].publicId = '';
                    stateSup.switch('DOCTYPE public identifier (single-quoted) state');
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(new cls.tokenParEr('Close the tag before emit a DOCTYPE token (PE073)'));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                    stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                    stateSup.switch('Data state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a DOCTYPE token (PE074)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        stateSup.emitTag(new cls.tokenParEr('Unexpected character in DOCTYPE PUBLIC declaration (PE075)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.switch('Bogus DOCTYPE state');
                    }
                    break;
            }
        },
        doctype_public_identifier_double_quoted_state: function () { // DOCTYPE public identifier (double-quoted) state (12.2.4.59)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0022': // Quotation mark (")
                    stateSup.switch('After DOCTYPE public identifier state');
                    break;
                case '\u0000': // NULL
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE076)'));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].publicId += '\uFFFD'; // Replacement character
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(new cls.tokenParEr('Close the tag before emit a DOCTYPE token (PE077)'));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                    stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                    stateSup.switch('Data state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a DOCTYPE token (PE078)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].publicId += stateSup.getCurrentChar();
                    break;
            }
        },
        doctype_public_identifier_single_quoted_state: function () { // DOCTYPE public identifier (single-quoted) state (12.2.4.60)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0027': // Apostrophe (')
                    stateSup.switch('After DOCTYPE public identifier state');
                    break;
                case '\u0000': // NULL
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE079)'));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].publicId += '\uFFFD'; // Replacement character
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(new cls.tokenParEr('Close the tag before emit a DOCTYPE token (PE080)'));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                    stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                    stateSup.switch('Data state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a DOCTYPE token (PE081)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].publicId += stateSup.getCurrentChar();
                    break;
            }
        },
        after_doctype_public_identifier_state: function () { // After DOCTYPE public identifier state (12.2.4.61)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    stateSup.switch('Between DOCTYPE public and system identifiers state');
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                    stateSup.switch('Data state');
                    break;
                case '\u0022': // Quotation mark (")
                    stateSup.emitTag(new cls.tokenParEr('Quotation mark (") as DOCTYPE SYSTEM value without space (PE082)'));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].systemId = '';
                    stateSup.switch('DOCTYPE system identifier (double-quoted) state');
                    break;
                case '\u0027': // Apostrophe (')
                    stateSup.emitTag(new cls.tokenParEr("Apostrophe (') as DOCTYPE SYSTEM value without space (PE083)"));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].systemId = '';
                    stateSup.switch('DOCTYPE system identifier (single-quoted) state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a DOCTYPE token (PE084)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        stateSup.emitTag(new cls.tokenParEr('Unexpected character in DOCTYPE SYSTEM declaration (PE085)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.switch('Bogus DOCTYPE state');
                    }
                    break;
            }
        },
        between_doctype_public_and_system_identifiers_state: function () { // Between DOCTYPE public and system identifiers state (12.2.4.62)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                    stateSup.switch('Data state');
                    break;
                case '\u0022': // Quotation mark (")
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].systemId = '';
                    stateSup.switch('DOCTYPE system identifier (double-quoted) state');
                    break;
                case '\u0027': // Apostrophe (')
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].systemId = '';
                    stateSup.switch('DOCTYPE system identifier (single-quoted) state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a DOCTYPE token (PE086)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        stateSup.emitTag(new cls.tokenParEr('Unexpected character in DOCTYPE SYSTEM declaration (PE087)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.switch('Bogus DOCTYPE state');
                    }
                    break;
            }
        },
        after_doctype_system_keyword_state: function () { // After DOCTYPE system keyword state (12.2.4.63)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    stateSup.switch('Before DOCTYPE system identifier state');
                    break;
                case '\u0022': // Quotation mark (")
                    stateSup.emitTag(new cls.tokenParEr('Quotation mark (") as DOCTYPE PUBLIC value without space (PE088)'));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].systemId = '';
                    stateSup.switch('DOCTYPE system identifier (double-quoted) state');
                    break;
                case '\u0027': // Apostrophe (')
                    stateSup.emitTag(new cls.tokenParEr("Apostrophe (') as DOCTYPE PUBLIC value without space (PE089)"));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].systemId = '';
                    stateSup.switch('DOCTYPE system identifier (single-quoted) state');
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(new cls.tokenParEr('Close the tag before emit a DOCTYPE token (PE090)'));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                    stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                    stateSup.switch('Data state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a DOCTYPE token (PE091)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        stateSup.emitTag(new cls.tokenParEr('Unexpected character before DOCTYPE SYSTEM declaration (PE092)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.switch('Bogus DOCTYPE state');
                    }
                    break;
            }
        },
        before_doctype_system_identifier_state: function () { // Before DOCTYPE system identifier state (12.2.4.64)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    break;
                case '\u0022': // Quotation mark (")
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].systemId = '';
                    stateSup.switch('DOCTYPE system identifier (double-quoted) state');
                    break;
                case '\u0027': // Apostrophe (')
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].systemId = '';
                    stateSup.switch('DOCTYPE system identifier (single-quoted) state');
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(new cls.tokenParEr('Close the tag before emit a DOCTYPE token (PE093)'));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                    stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                    stateSup.switch('Data state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a DOCTYPE token (PE094)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        stateSup.emitTag(new cls.tokenParEr('Unexpected character in DOCTYPE SYSTEM declaration (PE095)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.switch('Bogus DOCTYPE state');
                    }
                    break;
            }
        },
        doctype_system_identifier_double_quoted_state: function () { // DOCTYPE system identifier (double-quoted) state (12.2.4.65)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0022': // Quotation mark (")
                    stateSup.switch('After DOCTYPE system identifier state');
                    break;
                case '\u0000': // NULL
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE096)'));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].systemId += '\uFFFD'; // Replacement character
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(new cls.tokenParEr('Close the tag before emit a DOCTYPE token (PE097)'));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                    stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                    stateSup.switch('Data state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a DOCTYPE token (PE098)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].systemId += stateSup.getCurrentChar();
                    break;
            }
        },
        doctype_system_identifier_single_quoted_state: function () { // DOCTYPE system identifier (single-quoted) state (12.2.4.66)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0027': // Apostrophe (')
                    stateSup.switch('After DOCTYPE system identifier state');
                    break;
                case '\u0000': // NULL
                    stateSup.emitTag(new cls.tokenParEr('NULL (U+0000) character (PE099)'));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].systemId += '\uFFFD'; // Replacement character
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(new cls.tokenParEr('Close the tag before emit a DOCTYPE token (PE100)'));
                    tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                    stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                    stateSup.switch('Data state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a DOCTYPE token (PE101)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].systemId += stateSup.getCurrentChar();
                    break;
            }
        },
        after_doctype_system_identifier_state: function () { // After DOCTYPE system identifier state (12.2.4.67)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                    stateSup.switch('Data state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before emit a DOCTYPE token (PE102)'));
                        tokens.DOCTYPE[tokens.DOCTYPE.length - 1].flag = 'on';
                        stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    else {
                        stateSup.emitTag(new cls.tokenParEr('Unexpected character after DOCTYPE SYSTEM declaration (PE103)'));
                        stateSup.switch('Bogus DOCTYPE state');
                    }
                    break;
            }
        },
        bogus_doctype_state: function () { // Bogus DOCTYPE state (12.2.4.68)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u003E': // Greater-than sign (>)
                    stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                    stateSup.switch('Data state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(tokens.DOCTYPE[tokens.DOCTYPE.length - 1]);
                        stateSup.reconsumeIn('Data state');
                    }
                    break;
            }
        },
        cdata_section_state: function () { // CDATA section state (12.2.4.69)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u005D': // Right square bracket (])
                    stateSup.switch('CDATA section bracket state');
                    break;
                default:
                    if (stateSup.isEOF()) {
                        stateSup.emitTag(new cls.tokenParEr('EOF before complete CDATA section (PE104)'));
                        stateSup.reconsumeIn('Data state');
                    }
                    else
                        stateSup.emitTag(new cls.tokenCharCom('Character', stateSup.getCurrentChar()));
                    break;
            }
        },
        cdata_section_bracket_state: function () { // CDATA section bracket state (12.2.4.70)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u005D': // Right square bracket (])
                    stateSup.switch('CDATA section end state');
                    break;
                default:
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u005D')); // Right square bracket (])
                    stateSup.reconsumeIn('CDATA section state');
                    break;
            }
        },
        cdata_section_end_state: function () { // CDATA section end state (12.2.4.71)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u005D': // Right square bracket (])
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u005D')); // Right square bracket (])
                    break;
                case '\u003E': // Greater-than sign (>)
                    stateSup.switch('Data state');
                    break;
                default:
                    stateSup.emitTag(new cls.tokenCharCom('Character', '\u005D\u005D')); // Right square bracket (])
                    stateSup.reconsumeIn('CDATA section state');
                    break;
            }
        },
        character_reference_state: function () { // Character reference state (12.2.4.72)
            tempBuffer = '\u0026'; // Ampersand character (&)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0009': // Character tabulation (tab)
                case '\u000A': // Line feed (LF)
                case '\u000C': // Form feed (FF)
                case '\u0020': // Space ( )
                case '\u003C': // Less-than sign (<)
                case '\u0026': // Ampersand (&)
                    stateSup.reconsumeIn('Character reference end state');
                    break;
                case '\u0023': // Number sign (#)
                    tempBuffer += stateSup.getCurrentChar();
                    stateSup.switch('Numeric character reference state');
                    break;
                default:
                    if (stateSup.isEOF())
                        stateSup.reconsumeIn('Character reference end state');
                    else {
                        var refSpec = require('./entities.json');
                        var ln = 0;
                        logs.push('\t\tUnconsume current input (' + stateSup.getCurrentChar() + ')');
                        stateSup.goPrevChar(); // !Improvisation
                        var currentInputOri = currentInput;
                        var match = null;
                        var consume = '\u0026'; // Ampersand character (&)

                        for (var key in refSpec)
                            if (key.length > ln)
                                ln = key.length;

                        logs.push('\t\tTry to match with the character reference list:');
                        for (var i = 0; i < ln; i++) {
                            stateSup.consumeNext();
                            if (stateSup.isEOF())
                                break;
                            consume += stateSup.getCurrentChar();
                            tempBuffer += stateSup.getCurrentChar();
                            if (refSpec[consume] != null) {
                                match = consume;
                                logs.push('\t\tMatch: ' + match);
                            }
                        }

                        if (match == null) {
                            logs.push('\t\tNo character reference matched. Unconsume all characters except ampersand (&)');
                            currentInput = currentInputOri;
                            if (/^&([0-9A-Za-z])+;/.test(tempBuffer)) // Match ampersand (&), one or more alphanumeric characters, and semicolon (;)
                                stateSup.emitTag(new cls.tokenParEr('Unregistered character reference (' + /^&([0-9A-Za-z])+;/.exec(tempBuffer)[0] + ') (PE105)'));
                            tempBuffer = '\u0026'; // !Improvisation. Ampersand character (&)
                        }
                        else {
                            currentInput = currentInputOri + match.length - 1; // !Improvisation
                            if (['Attribute value (double-quoted) state', 'Attribute value (single-quoted) state', 'Attribute value (unquoted) state'].indexOf(returnState) != -1
                                && match.substr(-1) != '\u003B' && /[0-9A-Za-z=]/.test(stateSup.getNextChar()) && stateSup.getNextChar() != null) { // Semicolon (;)
                                logs.push('\t\tHistorical character reference (' + match + '). No conversion');
                                tempBuffer = match; // !Improvisation
                            }
                            else {
                                logs.push('\t\tFinal matched reference: ' + match);
                                if (match.substr(-1) != '\u003B')
                                    stateSup.emitTag(new cls.tokenParEr('Character reference without semicolon (;) (PE106)'));
                                tempBuffer = refSpec[match]["characters"];
                                logs.push('\t\tConvert character reference ' + match + ' to ' + tempBuffer);
                            }
                        }
                        stateSup.switch('Character reference end state');
                    }
                    break;
            }
        },
        numeric_character_reference_state: function () { // Numeric character reference state (12.2.4.73)
            charRefCode = 0;
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u0078': // Latin small letter x (x)
                case '\u0058': // Latin capital letter x (X)
                    tempBuffer += stateSup.getCurrentChar();
                    stateSup.switch('Hexadecimal character reference start state');
                    break;
                default:
                    stateSup.reconsumeIn('Decimal character reference start state');
                    break;
            }
        },
        hexadecimal_character_reference_start_state: function () { // Hexadecimal character reference start state (12.2.4.74)
            stateSup.consumeNext();
            if (!stateSup.isEOF() && /[0-9A-Fa-f]/.test(stateSup.getCurrentChar())) // ASCII hex digit
                stateSup.reconsumeIn('Hexadecimal character reference state');
            else {
                stateSup.emitTag(new cls.tokenParEr('Unexpected character in hexadecimal character reference (PE107)'));
                stateSup.reconsumeIn('Character reference end state');
            }
        },
        decimal_character_reference_start_state: function () { // Decimal character reference start state (12.2.4.75)
            stateSup.consumeNext();
            if (!stateSup.isEOF() && /[0-9]/.test(stateSup.getCurrentChar())) // ASCII digit
                stateSup.reconsumeIn('Decimal character reference state');
            else {
                stateSup.emitTag(new cls.tokenParEr('Unexpected character in decimal character reference (PE108)'));
                stateSup.reconsumeIn('Character reference end state');
            }
        },
        hexadecimal_character_reference_state: function () { // Hexadecimal character reference state (12.2.4.76)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u003B': // Semicolon (;)
                    stateSup.switch('Numeric character reference end state');
                    break;
                default:
                    if (!stateSup.isEOF() && /[A-F]/.test(stateSup.getCurrentChar())) { // !Improvisation (wrong definition in spec). Uppercase ASCII hex digit
                        charRefCode *= 16;
                        charRefCode += stream.codePointAt(currentInput) - 0x0037;
                    }
                    else if (!stateSup.isEOF() && /[a-f]/.test(stateSup.getCurrentChar())) { // !Improvisation (wrong definition in spec). Lowercase ASCII hex digit
                        charRefCode *= 16;
                        charRefCode += stream.codePointAt(currentInput) - 0x0057;
                    }
                    else if (!stateSup.isEOF() && /[0-9]/.test(stateSup.getCurrentChar())) { // ASCII digit
                        charRefCode *= 16;
                        charRefCode += stream.codePointAt(currentInput) - 0x0030;
                    }
                    else {
                        stateSup.emitTag(new cls.tokenParEr('Unexpected character in hexadecimal character reference (PE109)'));
                        stateSup.reconsumeIn('Numeric character reference end state');
                    }
                    break;
            }
        },
        decimal_character_reference_state: function () { // Decimal character reference state (12.2.4.77)
            stateSup.consumeNext();
            switch (stateSup.getCurrentChar()) {
                case '\u003B': // Semicolon (;)
                    stateSup.switch('Numeric character reference end state');
                    break;
                default:
                    if (!stateSup.isEOF() && /[0-9]/.test(stateSup.getCurrentChar())) { // ASCII digit
                        charRefCode *= 10;
                        charRefCode += stream.codePointAt(currentInput) - 0x0030;
                    }
                    else {
                        stateSup.emitTag(new cls.tokenParEr('Unexpected character in decimal character reference (PE110)'));
                        stateSup.reconsumeIn('Numeric character reference end state');
                    }
                    break;
            }
        },
        numeric_character_reference_end_state: function () { // Numeric character reference end state (12.2.4.78)
            var charList = [[0x00, 0xFFFD], [0x80, 0x20AC], [0x82, 0x201A], [0x83, 0x0192], [0x84, 0x201E], [0x85, 0x2026],
                [0x86, 0x2020], [0x87, 0x2021], [0x88, 0x02C6], [0x89, 0x2030], [0x8A, 0x0160], [0x8B, 0x2039], [0x8C, 0x0152],
                [0x8E, 0x017D], [0x91, 0x2018], [0x92, 0x2019], [0x93, 0x201C], [0x94, 0x201D], [0x95, 0x2022], [0x96, 0x2013],
                [0x97, 0x2014], [0x98, 0x02DC], [0x99, 0x2122], [0x9A, 0x0161], [0x9B, 0x203A], [0x9C, 0x0153], [0x9E, 0x017E],
                [0x9F, 0x0178]];
            // stateSup.consumeNext();
            for (var i in charList)
                if (charList[i][0] == charRefCode) {
                    stateSup.emitTag(new cls.tokenParEr('Registered forbidden character reference (PE111)'));
                    charRefCode = charList[i][1];
                    break;
                }
            var between = function (start, end) {
                return start <= charRefCode && charRefCode <= end;
            };
            if (between(0xD800, 0xDFFF) || 0x10FFFF < charRefCode) {
                stateSup.emitTag(new cls.tokenParEr('Invalid character reference (PE112)'));
                charRefCode = 0xFFFD;
            }
            else {
                var charEq = [0x000B, 0xFFFE, 0xFFFF, 0x1FFFE, 0x1FFFF, 0x2FFFE, 0x2FFFF, 0x3FFFE, 0x3FFFF, 0x4FFFE, 0x4FFFF,
                    0x5FFFE, 0x5FFFF, 0x6FFFE, 0x6FFFF, 0x7FFFE, 0x7FFFF, 0x8FFFE, 0x8FFFF, 0x9FFFE, 0x9FFFF, 0xAFFFE, 0xAFFFF,
                    0xBFFFE, 0xBFFFF, 0xCFFFE, 0xCFFFF, 0xDFFFE, 0xDFFFF, 0xEFFFE, 0xEFFFF, 0xFFFFE, 0xFFFFF, 0x10FFFE, 0x10FFFF];
                if (between(0x0001, 0x0008) || between(0x000D, 0x001F) || between(0x007F, 0x009F) || between(0xFDD0, 0xFDEF) || charEq.indexOf(charRefCode) != -1)
                    stateSup.emitTag(new cls.tokenParEr('Invalid character reference (PE113)'));
            }
            tempBuffer = String.fromCodePoint(charRefCode); // !Improvisation
            stateSup.switch('Character reference end state');
        },
        character_reference_end_state: function () { // Character reference end state (12.2.4.79)
            stateSup.consumeNext();
            switch (returnState) {
                case 'Attribute value (double-quoted) state': // 12.2.4.36
                case 'Attribute value (single-quoted) state': // 12.2.4.37
                case 'Attribute value (unquoted) state': // 12.2.4.38
                    tokens.TAG[tokens.TAG.length - 1].attribute[tokens.TAG[tokens.TAG.length - 1].attribute.length - 1].value += tempBuffer;
                    break;
                default:
                    var cnt = 0;
                    while (true) {
                        stateSup.emitTag(new cls.tokenCharCom('Character', String.fromCodePoint(tempBuffer.codePointAt(cnt))));
                        if (tempBuffer.codePointAt(cnt) > 0xFFFF)
                            cnt++;
                        cnt++;
                        if (cnt >= tempBuffer.length)
                            break;
                    }
            }
            stateSup.returnRef();
        }
    };
}
catch (err) {
    console.log(err.stack);
    return ({err: err});
}

// Main function
function tokenization(streamIn, currentInputIn, startState, adjustedNodeIn, additional) {
    try {
        // Clear variable value
        logs = [];
        state = {list: [], emit: []};

        // Start the function
        logs.push('Call function TOKENIZATION (12.2.4) (tokenization.js)');

        // Handle additional
        if (additional != null && Object.keys(additional).length > 0)
            if (additional['lastStartTag'] != null) {
                tokens['StartTag'].push(new cls.tokenTag('StartTag', additional['lastStartTag']));
                delete additional['lastStartTag'];
            }

        // Initialising state
        stream = (streamIn == null ? '' : streamIn);
        currentInput = (currentInputIn == null ? -1 : currentInputIn);
        state.list.push(startState == null ? defaultInitial : startState);
        adjustedNode = adjustedNodeIn;
        logs.push('\tInput stream: ' + stream);
        logs.push('\tCurrent input position: ' + currentInputIn + ' --> ' + currentInput + ' (' + (currentInput == -1 || currentInput >= stream.length ? null : stateSup.getCurrentChar()) + ')');
        logs.push('\tStarting state: ' + startState + ' --> ' + stateSup.now());
        logs.push('\tAdjusted node: ' + adjustedNodeIn + ' --> ' + adjustedNode);
        logs.push('\tStart tokenizing the stream. Enter "' + stateSup.now() + '" ' + (startState == null ? '(12.2.4.1) (initialisation)' :
            '(' + stateRef[stateSup.convert(startState)][1] + ') (continuation)'));

        // Main process
        while (true) {
            stateDef[stateSup.convert(stateSup.now())]();
            if (state.emit.length != 0 && stateSup.checkEmit())
                break;
        }
        // End of function
        logs.push('End function TOKENIZATION');
        return ({state: state, logs: logs, currentInput: currentInput});
    }
    catch (err) {
        console.log(err.stack);
        return ({state: state, logs: logs, currentInput: currentInput, err: err});
    }
}

module.exports = {
    stateDef: stateDef,
    stateSup: stateSup,
    tokenization: tokenization
}