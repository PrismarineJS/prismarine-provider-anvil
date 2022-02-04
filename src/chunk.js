module.exports = (registryOrVersion) => {
  const registry = typeof registryOrVersion === 'string' ? require('prismarine-registry')(registryOrVersion) : registryOrVersion
  const Chunk = require('prismarine-chunk')(registry)

  const chunkImplementations = {
    1.8: require('./1.8/chunk'),
    1.9: require('./1.8/chunk'),
    '1.10': require('./1.8/chunk'),
    1.11: require('./1.8/chunk'),
    1.12: require('./1.8/chunk'),
    1.13: require('./1.13/chunk'),
    1.14: require('./1.14/chunk')('1.14', 1976),
    1.15: require('./1.14/chunk')('1.15', 2230),
    1.16: require('./1.14/chunk')('1.16', 2567, true),
    1.17: require('./1.14/chunk')('1.17', 2730, true),
    1.18: require('./1.18/chunk')
  }

  return chunkImplementations[registry.version.majorVersion](Chunk, registry)
}
