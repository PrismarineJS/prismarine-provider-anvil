import {fs} from 'node-promise-es6';
import nbt from 'prismarine-nbt';
import zlib from 'zlib';
import promisify from 'es6-promisify';

function getChunk(path,x,z)
{
  return readChunkFromRegion(path,x,z)
    .then(function(buf){return readColumn(buf,x,z)})
    .then(readChunk);
}

async function readChunkFromRegion(path,x, z) {
  const region = { x: x >> 5, z: z >> 5 };
  const regionFile = path+'/r.'+region.x+'.'+region.z+'.mca';
  try {
    var buf = await fs.readFile(regionFile);
  }
  catch(err) {
    return null;
  }
  return buf;
}

function readColumn(buf,x,z)
{
  const locations = buf.slice(0,4096);
  const timestamps = buf.slice(4096,8192);
  const data = buf.slice(8192);

  const x_offset=x&31;
  const z_offset = z & 31;
  const meta_offset = 4 * (x_offset + z_offset * 32);
  const chunk_location = locations.slice(meta_offset,meta_offset + 4);
  let offset = chunk_location[0] * (256 * 256) + chunk_location[1] * 256 + chunk_location[2];
  if(offset == 0)
    return null;
  else {
    offset -= 2;
    const sector_count = chunk_location[3];
    return data.slice(4096 * offset,4096 * (offset + sector_count));
  }
}

function writeColumn(data,x,z)
{

}

async function readChunk(data)
{
  if(data==null)
    return null;
  const length=data.readUInt32BE(0);
  const compression = data.readUInt8(4);
  const compressed_data = data.slice(5,4 + length);
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
  return compressed_data;
}

module.exports={getChunk};