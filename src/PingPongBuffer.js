const initTexture = (gl, params) => {
    const width = params.width ?? 256;
    const height = params.height ?? 256;

    let tex = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    return tex;
}

const initFrameBuffer = (gl, texture) => {
    const fbo = gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    return fbo;
}

var toType = function (obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

export default class PingPongBuffer {
    constructor(gl, params) {
        this.width = params.width = params.width ?? 256;
        this.height = params.height = params.height ?? 256;

        this.texture1 = initTexture(gl, params);
        this.texture2 = initTexture(gl, params);

        this.fb1 = initFrameBuffer(gl, this.texture1);
        this.fb2 = initFrameBuffer(gl, this.texture2);

        this.swp = false;
        this.gl = gl;
    }

    currentTexture = () => this.swp ? this.texture2 : this.texture1;
    lastTexture = () => this.swp ? this.texture1 : this.texture2;

    currentFramebuffer = () => this.swp ? this.fb2 : this.fb1;

    swap = () => this.swp = !this.swp;

    bind = () => {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.currentFramebuffer());
        this.gl.viewport(0, 0, this.width, this.height);
    }
}