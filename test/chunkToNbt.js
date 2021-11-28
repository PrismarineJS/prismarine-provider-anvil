/* eslint-env mocha */

const { Vec3 } = require('vec3')
const assert = require('assert')

const testedVersions = ['1.8', '1.13', '1.14', '1.16', '1.17']

for (const version of testedVersions) {
  const Chunk = require('prismarine-chunk')(version)
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

  const prismarineChunkToNbt = require('../').chunk(version).prismarineChunkToNbt
  const nbtChunkToPrismarineChunk = require('../').chunk(version).nbtChunkToPrismarineChunk

  describe('transform chunk to nbt ' + version, function () {
    const nbt = prismarineChunkToNbt(chunk, 4, 2)

    it('write with the correct structure', function () {
      assert.strictEqual(nbt.name, '')
      assert.strictEqual(nbt.type, 'compound')
    })

    it('write the correct chunk positions', function () {
      const level = nbt.value.Level
      assert.strictEqual(level.type, 'compound')

      assert.strictEqual(level.value.xPos.type, 'int')
      assert.strictEqual(level.value.zPos.type, 'int')

      assert.strictEqual(level.value.xPos.value, 4)
      assert.strictEqual(level.value.zPos.value, 2)
    })

    it('can write biomes', function () {
      if (version === '1.16' || version === '1.17') {
        for (let y = 0; y < 64; y++) {
          for (let x = 0; x < 4; x++) {
            for (let z = 0; z < 4; z++) {
              assert(nbt.value.Level.value.Biomes.value[y * 16 + x * 4 + z] === chunk.getBiome(new Vec3(x, y * 4, z)))
            }
          }
        }
      } else {
        for (let z = 0; z < 16; z++) {
          for (let x = 0; x < 16; x++) {
            assert(nbt.value.Level.value.Biomes.value[z * 16 + x] === chunk.getBiome(new Vec3(x, 0, z)))
          }
        }
      }
    })

    const bufferEqual = require('buffer-equal')
    it('has internal consistency', function () {
      const reChunk = nbtChunkToPrismarineChunk(nbt)
      assert.strictEqual(reChunk.getBlockType(new Vec3(0, 50, 0)), 2, 'wrong block type at 0,50,0')
      assert.strictEqual(reChunk.getSkyLight(new Vec3(0, 50, 0)), 15)
      assert(bufferEqual(reChunk.dump(), chunk.dump()))
    })
  })
}
