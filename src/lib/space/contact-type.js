import * as THREE from 'three';
import {TTFLoader} from 'three/addons/loaders/TTFLoader.js';
import {Font} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import details from '../../data/contact.json' with {type:'json'};
import {neonTitle} from '../neon-title.js';
export async function replaceContactType(root){
 const font=new Font(await new TTFLoader().loadAsync('/fonts/les-murmures/le-murmure.ttf'));
 for(const c of details)for(const suffix of ['Identifier','Label']){
 const target=root.getObjectByName('CONTACT_Social_'+c.id+'_'+suffix);if(!target?.isMesh)continue;
 target.geometry.computeBoundingBox();const old=target.geometry.boundingBox.clone(),oldSize=old.getSize(new THREE.Vector3());
 const geometry=new TextGeometry(suffix==='Identifier'?c.label:c.name,{font,size:1,depth:.035,curveSegments:6,bevelEnabled:true,bevelThickness:.008,bevelSize:.004,bevelSegments:2});
 geometry.computeBoundingBox();const box=geometry.boundingBox,size=box.getSize(new THREE.Vector3()),scale=Math.min(oldSize.x/size.x,oldSize.y/size.y);
 geometry.scale(scale,scale,scale);geometry.computeBoundingBox();const offset=old.getCenter(new THREE.Vector3()).sub(geometry.boundingBox.getCenter(new THREE.Vector3()));geometry.translate(offset.x,offset.y,offset.z);
 target.geometry=geometry;target.material=neonTitle(new THREE.MeshStandardMaterial());
 }
}
