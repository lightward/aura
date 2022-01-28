import { LabColorSpace } from "./LabColorSpace"
import { Noise3DGrad, Noise3D, Noise2D } from "./noise/Noise"
import { Random } from "./noise/Random"
import { Saturate } from "./Saturate"
import { Shapes } from "./shapes/Shapes"

let VertDefault = `
attribute vec4 position;

varying vec4 uv;

void main() {
  gl_Position = position;
}
`

let FragTest = `
precision mediump float;

uniform vec2 resolution;
uniform float time;

varying vec4 uv;

uniform gsampler2D ramp;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  float color = 0.0;
  // lifted from glslsandbox.com
  color += sin( uv.x * cos( time / 3.0 ) * 60.0 ) + cos( uv.y * cos( time / 2.80 ) * 10.0 );
  color += sin( uv.y * sin( time / 2.0 ) * 40.0 ) + cos( uv.x * sin( time / 1.70 ) * 40.0 );
  color += sin( uv.x * sin( time / 1.0 ) * 10.0 ) + sin( uv.y * sin( time / 3.50 ) * 80.0 );
  color *= sin( time / 10.0 ) * 0.5;

  gl_FragColor = vec4( vec3( color * 0.5, sin( color + time / 2.5 ) * 0.75, color ), 1.0 );
}`

let FragTexture = `
precision mediump float;

${LabColorSpace}

uniform vec2 resolution;
uniform sampler2D tex;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec3 texCol = texture2D(tex, vec2(uv.x, .5)).rgb;

  vec4 colOut;
  colOut.a = 1.;
  // colOut.rgb = saturate(xyz2rgb(texCol));
  // colOut.rgb = lab2rgb2(texCol);

  colOut.rgb = saturate(texCol);
// colOut.rgb = vec3(1.,1.,0.);
  gl_FragColor = colOut;

  // gl_FragColor = texture2D(tex, vec2(uv.x, .5));
  // gl_FragColor = vec4(uv.xy,0,1);
}
`

let FragAura = `
// #version 300 es
precision mediump float;

${Shapes}
${Random}
${Noise3DGrad}
${Noise3D}
${Saturate}

struct Layer1
{
  vec3 color1;
  vec3 color2;
  float brightness;
  float blobbyness;
  float blur;

  bool enabled;
};

struct Layer2
{
  float brightness;
  float cycleSpeed;
  bool enabled;
};

uniform vec2 resolution;
uniform vec4 time; // [time, time/2, time*2, time/10]
uniform sampler2D ramp;
uniform Layer1 layer1;
uniform Layer2 layer2;

uniform float noiseDither;

#define TO_FLOAT (1./255.0)

#define sin01(x) (sin(x)*.5)+.5

#define disabled vec3(0.0)

void doLayer1(in vec4 uv, inout vec3 col)
{
  vec2 st = uv.zw;
  // st = scale(st, 2.);
  float sk = .1*sin(time.y);
  float d = sdParallelogram(st, .4, .1, sk);
  // d += snoise(vec3(uv.xy, time.x));
  float d2 = sdRhombus(st, vec2(1.,1.));
  
  float noise = snoise(vec3(uv.xy, time.x));
  float dMix = smoothstep(.0,.2, mix(d,d2, sin01(time.z) ));

dMix+=layer1.blobbyness*noise;
d += noise*layer1.blobbyness;

  vec3 layer1Col = layer1.brightness*(mix(layer1.color1*TO_FLOAT, layer1.color2*TO_FLOAT, saturate(smoothstep(-layer1.blur, layer1.blur, d))));

  col += layer1.enabled ? layer1Col : disabled;
}

void doLayer2(in vec4 uv, inout vec3 col)
{
  vec3 grad;
  float noise = snoise(vec3(uv.xy, time.x), grad);
  noise *= 0.4;
  noise = smoothstep(-1.,1., noise);
  vec4 rampSample = texture2D(ramp, vec2(noise + time.z *layer2.cycleSpeed  , .5));
  
  vec3 layer2Col = rampSample.rgb*noise*layer2.brightness;
  col.rgb += layer2.enabled ? layer2Col : disabled;

}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 st = (uv*resolution - vec2(.5, .5)*resolution)/resolution.y;

  uv += noiseDither*vec2(rand(uv), rand(uv + vec2(112.234,253.253)));
  uv *= .5;

 vec4 col = vec4(0.);
 col.a = 1.;

 doLayer1(vec4(uv, st), col.rgb);
 doLayer2(vec4(uv, st), col.rgb);

  col.rgb = saturate(col.rgb);
  gl_FragColor = col;

}
`

export { VertDefault, FragTest, FragAura, FragTexture }