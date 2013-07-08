var leveljs = require('level-js')

function Cache(opts) {
  var self = this
  opts = opts || {}
  opts.name = opts.name || 'browser-module-cache'
  this.ready = false
  this.db = leveljs(opts.name)
  this.db.open(function(err, db) {
    if (err) return console.log(err)
    self.ready = true
  })
}
module.exports = function(opts) {
  return new Cache(opts)
}

Cache.prototype.put = function(packages, cb) {
  var self = this
  var ops = []
  Object.keys(packages).forEach(function(module) {
    ops.push({
      type: 'put',
      key: module + ':bundle',
      value: packages[module]['bundle'],
    })
    ops.push({
      type: 'put',
      key: module + ':package',
      value: JSON.stringify(packages[module]['package']),
    })
  })
  self.db.batch(ops, cb)
}

Cache.prototype.get = function(module, cb) {
  var self = this
  if (typeof module === 'function') {
    cb = module
    module = false
  }
  var res = Object.create(null)
  if (module !== false) {
    self.db.get(module + ':bundle', function(err, bundle) {
      if (err) return cb(err)
      self.db.get(module + ':package', function(err, pkg) {
        if (err) return cb(err)
        res['bundle'] = String.fromCharCode.apply(null, new Uint16Array(bundle))
        res['package'] = JSON.parse(String.fromCharCode.apply(null, new Uint16Array(pkg)))
        cb(null, res)
      })
    })
  } else {
    self.db.idb.count(function(count) {
      if (count < 1) return cb(null, res)
      function done() {
        count--
        if (count < 1) cb(null, res)
      }
      self.db.idb.iterate(function(val, info) {
        if (!info) return
        var key = info.key.split(':')
        if (!res[key[0]]) res[key[0]] = Object.create(null)
        if (key[1] === 'package') val = JSON.parse(val)
        res[key[0]][key[1]] = val
        done()
      })
    })
  }
}

Cache.prototype.clear = function(cb) {
  var self = this
  self.db.idb.clear(function() {
    cb(null)
  }, function(err) {
    cb(err)
  })
}
