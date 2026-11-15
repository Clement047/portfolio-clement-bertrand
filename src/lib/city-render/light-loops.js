import { ShaderChunk } from 'three';

// Three.js unrolls its light loops: with the city's ~30 lights, every lit shader
// carries ~30 inlined copies of the physical BRDF. Direct3D's compiler (Chrome and
// Edge on Windows, through ANGLE) then needs seconds per program, which made a
// first visit wait close to a minute before the city could be entered.
//
// Point lights without shadows and rect-area lights index plain uniform arrays, so
// they can stay as real loops: the same calls, in the same order, with the same
// values. Only the shader text shrinks; the rendered image is unchanged. Loops that
// sample shadow maps (spot/directional, or point lights with shadows) keep three's
// unrolled code, because sampler arrays need constant indices in GLSL ES 3.0.

const POINT_UNROLLED = `#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start`;

const POINT_LOOP = `#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct ) && !( defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0 )
	PointLight pointLight;
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
#elif ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start`;

const RECT_UNROLLED = `	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end`;

const RECT_LOOP = `	RectAreaLight rectAreaLight;
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}`;

let applied = false;

// Returns true when both loops were rewritten. If a future three.js release changes
// these chunks, nothing is modified and the original unrolled code is kept.
export function useCompactLightLoops() {
  if (applied) return true;
  const source = ShaderChunk.lights_fragment_begin;
  if (!source.includes(POINT_UNROLLED) || !source.includes(RECT_UNROLLED)) {
    console.warn('Boucles de lumières three.js non reconnues : code d’origine conservé.');
    return false;
  }
  ShaderChunk.lights_fragment_begin = source.replace(POINT_UNROLLED, POINT_LOOP).replace(RECT_UNROLLED, RECT_LOOP);
  applied = true;
  return true;
}
