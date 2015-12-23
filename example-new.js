var prov=require('./dist/new');

prov.getChunk(process.argv[2] ? process.argv[2] : "world/lttp",0,0).then(function(data){
  console.log(JSON.stringify(data,null,2));
})
.catch(function(err){
  console.log(err.stack);
});