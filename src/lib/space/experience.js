import {replaceContactType} from './contact-type.js';
import {addAmbientVeil} from '../ambient-veil.js';
import {neonTitle} from '../neon-title.js';
import {createContactJourney,contactIndex,CONTACT_END} from './contact-journey.js';
import contactDetails from '../../data/contact.json' with {type:'json'};
import {SPACE_BACKGROUND,TITLE_EMISSION} from './look.js';
import { createSaturnRings } from './rings.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { initProjectOrbit } from '../../scripts/initProjectOrbit.js';
import { createSpaceScroll } from './journey-scroll.js';
import { createParallaxStars, animateNebulaDome } from './galaxy.js';
import { createSaturnAtmosphere } from './atmosphere.js';
import './space.css';
import './project-info.css';
export function createSpaceExperience(renderer,onReturn,{environment=null}={}){
 const scene=new THREE.Scene();scene.background=new THREE.Color(SPACE_BACKGROUND);scene.environment=null;
 const loadingCamera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,1800);let camera=loadingCamera,sourceCamera=null,asset=null,cameraMixer=null,cameraAction=null,cameraDuration=10,orbital=null,shown=false,lastTime=null,simulationTime=0,arrivalAuto=null,arrivalAutoDone=false;
 const scroll=createSpaceScroll(onReturn),stars=createParallaxStars(scene),asteroids=[],titleBase=new THREE.Vector3(),titleScaleBase=new THREE.Vector3();let title,sky,nebula,atmosphere,ringSurface,globe,rings,shadowInitialized=false;
 const ui=document.createElement('div');ui.className='space-ui';ui.hidden=true;ui.dataset.revision='saturn-contact-20261031';ui.dataset.assetBase='/project-orbit/';ui.innerHTML=`<p class="space-heading">EXPLORATION — GALAXIE</p><a class="space-credits" href="/models/space/CREDITS.txt" target="_blank" rel="noopener">Crédits 3D ↗</a><button class="space-return">Retour vers la ville ↑</button><button class="space-contact">Contact ↓</button><a class="space-contact-link" hidden target="_blank" rel="noopener noreferrer"></a><p class="space-journey" aria-live="off"></p><p class="space-help">Défilez pour rejoindre Saturne · Défilez dans l’autre sens pour revenir</p><div class="project-orbit__viewport"><p class="project-orbit__status" data-orbit-status role="status">Préparation des projets…</p><button class="project-orbit__resume" data-orbit-resume hidden>Lire les vidéos</button><aside class="project-orbit__info" data-orbit-info><span class="project-orbit__info-index" data-orbit-info-index></span><p class="project-orbit__info-description" data-orbit-info-description></p><div class="project-orbit__info-skills" data-orbit-info-skills></div></aside></div>`;document.body.append(ui);ui.querySelector('.space-return').addEventListener('click',()=>{arrivalAuto=null;arrivalAutoDone=true;scroll.requestReturn();});
 ui.querySelector('.space-contact').addEventListener('click',()=>{arrivalAuto=null;arrivalAutoDone=true;scroll.goTo(2.25);});
 const composer=new EffectComposer(renderer),renderPass=new RenderPass(scene,camera),bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.22,.4,.85),smaa=new SMAAPass(),output=new OutputPass();composer.addPass(renderPass);composer.addPass(bloom);composer.addPass(smaa);composer.addPass(output);addAmbientVeil(output,.65);
 // Decode OutputPass's sRGB texture back to linear only for the existing Seer crossfade.
 const copyScene=new THREE.Scene(),copyCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1),copyMaterial=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{image:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform sampler2D image;varying vec2 vUv;void main(){gl_FragColor=sRGBTransferEOTF(texture2D(image,vUv));}'});copyScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),copyMaterial));
 let shuttle=null,shuttlePlaced=false,shuttleVisit=false,shuttleBlend=0,shuttleTravel=0;
 const shuttleAnchor=new THREE.Group();shuttleAnchor.name='SPARKY_OPTIONAL_SHUTTLE';scene.add(shuttleAnchor);
 new GLTFLoader().loadAsync('/models/space/SPARKY_SHUTTLE_OPEN.glb?v=rear-door-4').then(g=>{shuttle=g.scene;shuttleAnchor.add(shuttle);for(const z of [-8]){const lamp=new THREE.PointLight(0x55aaff,16,7,2);lamp.position.set(0,-.7,z);shuttleAnchor.add(lamp);}shuttleAnchor.visible=false;}).catch(e=>console.error('Navette :',e));
 const visitButton=document.createElement('button');visitButton.className='space-shuttle-visit';visitButton.textContent='← Explorer le vaisseau';visitButton.hidden=true;ui.append(visitButton);
 visitButton.addEventListener('click',()=>{shuttleVisit=!shuttleVisit;visitButton.textContent=shuttleVisit?'Revenir au parcours →':'← Explorer le vaisseau';});
 const landing=document.querySelector('[data-contact-landing]');
 const readPosition=new THREE.Vector3(),readQuaternion=new THREE.Quaternion(),poseHelper=new THREE.PerspectiveCamera();let contact,arrivalCamera,landingCamera,contactEntered=false,contactJourney=null;
 const contactReady=new GLTFLoader().loadAsync('/models/space/CONTACT_LUNAIRE.glb?v=upright-7').then(async gltf=>{
  contact=gltf.scene;await replaceContactType(contact);contact.position.set(180,-70,-210);scene.add(contact);contact.updateMatrixWorld(true);
  arrivalCamera=gltf.cameras.find(c=>c.name==='CONTACT_ArrivalCamera');landingCamera=gltf.cameras.find(c=>c.name==='CONTACT_LandingCamera');if(!arrivalCamera||!landingCamera)throw Error('Contact cameras missing');
  contact.traverse(o=>{if(o.isLight)o.intensity=o.intensity/683*.12;if(o.isMesh){o.receiveShadow=true;o.castShadow=!o.name.endsWith('_Icon');for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.name==='CONTACT_Cyan_Emission'){m.emissive.setRGB(...TITLE_EMISSION.color);m.emissiveIntensity=1.8;m.color.setRGB(.015,.08,.2);m.roughness=.28;m.metalness=.4;}}});contact.traverse(o=>{if(o.isMesh){const convert=m=>m.name==='CONTACT_Cyan_Emission'?neonTitle(m):m;o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);}});contactJourney=createContactJourney(contact,arrivalCamera,landingCamera);contact.visible=false;
 });contactReady.catch(()=>{});
 function updateJourneyCamera(p,j){
  j=Number.isFinite(j)?j:0;p=Number.isFinite(p)?p:0;setCameraProgress(Math.min(1,p/.65));const group=asset?.scene.getObjectByName('SPACE_ProjectOrbit_Anchor');if(!group)return;
  group.updateWorldMatrix(true,false);const up=new THREE.Vector3(0,1,0).applyQuaternion(group.getWorldQuaternion(new THREE.Quaternion()));
  readPosition.copy(group.localToWorld(new THREE.Vector3(0,10,37)));poseHelper.position.copy(readPosition);poseHelper.up.copy(up);poseHelper.lookAt(group.localToWorld(new THREE.Vector3(0,0,23)));readQuaternion.copy(poseHelper.quaternion);
  const align=THREE.MathUtils.smoothstep(j,.45,.9),position=camera.getWorldPosition(new THREE.Vector3()).lerp(readPosition,align),quaternion=camera.getWorldQuaternion(new THREE.Quaternion()).slerp(readQuaternion,align);
  if(j>1.55&&arrivalCamera){const t=THREE.MathUtils.smoothstep(j,1.55,2.2);position.lerp(arrivalCamera.getWorldPosition(new THREE.Vector3()),t);quaternion.slerp(arrivalCamera.getWorldQuaternion(new THREE.Quaternion()),t);}
  contactJourney?.sample(j,position,quaternion);
  contactJourney?.keepAboveSurface(position);
  camera.position.copy(camera.parent.worldToLocal(position));camera.quaternion.copy(camera.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(quaternion));camera.updateMatrixWorld(true);
  asset.scene.visible=j<1.95;const inContact=j>1.62;if(contact)contact.visible=inContact;if(contactEntered!==inContact){contactEntered=inContact;renderer.shadowMap.needsUpdate=true;}
  const fade=THREE.MathUtils.smoothstep(j,4.55,CONTACT_END);if(landing){landing.hidden=!shown||fade===0;landing.style.opacity=String(fade);landing.style.transform=`translateY(${(1-fade)*12}vh)`;landing.style.pointerEvents=shown&&fade>.98?'auto':'none';}
 }
 landing?.querySelector('[data-contact-back]')?.addEventListener('click',()=>scroll.seek(1.1));
 const contactRay=new THREE.Raycaster();
 function openContact(event){if(!shown||contactIndex(scroll.journey)<0||!contactJourney)return;const rect=renderer.domElement.getBoundingClientRect();contactRay.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2),camera);const hit=contactRay.intersectObjects(contactJourney.pickable,false)[0];if(hit){const href=hit.object.userData.contact_href;if(contactDetails.some(c=>c.href===href)){if(href.startsWith('mailto:'))location.href=href;else window.open(href,'_blank','noopener,noreferrer');}}}
 renderer.domElement.addEventListener('click',openContact);
 const stats={source:'/models/space/ESPACE_PROJETS.glb?v=arrival-5',loaded:false,orbitReuses:'initProjectOrbit + GlassVideoCard + OrbitPath',asteroids:0,originalProjectCards:7};
 function fitCamera(){
  const base=camera.userData.spaceBaseFov??camera.fov;camera.userData.spaceBaseFov=base;
  camera.far=Math.max(camera.far,6000);camera.aspect=innerWidth/innerHeight;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(base)/2)*1.08*Math.max(1,1.6/camera.aspect)));camera.updateProjectionMatrix();
 }
 function setCameraProgress(progress){if(!cameraMixer)return;cameraAction.paused=false;cameraMixer.setTime(Math.min(cameraDuration,Math.max(0,progress)*cameraDuration));asset.scene.updateMatrixWorld(true);sourceCamera.getWorldPosition(camera.position);sourceCamera.getWorldQuaternion(camera.quaternion);camera.updateMatrixWorld(true);
 }
 const ready=new GLTFLoader().loadAsync(stats.source).then(gltf=>{
  asset=gltf;scene.add(gltf.scene);sourceCamera=gltf.cameras.find(c=>c.name==='SPACE_ScrollCamera')??gltf.cameras[0];if(!sourceCamera)throw Error('SPACE_ScrollCamera missing');camera=new THREE.PerspectiveCamera(sourceCamera.fov,innerWidth/innerHeight,sourceCamera.near,6000);camera.name='SPACE_RuntimeJourneyCamera';scene.add(camera);fitCamera();renderPass.camera=camera;
  const clip=gltf.animations.find(c=>c.tracks.some(t=>t.name.includes('SPACE_ScrollCamera')));if(!clip)throw Error('SPACE_Camera_Approach missing');cameraDuration=clip.duration;cameraMixer=new THREE.AnimationMixer(gltf.scene);cameraAction=cameraMixer.clipAction(clip).setLoop(THREE.LoopOnce,1);cameraAction.clampWhenFinished=true;cameraAction.play();setCameraProgress(0);
  const anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  gltf.scene.traverse(o=>{
   if(o.name==='SPACE_Projects_Title_Float'){title=o;titleBase.copy(o.position);titleScaleBase.copy(o.scale);}
   if(o.name==='SPACE_Galaxy_Dome'){sky=o;o.castShadow=false;nebula=animateNebulaDome(o);}
   if(o.name==='SPACE_Cold_Stellar_Glow'){
    o.material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,vertexShader:'varying vec2 glowUv;void main(){glowUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 glowUv;void main(){vec2 q=(glowUv-.5)*2.;float r=length(q);float energy=exp(-dot(q,q)*9.)*(1.-smoothstep(.85,1.,r));vec3 light=mix(vec3(.15,.38,.6),vec3(.8,.95,1.),exp(-dot(q,q)*28.));gl_FragColor=vec4(light*2.,energy*.16);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
   }
   if(o.name.startsWith('SPACE_Asteroid_'))asteroids.push({object:o,position:o.position.clone(),rotation:o.rotation.clone(),seed:o.userData.space_drift_seed??asteroids.length});
   if(o.isLight){o.intensity/=683;if(o.name==='SPACE_Key_ColdSun'){o.color.setRGB(.48,.66,1);o.intensity=3.2;}if(o.name==='SPACE_Key_ColdSun'&&o.shadow){o.castShadow=true;o.shadow.mapSize.set(2048,2048);o.shadow.bias=-.0003;o.shadow.normalBias=.14;o.shadow.radius=2;Object.assign(o.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:.1,far:300});o.shadow.camera.updateProjectionMatrix();}}
   if(o.isMesh){o.castShadow=o!==sky&&!o.name.includes('Galaxy')&&!o.name.includes('Stellar_Glow');o.receiveShadow=!o.name.includes('Galaxy')&&!o.name.includes('Stellar_Glow');for(const m of Array.isArray(o.material)?o.material:[o.material])for(const k of ['map','normalMap','roughnessMap'])if(m[k]){m[k].anisotropy=anisotropy;m[k].needsUpdate=true;}}
  });
  gltf.scene.updateMatrixWorld(true);
  globe=gltf.scene.getObjectByName('SPACE_Saturn_Globe');rings=gltf.scene.getObjectByName('SPACE_Saturn_Rings');
  gltf.scene.traverse(o=>{if(o.isMesh&&o.name.startsWith('SPACE_Projects_Title_')){o.material=Array.isArray(o.material)?o.material.map(neonTitle):neonTitle(o.material);}});
  const sun=gltf.scene.getObjectByName('SPACE_Key_ColdSun');
  if(sun?.isDirectionalLight){const center=gltf.scene.getObjectByName('SPACE_Saturn_Globe').getWorldPosition(new THREE.Vector3()),origin=sun.getWorldPosition(new THREE.Vector3()),beam=sun.target.getWorldPosition(new THREE.Vector3()).sub(origin).normalize();sun.position.copy(sun.parent.worldToLocal(center.addScaledVector(beam,-120)));sun.shadow.camera.far=350;sun.shadow.camera.updateProjectionMatrix();}
  ringSurface=createSaturnRings(rings,globe,sun);
  atmosphere=createSaturnAtmosphere(gltf.scene.getObjectByName('SPACE_Saturn_Globe'),sun);
  // Lighting, the stellar glow and distant stars belong to the complete journey.
  // Only Saturn and its foreground rocks are hidden when Contact takes over.
  const persistent=[];gltf.scene.traverse(o=>{if(o.isLight||['SPACE_Distant_Starfield','SPACE_Cold_Stellar_Glow','SPACE_Galaxy_Dome'].includes(o.name))persistent.push(o);});
  for(const o of persistent)scene.attach(o);

  stats.loaded=true;asset.scene.visible=true;stats.asteroids=asteroids.length;console.info('Space environment ready',stats);return gltf;
 }).catch(error=>{ui.querySelector('[data-orbit-status]').textContent='La scène spatiale n’a pas pu être chargée. Le retour vers la ville reste disponible.';stats.error=String(error?.message??error);console.error(error);throw error;});ready.catch(()=>{});
 function prepareOrbit(){
  if(orbital)return orbital.ready;
  const group=asset.scene.getObjectByName('SPACE_ProjectOrbit_Anchor');if(!group)throw Error('Orbit anchor missing');
  orbital=initProjectOrbit(ui,{THREE,scene,renderer,camera,canvas:renderer.domElement,group,occluders:[asset.scene.getObjectByName('SPACE_Saturn_Globe')],rotationDirection:1,readabilityUp:()=>new THREE.Vector3(0,1,0).applyQuaternion(group.getWorldQuaternion(new THREE.Quaternion())),orbitSettings:{radiusX:group.userData.orbit_radius_x??23,radiusZ:group.userData.orbit_radius_z??23,centerY:0,centerZ:0,verticalAmplitude:0,faceCameraBlend:.95},cardScale:1.15,onOrbitAngle:angle=>{if(globe){globe.rotation.y=angle+.48;rings.rotation.y=angle+.48;}},getProgress:()=>scroll.orbitProgress,getVisibility:()=>THREE.MathUtils.smoothstep(scroll.progress,.36,.6)*(1-THREE.MathUtils.smoothstep(scroll.journey,1.55,1.8)),onReady:({cards})=>stats.readyCards=cards.length});
  return orbital.ready.then(()=>orbital.setVisible(shown));
 }
 function update(_externalTime){
  const now=performance.now()/1000;
  const dt=lastTime===null?1/60:Math.max(0,Math.min(.05,now-lastTime));lastTime=now;simulationTime+=dt;const time=simulationTime;
  if(arrivalAuto!==null){arrivalAuto+=dt;const t=Math.min(1,arrivalAuto/3.5);scroll.seek(.065*(t*t*(3-2*t)));if(t===1){arrivalAuto=null;arrivalAutoDone=true;}}
  const p=shown?scroll.update(dt):scroll.progress;ui.dataset.journey=Number(scroll.journey??scroll.progress??0).toFixed(3);ui.querySelector('.space-journey').textContent=`${scroll.journey<.65?'APPROCHE':scroll.journey<1.55?'PROJETS':scroll.journey<4.55?'CONTACT':'ARRIVÉE'} · ${Math.round(scroll.journey/CONTACT_END*100)} %`;ui.querySelector('.space-contact').hidden=scroll.journey>1.55;
  ui.querySelector('.space-help').textContent=scroll.journey>1.55?'Défilez pour découvrir mes coordonnées · Défilez dans l’autre sens pour revenir':p>.6?'Défilez pour faire graviter les projets · Cliquez sur une carte':'Défilez pour rejoindre Saturne · Défilez dans l’autre sens pour revenir';
  const identity=ui.querySelector('.space-contact-link'),contactId=contactIndex(scroll.journey);identity.hidden=true;if(contactId>=0){const c=contactDetails[contactId];identity.textContent=`${c.name} · ${c.label} ↗`;identity.href=c.href;}
  visitButton.hidden=!shuttle||(!shuttleVisit&&scroll.journey<1.4);
  // The imported camera only supplies the approach; the independent render camera continues to Contact.
  updateJourneyCamera(p,scroll.journey??scroll.progress??0);
  if(shuttle&&scroll.journey>=1.4&&!shuttlePlaced){const forward=camera.getWorldDirection(new THREE.Vector3());forward.y=0;forward.normalize();const left=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),forward).normalize();shuttleAnchor.position.copy(camera.position).addScaledVector(forward,55).addScaledVector(left,24);shuttleAnchor.position.y=camera.position.y+1.5;const exclusion=new THREE.Box3().setFromObject(rings??globe),saturnCenter=exclusion.getCenter(new THREE.Vector3()),clearance=exclusion.getSize(new THREE.Vector3()).length()*.5+65;const outward=shuttleAnchor.position.clone().sub(saturnCenter);if(outward.length()<clearance){if(outward.lengthSq()<.001)outward.copy(left);shuttleAnchor.position.copy(saturnCenter).add(outward.normalize().multiplyScalar(clearance));}shuttleAnchor.rotation.set(0,Math.atan2(forward.x,forward.z),0);shuttlePlaced=true;shuttleAnchor.visible=true;}
  shuttleBlend=THREE.MathUtils.damp(shuttleBlend,shuttleVisit?1:0,2.5,dt);
  if(shuttlePlaced&&shuttleBlend>.001){const entry=shuttleAnchor.localToWorld(new THREE.Vector3(0,0,-30+shuttleTravel*22)),target=shuttleAnchor.localToWorld(new THREE.Vector3(0,0,0));poseHelper.position.copy(entry);poseHelper.up.set(0,1,0);poseHelper.lookAt(target);camera.position.lerp(entry,shuttleBlend);camera.quaternion.slerp(poseHelper.quaternion,shuttleBlend);camera.updateMatrixWorld(true);}
  if(title){title.visible=true;title.position.copy(titleBase);title.scale.copy(titleScaleBase);}
  for(const rock of asteroids){rock.object.position.copy(rock.position);rock.object.position.y+=Math.sin(time*.13+rock.seed)*.15;rock.object.rotation.set(rock.rotation.x+time*.008*((rock.seed%3)-1),rock.rotation.y+time*.006,rock.rotation.z);}
  stars.update(time,renderer.getPixelRatio(),camera.getWorldPosition(new THREE.Vector3()));nebula?.update(time);
  if(sky)sky.position.copy(camera.getWorldPosition(new THREE.Vector3()));
  scene.updateMatrixWorld(true);orbital?.update(dt);
 }
 function draw(target,time){
  if(stats.error){ui.hidden=false;const status=ui.querySelector('[data-orbit-status]');status.hidden=false;status.textContent='Arrivée spatiale interrompue : '+stats.error;return;}
  update(time);if(!target&&shown&&scroll.journey>CONTACT_END-.0001)return;if(stats.loaded&&!shadowInitialized){renderer.shadowMap.needsUpdate=true;shadowInitialized=true;}const oldTone=renderer.toneMapping,oldExposure=renderer.toneMappingExposure;renderer.toneMapping=THREE.AgXToneMapping;renderer.toneMappingExposure=1.05;
  if(target){composer.renderToScreen=false;composer.render();copyMaterial.uniforms.image.value=composer.readBuffer.texture;renderer.setRenderTarget(target);renderer.clear();renderer.render(copyScene,copyCamera);composer.renderToScreen=true;}
  else composer.render();
  renderer.toneMapping=oldTone;renderer.toneMappingExposure=oldExposure;
 }
 return {ready,stats,get progress(){return scroll.progress;},
  async prepare(){
    await Promise.all([ready,contactReady]);await prepareOrbit();if(stats.readyCards!==7)throw Error('Seven original project cards must be ready');stats.prepared=true;
    // Finite warmup during the existing locked Sparky interaction, never after city entry.
    const previousTarget=renderer.getRenderTarget(),warm=new THREE.WebGLRenderTarget(16,16);
    try{renderer.compile(scene,camera);draw(warm,0);}finally{renderer.setRenderTarget(previousTarget);warm.dispose();lastTime=null;}
  },
  beginArrival(){if(!arrivalAutoDone&&arrivalAuto===null&&scroll.journey<.001)arrivalAuto=0;},
  show(){if(!arrivalAutoDone&&arrivalAuto===null&&scroll.journey<.001)arrivalAuto=0;shown=true;if(asset)asset.scene.visible=true;ui.hidden=false;orbital?.setVisible(true);lastTime=null;},hide(){shown=false;ui.hidden=true;if(landing)landing.hidden=true;orbital?.setVisible(false);},
  scroll(delta){if(shuttleVisit){shuttleTravel=THREE.MathUtils.clamp(shuttleTravel+delta*.0007,0,1);return;}if(delta){arrivalAuto=null;arrivalAutoDone=true;}scroll.scroll(delta);},seek(value){arrivalAuto=null;arrivalAutoDone=value>0;scroll.seek(value);setCameraProgress(Math.min(1,value/.65));},reset(){scroll.reset();lastTime=null;simulationTime=0;arrivalAuto=null;arrivalAutoDone=false;setCameraProgress(0);},
  render(time){draw(null,time);},renderTo(target,time){draw(target,time);},
  resize(){fitCamera();composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);},
  dispose(){renderer.domElement.removeEventListener('click',openContact);ui.remove();orbital?.();stars.dispose();ringSurface?.dispose();atmosphere?.dispose();composer.dispose();bloom.dispose();smaa.dispose();output.dispose();copyMaterial.dispose();copyScene.children[0].geometry.dispose();asset?.scene.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m?.dispose();});}
 };
}
