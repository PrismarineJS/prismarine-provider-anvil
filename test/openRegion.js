/* eslint-env mocha */
const fs = require('fs')
const path = require('path')
const assert = require('assert')
const fixtures = path.join(__dirname, 'fixtures')
const prismarineProviderAnvil = require('prismarine-provider-anvil')
const testedVersions = prismarineProviderAnvil.testedVersions
describe('can get chunks from region files', function () {
  this.timeout(5 * 1000)
  for (const version of testedVersions) {
    describe(`open regions ${version}`, async () => {
      const Anvil = prismarineProviderAnvil.Anvil(version)
      const filePath = path.join(fixtures, version)
      const anvil = new Anvil(filePath)
      const regions = fs.readdirSync(filePath).filter(f => f.match(/r\.(-?\d+)\.(-?\d+)\.mca/))
      for (const region of regions) {
        const [, xStr, zStr] = region.match(/r\.(-?\d+)\.(-?\d+)\.mca/)
        const [x, z] = [+xStr, zStr]
        it('open region ' + region, async () => {
          const chunks = (await anvil.getAllChunksInRegion(x, z)).filter(x => x)
          assert(chunks.length > 0)
        })
      }
    })
  }
})
