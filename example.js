ChunkReader = require('./dist/module.js');

var chunk = new ChunkReader();
console.log(chunk.load(0,10));