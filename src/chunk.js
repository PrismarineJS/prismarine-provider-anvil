var Chunk = require("prismarine-chunk")("1.8");
var Vec3 = require("vec3").Vec3;
var { readUInt4LE, writeUInt4LE } = require('uint4');

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
  sections.forEach(({Y,Blocks,Add,Data,BlockLight,SkyLight})=> {
    readBlocks(chunk,Y,Blocks);
    readSkylight(chunk,Y,SkyLight);
    readBlocklight(chunk,Y,BlockLight);
    readMetadata(chunk,Y,Data);
  });
}

function indexToPos(index,sectionY)
{
  const y=index >> 8;
  const z=(index >> 4) & 0xf;
  const x=index & 0xf;
  return new Vec3(x,sectionY*16+y,z);
}

function readMetadata(chunk,sectionY,metadata)
{
  metadata=new Buffer(metadata);
  for(let index=0;index<metadata.length;index+=0.5) {
    const meta=readUInt4LE(metadata,index);
    const pos=indexToPos(index*2,sectionY);
    chunk.setBlockData(pos,meta);
  }
}

function readBlocklight(chunk,sectionY,blockLights)
{
  blockLights=new Buffer(blockLights);
  for(let index=0;index<blockLights.length;index+=0.5) {
    const blockLight=readUInt4LE(blockLights,index);
    const pos=indexToPos(index*2,sectionY);
    chunk.setBlockLight(pos,blockLight);
  }
}

function readSkylight(chunk,sectionY,skylights)
{
  skylights=new Buffer(skylights);
  for(let index=0;index<skylights.length;index+=0.5) {
    const skylight=readUInt4LE(skylights,index);
    const pos=indexToPos(index*2,sectionY);
    chunk.setSkyLight(pos,skylight);
  }
}

function readBlocks(chunk,sectionY,blocks)
{
  blocks=new Buffer(blocks);
  for(let index=0;index<blocks.length;index++) {
    const blockType=blocks.readUInt8(index);
    const pos=indexToPos(index,sectionY);
    chunk.setBlockType(pos,blockType);
  }
}

function readBiomes(chunk,biomes)
{
  biomes=new Buffer(biomes);
  for(let index=0;index<biomes.length;index++) {
    const biome=biomes.readUInt8(index);
    const z=index >> 4;
    const x=index & 0xF;
    chunk.setBiome(new Vec3(x,0,z),biome);
  }
}

module.exports={getNbtValue,nbtChunkToPrismarineChunk};