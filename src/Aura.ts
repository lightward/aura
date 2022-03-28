import * as twgl from 'twgl.js';
import {FullScreenQuad} from './Geometry';
import {CreateGradientTexture2} from './Gradient';
import PingPongBuffer from './PingPongBuffer';
import FragAura from './shaders/FragAura';
import FragComp from './shaders/FragComp';
import {FragBlur} from './shaders/include/FragBlur';
import VertDefault from './shaders/VertDefault';

export default class Aura {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;

  started: boolean;
  startTime?: DOMHighResTimeStamp;
  prevTimestamp?: DOMHighResTimeStamp;
  animTime: number;
  seed: number;
  frameCount: number;
  playing: boolean;

  ppb: PingPongBuffer;
  ramp: WebGLTexture;

  targetTexWidth: number;
  targetTexHeight: number;

  setParams = (params) => {
    // Merge defaults with supplied parameters

    this.layer1Params = {
      ...this.layer1Params,
      ...params.layer1,
    };

    this.globalParams = {
      ...this.globalParams,
      ...params.globalParams,
    };

    this.layer2Params = {
      ...this.layer2Params,
      ...params.layer2,
    };

    this.feedbackSettings = {
      ...this.feedbackSettings,
      ...params.feedbackSettings,
    };

    this.blurSettings = {
      ...this.blurSettings,
      ...params.blurSettings,
    };

    this.animTime = this.globalParams.animTime;
  };

  createShadersAndBuffers = () => {
    const {gl} = this;

    this.programAura =
      this.programAura ??
      twgl.createProgramInfo(this.gl, [VertDefault, FragAura]);
    this.programFinal =
      this.programFinal ??
      twgl.createProgramInfo(this.gl, [VertDefault, FragComp]);
    this.programBlur =
      this.programBlur ??
      twgl.createProgramInfo(this.gl, [VertDefault, FragBlur]);
    this.bufferInfo =
      this.bufferInfo ?? twgl.createBuffersFromArrays(gl, FullScreenQuad);
  };

  renderLoop = (now: DOMHighResTimeStamp) => {
    requestAnimationFrame(this.renderLoop);
    this.render(now);
  };

  render = (now: DOMHighResTimeStamp) => {
    const {gl, ppb, globalParams, ramp, programAura, programFinal, bufferInfo} =
      this;

    if (programAura == null || programFinal == null) return;

    if (this.playing) {
      const deltaTime = now - this.prevTimestamp;

      if (deltaTime <= this.fixedDeltaTime) {
        return;
      }

      this.animTime += deltaTime * this.globalParams.speed;
      this.prevTimestamp = now - (deltaTime % this.fixedDeltaTime);

      const sinceStart = now - this.startTime;
      this.currFps =
        Math.round((1000 / (sinceStart / ++this.frameCount)) * 100) / 100;
    }

    const time = this.animTime * 0.001;

    twgl.resizeCanvasToDisplaySize(this.gl.canvas);
    const auraUniforms = {
      time: [time, time / 2, time * 2, time * 10],
      resolution: [this.targetTexWidth, this.targetTexHeight],
      ramp: this.ramp,
      layer1: this.layer1Params,
      layer2: this.layer2Params,
      feedback: this.feedbackSettings,
      noiseDither: this.globalParams.noise,
      backBufferTex: this.ppb.lastTexture(),
      seed: this.seed,
    };

    // Render new Aura frame
    ppb.bind();

    gl.useProgram(programAura.program);

    twgl.setBuffersAndAttributes(gl, programAura, bufferInfo);
    twgl.setUniforms(programAura, auraUniforms);
    twgl.drawBufferInfo(gl, bufferInfo);

    // Swap buffers
    ppb.swap();

    // Blur stages
    const iterations = this.blurSettings.iterations;
    for (let i = 0; i < iterations; i++) {
      // var radius = (iterations - i - 1)
      const radius = this.blurSettings.radius;
      const dir = i % 2 === 0 ? [radius, 0] : [0, radius];

      const blurUniforms = {
        resolution: [this.targetTexWidth, this.targetTexHeight],
        iChannel0: ppb.lastTexture(),
        direction: dir,
      };

      ppb.bind();

      gl.useProgram(this.programBlur.program);
      twgl.setBuffersAndAttributes(gl, this.programBlur, bufferInfo);
      twgl.setUniforms(this.programBlur, blurUniforms);
      twgl.drawBufferInfo(gl, bufferInfo);

      ppb.swap();
    }

    // Render to screen

    const compUniforms = {
      resolution: [gl.canvas.width, gl.canvas.height],
      backBuffer: ppb.lastTexture(),
      noiseDither: globalParams.noise,
      ramp,
      contrast: globalParams.contrast,
      saturation: globalParams.saturation,
      value: globalParams.value,
      displayGradient: globalParams.displayGradient,
    };

    // Set dst buffer back to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(programFinal.program);
    twgl.setBuffersAndAttributes(gl, programFinal, bufferInfo);
    twgl.setUniforms(programFinal, compUniforms);
    twgl.drawBufferInfo(gl, bufferInfo);

    ppb.swap();
  };

  start = (play = true) => {
    if (this.started) return;

    this.started = true;
    if (play) this.play();
    this.renderLoop(window.performance.now());
  };

  play = () => {
    this.startTime = this.prevTimestamp = window.performance.now();
    this.playing = true;
  };

  pause = () => {
    this.playing = false;
  };

  constructor(gl: WebGL2RenderingContext, params = {}) {
    this.started = false;

    this.setParams(params);

    this.colors = params.colors || defaults.colors;

    this.gl = gl;
    this.canvas = this.gl.canvas;
    this.width = params.width || this.canvas.width;
    this.height = params.height || this.canvas.height;

    const ratio = this.width / this.height;

    if (ratio > 1) {
      this.targetTexWidth = 256;
      this.targetTexHeight = this.targetTexWidth * ratio;
    } else {
      this.targetTexHeight = 256;
      this.targetTexWidth = this.targetTexHeight * ratio;
    }

    this.playing = false;
    this.fixedDeltaTime = 1000 / this.globalParams.targetFps;
    this.animTime = params.animTime || 0;
    this.seed = params.seed || 0;
    this.frameCount = 0;

    this.createShadersAndBuffers();
    this.ramp = CreateGradientTexture2(gl, {
      colors: this.colors,
      resolution: 256,
    });
    this.ppb = new PingPongBuffer(gl, {
      width: this.targetTexWidth,
      height: this.targetTexHeight,
    });
  }
}
