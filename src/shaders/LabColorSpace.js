let LabColorSpace = `
#ifndef __LAB_COLORSPACE__
#define __LAB_COLORSPACE__

#ifndef saturate
#define saturate(v) clamp(v, 0.,1.)
#endif

//Lifted from https://code.google.com/p/flowabs/source/browse/glsl/?r=f36cbdcf7790a28d90f09e2cf89ec9a64911f138

vec3 lab2xyz( vec3 c ) {
    float fy = ( c.x + 16.0 ) / 116.0;
    float fx = c.y / 500.0 + fy;
    float fz = fy - c.z / 200.0;
    return vec3(
         95.047 * (( fx > 0.206897 ) ? fx * fx * fx : ( fx - 16.0 / 116.0 ) / 7.787),
        100.000 * (( fy > 0.206897 ) ? fy * fy * fy : ( fy - 16.0 / 116.0 ) / 7.787),
        108.883 * (( fz > 0.206897 ) ? fz * fz * fz : ( fz - 16.0 / 116.0 ) / 7.787)
    );
}

vec3 xyz2rgb( vec3 c ) {
    vec3 v =  c / 100.0 * mat3( 
        3.2406, -1.5372, -0.4986,
        -0.9689, 1.8758, 0.0415,
        0.0557, -0.2040, 1.0570
    );
    vec3 r;
    r.x = ( v.r > 0.0031308 ) ? (( 1.055 * pow( v.r, ( 1.0 / 2.4 ))) - 0.055 ) : 12.92 * v.r;
    r.y = ( v.g > 0.0031308 ) ? (( 1.055 * pow( v.g, ( 1.0 / 2.4 ))) - 0.055 ) : 12.92 * v.g;
    r.z = ( v.b > 0.0031308 ) ? (( 1.055 * pow( v.b, ( 1.0 / 2.4 ))) - 0.055 ) : 12.92 * v.b;
    return r;
}

vec3 lab2rgb(vec3 c) {
    return xyz2rgb( lab2xyz( vec3(100.0 * c.x, 2.0 * 127.0 * (c.y - 0.5), 2.0 * 127.0 * (c.z - 0.5)) ) );
}

vec3 lab2rgb2(vec3 c)
{
    float l = c.r;
    float a = c.g;
    float b = c.b;

    vec3 rgb = vec3(0.);

    float y = (l+16.)/116.;
    float x = a/500. + y;
    float z = y - b/200.;

    y = pow(y, 3.) > 0.008856 ? pow(y,3.) : (y-16./116.)/7.787;
    x = pow(x, 3.) > 0.008856 ? pow(x,3.) : (x-16./116.)/7.787;
    z = pow(z, 3.) > 0.008856 ? pow(z,3.) : (z-16./116.)/7.787;

    x *= 95.047;
    y *= 100.;
    z *= 108.883;

    x /= 100.;
    y /= 100.;
    z /= 100.;

    float R = x *  3.2406 + y * -1.5372 + z * -0.4986;
    float G = x * -0.9689 + y *  1.8758 + z *  0.0415;
    float B = x *  0.0557 + y * -0.2040 + z *  1.0570;

    R = R > 0.0031308 ? 1.055 * pow(R , ( 1. / 2.4 ))  - 0.055 : 12.92 * R;
    G = G > 0.0031308 ? 1.055 * pow(G , ( 1. / 2.4 ))  - 0.055 : 12.92 * G;
    B = B > 0.0031308 ? 1.055 * pow(B , ( 1. / 2.4 ))  - 0.055 : 12.92 * B;

    return vec3(R, G, B);

}
#endif
`

export { LabColorSpace }