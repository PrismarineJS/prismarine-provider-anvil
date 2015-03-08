var readMCA = require('minecraft-mca');
var mcRegion = require('minecraft-region');
var fs = require('fs');

module.exports = function anvil() {

	// returns a Promise. Resolve a Chunk object or reject if it hasn’t been generated
	this.load = function(x,z) {
		console.log("Loading Chunk at ", x,z);
		if ((!x || !z) && (x !=0 && z !=0)) {
			throw "Missing x or z arguments."
		}
		console.log(getChunk(getRegion(x,z),x,z));
	}

	// returns a Promise. Resolve an empty object when successful
	this.save = function(x,z,buffer) {

	}
}

var chunk = new module.exports;
chunk.load(0,-32);

function getRegion(x, z) {
	var region = { x: x >> 5, z: z >> 5 };
	var regionFile = 'world/lttp/r.'+region.x+'.'+region.z+'.mca';
	var buf = fs.readFileSync(regionFile);	
    region.data = mcRegion(toArrayBuffer(buf),region.x,region.z);
    return region;
}

function getChunk(region, x, z) {
	var regions = {};
	var types = {};
    var opts = {
        ymin: 0,
        onVoxel: function(x, y, z, block, chunkX, chunkZ) {
            var type = block.type
            var regionKey = chunkX + ':' + chunkZ
            if (regions[regionKey]) {
                regions[regionKey]++
            } else {
                regions[regionKey] = 1
            }
            if (types[type]) types[type]++
                else types[type] = 1
        }
    };
    var view = readMCA(region.data, opts).loadChunk(x, z);
    return { regions: regions, types: types };
}

function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var typedarray = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        typedarray[i] = buffer[i];
    }
    return ab;
}