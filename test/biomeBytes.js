/* eslint-env mocha */

const assert = require('assert')
const fs = require('fs').promises
const os = require('os')
const path = require('path')
const nbt = require('prismarine-nbt')
const { Vec3 } = require('vec3')
const provider = require('../')

// These versions share the legacy NBT byte-array biome representation.
for (const version of ['1.8.9', '1.9', '1.10.2', '1.11.2', '1.12.2']) {
  describe('legacy biome bytes ' + version, function () {
    const Chunk = require('prismarine-chunk')(version)
    const { prismarineChunkToNbt } = provider.chunk(version)

    function makeChunk () {
      const chunk = new Chunk()
      for (let z = 0; z < 16; z++) {
        for (let x = 0; x < 16; x++) {
          chunk.setBiome(new Vec3(x, 0, z), z * 16 + x)
        }
      }
      chunk.setBlockType(new Vec3(3, 50, 5), 1)
      return chunk
    }

    function checkBiomes (chunk) {
      for (let z = 0; z < 16; z++) {
        for (let x = 0; x < 16; x++) {
          assert.strictEqual(chunk.getBiome(new Vec3(x, 0, z)), z * 16 + x)
        }
      }
      assert.strictEqual(chunk.getBlockType(new Vec3(3, 50, 5)), 1)
    }

    it('uses signed NBT values without changing unsigned biome IDs in memory', () => {
      const chunk = makeChunk()
      const before = chunk.toJson()
      const biomes = prismarineChunkToNbt(chunk, 0, 0).value.Level.value.Biomes
      assert.strictEqual(biomes.type, 'byteArray')
      assert.deepStrictEqual(biomes.value, Array.from({ length: 256 }, (_, id) => id < 128 ? id : id - 256))
      assert.strictEqual(chunk.toJson(), before)
      checkBiomes(chunk)
    })

    it('writes the original biome byte patterns, including 0x80 and 0xff', () => {
      const biomes = prismarineChunkToNbt(makeChunk(), 0, 0).value.Level.value.Biomes
      const actual = nbt.writeUncompressed({ name: '', type: 'compound', value: { Biomes: biomes } })
      // Named BYTE_ARRAY in an unnamed root compound; 256 bytes; END tag.
      const header = Buffer.from([10, 0, 0, 7, 0, 6, ...Buffer.from('Biomes'), 0, 0, 1, 0])
      const bytes = Buffer.from(Array.from({ length: 256 }, (_, id) => id))
      assert.deepStrictEqual(actual, Buffer.concat([header, bytes, Buffer.from([0])]))
    })

    it('saves high-ID biomes and reopens them through a new provider', async () => {
      const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'anvil-biome-bytes-'))
      const Anvil = provider.Anvil(version)
      const chunk = makeChunk()
      const before = chunk.toJson()
      try {
        const writer = new Anvil(directory)
        try {
          await writer.save(-33, 32, chunk)
        } finally {
          await writer.close()
        }
        const reader = new Anvil(directory)
        try {
          const restored = await reader.load(-33, 32)
          checkBiomes(restored)
          // 156 is a real legacy biome, not only a signedness boundary case.
          const registry = require('prismarine-registry')(version)
          assert.strictEqual(registry.biomes[restored.getBiome(new Vec3(12, 0, 9))].name, 'tall_birch_hills')
          assert.strictEqual(await reader.load(-32, 32), null)
        } finally {
          await reader.close()
        }
        assert.strictEqual(chunk.toJson(), before)
      } finally {
        await fs.rm(directory, { recursive: true, force: true })
      }
    })
  })
}
