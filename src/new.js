import {fs} from 'node-promise-es6';
var nbt = require('prismarine-nbt');
var zlib = require('zlib');

async function getRegion(path,x, z) {
  var region = { x: x >> 5, z: z >> 5 };
  var regionFile = path+'/r.'+region.x+'.'+region.z+'.mca';
  try {
    var buf = await fs.readFile(regionFile);
  }
  catch(err) {
    return null;
  }
  return buf;
}

function getChunk(path,x,z)
{
  return getRegion(path,x,z)
    .then(function(buf){return chunk_column(buf,x,z)})
    .then(readChunk);
}

function chunk_column(buf,x,z)
{
  var locations = buf.slice(0,4096);
  var timestamps = buf.slice(4096,8192);
  var data = buf.slice(8192);

  var x_offset=x&31;
  var z_offset = z & 31;
  var meta_offset = 4 * (x_offset + z_offset * 32);
  var chunk_location = locations.slice(meta_offset,meta_offset + 4);
  var offset = chunk_location[0] * (256 * 256) + chunk_location[1] * 256 + chunk_location[2];
  if(offset == 0)
    return null;
  else {
    offset -= 2;
    var sector_count = chunk_location[3];
    return data.slice(4096 * offset,4096 * (offset + sector_count));
  }
}

function readChunk(data)
{
  if(data==null)
    return Promise.resolve(null);
  var length = data[0] * (256 *256*256) + data[1] * (256 *256) + data[2] * 256 + data[3];
  var compression = data[4];
  var compressed_data = data.slice(5,4 + length);
  var decompress;
  if(compression == 1) // gzip
    decompress = zlib.gunzip;
  else if(compression == 2) // zlib
    decompress = zlib.inflate;
  else
    return Promise.reject(Error('Unknown compression method: '+compression));


  return new Promise(function(resolve,reject){
    decompress(compressed_data,function(err,data){
      if(err) {
        reject(err);
        return;
      }
      nbt.parse(data,function(err,parsed){
        if(err) {
          reject(err);
          return;
        }
        resolve(parsed);
      });
    });
  });
}

function writeChunk(data)
{

}

module.exports={getChunk};