import {fs} from 'node-promise-es6';
import nbt from 'prismarine-nbt';
import zlib from 'zlib';
import promisify from 'es6-promisify';

function getChunk(path,x,z)
{
  return openRegionFileOfChunk(path,'r+',x,z)
    .then(handle => readColumn(handle,x,z))
    .then(readChunk);
}

function setChunk(path,nbtData,x,z)
{
  return openRegionFileOfChunk(path,'r+',x,z)
    .then(async handle => ({handle,data:await writeChunk(nbtData)}))
    .then(({handle,data}) => writeColumn(handle,data,x,z));
}

async function openRegionFileOfChunk(path,options,x, z) {
  const region = { x: x >> 5, z: z >> 5 };
  const regionFile = path+'/r.'+region.x+'.'+region.z+'.mca';
  try {
    return await fs.open(regionFile,options);
  }
  catch(err) {
    return null;
  }
}

function getLocationOffset(x,z)
{
  const x_offset=x&31;
  const z_offset = z & 31;
  return  4 * (x_offset + z_offset * 32);
}

async function readLocationOffset(handle,x,z)
{
  const meta_offset=getLocationOffset(x,z);
  const chunk_location = (await fs.read(handle,new Buffer(4),0,4,meta_offset)).buffer;
  let offset = chunk_location[0] * (256 * 256) + chunk_location[1] * 256 + chunk_location[2];
  if(offset == 0)
    return null;
  else {
    offset -= 2;
    const sector_count = chunk_location[3];
    return {
      offset:4096 * offset,
      size:4096*sector_count
    }
  }
}

async function readColumn(handle,x,z)
{
  const r=await readLocationOffset(handle,x,z);
  if(r==null)
    return null;
  return (await fs.read(handle,new Buffer(r.size),0,r.size,r.offset)).buffer;
}

async function writeColumn(handle,data,x,z)
{
  const r=await readLocationOffset(handle,x,z);
  if(r==null)
    return null;
  var buffer=new Buffer(r.size);
  buffer.fill(0);
  data.copy(buffer,0,0,data.length);

  return (await fs.write(handle,buffer,0,r.size,r.offset));
}

async function readChunk(data)
{
  if(data==null)
    return null;
  const length=data.readUInt32BE(0);
  const compression = data.readUInt8(4);
  const compressed_data = data.slice(5,5 + length);
  let decompress;
  if(compression == 1) // gzip
    decompress = promisify(zlib.gunzip);
  else if(compression == 2) // zlib
    decompress = promisify(zlib.inflate);
  else
    throw Error('Unknown compression method: '+compression);

  return await decompress(compressed_data).then(nbt.parseUncompressed);
}


async function writeChunk(nbtData)
{
  const data=nbt.writeUncompressed(nbtData);
  const compressed_data=await promisify(zlib.deflate)(data);

  const buffer=new Buffer(compressed_data.length+5);
  buffer.writeUInt32BE(compressed_data.length,0);
  buffer.writeUInt8(2,4);
  compressed_data.copy(buffer,5);

  return buffer;
}

module.exports={getChunk,setChunk};