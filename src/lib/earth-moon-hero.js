import {loadPageModel,disposeModel} from './page-model.js';
import {styleSaturn} from './saturn-style.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createSaturnRings } from './space/rings.js';
import { createSaturnAtmosphere } from './space/atmosphere.js';
import { createParallaxStars, animateNebulaDome } from './space/galaxy.js';
import { SPACE_BACKGROUND } from './space/look.js';
import { addAmbientVeil } from './ambient-veil.js';
import { cappedPixelRatio, getQuality } from './render-quality.js';

export function mountEarthMoonHero() {
 const host = document.querySelector('[data-earth-moon]');
 if (!host || host.dataset.ready) return;
 host.dataset.ready = 'true';
 const lifetime=new AbortController();
 const hero=host.closest('.earth-hero'),orbitSection=document.querySelector('[data-project-orbit]');
 Object.assign(host.style,{position:'fixed',inset:'0',zIndex:'0',pointerEvents:'none',transform:'none'});hero.parentElement.append(host);
 let disposed = false, frame = 0, visible = true, asset, progress = 0;
 const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
 let renderer;
 try { renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true, powerPreference:'high-performance' }); } catch { return; }
 renderer.setPixelRatio(cappedPixelRatio(1.75));
 renderer.setSize(innerWidth, innerHeight);
 renderer.toneMapping = THREE.AgXToneMapping;
 renderer.toneMappingExposure = 1.05;
 renderer.shadowMap.enabled = true;
 renderer.shadowMap.type = THREE.PCFShadowMap;
 renderer.shadowMap.autoUpdate = false;
 host.append(renderer.domElement);
 const scene = new THREE.Scene();
 let camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, .1, 10000);
 const origin = new THREE.Vector3(), offset = new THREE.Vector3(), desired = new THREE.Vector3();
 const right = new THREE.Vector3(), up = new THREE.Vector3();
 scene.background=new THREE.Color(SPACE_BACKGROUND);
 const stars=createParallaxStars(scene);
 let saturnCenter=null,saturnDiameter=36;
 let ringSurface, atmosphere, sky, titlePlane, titleTexture, namePlane, nameTexture, titleHalo, haloTexture, glitchTimer, glitchUntil=0;
 const backgroundOrigin=new THREE.Vector3(),backgroundQuaternion=new THREE.Quaternion(),asteroidScales=[];
 const baseQuaternion=new THREE.Quaternion(),focus=new THREE.Vector3(),forward=new THREE.Vector3(),orbitRotation=new THREE.Quaternion(),pitchRotation=new THREE.Quaternion(),orbitArm=new THREE.Vector3();
 const ripples=Array.from({length:8},()=>new THREE.Vector4(.5,.5,-100,0));
 let rippleIndex=0,lastRipple=0,lastPointer=new THREE.Vector2(-10,-10),rippleUntil=0;
 function placeTitle(){if(!titlePlane)return;const h=2*90*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2),w=h*camera.aspect*Math.min(innerWidth<600?.94:.8,1100/innerWidth);titlePlane.position.copy(origin).addScaledVector(new THREE.Vector3(0,0,-1).applyQuaternion(baseQuaternion),90).addScaledVector(up,h*.035);titlePlane.quaternion.copy(baseQuaternion);titlePlane.scale.set(w,w*183/1326,1);titlePlane.userData.anchor=titlePlane.position.clone();focus.copy(titlePlane.position);
 if(titleHalo){titleHalo.position.copy(titlePlane.position);titleHalo.quaternion.copy(baseQuaternion);titleHalo.scale.set(w*1.12,w*183/1326*1.7,1);titleHalo.userData.anchor=titleHalo.position.clone();}
 if(namePlane){namePlane.position.copy(origin).addScaledVector(new THREE.Vector3(0,0,-1).applyQuaternion(baseQuaternion),90).addScaledVector(up,h*.20);namePlane.quaternion.copy(baseQuaternion);const nameWidth=h*camera.aspect*Math.min(camera.aspect<1?.42:.20,280/innerWidth);namePlane.scale.set(nameWidth,nameWidth*940/2151,1);namePlane.userData.anchor=namePlane.position.clone();}
 }
 function scheduleGlitch(){glitchTimer=setTimeout(()=>{if(disposed)return;glitchUntil=performance.now()+180;request();scheduleGlitch();},2400+Math.random()*2200);}
 function makeTitle(){
  titleTexture=new THREE.TextureLoader().load('/svg/enter-the-experience.svg',()=>{if(disposed){titleTexture.dispose();return;}hero.dataset.webglTitle='true';
   const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=384;const ctx=canvas.getContext('2d');
   ctx.filter='blur(14px)';ctx.drawImage(titleTexture.image,82,80,1372,189);ctx.filter='none';ctx.globalCompositeOperation='source-in';ctx.fillStyle='#3976d6';ctx.fillRect(0,0,1536,384);
   haloTexture=new THREE.CanvasTexture(canvas);haloTexture.colorSpace=THREE.SRGBColorSpace;
   titleHalo=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:haloTexture,transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));scene.add(titleHalo);placeTitle();sceneDirty=true;request();});
  titleTexture.colorSpace=THREE.NoColorSpace;titleTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,toneMapped:false,uniforms:{image:{value:titleTexture},glitch:{value:0},time:{value:0}},
   vertexShader:'varying vec2 uvTitle;void main(){uvTitle=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:`uniform sampler2D image;uniform float glitch,time;varying vec2 uvTitle;
   void main(){vec2 uv=uvTitle;float band=step(.62,fract(sin(floor(uv.y*18.)+floor(time*24.))*43758.54));float shift=(sin(time*61.+floor(uv.y*18.))*.018)*band*glitch;
   float a=texture2D(image,vec2(uv.x+shift,uv.y)).a;float cyan=texture2D(image,vec2(uv.x+shift+.008*glitch,uv.y)).a;float violet=texture2D(image,vec2(uv.x+shift-.011*glitch,uv.y)).a;
   vec3 color=vec3(1.);if(glitch>.1){color=mix(vec3(.1,.75,1.),vec3(.64,.2,1.),step(.5,fract(uv.y*9.+time*5.)));color=mix(color,vec3(1.),a*.7);}
   float alpha=max(a,max(cyan,violet)*glitch);if(alpha<.01)discard;gl_FragColor=vec4(color*2.5,alpha);
   }`
  });
  titlePlane=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);titlePlane.name='HOME_EnterTheExperience';scene.add(titlePlane);placeTitle();if(!reduce)scheduleGlitch();
  const nameImage=new Image();nameImage.onload=()=>{
   if(disposed)return;
   const canvas=document.createElement('canvas');canvas.width=2151;canvas.height=940;const ctx=canvas.getContext('2d');ctx.shadowColor='#3166af';ctx.shadowBlur=45;ctx.drawImage(nameImage,128,128,1895,684);
   nameTexture=new THREE.CanvasTexture(canvas);nameTexture.colorSpace=THREE.SRGBColorSpace;
   namePlane=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:nameTexture,color:new THREE.Color().setRGB(2.5,2.5,2.5),transparent:true,depthWrite:false,toneMapped:false}));scene.add(namePlane);hero.dataset.webglName='true';placeTitle();sceneDirty=true;request();
  };nameImage.src='/svg/clement-bertrand.svg';
 }
 const target = new THREE.WebGLRenderTarget(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio(), {depthBuffer:true,type:THREE.HalfFloatType});
 const transitionMaterial = new THREE.ShaderMaterial({
  uniforms:{image:{value:target.texture},progress:{value:0},time:{value:0},ripples:{value:ripples},aspect:{value:innerWidth/innerHeight}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`uniform sampler2D image;uniform float progress,time,aspect;uniform vec4 ripples[8];varying vec2 vUv;
  void main(){float p=smoothstep(.08,.95,progress);float wave=sin(vUv.y*14.+p*5.)*sin(p*3.14159);
  vec2 uv=vUv;float departure=sin(p*3.14159265);uv.x+=sin(vUv.y*8.-p*6.)*.035*departure;uv.y+=sin(vUv.x*7.+p*5.)*.025*departure;
  for(int i=0;i<8;i++){float age=time-ripples[i].z;if(age>0.&&age<3.2){vec2 delta=vUv-ripples[i].xy;delta.x*=aspect;float d=length(delta);float radius=age*.42;float envelope=exp(-age*1.45)*exp(-pow((d-radius)/.23,2.));float wave=sin((d-radius)*24.);vec2 dir=delta/max(d,.02);dir.x/=aspect;uv+=dir*wave*envelope*.010*ripples[i].w;}}
  vec4 col=texture2D(image,clamp(uv,.001,.999));gl_FragColor=col;
#include <tonemapping_fragment>
// color space
#include <colorspace_fragment>
}`,
  depthTest:false,depthWrite:false,toneMapped:true
 });
 addAmbientVeil({material:transitionMaterial},.65);
 function fitSaturnEndpoint(){if(!saturnCenter)return;const factor=saturnDiameter/4.3,z=Math.max(11.2,11.8/(innerWidth/innerHeight));backgroundOrigin.copy(saturnCenter).add(new THREE.Vector3(0,-1.09,(z+8.5)*Math.tan(THREE.MathUtils.degToRad(38)/2)/Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)).multiplyScalar(factor));backgroundQuaternion.identity();}
 const transitionScene=new THREE.Scene();
 transitionScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),transitionMaterial));
 const transitionCamera=new THREE.Camera();
 let warming=false;
 let sceneDirty=true,lastSceneProgress=-1,lastSceneGlitch=false;
 const audit=new URLSearchParams(location.search).has('perf');let sceneDraws=0,screenDraws=0;
 const lastSceneOffset=new THREE.Vector3(Infinity,Infinity,Infinity);
 function draw(now=performance.now()) {
  frame = 0;
  if (disposed || warming || !visible || document.hidden) return;
  offset.lerp(desired, .065);
  // Orbit the authored camera around the title: fixed radius and a matching rotation preserve its framing.
  if(asset){orbitRotation.setFromAxisAngle(up,offset.x);pitchRotation.setFromAxisAngle(right,-offset.y);orbitRotation.multiply(pitchRotation);orbitArm.copy(origin).sub(focus).applyQuaternion(orbitRotation);camera.position.copy(focus).add(orbitArm);camera.quaternion.copy(orbitRotation).multiply(baseQuaternion);}
  if(asset&&backgroundOrigin.lengthSq()>0){const blend=THREE.MathUtils.smoothstep(progress,.06,1);camera.position.lerp(backgroundOrigin,blend);camera.quaternion.slerp(backgroundQuaternion,blend);for(const [object,scale] of asteroidScales){object.scale.copy(scale).multiplyScalar(Math.max(.001,1-blend));object.visible=blend<.99;}for(const mesh of [titlePlane,titleHalo,namePlane])if(mesh?.userData.anchor)mesh.position.copy(mesh.userData.anchor).addScaledVector(up,blend*100);}
  if(titlePlane){titlePlane.material.uniforms.time.value=now/1000;titlePlane.material.uniforms.glitch.value=now<glitchUntil?1:0;titlePlane.visible=progress<.95;if(titleHalo)titleHalo.visible=titlePlane.visible;if(namePlane)namePlane.visible=titlePlane.visible;}
  stars.update(0,renderer.getPixelRatio(),camera.position);
  if(sky)sky.position.copy(camera.position);
  // Keep the full-quality scene image while only screen-space ripples change.
  // No texture, geometry, effect or pixel ratio is reduced.
  const glitching=progress<.95&&now<glitchUntil;
  const cameraMoving=progress<1&&!lastSceneOffset.equals(offset);
  if(sceneDirty||progress!==lastSceneProgress||cameraMoving||glitching||lastSceneGlitch){
   renderer.setRenderTarget(target);renderer.render(scene,camera);if(audit)sceneDraws++;
   sceneDirty=false;lastSceneProgress=progress;lastSceneOffset.copy(offset);lastSceneGlitch=glitching;
  }
  renderer.setRenderTarget(null);transitionMaterial.uniforms.progress.value=progress;transitionMaterial.uniforms.time.value=now/1000;
  renderer.render(transitionScene, transitionCamera);
  if(audit){screenDraws++;host.dataset.renderAudit=JSON.stringify({sceneDraws,screenDraws,pixelRatio:renderer.getPixelRatio(),progress});}
  if (!reduce && (offset.distanceToSquared(desired) > .00000001 || now<rippleUntil || now<glitchUntil)) request();
 }
 function request() { if (!frame && !disposed) frame = requestAnimationFrame(draw); }
 const pointer=e=>{const x=e.clientX/innerWidth,y=1-e.clientY/innerHeight,now=performance.now();desired.set((x-.5)*.28,(y-.5)*.22,0);const distance=lastPointer.distanceTo(new THREE.Vector2(x,y));if(now-lastRipple>65&&distance>.018){ripples[rippleIndex].set(x,y,now/1000,Math.min(1,.4+distance*5));rippleIndex=(rippleIndex+1)%ripples.length;lastRipple=now;lastPointer.set(x,y);rippleUntil=now+3200;}request();};
 loadPageModel(new GLTFLoader(),'/models/space/ESPACE_PROJETS.glb?v=arrival-5',lifetime.signal).then(g => {
  if (disposed) { disposeModel(g); return; }
  asset = g.scene; scene.add(asset);
  // Use the same authored camera and its first animation frame as the space arrival.
  const original=g.cameras.find(c=>c.name==='SPACE_ScrollCamera')??g.cameras[0];
  const clip=g.animations.find(c=>c.tracks.some(t=>t.name.includes('SPACE_ScrollCamera')));
  if(clip){const mixer=new THREE.AnimationMixer(asset);mixer.clipAction(clip).play();mixer.setTime(0);}
  asset.updateMatrixWorld(true);
  if(original){
   camera.copy(original,false);original.getWorldPosition(camera.position);original.getWorldQuaternion(camera.quaternion);
   camera.scale.set(1,1,1);camera.aspect=innerWidth/innerHeight;camera.far=6000;
   camera.userData.spaceBaseFov=original.fov;
   camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(original.fov)/2)*1.08*Math.max(1,1.6/camera.aspect)));
   camera.updateProjectionMatrix();
  }
  baseQuaternion.copy(camera.quaternion);forward.set(0,0,-1).applyQuaternion(baseQuaternion);origin.copy(camera.position);focus.copy(origin).addScaledVector(new THREE.Vector3(0,0,-1).applyQuaternion(baseQuaternion),180);right.set(1,0,0).applyQuaternion(camera.quaternion);up.set(0,1,0).applyQuaternion(camera.quaternion);
  asset.traverse(o=>{
   if(o.name.startsWith('SPACE_Projects_Title_'))o.visible=false;
   if(o.name.startsWith('SPACE_Asteroid_')||o.name==='SPACE_Cold_Stellar_Glow')asteroidScales.push([o,o.scale.clone()]);
   if(o.name==='SPACE_Galaxy_Dome'){sky=o;animateNebulaDome(o);}
   if(o.name==='SPACE_Cold_Stellar_Glow'){
    o.material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
     vertexShader:'varying vec2 glowUv;void main(){glowUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
     fragmentShader:'varying vec2 glowUv;void main(){vec2 q=(glowUv-.5)*2.;float r=length(q);float energy=exp(-dot(q,q)*9.)*(1.-smoothstep(.85,1.,r));vec3 light=mix(vec3(.15,.38,.6),vec3(.8,.95,1.),exp(-dot(q,q)*28.));gl_FragColor=vec4(light*2.,energy*.16);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
    });
   }
   if(o.isLight){o.intensity/=683;if(o.name==='SPACE_Key_ColdSun'){o.color.setRGB(.48,.66,1);o.intensity=3.2;o.castShadow=true;o.shadow.mapSize.setScalar(getQuality().shadowSize);o.shadow.bias=-.0003;o.shadow.normalBias=.14;Object.assign(o.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:.1,far:350});o.shadow.camera.updateProjectionMatrix();}}
   if(o.isMesh){o.castShadow=!o.name.includes('Galaxy')&&!o.name.includes('Stellar_Glow');o.receiveShadow=o.castShadow;for(const m of Array.isArray(o.material)?o.material:[o.material])for(const k of ['map','normalMap','roughnessMap'])if(m[k])m[k].anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
  });
  asset.updateMatrixWorld(true);
  const globe=asset.getObjectByName('SPACE_Saturn_Globe'),rings=asset.getObjectByName('SPACE_Saturn_Rings'),sun=asset.getObjectByName('SPACE_Key_ColdSun');
  if(sun?.isDirectionalLight&&globe){const center=globe.getWorldPosition(new THREE.Vector3()),beam=sun.target.getWorldPosition(new THREE.Vector3()).sub(sun.getWorldPosition(new THREE.Vector3())).normalize();sun.position.copy(sun.parent.worldToLocal(center.addScaledVector(beam,-120)));sun.updateWorldMatrix(true,true);}
  if(rings&&globe&&sun)ringSurface=createSaturnRings(rings,globe,sun);
  if(globe){atmosphere=createSaturnAtmosphere(globe,sun);const center=globe.getWorldPosition(new THREE.Vector3());saturnCenter=center;saturnDiameter=new THREE.Box3().setFromObject(globe).getSize(new THREE.Vector3()).x;fitSaturnEndpoint();styleSaturn(globe,rings,globe.parent.getObjectByName('SPACE_Saturn_Atmospheric_Limb'));for(const object of [globe,rings,globe.parent.getObjectByName('SPACE_Saturn_Atmospheric_Limb')])if(object)asteroidScales.push([object,object.scale.clone()]);}
  renderer.shadowMap.needsUpdate=true;
  makeTitle();
  // Compile shaders in parallel (KHR_parallel_shader_compile) instead of blocking the page on the first frame.
  // The scene renders into `target`, so compile with that target bound: the programs then match the real frame.
  warming=true;renderer.setRenderTarget(target);const compiling=renderer.compileAsync(scene,camera);renderer.setRenderTarget(null);
  compiling.catch(()=>{}).then(()=>{warming=false;sceneDirty=true;request();});
 }).catch(error=>{if(error.name!=='AbortError'&&!disposed)console.error(error);});
 if (!reduce) window.addEventListener('pointermove', pointer, {passive:true});
 const resize = () => { sceneDirty=true; camera.aspect=innerWidth/innerHeight; if(camera.userData.spaceBaseFov)camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.userData.spaceBaseFov)/2)*1.08*Math.max(1,1.6/camera.aspect)));camera.updateProjectionMatrix();fitSaturnEndpoint();placeTitle();transitionMaterial.uniforms.aspect.value=camera.aspect; renderer.setSize(innerWidth,innerHeight); target.setSize(innerWidth*renderer.getPixelRatio(),innerHeight*renderer.getPixelRatio()); request(); };
 window.addEventListener('resize',resize);
 const observer = new IntersectionObserver(entries => { visible=entries[0].isIntersecting;  if(visible)request(); });
 observer.observe(host);
 
 const handoffDisplacement=hero.querySelector('[data-handoff-displacement]'),handoffBlur=hero.querySelector('[data-handoff-blur]');
 const scroll=()=>{
  const travel=Math.max(0,-hero.getBoundingClientRect().top/innerHeight);
  progress=reduce?(travel>=1?1:0):THREE.MathUtils.clamp(travel,0,1);
  const backdropEnd=document.querySelector('#contact')||document.querySelector('#presentation')||orbitSection;visible=!backdropEnd||backdropEnd.getBoundingClientRect().bottom>0;host.style.display=visible?'':'none';document.body.dataset.heroVisible=String(travel<.8);
  const phase=THREE.MathUtils.clamp((travel-.06)/1.24,0,1),strength=reduce?0:Math.pow(Math.sin(phase*Math.PI),1.35);
  hero.style.setProperty('--hero-progress',String(progress));
  document.documentElement.style.setProperty('--home-transition',String(progress));
  document.documentElement.style.setProperty('--home-handoff-filter',travel>.02&&travel<1.1?'url(#home-handoff-wave)':'none');
  document.documentElement.style.setProperty('--home-handoff-line-y',(innerHeight*(1-travel))+'px');
  document.documentElement.style.setProperty('--home-handoff-line-opacity',travel>.02&&travel<1.1?'1':'0');
  document.documentElement.style.setProperty('--home-handoff-feather',strength*85+'px');
  handoffDisplacement?.setAttribute('scale',String(strength*18));handoffBlur?.setAttribute('stdDeviation',String(strength*2.2));
  request();
 };scroll();
 window.addEventListener('scroll',scroll,{passive:true});
 function cleanup(){if(disposed)return;disposed=true;document.removeEventListener('astro:before-swap',cleanup);window.removeEventListener('pagehide',cleanup);lifetime.abort();host.remove();clearTimeout(glitchTimer);delete hero.dataset.webglTitle;delete hero.dataset.webglName;nameTexture?.dispose();haloTexture?.dispose();for(const mesh of [namePlane,titleHalo]){mesh?.geometry.dispose();mesh?.material.dispose();}titleTexture?.dispose();titlePlane?.geometry.dispose();titlePlane?.material.dispose();delete document.body.dataset.heroVisible;document.documentElement.style.removeProperty('--home-transition');document.documentElement.style.removeProperty('--home-handoff-filter');document.documentElement.style.removeProperty('--home-handoff-line-y');document.documentElement.style.removeProperty('--home-handoff-line-opacity');document.documentElement.style.removeProperty('--home-handoff-feather');cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('pointermove',pointer);window.removeEventListener('resize',resize);window.removeEventListener('scroll',scroll);const textures=new Set();asset?.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){for(const value of Object.values(m))if(value?.isTexture)textures.add(value);m.dispose();}});textures.forEach(texture=>texture.dispose());stars.dispose();ringSurface?.dispose();atmosphere?.dispose();target.dispose();transitionMaterial.dispose();transitionScene.children[0].geometry.dispose();renderer.dispose();renderer.forceContextLoss();}
 document.addEventListener('astro:before-swap',cleanup,{once:true});
 window.addEventListener('pagehide',cleanup,{once:true});request();
}











