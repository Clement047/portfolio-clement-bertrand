import * as THREE from 'three';
// One draw call: local, depth-tested mist instead of an expensive volume pass.
export function createMistBanks(scene){
  const banks=[[14,2.4,-64,36,9],[30,2.4,-85,32,8],[-15,2.4,-45,38,9],[50,2,-36,24,5],[-12,2,-115,28,7],[12,2,-132,26,7],[-17,3,-154,32,8],[0,3,-180,40,9],[28,2,-110,30,6],[-25,2,-80,28,6],[50,2,-20,22,5],[0,4,-210,45,12]];
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,uniforms:{time:{value:0},color:{value:new THREE.Color('#40536b')}},vertexShader:`varying vec2 vUv;varying float vDistance;void main(){vUv=uv;vec4 center=modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.);vec2 size=vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));vec3 right=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);vec3 world=center.xyz+right*position.x*size.x+vec3(0.,position.y*size.y,0.);vDistance=distance(cameraPosition,world);gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,fragmentShader:`uniform float time;uniform vec3 color;varying vec2 vUv;varying float vDistance;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
void main(){vec2 p=vUv*2.-1.;float edge=pow(max(0.,1.-dot(p,p)),1.8);float n=.65*noise(vUv*vec2(5.,3.)+vec2(time*.018,0.))+.35*noise(vUv*vec2(11.,6.)-vec2(time*.009,0.));float alpha=edge*(.10+.23*n)*smoothstep(3.,15.,vDistance)*(1.-smoothstep(150.,260.,vDistance));vec3 tint=mix(color*vec3(.78,1.02,1.14),color*vec3(1.12,.80,1.30),smoothstep(.15,.9,vUv.x));gl_FragColor=vec4(tint,alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
  const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),material,banks.length);mesh.name='CITY_Local_Atmospheric_Mist';mesh.frustumCulled=false;mesh.renderOrder=2;
  const matrix=new THREE.Matrix4();banks.forEach(([x,y,z,w,h],i)=>{matrix.makeScale(w,h,1);matrix.setPosition(x,y,z);mesh.setMatrixAt(i,matrix);});scene.add(mesh);
  return {update(t){material.uniforms.time.value=t;},dispose(){scene.remove(mesh);mesh.geometry.dispose();material.dispose();}};
}

// Sparse illuminated dust, localized to nearby streets rather than a full-screen particle veil.
export function createLightMotes(scene){
  const positions=new Float32Array(96*3);
  for(let i=0;i<96;i++){positions[i*3]=-22+((i*43)%83);positions[i*3+1]=1.2+((i*17)%90)/10;positions[i*3+2]=-12-((i*37)%150);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,uniforms:{time:{value:0}},vertexShader:`uniform float time;varying float visibility;varying float hue;
  void main(){vec3 p=position;p.x+=sin(time*.12+position.z)*.3;p.y+=sin(time*.16+position.x)*.25;vec4 mv=modelViewMatrix*vec4(p,1.);float d=length(mv.xyz);visibility=smoothstep(1.,5.,d)*(1.-smoothstep(20.,48.,d));hue=fract(position.x*.13);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(38./max(d,1.),1.,2.4);}`,fragmentShader:`varying float visibility;varying float hue;void main(){float r=length(gl_PointCoord-.5);float alpha=(1.-smoothstep(.05,.5,r))*visibility*.19;gl_FragColor=vec4(mix(vec3(.15,.32,.48),vec3(.32,.18,.44),hue),alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`});
  const points=new THREE.Points(geometry,material);points.name='CITY_Local_Light_Motes';points.frustumCulled=false;scene.add(points);
  return {update(time){material.uniforms.time.value=time;},dispose(){scene.remove(points);geometry.dispose();material.dispose();}};
}
