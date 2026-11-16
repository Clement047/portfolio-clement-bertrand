import * as THREE from 'three';
export const CONTACT_EXIT_START=3.66;
export const CONTACT_CLEAR=3.98;
export const CONTACT_FORM_START=3.98;
export const CONTACT_END=4.18;
export function contactRotation(j){
 const d=Math.PI/180,stops=[[2.6,0],[2.78,-15*d],[3.18,-55*d],[3.58,-95*d]];
 if(j<=stops[0][0])return 0;
 for(let i=1;i<stops.length;i++)if(j<stops[i][0]){const [a,x]=stops[i-1],[b,y]=stops[i];return THREE.MathUtils.lerp(x,y,(j-a)/(b-a));}
 return -95*d;
}
export function contactIndex(j){if(j<2.7||j>CONTACT_EXIT_START)return -1;return j<2.98?0:j<3.38?1:2;}
export function createContactJourney(root,arrivalCamera,landingCamera){
 root.updateWorldMatrix(true,true);
 const globe=root.getObjectByName('CONTACT_Lunar_Planet'),title=root.getObjectByName('CONTACT_Title');
 if(!globe||!title)throw Error('Contact planet or title missing');
 const center=globe.getWorldPosition(new THREE.Vector3()),stage=new THREE.Group();stage.name='CONTACT_Rotating_Planet';root.add(stage);stage.position.copy(root.worldToLocal(center.clone()));stage.updateWorldMatrix(true,false);
 const source=root.getObjectByName('CONTACT_Lunar_Root');
 // The title turns with the planet and scrolls out of view, instead of being hidden at once.
 for(const child of [...source.children])if(!child.isLight&&!child.isCamera)stage.attach(child);
 // Own copies of the title materials: fading it never touches the stations sharing them.
// clone() drops the neon shader hook, so carry it over to match the other titles.
 const titleMaterials=[];title.traverse(o=>{if(!o.isMesh)return;o.material=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{const copy=m.clone();copy.onBeforeCompile=m.onBeforeCompile;copy.customProgramCacheKey=m.customProgramCacheKey;copy.transparent=true;copy.userData.baseOpacity=m.opacity;titleMaterials.push(copy);return copy;});if(o.material.length===1)o.material=o.material[0];});
 const endElements=[];stage.traverse(o=>{if(/^CONTACT_(Invitation|Button_Label|Terminal_|Credit|Degree)/.test(o.name))endElements.push(o);});
 // Leave enough altitude to pass through the title without skimming or entering the globe.
 globe.geometry.computeBoundingSphere();const scale=globe.getWorldScale(new THREE.Vector3());
 const safeRadius=globe.geometry.boundingSphere.radius*Math.max(Math.abs(scale.x),Math.abs(scale.y),Math.abs(scale.z))+8;
 const originalTitleCenter=new THREE.Box3().setFromObject(title).getCenter(new THREE.Vector3()),lift=originalTitleCenter.clone().sub(center).normalize().multiplyScalar(10);
 title.position.add(title.parent.worldToLocal(originalTitleCenter.clone().add(lift)).sub(title.parent.worldToLocal(originalTitleCenter.clone())));title.updateWorldMatrix(true,true);
 const raisedCenter=new THREE.Box3().setFromObject(title).getCenter(new THREE.Vector3());arrivalCamera.lookAt(raisedCenter);arrivalCamera.updateWorldMatrix(true,true);
 const titleCenter=new THREE.Box3().setFromObject(title).getCenter(new THREE.Vector3()),start=arrivalCamera.getWorldPosition(new THREE.Vector3()),direction=titleCenter.clone().sub(start).normalize(),passed=titleCenter.clone().addScaledVector(direction,3),helper=new THREE.PerspectiveCamera();
 helper.position.copy(start);helper.lookAt(titleCenter);const startQ=helper.quaternion.clone();
 helper.position.copy(passed);helper.lookAt(titleCenter.clone().addScaledVector(direction,30));const passQ=helper.quaternion.clone();
 const frame=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/4),localCenter=root.worldToLocal(center.clone());
 const framed=v=>root.localToWorld(v.applyQuaternion(frame).add(localCenter));
 const radialUp=new THREE.Vector3(0,1,0).applyQuaternion(frame).transformDirection(root.matrixWorld);
 // Read the upright displays at eye level along the surface, rather than from above.
 const reading=framed(new THREE.Vector3(0,57,38)),lookAt=framed(new THREE.Vector3(0,56,0));helper.position.copy(reading);helper.up.copy(radialUp);helper.lookAt(lookAt);const readingQ=helper.quaternion.clone();
 const finalPosition=reading.clone().addScaledVector(reading.clone().sub(center).normalize(),820),finalQ=readingQ.clone();
 const approachEnd=passed.clone().sub(center).normalize().multiplyScalar(Math.max(safeRadius,reading.distanceTo(center))).add(center);
 const stations=[];stage.traverse(o=>{if(o.userData.contact_id)stations.push(o);});
 for(const o of [...endElements,...stations])o.visible=false;
 // Spread the small moon rocks over the whole globe (they were all grouped near the
 // arrival). Each rock keeps its scale, its height above the ground and its tilt
 // relative to the ground; stations and the terminal keep a clear surrounding area.
 {
  const rocks=[];stage.traverse(o=>{if(/^CONTACT_Moon_Rock/.test(o.name))rocks.push(o);});
  const radius=globe.geometry.boundingSphere.radius*Math.max(Math.abs(scale.x),Math.abs(scale.y),Math.abs(scale.z));
  const keepClear=[];stage.traverse(o=>{if(o.userData.contact_id||/^CONTACT_Terminal_/.test(o.name)||o===title)keepClear.push((o===title?new THREE.Box3().setFromObject(title).getCenter(new THREE.Vector3()):o.getWorldPosition(new THREE.Vector3())).sub(center).normalize());});
  const candidates=[],golden=Math.PI*(3-Math.sqrt(5)),count=rocks.length*3;
  for(let i=0;i<count;i++){const y=1-2*(i+.5)/count,r=Math.sqrt(1-y*y),a=i*golden;const d=new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);if(keepClear.every(c=>c.angleTo(d)>.32))candidates.push(d);}
  const step=candidates.length/Math.max(1,rocks.length),align=new THREE.Quaternion(),turn=new THREE.Quaternion(),world=new THREE.Vector3(),worldQ=new THREE.Quaternion(),parentQ=new THREE.Quaternion();
  rocks.forEach((rock,i)=>{
   const target=candidates[Math.floor(i*step)];if(!target)return;
   rock.getWorldPosition(world);rock.getWorldQuaternion(worldQ);
   const from=world.clone().sub(center),height=from.length()-radius;from.normalize();
   align.setFromUnitVectors(from,target);turn.setFromAxisAngle(target,i*2.399);
   const position=center.clone().addScaledVector(target,radius+height),quaternion=turn.multiply(align).multiply(worldQ);
   rock.parent.updateWorldMatrix(true,false);rock.parent.getWorldQuaternion(parentQ);
   rock.position.copy(rock.parent.worldToLocal(position));rock.quaternion.copy(parentQ.invert().multiply(quaternion));rock.updateMatrixWorld(true);
  });
 }
 const pickable=[];stage.traverse(o=>{if(o.isMesh&&o.userData.contact_href)pickable.push(o);});
 return {stage,titleCenter,direction,reading,pickable,endElements,stations,center,finalPosition,safeRadius,
  keepAboveSurface(position){const radial=position.clone().sub(center),distance=radial.length();if(distance<1e-6)radial.set(0,1,0);if(distance<safeRadius)position.copy(center).add(radial.normalize().multiplyScalar(safeRadius));},
  sample(j,position,quaternion){
   stage.rotation.x=contactRotation(j);
   const titleFade=1-THREE.MathUtils.smoothstep(j,2.63,2.71);title.visible=titleFade>.001;for(const m of titleMaterials)m.opacity=m.userData.baseOpacity*titleFade;stage.scale.setScalar(Math.max(.001,1-THREE.MathUtils.smoothstep(j,3.80,CONTACT_CLEAR)));for(const o of endElements)o.visible=false;for(const o of stations)o.visible=j>=2.62&&j<CONTACT_CLEAR;
   if(j>=2.2&&j<2.7){const t=THREE.MathUtils.smoothstep(j,2.2,2.7);position.copy(start).lerp(reading,t);quaternion.copy(startQ).slerp(readingQ,t);}
   else if(j>=2.7){position.copy(reading);quaternion.copy(readingQ);if(j>CONTACT_EXIT_START){const t=THREE.MathUtils.smoothstep(j,CONTACT_EXIT_START,CONTACT_CLEAR);position.lerp(finalPosition,t);quaternion.slerp(finalQ,t);}}
   root.updateWorldMatrix(true,true);
  }
 };
}
