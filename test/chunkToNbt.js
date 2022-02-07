/* eslint-env mocha */

const { Vec3 } = require('vec3')
const assert = require('assert')
const nbt = require('prismarine-nbt')

const testedVersions = ['1.8', '1.13', '1.14', '1.16', '1.17']

for (const version of testedVersions) {
  const registry = require('prismarine-registry')(version)
  const Chunk = require('prismarine-chunk')(registry)
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
    const tag = prismarineChunkToNbt(chunk, 4, 2)

    it('write with the correct structure', function () {
      assert.strictEqual(tag.name, '')
      assert.strictEqual(tag.type, 'compound')
    })

    it('write the correct chunk positions', function () {
      // in 1.18+, there is no Level wrapper
      const level = registry.version['>=']('1.18') ? tag.value : tag.value.Level.value
      if (level.DataVersion) assert.deepEqual(level.DataVersion, nbt.int(registry.version.dataVersion))
      assert.deepEqual(level.xPos, nbt.int(4))
      assert.deepEqual(level.zPos, nbt.int(2))
    })

    it('can write biomes', function () {
      console.log(registry.version)
      if (registry.version['>=']('1.18')) {
        // Just check for a valid palette as the other test also checks biomes (which are now in individual 3D sections versus 2D)
        assert(nbt.simplify(tag).sections[0].biomes.palette.length > 0, 'No biomes were found')
      } else if (registry.version['>=']('1.16')) {
        for (let y = 0; y < 64; y++) {
          for (let x = 0; x < 4; x++) {
            for (let z = 0; z < 4; z++) {
              assert(tag.value.Level.value.Biomes.value[y * 16 + x * 4 + z] === chunk.getBiome(new Vec3(x, y * 4, z)))
            }
          }
        }
      } else {
        for (let z = 0; z < 16; z++) {
          for (let x = 0; x < 16; x++) {
            assert(tag.value.Level.value.Biomes.value[z * 16 + x] === chunk.getBiome(new Vec3(x, 0, z)))
          }
        }
      }
    })

    it('has internal consistency', function () {
      const reChunk = nbtChunkToPrismarineChunk(tag)
      assert.strictEqual(reChunk.getBlockType(new Vec3(0, 50, 0)), 2, 'wrong block type at 0,50,0')
      assert.strictEqual(reChunk.getSkyLight(new Vec3(0, 50, 0)), 15)
      assert(reChunk.dump().equals(chunk.dump()))
    })
  })
}
