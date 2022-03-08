import { CreateGradientTexture2 } from "./Gradient";
import PingPongBuffer from "./PingPongBuffer";
import * as twgl from 'twgl.js'
import VertDefault from "./shaders/VertDefault";
import FragAura from "./shaders/FragAura";
import { FullScreenQuad } from "./Geometry";
import FragComp from "./shaders/FragComp";
import { FragBlur } from "./shaders/include/FragBlur";

const defaults =
{
    globalParams:
    {
        time: 0.,
        speed: .21,
        seed: 100,
        noise: .003,
        targetFps: 60,
        saturation: 1,
        contrast: 1,
        value: 1
    },
    layer1:
    {
        brightness: .87,
        blobbyness: 1.2,
        blur: 1.47,
        enabled: true

    },
    layer2:
    {
        brightness: 1,
        enabled: true,
        cycleSpeed: .2
    },
    colors: [
        [0, 0, 0],
        [32, 70, 95],
        [48, 64, 92],
        [111, 200, 111],
        [220, 91, 172],
        [253, 205, 0],
    ],
    feedbackSettings:
    {
        amount: .4,
        scaleX: 1.01,
        scaleY: 1.01,
        centerX: 0.5,
        centerY: 0.5,
        dist: .05
    },
    blurSettings:
    {
        iterations: 8,
        radius: 1
    }
}

const targetTexWidth = 256;
const targetTexHeight = 256;

let fullscreenStyle = `position: fixed;    width: 100vw;    height: 100vh;    z-index: 0;`;

export default class Aura {
    constructor(gl, params = {}) {
        this.setParams(params)

        this.colors = params.colors || defaults.colors;

        this.gl = gl;
        this.canvas = this.gl.canvas;
        this.width = params.width || this.canvas.width;
        this.height = params.height || this.canvas.height;

        this.playing = false;
        this.fixedDeltaTime = 1000 / this.globalParams.targetFps;
        this.animTime = 0;
        this.frameCount = 0;

        this.createShadersAndBuffers();
        this.ramp = CreateGradientTexture2(gl, { colors: this.colors, resolution: 256 });
        this.ppb = new PingPongBuffer(gl, { width: targetTexWidth, height: targetTexHeight });
    }

    setParams = (params) => {
        // Merge defaults with supplied parameters

        this.layer1Params =
        {
            ...defaults.layer1Params,
            ...this.layer1Params,
            ...params.layer1
        }

        this.globalParams =
        {
            ...defaults.globalParams,
            ...this.globalParams,
            ...params.globalParams
        }

        this.layer2Params =
        {
            ...defaults.layer2Params,
            ...this.layer2Params,
            ...params.layer2
        }

        this.feedback =
        {
            ...defaults.feedbackSettings,
            ...this.feedbackSettings,
            ...params.feedbackSettings
        }

        this.blurSettings =
        {
            ...defaults.blurSettings,
            ...this.blurSettings,
            ...params.blurSettings
        }
    }


    createShadersAndBuffers = () => {
        const { gl } = this;

        this.programAura = this.programAura ?? twgl.createProgramInfo(this.gl, [VertDefault, FragAura]);
        this.programFinal = this.programFinal ?? twgl.createProgramInfo(this.gl, [VertDefault, FragComp]);
        this.programBlur = this.programBlur ?? twgl.createProgramInfo(this.gl, [VertDefault, FragBlur]);
        this.bufferInfo = this.bufferInfo ?? twgl.createBuffersFromArrays(gl, FullScreenQuad);
    }

    render = (time) => {
        requestAnimationFrame(this.render);
        this.createShadersAndBuffers();

        const { gl,
            ppb,
            globalParams,
            ramp,
            programAura,
            programFinal,
            bufferInfo } = this

        if (programAura == null || programFinal == null)
            return;

        let now = time;
        const deltaTime = now - this.prevTimestamp;

        // console.log(deltaTime, this.fixedDeltaTime, this.playing)
        if (deltaTime > this.fixedDeltaTime) {
            if (this.playing)
                this.animTime += deltaTime * this.globalParams.speed;

            this.globalParams.time = this.animTime * .001;
            this.prevTimestamp = now - (deltaTime % this.fixedDeltaTime);
            var sinceStart = now - this.startTime;
            this.currFps = Math.round(1000 / (sinceStart / ++this.frameCount) * 100) / 100;
            twgl.resizeCanvasToDisplaySize(this.gl.canvas);


            {

                const auraUniforms = {
                    time: [this.globalParams.time, this.globalParams.time / 2, this.globalParams.time * 2, this.globalParams.time * 10],
                    resolution: [targetTexWidth, targetTexHeight],
                    ramp: this.ramp,
                    layer1: this.layer1Params,
                    layer2: this.layer2Params,
                    feedback: this.feedback,
                    noiseDither: this.globalParams.noise,
                    backBufferTex: this.ppb.lastTexture(),
                    seed: this.globalParams.seed
                }

                // Render new Aura frame
                ppb.bind();

                gl.useProgram(programAura.program);

                twgl.setBuffersAndAttributes(gl, programAura, bufferInfo);
                twgl.setUniforms(programAura, auraUniforms);
                twgl.drawBufferInfo(gl, bufferInfo);

                // Swap buffers
                ppb.swap();

            }

            // Blur stages
            let iterations = this.blurSettings.iterations;
            for (var i = 0; i < iterations; i++) {
                // var radius = (iterations - i - 1)
                let radius = this.blurSettings.radius;
                var dir = i % 2 === 0 ? [radius, 0] : [0, radius]

                const blurUniforms = {
                    resolution: [targetTexWidth, targetTexHeight],
                    iChannel0: ppb.lastTexture(),
                    direction: dir

                }

                ppb.bind();

                gl.useProgram(this.programBlur.program);
                twgl.setBuffersAndAttributes(gl, this.programBlur, bufferInfo);
                twgl.setUniforms(this.programBlur, blurUniforms)
                twgl.drawBufferInfo(gl, bufferInfo);

                ppb.swap();

            }

            // Render to screen
            {
                const compUniforms = {
                    resolution: [gl.canvas.width, gl.canvas.height],
                    backBuffer: ppb.lastTexture(),
                    noiseDither: globalParams.noise,
                    ramp: ramp,
                    contrast: globalParams.contrast,
                    saturation: globalParams.saturation,
                    value: globalParams.value
                }

                // Set dst buffer back to screen
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
                gl.useProgram(programFinal.program);
                twgl.setBuffersAndAttributes(gl, programFinal, bufferInfo);
                twgl.setUniforms(programFinal, compUniforms)
                twgl.drawBufferInfo(gl, bufferInfo);

                ppb.swap();
            }
        }
    }

    start = (play = true) => {
        if (this.started) return;

        this.started = true;
        this.prevTimestamp = window.performance.now();
        this.startTime = this.prevTimestamp;
        if (play)
            this.playing = true;
        this.render();
    }

    setFullscreen = (isFullscreen) => {
        console.log(`set fullscreen: ${isFullscreen}`)
        this.canvas.style = isFullscreen ? fullscreenStyle : null
        if (!isFullscreen) {
            console.log('set width height', this.width, this.height);
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        }
    }

    setTime = (time) => { this.animTime = time; }

    play = () => { this.playing = true; }

    pause = () => { this.playing = false; }
}
