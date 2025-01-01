# prismarine-provider-anvil
[![NPM version](https://img.shields.io/npm/v/prismarine-provider-anvil.svg)](http://npmjs.com/package/prismarine-provider-anvil)
[![Build Status](https://github.com/PrismarineJS/prismarine-provider-anvil/workflows/CI/badge.svg)](https://github.com/PrismarineJS/prismarine-provider-anvil/actions?query=workflow%3A%22CI%22)

Anvil Storage Provider implementation. Support minecraft pc 1.8, 1.9, 1.10, 1.11, 1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.18, 1.19, 1.20 and 1.21

## Usage

See [examples](examples)

## Test

Run single test with `npm run mochaTest -- -g "saving and loading works 1.8.9 in sequence"`

All tests with `npm test`

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

### 2.11.0
* [Update npm-publish.yml](https://github.com/PrismarineJS/prismarine-provider-anvil/commit/9bf7e1f80a679caf3b25f5cdcaa3a58e7ddb4404) (thanks @rom1504)

### 2.10.0
* [Quick fix for pc1.17 masks (#85)](https://github.com/PrismarineJS/prismarine-provider-anvil/commit/790db07d75d919f52056772c0998164b6587cd51) (thanks @extremeheat)
* [Bump mocha from 10.8.2 to 11.0.1 (#83)](https://github.com/PrismarineJS/prismarine-provider-anvil/commit/25da171b17f69e4252764931f8adba88b93f5a18) (thanks @dependabot[bot])
* [pc1.14-1.17: Don't read empty sections (#84)](https://github.com/PrismarineJS/prismarine-provider-anvil/commit/8ef34214f1221ac3e997ce2404634d3ae0c944c4) (thanks @extremeheat)

### 2.9.0
* [Support 1.18.2, 1.19.4, 1.20.6, 1.21.1 (#81)](https://github.com/PrismarineJS/prismarine-provider-anvil/commit/19bb778da80bb600cac9ee9d9f47f1d477e9b0cd) (thanks @rom1504)
* [Fix test versions. (#80)](https://github.com/PrismarineJS/prismarine-provider-anvil/commit/6b0517ef64623d031b6dfbcd422bf0149d9cacc0) (thanks @rom1504)
* [Default to biome minecraft:void (#76)](https://github.com/PrismarineJS/prismarine-provider-anvil/commit/dc32ad7326a815ab7f110f52d07df20f5b68527a) (thanks @AnotherPillow)
* [Handle optional palette in 1.14 chunk.js (#74)](https://github.com/PrismarineJS/prismarine-provider-anvil/commit/844445b0bb4cd83a5047c3afd419a211b0805cbc) (thanks @rom1504)

### 2.8.0
* [require lazily (#70)](https://github.com/PrismarineJS/prismarine-provider-anvil/commit/257f7fd2d995a54fe7e275909b264be106b95063) (thanks @zardoy)
* [Make created level.dat loadable in singleplayer (#71)](https://github.com/PrismarineJS/prismarine-provider-anvil/commit/2638bec1e8bca925e87a8a6a6b945417724fc4a1) (thanks @zardoy)
* [Add command gh workflow allowing to use release command in comments (#69)](https://github.com/PrismarineJS/prismarine-provider-anvil/commit/f3881cb11db3dbcfd6173bc32b89fb6d07da6185) (thanks @rom1504)
* [Update to node 18.0.0 (#68)](https://github.com/PrismarineJS/prismarine-provider-anvil/commit/68766beea0001a7e4833e086ebb903cd410c1eb6) (thanks @rom1504)
* [Initial support for loading Add data to a block (#64)](https://github.com/PrismarineJS/prismarine-provider-anvil/commit/8255f87a888e61c1b75089285e723c731e9e01c4) (thanks @BluSpring)
* [Fix world height on 1.18+ chunks (#66)](https://github.com/PrismarineJS/prismarine-provider-anvil/commit/59c1d72373f5c0b2d81a0618127e1e32f53ae135) (thanks @extremeheat)
* [Bump mocha from 9.2.2 to 10.0.0 (#62)](https://github.com/PrismarineJS/prismarine-provider-anvil/commit/e5814c0fc139fdc6b419f846d8a7d4083fe07edf) (thanks @dependabot[bot])
* [Bump standard from 16.0.4 to 17.0.0 (#61)](https://github.com/PrismarineJS/prismarine-provider-anvil/commit/c2b4199f6fbd6569f3b859b652a3756cf4cc0a61) (thanks @dependabot[bot])

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
