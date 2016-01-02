import {fs} from 'node-promise-es6';
import nbt from 'prismarine-nbt';
import zlib from 'zlib';
import promisify from 'es6-promisify';
import fdSlicer from 'fd-slicer';

fdSlicer.FdSlicer.prototype.read=promisify(fdSlicer.FdSlicer.prototype.read);
fdSlicer.FdSlicer.prototype.write=promisify(fdSlicer.FdSlicer.prototype.write);

class RegionFile {

  static VERSION_GZIP = 1;
  static VERSION_DEFLATE = 2;

  static SECTOR_BYTES = 4096;
  static SECTOR_INTS = 4096 / 4;

  static CHUNK_HEADER_SIZE = 5;

  fileName;
  file;
  offsets;
  chunkTimestamps;
  sectorFree;
  sizeDelta;
  lastModified = 0;

  constructor(path) {
    this.fileName = path;
  }

  async initialize()
  {
    this.offsets = [];
    this.chunkTimestamps = [];

    this.sizeDelta = 0;

    try {
      this.file = fdSlicer.createFromFd(await fs.open(this.fileName,'r+'));
    }
    catch(err) {
      this.file = fdSlicer.createFromFd(await fs.open(this.fileName,'w+'));
    }

    let stat=await fs.stat(this.fileName);
    if (stat.isFile()) {
      this.lastModified = stat.mtime;
    }


    if (stat.size < RegionFile.SECTOR_BYTES) {
      await this.file.write(new Buffer(RegionFile.SECTOR_BYTES),0,RegionFile.SECTOR_BYTES,0);
      await this.file.write(new Buffer(RegionFile.SECTOR_BYTES),0,RegionFile.SECTOR_BYTES,RegionFile.SECTOR_BYTES);

      this.sizeDelta += RegionFile.SECTOR_BYTES * 2;
    }

    if ((stat.size & 0xfff) != 0) {
      /* the file size is not a multiple of 4KB, grow it */
      const remaining=RegionFile.SECTOR_BYTES-stat.size & 0xfff;
      await this.file.write((new Buffer(remaining)).fill(0),0,remaining,stat.size);
    }

    /* set up the available sector map */
    const nSectors = stat.size / RegionFile.SECTOR_BYTES;
    this.sectorFree = [];


    for (let i = 0; i < nSectors; ++i) {
      this.sectorFree.push(true);
    }

    this.sectorFree[0]=false; // chunk offset table
    this.sectorFree[1]=false; // for the last modified info

    const offsets=(await this.file.read(new Buffer(RegionFile.SECTOR_BYTES),0,RegionFile.SECTOR_BYTES,0))[1];
    for (let i = 0; i < RegionFile.SECTOR_INTS; ++i) {
      let offset = offsets.readUInt32BE(i*4);
      this.offsets[i] = offset;
      if (offset != 0 && (offset >> 8) + (offset & 0xFF) <= this.sectorFree.length) {
        for (let sectorNum = 0; sectorNum < (offset & 0xFF); ++sectorNum) {
          this.sectorFree[(offset >> 8) + sectorNum]=false;
        }
      }
    }
    const chunkTimestamps=(await this.file.read(new Buffer(RegionFile.SECTOR_BYTES),0,RegionFile.SECTOR_BYTES,
      RegionFile.SECTOR_BYTES))[1];
    for (let  i = 0; i < RegionFile.SECTOR_INTS; ++i) {
      this.chunkTimestamps[i] = chunkTimestamps.readUInt32BE(i*4);
    }
  }

  /* gets how much the region file has grown since it was last checked */
  getSizeDelta() {
    const ret = this.sizeDelta;
    this.sizeDelta = 0;
    return ret;
  }

  /*
   * gets an (uncompressed) stream representing the chunk data returns null if
   * the chunk is not found or an error occurs
   */
  async read(x, z) {
    if (RegionFile.outOfBounds(x, z)) {
      throw new Error("READ "+ x+","+ z+ " out of bounds");
    }

    const offset = this.getOffset(x, z);
    if (offset == 0) {
      RegionFile.debug("READ "+ x+","+ z+ " miss");
      return null;
    }

    const sectorNumber = offset >> 8;
    const numSectors = offset & 0xFF;

    if (sectorNumber + numSectors > this.sectorFree.length) {
      RegionFile.debug("READ "+ x+","+ z+ " invalid sector");
      return null;
    }

    const length=(await this.file.read(new Buffer(4),0,4,sectorNumber * RegionFile.SECTOR_BYTES))[1].readUInt32BE(0);

    if (length > RegionFile.SECTOR_BYTES * numSectors) {
      RegionFile.debug("READ"+ x+","+ z+ " invalid length: " + length + " > 4096 * " + numSectors);
      return null;
    }

    const version = (await this.file.read(new Buffer(1),0,1,sectorNumber * RegionFile.SECTOR_BYTES+4))[1].readUInt8(0);
    const data = (await this.file.read(new Buffer(length-1),0,length-1,sectorNumber * RegionFile.SECTOR_BYTES+5))[1];

    let decompress;
    if(version == RegionFile.VERSION_GZIP) // gzip
      decompress = promisify(zlib.gunzip);
    else if(version == RegionFile.VERSION_DEFLATE) // zlib
      decompress = promisify(zlib.inflate);
    else
      throw new Error("READ "+ x+","+ z+ " unknown version " + version);

    return await decompress(data).then(nbt.parseUncompressed);
  }

