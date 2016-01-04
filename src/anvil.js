const RegionFile=require('./region');
const {nbtChunkToPrismarineChunk,prismarineChunkToNbt}=require('./chunk');

class Anvil {

  regions={};
  regionsQueues={};

  constructor(path) {
    this.path=path;
  }

  regionFileName(x,z)
  {
    const region = { x: x >> 5, z: z >> 5 };
    return this.path+'/r.'+region.x+'.'+region.z+'.mca';
  }

  async getRegion(x,z) {
    if (typeof x !== "number" || typeof z !== "number") {
      throw "Missing x or z arguments."
    }
    var name=this.regionFileName(this.path,x,z);
    let region = this.regions[name];
    if(region== undefined) {
      region = new RegionFile(name);
      await region.initialize();
      this.regions[name]=region;
    }
    return region;
  }

  // returns a Promise. Resolve a Chunk object or reject if it hasn’t been generated
  async load(x,z) {
    const data=await this.loadRaw(x,z);
    if(data==null)
      return null;
    return nbtChunkToPrismarineChunk(data);
  }

  async loadRaw(x,z) {
    const region=await this.getRegion(x,z);
    return await region.read(x & 0x1F,z & 0x1F);
  }

  // returns a Promise. Resolve an empty object when successful
  async save(x,z,chunk) {
    await this.saveRaw(x,z,prismarineChunkToNbt(chunk));
  }

  async saveRaw(x,z,nbt) {
    const name=this.regionFileName(x,z);
    if(!this.regionsQueues[name]) this.regionsQueues[name]=Promise.resolve();
    this.regionsQueues[name]=this.regionsQueues[name].then(() => this._saveRaw(x,z,nbt));
    return this.regionsQueues[name];
  }

  async _saveRaw(x,z,nbt) {
    let region=await this.getRegion(x,z);
    await region.write(x & 0x1F,z & 0x1F,nbt);
  }
}

module.exports=Anvil;