import color from 'colorjs.io';
import * as twgl from 'twgl.js'
import { CreateGradientTexture } from './Gradient';
import { FragAura, FragTexture, VertDefault } from './shaders/Shaders';
import { FullScreenQuad } from './Geometry';

let glGrad = document.getElementById('gradient_canvas').getContext('webgl2')

let rgbVals = [
  [14,39,35],
  [8,69,62],
  [118,81,121],
  [223,179,109],
  [217,229,199],
]

rgbVals = rgbVals.map(e=>new color('sRGB', e.map(f=>f/255)))

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



let auraCanvas = document.getElementById('aura_canvas');
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



// let ramp = twgl.createTexture(gl, { src: 'ramp.png', wrap: gl.MIRRORED_REPEAT });

let playing = true;

let startTime, prevTimestamp, deltaTime, now;

let fps = 60;
let fixedDeltaTime = 1000 / fps;
let animTime = 0;
let frameCount = 0;
let speed = .1;

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
      animTime += deltaTime * speed;

    prevTimestamp = now - (deltaTime % fixedDeltaTime);
    var sinceStart = now - startTime;
    var currFps = Math.round(1000 / (sinceStart / ++frameCount) * 100) / 100;

    fpsDisp.textContent = `FPS: ${currFps.toFixed(2)}`

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    timer.textContent = `Time: ${(animTime / 1000).toFixed(2)}`

    const uniforms = {
      time: animTime * 0.001,
      resolution: [gl.canvas.width, gl.canvas.height],
      ramp: grad2
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