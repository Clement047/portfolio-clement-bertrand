import {loadPageModel} from './page-model.js';
import {createPortraitFacts} from './portrait-facts.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {getQuality,getLevel} from './render-quality.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

export function portraitReaction(progress,direction=1,reduced=false){
 if(progress<=0||progress>=1)return {x:0,y:0,z:0,side:0,lift:0};
 const envelope=Math.sin(progress*Math.PI)*Math.exp(-progress*2);
 const shake=reduced?envelope:Math.sin(progress*Math.PI*3)*Math.exp(-progress*4);
 const amount=reduced?.3:1;
 return {x:.075*envelope*amount,y:.20*shake*direction*amount,z:.065*envelope*direction*amount,side:.045*shake*direction*amount,lift:-.025*envelope*amount};
}

// RAF timestamps can precede a click handled later in the same browser frame.
export function portraitReactionFrame(now,start,duration){
 const elapsed=Math.max(0,now-start);
 return {progress:elapsed/duration,active:Number.isFinite(start)&&elapsed<duration};
}
export async function mountAboutAvatar(host,{signal}={}){
 if(signal?.aborted)return;
 const lifetime=new AbortController();let near,resolveNear;
 const mount=host.querySelector('[data-avatar-canvas]'),status=host.querySelector('[data-avatar-status]');
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});}catch{return;}
 renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio,1.75),2,getQuality().maxRatio*1.6));renderer.setClearColor(0,0);renderer.toneMapping=THREE.AgXToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
 const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('role','button');canvas.setAttribute('aria-label','Interagir avec Clément : cliquer ou appuyer sur Entrée ou Espace.');canvas.setAttribute('aria-describedby','portrait-interaction-hint');mount.append(canvas);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.01,100);camera.position.set(0,0,6);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.25;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xe0e9ff,0x302333,.15));
 RectAreaLightUniformsLib.init();
 function softbox(color,intensity,x,y,z,width,height){const light=new THREE.RectAreaLight(color,intensity,width,height);light.position.set(x,y,z);light.lookAt(0,0,0);scene.add(light);}
 softbox(0xffe4cf,8,-4,3,4,3.5,3.5);
 softbox(0xc8dcff,1.1,3,1,3,3,3);
 softbox(0xe1e7ff,6,1,3,-3,3,4);
 let frame=0,disposed=false,visible=true,model,pivot,reactionStart=-Infinity,reactionDirection=1,lastGrunt=-1;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches,duration=reduced?240:820;
 const facts=createPortraitFacts(host,{reduced});
 const hitGeometry=new THREE.BoxGeometry(2,2,2),hitMaterial=new THREE.MeshBasicMaterial(),hitProxy=new THREE.Mesh(hitGeometry,hitMaterial),raycaster=new THREE.Raycaster();
 const sharpRatio=Math.min(Math.max(devicePixelRatio,1.75),2,getQuality().maxRatio*1.6);let motionQuality=false;
 function quality(moving){if(motionQuality===moving)return;motionQuality=moving;renderer.setPixelRatio(moving?Math.min(devicePixelRatio,1.25):sharpRatio);renderer.setSize(mount.clientWidth,mount.clientHeight,false);}
 const render=(now)=>{
  frame=0;if(disposed||!visible||document.hidden)return;
  const {progress,active}=portraitReactionFrame(now,reactionStart,duration);
  if(pivot){const pose=portraitReaction(active?progress:1,reactionDirection,reduced);pivot.rotation.set(pose.x,pose.y,pose.z);pivot.position.set(pose.side,pose.lift,0);}
  if(!active)quality(false);renderer.render(scene,camera);if(active)invalidate();
 };
 function invalidate(){if(!frame&&!disposed&&visible)frame=requestAnimationFrame(render);}
 function react(direction){
  if(!model||disposed)return;
  reactionDirection=direction;reactionStart=performance.now();quality(true);
  facts.show();
  const index=lastGrunt<0?Math.floor(Math.random()*13):(lastGrunt+1+Math.floor(Math.random()*12))%13;lastGrunt=index;
  window.dispatchEvent(new CustomEvent('portfolio:grunt',{detail:{index:index+1}}));invalidate();
 }
 let press;
 function pointerDown(event){press={x:event.clientX,y:event.clientY};}
 function click(event){
  if(!model)return;
  if(press&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>8){press=null;return;}
  press=null;const box=canvas.getBoundingClientRect();
  const pointer=new THREE.Vector2((event.clientX-box.left)/box.width*2-1,-(event.clientY-box.top)/box.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  if(!raycaster.intersectObject(hitProxy,false).length)return;
  react(pointer.x>=0?-1:1);
 }
 canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('click',click);
 function resize(){const w=mount.clientWidth,h=mount.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(model)fit();invalidate();}
 function fit(){const size=model.userData.size;const distance=Math.max(size.y,size.x/camera.aspect)*.5/Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*1.35;camera.position.set(0,0,distance);camera.lookAt(0,0,0);camera.near=Math.max(.01,distance/100);camera.far=Math.max(100,distance*10);camera.updateProjectionMatrix();camera.updateMatrixWorld();}
 const ro=new ResizeObserver(resize);ro.observe(mount);
 const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)invalidate();else{cancelAnimationFrame(frame);frame=0;}});io.observe(host);
 const visibility=()=>{if(!document.hidden)invalidate();};document.addEventListener('visibilitychange',visibility);
 function key(event){if(!['Enter',' '].includes(event.key)||event.repeat)return;event.preventDefault();react(Math.random()<.5?-1:1);}
 canvas.addEventListener('keydown',key);
 window.dispatchEvent(new Event('portfolio:prepare-grunts'));
 const draco=new DRACOLoader();draco.setDecoderPath('/vendor/draco/');const loader=new GLTFLoader();loader.setDRACOLoader(draco);
 function dispose(){if(disposed)return;disposed=true;facts.dispose();lifetime.abort();near?.disconnect();resolveNear?.();signal?.removeEventListener('abort',dispose);cancelAnimationFrame(frame);ro.disconnect();io.disconnect();hitGeometry.dispose();hitMaterial.dispose();window.dispatchEvent(new Event('portfolio:stop-grunt'));canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('click',click);draco.dispose();env.dispose();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('keydown',key);model?.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m?.dispose();});renderer.dispose();renderer.forceContextLoss();canvas.remove();delete host.dataset.loaded;}
 signal?.addEventListener('abort',dispose,{once:true});
 resize();
 // The portrait sits far down the page: load it only when the visitor gets close.
 await new Promise(resolve=>{resolveNear=resolve;near=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){near.disconnect();resolve();}},{rootMargin:'100% 0px'});near.observe(host);});
 if(disposed)return;
 // 3 million vertices of hair overflow a phone's memory (Safari reloads the page):
 // phones get a version with simplified hair, slow computers an intermediate one.
 const phone=/iPhone|iPod|Android.*Mobile|Windows Phone/i.test(navigator.userAgent)||(matchMedia('(pointer: coarse)').matches&&Math.min(screen.width,screen.height)<=600);
 const portrait=phone?'clement-tete-mobile.glb':getLevel()>=2?'clement-tete-light.glb':'clement-tete.glb';
 try{
  const gltf=await loadPageModel(loader,'/models/avatar/'+portrait+'?v=contrast-smooth-gaze-8',lifetime.signal);model=gltf.scene;
  const box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());model.position.sub(center);model.userData.size=size;
  model.traverse(o=>{
   if(!o.isMesh)return;
   o.castShadow=false;o.receiveShadow=false;
   if(o.name.includes('Cheveux')&&!o.name.includes('chevelu')){
    const original=o.material;
    o.material=new THREE.MeshPhysicalMaterial({color:original.color,vertexColors:!!o.geometry.attributes.color,roughness:.44,metalness:0,ior:1.55,specularIntensity:.6,sheen:.55,sheenColor:new THREE.Color(.25,.17,.12),sheenRoughness:.5,clearcoat:.06,clearcoatRoughness:.45});
    original.dispose();
   }else if(!o.material.isMeshBasicMaterial){o.material.roughness=o.name.includes('yeux')?.22:.5;}
  });
  pivot=new THREE.Group();pivot.add(model);scene.add(pivot);hitProxy.scale.set(size.x*.52,size.y*.52,size.z*.52);hitProxy.updateMatrixWorld();fit();renderer.shadowMap.needsUpdate=true;host.dataset.loaded='true';status.textContent='Interagis avec moi';invalidate();
 }catch(error){if(error.name==='AbortError'||disposed)return;console.error('Portrait 3D',error);status.textContent='Le portrait 3D n’a pas pu être chargé.';dispose();}
 return dispose;
}










