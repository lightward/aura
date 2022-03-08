import * as Settings from '../settings.json';
import Aura from './Aura';
import { InitGui } from './Gui';

let auraCanvas = document.getElementById('aura_canvas');
let gl = auraCanvas.getContext('webgl2');

let playpauseButton = document.getElementById('playpause_btn');
let shuffleButton = document.getElementById('shuffle_btn');
let startoverButton = document.getElementById('startover_btn');

let seed = document.getElementById('seed');
let timer = document.getElementById('timer');
let fpsDisp = document.getElementById('fps');

let layer1 = {
  brightness: 0.2,
  blobbyness: 1,
  blur: 0.4,

  enabled: true,
};

let layer2 = {
  brightness: 1,
  cycleSpeed: 0.2,
  blobbyness: 1.2,
  blur: 1.47,
  enabled: false,
};

let appParams = {
  autoSave: true,
  autoPlay: true,
};

let feedbackSettings = {
  amount: 0.4,
  scaleX: 1.01,
  scaleY: 1.01,
  centerX: 0.5,
  centerY: 0.5,
  dist: 0.05,
};

let globalParams = {
  time: 0,
  speed: 0.1,
  seed: 100,
  noise: 0.003,
  feedback: 0.99,
  saturation: 1,
  contrast: 1,
};

let blurSettings = {
  iterations: 8,
  radius: 1,
};

console.log(`Settings: `, Settings);

let setParams = () => {
  let auraParams = {
    globalParams: globalParams,
    layer1: layer1,
    layer2: layer2,
    feedbackSettings: feedbackSettings,
    blurSettings: blurSettings,
    colors: rgbArray,
  };
  // console.log(auraParams.layer2);
  aura.setParams(auraParams);
};

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
];

let rgbArray = rgbVals;

// load settings and init gui
InitGui(
  Settings,
  {
    appParams: appParams,
    globalParams: globalParams,
    feedbackSettings: feedbackSettings,
    layer1: layer1,
    layer2: layer2,
    blurSettings: blurSettings,
  },
  {
    setParams: setParams,
  }
);

let auraParams = {
  globalParams: globalParams,
  layer1: layer1,
  layer2: layer2,
  feedbackSettings: feedbackSettings,
  blurSettings: blurSettings,
  colors: rgbArray,
  width: window.innerWidth,
  height: window.innerHeight,
};

let aura = new Aura(gl, auraParams);
aura.start(appParams.autoPlay);

playpauseButton.onclick = () => {
  aura.playing ? aura.pause() : aura.play();
};

shuffleButton.onclick = () => {
  aura.setSeed(Math.round(Math.random() * 10000));
  aura.setTime(0);
};

startoverButton.onclick = () => {
  aura.setTime(0);
};

const maybeSeed = parseInt(`${window.location.search?.replace(/^\?/, '')}`, 10);

if (maybeSeed) {
  aura.setSeed(maybeSeed);
}

let render = () => {
  requestAnimationFrame(render);

  seed.textContent = aura.globalParams.seed;
  fpsDisp.textContent = `${Math.round(aura.currFps)} FPS`;
  timer.textContent = `${Math.round(aura.animTime / 1000)}`;
};

requestAnimationFrame(render);
