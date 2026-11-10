import * as THREE from 'three';
export function createParallaxStars(scene){
 const n=2200,p=new Float32Array(n*3),colors=new Float32Array(n*3),sizes=new Float32Array(n),seeds=new Float32Array(n);let state=2049;
 const random=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};
 for(let i=0;i<n;i++){
  const theta=random()*Math.PI*2,latitude=Math.asin(random()*2-1),r=i<160?250+random()*450:i<900?750+random()*800:1600+random()*1300;
  p[i*3]=Math.cos(theta)*Math.cos(latitude)*r;p[i*3+1]=Math.sin(latitude)*r;p[i*3+2]=Math.sin(theta)*Math.cos(latitude)*r;
  const c=new THREE.Color().setRGB(.55+random()*.35,.58+random()*.3,.78+random()*.35);if(i%7===0)c.setRGB(.62,.4,.95);c.toArray(colors,i*3);sizes[i]=.7+random()*.9;seeds[i]=random()*20;
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.setAttribute('starSize',new THREE.BufferAttribute(sizes,1));g.setAttribute('seed',new THREE.BufferAttribute(seeds,1));
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,toneMapped:false,uniforms:{time:{value:0},pixelRatio:{value:1}},vertexShader:`attribute vec3 color;attribute float starSize;attribute float seed;varying vec3 tint;varying float phase;uniform float pixelRatio;void main(){tint=color;phase=seed;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(starSize*650./max(1.,-mv.z),.65,2.15)*pixelRatio;}`,fragmentShader:`varying vec3 tint;varying float phase;uniform float time;void main(){vec2 p=gl_PointCoord-.5;float r=length(p);float core=1.-smoothstep(.10,.48,r);float intensity=.88+.06*sin(time*.35+phase);gl_FragColor=vec4(tint,core*intensity*.85);
#include <colorspace_fragment>
}`});
 const points=new THREE.Points(g,m);points.name='SPACE_Depth_Layered_Stars';points.frustumCulled=false;scene.add(points);
 return {update(time,ratio=1,cameraPosition=null){if(cameraPosition)points.position.copy(cameraPosition).multiplyScalar(.85);m.uniforms.time.value=time;m.uniforms.pixelRatio.value=Math.min(ratio,1.5);},dispose(){scene.remove(points);g.dispose();m.dispose();}};
}
export function animateNebulaDome(mesh){
 const material=mesh.material;mesh.renderOrder=-100;material.depthWrite=false;material.depthTest=false;
 const time={value:0};material.onBeforeCompile=shader=>{shader.uniforms.spaceNebulaTime=time;shader.fragmentShader='uniform float spaceNebulaTime;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
 vec2 nebulaUv=vMapUv+vec2(sin(vMapUv.y*6.283+spaceNebulaTime*.012),cos(vMapUv.x*6.283-spaceNebulaTime*.009))*.002;
 vec4 nebulaSample=texture2D(map,nebulaUv);
 float nebulaEnergy=dot(nebulaSample.rgb,vec3(.2126,.7152,.0722));
 vec3 nebulaTint=mix(vec3(.85,.92,1.08),vec3(1.13,.78,1.18),smoothstep(.12,.72,vMapUv.x));
 diffuseColor*=vec4(nebulaSample.rgb*mix(vec3(1.),nebulaTint,smoothstep(.02,.25,nebulaEnergy)),nebulaSample.a);
 #endif`);};material.customProgramCacheKey=()=> 'space-nebula-slow-drift-v3';material.needsUpdate=true;
 return {update(t){time.value=t;}};
}
