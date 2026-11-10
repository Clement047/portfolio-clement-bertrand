import {SPACE_BACKGROUND} from '../space/look.js';
import * as THREE from 'three';
import { createSeer } from './vendor/seer-hyperspace.js';
import { sampleHyperspace } from './arrival.js';

// Seer runs on the existing city context. No second WebGL context or independent RAF.
export function createHyperspaceTransition(renderer, cityContainer) {
  const layer=document.createElement('div');
  layer.setAttribute('aria-hidden','true');layer.dataset.cityHyperspace='seer';
  layer.style.cssText=`position:fixed;inset:0;z-index:25;display:none;background:${SPACE_BACKGROUND};pointer-events:none;overflow:hidden`;
  document.body.append(layer);
  let effect=null,active=false,target=null,oldPixelRatio,oldToneMapping,oldExposure,warpTarget,projectTarget;
  const blendScene=new THREE.Scene(),blendCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const blendMaterial=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{warp:{value:null},projects:{value:null},blend:{value:0},city:{value:null},ascent:{value:0},reveal:{value:0},citySky:{value:null},hasCitySky:{value:0},departure:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`uniform sampler2D warp;uniform sampler2D projects;uniform float blend;uniform sampler2D city;uniform float ascent;uniform float reveal;uniform sampler2D citySky;uniform float hasCitySky;uniform float departure;varying vec2 vUv;void main(){
if(ascent>.5){float t=smoothstep(.62,.98,reveal);t=t*t*(3.-2.*t);float edge=1.-1.22*t;float mask=t*smoothstep(edge-.16,edge+.16,vUv.y);float sky=1.;if(hasCitySky>.5){sky=texture2D(citySky,vUv).r;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)sky=min(sky,texture2D(citySky,vUv+vec2(float(x),float(y))*.003).r);}
mask=mix(mask*sky,1.,departure);vec4 cityLinear=sRGBTransferEOTF(texture2D(city,vUv));gl_FragColor=mix(cityLinear,texture2D(warp,vUv),mask);}
else{gl_FragColor=mix(texture2D(warp,vUv),texture2D(projects,vUv),clamp(blend,0.,1.));}
#include <colorspace_fragment>
}`});
  blendScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),blendMaterial));
  class SharedRenderer {
    setClearColor() {} // The effect scene owns its background; preparation must not change the city.
    setPixelRatio() {}
    getPixelRatio(){return renderer.getPixelRatio();}
    setSize() {}
    render(scene,camera){if(!active)return;renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);}
    dispose() {}
  }
  function create(){
    if(effect)return;
    layer.style.display='block';layer.style.visibility='hidden';
    const Seer=createSeer({...THREE,WebGLRenderer:SharedRenderer});
    effect=Seer.Hyperspace({el:layer,color:'#bcd9ff',backgroundColor:SPACE_BACKGROUND,mode:'constant',count:260,speed:.08,streak:.06,depth:1,size:2,variety:.4,mouseControls:false,touchControls:false});
    cancelAnimationFrame(effect.rafId);effect.rafId=0;effect.canvas.remove();
  }
  function disposeTargets(){warpTarget?.dispose();projectTarget?.dispose();warpTarget=null;projectTarget=null;}
  function targets(){
    if(warpTarget)return;
    const ratio=Math.min(1,1280/window.innerWidth,720/window.innerHeight),w=Math.max(1,Math.round(window.innerWidth*ratio)),h=Math.max(1,Math.round(window.innerHeight*ratio));
    warpTarget=new THREE.WebGLRenderTarget(w,h,{depthBuffer:true});projectTarget=warpTarget.clone();
    blendMaterial.uniforms.warp.value=warpTarget.texture;blendMaterial.uniforms.projects.value=projectTarget.texture;
  }
  return {
    prepare(){create();if(effect.scene&&effect.camera)renderer.compile(effect.scene,effect.camera);renderer.compile(blendScene,blendCamera);},
    start(){
      if(active)return;create();oldPixelRatio=renderer.getPixelRatio();oldToneMapping=renderer.toneMapping;oldExposure=renderer.toneMappingExposure;
      active=true;renderer.toneMapping=THREE.NoToneMapping;renderer.toneMappingExposure=1;
      layer.style.visibility='visible';layer.style.display='block';
      renderer.domElement.style.cssText+=';position:absolute;inset:0;width:100%;height:100%;display:block';layer.append(renderer.domElement);
    },
    renderAscent(delta,progress,cityRendering,departure=0,postAscentTime=0){
      if(!active)return;
      renderer.toneMapping=oldToneMapping;renderer.toneMappingExposure=oldExposure;
      const cityTexture=cityRendering.renderTexture();
      renderer.toneMapping=THREE.NoToneMapping;renderer.toneMappingExposure=1;
      targets();target=warpTarget;Object.assign(effect.options,sampleHyperspace(0));effect.onFrame(delta*.4,progress*2.1+postAscentTime);effect.render();target=null;
      blendMaterial.uniforms.citySky.value=cityRendering.getSkyMask?.()??null;blendMaterial.uniforms.hasCitySky.value=cityRendering.getSkyMask?1:0;blendMaterial.uniforms.departure.value=departure;blendMaterial.uniforms.city.value=cityTexture;blendMaterial.uniforms.ascent.value=1;blendMaterial.uniforms.reveal.value=progress;
      renderer.setRenderTarget(null);renderer.clear();renderer.render(blendScene,blendCamera);
    },
    render(delta,time,blend=0,projects,cityRendering){
      if(!active)return;
      if(time<.75&&blend===0&&cityRendering){this.renderAscent(delta,1,cityRendering,THREE.MathUtils.smoothstep(time,0,.75),time);return;}
      blendMaterial.uniforms.ascent.value=0;
      const motion=sampleHyperspace(time);Object.assign(effect.options,motion);effect.onFrame(delta*Math.min(1,motion.speed/.2),time+2.1);
      if(blend>0&&projects){
        targets();target=warpTarget;effect.render();target=null;projects.renderTo(projectTarget,time);
        renderer.setRenderTarget(null);renderer.clear();blendMaterial.uniforms.blend.value=blend;renderer.render(blendScene,blendCamera);
      }else{target=null;effect.render();}
    },
    finish(){
      if(active){cityContainer.append(renderer.domElement);renderer.setPixelRatio(oldPixelRatio);renderer.setSize(window.innerWidth,window.innerHeight);renderer.toneMapping=oldToneMapping;renderer.toneMappingExposure=oldExposure;}
      active=false;target=null;effect?.destroy();effect=null;disposeTargets();layer.style.display='none';
    },
    resize(){effect?.resize();disposeTargets();},
    dispose(){this.finish();blendScene.children[0].geometry.dispose();blendMaterial.dispose();layer.remove();}
  };
}
