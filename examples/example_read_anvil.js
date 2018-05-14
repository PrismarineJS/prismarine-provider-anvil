const Anvil = require('./../index').Anvil('1.8')
const Vec3 = require('vec3')
const path = require('path')

const anvil = new Anvil(process.argv[2] ? process.argv[2] : path.join(__dirname, '/../world/lttp'))

const d = anvil.load(-32, 0)

anvil.loadRaw(-32, 0).then(function (nbt) {
  // console.log(JSON.stringify(nbt,null,2));
})

d.then(function (data) {
  console.log(data.getBlock(new Vec3(1, 1, 15)))
})
  .catch(function (err) {
    console.log(err.stack)
  })
