import { CreateGradientTexture2 } from "./Gradient";
import PingPongBuffer from "./PingPongBuffer";
import * as twgl from 'twgl.js'
import VertDefault from "./shaders/VertDefault";
import FragAura from "./shaders/FragAura";
import { FullScreenQuad } from "./Geometry";
import FragComp from "./shaders/FragComp";

const defaults =
{
    globalParams:
    {
        time: 0.,
        speed: .21,
        seed: 100,
        noise: .003,
        targetFps: 60
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
    }
}

const targetTexWidth = 256;
const targetTexHeight = 256;

let fullscreenStyle = `position: fixed;    width: 100vw;    height: 100vh;    z-index: 0;`;

export default class Aura {
    constructor(gl, params = {}) {
        // Merge defaults with supplied parameters
        this.globalParams =
        {
            ...defaults.globalParams,
            ...params.globalParams
        }

        this.layer1Params =
        {
            ...defaults.layer1,
            ...params.layer1
        }

        this.layer2Params =
        {
            ...defaults.layer2,
            ...params.layer2
        }
        this.feedback =
        {
            ...defaults.feedback,
            ...params.feedback
        }

        this.colors = params.colors || defaults.colors;

        this.gl = gl;
        this.canvas = this.gl.canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.playing = false;
        this.fixedDeltaTime = 1000 / this.globalParams.targetFps;
        this.animTime = 0;
        this.frameCount = 0;

        this.createShadersAndBuffers();
        this.ramp = CreateGradientTexture2(gl, { colors: this.colors, resolution: 256 });
        this.ppb = new PingPongBuffer(gl, { width: targetTexWidth, height: targetTexHeight });
    }

    setParams = (params) => {
        this.layer1Params =
        {
            ...this.layer1Params,
            ...params.layer1
        }

        this.globalParams =
        {
            ...this.globalParams,
            ...params.globalParams
        }

        this.layer2Params =
        {
            ...this.layer2Params,
            ...params.layer2
        }

        this.feedback =
        {
            ...this.feedbackSettings,
            ...params.feedbackSettings
        }

    }


    createShadersAndBuffers = () => {
        const { gl } = this;

        this.programAura = this.programAura ?? twgl.createProgramInfo(this.gl, [VertDefault, FragAura]);
        this.programFinal = this.programFinal ?? twgl.createProgramInfo(this.gl, [VertDefault, FragComp]);
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

            {
                // Render new frame 
                this.ppb.bind();

                gl.useProgram(programAura.program);

                twgl.setBuffersAndAttributes(gl, programAura, bufferInfo);
                twgl.setUniforms(programAura, auraUniforms);
                twgl.drawBufferInfo(gl, bufferInfo);

            }

            const compUniforms = {
                resolution: [gl.canvas.width, gl.canvas.height],
                backBuffer: ppb.currentTexture(),
                noiseDither: globalParams.noise,
                ramp: ramp
            }

            {
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