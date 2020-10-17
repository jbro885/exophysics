"use strict";

main();

function main() {
    const [gl, shaders] = initializeWebGL();
    const buffers = initBuffers(gl);
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

    var transformBuffer = gl.createBuffer();
    var emptyDataArray = new Float32Array(999);

    const tf = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);

    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, transformBuffer);
    gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, emptyDataArray, gl.STATIC_READ);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, transformBuffer);
    gl.beginTransformFeedback(gl.TRIANGLES);

    var offset = 0;
    var vertexCount = 4;
    gl.drawArrays(gl.TRIANGLES, offset, vertexCount);

    var count = 0;
    gl.endTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

    const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    console.log('waiting...');
    setTimeout(waitForResult);
    function waitForResult() {
        const status = gl.clientWaitSync(fence, 0, 0);
        if (status === gl.CONDITION_SATISFIED || status === gl.ALREADY_SIGNALED) {
            gl.deleteSync(fence);
            const output = new Float32Array(vertexCount);
            gl.bindBuffer(gl.ARRAY_BUFFER, transformBuffer);
            gl.getBufferSubData(gl.ARRAY_BUFFER, 0, output);
            console.log(output);
        } else {
            setTimeout(waitForResult);
        }
    }
}
