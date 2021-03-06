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
    if(!this.vertices) this.vertices = [];
    if(!this.color) this.color = {
        'r': 0.5,
        'g': 0.5,
        'b': 0.5,
        'gloss': 0
    };
    if(!this.color.r) this.color.r = 0;
    if(!this.color.g) this.color.g = 0;
    if(!this.color.b) this.color.b = 0;
    if(!this.color.gloss) this.color.gloss = 0;
    if(!this.dir) this.dir = {
        'y': 0,
        'z': 0
    };
    if(!this.dir.y) this.dir.y = 0;
    if(!this.dir.z) this.dir.z = 0;
    
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
     * Stroke the polygon
     */
    this.stroke = function(c) {
        
        // Check if there's anything to draw
        if(this.vertices.length < 2) return;
        
        // Set the vertices
        c.beginPath();
        c.moveTo(this.vertices[0].x, this.vertices[0].y);
        for(var i = 1; i < this.vertices.length; i++) {
            c.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        c.closePath();
        
        // Draw
        c.stroke();
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
}
