import color from 'colorjs.io';
import * as twgl from 'twgl.js'
import {  CreateGradientTexture2 } from './Gradient';
import { FragAura,  VertDefault, FragComp } from './shaders/Shaders';
import { FullScreenQuad } from './Geometry';
import { GUI } from 'dat.gui';
import * as Settings from '../settings.json'
import PingPongBuffer from './PingPongBuffer'


let auraCanvas = document.getElementById('aura_canvas');
let gl = auraCanvas.getContext('webgl2');

let programInfo = twgl.createProgramInfo(gl, [VertDefault, FragAura]);
let programFinal = twgl.createProgramInfo(gl, [VertDefault, FragComp]);
let pauseButton = document.getElementById('pause_btn');
let playButton = document.getElementById('play_btn');
let timer = document.getElementById('timer')
let fpsDisp = document.getElementById('fps')

let layer1 = {
  color1: [255.0, 0.0, 0.0],
  color2: [0., 255., 0.],
  brightness: .2,
  blobbyness: 1.,
  blur: .4,

  enabled: true
}

let layer2 = {
  brightness: 1,
  cycleSpeed: .2,

  enabled: false
}

let appParams = {
  autoSave: true,
  fullscreen: false,
}

let feedbackSettings =
{
  amount: .4,
  scaleX: 1.01,
  scaleY: 1.01,
  centerX: 0.5,
  centerY: 0.5
}

let globalParams =
{
  time: 0.,
  speed: .1,
  seed: 100,
  noise: .003,
  feedback: .99
}

console.log(`Settings: `, Settings)

let setFullscreen = (isFullscreen) => {
  console.log(`set fullscreen: ${isFullscreen}`)
  auraCanvas.style = isFullscreen ? fullscreenStyle : null
  if (!isFullscreen) {
    console.log('set width height');
    auraCanvas.width = width;
    auraCanvas.height = height;
  }
}

let initGui = () => {
  let gui = new GUI({ name: 'params', load: Settings })

  // App
  gui.remember(appParams)
  gui.add(appParams, 'autoSave');
  gui.add(appParams, 'fullscreen').listen().onChange(setFullscreen)

  // Global
  gui.remember(globalParams);
  let folder = gui.addFolder('Global')
  folder.add(globalParams, 'speed').min(0.01).max(1).step(.01).listen();
  folder.add(globalParams, 'noise').min(0.).max(.1).step(.001).listen();
  folder.open();

  // Feedback settings
  gui.remember(feedbackSettings)
  let feedbackFolder = gui.addFolder('Feedback');
  feedbackFolder.add(feedbackSettings, 'amount').min(0).max(1).step(.01).listen();
  // feedbackFolder.add(feedbackSettings, 'scaleX').min(0.1).max(2.0).step(.01).listen();
  // feedbackFolder.add(feedbackSettings, 'scaleY').min(0.1).max(2.0).step(.01).listen();
  // feedbackFolder.add(feedbackSettings, 'centerX').min(0).max(1).step(.01).listen();
  // feedbackFolder.add(feedbackSettings, 'centerY').min(0).max(1).step(0.01).listen();
  feedbackFolder.open();


  // Layer 1
  gui.remember(layer1)
  let layer1Folder = gui.addFolder('Layer 1');
  layer1Folder.addColor(layer1, 'color1').listen();
  layer1Folder.addColor(layer1, 'color2').listen();
  layer1Folder.add(layer1, 'brightness').min(0).max(1).step(.01).listen();
  layer1Folder.add(layer1, 'blobbyness').min(0).max(4).step(.1).listen();
  layer1Folder.add(layer1, 'blur').min(0).max(3).step(.01).listen();
  layer1Folder.add(layer1, 'enabled').listen();
  layer1Folder.open();

  // Layer 2
  gui.remember(layer2)
  let layer2Folder = gui.addFolder('Layer 2');
  layer2Folder.add(layer2, 'brightness').min(0).max(1).step(.01).listen();
  layer2Folder.add(layer2, 'enabled').listen();
  layer2Folder.add(layer2, 'cycleSpeed').min(0).max(2).step(.01).listen();
  layer2Folder.open();

  // Autosave interval
  setInterval(() => {
    if (appParams.autoSave)
      gui.save()
  }, 1000);

}


