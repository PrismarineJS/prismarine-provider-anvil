# prismarine-provider-anvil
[![NPM version](https://img.shields.io/npm/v/prismarine-provider-anvil.svg)](http://npmjs.com/package/prismarine-provider-anvil)

Anvil Storage Provider implementation.

## Usage

See [example_read.js](example_read.js) and [example_write.js](example_write.js) 

## API

### Anvil

#### Anvil(path)
Build an anvil : provide loading and saving of chunks in all regions in `path`

#### Anvil.save(x,z,chunk)

Take a prismarine chunk and save it. Returns a promise.

#### Anvil.saveRaw(x,z,nbt)

Take a nbt object and save it. Returns a promise.

#### Anvil.load(x,z)

Returns a promise containing the prismarine chunk at x,z or null if that chunk isn't saved.

#### Anvil.loadRaw(x,z)

Returns a promise containing the nbt at x,z or null if that nbt isn't saved.

## History

### 0.0.2

* use up to date dependencies in minecraft-region

### 0.0.1

* catch the error if the region file doesn't exist and return null in getRegion

### 0.0.0

* first version, basic functionality using minecraft-chunk, minecraft-region, prismarine-chunk and vec3