  /* write a chunk at (x,z) with length bytes of data to disk */
  async write(x, z, nbtData)
  {
    const uncompressed_data=nbt.writeUncompressed(nbtData);
    const data=await promisify(zlib.deflate)(uncompressed_data);

    let length=data.length+1;
    let offset = this.getOffset(x, z);
    let sectorNumber = offset >> 8;
    let sectorsAllocated = offset & 0xFF;
    let sectorsNeeded = Math.floor((length + RegionFile.CHUNK_HEADER_SIZE) / RegionFile.SECTOR_BYTES) + 1;

    // maximum chunk size is 1MB
    if (sectorsNeeded >= 256) {
      throw new Error("maximum chunk size is 1MB");
    }

    if (sectorNumber != 0 && sectorsAllocated == sectorsNeeded) {
      /* we can simply overwrite the old sectors */
      RegionFile.debug("SAVE "+ x+", "+z+", " +length+", "+ "rewrite");
      await this.writeChunk(sectorNumber, data, length);
    } else {
      /* we need to allocate new sectors */

      /* mark the sectors previously used for this chunk as free */
      for (let i = 0; i < sectorsAllocated; ++i) {
        this.sectorFree[sectorNumber + i]=true;
      }

      /* scan for a free space large enough to store this chunk */
      let runStart = this.sectorFree.indexOf(true);
      let runLength = 0;
      if (runStart != -1) {
        for (let i = runStart; i < this.sectorFree.length; ++i) {
          if (runLength != 0) {
            if (this.sectorFree[i]) runLength++;
            else runLength = 0;
          } else if (this.sectorFree[i]) {
            runStart = i;
            runLength = 1;
          }
          if (runLength >= sectorsNeeded) {
            break;
          }
        }
      }

      if (runLength >= sectorsNeeded) {
        RegionFile.debug("SAVE "+x+", "+z+", "+ length+ " reuse");
        /* we found a free space large enough */
        sectorNumber = runStart;
        await this.setOffset(x, z, (sectorNumber << 8) | sectorsNeeded);
        for (let i = 0; i < sectorsNeeded; ++i) {
          this.sectorFree[sectorNumber + i]= false;
        }
        await this.writeChunk(sectorNumber, data, length);
      } else {
        /*
         * no free space large enough found -- we need to grow the
         * file
         */

        RegionFile.debug("SAVE "+ x+", "+z+", "+ length+ " grow");
        let stat=await fs.stat(this.fileName);
        let toGrow=sectorsNeeded*RegionFile.SECTOR_BYTES;
        await this.file.write((new Buffer(toGrow)).fill(0),0,toGrow,stat.size);
        this.sizeDelta += RegionFile.SECTOR_BYTES * sectorsNeeded;

        await this.writeChunk(sectorNumber, data, length);
        await this.setOffset(x, z, (sectorNumber << 8) | sectorsNeeded);
      }
    }
    await this.setTimestamp(x, z, Math.floor (Date.now() / 1000));
  }

  async writeChunk(sectorNumber, data, length)
  {
    const buffer=new Buffer(4+1+length);
    buffer.writeUInt32BE(length,0);
    buffer.writeUInt8(RegionFile.VERSION_DEFLATE,4);
    data.copy(buffer,5);
    await this.file.write(buffer,0,buffer.length,sectorNumber * RegionFile.SECTOR_BYTES);
  }

  /* is this an invalid chunk coordinate? */
  static outOfBounds(x, z) {
    return x < 0 || x >= 32 || z < 0 || z >= 32;
  }

  getOffset(x, z) {
    return this.offsets[x + z * 32];
  }

  hasChunk(x, z) {
    return this.getOffset(x, z) != 0;
  }

  async setOffset(x, z, offset)  {
    this.offsets[x + z * 32] = offset;
    const buffer=new Buffer(4);
    buffer.writeInt32BE(offset);
    await this.file.write(buffer,0,buffer.length,(x + z * 32) * 4);
  }

  async setTimestamp(x, z, value)
  {
    this.chunkTimestamps[x + z * 32] = value;
    const buffer=new Buffer(4);
    buffer.writeInt32BE(value);
    await this.file.write(buffer,0,buffer.length,RegionFile.SECTOR_BYTES + (x + z * 32) * 4);
  }


  async close()
  {
    await fs.close(this.file);
  };
}

if(process.env.NODE_DEBUG && /anvil/.test(process.env.NODE_DEBUG)) {
  RegionFile.debug=console.log;
}
else {
  RegionFile.debug=() => {};
}

module.exports=RegionFile;