# prismarine-provider-anvil
[![NPM version](https://img.shields.io/npm/v/prismarine-provider-anvil.svg)](http://npmjs.com/package/prismarine-provider-anvil)
[![Build Status](https://circleci.com/gh/PrismarineJS/prismarine-provider-anvil/tree/master.svg?style=shield)](https://circleci.com/gh/PrismarineJS/prismarine-provider-anvil/tree/master)

Anvil Storage Provider implementation.

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

### level

#### level.readLevel(path)

Reads a level.dat file

#### level.writeLevel(path,value)

Writes a level.dat file

## History

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