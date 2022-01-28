import color from 'colorjs.io';
import * as twgl from 'twgl.js'
import { CreateGradientTexture } from './Gradient';
import { FragAura, FragTexture, VertDefault } from './shaders/Shaders';
import { FullScreenQuad } from './Geometry';
import { GUI } from 'dat.gui';
import * as Settings from '../settings.json'


let auraCanvas = document.getElementById('aura_canvas');


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

let globalParams =
{
  time: 0.,
  speed: .1,
  seed: 100,

  noise: 1.
}

console.log(`Settings: `, Settings)

let setFullscreen = (isFullscreen) =>
{
  console.log(`set fullscreen: ${isFullscreen}`)
  auraCanvas.style = isFullscreen ? fullscreenStyle : null 
  if(!isFullscreen)
  {
    console.log('set width height');
    auraCanvas.width = width;
    auraCanvas.height = height;
  }
}

let initGui = () => {
  let gui = new GUI({ name: 'params', load: Settings })

  // Global
  gui.remember(globalParams);
  gui.add(appParams, 'autoSave');
  gui.add(appParams, 'fullscreen').listen().onChange(setFullscreen)

  let folder = gui.addFolder('Global')
  // folder.add(globalParams, 'seed').min(0).max(5000).step(1).listen();
  folder.add(globalParams, 'speed').min(0.01).max(1).step(.01).listen();
  folder.add(globalParams, 'noise').min(0.).max(.1).step(.001).listen();
  folder.open();

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
  [14, 39, 35],
  [8, 69, 62],
  [118, 81, 121],
  [223, 179, 109],
  [217, 229, 199],
]

rgbVals = rgbVals.map(e => new color('sRGB', e.map(f => f / 255)))

let glGrad = document.getElementById('gradient_canvas').getContext('webgl2')
var grad = CreateGradientTexture(glGrad, {
  steps: 16,
  colors: rgbVals
});


let gradShader = twgl.createProgramInfo(glGrad, [VertDefault, FragTexture])
var linear = glGrad.getExtension("OES_texture_float_linear");
if (!linear) {
  alert("this machine or browser does not support  OES_texture_float_linear");
}

const bufferInfoGrad = twgl.createBufferInfoFromArrays(glGrad, FullScreenQuad);
twgl.resizeCanvasToDisplaySize(glGrad.canvas);
glGrad.viewport(0, 0, glGrad.canvas.width, glGrad.canvas.height);


let gl = auraCanvas.getContext('webgl2');
let programInfo = twgl.createProgramInfo(gl, [VertDefault, FragAura]);
let pauseButton = document.getElementById('pause_btn');
let playButton = document.getElementById('play_btn');
let timer = document.getElementById('timer')
let fpsDisp = document.getElementById('fps')

gl.getExtension("OES_texture_float_linear");

var grad2 = CreateGradientTexture(gl, {
  steps: 16,
  colors: rgbVals
});



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


let start = (fps) => {
  fixedDeltaTime = 1000 / fps;
  prevTimestamp = window.performance.now();
  startTime = prevTimestamp;
  render();
}


let render = (time) => {

  const uniformsGrad = {
    resolution: [glGrad.canvas.width, glGrad.canvas.height],
    tex: grad
  };

  glGrad.useProgram(gradShader.program);
  twgl.setBuffersAndAttributes(glGrad, gradShader, bufferInfoGrad);
  twgl.setUniforms(gradShader, uniformsGrad);
  twgl.drawBufferInfo(glGrad, bufferInfoGrad);

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
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    timer.textContent = `Time: ${(animTime / 1000).toFixed(2)}`

    const uniforms = {
      time: [globalParams.time, globalParams.time / 2, globalParams.time * 2, globalParams.time / 10],
      resolution: [gl.canvas.width, gl.canvas.height],
      ramp: grad2,
      layer1: layer1,
      layer2: layer2,
      noiseDither: globalParams.noise
    };


    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, bufferInfo);
  }

}

if (programInfo)
  start(fps)
else
  timer.textContent = 'Failed to Compile Shaders'

pauseButton.onclick = () => playing = false;
playButton.onclick = () => playing = true;

initGui(globalParams);
setFullscreen(globalParams.fullscreen)