const assert = require('assert')
const { Vec3 } = require('vec3')

function compareChunks (chunk, chunk2, chunkOptions) {
  const p = new Vec3(0, chunkOptions.minY, 0)
  const maxHeight = chunkOptions.worldHeight + chunkOptions.minY
  for (p.y = chunkOptions.minY; p.y < maxHeight; p.y++) {
    for (p.z = 0; p.z < 16; p.z++) {
      for (p.x = 0; p.x < 16; p.x++) {
        const b = chunk.getBlock(p)
        const b2 = chunk2.getBlock(p)
        assert.notStrictEqual(
          b.name,
          '',
          ' block state: ' +
                b.stateId +
                ' type: ' +
                b.type +
                " read, which doesn't exist"
        )
        assert.strictEqual(JSON.stringify(b), JSON.stringify(b2), 'blocks at ' + p +
          ' differ, first block is ' + JSON.stringify(b, null, 2) +
          ' second block is ' + JSON.stringify(b2, null, 2))
      }
    }
  }
}

module.exports.compareChunks = compareChunks
