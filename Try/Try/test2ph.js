function utf16Encode(input) {
    var output = [], i = 0, len = input.length, value;
    while (i < len) {
        value = input[i++];
        if ((value & 0xF800) === 0xD800) {
            throw new RangeError("UTF-16(encode): Illegal UTF-16 value");
        }
        if (value > 0xFFFF) {
            value -= 0x10000;
            output.push(String.fromCharCode(((value >>> 10) & 0x3FF) | 0xD800));
            value = 0xDC00 | (value & 0x3FF);
        }
        output.push(String.fromCharCode(value));
    }
    return output.join("");
}

// console.log( utf16Encode([0x1D400]) );
console.log(0x1D400);