import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createParallaxStars,animateNebulaDome} from './galaxy.js';
import {addAmbientVeil} from '../ambient-veil.js';
import {SPACE_BACKGROUND} from './look.js';
export async function createSpaceBackdrop(host){
 let renderer;try{renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'low-power'});}catch{return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setSize(innerWidth,innerHeight);renderer.toneMapping=THREE.AgXToneMapping;renderer.toneMappingExposure=1.05;host.append(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color(SPACE_BACKGROUND);const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.1,6000);
 const composer=new EffectComposer(renderer),render=new RenderPass(scene,camera),output=new OutputPass();composer.addPass(render);composer.addPass(output);addAmbientVeil(output,.65);
 const stars=createParallaxStars(scene);let asset,nebula,frame=0,disposed=false,last=0,visible=true;
 function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);}
 function draw(now){if(disposed)return;frame=requestAnimationFrame(draw);if(document.hidden||!visible||now-last<100)return;last=now;stars.update(now/1000,renderer.getPixelRatio());nebula?.update(now/1000);composer.render();}
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;});observer.observe(host.closest('section')||host);window.addEventListener('resize',resize);frame=requestAnimationFrame(draw);
 try{const gltf=await new GLTFLoader().loadAsync('/models/space/background.glb');asset=gltf.scene;asset.traverse(o=>{if(!o.isMesh)return;const old=o.material;o.material=new THREE.MeshBasicMaterial({map:old.map||old.emissiveMap,color:old.map?old.color:old.emissive,side:THREE.BackSide,depthWrite:false,depthTest:false});old.dispose();o.geometry.computeBoundingSphere();const radius=o.geometry.boundingSphere.radius;const scale=o.getWorldScale(new THREE.Vector3()).length()/Math.sqrt(3);if(radius*scale>5000)asset.scale.setScalar(2000/(radius*scale));nebula=animateNebulaDome(o);});scene.add(asset);}catch(error){console.warn('Fond spatial',error);}
 return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',resize);stars.dispose();asset?.traverse(o=>{o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose();});composer.dispose();output.dispose();renderer.dispose();renderer.domElement.remove();};
}

