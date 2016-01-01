const RegionFile=require('./region');
const {getNbtValue,nbtChunkToPrismarineChunk}=require('./chunk');

class Anvil {

  regions;

  constructor(path) {
    this.path=path;
    this.regions={};
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
    const value=getNbtValue(data);
    return nbtChunkToPrismarineChunk(value);
  }

  async loadRaw(x,z) {
    const region=await this.getRegion(x,z);
    return await region.read(x & 0x1F,z & 0x1F);
  }

  // returns a Promise. Resolve an empty object when successful
  async save(x,z,chunk) {
    let region=await this.getRegion(x,z);
    return await region.write(x & 0x1F,z & 0x1F,chunk);
  }
}

module.exports=Anvil;