import * as THREE from 'three';
export function createSaturnAtmosphere(globe,sun){
 const light=new THREE.Vector3(-.5,.6,.5);if(sun){sun.updateWorldMatrix(true,true);light.copy(sun.getWorldPosition(new THREE.Vector3())).sub(sun.target.getWorldPosition(new THREE.Vector3())).normalize();}
 const material=new THREE.ShaderMaterial({transparent:true,side:THREE.BackSide,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,uniforms:{lightDirection:{value:light}},vertexShader:`varying vec3 worldP;varying vec3 worldN;void main(){worldP=(modelMatrix*vec4(position,1.)).xyz;worldN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*vec4(worldP,1.);}`,fragmentShader:`varying vec3 worldP;varying vec3 worldN;uniform vec3 lightDirection;void main(){vec3 n=normalize(worldN),v=normalize(cameraPosition-worldP);float rim=pow(1.-abs(dot(n,v)),4.5);float lit=.10+.90*smoothstep(-.12,.65,dot(n,lightDirection));vec3 color=mix(vec3(.25,.08,.8),vec3(.08,.42,.95),lit);gl_FragColor=vec4(color*1.8,rim*lit*.25);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 const halo=new THREE.Mesh(globe.geometry,material);halo.name='SPACE_Saturn_Atmospheric_Limb';halo.position.copy(globe.position);halo.quaternion.copy(globe.quaternion);halo.scale.copy(globe.scale).multiplyScalar(1.013);halo.renderOrder=1;globe.parent.add(halo);
 return {dispose(){halo.parent?.remove(halo);material.dispose();}};
}
