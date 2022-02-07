const { promisify } = require('util')
const fs = require('fs').promises
const nbt = require('prismarine-nbt')
const zlib = require('zlib')

const deflateAsync = promisify(zlib.deflate)
const gunzipAsync = promisify(zlib.gunzip)
const inflateAsync = promisify(zlib.inflate)

function createFilledBuffer (size, value) {
  const b = Buffer.alloc(size)
  b.fill(value)
  return b
}

class RegionFile {
  constructor (path) {
    this.fileName = path
    this.lastModified = 0
    this.q = Promise.resolve()
  }

  async initialize () {
    this.ini = this._initialize()
    await this.ini
  }

  async _initialize () {
    this.offsets = []
    this.chunkTimestamps = []

    this.sizeDelta = 0

    try {
      this.file = await fs.open(this.fileName, 'r+')
    } catch (err) {
      this.file = await fs.open(this.fileName, 'w+')
    }

    const stat = await fs.stat(this.fileName)
    if (stat.isFile()) {
      this.lastModified = stat.mtime
    }

    if (stat.size < RegionFile.SECTOR_BYTES) {
      await this.file.write(createFilledBuffer(RegionFile.SECTOR_BYTES, 0), 0, RegionFile.SECTOR_BYTES, 0)
      await this.file.write(createFilledBuffer(RegionFile.SECTOR_BYTES, 0), 0, RegionFile.SECTOR_BYTES, RegionFile.SECTOR_BYTES)

      this.sizeDelta += RegionFile.SECTOR_BYTES * 2
    }

    if ((stat.size & 0xfff) !== 0) {
      /* the file size is not a multiple of 4KB, grow it */
      const remaining = RegionFile.SECTOR_BYTES - stat.size & 0xfff
      await this.file.write(createFilledBuffer(remaining, 0), 0, remaining, stat.size)
    }

    /* set up the available sector map */
    const nSectors = stat.size / RegionFile.SECTOR_BYTES
    this.sectorFree = []

    for (let i = 0; i < nSectors; ++i) {
      this.sectorFree.push(true)
    }

    this.sectorFree[0] = false // chunk offset table
    this.sectorFree[1] = false // for the last modified info

    const offsets = (await this.file.read(Buffer.alloc(RegionFile.SECTOR_BYTES), 0, RegionFile.SECTOR_BYTES, 0)).buffer
    for (let i = 0; i < RegionFile.SECTOR_INTS; ++i) {
      const offset = offsets.readUInt32BE(i * 4)
      this.offsets[i] = offset
      if (offset !== 0 && (offset >> 8) + (offset & 0xFF) <= this.sectorFree.length) {
        for (let sectorNum = 0; sectorNum < (offset & 0xFF); ++sectorNum) {
          this.sectorFree[(offset >> 8) + sectorNum] = false
        }
      }
    }
    const chunkTimestamps = (await this.file.read(Buffer.alloc(RegionFile.SECTOR_BYTES), 0, RegionFile.SECTOR_BYTES,
      RegionFile.SECTOR_BYTES)).buffer
    for (let i = 0; i < RegionFile.SECTOR_INTS; ++i) {
      this.chunkTimestamps[i] = chunkTimestamps.readUInt32BE(i * 4)
    }
  }

  /* gets how much the region file has grown since it was last checked */
  getSizeDelta () {
    const ret = this.sizeDelta
    this.sizeDelta = 0
    return ret
  }

  /*
   * gets an (uncompressed) stream representing the chunk data returns null if
   * the chunk is not found or an error occurs
   */
  async read (x, z) {
    await this.ini
    if (RegionFile.outOfBounds(x, z)) {
      throw new Error('READ ' + x + ',' + z + ' out of bounds')
    }

    const offset = this.getOffset(x, z)
    if (offset === 0) {
      RegionFile.debug('READ ' + x + ',' + z + ' miss')
      return null
    }

    const sectorNumber = offset >> 8
    const numSectors = offset & 0xFF

    if (sectorNumber + numSectors > this.sectorFree.length) {
      RegionFile.debug('READ ' + x + ',' + z + ' invalid sector')
      return null
    }

    const length = (await this.file.read(Buffer.alloc(4), 0, 4, sectorNumber * RegionFile.SECTOR_BYTES)).buffer.readUInt32BE(0)

    if (length <= 1) {
      throw new Error('wrong length ' + length)
    }

    if (length > RegionFile.SECTOR_BYTES * numSectors) {
      RegionFile.debug('READ' + x + ',' + z + ' invalid length: ' + length + ' > 4096 * ' + numSectors)
      return null
    }

    const version = (await this.file.read(Buffer.alloc(1), 0, 1, sectorNumber * RegionFile.SECTOR_BYTES + 4)).buffer.readUInt8(0)
    const data = (await this.file.read(Buffer.alloc(length - 1), 0, length - 1, sectorNumber * RegionFile.SECTOR_BYTES + 5)).buffer

    let decompress
    if (version === RegionFile.VERSION_GZIP) { // gzip
      decompress = gunzipAsync
    } else if (version === RegionFile.VERSION_DEFLATE) { // zlib
      decompress = inflateAsync
    } else {
      throw new Error('READ ' + x + ',' + z + ' unknown version ' + version)
    }

    return decompress(data).then(nbt.parseUncompressed)
  }

