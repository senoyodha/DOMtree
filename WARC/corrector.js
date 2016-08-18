var fs = require('fs');
var folder = '../../CommonCrawl/Scripted/';
var files = fs.readdirSync(folder);

for (var i in files) {
    // if (i < 28300)
    //     continue;
    console.log('Processing ' + files[i]);
    var read = fs.readFileSync(folder + files[i], 'utf8');
    var str = read.toLowerCase();
    if (str.slice(-6) == '</html') {
        read += '>';
        str += '>';
    }
    if (str.indexOf('</html>') == -1 || str.indexOf('<html') == -1) {
        fs.unlinkSync(folder + files[i]);
        continue;
    }
    while (read.slice(-7).toLowerCase() != '</html>')
        read = read.slice(0, -1);
    fs.writeFileSync(folder + files[i], read);
}