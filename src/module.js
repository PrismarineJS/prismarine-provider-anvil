var readMCA = require('minecraft-mca');
var mcRegion = require('minecraft-region');
var fs = require('fs');

function getRegion(x, z) {
    var region = { x: x >> 5, z: z >> 5 };
    var regionFile = 'world/r.'+region.x+'.'+region.z+'.mca';
    var buf = fs.readFileSync(regionFile);  
    var data = mcRegion(toArrayBuffer(buf),region.x,region.z);
    return data;
}

function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var typedarray = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        typedarray[i] = buffer[i];
    }
    return ab;
}

class Anvil {

    // returns a Promise. Resolve a Chunk object or reject if it hasn’t been generated
    load(x,z) {
        if (typeof x !== "number" || typeof z !== "number") {
            throw "Missing x or z arguments."
        }
        var region = getRegion(x,z);
        var chunk = region.getChunk(x,z);
        return chunk;
    }

    // returns a Promise. Resolve an empty object when successful
    save(x,z,buffer) {

    }
}

module.exports = Anvil;