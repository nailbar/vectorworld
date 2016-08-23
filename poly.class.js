/**
 * Polygon
 */
function poly(vertices, color, dir) {
    
    /** List of vertices in polygon */
    this.vertices = vertices;
    
    /** Polygon color */
    this.color = color;
    
    /** Polygon direction / tilt */
    this.dir = dir;
    
    /** Defaults for omitted input */
    if(!vertices) vertices = [];
    if(!color) color = {
        'r': 0.5,
        'g': 0.5,
        'b': 0.5,
        'gloss': 0
    };
    if(!color.r) color.r = 0;
    if(!color.g) color.g = 0;
    if(!color.b) color.b = 0;
    if(!color.gloss) color.gloss = 0;
    if(!dir) dir = {
        'y': 0,
        'z': 0
    };
    if(!dir.y) dir.y = 0;
    if(!dir.z) dir.z = 0;
    
    /**
     * Draw the polygon
     */
    this.draw = function(c, sun) {
        if(!sun) sun = 0;
        
        // Check if there's anything to draw
        if(this.vertices.length < 3) return;
        
        // Set the vertices
        c.beginPath();
        c.moveTo(this.vertices[0].x, this.vertices[0].y);
        for(var i = 1; i < this.vertices.length; i++) {
            c.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        c.closePath();
        
        // Calculate shadow and phong
        this.color.exposure = Math.cos((this.dir.y - sun) * Math.PI * 2.0);
        this.color.light = Math.min(1.0, Math.max(0, this.color.exposure * (0.2 + this.dir.z * 0.8) + 1.0));
        this.color.phong = 0;
        if(this.dir.z < 0.01) this.color.phong = 0;
        else this.color.phong = Math.min(1.0, Math.max(0, (this.color.exposure - (1.0 - 0.1 * this.dir.z)) / (0.15 * this.dir.z))) * this.color.gloss;
        
        // Set color
        this.color.ri = Math.min(255, Math.max(0, Math.floor(this.color.r * 256.0 * this.color.light + 256.0 * this.color.phong)));
        this.color.gi = Math.min(255, Math.max(0, Math.floor(this.color.g * 256.0 * this.color.light + 256.0 * this.color.phong)));
        this.color.bi = Math.min(255, Math.max(0, Math.floor(this.color.b * 256.0 * this.color.light + 256.0 * this.color.phong)));
        c.fillStyle = "rgb(" + this.color.ri + "," + this.color.gi + "," + this.color.bi + ")";
        
        // Draw
        c.fill();
    }
    
    /**
     * Draw polygon at specific coordinates
     */
    this.drawAt = function(c, pos, sun) {
        c.save();
        c.translate(pos.x, pos.y);
        this.draw(c, sun);
        c.restore();
    }
    
    /**
     * Calculate where two lines cross
     */
    this.getLineIntersection = function(line1a, line1b, line2a, line2b) {
        
        // Convert line 1
        var l1_a = line1b.y - line1a.y;
        var l1_b = line1a.x - line1b.x;
        var l1_c = l1_a * line1a.x + l1_b * line1a.y;
        
        // Convert line 2
        var l2_a = line2b.y - line2a.y;
        var l2_b = line2a.x - line2b.x;
        var l2_c = l2_a * line2a.x + l2_b * line2a.y;
        
        // Check intersection
        var d = l1_a * l2_b - l2_a * l1_b;
        if(d == 0) return false; // Parallel
        var intersection = {
            'x': (l2_b * l1_c - l1_b * l2_c) / d,
            'y': (l1_a * l2_c - l2_a * l1_c) / d
        };
        
        // Check segment boundraries (take floating point errors into account :-P)
        if(Math.min(line1a.x, line1b.x) > intersection.x + 0.00001) return false;
        if(Math.max(line1a.x, line1b.x) < intersection.x - 0.00001) return false;
        if(Math.min(line2a.x, line2b.x) > intersection.x + 0.00001) return false;
        if(Math.max(line2a.x, line2b.x) < intersection.x - 0.00001) return false;
        if(Math.min(line1a.y, line1b.y) > intersection.y + 0.00001) return false;
        if(Math.max(line1a.y, line1b.y) < intersection.y - 0.00001) return false;
        if(Math.min(line2a.y, line2b.y) > intersection.y + 0.00001) return false;
        if(Math.max(line2a.y, line2b.y) < intersection.y - 0.00001) return false;
        
        // Intersection found, return it
        return intersection;
    }
}
