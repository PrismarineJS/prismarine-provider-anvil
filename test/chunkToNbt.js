/* eslint-env mocha */

const Chunk = require('prismarine-chunk')('1.8')
const Vec3 = require('vec3')

const assert = require('assert')

const chunk = new Chunk()

for (let x = 0; x < 16; x++) {
  for (let z = 0; z < 16; z++) {
    chunk.setBiome(new Vec3(x, 0, z), 5)
    chunk.setBlockType(new Vec3(x, 50, z), 2)
    for (let y = 0; y < 256; y++) {
      chunk.setSkyLight(new Vec3(x, y, z), 15)
    }
  }
}

const prismarineChunkToNbt = require('../').chunk('1.8').prismarineChunkToNbt
const nbtChunkToPrismarineChunk = require('../').chunk('1.8').nbtChunkToPrismarineChunk

describe('transform chunk to nbt', function () {
  const nbt = prismarineChunkToNbt(chunk)

  it('write with the correct structure', function () {
    assert.equal(nbt.name, '')
    assert.equal(nbt.type, 'compound')
  })

  it('can write biomes', function () {
    for (let z = 0; z < 16; z++) {
      for (let x = 0; x < 16; x++) { assert(nbt.value.Level.value.Biomes.value[z * 16 + x] === chunk.getBiome(new Vec3(x, 0, z))) }
    }
  })

  it('can write sections', function () {
    assert.equal(nbt.value.Level.value.Sections.value.value[3].Blocks.value[16 * (16 * 2)], 2)
    // console.log(JSON.stringify(nbt.value.Level.value.Sections.value.value[3].Blocks.value[16*(16*2)],null,2));
  })

  const bufferEqual = require('buffer-equal')
  it('has internal consistency', function () {
    const reChunk = nbtChunkToPrismarineChunk(nbt)
    assert.equal(reChunk.getBlockType(new Vec3(0, 50, 0)), 2, 'wrong block type at 0,50,0')
    assert.equal(reChunk.getSkyLight(new Vec3(0, 50, 0)), 15)
    assert(bufferEqual(reChunk.dump(), chunk.dump()))
  })
})
