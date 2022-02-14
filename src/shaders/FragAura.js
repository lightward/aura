import { Cellular2x2x2 } from "./include/noise/Cellular2x2x2"
import { Cellular3D } from "./include/noise/Cellular3D"
import { Noise3D } from "./include/noise/Noise3d"
import { Noise3DGrad } from "./include/noise/Noise3DGrad"
import { Random } from "./include/noise/Random"
import { Saturate } from "./include/Saturate"
import { Shapes } from "./include/shapes/Shapes"


let Includes = `
${Shapes}
${Random}
${Noise3DGrad}
${Noise3D}
${Saturate}
${Cellular2x2x2}
${Cellular3D}

#define TO_FLOAT (1./255.0)

#define sin01(x) (sin(x)*.5)+.5

#define disabled vec3(0.0)

`

let Types = `

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

struct Feedback
{
  float amount;
  float scaleX;
  float scaleY;
  float centerX;
  float centerY;
};

`


let Uniforms = `
uniform vec2 resolution;
uniform vec4 time; // [time, time/2, time*2, time/10]
uniform sampler2D ramp;
uniform Layer1 layer1;
uniform Layer2 layer2;
uniform Feedback feedback;

uniform sampler2D backBufferTex;

uniform float noiseDither;

// uniform float feedback;

out vec4 FragColor;
in vec4 fragUV;
`

let Layer1 = `
vec3 doLayer1(in vec4 uv, inout vec3 col)
{
  vec2 st = uv.zw;
  st *= sin(time.x);

  float sk = .1*sin(time.y*1.56);

  float d = sdParallelogram(st + vec2(sin(time.z), sin(time.y*1.4)), .4, .1, sk);
  float d2 = sdRhombus(st + vec2(sin(time.z*.85 + 12.23), sin(time.y)), vec2(1.,1.));
  
  float noise = snoise(vec3(uv.xy, time.x));
  float dMix = smoothstep(.0,.2, mix(d,d2, sin01(time.y) ));

  dMix+=layer1.blobbyness*noise;
  d += noise*layer1.blobbyness;

  vec3 layer1Col = layer1.brightness*(mix(layer1.color1*TO_FLOAT, layer1.color2*TO_FLOAT, saturate(smoothstep(-layer1.blur, layer1.blur, dMix))));

  layer1Col = layer1.enabled ? layer1Col : disabled;
  col += layer1Col;

  return layer1Col;
}
`

let Layer2 = `
vec3 doLayer2(in vec4 uv, inout vec3 col)
{
  
  vec3 grad;
  float noise = snoise(vec3(uv.xy, time.x), grad);
  noise *= 0.4;
  noise = smoothstep(-1.,1., noise);
  vec4 rampSample = texture2D(ramp, vec2(noise + time.z *layer2.cycleSpeed + rand(uv.xy)*.01  , .5));
  
  vec3 layer2Col = rampSample.rgb*noise*layer2.brightness;
  vec3 color = layer2.enabled ? layer2Col : disabled;
  col.rgb += color;

  return color;

}
`

let ScaleUV = `

vec2 scaleUV(vec2 uv, vec2 scaleFactor, vec2 center)
{
 return ( uv - center)*scaleFactor  + center;
}
`


let FragAura = `
#version 300 es

#if __VERSION__ > 130
#define texture2D texture
#endif

precision mediump float;

${Includes}
${Types}
${Uniforms}

${Layer1}
${Layer2}
${ScaleUV}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 uvOrig = uv;
  vec2 st = (uv*resolution - vec2(.5, .5)*resolution)/resolution.y;

  // Init output
  vec4 col = vec4(0.);
  col.a = 1.;

  // Calculate layers
  vec3 l1 = doLayer1(vec4(uv, st), col.rgb);
  vec3 l2 = doLayer2(vec4(uv, st), col.rgb);

  // Comp Layers
  col.rgb = l1 + l2;

  // Feedback stage
  vec3 grad;
  float noise = snoise(vec3(uv.xy, time.x)*.5, grad);

  vec4 lastFrame = texture2D(backBufferTex, uv+ grad.xy*.1);
  col.rgb += lastFrame.rgb*feedback.amount;

  // Clamp color values
  col.rgb = saturate(col.rgb);

  FragColor = col;
}
`

export default FragAura