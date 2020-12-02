/** @param canvas {HTMLCanvasElement} */
function resize(canvas) {
    // Lookup the size the browser is displaying the canvas.
    var displayWidth  = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;
   
    // Check if the canvas is not the same size.
    if (canvas.width  != displayWidth ||
        canvas.height != displayHeight) {
   
      // Make the canvas the same size
      canvas.width  = displayWidth;
      canvas.height = displayHeight;
    }
}

//transform gl positions to clip space
const vertShader = `
    attribute vec2 a_position;
    uniform vec2 u_resolution;

    void main() {
        //convert the position from pixels to 0.0 to 1.0
        vec2 zeroToOne = a_position / u_resolution;

        //convert from 0->1 to 0->2
        vec2 zeroToTwo = zeroToOne * 2.0;

        //convert from 0->2 to -1->1 (clip space)
        vec2 clipSpace = zeroToTwo - 1.0;

        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    } 
`;

//compute colour of each pixel. Here: Reddish colour.
const fragShader = `
    precision mediump float;

    uniform vec4 u_color;

    void main(void) {
        gl_FragColor = u_color;
    } 
`;

/** @param gl {WebGLRenderingContext} */
function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
   
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

/** @param gl {WebGLRenderingContext} */
function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);

    if (success) {
        return program;
      }
     
      console.log(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
}

function main() {
    /** @type HTMLCanvasElement */
    var canvas = document.querySelector("#glCanvas");
    var gl = canvas.getContext("webgl");
    
    //compilation of shaders
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertShader);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragShader);
    
    //link shaders to program, s.t. both shaders used
    var program = createProgram(gl, vertexShader, fragmentShader);

    //a_position is the attribute of the vertex shader, get addr. of attribute
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    var colorUniformLocation = gl.getUniformLocation(program, "u_color");

    //Attributes get their data from buffers
    var positionBuffer = gl.createBuffer();

    //bind positionbuffer to globally available ARRAY_BUFFER bindpoint
    //bindpoint is a globally known pointer
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

/*  DISPLAY ONLY ONE RECTANGLE ON TOP RIGHT
    // three 2d points, js array
    var positions = [
        10, 20,
        80, 20,
        10, 30,
        10, 30,
        80, 20,
        80, 30,
    ];
    //now buffer can be referenced via ARRAY_BUFFER.
    //put data into buffer. Static draw --> hint for usage (contents don't change)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
*/
    //resize canvas to screen size
    resize(gl.canvas);

    //tell gl how to translate back to screen coordinates
    gl.viewport(0,0, gl.canvas.width, gl.canvas.height);

    //clear the canvas
    gl.clearColor(100,100,100,100);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //attributes are assigned after program is assigned
    gl.useProgram(program);

    //turn this attribute which is used by shader on
    gl.enableVertexAttribArray(positionAttributeLocation);

    //set uniform resolution
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    //Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;
    var type = gl.FLOAT;
    normalize = false;
    var stride = 0;
    var offset = 0;
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

    var w = canvas.width;
    var v = canvas.height;

    for (var i = 0; i < 100; ++i) {
        // Setup a random rectangle
        // This will write to positionBuffer because
        // its the last thing we bound on the ARRAY_BUFFER
        // bind point
        m = Math.min(w,v);
        var width = randomInt(m/4);
        var height = randomInt(m/4);

        setRectangle(
            gl, randomInt(w-width), randomInt(v-height), width, height);

        gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}

// Returns a random integer from 0 to range - 1.
function randomInt(range) {
    return Math.floor(Math.random() * range);
  }

function setRectangle(gl, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
 
  // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
  // whatever buffer is bound to the `ARRAY_BUFFER` bind point
  // but so far we only have one buffer. If we had more than one
  // buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.
 
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2]), gl.STATIC_DRAW);
}

main();