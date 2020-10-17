"use strict";

main();

function main() {
    const [gl, shaders] = initializeWebGL();
    var options = {
        particleLimit: 50,
    };
    const buffers = initBuffers(gl, options);
    drawScene(gl, shaders, buffers, options);
}

function initBuffers(gl, options) {
    const positions = [...Array(options.particleLimit * 2)].map(_=>Math.random() * 2 - 1);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);

    const velocities = [...Array(options.particleLimit * 2)].map(_=>(Math.random() * 2 - 1) * 0.005);
    const velocityBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(velocities), gl.DYNAMIC_DRAW);

    var indices = [];
    var i;
    for (i = 0; i < options.particleLimit; i++) {
        indices[i] = i;
    }
    const myIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, myIndexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Int32Array(indices), gl.STATIC_DRAW);

    var newPosBuffer = gl.createBuffer();
    var newVBuffer = gl.createBuffer();

    return {
        position: positionBuffer,
        velocities: velocityBuffer,
        newPos: newPosBuffer,
        newV: newVBuffer,
        indices: myIndexBuffer,
    };
}

function drawScene(gl, programInfo, buffers, options) {
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

    // TODO: pass all positions on first frame too.

    var size = 2;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.velocities);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexVelocity,
        size, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexVelocity);

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

    nextFrame(gl, programInfo, buffers, options);
}

function nextFrame(gl, programInfo, buffers, options) {
    var emptyDataArray = new Float32Array(options.particleLimit * 2);
    var emptyDataArray2 = new Float32Array(options.particleLimit * 2);

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
    var vertexCount = options.particleLimit;
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

            gl.uniform2fv(programInfo.uniformLocations.allPositions, output);

            //----
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.newV);
            gl.getBufferSubData(gl.ARRAY_BUFFER, 0, output);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.velocities);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(output), gl.DYNAMIC_DRAW);

            gl.vertexAttribPointer(programInfo.attribLocations.vertexVelocity,
                size, type, normalize, stride, offset);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexVelocity);

            nextFrame(gl, programInfo, buffers, options);
        } else {
            setTimeout(waitForResult);
        }
    }
}
