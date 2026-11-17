import {loadPageModel,disposeModel} from '../page-model.js';
import {createVisibleLoop} from '../visible-loop.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createParallaxStars,animateNebulaDome} from './galaxy.js';
import {addAmbientVeil} from '../ambient-veil.js';
import {SPACE_BACKGROUND} from './look.js';
export async function createSpaceBackdrop(host,{signal}={}){
 if(signal?.aborted)return;
 let renderer;try{renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'low-power'});}catch{return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setSize(innerWidth,innerHeight);renderer.toneMapping=THREE.AgXToneMapping;renderer.toneMappingExposure=1.05;host.append(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color(SPACE_BACKGROUND);const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.1,6000);
 const composer=new EffectComposer(renderer),render=new RenderPass(scene,camera),output=new OutputPass();composer.addPass(render);composer.addPass(output);addAmbientVeil(output,.65);
 const stars=createParallaxStars(scene);let asset,nebula,disposed=false;const lifetime=new AbortController();
 function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);playback.invalidate();}
 const playback=createVisibleLoop(now=>{stars.update(now/1000,renderer.getPixelRatio());nebula?.update(now/1000);composer.render();},{interval:100,visible:false});
 const observer=new IntersectionObserver(entries=>playback.setVisible(entries[0].isIntersecting));observer.observe(host.closest('section')||host);window.addEventListener('resize',resize);
 signal?.addEventListener('abort',dispose,{once:true});
 try{const gltf=await loadPageModel(new GLTFLoader(),'/models/space/background.glb',lifetime.signal);asset=gltf.scene;asset.traverse(o=>{if(!o.isMesh)return;const old=o.material;o.material=new THREE.MeshBasicMaterial({map:old.map||old.emissiveMap,color:old.map?old.color:old.emissive,side:THREE.BackSide,depthWrite:false,depthTest:false});old.dispose();o.geometry.computeBoundingSphere();const radius=o.geometry.boundingSphere.radius;const scale=o.getWorldScale(new THREE.Vector3()).length()/Math.sqrt(3);if(radius*scale>5000)asset.scale.setScalar(2000/(radius*scale));nebula=animateNebulaDome(o);});scene.add(asset);playback.invalidate();}catch(error){if(error.name!=='AbortError'&&!disposed)console.warn('Fond spatial',error);}
 return dispose;
 function dispose(){if(disposed)return;disposed=true;lifetime.abort();signal?.removeEventListener('abort',dispose);playback.dispose();observer.disconnect();window.removeEventListener('resize',resize);stars.dispose();disposeModel(asset);composer.dispose();output.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
}

