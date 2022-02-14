import { LabColorSpace } from "./include/LabColorSpace"
import { Random } from "./include/noise/Random"

let FragGradientLab = `
#version 300 es
precision highp float;

#define linearstep(edge0, edge1, x) min(max((x - edge0)/(edge1 - edge0), 0.0), 1.0)

${Random}
${LabColorSpace}
const int MAX_COLORS = 10;

uniform vec2 resolution;
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform vec3 color4;
uniform vec3 color5;

uniform vec3 colors[MAX_COLORS];

uniform int numColors;

in vec4 fragUV;
out vec4 FragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    uv.x += .001*rand(uv);

    vec3 c1 = color1 / vec3(255.0);
    vec3 c2 = color2 / vec3(255.0);
    vec3 c3 = color3 / vec3(255.);
    vec3 c4 = color4 / vec3(255.);
    vec3 c5 = color5 / vec3(255.);

    vec3 lab1 = rgb2lab(colors[0]/255.);
    vec3 lab2 = rgb2lab(colors[1]/255.);
    vec3 lab3 = rgb2lab(c3);
    vec3 lab4 = rgb2lab(c4);
    vec3 lab5 = rgb2lab(c5);

    float nCol= float(numColors);
    float step = 1./(nCol-1.);



    // vec3 labOut = oklab_mix(lab1, lab2, linearstep(0.*step, 1.*step, uv.x));
    float dither = rand(uv)*.001;
    vec3 col = mix(rgb2lab(colors[0]/255.), rgb2lab(colors[1]/255.), linearstep(0.*step, 1.*step, uv.x + dither));
    
    for(int i = 2; i < MAX_COLORS; i++)
    {
        // break early when done
        if(i >= numColors) break;

        vec3 nextLab = rgb2lab(colors[i]/255.);

        col = mix(col, nextLab, linearstep(float(i-1)*step, float(i)*step, uv.x)+ dither);
    }
    
    col = lab2rgb(col);
    // linear to gamma
    col = pow( col, vec3(0.4545) );


    FragColor.rgb = (col);
}
`

export { FragGradientLab }