const nbt = require('prismarine-nbt')

// 26.3 changed how block_states palettes are stored, the rest of the chunk format is the same as 1.18:
// - entries are { id, properties } compounds instead of { Name, Properties }
// - blocks in their default state are stored as just their id
// - a palette is a list of ids when all its blocks are in their default state, otherwise its ids are
//   wrapped in { '': id } compounds to share the list with the { id, properties } ones (how NBT stores mixed lists)
module.exports = (ChunkColumn, registry) => {
  const Block = require('prismarine-block')(registry)
  // turns a JS object into an NBT compound, with the values as nbt.string's
  const objPropsToNbt = props => Object.fromEntries(Object.entries(props).map(([k, v]) => [k, nbt.string(String(v))]))
  const stringifyProps = props => Object.fromEntries(Object.entries(props).map(([k, v]) => [k, String(v)]))

  function writeBlockPalette (stateIds) {
    const entries = stateIds.map(stateId => {
      const block = Block.fromStateId(stateId)
      const id = 'minecraft:' + block.name
      if (stateId === registry.blocks[block.type].defaultState) return id
      return { id: nbt.string(id), properties: nbt.comp(objPropsToNbt(block.getProperties())) }
    })

    if (entries.every(entry => typeof entry === 'string')) return nbt.list(nbt.string(entries))
    return nbt.list(nbt.comp(entries.map(entry => typeof entry === 'string' ? { '': nbt.string(entry) } : entry)))
  }

  // to the { Name, Properties } entries the 1.18 implementation reads
  function readBlockPalette (palette) {
    return palette.map(entry => {
      const id = typeof entry === 'string' ? entry : entry.id ?? entry['']
      // Block.fromProperties would use the first value of each missing property, not the default state's
      const defaultState = registry.blocksByName[id.replace('minecraft:', '')]?.defaultState
      const defaultProperties = defaultState === undefined ? {} : stringifyProps(Block.fromStateId(defaultState).getProperties())
      return { Name: id, Properties: { ...defaultProperties, ...entry.properties } }
    })
  }

  return require('../1.18/chunk')(ChunkColumn, registry, { writeBlockPalette, readBlockPalette })
}
