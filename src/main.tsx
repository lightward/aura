import React, {
  MouseEvent,
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
  animTime: Math.random() * 9999,
  // seed: 7103,
  seed: Math.round(Math.random() * 9999),
  colors: [eclipse, pink, eclipse, seaFoam, golden],

  globalParams: {
    contrast: 1.37,
    displayGradient: false,
    feedback: 0.99,
    noise: 0.5,
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
    radius: 5,
  },
};

const Ui = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [aura, setAura] = useState<Aura>();
  const [auraPlaying, setAuraPlaying] = useState(false);
  const [auraImage, setAuraImage] = useState<string>();
  const [auraLabel, setAuraLabel] = useState<string>();
  const [stateUrl, setStateUrl] = useState<string>();

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
    setStateUrl(`?seed=${aura?.seed}&time=${aura?.animTime}`);
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

    if (aura.playing) {
      aura.pause();
      history.pushState({}, '', stateUrl);
    } else {
      aura.play();
    }
  }, [aura, stateUrl]);

  const shuffle = useCallback(
    (event?: MouseEvent<HTMLAnchorElement>) => {
      event?.preventDefault();

      if (!aura) {
        return;
      }

      aura.animTime = Math.random() * 9999;
      aura.seed = Math.round(Math.random() * 9999);
      history.pushState({}, '', `?seed=${aura.seed}&time=${aura.animTime}`);
      aura.play();
    },
    [aura],
  );

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
        case '?':
          shuffle();
          return;
      }
    },
    [aura, playPause, shuffle],
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

  useEffect(() => {
    setTimeout(
      () => document.getElementById('controls')?.classList.add('hide'),
      2500,
    );
  }, []);

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
      <div id="label" className={auraPlaying ? 'hide' : ''}>
        <a href="/" onClick={shuffle}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            {/* <!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --> */}
            <path d="M424.1 287c-9.375-9.375-24.56-9.344-33.94 .0313s-9.375 24.56 0 33.94L430.1 360H332l-58.01-77.34l-29.1 39.99l56.82 75.75C305.3 404.4 312.4 408 320 408h110.1l-39.03 39.03c-9.375 9.375-9.375 24.56 0 33.94C395.7 485.7 401.8 488 408 488s12.27-2.375 16.96-7.062l79.1-79.98c9.375-9.375 9.375-24.6 0-33.97L424.1 287zM24 152h92l58.01 77.34l29.1-39.99L147.2 113.6C142.7 107.6 135.6 104 128 104H24C10.75 104 0 114.8 0 128S10.75 152 24 152zM430.1 152l-39.03 39.03c-9.375 9.375-9.375 24.56 0 33.94C395.7 229.7 401.8 232 408 232s12.28-2.312 16.97-7l79.1-79.98c9.375-9.375 9.374-24.6-.0013-33.97l-79.1-79.98c-9.375-9.375-24.56-9.406-33.93-.0313s-9.375 24.56 0 33.94L430.1 104H320c-7.562 0-14.66 3.562-19.19 9.594L116 360H24C10.75 360 0 370.8 0 384s10.75 24 24 24H128c7.562 0 14.66-3.562 19.19-9.594L332 152H430.1z" />
          </svg>
        </a>
        <a href={stateUrl} target="_blank">
          {auraLabel}
        </a>
      </div>
      <div id="controls">
        <h1>Lightward Aura</h1>
        <table>
          <tr>
            <th>[space]</th>
            <td>play/pause</td>
          </tr>
          <tr>
            <th>[left/right]</th>
            <td>back/forward</td>
          </tr>
          <tr>
            <th>[?]</th>
            <td>shuffle</td>
          </tr>
        </table>
      </div>
    </>
  );
};

ReactDOM.render(React.createElement(Ui), document.getElementById('root'));
