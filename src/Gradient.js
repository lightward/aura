import color from 'colorjs.io';
import * as twgl from 'twgl.js'
import { FullScreenQuad } from './Geometry';
import { FragGradientLab } from './shaders/Gradient';
import { VertDefault } from './shaders/Shaders';

let createTextureFromPixelArray = (gl, options) => {

    // return createSolidTexture(gl, 1, 0, 0)
    var texture = gl.createTexture();
    var texType = options.type ?? gl.RGB;
    var textureData = options.data;
    var width = options.width ?? 1;
    var height = options.height ?? 1;

    if (textureData == null) {
        console.log('Must supply texture data');
        return null
    }

    var dataTypedArray = new Float32Array(textureData);
    console.log(`Create Texture. Width: ${width}, Height: ${height} dataLength: ${dataTypedArray.length}`)

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, dataTypedArray);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);

    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
}

let CreateGradientTexture = (gl, options) => {
    let steps = options.steps ?? 16;
    let colors = options.colors;
    let space = options.space ?? 'sRGB';
    let outputSpace = options.outputSpace ?? 'sRGB'

    if (colors == null || colors.length == 0) {
        console.log("options.colors can't be null or empty")
        return null;
    }

    if (colors.length < 2) {
        return createTextureFromPixelArray(gl, { data: [colors[0].coords.concat(1).flat()] })
    }

    let from = colors[0]
    let to = colors[1]
    let gradData = from.steps(to, { space: space, outputSpace: outputSpace, steps: steps });

    for (let i = 2; i < colors.length; i++) {
        from = to;
        to = colors[i];
        gradData = gradData.concat(from.steps(to, { space: space, outputSpace: outputSpace, steps: steps }));
    }

    // Extract coordinates, add alpha
    gradData = gradData.map(e => e.coords.concat(1));

    let pixelData = gradData.flat();
    console.log(gradData);
    return createTextureFromPixelArray(gl, { width: gradData.length, height: 1, data: pixelData });

}

let CreateGradientTexture2 = (gl, options) => {
    let width = options.resolution ?? 256;
    let height = options.height ?? 256;
    let colors = options.colors ?? [[255, 0, 0], [0, 0, 255], [0, 255, 0]];
    if (!colors || colors.length < 2) {
        console.log("Need at least 2 colors to make a gradient");
        return null;
    }

    let gradShader = twgl.createProgramInfo(gl, [VertDefault, FragGradientLab]);
    let bufferInfo = twgl.createBufferInfoFromArrays(gl, FullScreenQuad);
    gl.viewport(0, 0, width, height);

    let gradTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, gradTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);

    let fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    let attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, gradTex, 0);

    gl.useProgram(gradShader.program);
    gl.clearColor(0, 0, 0, 1);
    
    twgl.setBuffersAndAttributes(gl, gradShader, bufferInfo);
    twgl.setUniforms(gradShader, { colors: colors.flat(), numColors: colors.length, resolution: [width, height] });
    twgl.drawBufferInfo(gl, bufferInfo);

    return gradTex;
}

export {  CreateGradientTexture, CreateGradientTexture2 }