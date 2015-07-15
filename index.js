var through = require('through2');
var readonly = require('read-only-stream');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var once = require('once');
var xtend = require('xtend');
var pump = require('pump');

var LINK = 'link!';
var CHANGE = 'change';

module.exports = Linker;
inherits(Linker, EventEmitter);

function Linker (log, db, opts) {
    if (!(this instanceof Linker)) return new Linker(log, db, opts);
    var self = this;
    EventEmitter.call(self);
    if (!opts) opts = {};
    self.log = log;
    self.db = db;
    self._ready = false;
    if (opts.since !== undefined) {
        process.nextTick(function () { self.resume(opts) });
    }
    else {
        self.db.get(CHANGE, { valueEncoding: 'json' }, function (err, ch) {
            if (err && err.type === 'NotFoundError') {
                self.resume(opts);
            }
            else if (err) self.emit('error', err)
            else self.resume(xtend(opts, { since: ch }));
        });
    }
}

Linker.prototype.get = function (key, cb) {
    var self = this;
    var links = cb ? [] : null;
    cb = once(cb || noop);
    if (!self._ready) {
        self.once('ready', function () {
            pump(self.get(key), r);
        });
        var r = through.obj();
        return readonly(r);
    }
    var r = self.db.createReadStream({
        gt: LINK + key + '!', lt: LINK + key + '!~'
    });
    r.once('error', cb);
    var tr = through.obj(write, end);
    pump(r, tr);
    return readonly(tr);
    
    function write (row, enc, next) {
        var parts = row.key.split('!');
        if (links) links.push(parts[2]);
        this.push({ key: parts[2] });
        next();
    }
    function end (next) {
        cb(null, links);
        next();
    }
};

Linker.prototype.resume = function (opts) {
    if (!opts) opts = {};
    var self = this;
    
    var r = self.log.createReadStream(xtend(opts, { live: false }));
    pump(r, through.obj(write, end));
    
    function write (row, enc, next) {
        var ops = row.links.map(function (key) {
            return { type: 'put', key: LINK + key + '!' + row.key, value: 0 };
        });
        ops.push({ type: 'put', key: CHANGE, value: row.change });
        self.db.batch(ops, { valueEncoding: 'json' }, next);
    }
    
    function end () {
        self._ready = true;
        if (opts.live === true) {
            var r = self.log.createReadStream(xtend(opts, { live: true }));
        }
        self.emit('ready');
        pump(r, through.obj(write));
    }
};

function noop () {}
