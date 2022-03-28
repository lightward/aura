import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom';
import Aura, {AuraColor, AuraParams} from './Aura';

declare let window: Window &
  typeof globalThis & {
    aura: undefined | Aura;
  };

const eclipse: AuraColor = [48, 64, 92];
const pink: AuraColor = [220, 91, 172];
const seaFoam: AuraColor = [111, 200, 111];
const golden: AuraColor = [253, 205, 0];

const initialParams: AuraParams = {
  width: window.innerWidth,
  height: window.innerHeight,
  animTime: 0,
  seed: 7103,
  colors: [eclipse, pink, eclipse, seaFoam, golden],

  globalParams: {
    contrast: 1.37,
    displayGradient: false,
    feedback: 0.99,
    noise: 0,
    saturation: 1.69,
    speed: 0.13,
    targetFps: 60,
    value: 1,
  },
  layer1Params: {
    blobbyness: 1.3,
    blur: 1.01,
    brightness: 0.52,
    enabled: true,
  },
  layer2Params: {
    blur: 1.47,
    brightness: 0.39,
    cycleSpeed: 0.12,
    enabled: true,
  },
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
  const [auraLabel, setAuraLabel] = useState<string>();

  useLayoutEffect(() => {
    const gl = canvasRef.current?.getContext('webgl2', {
      preserveDrawingBuffer: true,
    });

    if (!gl) {
      return;
    }

    const queryParams = new URLSearchParams(window.location.search);

    const params = {...initialParams};

    if (queryParams.has('time')) {
      const timeString = queryParams.get('time');

      if (timeString) {
        params.animTime = parseFloat(timeString);
      }
    }

    if (queryParams.has('seed')) {
      const seedString = queryParams.get('seed');

      if (seedString) {
        params.seed = parseInt(seedString, 10);
      }
    }

    const auraInstance = new Aura(gl, params);

    setAura(auraInstance);

    auraInstance.start(!queryParams.has('seed') && !queryParams.has('time'));
  }, []);

  const syncState = useCallback(() => {
    if (!aura) {
      return;
    }

    setAuraPlaying(aura.playing);
    setAuraLabel(`${aura.seed}x${Math.round(aura.animTime)}`);
  }, [aura]);

  useEffect(() => {
    const interval = setInterval(syncState, 100);
    return () => clearInterval(interval);
  }, [syncState]);

  useEffect(() => {
    window.aura = aura;
  }, [aura]);

  const playPause = useCallback(() => {
    if (!aura) return;

    aura.playing ? aura.pause() : aura.play();
  }, [aura]);

  const onDocumentKeydown = useCallback(
    (event: KeyboardEvent) => {
      if (!aura) return;

      switch (event.key) {
        case ' ':
          playPause();
          return;
        case 'ArrowRight':
          aura.animTime += 100;
          return;
        case 'ArrowLeft':
          aura.animTime -= 100;
          return;
      }
    },
    [aura, playPause],
  );

  useEffect(() => {
    document.addEventListener('keydown', onDocumentKeydown);
    return () => document.removeEventListener('keydown', onDocumentKeydown);
  }, [onDocumentKeydown]);

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
        <canvas
          ref={canvasRef}
          onClick={playPause}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
        {auraImage && <img src={auraImage} onClick={playPause} />}
      </div>
      {!auraPlaying && (
        <div id="label">
          <a
            href={`?seed=${aura?.seed}&time=${aura?.animTime}`}
            target="_blank"
          >
            {auraLabel}
          </a>
        </div>
      )}
    </>
  );
};

ReactDOM.render(React.createElement(Ui), document.getElementById('root'));
