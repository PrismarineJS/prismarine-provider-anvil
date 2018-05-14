/* eslint-env mocha */

const flatMap = require('flatmap')
const range = require('range').range
const bufferEqual = require('buffer-equal')
const Chunk = require('prismarine-chunk')('1.8')
const Vec3 = require('vec3')
const assert = require('assert')
const Anvil = require('../').Anvil('1.8')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')

describe('saving and loading works', function () {
  this.timeout(60 * 1000)

  function generateRandomChunk (chunkX, chunkZ) {
    const chunk = new Chunk()

    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        chunk.setBlockType(new Vec3(x, 50, z), Math.floor(Math.random() * 50))
        for (let y = 0; y < 256; y++) {
          chunk.setSkyLight(new Vec3(x, y, z), 15)
        }
      }
    }

    return chunk
  }

  function generateCube (size) {
    return flatMap(range(0, size), (chunkX) => range(0, size).map(chunkZ => ({chunkX, chunkZ})))
  }

  let size = 3
  let chunks = {}
  let regionPath = 'world/testRegion'

  before(() => {
    chunks = generateCube(size).map(({chunkX, chunkZ}) => ({chunkX, chunkZ, chunk: generateRandomChunk(chunkX, chunkZ)}))
  })

  async function loadInParallel () {
    const anvil = new Anvil('world/testRegion')
    await Promise.all(
      chunks
        .map(async ({chunkX, chunkZ, chunk}) => {
          const originalChunk = chunk
          const loadedChunk = await anvil.load(chunkX, chunkZ)
          assert.equal(originalChunk.getBlockType(new Vec3(0, 50, 0)), loadedChunk.getBlockType(new Vec3(0, 50, 0)), 'wrong block type at 0,50,0 at chunk ' + chunkX + ', ' + chunkZ)
          assert(bufferEqual(originalChunk.dump(), loadedChunk.dump()))
        })
    )
  }

  describe('in sequence', () => {
    before((cb) => mkdirp(regionPath, cb))
    after(cb => rimraf(regionPath, cb))
    it('save the world in sequence', async () => {
      const anvil = new Anvil('world/testRegion')
      await chunks.reduce(async (acc, {chunkX, chunkZ, chunk}) => { await acc; await anvil.save(chunkX, chunkZ, chunk) }, Promise.resolve())
    })

    it('load the world correctly in parallel', loadInParallel)
  })

  describe('in parallel', () => {
    before((cb) => mkdirp(regionPath, cb))
    after(cb => rimraf(regionPath, cb))
    it('save the world in parallel', async () => {
      const anvil = new Anvil('world/testRegion')
      await Promise.all(chunks.map(({chunkX, chunkZ, chunk}) => anvil.save(chunkX, chunkZ, chunk)))
    })

    it('load the world correctly in parallel', loadInParallel)
  })
})
