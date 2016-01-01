var Anvil=require("./").Anvil;
var Vec3 = require("vec3");

var chunk = new Anvil(process.argv[2] ? process.argv[2] : "world/lttp");

var c=chunk.save(-32,0,{"name":"","type":"compound","value":{}});

c.then(function(){
  console.log("saved");
})
.catch(function(err){
  console.log(err.stack);
});