  async write (x, z, nbtData) {
    this.q = this.q.then(() => this._write(x, z, nbtData))
    await this.q
  }

  /* write a chunk at (x,z) with length bytes of data to disk */
  async _write (x, z, nbtData) {
    await this.ini
    const uncompressedData = nbt.writeUncompressed(nbtData)
    const data = await deflateAsync(uncompressedData)

    const length = data.length + 1
    const offset = this.getOffset(x, z)
    let sectorNumber = offset >> 8
    const sectorsAllocated = offset & 0xFF
    const sectorsNeeded = Math.floor((length + RegionFile.CHUNK_HEADER_SIZE) / RegionFile.SECTOR_BYTES) + 1

    // maximum chunk size is 1MB
    if (sectorsNeeded >= 256) {
      throw new Error('maximum chunk size is 1MB')
    }

    if (sectorNumber !== 0 && sectorsAllocated === sectorsNeeded) {
      /* we can simply overwrite the old sectors */
      RegionFile.debug('SAVE ' + x + ', ' + z + ', ' + length + ', ' + 'rewrite')
      await this.writeChunk(sectorNumber, data, length)
    } else {
      /* we need to allocate new sectors */

      /* mark the sectors previously used for this chunk as free */
      for (let i = 0; i < sectorsAllocated; ++i) {
        this.sectorFree[sectorNumber + i] = true
      }

      /* scan for a free space large enough to store this chunk */
      let runStart = this.sectorFree.indexOf(true)
      let runLength = 0
      if (runStart !== -1) {
        for (let i = runStart; i < this.sectorFree.length; ++i) {
          if (runLength !== 0) {
            if (this.sectorFree[i]) runLength++
            else runLength = 0
          } else if (this.sectorFree[i]) {
            runStart = i
            runLength = 1
          }
          if (runLength >= sectorsNeeded) {
            break
          }
        }
      }

      if (runLength >= sectorsNeeded) {
        RegionFile.debug('SAVE ' + x + ', ' + z + ', ' + length + ' reuse')
        /* we found a free space large enough */
        sectorNumber = runStart
        await this.setOffset(x, z, (sectorNumber << 8) | sectorsNeeded)
        for (let i = 0; i < sectorsNeeded; ++i) {
          this.sectorFree[sectorNumber + i] = false
        }
        await this.writeChunk(sectorNumber, data, length)
      } else {
        /*
         * no free space large enough found -- we need to grow the
         * file
         */

        RegionFile.debug('SAVE ' + x + ', ' + z + ', ' + length + ' grow')

        sectorNumber = this.sectorFree.length
        const stat = await fs.stat(this.fileName)
        const toGrow = sectorsNeeded * RegionFile.SECTOR_BYTES
        await this.file.write(createFilledBuffer(toGrow, 0), 0, toGrow, stat.size)
        for (let i = 0; i < sectorsNeeded; ++i) this.sectorFree.push(false)
        this.sizeDelta += RegionFile.SECTOR_BYTES * sectorsNeeded

        await this.writeChunk(sectorNumber, data, length)
        await this.setOffset(x, z, (sectorNumber << 8) | sectorsNeeded)
      }
    }
    await this.setTimestamp(x, z, Math.floor(Date.now() / 1000))
    RegionFile.debug('FINISH SAVE ' + x + ', ' + z + ', ' + length)
  }

  async writeChunk (sectorNumber, data, length) {
    const buffer = Buffer.alloc(4 + 1 + length)
    buffer.writeUInt32BE(length, 0)
    buffer.writeUInt8(RegionFile.VERSION_DEFLATE, 4)
    data.copy(buffer, 5)
    await this.file.write(buffer, 0, buffer.length, sectorNumber * RegionFile.SECTOR_BYTES)
  }

  /* is this an invalid chunk coordinate? */
  static outOfBounds (x, z) {
    return x < 0 || x >= 32 || z < 0 || z >= 32
  }

  getOffset (x, z) {
    return this.offsets[x + z * 32]
  }

  hasChunk (x, z) {
    return this.getOffset(x, z) !== 0
  }

  async setOffset (x, z, offset) {
    this.offsets[x + z * 32] = offset
    const buffer = Buffer.alloc(4)
    buffer.writeInt32BE(offset, 0)
    await this.file.write(buffer, 0, buffer.length, (x + z * 32) * 4)
  }

  async setTimestamp (x, z, value) {
    this.chunkTimestamps[x + z * 32] = value
    const buffer = Buffer.alloc(4)
    buffer.writeInt32BE(value, 0)
    await this.file.write(buffer, 0, buffer.length, RegionFile.SECTOR_BYTES + (x + z * 32) * 4)
  }

  async close () {
    await this.file.close()
  }
}

RegionFile.VERSION_GZIP = 1
RegionFile.VERSION_DEFLATE = 2

RegionFile.SECTOR_BYTES = 4096
RegionFile.SECTOR_INTS = 4096 / 4

RegionFile.CHUNK_HEADER_SIZE = 5

if (process.env.NODE_DEBUG && /anvil/.test(process.env.NODE_DEBUG)) {
  RegionFile.debug = console.log
} else {
  RegionFile.debug = () => {}
}

module.exports = RegionFile
