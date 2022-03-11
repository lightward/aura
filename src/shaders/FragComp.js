import { Random } from './include/noise/Random';
import { LabColorSpace } from './include/LabColorSpace';
import { Saturate } from './include/Saturate';
let FragComp = `
#version 300 es


#if __VERSION__ > 130
#define texture2D texture
#endif


precision mediump float;

out vec4 FragColor;

${Saturate}
${Random}

uniform float noiseDither;

uniform vec2 resolution;
uniform sampler2D backBuffer;

uniform float saturation;
uniform float contrast;


uniform sampler2D ramp;
uniform bool displayGradient;

mat4 brightnessMatrix( float brightness )
{
    return mat4( 1, 0, 0, 0,
                 0, 1, 0, 0,
                 0, 0, 1, 0,
                 brightness, brightness, brightness, 1 );
}

mat4 contrastMatrix( float c )
{
	float t = ( 1.0 - c ) / 2.0;

    return mat4( c, 0, 0, 0,
                 0, c, 0, 0,
                 0, 0, c, 0,
                 t, t, t, 1 );

}

mat4 saturationMatrix( float s )
{
    vec3 luminance = vec3( 0.3086, 0.6094, 0.0820 );

    float oneMinusSat = 1.0 - s;

    vec3 red = vec3( luminance.x * oneMinusSat );
    red+= vec3( s, 0, 0 );

    vec3 green = vec3( luminance.y * oneMinusSat );
    green += vec3( 0, s, 0 );

    vec3 blue = vec3( luminance.z * oneMinusSat );
    blue += vec3( 0, 0, s );

    return mat4( red,     0,
                 green,   0,
                 blue,    0,
                 0, 0, 0, 1 );
}

void drawRamp(inout vec4 col, vec2 uv, vec2 size)
{

  uv.y = 1. - uv.y;
  vec2 rampUV = uv*(1./size);

  float insideRamp = displayGradient ? step(uv.x, size.x) * step(uv.y, size.y) : 0.0;
  vec4 rampSample = texture2D(ramp, rampUV*2.);
  col.rgb = mix(col.rgb, rampSample.rgb, insideRamp);// vec3(insideRamp);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  uv += noiseDither*vec2(rand(uv), rand(uv + vec2(112.234,253.253)));


  vec4 lastCol = texture2D(backBuffer, uv);
  vec4 colOut;
  colOut.a = 1.;

  colOut = contrastMatrix(contrast)*saturationMatrix(saturation)*lastCol;

  // linear to gamma
  // colOut.rgb = pow( colOut.rgb, vec3(0.4545) );

  drawRamp(colOut, uv, vec2(.5,.2));
  FragColor = colOut;
}

`;

export default FragComp;
