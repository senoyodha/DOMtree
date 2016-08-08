function codePointAt(str, position) {
    var string = str;
    var size = string.length;
    var index = position ? position : 0;
    if (index != index) {
        index = 0;
    }
    if (index < 0 || index >= size) {
        return null;
    }
    var first = string.charCodeAt(index);
    var second;
    if (
        first >= 0xD800 && first <= 0xDBFF &&
        size > index + 1
    ) {
        second = string.charCodeAt(index + 1);
        if (second >= 0xDC00 && second <= 0xDFFF) {
            return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
        }
    }
    return first;
}

console.log(codePointAt('💩', 1));