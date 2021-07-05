/* eslint-env mocha */
const fs = require('fs')
const path = require('path')
const assert = require('assert')
const fixtures = path.join(__dirname, 'fixtures')
const versions = fs.readdirSync(fixtures)
describe('can get chunks from region files', function () {
  this.timeout(5 * 1000)
  for (const version of versions) {
    it(`works for ${version}`, async () => {
      const Anvil = require('prismarine-provider-anvil').Anvil(version)
      const filePath = path.join(fixtures, version)
      const anvil = new Anvil(filePath)
      const [, xStr, zStr] = fs.readdirSync(filePath)[0].match(/r\.(-?\d+)\.(-?\d+)\.mca/)
      const [x, z] = [+xStr, zStr]
      const chunks = await anvil.getAllChunksInRegion(x, z)
      assert(chunks.length > 0)
    })
  }
})
