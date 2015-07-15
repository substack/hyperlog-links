var links = require('../');
var memdb = require('memdb');
var hyperlog = require('hyperlog');
var test = require('tape');

var docs = [
    ['first\n',[]],
    ['second\n',['1af8ea2525b5975e8a304b16689022c718d159cbec61f3ca22ea45bd5c325227']],
    ['third\n',['f68787ce27c6c9916f7bad8bed3c1ba0636da8250e68b248b348f003c70b3c08']],
    ['3rd\n',['f68787ce27c6c9916f7bad8bed3c1ba0636da8250e68b248b348f003c70b3c08']],
    ['fourth\n',['ba0928a23c8352db6680ae7b54029250a35330a91eff5eb13a55a07cfc6fe7fa',
        '97af398a19c8806449e241bf37b0997fa28745f074d8b2b1f27675dee0612b4e']]
];

test('links', function (t) {
    t.plan(7);
    var ldb = memdb(), db = memdb();
    var log = hyperlog(db, { valueEncoding: 'json' });
    var ln = links(log, ldb, { live: true });
    
    (function next () {
        if (docs.length === 0) return ready();
        var doc = docs.shift();
        log.add(doc[1], doc[0], function (err, node) {
            t.ifError(err);
            next();
        });
    })();
    
    function ready () {
        ln.get('f68787ce27c6c9916f7bad8bed3c1ba0636da8250e68b248b348f003c70b3c08',
        function (err, links) {
            t.ifError(err);
            t.deepEqual(links.sort(), [
                '97af398a19c8806449e241bf37b0997fa28745f074d8b2b1f27675dee0612b4e',
                'ba0928a23c8352db6680ae7b54029250a35330a91eff5eb13a55a07cfc6fe7fa'
            ]);
        });
    }
});
