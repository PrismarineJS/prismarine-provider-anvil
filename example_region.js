var RegionFile=require('./dist/region');
var regionFileName=require('./dist/new').regionFileName;

var regionFile=new RegionFile(regionFileName(process.argv[2] ? process.argv[2] : "world/lttp",0,0));
regionFile
.initialize()
/*.then(function(){
  console.log(regionFile);
})*/
.then(function(){
  return regionFile.write(0,0,{"name":"","type":"compound","value":{}})
})
/*.then(function(){
 console.log(regionFile);
 })*/

.then(function(){
return regionFile.getChunkDataInputStream(0,0);
})
.then(function(data){
  console.log(data);
})
.catch(function(err){
  console.log(err.stack);
});
