import {Kernel_13} from './blur/Blur';

let FragBlur = `
#version 300 es
#if __VERSION__ > 130
#define texture2D texture
#endif

precision mediump float;


uniform vec2 resolution;
uniform sampler2D iChannel0;
uniform vec2 direction;
out vec4 FragColor;

${Kernel_13}


void main(){
    vec2 uv = gl_FragCoord.xy / resolution;

    FragColor = blur(iChannel0, uv, resolution.xy, direction);
}
`;

export {FragBlur};
