/* eslint-env mocha */

const fs = require('fs')
const { join } = require('path')
const flatMap = require('flatmap')
const range = require('range').range
const { Vec3 } = require('vec3')
const assert = require('assert')
const prismarineProviderAnvil = require('prismarine-provider-anvil')
const compareChunks = require('./common').compareChunks

const testedVersions = prismarineProviderAnvil.testedVersions

for (const version of testedVersions) {
  const Chunk = require('prismarine-chunk')(version)
  const registry = require('prismarine-registry')(version)
  const chunkOptions = {
    minY: registry.supportFeature('tallWorld') ? -64 : 0,
    worldHeight: registry.supportFeature('tallWorld') ? 384 : 256
  }
  const Anvil = require('../').Anvil(version)

  describe('saving and loading works ' + version, function () {
    this.timeout(60 * 1000)

    function generateRandomChunk (chunkX, chunkZ) {
      const chunk = new Chunk(chunkOptions)

      for (let x = 0; x < 16; x++) {
        for (let z = 0; z < 16; z++) {
          chunk.setBlockType(new Vec3(x, 50, z), Math.floor(Math.random() * 50))
          for (let y = chunkOptions.minY; y < chunkOptions.worldHeight + chunkOptions.minY; y++) {
            chunk.setSkyLight(new Vec3(x, y, z), 15)
          }
        }
      }

      return chunk
    }

    const size = 3
    function generateCube (size) {
      return flatMap(range(0, size), (chunkX) => range(0, size).map(chunkZ => ({ chunkX, chunkZ })))
    }

    let chunks = {}
    const regionPath = join(__dirname, 'world/testRegion' + version)

    before(() => {
      chunks = generateCube(size).map(({ chunkX, chunkZ }) => ({ chunkX, chunkZ, chunk: generateRandomChunk(chunkX, chunkZ) }))
    })

    async function loadInParallel () {
      const anvil = new Anvil(regionPath)
      await Promise.all(
        chunks
          .map(async ({ chunkX, chunkZ, chunk }) => {
            const originalChunk = chunk
            const loadedChunk = await anvil.load(chunkX, chunkZ)
            const blockA = originalChunk.getBlock(new Vec3(0, 50, 0))
            const blockB = loadedChunk.getBlock(new Vec3(0, 50, 0))
            assert.strictEqual(
              blockA.stateId, blockB.stateId, 'wrong block type at 0,50,0 at chunk ' + chunkX + ', ' + chunkZ)
            compareChunks(originalChunk, loadedChunk, chunkOptions)
          })
      )
      await anvil.close()
    }

    describe('in sequence ', async () => {
      fs.rmSync(regionPath, { recursive: true, force: true })
      fs.mkdirSync(regionPath, { recursive: true, force: true })

      it('save the world in sequence', async () => {
        const anvil = new Anvil(regionPath)
        await chunks.reduce(async (acc, { chunkX, chunkZ, chunk }) => {
          await acc
          await anvil.save(chunkX, chunkZ, chunk)
        }, Promise.resolve())
        await anvil.close()
      })

      it('load the world correctly in parallel', loadInParallel)
    })

    describe('in parallel ', () => {
      fs.rmSync(regionPath, { recursive: true, force: true })
      fs.mkdirSync(regionPath, { recursive: true, force: true })

      it('save the world in parallel', async () => {
        const anvil = new Anvil(regionPath)
        await Promise.all(chunks.map(({ chunkX, chunkZ, chunk }) => anvil.save(chunkX, chunkZ, chunk)))
        await anvil.close()
      })

      it('load the world correctly in parallel', loadInParallel)
    })
  })
}
