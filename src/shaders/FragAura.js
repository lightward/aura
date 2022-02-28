import { Cellular2x2x2 } from "./include/noise/Cellular2x2x2"
import { Cellular3D } from "./include/noise/Cellular3D"
import { Noise3D } from "./include/noise/Noise3d"
import { Noise3DGrad } from "./include/noise/Noise3DGrad"
import { OpenSimplex2f } from "./include/noise/OpenSimplex2f"
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
${Random}
${OpenSimplex2f}

#define TO_FLOAT (1./255.0)

#define sin01(x) (sin(x)*.5)+.5

#define disabled vec3(0.0)

`

let Types = `

struct Layer1
{
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
  float dist;
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

uniform uint seed;

out vec4 FragColor;
in vec4 fragUV;
`

let Layer1 = `
vec3 doLayer1(in vec4 uv, in vec2 n, inout vec3 col)
{
  vec2 st = uv.zw;
  // st *= sin(time.x);
  float p1 = hash(seed + uint(156));
  float p2 = hash(seed + uint(12355));
  float p3 = hash(seed + uint(62435));

  float s1 = 2.*(p1-.5);
  float s2 = 2.*(p2-.5);
  float s3 = 2.*(p3 - .5);


st = scale(st, 2.);
  float sk = .1*sin(time.y*1.56 + p2);

  float d = sdParallelogram(st + vec2(sin(time.z) + s1, sin(time.y*1.4) + s2), .4, .1, sk);
  float d2 = sdRhombus(translate(rotate(scale( translate(st, vec2(s2, s3)*vec2(.5, .2)) , 4.*p1), p3*30.*DEG2RAD), vec2(0.,0.)), vec2(1.,1.));
  float d3 = sdEquilateralTriangle(rotate(scale(st,4.*p1+sin(time.x)), 90.*p2*DEG2RAD + time.z/5.));
  
  float noise = snoise(vec3(uv.xy, time.x));
  float dMix = smoothstep(.0,.2, mix(d,d2, sin01(time.y  + p3*TWOPI ) ));

  dMix = sminCubic(d,d2,.5);
  dMix = sminCubic(sminCubic(d,d2, .5), d3, .5);

  dMix+=layer1.blobbyness*noise;
  d += noise*layer1.blobbyness;

  vec4 rampSample = texture2D(ramp, vec2(time.z *layer2.cycleSpeed + p2 + length(st)*.2  , .5));


  vec3 layer1Col = layer1.brightness*rampSample.rgb*saturate(1.-smoothstep(-layer1.blur,layer1.blur, dMix));//(mix(layer1.color1*TO_FLOAT, layer1.color2*TO_FLOAT, saturate(smoothstep(-layer1.blur, layer1.blur, dMix))));

  layer1Col = layer1.enabled ? layer1Col : disabled;
  col += layer1Col;

  return layer1Col;
}
`

let Layer2 = `
vec3 doLayer2(in vec4 uv, in vec2 n, inout vec3 col)
{
  float p1 = hash(seed + uint(98765));

  vec3 grad;
  float noise = snoise(vec3(uv.xy, time.x), grad);
  noise *= 0.4;
  noise = smoothstep(-1.,1., noise);
  vec4 rampSample = texture2D(ramp, vec2( time.z *layer2.cycleSpeed + p1 + rotate(uv.xy*.5, time.x*DEG2RAD).x  , .5));
  
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

  vec2 n = vec2(
    opensimplex2f(vec4(uv*10., time.x, time.y), intToSeedVec(uint(seed))),
    opensimplex2f(vec4(1.), intToSeedVec(uint(seed)))
  ) ;

  // Init output
  vec4 col = vec4(0.);
  col.a = 1.;

  // Calculate layers
  vec3 l1 = doLayer1(vec4(uv, st), n, col.rgb);
  vec3 l2 = doLayer2(vec4(uv, st), n, col.rgb);

  // Comp Layers
  col.rgb = l1 + l2;

  // Feedback stage
  vec3 grad;
  float noise = snoise(vec3(uv.xy, time.x)*.5, grad);

  vec4 lastFrame = texture2D(backBufferTex, uv+ grad.xy*feedback.dist);
  col.rgb += lastFrame.rgb*feedback.amount;

  // Clamp color values
  col.rgb = saturate(col.rgb);

  FragColor = col;
  // FragColor = lastFrame;
}
`

export default FragAura