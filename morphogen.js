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
        0.7,  0.4,
        -0.2,  0.6,
        0.3, -0.3,
        -0.5, -0.9,
    ];
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);

    const velocities = [
        -0.001,  0.0005,
        0.001,  0.0008,
        0.0003, -0.0003,
        0.0005, 0.0012,
    ];
    const velocityBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(velocities), gl.DYNAMIC_DRAW);

    var colors = [
        0.0,  1.0,  1.0,  1.0,
        1.0,  0.0,  0.0,  1.0,
        0.0,  1.0,  0.0,  1.0,
        0.0,  0.0,  1.0,  1.0,
    ];
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    var indices = [0, 1, 2, 3];
    const myIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, myIndexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Int32Array(indices), gl.STATIC_DRAW);

    var newPosBuffer = gl.createBuffer();
    var newVBuffer = gl.createBuffer();

    return {
        position: positionBuffer,
        velocities: velocityBuffer,
        color: colorBuffer,
        newPos: newPosBuffer,
        newV: newVBuffer,
        indices: myIndexBuffer,
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
    gl.vertexAttribPointer(programInfo.uniformLocations.allPositions,
        size, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.uniformLocations.allPositions);

    var size = 2;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.velocities);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexVelocity,
        size, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexVelocity);

    var size = 4;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexColor,
        size, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);

    var size = 1;
    var type = gl.INT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.indices);
    gl.vertexAttribIPointer(programInfo.attribLocations.myIndex,
        size, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.myIndex);

    gl.useProgram(programInfo.program);

    nextFrame(gl, programInfo, buffers);
}

function nextFrame(gl, programInfo, buffers) {
    var emptyDataArray = new Float32Array(999);
    var emptyDataArray2 = new Float32Array(999);

    const tf = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);

    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, buffers.newPos);
    gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, emptyDataArray, gl.STATIC_READ);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffers.newPos);

    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, buffers.newV);
    gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, emptyDataArray2, gl.STATIC_READ);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, buffers.newV);

    gl.beginTransformFeedback(gl.POINTS);

    var offset = 0;
    var vertexCount = 4;
    gl.drawArrays(gl.POINTS, offset, vertexCount);

    var count = 0;
    gl.endTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

    const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    setTimeout(waitForResult);
    function waitForResult() {
        const status = gl.clientWaitSync(fence, 0, 0);
        if (status === gl.CONDITION_SATISFIED || status === gl.ALREADY_SIGNALED) {
            gl.deleteSync(fence);
            const output = new Float32Array(vertexCount * 2);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.newPos);
            gl.getBufferSubData(gl.ARRAY_BUFFER, 0, output);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(output), gl.DYNAMIC_DRAW);

            var size = 2;
            var type = gl.FLOAT;
            var normalize = false;
            var stride = 0;
            var offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

            gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition,
                size, type, normalize, stride, offset);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

            gl.vertexAttribPointer(programInfo.uniformLocations.allPositions,
                size, type, normalize, stride, offset);
            gl.enableVertexAttribArray(programInfo.uniformLocations.allPositions);

            //----
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.newV);
            gl.getBufferSubData(gl.ARRAY_BUFFER, 0, output);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.velocities);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(output), gl.DYNAMIC_DRAW);

            gl.vertexAttribPointer(programInfo.attribLocations.vertexVelocity,
                size, type, normalize, stride, offset);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexVelocity);

            nextFrame(gl, programInfo, buffers);
        } else {
            setTimeout(waitForResult);
        }
    }
}
