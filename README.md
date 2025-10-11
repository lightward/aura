# Lightward Aura

A WebGL-powered generative visual library for creating beautiful, animated plasma clouds.

## Live Demo

[https://aura.lightward.io/](https://aura.lightward.io/)

## Usage

### Quick Start

```html
<script src="https://aura.lightward.io/aura.js"></script>
<script>
  const container = document.getElementById('my-container');
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });

  const aura = new LightwardAura(gl, {
    ...LightwardAura.defaultParams,
    width: window.innerWidth,
    height: window.innerHeight,
  });

  aura.start();
</script>
```

### Custom Colors

```javascript
const aura = new LightwardAura(gl, {
  ...LightwardAura.defaultParams,
  width: window.innerWidth,
  height: window.innerHeight,
  colors: [
    [100, 150, 255],  // RGB values 0-255
    [255, 100, 150],
  ],
});
```

### API

#### `new LightwardAura(gl, params)`

- `gl`: WebGL2 rendering context
- `params`: Configuration object (see below)

#### Methods

- `start(play = true)` - Start the render loop
- `play()` - Resume animation
- `pause()` - Pause animation
- `shutdown()` - Clean up resources

#### Static Properties

- `LightwardAura.defaultParams` - Default configuration object (excludes `width` and `height`)

#### Configuration

```typescript
{
  width: number;           // Canvas width
  height: number;          // Canvas height
  animTime: number;        // Initial animation time
  seed: number;            // Random seed for reproducibility
  colors: [r, g, b][];     // Array of RGB color tuples (0-255)

  globalParams: {
    contrast: number;      // Default: 1.37
    saturation: number;    // Default: 1.69
    speed: number;         // Default: 0.13
    noise: number;         // Default: 0.5
    targetFps: number;     // Default: 60
    // ... (see defaultParams for full list)
  };
  // ... (see defaultParams for complete structure)
}
```

## Development

### Build

```bash
npm install
npm run build
```

### Watch Mode

```bash
npm run watch
```

Use any static file server (like [Live Server for VSCode](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)) to view `index.html` during development.

### Test

```bash
npm test
```

## License

[UNLICENSE](./UNLICENSE) - Public domain
