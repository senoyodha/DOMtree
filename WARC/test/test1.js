var WARCStream = require('warc'),
    fs = require('fs');

var w = new WARCStream();
fs.createReadStream('../node_modules/warc/test/fixtures/CC-MAIN-20140820021334-00006-ip-10-180-136-8.ec2.internal.warc.wat')
    .pipe(w)
    .on('data', function (data) {
        console.log(data);
        /*
         { protocol: 'WARC/1.0',
         headers:
         { 'WARC-Type': 'response',
         'WARC-Date': '2014-08-21T04:21:14Z',
         'WARC-Record-ID': '<urn:uuid:edad822f-2290-4827-a5ab-a52a60348461>',
         'Content-Length': '174',
         'Content-Type': 'application/http; msgtype=response',
         'WARC-Warcinfo-ID': '<urn:uuid:cf083d66-9910-45e2-b5be-a421f9889aac>',
         'WARC-Concurrent-To': '<urn:uuid:9994d4fd-40b0-4d41-b1e7-1dc2a7ccb1e7>',
         'WARC-IP-Address': '65.52.108.2',
         'WARC-Target-URI': 'http://0.r.msn.com/?ld=7v7Pf0o6dfvcggjmXvvsEKhzVUCUxwxRmKzEhcbUqMsh2Ubu9FZw1vPvSOUQKjNaf9lLFIpVKW3sQMR6aOgbPhwm9WR843zZRpT1jbKN7YgaGETlBJG5fdKcfifIi9WSQu9hAx6A&u=www.sportsmanias.com%2Frumors',
         'WARC-Payload-Digest': 'sha1:3I42H3S6NNFQ2MSVX7XZKYAYSCX5QBYJ',
         'WARC-Block-Digest': 'sha1:UHJK3TXZIQRATBF4CIGW33NQ4QAGTE4M' },
         content: <Buffer 48 54 54 50 2f 31 2e 31 20 32 30 30 20 4f 4b 0d 0a 53 65 72 76 65 72 3a 20 4d 69 63 72 6f 73 6f 66 74 2d 49 49 53 2f 38 2e 30 0d 0a 70 33 70 3a 20 43 50 ...> }
         */
    });