var Anvil=require("./");

var chunk = new Anvil(process.argv[2] ? process.argv[2] : "world/lttp");

var c=chunk.load(0,0);

c.then(function(data){
  console.log(data);
});