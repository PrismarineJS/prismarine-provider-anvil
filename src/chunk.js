const PrismarineChunk = require('prismarine-chunk')

module.exports = (registryOrVersion) => {
  const registry = typeof registryOrVersion === 'string' ? require('prismarine-registry')(registryOrVersion) : registryOrVersion
  const Chunk = PrismarineChunk(registry)

  const chunkImplementations = {
    1.8: () => require('./1.8/chunk'),
    1.9: () => require('./1.8/chunk'),
    '1.10': () => require('./1.8/chunk'),
    1.11: () => require('./1.8/chunk'),
    1.12: () => require('./1.8/chunk'),
    1.13: () => require('./1.13/chunk'),
    1.14: () => require('./1.14/chunk')('1.14', 1976),
    1.15: () => require('./1.14/chunk')('1.15', 2230),
    1.16: () => require('./1.14/chunk')('1.16', 2567, true),
    1.17: () => require('./1.14/chunk')('1.17', 2730, true),
    1.18: () => require('./1.18/chunk'),
    1.19: () => require('./1.18/chunk'),
    '1.20': () => require('./1.18/chunk'),
    1.21: () => require('./1.18/chunk')
  }

  const loadVersion = registry.version.majorVersion
  const implementationLoader = chunkImplementations[loadVersion]?.()

  if (!implementationLoader) {
    throw new Error(`Unsupported version: ${loadVersion}`)
  }

  return implementationLoader(Chunk, registry)
}
