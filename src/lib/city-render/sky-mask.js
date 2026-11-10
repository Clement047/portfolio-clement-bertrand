import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
// Capture the geometry depth before fullscreen postprocessing overwrites it.
export class SkyMaskPass extends Pass {
 constructor(){super();this.needsSwap=false;this.enabled=false;this.target=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false});this.material=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{sceneDepth:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform sampler2D sceneDepth;varying vec2 vUv;void main(){float sky=step(.9999999,texture2D(sceneDepth,vUv).r);gl_FragColor=vec4(vec3(sky),1.);}'});this.quad=new FullScreenQuad(this.material);}
 render(renderer,writeBuffer,readBuffer){const previous=renderer.getRenderTarget();this.material.uniforms.sceneDepth.value=readBuffer.depthTexture;renderer.setRenderTarget(this.target);this.quad.render(renderer);renderer.setRenderTarget(previous);}
 setSize(w,h){const scale=Math.min(1,768/w);this.target.setSize(Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale)));}
 dispose(){this.target.dispose();this.material.dispose();this.quad.dispose();}
}
