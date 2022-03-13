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
    colors: rgbArray,
  });
};

let rgbVals = [
  // [0, 0, 0],

  // sunset
  [32, 70, 95],

  // pink
  [220, 91, 172],

  // eclipse
  [48, 64, 92],

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

const [seed, time] = `${window.location.search?.replace(/^\?/, '')}`.split(',');

const seedInt = parseInt(seed, 10);
const timeFloat = parseFloat(time, 10);

if (!isNaN(seedInt)) {
  globalParams.seed = seedInt;
}

if (!isNaN(timeFloat)) {
  globalParams.animTime = timeFloat * 1000;
}

const aura = (window.aura = new Aura(gl, {
  globalParams: globalParams,
  layer1: layer1,
  layer2: layer2,
  feedbackSettings: feedbackSettings,
  blurSettings: blurSettings,
  colors: rgbArray,
  width: window.innerWidth,
  height: window.innerHeight,
}));

aura.start(appParams.autoPlay);

const saveState = () => {
  const currentSeedInt = aura.globalParams.seed;
  const currentTimeInt = Math.round(aura.animTime / 1000);

  document.getElementById('seed').textContent = currentSeedInt;
  document.getElementById('time').textContent = currentTimeInt;

  window.history.replaceState(
    currentSeedInt,
    `Lightward Aura: ${currentSeedInt}`,
    `?${currentSeedInt},${currentTimeInt}`
  );

  console.log('fps:', aura.currFps);
};

setInterval(saveState, 1000);

// requires { preserveDrawingBuffer: true }
// setInterval(() => {
//   aura.canvas.toBlob((blob) => {
//     const url = URL.createObjectURL(blob);
//     document.getElementById('favicon').href = url;
//   }, 'image/png');
// }, 10 * 1000);

document.getElementById('playpause_btn').onclick = () => {
  aura.playing ? aura.pause() : aura.play();
};

document.getElementById('shuffle_btn').onclick = () => {
  aura.setSeed(Math.round(Math.random() * 10000));
  aura.setTime(0);
  saveState();
};

document.getElementById('startover_btn').onclick = () => {
  aura.setTime(0);
  saveState();
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

const recordBtn = document.getElementById('record_btn');
recordBtn.onclick = () => {
  if (mediaRecorder.state === 'recording') {
    recordBtn.classList.remove('recording');
    mediaRecorder.stop();
  } else {
    recordBtn.classList.add('recording');
    mediaRecorder.start();
  }
};
