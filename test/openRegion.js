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
        let prevChunks
        it('open region ' + region, async () => {
          const chunks = (await anvil.getAllChunksInRegion(x, z)).filter(x => x)
          assert(chunks.length > 0)
          prevChunks = chunks
        })

        it('loads chunks into p-chunk ' + region, async () => {
          for (const oldChunk of prevChunks) {
            if (oldChunk.x !== -10 && oldChunk.z !== -6) continue
            try {
              const dumped = oldChunk.dump()
              const lights = oldChunk.dumpLight()
              const biomes = oldChunk.dumpBiomes()

              const newChunk = new Chunk({
                minY: oldChunk.minY,
                worldHeight: oldChunk.worldHeight
              })
              newChunk.load(dumped, oldChunk.getMask(), true, true)
              newChunk.loadBiomes(biomes)
              newChunk.loadParsedLight?.(lights.skyLight, lights.blockLight, newChunk.skyLightMask, newChunk.blockLightMask, newChunk.emptySkyLightMask, newChunk.emptyBlockLightMask)
            } catch (err) {
              const error = new Error(`Error processing chunk ${oldChunk.x}, ${oldChunk.z}: ${err.message}`)
              error.stack = err.stack
              throw error
            }
          }
        })
      }
    })
  }
})
