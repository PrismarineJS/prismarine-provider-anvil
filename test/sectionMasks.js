/* eslint-env mocha */

const { Vec3 } = require('vec3')
const assert = require('assert')

const testedVersions = ['1.9', '1.13', '1.14', '1.16', '1.17']
const usesBitArray = ['1.17']

for (const version of testedVersions) {
  const Chunk = require('prismarine-chunk')(version)
  const chunk = new Chunk()

  for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
      chunk.setBiome(new Vec3(x, 0, z), 5)
      chunk.setBlockType(new Vec3(x, 50, z), 2)
      chunk.setSkyLight(new Vec3(x, 128, z), 15)
      chunk.setBlockLight(new Vec3(x, 16, z), 15)
    }
  }
  const sectionMask = 1 << (50 >> 4)
  const skyLightMask = 1 << (128 >> 4)
  const blockLightMask = 1 << (16 >> 4)

  describe('chunk masks ' + version, function () {
    it('has correct section mask ', function () {
      if (usesBitArray.includes(version)) {
        assert.deepEqual(chunk.getMask(), [[0, sectionMask]])
      } else {
        assert.strictEqual(chunk.getMask(), sectionMask)
      }
    })
    if (chunk.skyLightMask === undefined) return // Not implemented until 1.14
    it('has correct sky light mask ', function () {
      if (usesBitArray.includes(version)) {
        assert.deepEqual(chunk.skyLightMask.toLongArray(), [[0, skyLightMask]])
      } else {
        assert.strictEqual(chunk.skyLightMask, skyLightMask)
      }
    })
    it('has correct block light mask ', function () {
      if (usesBitArray.includes(version)) {
        assert.deepEqual(chunk.skyLightMask.toLongArray(), [[0, blockLightMask]])
      } else {
        assert.strictEqual(chunk.blockLightMask, blockLightMask)
      }
    })
  })
}
