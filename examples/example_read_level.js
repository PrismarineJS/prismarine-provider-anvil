const readLevel = require('./../index').level.readLevel

if (process.argv.length !== 3) {
  console.log('Usage : node example_read_level.js <level.dat>')
  process.exit(1)
}

readLevel(process.argv[2])
  .then(function (nbt) { console.log(JSON.stringify(nbt, null, 2)) })
  .catch(function (err) { console.log(err.stack) })
