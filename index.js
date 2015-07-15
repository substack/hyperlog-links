var through = require('through2');
var readonly = require('read-only-stream');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var xtend = require('xtend');
var pump = require('pump');

var LINK = 'link!';
var CHANGE = 'change';

module.exports = Linker;
inherits(Linker, EventEmitter);

function Linker (log, db, opts) {
    if (!(this instanceof Linker)) return new Linker(log, opts);
    var self = this;
    EventEmitter.call(self);
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

Linker.prototype.get = function (key) {
    var self = this;
    if (!self._ready) {
        self.once('ready', function () {
            pump(self.get(key), r);
        });
        var r = through.obj();
        return readonly(r);
    }
    var r = self.db.createReadStream({
        gt: LINK, lt: LINK + '~'
    });
    var tr = through.obj(write);
    pump(r, tr);
    return readonly(tr);
    
    function write (row, enc, next) {
        var parts = row.key.split('!');
        this.push({ key: parts[2] });
        next();
    }
};

Linker.prototype.resume = function (opts) {
    if (!opts) opts = {};
    var self = this;
    
    var r = log.createReadStream(opts);
    pump(r, through.obj(write, end));
    
    function write (row, enc, next) {
        var ops = row.links.map(function (key) {
            return { type: 'put', key: LINK + key, value: 0 };
        });
        ops.push({ type: 'put', key: CHANGE, value: row.change });
        self.db.batch(ops, { valueEncoding: 'json' }, next);
    }
    
    function end () {
        self._ready = true;
        self.emit('ready');
    }
};
