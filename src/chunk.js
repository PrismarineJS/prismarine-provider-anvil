module.exports = (mcVersion) => {
  const mcData = require('minecraft-data')(mcVersion)
  const Chunk = require('prismarine-chunk')(mcVersion)

  const chunkImplementations = {
    1.8: require('./1.8/chunk'),
    1.9: require('./1.8/chunk'),
    '1.10': require('./1.8/chunk'),
    1.11: require('./1.8/chunk'),
    1.12: require('./1.8/chunk'),
    1.13: require('./1.13/chunk'),
    1.14: require('./1.14/chunk')('1.14', 1976),
    1.15: require('./1.14/chunk')('1.15', 2230),
    1.16: require('./1.14/chunk')('1.16', 2567, true)
  }
  return chunkImplementations[mcData.version.majorVersion](Chunk, mcData)
}
