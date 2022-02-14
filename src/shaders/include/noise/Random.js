let Random = `
#ifndef RAND
#define RAND
float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}
#endif

#ifndef HASH_3
#define HASH_3

// vec3 hash( vec3 x, int k )
// {
//     x = ((x>>8U)^x.yzx)*k;
//     x = ((x>>8U)^x.yzx)*k;
//     x = ((x>>8U)^x.yzx)*k;
    
//     return vec3(x)*(1.0/float(0xffffffffU));
// }

#endif

`

export { Random }