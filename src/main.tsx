import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom';
import Aura from './Aura';

declare let window: Window &
  typeof globalThis & {
    aura: undefined | Aura;
  };

const eclipse = [48, 64, 92];
const pink = [220, 91, 172];
const seaFoam = [111, 200, 111];
const golden = [253, 205, 0];

const initialParams = {
  width: window.innerWidth,
  height: window.innerHeight,
  globalParams: {
    animTime: 0,
    contrast: 1.37,
    displayGradient: false,
    feedback: 0.99,
    noise: 0,
    saturation: 1.69,
    seed: 7103,
    speed: 0.13,
    targetFps: 60,
    time: 0,
    value: 1,
  },
  layer1: {
    blobbyness: 1.3,
    blur: 1.01,
    brightness: 0.52,
    enabled: true,
  },
  layer2: {
    blur: 1.47,
    brightness: 0.39,
    cycleSpeed: 0.12,
    enabled: true,
  },
  colors: [eclipse, pink, eclipse, seaFoam, golden],
  feedbackSettings: {
    amount: 0.28,
    centerX: 0.5,
    centerY: 0.5,
    dist: 0.06,
    scaleX: 1.01,
    scaleY: 1.01,
  },
  blurSettings: {
    iterations: 5,
    radius: 10,
  },
};

const Ui = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [aura, setAura] = useState<Aura>();
  const [auraPlaying, setAuraPlaying] = useState(false);
  const [auraImage, setAuraImage] = useState<string>();

  useLayoutEffect(() => {
    const gl = canvasRef.current?.getContext('webgl2', {
      preserveDrawingBuffer: true,
    });

    if (!gl) {
      return;
    }

    const auraInstance = new Aura(gl, initialParams);

    setAura(auraInstance);

    auraInstance.start();
  }, []);

  const syncState = useCallback(() => {
    if (!aura) {
      return;
    }

    setAuraPlaying(aura.playing);
  }, [aura]);

  useEffect(() => {
    const interval = setInterval(syncState, 100);
    return () => clearInterval(interval);
  }, [syncState]);

  useEffect(() => {
    window.aura = aura;
  }, [aura]);

  const playPause = useCallback(() => {
    if (!aura) {
      return;
    }

    aura.playing ? aura.pause() : aura.play();
  }, [aura]);

  useEffect(() => {
    if (!aura) {
      return;
    }

    if (auraPlaying) {
      setAuraImage(undefined);
    } else {
      setAuraImage(aura.canvas.toDataURL());
    }
  }, [auraPlaying]);

  return (
    <>
      <div id="aura" onScroll={() => console.log('scrolling')}>
        <label onClick={playPause}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </label>
        {auraImage && <img src={auraImage} onClick={playPause} />}
      </div>
    </>
  );
};

ReactDOM.render(React.createElement(Ui), document.getElementById('root'));
