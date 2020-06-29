const nbt = require('prismarine-nbt')
const Vec3 = require('vec3').Vec3
const { writeUInt4LE } = require('uint4')

const ChunkSection = require('prismarine-chunk/src/pc/1.13/ChunkSection')

function neededBits (value) {
  return 32 - Math.clz32(value)
}

module.exports = (Chunk, mcData) => {
  function nbtChunkToPrismarineChunk (data) {
    const nbtd = nbt.simplify(data)
    const chunk = new Chunk()
    readSections(chunk, nbtd.Level.Sections)
    // readBiomes(chunk, nbtd.Level.Biomes)
    return chunk
  }

  function prismarineChunkToNbt (chunk) {
    return {
      name: '',
      type: 'compound',
      value: {
        Level: {
          type: 'compound',
          value: {
            Biomes: writeBiomes(chunk),
            Sections: writeSections(chunk)
          }
        }
      }
    }
  }

  function readSections (chunk, sections) {
    sections.forEach(section => readSection(chunk, section))
  }

  function writeSections (chunk) {
    const sections = []
    for (let sectionY = 0; sectionY < 16; sectionY++) { sections.push(writeSection(chunk, sectionY)) }

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
    }
    readBlocks(chunkSection, section.BlockStates)

    // TODO light
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

  function writeSection (chunk, sectionY) {
    return {
      Y: {
        type: 'byte',
        value: sectionY
      },
      Blocks: writeBlocks(chunk, sectionY),
      Data: writeData(chunk, sectionY),
      BlockLight: writeBlockLight(chunk, sectionY),
      SkyLight: writeSkyLight(chunk, sectionY)
    }
  }

  function toSignedArray (buffer) {
    const arr = []
    for (let index = 0; index < buffer.length; index++) { arr.push(buffer.readInt8(index)) }
    return arr
  }

  function writeBlocks (chunk, sectionY) {
    const buffer = Buffer.alloc(16 * 16 * 16)
    for (let y = 0; y < 16; y++) {
      for (let z = 0; z < 16; z++) {
        for (let x = 0; x < 16; x++) {
          buffer.writeUInt8(chunk.getBlockType(new Vec3(x, y + sectionY * 16, z)), x + 16 * (z + 16 * y))
        }
      }
    }
    return {
      type: 'byteArray',
      value: toSignedArray(buffer)
    }
  }

  function writeData (chunk, sectionY) {
    const buffer = Buffer.alloc(16 * 16 * 8)
    for (let y = 0; y < 16; y++) {
      for (let z = 0; z < 16; z++) {
        for (let x = 0; x < 16; x++) { writeUInt4LE(buffer, chunk.getBlockData(new Vec3(x, y + sectionY * 16, z)), (x + 16 * (z + 16 * y)) * 0.5) }
      }
    }
    return {
      type: 'byteArray',
      value: toSignedArray(buffer)
    }
  }

  function writeBlockLight (chunk, sectionY) {
    const buffer = Buffer.alloc(16 * 16 * 8)
    for (let y = 0; y < 16; y++) {
      for (let z = 0; z < 16; z++) {
        for (let x = 0; x < 16; x++) { writeUInt4LE(buffer, chunk.getBlockLight(new Vec3(x, y + sectionY * 16, z)), (x + 16 * (z + 16 * y)) * 0.5) }
      }
    }
    return {
      type: 'byteArray',
      value: toSignedArray(buffer)
    }
  }

  function writeSkyLight (chunk, sectionY) {
    const buffer = Buffer.alloc(16 * 16 * 8)
    for (let y = 0; y < 16; y++) {
      for (let z = 0; z < 16; z++) {
        for (let x = 0; x < 16; x++) { writeUInt4LE(buffer, chunk.getSkyLight(new Vec3(x, y + sectionY * 16, z)), (x + 16 * (z + 16 * y)) * 0.5) }
      }
    }
    return {
      type: 'byteArray',
      value: toSignedArray(buffer)
    }
  }

  function writeBiomes (chunk) {
    const biomes = []
    for (let z = 0; z < 16; z++) {
      for (let x = 0; x < 16; x++) { biomes.push(chunk.getBiome(new Vec3(x, 0, z))) }
    }
    return {
      value: biomes,
      type: 'byteArray'
    }
  }

  return { nbtChunkToPrismarineChunk, prismarineChunkToNbt }
}
