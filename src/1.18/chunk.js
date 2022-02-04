const assert = require('assert')
const nbt = require('prismarine-nbt')

module.exports = (ChunkColumn, registry) => {
  const Block = require('prismarine-block')(registry)
  const dataVersion = registry.version.dataVersion
  // turns a JS object into an NBT compound, with the values as nbt.string's
  const objPropsToNbt = props => Object.fromEntries(Object.entries(props).map(([k, v]) => [k, nbt.string(String(v))]))

  function writeSections (column) {
    const sections = []
    const minY = column.minY >> 4
    const maxY = column.worldHeight >> 4
    for (let y = minY; y < maxY; y++) {
      const section = column.sections[y - minY]
      const biomeSection = column.biomes[y - minY]
      const blockLightSection = column.blockLightSections[y - minY + 1]
      const skyLightSection = column.skyLightSections[y - minY + 1]

      if (section) {
        section.palette = section.palette === undefined ? [section.data.value] : section.palette
        let blockStates, biomes, blockLight, skyLight
        const blockPalette = section.palette.map(id => Block.fromStateId(id))
          .map(block => ({
            Name: nbt.string('minecraft:' + block.name),
            Properties: nbt.comp(objPropsToNbt(block.getProperties()))
          }))

        const biomePalette = biomeSection.data.palette ? biomeSection.data.palette : [biomeSection.data.value] // "SingleValue" palette mess

        const bitsPerBlock = Math.ceil(Math.log2(blockPalette.length))
        const bitsPerBiome = Math.ceil(Math.log2(biomePalette.length))

        if (!bitsPerBlock) {
          blockStates = nbt.comp({ palette: nbt.list(nbt.comp(blockPalette)) })
        } else {
          assert.strictEqual(bitsPerBlock, section.data.data.bitsPerValue, `Computed bits per block for palette size of ${blockPalette.length} (${bitsPerBlock}) does not match bits per block in section, ${section.data.data.bitsPerValue}`)

          const data = section.data.data.toLongArray()
          blockStates = nbt.comp({ palette: nbt.list(nbt.comp(blockPalette)), data: nbt.longArray(data) })
        }

        const biomeNamesPalette = biomePalette.map(biomeId => 'minecraft:' + registry.biomes[biomeId].name)

        if (!bitsPerBiome) {
          biomes = nbt.comp({ palette: nbt.list(nbt.string(biomeNamesPalette)) })
        } else {
          assert.strictEqual(bitsPerBiome, biomeSection.data.data.bitsPerValue, `Computed bits per biome for palette size of ${biomeSection?.data?.palette?.length} (${bitsPerBiome}) does not match bits per biome in section ${biomeSection?.data?.data?.bitsPerValue}`)

          const data = biomeSection.data.data.toLongArray()
          biomes = nbt.comp({ palette: nbt.list(nbt.string(biomeNamesPalette)), data: nbt.longArray(data) })
        }

        if (blockLightSection) {
          if (blockLightSection.bitsPerValue === 4) {
            blockLight = new Int8Array(blockLightSection.data.buffer)
          } else {
            blockLight = blockLightSection.resizeTo(4)
          }
        }

        if (skyLightSection) {
          if (skyLightSection.bitsPerValue === 4) {
            skyLight = new Int8Array(skyLightSection.data.buffer)
          } else {
            skyLight = skyLightSection.resizeTo(4)
          }
        }

        const tag = {
          Y: nbt.byte(y),
          block_states: blockStates,
          biomes: biomes
        }

        if (blockLight) tag.BlockLight = nbt.byteArray(blockLight)
        if (skyLight) tag.SkyLight = nbt.byteArray(skyLight)

        sections.push(tag)
      }
    }

    return sections
  }

  function toNBT (column, x, z) {
    const tag = nbt.comp({
      DataVersion: nbt.int(dataVersion),
      Status: nbt.string('full'),
      xPos: nbt.int(x),
      yPos: nbt.int(column.minY >> 4), // Lowest y index
      zPos: nbt.int(z),

      block_entities: nbt.list(Object.keys(column.blockEntities).length ? nbt.comp(Object.values(column.blockEntities)) : null),
      LastUpdate: nbt.long(column.lastUpdate ?? [Date.now() & 0xffff, 0]),
      InhabitedTime: nbt.long(column.inhabitedTime ?? 0),
      structures: nbt.comp({}),

      Heightmaps: nbt.comp({}),
      sections: nbt.list(nbt.comp(writeSections(column))),

      isLightOn: nbt.bool(false), // If we computed the lighting already

      block_ticks: nbt.list(),
      PostProcessing: nbt.list(),
      fluid_ticks: nbt.list()
    })

    return tag
  }

  function fromNBT (tag) {
    const data = nbt.simplify(tag)
    const column = new ChunkColumn()
    assert(data.Status === 'full', 'Chunk is not full')

    column.x = data.xPos
    column.z = data.zPos
    column.lastUpdate = data.LastUpdate.valueOf()
    column.inhabitedTime = data.InhabitedTime.valueOf()

    for (const section of data.sections) {
      let bitsPerBlock = Math.ceil(Math.log2(section.block_states.palette.length))
      const bitsPerBiome = Math.ceil(Math.log2(section.biomes.palette.length))

      if (bitsPerBlock === 1 || bitsPerBlock === 2 || bitsPerBlock === 3) {
        bitsPerBlock = 4
      }

      column.loadSection(section.Y, { ...section.block_states, bitsPerBlock }, { ...section.biomes, bitsPerBiome }, section.BlockLight, section.SkyLight)
    }

    if (data.block_entities.length) {
      column.loadBlockEntities(tag.value.block_entities.value.value)
    }

    // Ignore height map data
    // Ignore structures (what are these?)
    // Ignore block_ticks, PostProcessing, FluidTicks

    return column
  }

  return { nbtChunkToPrismarineChunk: fromNBT, prismarineChunkToNbt: toNBT }
}
