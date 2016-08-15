/**
 * Part
 */
function part(pos, dir) {
    
    /** Set defaults */
    if(!pos) pos = {
        'x': 0,
        'y': 0
    };
    if(!dir) dir = 0;
    
    /** Orientation and state */
    this.pos = pos;
    this.dir = dir;
    
    /** The poygons the part consists of */
    this.polys = [];
    
    /**
     * Draw part
     */
    this.draw = function(c, sun) {
        for(var i = 0; i < this.polys.length; i++) this.polys[i].draw(c, sun);
    }
    
    /**
     * Draw part at coordinates and orientation
     */
    this.drawAt = function(c, pos, dir, sun) {
        
        // Reorient the sun direction
        sun -= dir;
        
        // Manipulate matrix and draw polygons
        c.save();
        c.translate(pos.x, pos.y);
        c.rotate(dir * Math.PI * 2.0);
        this.draw(c, sun);
        c.restore();
    }
}
