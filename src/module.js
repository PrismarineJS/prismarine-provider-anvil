module.exports = function Module (type) {
    this.color = "red";
    this.getColor = function() {
        return this.color;
    };
}