import { LabColorSpace } from "./LabColorSpace"
import { Noise3DGrad } from "./noise/Noise3DGrad"

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

${Noise3DGrad}

// float fbm(vec2 n) {
// 	float total = 0.0, amplitude = 0.1;
// 	for (int i = 0; i < 7; i++) {
// 		total += noise(n) * amplitude;
// 		n = m * n;
// 		amplitude *= 0.4;
// 	}
// 	return total;
// }

uniform vec2 resolution;
uniform float time;
uniform sampler2D ramp;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 st = (uv*resolution - vec2(.5, .5)*resolution)/resolution.y;

  uv *= .5;

  vec3 grad;
  vec3 grad2;

  float noise = snoise(vec3(uv, time), grad);
  float noise2 = snoise(vec3((uv + vec2(12123.234,.235235))*.6, time), grad2);
  noise*=0.4;
  noise = smoothstep(-1.,1., noise);
  
  vec4 col = vec4(0.);

  col.a = 1.;

  vec3 pos = vec3(uv*2., noise);

  float dot = dot(normalize(grad), vec3(0.,0., 1.));

  vec4 rampSample = texture2D(ramp, vec2(noise + dot*.5  , .5));
  vec4 rampSample2 = texture2D(ramp, vec2(1.-noise2, .5));
  col.rgb = rampSample.rgb*noise;
  // col.rgb = mix(col.rgb, rampSample2.rgb, noise2);

  col.rgb = clamp(col.rgb, 0.,1.);

  gl_FragColor = col;
  // gl_FragColor = texture2D(ramp, uv);
  // gl_FragColor = vec4(vec3(noise), 1.);
  // gl_FragColor = vec4( grad, 1.);
  // gl_FragColor = vec4(dot, dot, dot, 1);
  // gl_FragColor = vec4(length(st), 0, 1, 1);
}
`

export { VertDefault, FragTest, FragAura, FragTexture }