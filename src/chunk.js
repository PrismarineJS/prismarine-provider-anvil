module.exports = (mcVersion) => {
  const mcData = require('minecraft-data')(mcVersion)
  const Chunk = require('prismarine-chunk')(mcVersion)

  const chunkImplementations = {
    '1.8': require('./1.8/chunk'),
    '1.9': require('./1.8/chunk'),
    '1.10': require('./1.8/chunk'),
    '1.11': require('./1.8/chunk'),
    '1.12': require('./1.8/chunk'),
    '1.13': require('./1.13/chunk')
  }
  return chunkImplementations[mcData.version.majorVersion](Chunk, mcData)
}
