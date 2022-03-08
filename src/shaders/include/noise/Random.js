let Random = `
#ifndef RAND
#define RAND
float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

float intRand(int n){
    n = (n >> 13) ^ n;
    int nn = (n * (n * n * 60493 + 19990303) + 1376312589) & 0x7fffffff;
    return 1.0 - (float(nn) / 1073741824.0);
  }

//   vec4 intToSeedVec(uint seed) {
//     vec4 iSeedVec = vec4((seed / uvec4(1, 256, 65536, 16777216)) & uvec4(255));
//     return trunc(iSeedVec * (1.0 / 9.0)) * 10.0 + fract(iSeedVec * (1.0 / 9.0)) * 9.0 + 1.0; // Skip multiples of 9
// }




#endif

#ifndef HASH_3
#define HASH_3

#define hashi(x)   lowbias32(x)
//  #define hashi(x)   triple32(x)

  #define hash(x)  ( float( hashi(x) ) / float( 0xffffffffU ) )

uint lowbias32(uint x)
{
    x ^= x >> 16;
    x *= 0x7feb352dU;
    x ^= x >> 15;
    x *= 0x846ca68bU;
    x ^= x >> 16;
    return x;
}

uint triple32(uint x)
{
    x ^= x >> 17;
    x *= 0xed5ad4bbU;
    x ^= x >> 11;
    x *= 0xac4c1b51U;
    x ^= x >> 15;
    x *= 0x31848babU;
    x ^= x >> 14;
    return x;
}



#endif

`;

export { Random };
