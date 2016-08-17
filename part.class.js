/**
 * Part
 */
function part(pos) {
    
    /** Set defaults */
    if(!pos) pos = {
        'x': 0,
        'y': 0
    };
    
    /** Orientation and state */
    this.pos = pos;
    
    /** The poygons the part consists of */
    this.polys = [];
    
    /**
     * Draw part
     */
    this.draw = function(c, sun) {
        for(var i = 0; i < this.polys.length; i++) this.polys[i].draw(c, sun);
    }
    
    /**
     * Draw part at coordinates
     */
    this.drawAt = function(c, pos, sun) {
        c.save();
        c.translate(pos.x, pos.y);
        this.draw(c, sun);
        c.restore();
    }
}
