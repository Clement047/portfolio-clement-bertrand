import * as THREE from 'three';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import details from '../../data/contact.json' with {type:'json'};
import {neonTitle} from '../neon-title.js';

export async function replaceContactType(root){
 // Typeface converted once from le-murmure.ttf: TTFLoader would fetch opentype.js from a third-party CDN on every visit.
 const font=await new FontLoader().loadAsync('/fonts/les-murmures/le-murmure.typeface.json');
 for(const c of details)for(const suffix of ['Identifier','Label']){
  const target=root.getObjectByName('CONTACT_Social_'+c.id+'_'+suffix);
  if(!target?.isMesh)continue;
  const icon=target.parent.children.find(child=>child.isMesh&&child.name.includes('Icon'));
  const identifier=suffix==='Identifier';
  const geometry=new TextGeometry(identifier?c.label:c.name,{
   font,size:1,depth:.035,curveSegments:6,bevelEnabled:true,
   bevelThickness:.008,bevelSize:.004,bevelSegments:2
  });
  geometry.computeBoundingBox();
  const size=geometry.boundingBox.getSize(new THREE.Vector3());
  const scale=Math.min(18/size.x,(identifier?2.1:1.25)/size.y);
  geometry.scale(scale,scale,scale);
  // Imported Blender meshes use XZ for lettering and Y for thickness.
  geometry.rotateX(-Math.PI/2);
  geometry.computeBoundingBox();
  const box=geometry.boundingBox;
  geometry.translate(-box.min.x,0,-(box.min.z+box.max.z)/2);
  const oldGeometry=target.geometry;
  target.geometry=geometry;
  target.material=neonTitle(new THREE.MeshStandardMaterial());
  if(icon){
   target.quaternion.copy(icon.quaternion);
   target.position.set(icon.position.x+7,icon.position.y+(identifier?-.8:2.4),icon.position.z+.08);
  }
  target.userData.contact_href=c.href;
  oldGeometry.dispose();
 }
}
