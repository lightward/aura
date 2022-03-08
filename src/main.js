import * as Settings from '../settings.json'
import Aura from './Aura';
import { InitGui } from './Gui';

let auraCanvas = document.getElementById('aura_canvas');
let gl = auraCanvas.getContext('webgl2');

let pauseButton = document.getElementById('pause_btn');
let playButton = document.getElementById('play_btn');
let startOverButton = document.getElementById('start_over_btn');

let timer = document.getElementById('timer')
let fpsDisp = document.getElementById('fps')

let layer1 = {
  brightness: .2,
  blobbyness: 1.,
  blur: .4,

  enabled: true
}

let layer2 = {
  brightness: 1,
  cycleSpeed: .2,
  blobbyness: 1.2,
  blur: 1.47,
  enabled: false
}

let appParams = {
  autoSave: true,
  fullscreen: false,
  autoPlay: true
}

let feedbackSettings =
{
  amount: .4,
  scaleX: 1.01,
  scaleY: 1.01,
  centerX: 0.5,
  centerY: 0.5,
  dist: .05
}

let globalParams =
{
  time: 0.,
  speed: .1,
  seed: 100,
  noise: .003,
  feedback: .99,
  saturation: 1,
  contrast:1
}

let blurSettings =
{
  iterations: 8,
  radius: 1
}

console.log(`Settings: `, Settings)

let setParams = () => {
  let auraParams = {
    globalParams: globalParams,
    layer1: layer1,
    layer2: layer2,
    feedbackSettings: feedbackSettings,
    blurSettings: blurSettings,
    colors: rgbArray
  }
  // console.log(auraParams.layer2);
  aura.setParams(auraParams);
}

let setFullscreen = (isFullscreen) => {
  aura.setFullscreen(isFullscreen);
}

let rgbVals = [
  // [0, 0, 0],

  // sunset
  [32, 70, 95],

  // pink
  [220, 91, 172],

  // eclipse
  // [48, 64, 92],

  // sea foam
  [111, 200, 111],

  // golden
  [253, 205, 0],
]

let rgbArray = rgbVals;

// load settings and init gui
InitGui(Settings, {
  appParams: appParams,
  globalParams: globalParams,
  feedbackSettings: feedbackSettings,
  layer1: layer1,
  layer2: layer2,
  blurSettings: blurSettings
},
  {
    setFullscreen: setFullscreen,
    setParams: setParams
  })

let auraParams = {
  globalParams: globalParams,
  layer1: layer1,
  layer2: layer2,
  feedbackSettings: feedbackSettings,
  blurSettings: blurSettings,
  colors: rgbArray,
  width: window.innerWidth,
  height: window.innerHeight,
}

let aura = new Aura(gl, auraParams);
aura.start(appParams.autoPlay);

pauseButton.onclick = () => aura.pause();
playButton.onclick = () => aura.play();
startOverButton.onclick = () => {
  aura.pause();
  aura.setTime(0);
}

setFullscreen(appParams.fullscreen)

let render = () => {
  requestAnimationFrame(render)

  fpsDisp.textContent = `${aura.currFps} FPS`;
  timer.textContent = `${(aura.animTime / 1000).toFixed(2)} s`
}

requestAnimationFrame(render);
