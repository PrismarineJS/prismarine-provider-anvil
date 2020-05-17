const writeLevel = require('./../index').level.writeLevel

if (process.argv.length !== 3) {
  console.log('Usage : node example_write_level.js <level.dat>')
  process.exit(1)
}

writeLevel(process.argv[2], { RandomSeed: [123, 0] })
  .catch(function (err) { console.log(err.stack) })
