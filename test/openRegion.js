/* eslint-env mocha */
const fs = require('fs')
const path = require('path')
const assert = require('assert')
const fixtures = path.join(__dirname, 'fixtures')
const readFiles = (dir) => {
  return fs.readdirSync(dir).filter(f => f !== '.DS_Store')
}

const versions = readFiles(fixtures)
describe('can get chunks from region files', function () {
  this.timeout(5 * 1000)
  for (const version of versions) {
    describe(`open regions ${version}`, async () => {
      const Anvil = require('prismarine-provider-anvil').Anvil(version)
      const Chunk = require('prismarine-chunk')(version)
      const filePath = path.join(fixtures, version)
      const anvil = new Anvil(filePath)
      const regions = readFiles(filePath).filter(f => f.match(/r\.(-?\d+)\.(-?\d+)\.mca/))
      for (const region of regions) {
        const [, xStr, zStr] = region.match(/r\.(-?\d+)\.(-?\d+)\.mca/)
        const [x, z] = [+xStr, zStr]
        let oldChunk
        it('open region ' + region, async () => {
          const chunks = (await anvil.getAllChunksInRegion(x, z)).filter(x => x)
          assert(chunks.length > 0)
          oldChunk = chunks[0]
        })

        it('loads chunks into p-chunk ' + region, async () => {
          // const oldChunk = await anvil.load(x * 32, z * 32)

          const dumped = oldChunk.dump()
          const lights = oldChunk.dumpLight()
          const biomes = oldChunk.dumpBiomes()

          const chunk = new Chunk()
          chunk.load(dumped, oldChunk.getMask(), true, true)
          chunk.loadBiomes(biomes)
          chunk.loadParsedLight?.(lights.skyLight, lights.blockLight, chunk.skyLightMask, chunk.blockLightMask, chunk.emptySkyLightMask, chunk.emptyBlockLightMask)
        })
      }
    })
  }
})
