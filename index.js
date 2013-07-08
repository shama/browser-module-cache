var leveljs = require('level-js')
var MemDOWN = require('memdown')
var hasIDB = !!(window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB)

function Cache(opts) {
  var self = this
  opts = opts || {}
  opts.name = opts.name || 'browser-module-cache'
  this.ready = false
  if (hasIDB) this.db = leveljs(opts.name)
  else this.db = new MemDOWN(opts.name)
  this.db.open(function(err, db) {
    if (err) return console.error(err)
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
    this._all(function(err, all) {
      if (err) return cb(err)
      Object.keys(all).forEach(function(key) {
        var val = all[key]
        key = key.split(':')
        if (!res[key[0]]) res[key[0]] = Object.create(null)
        if (key[1] === 'package') val = JSON.parse(val)
        res[key[0]][key[1]] = val
      })
      cb(null, res)
    })
  }
}

Cache.prototype.clear = function(cb) {
  var self = this
  this._all(function(err, all) {
    if (err) return cb(err)
    var ops = Object.keys(all).map(function(key) {
      return {type: 'del', key: key}
    })
    self.db.batch(ops, cb || function() {})
  })
}

Cache.prototype._all = function(cb) {
  var self = this
  var res = Object.create(null)
  function onItem(err, key, val) {
    if (key == null) {
      cb(null, res)
      return
    }
    if (Array.isArray(key)) key = key.join(':')
    res[key] = val
  }
  // hack to make level.js and memdown work the same
  // TODO: fix upstream
  if (hasIDB) {
    this.db.iterator().next(onItem)
  } else {
    this.db._keys.forEach(function(key) {
      onItem(null, key, self.db._store['$' + key])
    })
    onItem(null, null)
  }
}
