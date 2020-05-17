const Anvil = require('./../index').Anvil('1.8')
const Vec3 = require('vec3')
const Chunk = require('prismarine-chunk')('1.8')
const path = require('path')

const chunkF = new Anvil(process.argv[2] ? process.argv[2] : path.join(__dirname, '/../world/lttp'))

const c = chunkF.saveRaw(-32, 0, { name: '', type: 'compound', value: {} })

const p = c.then(function () {
  console.log('saved')
})
  .catch(function (err) {
    console.log(err.stack)
  })

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

const d = p.then(() => chunkF.save(-32, 0, chunk))

d.then(function () {
  console.log('saved')
})
  .catch(function (err) {
    console.log(err.stack)
  })
