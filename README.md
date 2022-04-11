# prismarine-provider-anvil
[![NPM version](https://img.shields.io/npm/v/prismarine-provider-anvil.svg)](http://npmjs.com/package/prismarine-provider-anvil)
[![Build Status](https://github.com/PrismarineJS/prismarine-provider-anvil/workflows/CI/badge.svg)](https://github.com/PrismarineJS/prismarine-provider-anvil/actions?query=workflow%3A%22CI%22)

Anvil Storage Provider implementation. Support minecraft pc 1.8, 1.9, 1.10, 1.11, 1.12, 1.13, 1.14, 1.15, 1.16, 1.17 and 1.18

## Usage

See [examples](examples)

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

#### Anvil.getAllChunksInRegion(x,z)

Returns an promise of an array of all chunks in the region

### level

#### level.readLevel(path)

Reads a level.dat file

#### level.writeLevel(path,value)

Writes a level.dat file

## History

### 2.7.0

* Bump mcdata

### 2.6.0

* 1.18 support

### 2.5.1

* Ensure chunk status and data version are written for v1.13 (@Paulomart)

### 2.5.0

* Adds 1.17 support (thanks @Saiv46)
* Write the chunk x and z position like vanilla does (@Paulomart)

### 2.4.0

* adds getAllChunksInRegion function (@U9G)
* used exposed section instead of using internals of pchunk (@rom1504)

### 2.3.2

* Fix 1.16 palette issue

### 2.3.1

* Only store sections between 0 and 16 (block containing sections) (thanks @IdanHo)
* remove node-promise-es6, and use fs.promises + util.promisify (thanks @IdanHo)

### 2.3.0

* 1.14, 1.15 and 1.16 support (thanks @IdanHo)

### 2.2.0

* 1.13 support (thanks @Karang)

### 2.1.0

* standardjs

### 2.0.0

* cross version support

### 1.1.0

* update dependencies, fix #10 (prismarine-nbt nbt.simplify was broken)

### 1.0.1

* update to babel6

### 1.0.0

* bump dependencies

### 0.2.2

* fix small bug with regionFileName call

### 0.2.1

* update prismarine-chunk
* use nbt.simplify

### 0.2.0

* add level.dat loading/saving

### 0.1.0

* completely reimplement to provide full functionality :  loading and saving, and all the data in chunks

### 0.0.2

* use up to date dependencies in minecraft-region

### 0.0.1

* catch the error if the region file doesn't exist and return null in getRegion

### 0.0.0

* first version, basic functionality using minecraft-chunk, minecraft-region, prismarine-chunk and vec3
