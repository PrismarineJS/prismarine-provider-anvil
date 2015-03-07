var assert = require('assert');

var Module = require('../index.js');

describe('Module', function() {
    it('should have a color of red', function() {
        var module = new Module();

        assert.equal("red", module.getColor());
    });
});
