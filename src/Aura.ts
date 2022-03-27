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

  animTime: number;
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

  render = (time: DOMHighResTimeStamp) => {
    requestAnimationFrame(this.render);
    this.createShadersAndBuffers();

    const {gl, ppb, globalParams, ramp, programAura, programFinal, bufferInfo} =
      this;

    if (programAura == null || programFinal == null) return;

    const now = time;
    const deltaTime = now - this.prevTimestamp;

    if (deltaTime > this.fixedDeltaTime) {
      if (this.playing) this.animTime += deltaTime * this.globalParams.speed;

      this.globalParams.time = this.animTime * 0.001;
      this.prevTimestamp = now - (deltaTime % this.fixedDeltaTime);

      const sinceStart = now - this.startTime;
      this.currFps =
        Math.round((1000 / (sinceStart / ++this.frameCount)) * 100) / 100;

      twgl.resizeCanvasToDisplaySize(this.gl.canvas);
      const auraUniforms = {
        time: [
          this.globalParams.time,
          this.globalParams.time / 2,
          this.globalParams.time * 2,
          this.globalParams.time * 10,
        ],
        resolution: [this.targetTexWidth, this.targetTexHeight],
        ramp: this.ramp,
        layer1: this.layer1Params,
        layer2: this.layer2Params,
        feedback: this.feedbackSettings,
        noiseDither: this.globalParams.noise,
        backBufferTex: this.ppb.lastTexture(),
        seed: this.globalParams.seed,
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
      {
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
      }
    }
  };

  start = (play = true) => {
    if (this.started) return;

    this.started = true;
    this.prevTimestamp = window.performance.now();
    this.startTime = this.prevTimestamp;
    if (play) this.playing = true;
    this.render();
  };

  setSeed = (seed) => {
    this.setParams({
      globalParams: {
        seed,
      },
    });
  };

  play = () => {
    this.playing = true;
  };

  pause = () => {
    this.playing = false;
  };

  constructor(gl: WebGL2RenderingContext, params = {}) {
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
    this.animTime = params.globalParams.animTime || 0;
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
