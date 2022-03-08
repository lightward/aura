let OpenSimplex2f = `
// Included to use integer seed value to generate noise

// https://gist.github.com/KdotJPG/67f847a9d5c89b9ad82cab673cdf1929
// MIT for now, will Public Domain when I post to OpenSimplex2 repo!

vec4 intToSeedVec(uint seed) {
    vec4 iSeedVec = vec4((seed / uvec4(1, 256, 65536, 16777216)) & uvec4(255));
    return trunc(iSeedVec * (1.0 / 9.0)) * 10.0 + fract(iSeedVec * (1.0 / 9.0)) * 9.0 + 1.0; // Skip multiples of 9
}

vec4 permute(vec4 t, float seedPart) {
    return t * (t * 27.0 + seedPart);
}

float permute(float t, float seedPart) {
    return t * (t * 27.0 + seedPart);
}

vec4 mod639(vec4 t) {
    return t - floor(t * (1.0 / 639.0)) * 639.0;
}

float mod639(float t) {
    return t - floor(t * (1.0 / 639.0)) * 639.0;
}

vec4 pmod639(vec4 t) {
    return t - trunc(t * (1.0 / 639.0)) * 639.0;
}

float pmod639(float t) {
    return t - trunc(t * (1.0 / 639.0)) * 639.0;
}

vec4 grad(float index) {
    vec4 p0123 = index * (1.0 / vec4(2.0, 4.0, 8.0, 16.0));
    vec3 p4_i45 = index * (1.0 / vec3(32.0, 128.0, 640.0));
    p0123 = trunc((p0123 - trunc(p0123)) * 2.0) - 0.5;
    p4_i45 = trunc((p4_i45 - trunc(p4_i45)) * vec3(2.0, 4.0, 5.0)) - vec3(0.5, 0.0, 0.0);
    p4_i45.y += p4_i45.z;
    p4_i45.y -= step(5.0, p4_i45.y) * 5.0;
    p0123 *= vec4(equal(notEqual(vec4(p4_i45.y), vec4(0.0, 1.0, 2.0, 3.0)), notEqual(vec4(p4_i45.z), vec4(0.0, 1.0, 2.0, 3.0))));
    p4_i45.x *= float(all(notEqual(p4_i45.yz, vec2(4.0)))) * 1.2071067811865475;
    p0123 += vec4(equal(vec4(p4_i45.y), vec4(0.0, 1.0, 2.0, 3.0))) - vec4(equal(vec4(p4_i45.z), vec4(0.0, 1.0, 2.0, 3.0)));
    p4_i45.x += dot(vec2(equal(p4_i45.yz, vec2(4.0))), vec2(1.2071067811865475, -1.2071067811865475));
    return p0123 + dot(p0123, vec4(-0.138196601125011)) + p4_i45.x * 0.44721359549995793928183473374626;
}

float opensimplex2f(vec4 X, vec4 seedVec) {
	vec4 Xs = X + dot(X, vec4(-0.138196601125011));

	vec4 Xsb = floor(Xs);
	vec4 Xsi = Xs - Xsb;

	float siSum = dot(Xsi, vec4(1.0));
	float firstLattice = trunc(siSum * 1.25);
	vec3 startValues = firstLattice * vec3(-128.0, -0.2, -0.8);

	Xsb += startValues.xxxx;
	Xsi += startValues.yyyy;
	siSum += startValues.z;
	vec4 latticeCoordOffsets = vec4(equal(vec4(0.0, 1.0, 2.0, 3.0), vec4(firstLattice))) * -641.0 + 128.0;

	vec4 vertex0 = vec4(greaterThanEqual(Xsi, max(max(Xsi.yzwx, Xsi.zwxy), max(Xsi.wxyz, vec4(1.0 - siSum)))));
	vec4 vh0 = Xsb + vertex0;
	Xsb = vh0 + latticeCoordOffsets.xxxx; Xsi -= vertex0; siSum = dot(Xsi, vec4(1.0));
	vec4 d0 = Xsi + siSum * 0.309016994374947;
	Xsi += 0.2; siSum += 0.8;

	vec4 vertex1 = vec4(greaterThanEqual(Xsi, max(max(Xsi.yzwx, Xsi.zwxy), max(Xsi.wxyz, vec4(1.0 - siSum)))));
	vec4 vh1 = Xsb + vertex1;
	Xsb = vh1 + latticeCoordOffsets.yyyy; Xsi -= vertex1; siSum = dot(Xsi, vec4(1.0));
	vec4 d1 = Xsi + siSum * 0.309016994374947;
	Xsi += 0.2; siSum += 0.8;

	vec4 vertex2 = vec4(greaterThanEqual(Xsi, max(max(Xsi.yzwx, Xsi.zwxy), max(Xsi.wxyz, vec4(1.0 - siSum)))));
	vec4 vh2 = Xsb + vertex2;
	Xsb = vh2 + latticeCoordOffsets.zzzz; Xsi -= vertex2; siSum = dot(Xsi, vec4(1.0));
	vec4 d2 = Xsi + siSum * 0.309016994374947;
	Xsi += 0.2; siSum += 0.8;

	vec4 vertex3 = vec4(greaterThanEqual(Xsi, max(max(Xsi.yzwx, Xsi.zwxy), max(Xsi.wxyz, vec4(1.0 - siSum)))));
	vec4 vh3 = Xsb + vertex3;
	Xsb = vh3 + latticeCoordOffsets.wwww; Xsi -= vertex3; siSum = dot(Xsi, vec4(1.0));
	vec4 d3 = Xsi + siSum * 0.309016994374947;
	Xsi += 0.2; siSum += 0.8;

	vec4 vertex4 = vec4(greaterThanEqual(Xsi, max(max(Xsi.yzwx, Xsi.zwxy), max(Xsi.wxyz, vec4(1.0 - siSum)))));
	vec4 vh4 = Xsb + vertex4;
	Xsi -= vertex4; siSum = dot(Xsi, vec4(1.0));
	vec4 d4 = Xsi + siSum * 0.309016994374947;

	vec4 h0123 = permute(mod639(vec4(vh0.x, vh1.x, vh2.x, vh3.x)), seedVec.x);
	h0123 = permute(mod639(h0123 + vec4(vh0.y, vh1.y, vh2.y, vh3.y)), seedVec.y);
	h0123 = permute(mod639(h0123 + vec4(vh0.z, vh1.z, vh2.z, vh3.z)), seedVec.z);
	h0123 = pmod639(permute(mod639(h0123 + vec4(vh0.w, vh1.w, vh2.w, vh3.w)), seedVec.w));

	float h4 = permute(mod639(vh4.x), seedVec.x);
	h4 = permute(mod639(h4 + vh4.y), seedVec.y);
	h4 = permute(mod639(h4 + vh4.z), seedVec.z);
	h4 = pmod639(permute(mod639(h4 + vh4.w), seedVec.w));

	vec4 g0 = grad(h0123.x);
	vec4 g1 = grad(h0123.y);
	vec4 g2 = grad(h0123.z);
	vec4 g3 = grad(h0123.w);
	vec4 g4 = grad(h4);

	/*vec4 norm = inversesqrt(vec4(dot(g0, g0), dot(g1, g1), dot(g2, g2), dot(g3, g3)));
	g0 *= norm.x; g1 *= norm.y; g2 *= norm.z; g3 *= norm.w; g4 *= inversesqrt(dot(g4, g4));*/

	// "Proper" constant is 0.5. 0.6 produces subtle invisible discontinuities, but looks much better.
	vec4 a0123 = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
	float a4 = max(0.6 - dot(d4, d4), 0.0);
	vec4 r0123 = vec4(dot(d0, g0), dot(d1, g1), dot(d2, g2), dot(d3, g3));
	float r4 = dot(d4, g4);
	a0123 *= a0123; a4 *= a4;
	return (dot(a0123 * a0123, r0123) + a4 * a4 * r4) * 27.0; // TODO compute tighter normalization constant.
}

float opensimplex2f(vec4 X) {
    return opensimplex2f(X, vec4(1.0));
}
`;

export { OpenSimplex2f };
