var Chunk = require('prismarine-chunk')("1.8");
var Vec3 = require("vec3");

var assert = require('assert');

var chunk=new Chunk();

for (var x = 0; x < 16;x++) {
  for (var z = 0; z < 16; z++) {
    chunk.setBiome(new Vec3(x,0,z),5);
    chunk.setBlockType(new Vec3(x, 50, z), 2);
    for (var y = 0; y < 256; y++) {
      chunk.setSkyLight(new Vec3(x, y, z), 15);
    }
  }
}

var prismarineChunkToNbt=require('../').chunk("1.8").prismarineChunkToNbt;
var nbtChunkToPrismarineChunk=require('../').chunk("1.8").nbtChunkToPrismarineChunk;

var MockChunk = function() {};
MockChunk.prototype = {
  calledFunctions: {},
  recordCall: function(functionName){
    if (!this.calledFunctions[functionName]) {
      this.calledFunctions[functionName] = 1;
    }
    else {
      this.calledFunctions[functionName]++;
    }
  },
  setBlockType: function(){this.recordCall('setBlockType')},
  getBlockType: function(){this.recordCall('getBlockType')},
  setBlockData: function(){this.recordCall('setBlockData')},
  getBlockData: function(){this.recordCall('getBlockData')},
  setBlockLight: function(){this.recordCall('setBlockLight')},
  getBlockLight: function(){this.recordCall('getBlockLight')},
  setSkyLight: function(){this.recordCall('setSkyLight')},
  getSkyLight: function(){this.recordCall('getSkyLight')},
  setBiome: function(){this.recordCall('setBiome')},
  getBiome: function(){this.recordCall('getBiome')}
};

describe("transform chunk to nbt",function(){

  var nbt=prismarineChunkToNbt(chunk);

  it("write with the correct structure",function(){
    assert.equal(nbt.name,'');
    assert.equal(nbt.type,'compound');
  });

  it("can write biomes",function(){
    for(var z=0;z<16;z++)
      for(var x=0;x<16;x++)
       assert(nbt.value.Level.value.Biomes.value[z*16+x]==chunk.getBiome(new Vec3(x,0,z)));
  });

  it("can write sections",function(){
    assert.equal(nbt.value.Level.value.Sections.value.value[3].Blocks.value[16*(16*2)],2);
    //console.log(JSON.stringify(nbt.value.Level.value.Sections.value.value[3].Blocks.value[16*(16*2)],null,2));
  });


  var bufferEqual = require('buffer-equal');
  it("has internal consistency",function(){
    var reChunk=nbtChunkToPrismarineChunk(nbt);
    assert.equal(reChunk.getBlockType(new Vec3(0,50,0)),2,"wrong block type at 0,50,0");
    assert.equal(reChunk.getSkyLight(new Vec3(0,50,0)),15);
    assert(bufferEqual(reChunk.dump(),chunk.dump()))
  });

  it('can read into a provided chunk object', function () {
    var readChunk = new MockChunk();
    var nbt2=prismarineChunkToNbt(chunk);
    readChunk = nbtChunkToPrismarineChunk(nbt2, readChunk);
    assert.ok(readChunk.calledFunctions.setBlockType > 0, 'custom chunk functions have been called');
  });
});