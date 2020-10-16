"use strict";

main();

function main() {
    const [gl, shaders] = initializeWebGL();

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const buffers = initBuffers(gl);

    // Draw the scene
    drawScene(gl, shaders, buffers);
}

class Particle {
    constructor() {
    }
}

function initBuffers(gl) {
    const positions = [
        1.0,  1.0,
        -1.0,  1.0,
        1.0, -1.0,
        -1.0, -1.0,
    ];
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    var colors = [
        0.0,  1.0,  1.0,  1.0,
        1.0,  0.0,  0.0,  1.0,
        0.0,  1.0,  0.0,  1.0,
        0.0,  0.0,  1.0,  1.0,
    ];
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        color: colorBuffer,
    };
}

function drawScene(gl, programInfo, buffers) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    var size = 2;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition,
        size, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    var size = 4;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexColor,
        size, type, normalize, stride, offset);
    gl.enableVertexAttribArray( programInfo.attribLocations.vertexColor);

    gl.useProgram(programInfo.program);

    var offset = 0;
    var vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
}
