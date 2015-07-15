var links = require('../');
var level = require('level');
var hyperlog = require('hyperlog');
var concat = require('concat-stream');

var ldb = level('/tmp/l.db'), db = level('/tmp/db');
var log = hyperlog(db, { valueEncoding: 'json' });

var ln = links(log, ldb, { live: true });
if (process.argv[2] === 'add') {
    process.stdin.pipe(concat(function (body) {
        var links = process.argv.slice(3);
        log.add(links, body, function (err, node) {
            console.log(node.key);
        });
    }));
}
else if (process.argv[2] === 'get') {
    ln.get(process.argv[3]).on('data', console.log);
}
