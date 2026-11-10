import {neonTitle} from '../neon-title.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import profile from './district-profile.json' with { type: 'json' };

export async function loadDistrict(gltf, nodes, loader = new GLTFLoader()) {
  const materials = new Map();
  gltf.scene.traverse(object => {
    if (!object.isMesh) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.set(material.name, material);
    }
  });
  let additions;
  if (!nodes.has('DISTRICT_Station_Threshold_Ramp') && !gltf.scene.getObjectByName('DISTRICT_Station_Threshold_Ramp')) {
    additions = await loader.loadAsync('/models/city-render/DistrictAdditions.glb');
    additions.scene.name = 'CITY_DISTRICT_ADDITIONS_RUNTIME';
    additions.scene.traverse(object => {
      if (!object.isMesh) return;
      const replace = material => {
        const source = material.userData.sourceFacade;
        if (!source) return material;
        const original = materials.get(source);
        if (!original) throw new Error(`Missing background facade profile: ${source}`);
        return original;
      };
      object.material = Array.isArray(object.material) ? object.material.map(replace) : replace(object.material);
    });
    gltf.scene.add(additions.scene);
    gltf.scene.updateMatrixWorld(true);
    const attachments=[];
    additions.scene.traverse(object=>{if(object.userData.district_attach_to)attachments.push(object);});
    for(const object of attachments){const parent=nodes.get(object.userData.district_attach_to);if(!parent)throw new Error(`Missing train attachment: ${object.userData.district_attach_to}`);parent.attach(object);}
    const vintage = nodes.get(profile.vintageObject);
    if (vintage && !vintage.userData.districtShifted) {
      vintage.position.x += profile.vintageOffset?.[0] ?? 0;
      vintage.userData.districtShifted = true;
      vintage.updateMatrix();
    }
  }
  const groundMeshes = [];
  for(const name of profile.hiddenTextNodes??[]){const object=nodes.get(name);if(object)object.visible=false;}
  for(const name of profile.titleNodes??[]){const object=nodes.get(name);object?.traverse(mesh=>{if(!mesh.isMesh||mesh.userData.districtTitleAdjusted)return;mesh.userData.districtTitleAdjusted=true;const convert=material=>{return neonTitle(material);};mesh.material=Array.isArray(mesh.material)?mesh.material.map(convert):convert(mesh.material);});}
  let groundMaterial;
  gltf.scene.traverse(object => {
    if (object.userData.district_preview_only || object.name === profile.nativeFogObject) object.visible = false;
    if (!object.isMesh) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (material.name === profile.groundMaterial) groundMaterial = material;
    }
  });
  const originalGround = nodes.get(profile.groundObject);
  if (!originalGround || !groundMaterial) throw new Error('District ground material or original ground is missing');
  originalGround.traverse(object => { if (object.isMesh) groundMeshes.push(object); });
  gltf.scene.updateMatrixWorld(true);
  for (const floor of groundMeshes) {
    const geometry = floor.geometry.clone();
    const positions = geometry.getAttribute('position');
    const uv = new Float32Array(positions.count * 2);
    const point = new THREE.Vector3();
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(floor.matrixWorld);
      uv[i * 2] = point.x / profile.groundTileSize;
      uv[i * 2 + 1] = 1 + point.z / profile.groundTileSize;
    }
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geometry.deleteAttribute('tangent');
    floor.geometry = geometry;
    floor.material = groundMaterial;
  }
  return { profile, groundMeshes: groundMeshes.length, added: Boolean(additions) };
}

export function applyDistrictMist(root) {
  const visited = new Set();
  let count = 0;
  root.traverse(object => {
    if (!object.isMesh) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (visited.has(material) || material.userData.districtMist || !material.isMeshStandardMaterial) continue;
      visited.add(material);
      const previous = material.onBeforeCompile;
      const key = material.customProgramCacheKey.bind(material);
      material.onBeforeCompile = (shader, renderer) => {
        previous.call(material, shader, renderer);
        shader.uniforms.districtGround = { value: profile.groundLevel };
        shader.uniforms.districtDensity = { value: profile.heightFogDensity };
        shader.uniforms.districtHeight = { value: profile.heightFalloff };
        shader.vertexShader = 'varying vec3 vDistrictWorldPosition;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
          #include <project_vertex>
          vDistrictWorldPosition=(modelMatrix*vec4(transformed,1.0)).xyz;
        `);
        shader.fragmentShader = `varying vec3 vDistrictWorldPosition;
          uniform float districtGround;
          uniform float districtDensity;
          uniform float districtHeight;
        ` + shader.fragmentShader;
        // Analytic optical depth through an exponential height layer, without transparent cards.
        shader.fragmentShader = shader.fragmentShader.replace('#include <fog_fragment>', `
          #ifdef USE_FOG
            float districtDistance=length(vDistrictWorldPosition-cameraPosition);
            float districtStart=exp(clamp(-max(cameraPosition.y-districtGround,0.0)/districtHeight,-8.0,0.0));
            float districtEnd=exp(clamp(-(vDistrictWorldPosition.y-districtGround)/districtHeight,-8.0,8.0));
            float districtDelta=vDistrictWorldPosition.y-cameraPosition.y;
            float districtIntegral=abs(districtDelta)<0.001?districtStart:districtHeight*(districtStart-districtEnd)/districtDelta;
            float districtBank=.65+.35*smoothstep(-.5,.7,sin(vDistrictWorldPosition.x*.11)+sin(vDistrictWorldPosition.z*.065));
            float districtLow=clamp(1.0-exp(-districtDensity*districtBank*districtDistance*max(0.0,districtIntegral)),0.0,0.45);
            #ifdef FOG_EXP2
              float districtFar=1.0-exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
            #else
              float districtFar=smoothstep(fogNear,fogFar,vFogDepth);
            #endif
            float districtFog=1.0-(1.0-districtFar)*(1.0-districtLow);
            gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,districtFog);
          #endif
        `);
      };
      material.customProgramCacheKey = () => key() + '|district-height-mist-v1';
      material.userData.districtMist = true;
      material.needsUpdate = true;
      count++;
    }
  });
  return count;
}
