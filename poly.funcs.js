/**
 * Collection of useful functions for polygon processing
 */
var poly_funcs = {
    
    /**
     * Generate bounding box
     */
    'getBoundingBox': function(vertices) {
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
    },
    
    /**
     * Calculate where two lines cross
     */
    'getLineIntersection': function(line1a, line1b, line2a, line2b) {
        
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
    },
    
    /**
     * Polygin intersection calculations
     */
    'getPolyIntersections': function(poly1, poly2) {
        poly_funcs.v = {};
        var v = poly_funcs.v;
        
        // Check if bounding boxes intersect
        v.bbox1 = poly_funcs.getBoundingBox(poly1);
        v.bbox2 = poly_funcs.getBoundingBox(poly2);
        if(v.bbox1.min.x > v.bbox2.max.x) return v;
        if(v.bbox1.min.y > v.bbox2.max.y) return v;
        if(v.bbox1.max.x < v.bbox2.min.x) return v;
        if(v.bbox1.max.y < v.bbox2.min.y) return v;
        v.bbox_test = true;
        
        // Check if starting point of poly1 is outside or inside poly2
        v.start_outside = true;
        v.outside_point = {'x': Math.min(v.bbox1.min.x, v.bbox2.min.x) - 100, 'y': 0};
        for(var i2 = 0; i2 < poly2.length; i2++) {
            if(poly_funcs.getLineIntersection(v.outside_point, poly1[0], poly2[i2], poly2[(i2 + 1) % poly2.length])) {
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
                v.cur_int = poly_funcs.getLineIntersection(
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
        
        // Done, return results
        return v;
    },
    
    /**
     * Cut a polygon by another
     */
    'cutPoly': function(poly1, poly2) {
        var v = poly_funcs.getPolyIntersections(poly1, poly2);
        
        // Cut poly1 by poly2
        v.polyi = -1;
        v.poly = [];
        v.i1 = 0;
        v.i2 = 0;
        v.path = 1;
        v.start = 0;
        v.poly_start = 0;
        v.first_intersection = 0;
        v.next = 0;
        v.debug = "";
        
        // Starting outside poly2, set position for first polygon
        if(v.start_outside) v.polyi = 0;
        
        // Starting inside poly2, find the next outside position
        else for(var i = 0; i < v.poly1_ints.length - 1; i++) if(v.poly1_ints[i].i2 > -1) {
            
            // Set the start position so we know when we're done
            v.i1 = i;
            v.polyi = 1;
            v.start = i;
            v.poly_start = i;
            v.next = i;
            break;
        
        // Mark the inside polygons as used
        } else v.poly1_ints[i].used = true;
        
        // Start tracing
        v.debug += "Tracing starts at " + v.i1;
        if(v.polyi > -1) for(var i = 0; i < 10000; i++) {
            
            // Create the new polygon if it doesn't exist
            while(v.poly.length <= v.polyi) v.poly.push([]);
            switch(v.path) {
                
                // Look for next path to trace
                case 0:
                    for(var u = v.first_intersection + 1; u < v.poly1_ints.length - 1; u++) {
                        
                        // Found the next unused intersection
                        if(v.poly1_ints[u].i2 > -1 && !v.poly1_ints[u].used) {
                            v.first_intersection = 0;
                            v.i1 = u;
                            v.debug += "\nTracing starts at " + v.i1;
                            v.polyi++;
                            v.poly_start = v.i1;
                            v.path = 1;
                            break;
                            
                        // Mark the inside polygons as used
                        } else v.poly1_ints[u].used = true;
                    }
                    
                    // No unused intersections, that means we're done
                    if(v.path == 0) {
                        v.debug += "\nTracing complete";
                        i = 10000;
                    }
                    break;
                
                // Tracing poly1
                case 1:
                    
                    // Add this vertex to list
                    v.debug += "\nAdding poly1:" + v.i1;
                    v.poly[v.polyi].push({
                        'x': v.poly1_ints[v.i1].x,
                        'y': v.poly1_ints[v.i1].y
                    });
                    v.poly1_ints[v.i1].used = true;
                    
                    // Move on to next vertex
                    v.i1 = (v.i1 + 1) % v.poly1_ints.length;
                    
                    // Polygon is finished when we reach its start
                    if(v.i1 == v.poly_start) {
                        v.debug += "\nPolygon complete";
                        v.path = 0;
                    
                    // Found an intersection, start tracing poly2
                    } else if(v.poly1_ints[v.i1].i2 > -1) {
                        if(!v.first_intersection) v.first_intersection = v.i1;
                        v.path = 3; // Safety feature if intersection is broken (shouldn't be, but you know how it is)
                        
                        // Look where that intersection leads
                        for(var u = 0; u < v.poly2_ints.length; u++) if(v.poly2_ints[u].i1 == v.poly1_ints[v.i1].i1 && v.poly2_ints[u].i2 == v.poly1_ints[v.i1].i2) {
                            v.i2 = u;
                            v.path = 2;
                            v.debug += "\nIntersection at poly1:" + v.i1 + " leading to poly2:" + v.i2;
                            break;
                        }
                    }
                    break;
                
                // Tracing poly2
                case 2:
                    
                    // Add this vertex to list
                    v.debug += "\nAdding poly2:" + v.i2;
                    v.poly[v.polyi].push({
                        'x': v.poly2_ints[v.i2].x,
                        'y': v.poly2_ints[v.i2].y
                    });
                    
                    // Move on to next vertex
                    v.i2 = (v.i2 == 0 ? v.poly2_ints.length : v.i2) - 1;
                    
                    // Found an intersection, start tracing poly2
                    if(v.poly2_ints[v.i2].i1 > -1) {
                        v.path = 3; // Safety feature if intersection is broken (shouldn't be, but you know how it is)
                        
                        // Look where that intersection leads
                        for(var u = 0; u < v.poly1_ints.length; u++) if(v.poly1_ints[u].i1 == v.poly2_ints[v.i2].i1 && v.poly1_ints[u].i2 == v.poly2_ints[v.i2].i2) {
                            v.i1 = u;
                            v.path = 1;
                            v.debug += "\nIntersection at poly2:" + v.i2 + " leading to poly1:" + v.i1;
                            
                            // Polygon is finished when we reach its start
                            if(v.i1 == v.poly_start) {
                                v.debug += "\nPolygon complete";
                                v.path = 0;
                            }
                            break;
                        }
                    }
                    break;
            }
        }
        
        // Done, return results
        return v;
    },
    
    /**
     * Merge two polygons into one
     */
    'mergePoly': function(poly1, poly2) {
        var v = poly_funcs.getPolyIntersections(poly1, poly2);
        
        // Cut poly1 by poly2
        v.polyi = -1;
        v.poly = [];
        v.i1 = 0;
        v.i2 = 0;
        v.path = 1;
        v.start = 0;
        v.debug = "";
        
        // Starting outside poly2, set position for first polygon
        if(v.start_outside) v.polyi = 0;
        
        // Starting inside poly2, find the next outside position
        else for(var i = 0; i < v.poly1_ints.length - 1; i++) if(v.poly1_ints[i].i2 > -1) {
            
            // Set the start position so we know when we're done
            v.i1 = i;
            v.polyi = 0;
            v.start = i;
            break;
        }
        
        // If poly1 completely inside poly2, trace poly2 instead
        if(v.polyi < 0) {
            // TODO
        }
        
        // Start tracing
        v.debug += "Tracing starts at " + v.i1;
        if(v.polyi > -1) for(var i = 0; i < 10000; i++) {
            
            // Create the new polygon if it doesn't exist
            while(v.poly.length <= v.polyi) v.poly.push([]);
            switch(v.path) {
                
                // Tracing poly1
                case 1:
                    
                    // Add this vertex to list
                    v.debug += "\nAdding poly1:" + v.i1;
                    v.poly[v.polyi].push({
                        'x': v.poly1_ints[v.i1].x,
                        'y': v.poly1_ints[v.i1].y
                    });
                    v.poly1_ints[v.i1].used = true;
                    
                    // Move on to next vertex
                    v.i1 = (v.i1 + 1) % v.poly1_ints.length;
                    
                    // Polygon is finished when we reach its start
                    if(v.i1 == v.start) {
                        v.debug += "\nPolygon complete";
                        i = 10000;
                    
                    // Found an intersection, start tracing poly2
                    } else if(v.poly1_ints[v.i1].i2 > -1) {
                        if(!v.first_intersection) v.first_intersection = v.i1;
                        v.path = 3; // Safety feature if intersection is broken (shouldn't be, but you know how it is)
                        
                        // Look where that intersection leads
                        for(var u = 0; u < v.poly2_ints.length; u++) if(v.poly2_ints[u].i1 == v.poly1_ints[v.i1].i1 && v.poly2_ints[u].i2 == v.poly1_ints[v.i1].i2) {
                            v.i2 = u;
                            v.path = 2;
                            v.debug += "\nIntersection at poly1:" + v.i1 + " leading to poly2:" + v.i2;
                            break;
                        }
                    }
                    break;
                
                // Tracing poly2
                case 2:
                    
                    // Add this vertex to list
                    v.debug += "\nAdding poly2:" + v.i2;
                    v.poly[v.polyi].push({
                        'x': v.poly2_ints[v.i2].x,
                        'y': v.poly2_ints[v.i2].y
                    });
                    
                    // Move on to next vertex
                    v.i2 = (v.i2 + 1) % v.poly2_ints.length;
                    
                    // Found an intersection, start tracing poly2
                    if(v.poly2_ints[v.i2].i1 > -1) {
                        v.path = 3; // Safety feature if intersection is broken (shouldn't be, but you know how it is)
                        
                        // Look where that intersection leads
                        for(var u = 0; u < v.poly1_ints.length; u++) if(v.poly1_ints[u].i1 == v.poly2_ints[v.i2].i1 && v.poly1_ints[u].i2 == v.poly2_ints[v.i2].i2) {
                            v.i1 = u;
                            v.path = 1;
                            v.debug += "\nIntersection at poly2:" + v.i2 + " leading to poly1:" + v.i1;
                            
                            // Polygon is finished when we reach its start
                            if(v.i1 == v.start) {
                                v.debug += "\nPolygon complete";
                                i = 10000;
                            }
                            break;
                        }
                    }
                    break;
            }
        }
        
        // Done, return results
        return v;
    }
};