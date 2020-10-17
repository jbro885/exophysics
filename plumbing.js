"use strict";

function initializeWebGL() {
    const canvas = document.querySelector('#canvas');
    const gl = canvas.getContext('webgl2');

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    const vertexShaderSource = document.getElementById("vertex-shader").text
    const fragmentShaderSource = document.getElementById("fragment-shader").text
    const shaderProgram = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    // Collect all the info needed to use the shader program.
    // Look up which attributes our shader program is using
    // for aVertexPosition, aVevrtexColor and also
    // look up uniform locations.
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexVelocity: gl.getAttribLocation(shaderProgram, 'aVertexVelocity'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            allPositions: gl.getUniformLocation(shaderProgram, 'allPositions'),
        },
    };
    return [gl, programInfo];
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource.trim());
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource.trim());
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.transformFeedbackVaryings(shaderProgram, ['newPos', 'newV'], gl.SEPARATE_ATTRIBS);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
}
