/* eslint-env mocha */
const fs = require('fs')
const path = require('path')
const assert = require('assert')
const nbt = require('prismarine-nbt')
const { Vec3 } = require('vec3')
const fixtures = path.join(__dirname, 'fixtures')
const prismarineProviderAnvil = require('prismarine-provider-anvil')
const testedVersions = prismarineProviderAnvil.testedVersions

// Palette entries are { Name, Properties } compounds, or since 26.3 { id, properties } compounds and
// bare ids (wrapped as { '': id } in mixed palettes) for blocks in their default state
function paletteEntryToStateId (registry, Block, entry) {
  const name = (typeof entry === 'string' ? entry : entry.Name ?? entry.id ?? entry['']).replace('minecraft:', '')
  const properties = entry.Properties ?? entry.properties
  return properties ? Block.fromProperties(name, properties).stateId : registry.blocksByName[name].defaultState
}

// Indices don't span across longs and use at least 4 bits
function unpackPaletteIndices (data, paletteLength) {
  if (!data) return new Array(4096).fill(0)
  const bits = Math.max(4, Math.ceil(Math.log2(paletteLength)))
  const mask = (1n << BigInt(bits)) - 1n
  const indices = []
  for (const [high, low] of data) {
    let long = (BigInt.asUintN(32, BigInt(high)) << 32n) | BigInt.asUintN(32, BigInt(low))
    for (let i = 0; i < Math.floor(64 / bits) && indices.length < 4096; i++) {
      indices.push(Number(long & mask))
      long >>= BigInt(bits)
    }
  }
  return indices
}

describe('can get chunks from region files', function () {
  this.timeout(5 * 1000)
  for (const version of testedVersions) {
    describe(`open regions ${version}`, async () => {
      const registry = require('prismarine-registry')(version)
      const Block = require('prismarine-block')(registry)
      const Anvil = prismarineProviderAnvil.Anvil(version)
      const filePath = path.join(fixtures, version)
      const anvil = new Anvil(filePath)
      const regions = fs.readdirSync(filePath).filter(f => f.match(/r\.(-?\d+)\.(-?\d+)\.mca/))
      for (const region of regions) {
        const [, xStr, zStr] = region.match(/r\.(-?\d+)\.(-?\d+)\.mca/)
        const [x, z] = [+xStr, +zStr]
        it('open region ' + region, async () => {
          const chunks = (await anvil.getAllChunksInRegion(x, z)).filter(x => x)
          assert(chunks.length > 0)
        })

        if (!registry.version['>=']('1.18')) continue
        it('read the block states of the full chunks in ' + region, async function () {
          this.timeout(60 * 1000)
          const anvil = new Anvil(filePath)
          let fullChunks = 0
          for (let chunkX = x * 32; chunkX < x * 32 + 32; chunkX++) {
            for (let chunkZ = z * 32; chunkZ < z * 32 + 32; chunkZ++) {
              const tag = await anvil.loadRaw(chunkX, chunkZ)
              if (!tag || nbt.simplify(tag).Status.replace('minecraft:', '') !== 'full') continue
              fullChunks++
              const column = await anvil.load(chunkX, chunkZ)
              const pos = new Vec3(0, 0, 0)
              for (const section of nbt.simplify(tag).sections) {
                const { palette, data } = section.block_states
                const stateIds = palette.map(entry => paletteEntryToStateId(registry, Block, entry))
                unpackPaletteIndices(data, palette.length).forEach((index, i) => {
                  pos.set(i & 15, section.Y * 16 + (i >> 8), (i >> 4) & 15)
                  const stateId = column.getBlockStateId(pos)
                  if (stateId !== stateIds[index]) {
                    assert.fail(`chunk ${chunkX},${chunkZ} block ${pos} is ${Block.fromStateId(stateId).name} ${JSON.stringify(Block.fromStateId(stateId).getProperties())} but the region file has ${JSON.stringify(palette[index])}`)
                  }
                })
              }
            }
          }
          await anvil.close()
          assert(fullChunks > 0)
        })
      }
    })
  }
})
