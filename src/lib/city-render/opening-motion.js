import * as THREE from 'three';
export function mountCityOpeningMotion(camera,rendering,entry){
 if(matchMedia('(prefers-reduced-motion:reduce)').matches)return {dispose(){}};
 camera.updateWorldMatrix(true,false);
 const base=camera.getWorldPosition(new THREE.Vector3()),baseQ=camera.getWorldQuaternion(new THREE.Quaternion()),forward=new THREE.Vector3(0,0,-1).applyQuaternion(baseQ),pivot=base.clone().addScaledVector(forward,180);
 const up=new THREE.Vector3(0,1,0).applyQuaternion(baseQ),right=new THREE.Vector3(1,0,0).applyQuaternion(baseQ),offset=new THREE.Vector2(),desired=new THREE.Vector2(),last=new THREE.Vector2(.5,.5),ripples=Array.from({length:8},()=>new THREE.Vector4(.5,.5,-100,0));
 const rotation=new THREE.Quaternion(),pitch=new THREE.Quaternion(),world=new THREE.Vector3(),worldQ=new THREE.Quaternion(),parentQ=new THREE.Quaternion();
 let frame=0,disposed=false,index=0,lastRipple=-Infinity,lastDraw=0,lastTime=performance.now(),activeUntil=0;
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.style.cssText='position:absolute;width:0;height:0;pointer-events:none';svg.setAttribute('aria-hidden','true');svg.innerHTML='<defs><filter id="city-opening-wave" x="-10%" y="-20%" width="120%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".006 .01" numOctaves="2" seed="9" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></defs>';entry.append(svg);const displacement=svg.querySelector('feDisplacementMap');entry.style.filter='url(#city-opening-wave)';
 function request(){if(!frame&&!disposed)frame=requestAnimationFrame(draw);}
 function draw(now){frame=0;if(disposed||entry.hidden||document.hidden)return;if(now-lastDraw<1000/24){request();return;}const dt=Math.min(.1,(now-lastTime)/1000);lastTime=now;lastDraw=now;offset.lerp(desired,1-Math.exp(-dt*5));
  rotation.setFromAxisAngle(up,offset.x);pitch.setFromAxisAngle(right,-offset.y);rotation.multiply(pitch);world.copy(base).sub(pivot).applyQuaternion(rotation).add(pivot);worldQ.copy(rotation).multiply(baseQ);
  camera.position.copy(camera.parent?camera.parent.worldToLocal(world):world);camera.quaternion.copy(camera.parent?camera.parent.getWorldQuaternion(parentQ).invert().multiply(worldQ):worldQ);camera.updateMatrixWorld(true);
  rendering.setOpeningMotion(ripples,now/1000,true);
  const strength=Math.max(0,...ripples.map(r=>Math.exp(-Math.max(0,now/1000-r.z)*1.5)*r.w));displacement.setAttribute('scale',String(strength*4));rendering.render();
  if(now<activeUntil||offset.distanceToSquared(desired)>.000001)request();
 }
 function move(event){if(disposed||entry.hidden||event.pointerType==='touch')return;const x=event.clientX/innerWidth,y=1-event.clientY/innerHeight,now=performance.now();desired.set((x-.5)*.28,(y-.5)*.22);const distance=last.distanceTo(new THREE.Vector2(x,y));if(now-lastRipple>70&&distance>.018){ripples[index].set(x,y,now/1000,Math.min(1,.4+distance*5));index=(index+1)%8;last.set(x,y);lastRipple=now;}activeUntil=now+3300;request();}
 function leave(){desired.set(0,0);activeUntil=performance.now()+800;request();}
 function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);window.removeEventListener('pointermove',move);document.documentElement.removeEventListener('pointerleave',leave);entry.style.removeProperty('filter');svg.remove();camera.position.copy(camera.parent?camera.parent.worldToLocal(base.clone()):base);camera.quaternion.copy(camera.parent?camera.parent.getWorldQuaternion(parentQ).invert().multiply(baseQ):baseQ);camera.updateMatrixWorld(true);rendering.setOpeningMotion(ripples,performance.now()/1000,false);}
 window.addEventListener('pointermove',move,{passive:true});document.documentElement.addEventListener('pointerleave',leave);document.addEventListener('astro:before-swap',dispose,{once:true});return {dispose};
}
