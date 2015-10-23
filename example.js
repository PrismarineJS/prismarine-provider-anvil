var Anvil=require("./");
var Vec3 = require("vec3");

var chunk = new Anvil(process.argv[2] ? process.argv[2] : "world/lttp");

var c=chunk.load(0,0);

c.then(function(data){
  console.log(data);
  console.log(data.chunk.getBlock(new Vec3(14,50,2)));
});