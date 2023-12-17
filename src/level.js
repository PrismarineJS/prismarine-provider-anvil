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
          // ...oldLevel.value?.Data?.value,
          Version: {
            type: 'compound',
            value: {
              Name: {
                type: 'string',
                value: value.Version.Name
              }
            }
          },
          LevelName: {
            type: 'string',
            value: 'prismarine-world'
          },
          generatorName: {
            type: 'string',
            value: value.generatorName
          },
          version: {
            type: 'int',
            value: 19133
          },
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
