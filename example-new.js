var prov=require('./dist/new');

prov.getChunk("/media/donnees/non_sauvegarde/minecraft_server/world/region",0,0).then(function(data){
  console.log(JSON.stringify(data,null,2));
});