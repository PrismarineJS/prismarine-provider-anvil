const nbt = require('prismarine-nbt')
const { promisify } = require('util')
const fs = require('fs').promises
const zlib = require('zlib')

function write (nbtData, cb) {
  const data = nbt.writeUncompressed(nbtData)
  zlib.gzip(data, cb)
}

const parseAsync = promisify(nbt.parse)
const writeAsync = promisify(write)

module.exports = { readLevel, writeLevel }

async function readLevel (path) {
  const content = await fs.readFile(path)
  const dnbt = await parseAsync(content)
  return nbt.simplify(dnbt).Data
}

async function writeLevel (path, value) {
  const nbt = {
    type: 'compound',
    name: '',
    value: {
      Data: {
        type: 'compound',
        value: {
          RandomSeed: {
            type: 'long',
            value: value.RandomSeed
          }
        }
      }
    }
  }
  const data = await writeAsync(nbt)
  await fs.writeFile(path, data)
}