let rgbVals = [
  // [0, 0, 0],
  [14, 39, 35],
  [8, 69, 62],
  [118, 81, 121],
  [223, 179, 109],
  [217, 229, 199],
]

let rgbArray = rgbVals;

rgbVals = rgbVals.map(e => new color('sRGB', e.map(f => f / 255)))






let playing = true;

let startTime, prevTimestamp, deltaTime, now;

let fps = 60;
let fixedDeltaTime = 1000 / fps;
let animTime = 0;
let frameCount = 0;

let width = 600;
let height = 400;
let fullscreenStyle = `position: fixed;    width: 100vw;    height: 100vh;    z-index: 0;`;

window.addEventListener('blur', () => console.log('blur'), false)
window.addEventListener('focus', () => console.log('focus'), false)


const bufferInfo = twgl.createBufferInfoFromArrays(gl, FullScreenQuad);

const backBufferTex = gl.createTexture();
// const backBufferTex = twgl.createTexture(gl, { width: targetTexWidth, height: targetTexHeight, color: [255, 0, 0], format: gl.RGBA, internalFormat:gl.RGBA });
const targetTexWidth = 256;
const targetTexHeight = 256;

gl.bindTexture(gl.TEXTURE_2D, backBufferTex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
  targetTexWidth, targetTexHeight, 0,
  gl.RGBA, gl.UNSIGNED_BYTE, null);

gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

const fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

const attachmentPoint = gl.COLOR_ATTACHMENT0;
gl.framebufferTexture2D(
  gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, backBufferTex, 0);


let start = (fps) => {
  fixedDeltaTime = 1000 / fps;
  prevTimestamp = window.performance.now();
  startTime = prevTimestamp;
  render();
}

let ramp = CreateGradientTexture2(gl, { colors: rgbArray, resolution: 256 });

let ppb = new PingPongBuffer(gl, { width: targetTexWidth, height: targetTexHeight });

let render = (time) => {

  requestAnimationFrame(render)

  now = time;
  deltaTime = now - prevTimestamp;

  if (deltaTime > fixedDeltaTime) {

    if (playing)
      animTime += deltaTime * globalParams.speed;

    globalParams.time = animTime * .001;

    prevTimestamp = now - (deltaTime % fixedDeltaTime);
    var sinceStart = now - startTime;
    var currFps = Math.round(1000 / (sinceStart / ++frameCount) * 100) / 100;

    fpsDisp.textContent = `FPS: ${currFps.toFixed(2)}`

    twgl.resizeCanvasToDisplaySize(gl.canvas);

    timer.textContent = `Time: ${(animTime / 1000).toFixed(2)}`
    const uniforms = {
      time: [globalParams.time, globalParams.time / 2, globalParams.time * 2, globalParams.time / 10],
      resolution: [targetTexWidth, targetTexHeight],
      ramp: ramp,
      layer1: layer1,
      layer2: layer2,
      feedback: feedbackSettings,
      noiseDither: globalParams.noise,
      backBufferTex: ppb.lastTexture(),
    };

    const compUniforms = {
      resolution: [gl.canvas.width, gl.canvas.height],
      backBuffer: ppb.currentTexture(),
      noiseDither: globalParams.noise,
      ramp: ramp
    }

    {
      // Render new frame 
      ppb.bind();

      gl.useProgram(programInfo.program);

      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, bufferInfo);
    }

    {

      compUniforms.backBuffer = ppb.currentTexture();

      //   // Set dst buffer back to screen
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

if (programInfo)
  start(fps)
else
  timer.textContent = 'Failed to Compile Shaders'

pauseButton.onclick = () => playing = false;
playButton.onclick = () => playing = true;

initGui(globalParams);
setFullscreen(appParams.fullscreen)