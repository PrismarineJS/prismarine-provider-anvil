var Chunk = require("prismarine-chunk")("1.8");
var Vec3 = require("vec3").Vec3;

function getNbtValue(data)
{
  function transform(value,type)
  {
    if(type=="compound") {
      return Object.keys(value).reduce((acc,key) => {
        acc[key]=getNbtValue(value[key]);
        return acc;
      },{});
    }
    if(type=="list") {
      return value.value.map(v => transform(v,value.type));
    }
    return value;
  }
  return transform(data.value,data.type);
}

function nbtChunkToPrismarineChunk(nbt)
{
  const chunk=new Chunk();
  readSections(chunk,nbt.Level.Sections);
  readBiomes(chunk,nbt.Level.Biomes);
  return chunk;
}

function readSections(chunk,sections)
{
  sections.forEach(({Y,Blocks,Add,Data,BlockLight,SkyLight},index)=> {
    Blocks=new Buffer(Blocks);
    Blocks.forEach((blockType,index) => {
      const y=index >> 8;
      const z=(index >> 4) & 0xf;
      const x=index & 0xf;
      chunk.setBlockType(new Vec3(x,Y*16+y,z),blockType);
    })
  });
}

function readBiomes(chunk,biomes)
{
  biomes=new Buffer(biomes);
  biomes.forEach((biome,index) => {
    const z=index >> 4;
    const x=index & 0xF;
    chunk.setBiome(new Vec3(x,0,z),biome);
  });
}

module.exports={getNbtValue,nbtChunkToPrismarineChunk};