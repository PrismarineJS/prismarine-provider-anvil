const nbt = require('prismarine-nbt')
const ChunkSection = require('prismarine-chunk')('1.13').section
const neededBits = require('prismarine-chunk/src/pc/common/neededBits')

module.exports = (Chunk, mcData) => {
  function nbtChunkToPrismarineChunk (data) {
    const nbtd = nbt.simplify(data)
    const chunk = new Chunk()
    readSections(chunk, nbtd.Level.Sections)
    chunk.biomes = nbtd.Level.Biomes
    return chunk
  }

  function prismarineChunkToNbt (chunk, chunkXPos, chunkZPos) {
    return {
      name: '',
      type: 'compound',
      value: {
        Level: {
          type: 'compound',
          value: {
            Biomes: { value: chunk.biomes, type: 'intArray' },
            Sections: writeSections(chunk),
            xPos: {
              type: 'int',
              value: chunkXPos
            },
            zPos: {
              type: 'int',
              value: chunkZPos
            },
            Status: {
              type: 'string',
              value: 'postprocessed'
            }
          }
        },
        DataVersion: {
          type: 'int',
          value: 1631
        }
      }
    }
  }

  function readSections (chunk, sections) {
    sections.forEach(section => readSection(chunk, section))
  }

  function writeSections (chunk) {
    const sections = []
    for (let sectionY = 0; sectionY < 16; sectionY++) {
      const section = chunk.sections[sectionY]
      if (section) sections.push(writeSection(section, sectionY))
    }

    return {
      type: 'list',
      value: {
        type: 'compound',
        value: sections
      }
    }
  }

  function readSection (chunk, section) {
    let chunkSection = chunk.sections[section.Y]
    if (!chunkSection) {
      chunkSection = new ChunkSection()
      chunk.sections[section.Y] = chunkSection
      chunk.sectionMask |= 1 << section.Y
    }

    readPalette(chunkSection, section.Palette)
    // Empty (filled with air) sections can be stored, but make the client crash if
    // they are sent over. Remove them as soon as possible
    if (chunkSection.palette.length === 1 && chunkSection.palette[0] === 0) {
      chunk.sections[section.Y] = null
      chunk.sectionMask &= ~(1 << section.Y)
      return
    }
    readBlocks(chunkSection, section.BlockStates)
    readByteArray(chunkSection.blockLight, section.BlockLight)
    readByteArray(chunkSection.skyLight, section.SkyLight)
  }

  function parseValue (value, state) {
    if (state.type === 'enum') {
      return state.values.indexOf(value)
    }
    if (value === 'true') return 0
    if (value === 'false') return 1
    return parseInt(value, 10)
  }

  function getStateValue (states, name, value) {
    let offset = 1
    for (let i = states.length - 1; i >= 0; i--) {
      const state = states[i]
      if (state.name === name) {
        return offset * parseValue(value, state)
      }
      offset *= state.num_values
    }
    return 0
  }

  function readPalette (section, palette) {
    section.palette = []
    for (const type of palette) {
      const name = type.Name.split(':')[1]
      const block = mcData.blocksByName[name]
      let data = 0
      if (type.Properties) {
        for (const [key, value] of Object.entries(type.Properties)) {
          data += getStateValue(block.states, key, value)
        }
      }
      const stateId = block.minStateId + data
      section.palette.push(stateId)
    }
  }

  function readBlocks (section, blockStates) {
    section.data = section.data.resizeTo(Math.max(4, neededBits(section.palette.length - 1)))
    for (let i = 0; i < blockStates.length; i++) {
      section.data.data[i * 2] = blockStates[i][1] >>> 0
      section.data.data[i * 2 + 1] = blockStates[i][0] >>> 0
    }

    section.solidBlockCount = 0
    for (let i = 0; i < 4096; i++) {
      if (section.data.get(i) !== 0) {
        section.solidBlockCount += 1
      }
    }
  }

  function makeUInt (a, b, c, d) {
    return (((a & 0xFF) << 24) | ((b & 0xFF) << 16) | ((c & 0xFF) << 8) | (d & 0xFF)) >>> 0
  }

  function readByteArray (bitArray, array) {
    for (let i = 0; i < bitArray.data.length; i += 2) {
      const i4 = i * 4
      bitArray.data[i + 1] = makeUInt(array[i4], array[i4 + 1], array[i4 + 2], array[i4 + 3])
      bitArray.data[i] = makeUInt(array[i4 + 4], array[i4 + 5], array[i4 + 6], array[i4 + 7])
    }
  }

  function writeSection (section, sectionY) {
    return {
      Y: {
        type: 'byte',
        value: sectionY
      },
      Palette: writePalette(section.palette),
      BlockStates: writeBlocks(section.data),
      BlockLight: writeByteArray(section.blockLight),
      SkyLight: writeByteArray(section.skyLight)
    }
  }

  function writeValue (state, value) {
    if (state.type === 'enum') return state.values[value]
    if (state.type === 'bool') return value ? 'false' : 'true'
    return value + ''
  }

  function writePalette (palette) {
    const nbtPalette = []
    for (const state of palette) {
      const block = mcData.blocksByStateId[state]
      const nbtBlock = {}
      if (block.states.length > 0) {
        let data = state - block.minStateId
        nbtBlock.Properties = { type: 'compound', value: {} }
        for (let i = block.states.length - 1; i >= 0; i--) {
          const prop = block.states[i]
          nbtBlock.Properties.value[prop.name] = { type: 'string', value: writeValue(prop, data % prop.num_values) }
          data = Math.floor(data / prop.num_values)
        }
      }
      nbtBlock.Name = { type: 'string', value: 'minecraft:' + block.name }
      nbtPalette.push(nbtBlock)
    }
    return { type: 'list', value: { type: 'compound', value: nbtPalette } }
  }

  function writeBlocks (blocks) {
    const buffer = new Array(blocks.data.length / 2)
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = [blocks.data[i * 2 + 1] << 0, blocks.data[i * 2] << 0]
    }
    return {
      type: 'longArray',
      value: buffer
    }
  }

  function writeByteArray (bitArray) {
    const buffer = []
    for (let i = 0; i < bitArray.data.length; i += 2) {
      let a = bitArray.data[i + 1]
      buffer.push(((a >> 24) & 0xFF) << 24 >> 24)
      buffer.push(((a >> 16) & 0xFF) << 24 >> 24)
      buffer.push(((a >> 8) & 0xFF) << 24 >> 24)
      buffer.push((a & 0xFF) << 24 >> 24)
      a = bitArray.data[i]
      buffer.push(((a >> 24) & 0xFF) << 24 >> 24)
      buffer.push(((a >> 16) & 0xFF) << 24 >> 24)
      buffer.push(((a >> 8) & 0xFF) << 24 >> 24)
      buffer.push((a & 0xFF) << 24 >> 24)
    }
    return {
      type: 'byteArray',
      value: buffer
    }
  }

  return { nbtChunkToPrismarineChunk, prismarineChunkToNbt }
}
