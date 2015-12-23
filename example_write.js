var prov=require('./dist/new');


prov.setChunk(process.argv[2] ? process.argv[2] : "world/lttp",{"name":"","type":"compound","value":{}}, 0, 0).then(function (data) {
    console.log(data);
  })
  .catch(function (err) {
    console.log(err.stack);
  });