const RegionFile = require('./region')
const nbt = require('prismarine-nbt')
const unversionedMcData = require('minecraft-data')
module.exports = (mcVersion) => {
  let nbtChunkToPrismarineChunk = null
  let prismarineChunkToNbt = null

  class Anvil {
    constructor (path) {
      this.regions = {}
      this.path = path
    }

    regionFileName (x, z) {
      const region = { x: x >> 5, z: z >> 5 }
      return this.path + '/r.' + region.x + '.' + region.z + '.mca'
    }

    async getRegion (x, z) {
      if (typeof x !== 'number' || typeof z !== 'number') {
        throw new Error('Missing x or z arguments.')
      }
      const name = this.regionFileName(x, z)
      let region = this.regions[name]
      if (region === undefined) {
        region = new RegionFile(name)
        this.regions[name] = region
        await region.initialize()
      }
      return region
    }

    // returns a Promise. Resolve a Chunk object or reject if it hasn’t been generated
    async load (x, z) {
      const data = await this.loadRaw(x, z)
      if (data == null) { return null }
      return nbtChunkToPrismarineChunk(data)
    }

    async loadRaw (x, z) {
      const region = await this.getRegion(x, z)
      const data = await region.read(x & 0x1F, z & 0x1F)
      if (mcVersion === 'auto') { // parse version
        const version = nbt.simplify(data)?.DataVersion ?? -380 // -380 = 1.8
        mcVersion = unversionedMcData.versions.pc.find(o => o.dataVersion === version).majorVersion
      }
      if (nbtChunkToPrismarineChunk === null && prismarineChunkToNbt === null) {
        const chunk = require('./chunk')(mcVersion)
        nbtChunkToPrismarineChunk = chunk.nbtChunkToPrismarineChunk
        prismarineChunkToNbt = chunk.prismarineChunkToNbt
      }
      return data
    }

    // returns a Promise. Resolve an empty object when successful
    async save (x, z, chunk) {
      await this.saveRaw(x, z, prismarineChunkToNbt(chunk))
    }

    async saveRaw (x, z, nbt) {
      const region = await this.getRegion(x, z)
      await region.write(x & 0x1F, z & 0x1F, nbt)
    }

    async getAllChunksInRegion (x, z) {
      const region = await this.getRegion(x * 32, z * 32)
      const chunks = []
      for (let _x = 0; _x < 32; _x++) {
        for (let _z = 0; _z < 32; _z++) {
          if (region.hasChunk(_x, _z)) {
            chunks.push(this.load(x * 32 + _x, z * 32 + _z))
          }
        }
      }
      const toRet = await Promise.all(chunks)
      region.file.close()
      return toRet
    }
  }

  return Anvil
}
