import { Random } from "./include/noise/Random"
import { LabColorSpace } from './include/LabColorSpace'
import { Saturate } from './include/Saturate'
let FragComp = `
#version 300 es


#if __VERSION__ > 130
#define texture2D texture
#endif


precision mediump float;

out vec4 FragColor;

${Saturate}
${Random}
${LabColorSpace}

uniform float noiseDither;

uniform vec2 resolution;
uniform sampler2D backBuffer;


uniform sampler2D ramp;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  uv += noiseDither*vec2(rand(uv), rand(uv + vec2(112.234,253.253)));

  vec4 lastCol = texture2D(backBuffer, uv);
  vec4 colOut;
  colOut.a = 1.;

  colOut.rgb = lastCol.rgb;

  // linear to gamma
  // colOut.rgb = pow( colOut.rgb, vec3(0.4545) );

  FragColor = colOut;
}

`

export default FragComp