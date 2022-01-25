import color from 'colorjs.io';

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

    if (colors == null || colors.length == 0) {
        console.log("options.colors can't be null or empty")
        return null;
    }

    if (colors.length < 2) {
        // console.log(colors[0].coords.concat(1))
        return createTextureFromPixelArray(gl, { data: [colors[0].coords.concat(1).flat()] })
    }

    let from = colors[0]
    let to = colors[1]
    let gradData = from.steps(to, { space: 'lab', outputSpace: 'sRGB', steps: steps });

    for (let i = 2; i < colors.length; i++) {
        from = to;
        to = colors[i];
        gradData = gradData.concat(from.steps(to, { space: 'lab', outputSpace: 'sRGB', steps: steps }));
    }

    // Extract coordinates, add alpha
    gradData = gradData.map(e => e.coords.concat(1));

    let pixelData = gradData.flat();

    return createTextureFromPixelArray(gl, {width: gradData.length, height:1, data:pixelData});

    console.log(gradData);



}

export { createTextureFromPixelArray, CreateGradientTexture }