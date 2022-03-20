import * as Settings from '../settings.json';
import Aura from './Aura';
import { InitGui } from './Gui';

let auraCanvas = document.getElementById('aura_canvas');
let gl = auraCanvas.getContext('webgl2', {
  preserveDrawingBuffer: true,
});

let layer1 = {
  brightness: 0.2,
  blobbyness: 1,
  blur: 0.4,

  enabled: true,
};

let layer2 = {
  brightness: 1,
  cycleSpeed: 0.2,
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
  displayGradient: false,
};

let blurSettings = {
  iterations: 8,
  radius: 1,
};

let setParams = () => {
  aura.setParams({
    globalParams: globalParams,
    layer1: layer1,
    layer2: layer2,
    feedbackSettings: feedbackSettings,
    blurSettings: blurSettings,
    colors: rgbVals,
  });
};

const eclipse = [48, 64, 92];
const pink = [220, 91, 172];
const seaFoam = [111, 200, 111];
const golden = [253, 205, 0];

// looks great for seed 7103
let rgbVals = [eclipse, pink, eclipse, seaFoam, golden];

rgbVals = [eclipse, pink, seaFoam, golden];

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

const aura = (window.aura = new Aura(gl, {
  globalParams: globalParams,
  layer1: layer1,
  layer2: layer2,
  feedbackSettings: feedbackSettings,
  blurSettings: blurSettings,
  colors: rgbVals,
  width: window.innerWidth,
  height: window.innerHeight,
}));

const loadFromSearchParams = () => {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());

  const seedInt = parseInt(params.seed, 10);
  const timeFloat = parseFloat(params.time, 10);
  const paused = !!params.paused;

  if (!isNaN(seedInt)) {
    globalParams.seed = seedInt;
  }

  if (!isNaN(timeFloat)) {
    globalParams.animTime = timeFloat;
  } else {
    globalParams.animTime = 0;
  }

  setParams();

  aura.start();

  saveState(false);

  if (paused) {
    aura.pause();
    playpauseBtn.classList.add('paused');
  }
};

const saveState = (push = false) => {
  const currentSeedInt = aura.globalParams.seed;
  const currentTimeInt = Math.round(aura.animTime);

  document.getElementById('seed').textContent = currentSeedInt;
  document.getElementById('time').textContent = currentTimeInt;

  const params = { seed: currentSeedInt };

  if (!isNaN(currentTimeInt)) {
    params.time = currentTimeInt;
  }

  if (!aura.playing) {
    params.paused = 'true';
  }

  var querystring = Object.keys(params)
    .map((key) => key + '=' + params[key])
    .join('&');

  window.history[push ? 'pushState' : 'replaceState'](
    currentSeedInt,
    `Lightward Aura: ${currentSeedInt}`,
    `?${querystring}`
  );
};

loadFromSearchParams();
window.onpopstate = loadFromSearchParams;

const playpauseBtn = document.getElementById('playpause_btn');
const recordBtn = document.getElementById('record_btn');

// requires { preserveDrawingBuffer: true }
// setInterval(() => {
//   aura.canvas.toBlob((blob) => {
//     const url = URL.createObjectURL(blob);
//     document.getElementById('favicon').href = url;
//   }, 'image/png');
// }, 10 * 1000);

playpauseBtn.onclick = () => {
  if (aura.playing) {
    aura.pause();
    playpauseBtn.classList.add('paused');
  } else {
    aura.play();
    playpauseBtn.classList.remove('paused');
  }

  saveState(false);
};

document.getElementById('shuffle_btn').onclick = () => {
  globalParams.seed = Math.round(Math.random() * 10000);
  globalParams.time = Math.round(Math.random() * 60 * 1000);
  setParams();
  saveState(true);
};

document.getElementById('startover_btn').onclick = () => {
  globalParams.animTime = 0;
  setParams();
  saveState(true);
};

document.getElementById('snapshot_btn').onclick = () => {
  const imageUrl = aura.canvas.toDataURL('image/png');

  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = `aura-${aura.globalParams.seed}`;
  document.body.append(link);
  link.click();
  link.remove();

  // setTimeout(() => URL.revokeObjectURL(link.href), 10000);
};

const stream = aura.canvas.captureStream(24);
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'video/webm',
  audioBitsPerSecond: 0,
});
const mediaChunks = [];

mediaRecorder.ondataavailable = (e) => mediaChunks.push(e.data);

mediaRecorder.onstop = function () {
  const blob = new Blob(mediaChunks, { type: 'video/webm' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `aura-${aura.globalParams.seed}`;
  document.body.append(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
};

recordBtn.onclick = () => {
  if (mediaRecorder.state === 'recording') {
    recordBtn.classList.remove('recording');
    mediaRecorder.stop();
  } else {
    recordBtn.classList.add('recording');
    mediaRecorder.start();
  }
};
