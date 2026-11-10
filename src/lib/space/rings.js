import * as THREE from 'three';
// Analytic sphere shadow avoids shadow-map self-intersection on this very thin ring mesh.
export function createSaturnRings(rings,globe,sun){
 const original=rings.material,center=globe.getWorldPosition(new THREE.Vector3()),direction=sun.getWorldPosition(new THREE.Vector3()).sub(sun.target.getWorldPosition(new THREE.Vector3())).normalize();
 const material=new THREE.ShaderMaterial({side:THREE.DoubleSide,transparent:true,depthWrite:true,uniforms:{surface:{value:original.map},tint:{value:original.color.clone()},planetCenter:{value:center},sunDirection:{value:direction},planetRadius:{value:18*globe.getWorldScale(new THREE.Vector3()).x}},vertexShader:`varying vec2 ringUv;varying vec3 worldP;varying vec3 worldN;void main(){ringUv=uv;worldP=(modelMatrix*vec4(position,1.)).xyz;worldN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*vec4(worldP,1.);}`,fragmentShader:`uniform sampler2D surface;uniform vec3 tint,planetCenter,sunDirection;uniform float planetRadius;varying vec2 ringUv;varying vec3 worldP,worldN;void main(){vec4 albedo=texture2D(surface,ringUv);if(albedo.a<.02)discard;vec3 q=worldP-planetCenter;float along=dot(q,sunDirection);float distanceSquared=dot(q,q)-along*along;float shadow=(1.-smoothstep(planetRadius*planetRadius*.98,planetRadius*planetRadius*1.02,distanceSquared))*step(along,0.);float incidence=abs(dot(normalize(worldN),sunDirection));vec3 lit=albedo.rgb*tint*vec3(.15,.35,.8)*(.025+(1.-shadow)*(.09+.5*incidence));gl_FragColor=vec4(lit,albedo.a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});rings.material=material;rings.castShadow=false;rings.receiveShadow=false;
 return {dispose(){material.dispose();original.dispose();}};
}
