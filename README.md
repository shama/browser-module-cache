# browser-module-cache

Caches browserify-cdn modules using [level.js](https://github.com/maxogden/level.js)

```shell
npm install browser-module-cache
```

## usage

```javascript
var createCache = require('browser-module-cache')
```

## initialize

### createCache(options)

```javascript
var cache = createCache({
  name: 'browser-module-cache', // name of level.js database
  inMemory: false // Whether to force usage of memdown
})
```

## put

### `cache.put(packages, callback)`
Saves a browserify-cdn object where the keys `bundle` and `package` are required.

```javascript
cache.put({
  blah: {
    bundle: 'blahblahblah',
    package: {
      name: 'blah',
      author: 'The Dude',
    },
  },
}, function() {
  console.log('saved!')
})
```

## get

### `cache.get([package, ]callback)`
Gets all or one specific package from cache.

```javascript
cache.get(function(err, modules) {
  console.log('all modules', modules)
})

cache.get('blah', function(err, module) {
  console.log('the blah module', module)
})
```

## clear

### `cache.clear(callback)`
Removes all cached modules.

```javascript
cache.clear(function(err) {
  console.log('all clean')
})
```

## release history
* 0.1.3 - Add `inMemory` option to memdown (@maxogden)
* 0.1.2 - fallsback to memdown if indexedDB not found
* 0.1.1 - return empty object if none found during get
* 0.1.0 - initial release

## license
Copyright (c) 2013 Kyle Robinson Young  
Licensed under the MIT license.
