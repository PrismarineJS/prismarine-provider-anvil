var Anvil=require("./").Anvil;
var Vec3 = require("vec3");

var anvil = new Anvil(process.argv[2] ? process.argv[2] : "world/lttp");

var d=anvil.load(-32,0);

d.then(function(data){
  console.log(data.getBlock(new Vec3(1,1,15)));
})
.catch(function(err){
  console.log(err.stack);
});