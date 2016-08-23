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
    
    /**
     * Generate bounding box
     */
    this.getBoundingBox = function(vertices) {
        var bbox = {
            'min': {'x': 0, 'y': 0},
            'max': {'x': 0, 'y': 0}
        }
        
        // No vertices, default to 0,0,0,0
        if(!vertices.length) return bbox;
        
        // Get the min and max values
        bbox.min.x = bbox.max.x = vertices[0].x;
        bbox.min.y = bbox.max.y = vertices[0].y;
        for(var i = 1; i < vertices.length; i++) {
            if(vertices[i].x < bbox.min.x) bbox.min.x = vertices[i].x;
            if(vertices[i].y < bbox.min.y) bbox.min.y = vertices[i].y;
            if(vertices[i].x > bbox.max.x) bbox.max.x = vertices[i].x;
            if(vertices[i].y > bbox.max.y) bbox.max.y = vertices[i].y;
        }
        
        // Done
        return bbox;
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
    
    /**
     * Polygin intersection calculations
     */
    this.getPolyIntersections = function(poly1, poly2) {
        var v = {};
        
        // Check if bounding boxes intersect
        v.bbox1 = this.getBoundingBox(poly1);
        v.bbox2 = this.getBoundingBox(poly2);
        if(v.bbox1.min.x > v.bbox2.max.x) return v;
        if(v.bbox1.min.y > v.bbox2.max.y) return v;
        if(v.bbox1.max.x < v.bbox2.min.x) return v;
        if(v.bbox1.max.y < v.bbox2.min.y) return v;
        v.bbox_test = true;
        
        // Check if starting point of poly1 is outside or inside poly2
        v.start_outside = true;
        v.outside_point = {'x': Math.min(v.bbox1.min.x, v.bbox2.min.x) - 100, 'y': 0};
        for(var i2 = 0; i2 < poly2.length; i2++) {
            if(this.getLineIntersection(v.outside_point, poly1[0], poly2[i2], poly2[(i2 + 1) % poly2.length])) {
                v.start_outside = (v.start_outside ? false : true);
            }
        }
        
        // Search for intersections on poly1
        v.cur_outside = v.start_outside;
        v.poly1_ints = [];
        v.poly2_ipoints = [];
        for(var i1 = 0; i1 < poly1.length; i1++) {
            v.poly1_ints.push({'x': poly1[i1].x, 'y': poly1[i1].y, 'i1': i1, 'i2': -1});
            
            // Get direction indicator for line so we can check in what order the intersections happen
            v.cur_ray = {
                'x': poly1[(i1 + 1) % poly1.length].x - poly1[i1].x,
                'y': poly1[(i1 + 1) % poly1.length].y - poly1[i1].y
            };
            v.cur_ints = [];
            
            // Check which lines the current line intersects
            for(var i2 = 0; i2 < poly2.length; i2++) {
                
                // Create reference arrays so we can easily find already calculated intersection points later on
                if(v.poly2_ipoints.length <= i2) v.poly2_ipoints[i2] = [];
                
                // Check for intersection
                v.cur_int = this.getLineIntersection(
                    poly1[i1],
                    poly1[(i1 + 1) % poly1.length],
                    poly2[i2],
                    poly2[(i2 + 1) % poly2.length]
                );
                if(v.cur_int) {
                    
                    // We need the intersection point relative to current line start so we can calculate distance
                    v.rel_int = {
                        'x': v.cur_int.x - poly1[i1].x,
                        'y': v.cur_int.y - poly1[i1].y
                    };
                    v.cur_ints.push({
                        'x': v.cur_int.x,
                        'y': v.cur_int.y,
                        'dist': v.cur_ray.x * v.rel_int.x + v.cur_ray.y * v.rel_int.y,
                        'i2': i2
                    });
                }
            }
            
            // Sort the intersection points by dinstance from line start
            for(var i = 0; i < v.cur_ints.length - 1; i++) for(var u = i + 1; u < v.cur_ints.length; u++) {
                if(v.cur_ints[i].dist > v.cur_ints[u].dist) {
                    v.tmp_values = [v.cur_ints[i].x, v.cur_ints[i].y, v.cur_ints[i].dist, v.cur_ints[i].i2];
                    v.cur_ints[i].x = v.cur_ints[u].x;
                    v.cur_ints[i].y = v.cur_ints[u].y;
                    v.cur_ints[i].dist = v.cur_ints[u].dist;
                    v.cur_ints[i].i2 = v.cur_ints[u].i2;
                    v.cur_ints[u].x = v.tmp_values[0];
                    v.cur_ints[u].y = v.tmp_values[1];
                    v.cur_ints[u].dist = v.tmp_values[2];
                    v.cur_ints[u].i2 = v.tmp_values[3];
                }
            }
            
            // Add the sorted intersections to list
            for(var i = 0; i < v.cur_ints.length; i++) {
                v.cur_ints[i].out = v.cur_outside;
                v.cur_ints[i].i1 = i1;
                v.poly1_ints.push(v.cur_ints[i]);
                
                // For every intersection we alternate if we're on the inside or the outside
                v.cur_outside = (v.cur_outside ? false : true);
                
                // Add reference for the poly2 loop
                v.poly2_ipoints[v.cur_ints[i].i2].push(v.poly1_ints.length - 1);
            }
        }
        
        // Search for intersections on poly2
        v.poly2_ints = [];
        for(var i2 = 0; i2 < poly2.length; i2++) {
            v.poly2_ints.push({'x': poly2[i2].x, 'y': poly2[i2].y, 'i1': -1, 'i2': i2});
            
            // Get direction indicator for line so we can check in what order the intersections happen
            v.cur_ray = {
                'x': poly2[(i2 + 1) % poly2.length].x - poly2[i2].x,
                'y': poly2[(i2 + 1) % poly2.length].y - poly2[i2].y
            };
            v.cur_ints = [];
            
            // Check which lines the current line intersects
            for(var ii = 0; ii < v.poly2_ipoints[i2].length; ii++) {
                v.cur_int = v.poly1_ints[v.poly2_ipoints[i2][ii]];
                
                // We need the intersection point relative to current line start so we can calculate distance
                v.rel_int = {
                    'x': v.cur_int.x - poly2[i2].x,
                    'y': v.cur_int.y - poly2[i2].y
                };
                v.cur_ints.push({
                    'x': v.cur_int.x,
                    'y': v.cur_int.y,
                    'dist': v.cur_ray.x * v.rel_int.x + v.cur_ray.y * v.rel_int.y,
                    'i1': v.cur_int.i1
                });
            }
            
            // Sort the intersection points by dinstance from line start
            for(var i = 0; i < v.cur_ints.length - 1; i++) for(var u = i + 1; u < v.cur_ints.length; u++) {
                if(v.cur_ints[i].dist > v.cur_ints[u].dist) {
                    v.tmp_values = [v.cur_ints[i].x, v.cur_ints[i].y, v.cur_ints[i].dist, v.cur_ints[i].i1];
                    v.cur_ints[i].x = v.cur_ints[u].x;
                    v.cur_ints[i].y = v.cur_ints[u].y;
                    v.cur_ints[i].dist = v.cur_ints[u].dist;
                    v.cur_ints[i].i1 = v.cur_ints[u].i1;
                    v.cur_ints[u].x = v.tmp_values[0];
                    v.cur_ints[u].y = v.tmp_values[1];
                    v.cur_ints[u].dist = v.tmp_values[2];
                    v.cur_ints[u].i1 = v.tmp_values[3];
                }
            }
            
            // Add the sorted intersections to list
            for(var i = 0; i < v.cur_ints.length; i++) {
                v.cur_ints[i].i2 = i2;
                v.poly2_ints.push(v.cur_ints[i]);
            }
        }
        
//         // Merge the polygons
//         v.merged = [];
//         for(var i = 0; i < 1000; i++) {
//             v.merged.push(v.poly1_ints[i]
//         }
        
        // Done, return results
        return v;
    }
}
