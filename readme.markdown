# hyperlog-links

compute a reverse link index for [hyperlog](https://npmjs.com/package/hyperlog)
feeds

# example

``` js
var links = require('hyperlog-links');
var hyperlog = require('hyperlog');
var concat = require('concat-stream');

var level = require('level');
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
```

First we'll populate a hyperlog with some data:

```
$ echo first | node links.js add
8e6c09d69f670676cba210c9b2b7edaa6d2d7cb1b2efe1fb8391765b6d1e55e5
$ echo second | node links.js add 8e6c09d69f670676cba210c9b2b7edaa6d2d7cb1b2efe1fb8391765b6d1e55e5
8d2d238eb6fb7c63917fd10188d0ba4582ed3882361f5eccbcb44a0c82a8ab00
$ echo third | node links.js add 8d2d238eb6fb7c63917fd10188d0ba4582ed3882361f5eccbcb44a0c82a8ab00
70761ba863de6f58ba14b43688b15b783b8c2e5755f1d5019c108df2f69186a8
$ echo 3rd | node links.js add 8d2d238eb6fb7c63917fd10188d0ba4582ed3882361f5eccbcb44a0c82a8ab00
c9fcaf59c512217e35074ee96eacebdecabf11191ec57281bae19ee1e62a3741
$ echo fourth | node links.js add 70761ba863de6f58ba14b43688b15b783b8c2e5755f1d5019c108df2f69186a8 c9fcaf59c512217e35074ee96eacebdecabf11191ec57281bae19ee1e62a3741
1e3db2a88640304cd9aaa54dfe1648ebd793ad7c75865ebfd98b272657f22c10
```

We can list the documents that link to any hash:

```
$ node links.js get 8d2d238eb6fb7c63917fd10188d0ba4582ed3882361f5eccbcb44a0c82a8ab00
{ key: '70761ba863de6f58ba14b43688b15b783b8c2e5755f1d5019c108df2f69186a8' }
{ key: 'c9fcaf59c512217e35074ee96eacebdecabf11191ec57281bae19ee1e62a3741' }
```

```
$ node links.js get 70761ba863de6f58ba14b43688b15b783b8c2e5755f1d5019c108df2f69186a8
{ key: '1e3db2a88640304cd9aaa54dfe1648ebd793ad7c75865ebfd98b272657f22c10' }
```

# api

``` js
var links = require('hyperlog-links')
```

## var ln = links(log, db, opts)

Create a link instance `ln` from a hyperlog instance `log`, a levelup object
`db`, and some options:

* `opts.live` - boolean whether to keep the change log open for new updates
* `opts.since` - jump to a change sequence directly. Otherwise a change index
will be stored in the database automatically.

## var r = ln.get(key, cb)

Get all the links to `key` in a readable object stream `r` or `cb(err, keys)`.

`keys` is an array of keys and the object stream returns objects with a `key`
property.

## ln.on('error', function (err) {})

Read error events from the underlying link batch machinery here.

# install

With [npm](https://npmjs.org) do:

```
npm install hyperlog-links
```

# license

MIT
