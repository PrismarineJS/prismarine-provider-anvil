var Anvil=require("./../index").Anvil("1.8");
var Vec3 = require("vec3");
var Chunk = require('prismarine-chunk')("1.8");

var chunkF = new Anvil(process.argv[2] ? process.argv[2] : __dirname+"/../world/lttp");

var c=chunkF.saveRaw(-32,0,{"name":"","type":"compound","value":{}});

var p=c.then(function(){
  console.log("saved");
})
.catch(function(err){
  console.log(err.stack);
});

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

var d= p.then(() => chunkF.save(-32,0,chunk));

d.then(function(){
    console.log("saved");
  })
  .catch(function(err){
    console.log(err.stack);
  });