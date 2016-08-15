/**
 * World stuff goes here
 * 
 * Or whatever I should call it.
 */
function world(canvas_id, width, height) {
    this.canvas_id = canvas_id;
    this.canvas = document.getElementById(canvas_id);
    this.c = this.canvas.getContext("2d");
    this.canvas.width = width;
    this.canvas.height = height;
}
