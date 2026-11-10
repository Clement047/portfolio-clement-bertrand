import * as THREE from './vendor/three.module.js';
import Hls from './vendor/hls.mjs';
import {orbitPose} from './OrbitPath.js';
import {CanvasCompatibilityRenderer} from './CanvasCompatibilityRenderer.js';
import {GlassVideoCard,createStudioEnvironment} from './GlassVideoCard.js';

const $=s=>document.querySelector(s),stage=$('#stage'),canvas=$('#scene');
const projects=[
 {id:'SULL',tint:0xb1263d,aspect:1918/882,src:'./assets/video/sull.m3u8',poster:'./assets/poster.jpg'},
 {id:'SPARKY',tint:0x167bd1,aspect:1916/908,src:'./assets/sparky/sparky.m3u8',poster:'./assets/sparky/poster.jpg'}
];
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,100);
let renderer,environment,disposed=false,frame=0,angle=-.48,last=performance.now(),playing=true;
const errors=[],players=[],cards=[],fallbacks=[];let active=0;
function fail(message){errors.push(message);$('#error').hidden=false;$('#error').textContent=message;}
for(const project of projects){
 const video=document.createElement('video');video.muted=true;video.loop=true;video.playsInline=true;video.preload='auto';video.poster=project.poster;video.className='source-video';video.setAttribute('aria-hidden','true');document.body.append(video);
 const card=new GlassVideoCard(video,{width:7.0,aspect:project.aspect*(7.0/5.8),title:project.id,tint:project.tint,glass:1});scene.add(card);cards.push(card);
 const player={video,project,hls:null};players.push(player);
 const play=()=>{if(playing)video.play().catch(()=>{$('#start').hidden=false;});};
 video.addEventListener('loadeddata',()=>{$('#status').classList.add('done');});
 video.addEventListener('loadedmetadata',()=>card.updateCover());
 if(Hls.isSupported()){
  player.hls=new Hls({maxBufferLength:14,maxMaxBufferLength:24,backBufferLength:6,capLevelToPlayerSize:true});player.hls.loadSource(new URL(project.src,import.meta.url).href);player.hls.attachMedia(video);player.hls.on(Hls.Events.MANIFEST_PARSED,play);
  player.hls.on(Hls.Events.ERROR,(_,d)=>{if(d.fatal){errors.push(project.id+': '+d.details);if(d.type===Hls.ErrorTypes.MEDIA_ERROR)player.hls.recoverMediaError();else fail('La vidéo '+project.id+' ne peut pas être chargée.');}});
 }else if(video.canPlayType('application/vnd.apple.mpegurl')){video.src=project.src;video.addEventListener('canplay',play,{once:true});}
 else fail('Lecture vidéo non prise en charge dans ce navigateur.');
}
try{
 const context=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'high-performance'});
 if(context){
  renderer=new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0,0);
  environment=createStudioEnvironment(renderer);scene.environment=environment.texture;scene.add(new THREE.AmbientLight(0xa8b9c9,.6));
  const key=new THREE.DirectionalLight(0xe2e9ef,1.2);key.position.set(-2,3,5);scene.add(key);
 }else{
  for(let i=0;i<cards.length;i++)fallbacks.push(new CanvasCompatibilityRenderer(canvas,cards[i],camera,{poster:projects[i].poster}));
  $('#state').textContent='APERÇU COMPATIBLE · WEBGL INDISPONIBLE ICI';
 }
}catch(e){fail(e.message);}
// Fixed camera; scrolling only changes the orbital angle. No pointer rotation.
function resize(){
 const w=innerWidth,h=innerHeight;camera.aspect=w/h;
 camera.position.set(0,.18,Math.max(11.2,11.8/camera.aspect));camera.lookAt(0,.18,-2.5);camera.updateProjectionMatrix();
 if(renderer)renderer.setSize(w,h,false);
 for(const f of fallbacks){f.setPixelRatio(Math.min(devicePixelRatio,1.25));f.setSize(w,h);}
}
resize();addEventListener('resize',resize);
const scrollProgress=()=>scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight);
function animate(now){
 if(disposed)return;frame=requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;
 const target=-.48+scrollProgress()*Math.PI*2;angle=THREE.MathUtils.damp(angle,target,5,dt);
 const order=cards.map((card,i)=>{
  card.update(dt);const theta=angle+i*Math.PI;
  const pose=orbitPose(theta,camera.position);
  card.position.copy(pose.position);card.quaternion.copy(pose.quaternion);
  return {card,i};
 }).sort((a,b)=>a.card.position.z-b.card.position.z);
 order.forEach(({card},i)=>{card.body.renderOrder=i*10;card.videoMesh.renderOrder=i*10+1;card.glassMesh.renderOrder=i*10+2;card.titleMesh.renderOrder=i*10+3;});
 active=order.at(-1).i;$('#activeProject').textContent=projects[active].id;$('#progress').style.transform=`scaleX(${scrollProgress()})`;
 if(!document.hidden){if(renderer)renderer.render(scene,camera);else order.forEach(({i},j)=>fallbacks[i].render(scene,camera,{clear:j===0}));}
}
frame=requestAnimationFrame(animate);
function syncPlayback(){for(const {video}of players){if(playing)video.play().catch(()=>{$('#start').hidden=false;});else video.pause();}$('#playLabel').textContent=playing?'Pause':'Lecture';$('#play').setAttribute('aria-label',playing?'Mettre les vidéos en pause':'Lire les vidéos');}
$('#play').addEventListener('click',()=>{playing=!playing;syncPlayback();});$('#start').addEventListener('click',()=>{playing=true;syncPlayback();$('#start').hidden=true;});
$('#glass').addEventListener('input',e=>cards.forEach(c=>c.setGlass(Number(e.target.value)/100)));
$('#reset').addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
setInterval(()=>{document.documentElement.dataset.orbitState=JSON.stringify({renderer:renderer?'webgl2':'canvas-compatible',scroll:Math.round(scrollProgress()*1000)/1000,angle,active:projects[active].id,manualRotation:false,orientation:"orbit-tangent",cards:cards.map((c,i)=>({project:projects[i].id,position:c.position.toArray(),rotation:c.rotation.toArray().slice(0,3),width:c.width,height:c.height,titleDepth:c.titleDepth,tint:c.tint.getHexString(),fontReady:c.titleReady,time:players[i].video.currentTime,ready:players[i].video.readyState})),errors:errors.slice(-3)});},500);
addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(frame);for(const p of players){p.video.pause();p.hls?.destroy();}cards.forEach(c=>c.dispose());fallbacks.forEach(f=>f.dispose());renderer?.dispose();environment?.dispose();});
