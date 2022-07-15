import seedrandom from 'seedrandom';
import * as twgl from 'twgl.js';
import {FullScreenQuad} from './Geometry';
import {CreateGradientTexture2} from './Gradient';
import PingPongBuffer from './PingPongBuffer';
import FragAura from './shaders/FragAura';
import FragComp from './shaders/FragComp';
import {FragBlur} from './shaders/include/FragBlur';
import VertDefault from './shaders/VertDefault';

export type AuraColor = [r: number, g: number, b: number];

export interface AuraParams {
  width: number;
  height: number;
  animTime: number;
  seed: number;
  colors: AuraColor[];

  globalParams: {
    contrast: number;
    displayGradient: boolean;
    feedback: number;
    noise: number;
    saturation: number;
    speed: number;
    targetFps: number;
    value: number;
  };
  layer1Params: {
    blobbyness: number;
    blur: number;
    brightness: number;
    enabled: boolean;
  };
  layer2Params: {
    blur: number;
    brightness: number;
    cycleSpeed: number;
    enabled: boolean;
  };
  feedbackSettings: {
    amount: number;
    centerX: number;
    centerY: number;
    dist: number;
    scaleX: number;
    scaleY: number;
  };
  blurSettings: {
    iterations: number;
    radius: number;
  };
}

export default class Aura {
  rng: seedrandom.PRNG;
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;

  width: AuraParams['width'];
  height: AuraParams['height'];
  animTime: AuraParams['animTime'];
  seed: AuraParams['seed'];
  colors: AuraParams['colors'];
  globalParams: AuraParams['globalParams'];
  layer1Params: AuraParams['layer1Params'];
  layer2Params: AuraParams['layer2Params'];
  feedbackSettings: AuraParams['feedbackSettings'];
  blurSettings: AuraParams['blurSettings'];

  started: boolean;
  fixedDeltaTime: number;
  startTime: DOMHighResTimeStamp;
  prevTimestamp: DOMHighResTimeStamp;
  frameCount: number;
  playing: boolean;
  currFps?: number;

  ppb: PingPongBuffer;
  ramp: WebGLTexture | null;

  targetTexWidth: number;
  targetTexHeight: number;

  programAura: twgl.ProgramInfo;
  programFinal: twgl.ProgramInfo;
  programBlur: twgl.ProgramInfo;
  bufferInfo: twgl.BufferInfo;

  constructor(
    gl: WebGL2RenderingContext,
    {
      animTime,
      seed,
      colors,
      layer1Params,
      globalParams,
      layer2Params,
      feedbackSettings,
      blurSettings,
      width,
      height,
    }: AuraParams,
  ) {
    this.rng = seedrandom(`${seed}`);
    this.started = false;

    this.globalParams = globalParams;
    this.layer1Params = layer1Params;
    this.layer2Params = layer2Params;
    this.feedbackSettings = feedbackSettings;
    this.blurSettings = blurSettings;

    this.animTime = animTime;
    this.colors = colors;

    this.gl = gl;
    this.canvas = this.gl.canvas;
    this.width = width;
    this.height = height;

    this.canvas.width = width;
    this.canvas.height = height;

    this.startTime = this.prevTimestamp = window.performance.now();

    this.targetTexWidth = 256;
    this.targetTexHeight = 256;

    this.playing = false;
    this.fixedDeltaTime = 1000 / globalParams.targetFps;
    this.seed = seed;
    this.frameCount = 0;

    this.programAura = twgl.createProgramInfo(this.gl, [VertDefault, FragAura]);
    this.programFinal = twgl.createProgramInfo(this.gl, [
      VertDefault,
      FragComp,
    ]);
    this.programBlur = twgl.createProgramInfo(this.gl, [VertDefault, FragBlur]);
    this.bufferInfo = twgl.createBufferInfoFromArrays(gl, FullScreenQuad);

    const shuffledColors: AuraParams['colors'] = [];
    const unshuffledColors = [...this.colors];

    // purposefully leaving one color out
    while (unshuffledColors.length > 0) {
      shuffledColors.push(
        unshuffledColors.splice(
          Math.floor(this.rng() * unshuffledColors.length),
          1,
        )[0],
      );
    }

    this.ramp = CreateGradientTexture2(gl, {
      colors: shuffledColors,
      resolution: 256,
    });

    this.ppb = new PingPongBuffer(gl, {
      width: this.targetTexWidth,
      height: this.targetTexHeight,
    });
  }

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

    const maxDimension = Math.max(gl.canvas.width, gl.canvas.height);

    const compUniforms = {
      resolution: [maxDimension, maxDimension],
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

  shutdown = () => {
    this.playing = false;

    requestAnimationFrame(() => {
      this.gl.deleteProgram(this.programAura.program);
      this.gl.deleteProgram(this.programFinal.program);
      this.gl.deleteProgram(this.programBlur.program);
    });
  };
}
