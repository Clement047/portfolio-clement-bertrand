import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {cappedPixelRatio,getQuality} from './render-quality.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';

export function mountMusicStudio(){
 const host=document.querySelector('[data-music-studio]');if(!host||host.dataset.mounted)return;host.dataset.mounted='true';
 const status=document.querySelector('[data-studio-status]'),panel=document.querySelector('.studio-glass');
 const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(cappedPixelRatio(1.5));renderer.setSize(innerWidth,innerHeight);renderer.toneMapping=THREE.AgXToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;host.append(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#02040b');scene.fog=new THREE.FogExp2(0x060b19,.018);
 const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.06,100);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.08);scene.environment=environment.texture;scene.environmentIntensity=.25;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0x6e91c6,0x080512,.26));RectAreaLightUniformsLib.init();
 const composer=new EffectComposer(renderer),renderPass=new RenderPass(scene,camera),bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.22,.45,1.1);
 const ripples=Array.from({length:8},()=>new THREE.Vector4(.5,.5,-100,0));
 const waves=new ShaderPass({uniforms:{tDiffuse:{value:null},time:{value:0},aspect:{value:innerWidth/innerHeight},ripples:{value:ripples}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform sampler2D tDiffuse;uniform float time,aspect;uniform vec4 ripples[8];varying vec2 vUv;
 void main(){vec2 uv=vUv;for(int i=0;i<8;i++){float age=time-ripples[i].z;if(age>0.&&age<3.2){vec2 q=vUv-ripples[i].xy;q.x*=aspect;float d=length(q),r=age*.42;float e=exp(-age*1.45)*exp(-pow((d-r)/.23,2.));vec2 dir=q/max(d,.02);dir.x/=aspect;uv+=dir*sin((d-r)*24.)*e*.009*ripples[i].w;}}gl_FragColor=texture2D(tDiffuse,clamp(uv,.001,.999));}`});
 waves.uniforms.ripples.value=ripples;
 const output=new OutputPass();composer.addPass(renderPass);composer.addPass(bloom);composer.addPass(waves);composer.addPass(output);
 let disposed=false,asset,animationFrame=0,lastDraw=0,lastTime=performance.now(),ready=false,hovered=null;
 let selectedTrack=localStorage.getItem('portfolio-track')||'encounters';const trackChanged=()=>selectedTrack=localStorage.getItem('portfolio-track')||'encounters';window.addEventListener('portfolio:select-track',trackChanged);
 const cards=[],spectra=[],extras=[],pivot=new THREE.Vector3(),basePosition=new THREE.Vector3(),baseQuaternion=new THREE.Quaternion(),right=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),normal=new THREE.Vector3();
 const desired=new THREE.Vector2(),angle=new THREE.Vector2(),yaw=new THREE.Quaternion(),pitch=new THREE.Quaternion(),rotation=new THREE.Quaternion(),arm=new THREE.Vector3(),mouse=new THREE.Vector2(2,2),ray=new THREE.Raycaster();
 let rippleIndex=0,lastRipple=0,lastPointer=new THREE.Vector2(-10,-10);
 const addExtra=o=>{extras.push(o);scene.add(o);return o;};
 const local=(x,y,z)=>pivot.clone().addScaledVector(right,x).addScaledVector(up,y).addScaledVector(normal,z);
 function draw(){if(!disposed&&ready){bloom.enabled=getQuality().bloom;composer.render();}}
 function resize(){camera.aspect=innerWidth/innerHeight;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(45)/2)*Math.max(1,1.55/camera.aspect)));camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);waves.uniforms.aspect.value=camera.aspect;draw();}
 function pointerMove(e){const x=e.clientX/innerWidth,y=1-e.clientY/innerHeight,now=performance.now();mouse.set(x*2-1,y*2-1);if(reduce)return;desired.set((x-.5)*.22,(y-.5)*.16);const movement=lastPointer.distanceTo(new THREE.Vector2(x,y));if(now-lastRipple>70&&movement>.018){ripples[rippleIndex].set(x,y,now/1000,Math.min(1,.4+movement*5));rippleIndex=(rippleIndex+1)%8;lastPointer.set(x,y);lastRipple=now;}}
 function selectedCard(event){const rect=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2),camera);const hit=ray.intersectObjects(cards,true)[0];return hit?.object.userData.track;}
 function select(event){const id=selectedCard(event);if(!id)return;localStorage.setItem('portfolio-track',id);window.dispatchEvent(new CustomEvent('portfolio:select-track',{detail:id}));document.querySelectorAll('[data-track]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.track===id)));}
 function pointerLeave(){desired.set(0,0);mouse.set(2,2);}
 window.addEventListener('pointermove',pointerMove,{passive:true});renderer.domElement.addEventListener('pointerleave',pointerLeave);renderer.domElement.addEventListener('click',select);window.addEventListener('resize',resize);
 new GLTFLoader().loadAsync('/models/music-studio.glb').then(async g=>{
  if(disposed)return;asset=g.scene;const box=new THREE.Box3().setFromObject(asset),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=18/Math.max(size.x,size.y,size.z);asset.position.copy(center).multiplyScalar(-scale);asset.scale.setScalar(scale);scene.add(asset);asset.updateMatrixWorld(true);
  let glass,mixer;const seen=new Set();
  asset.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material]){
   const n=m.name.toLowerCase();if(n.includes('mackie'))mixer=o;if(n.includes('translucent_glass'))glass=o;if(seen.has(m))continue;seen.add(m);m.vertexColors=false;
   if(n.includes('translucent_glass')){m.color.set('#477fa7');m.transparent=true;m.opacity=.12;m.depthWrite=false;m.roughness=.16;m.metalness=.15;o.castShadow=false;}
   else if(n.includes('wood_floor')){m.color.set('#292236');m.roughness=.78;m.metalness=0;}
   else if(n.includes('wood')){m.color.set(n.includes('speaker')?'#192237':'#332338');m.roughness=.49;m.metalness=.05;}
   else if(/silver|steel|reflective/.test(n)){m.color.set('#7e92ae');m.metalness=.72;m.roughness=.31;}
   else if(/mackie|keyboard_laptop|material4/.test(n)){m.color.set('#6b829d');m.roughness=.44;m.metalness=.18;if(m.map){m.emissiveMap=m.map;m.emissive.set('#4668aa');m.emissiveIntensity=.35;}}
   else if(/keys|white|gainsboro|lightgr/.test(n)){m.color.set(n==='keys'?'#a7bad0':'#26344a');m.roughness=.72;m.metalness=.04;}
   else if(/red|tan|olive/.test(n)){m.color.set('#291832');m.roughness=.86;m.metalness=0;}
   else{m.color?.set('#142034');m.roughness=.64;m.metalness=.10;}
   m.envMapIntensity=.5;for(const k of ['map','normalMap','roughnessMap'])if(m[k])m[k].anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  }});
  if(!glass)throw Error('Vitre du studio introuvable');
  const glassBounds=new THREE.Box3().setFromObject(glass),dimensions=glassBounds.getSize(new THREE.Vector3());pivot.copy(glassBounds.getCenter(new THREE.Vector3()));normal[dimensions.x<dimensions.z?'x':'z']=1;
  const desk=mixer?new THREE.Box3().setFromObject(mixer).getCenter(new THREE.Vector3()):new THREE.Vector3();if(desk.clone().sub(pivot).dot(normal)<0)normal.negate();
  const width=Math.max(dimensions.x,dimensions.z),height=dimensions.y,distance=width*1.25;camera.position.copy(pivot).addScaledVector(normal,distance);camera.position.y=pivot.y+.05;camera.lookAt(pivot);basePosition.copy(camera.position);baseQuaternion.copy(camera.quaternion);right.set(1,0,0).applyQuaternion(baseQuaternion);
  const key=addExtra(new THREE.SpotLight(0xa9d1ff,180,width*5,.7,1,2));key.position.copy(local(-width*.65,width*.6,width*.8));key.target.position.copy(desk);addExtra(key.target);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0005;key.shadow.normalBias=.025;
  for(const [x,y,z,color,intensity,w,h] of [[0,width*.4,width*.8,0x78aaff,3.5,width*.9,width*.45],[width*.65,width*.15,-width*.3,0x914dff,5,width*.35,width*.7],[-width*.5,0,-width*.2,0x268fff,4,width*.25,width*.6]]){const light=addExtra(new THREE.RectAreaLight(color,intensity,w,h));light.position.copy(local(x,y,z));light.lookAt(pivot);}
  const cabin=addExtra(new THREE.PointLight(0x6b55ff,65,width*3,2));cabin.position.copy(local(0,.8,-width*.45));
  const under=addExtra(new THREE.PointLight(0x298aff,22,width*1.2,2));under.position.copy(desk).addScaledVector(up,-.4).addScaledVector(normal,.3);
  // Thin light strips belong to the window frame, not a panel in front of the furniture.
  for(const side of [-1,1]){const strip=addExtra(new THREE.Mesh(new THREE.BoxGeometry(width*.98,.012,.014),new THREE.MeshBasicMaterial({color:new THREE.Color(side<0?0x4259ff:0x368aff).multiplyScalar(3),toneMapped:false})));strip.position.copy(local(0,side*(height*.5+.035),.015));strip.quaternion.copy(baseQuaternion);}
  const cardModuleUrl=new URL('/project-orbit/GlassVideoCardCore.js',location.origin).href;
  const {bindGlassCards}=await import(/* @vite-ignore */cardModuleUrl);if(disposed)return;const {GlassVideoCard}=bindGlassCards(THREE);
  const cardWidth=width*.38,aspect=2.2,cardHeight=cardWidth/aspect;
  const selections=[['encounters','Encounters',0x245fb8],['close-to-me','Close to me',0x6432ad],['alone-again','Alone again',0x4141ae],['night-trip','Night trip',0x235d9e]];
  for(let i=0;i<4;i++){
   const [id,title,tint]=selections[i],video=document.createElement('video'),card=new GlassVideoCard(video,{width:cardWidth,aspect,placeholder:true,title,tint,glass:1.05,titleDepth:.065,thickness:.11});
   card.position.copy(local((i%2-.5)*cardWidth*1.12,(i<2?1:-1)*cardHeight*.61,.16));card.quaternion.copy(baseQuaternion);card.rotateY((i%2===0?1:-1)*.055);card.rotateX((i<2?-1:1)*.02);
   card.userData.anchor=card.position.clone();card.userData.track=id;card.uniforms.uReveal.value=1;card.surfaces.position.y=0;card.traverse(o=>o.userData.track=id);
   card._edgeMat.transmission=.12;card._edgeMat.metalness=.35;card._edgeMat.roughness=.22;card._edgeMat.clearcoat=.9;card._edgeMat.emissive=new THREE.Color(tint);card._edgeMat.emissiveIntensity=.22;
   scene.add(card);cards.push(card);card.titlePromise.then(draw);
   const levels=new Float32Array(32),material=new THREE.ShaderMaterial({transparent:true,depthTest:true,depthWrite:false,toneMapped:false,uniforms:{levels:{value:levels},tint:{value:new THREE.Color(i%2?0xb18bff:0x64c9ff)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float levels[32];uniform vec3 tint;varying vec2 vUv;void main(){int i=int(min(31.,floor(vUv.x*32.)));float h=.045+levels[i]*.9;float bar=step(abs(vUv.y-.5)*2.,h)*(1.-smoothstep(.25,.46,abs(fract(vUv.x*32.)-.5)));gl_FragColor=vec4(tint*(.8+levels[i]),bar*.85);}'});
   const mesh=new THREE.Mesh(new THREE.PlaneGeometry(cardWidth*.84,cardHeight*.23),material);mesh.position.set(0,-cardHeight*.32,.085);mesh.userData.track=id;card.add(mesh);spectra.push({mesh,material,levels,id});
  }
  status.textContent='';panel.classList.add('studio-world-cards');host.querySelector('.studio-loading')?.remove();ready=true;renderer.shadowMap.needsUpdate=true;resize();
 }).catch(e=>{if(!disposed){host.querySelector('.studio-loading')?.remove();panel.classList.remove('studio-world-cards');status.textContent='Le studio 3D ne peut pas être affiché. Le choix musical reste disponible.';}console.error(e);});
 function animate(now){if(disposed)return;animationFrame=requestAnimationFrame(animate);if(document.hidden||now-lastDraw<33)return;const dt=Math.min(.08,(now-lastTime)/1000);lastTime=now;lastDraw=now;if(!ready)return;
  angle.lerp(desired,1-Math.exp(-dt*5));yaw.setFromAxisAngle(up,angle.x);pitch.setFromAxisAngle(right,-angle.y);rotation.copy(yaw).multiply(pitch);arm.copy(basePosition).sub(pivot).applyQuaternion(rotation);camera.position.copy(pivot).add(arm);camera.quaternion.copy(rotation).multiply(baseQuaternion);
  ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(cards,true)[0];hovered=hit?.object.userData.track;renderer.domElement.style.cursor=hovered?'pointer':'default';
  const selected=selectedTrack;for(const card of cards){const active=card.userData.track===selected,hover=card.userData.track===hovered;const destination=card.userData.anchor.clone().addScaledVector(normal,hover?.09:0);card.position.lerp(destination,1-Math.exp(-dt*9));card.uniforms.uGlass.value=active?1.45:hover?1.2:.85;card.uniforms.uTime.value=now/1000;card._edgeMat.emissiveIntensity=active?.4:hover?.32:.16;}
  for(const s of spectra){const bins=window.portfolioSpectrum?.(s.id);for(let i=0;i<32;i++){const value=bins?bins[Math.min(bins.length-1,i+2)]/255:0;s.levels[i]+=(value-s.levels[i])*.35;}}
  waves.uniforms.time.value=now/1000;draw();
 }
 animationFrame=requestAnimationFrame(animate);
 function cleanup(){if(disposed)return;disposed=true;cancelAnimationFrame(animationFrame);window.removeEventListener('portfolio:select-track',trackChanged);window.removeEventListener('pointermove',pointerMove);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('click',select);renderer.domElement.removeEventListener('pointerleave',pointerLeave);for(const s of spectra){s.mesh.geometry.dispose();s.material.dispose();}for(const card of cards)card.dispose();const textures=new Set();asset?.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){for(const value of Object.values(m))if(value?.isTexture)textures.add(value);m.dispose();}});textures.forEach(t=>t.dispose());for(const o of extras){o.geometry?.dispose();o.material?.dispose();o.shadow?.map?.dispose();}environment.dispose();composer.dispose();bloom.dispose();waves.dispose();output.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
 document.addEventListener('astro:before-swap',cleanup,{once:true});window.addEventListener('pagehide',cleanup,{once:true});resize();
}

