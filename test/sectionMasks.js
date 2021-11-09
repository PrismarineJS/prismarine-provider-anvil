/* eslint-env mocha */

const { Vec3 } = require('vec3')
const assert = require('assert')

const testedVersions = ['1.9', '1.13', '1.14', '1.16', '1.17']

for (const version of testedVersions) {
  const Chunk = require('prismarine-chunk')(version)
  const chunk = new Chunk()

  for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
      chunk.setBiome(new Vec3(x, 0, z), 5)
      chunk.setBlockType(new Vec3(x, 50, z), 2)
      for (let y = 0; y < 256; y++) {
        chunk.setSkyLight(new Vec3(x, y, z), 15)
      }
    }
  }

  describe('chunk masks ' + version, function () {
    it('has corrent section mask ', function () {
      assert.strictEqual(chunk.getMask(), 0b001)
    })
  })
}
