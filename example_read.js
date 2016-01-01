var Anvil=require("./dist/anvil");
var Vec3 = require("vec3");
var getNbtValue=require('./dist/chunk').getNbtValue;
var nbtChunkToPrismarineChunk=require('./dist/chunk').nbtChunkToPrismarineChunk;

var chunk = new Anvil(process.argv[2] ? process.argv[2] : "world/lttp");

var c=chunk.load(-32,0);


c.then(function(data){
  //console.log(JSON.stringify(data,null,1));
  var value=getNbtValue(data);
  //console.log(JSON.stringify(value,null,1));
  //console.log(value["Level"]["Sections"][0]["Blocks"]);
   // console.log(value.Level.Sections.length);
  //console.log(value.Level.Sections);

  //console.log(value.Level.Biomes.length);

  var chunk=nbtChunkToPrismarineChunk(value);

  console.log(chunk.getBlock(new Vec3(1,1,15)));
})
  .catch(function(err){
    console.log(err.stack);
  });