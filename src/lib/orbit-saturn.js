import {styleSaturn} from './saturn-style.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createSaturnRings } from './space/rings.js';
import { createSaturnAtmosphere } from './space/atmosphere.js';

// Share the cards' scene and depth buffer: Saturn occludes the back of the orbit.
export async function createOrbitSaturn(THREE,scene){
 const gltf=await new GLTFLoader().loadAsync('/models/space/ESPACE_PROJETS.glb?v=arrival-5');
 gltf.scene.updateMatrixWorld(true);
 const sourceGlobe=gltf.scene.getObjectByName('SPACE_Saturn_Globe'),sourceRings=gltf.scene.getObjectByName('SPACE_Saturn_Rings');
 if(!sourceGlobe||!sourceRings)throw Error('Saturn meshes missing');
 const center=sourceGlobe.getWorldPosition(new THREE.Vector3()),size=new THREE.Box3().setFromObject(sourceGlobe).getSize(new THREE.Vector3());
 const group=new THREE.Group();group.name='PROJECT_ORBIT_SATURN';
 for(const source of [sourceGlobe,sourceRings]){
  const mesh=source.clone();mesh.matrix.copy(source.matrixWorld);mesh.matrix.decompose(mesh.position,mesh.quaternion,mesh.scale);mesh.position.sub(center);group.add(mesh);
 }
 group.scale.setScalar(4.3/Math.max(size.x,size.y,size.z));
 group.position.set(0,1.27,-8.5);scene.add(group);group.updateMatrixWorld(true);
 const globe=group.getObjectByName('SPACE_Saturn_Globe'),rings=group.getObjectByName('SPACE_Saturn_Rings');
 const sun=new THREE.DirectionalLight(0xa7caff,1.65);sun.position.set(-8,8,6);sun.target.position.copy(group.position);scene.add(sun,sun.target);
 const ringSurface=createSaturnRings(rings,globe,sun),atmosphere=createSaturnAtmosphere(globe,sun);
 const rim=new THREE.DirectionalLight(0x865bff,.75);rim.position.set(7,4,-14);rim.target.position.copy(group.position);scene.add(rim,rim.target);
 const fade=styleSaturn(globe,rings,group.getObjectByName('SPACE_Saturn_Atmospheric_Limb'));
 return {globe,group,setHandoff(progress){fade(THREE.MathUtils.smoothstep(progress,.82,1));},dispose(){ringSurface.dispose();atmosphere.dispose();scene.remove(group,sun,sun.target,rim,rim.target);const textures=new Set(),geometries=new Set(),materials=new Set();gltf.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());}};
}
