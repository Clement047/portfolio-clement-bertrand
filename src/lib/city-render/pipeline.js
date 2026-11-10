import {addAmbientVeil} from '../ambient-veil.js';
import { prepareCityView, createPreparationCache, yieldMainThread } from './startup.js';
import { traceCityStage } from './trace.js';
import { SkyMaskPass } from './sky-mask.js';
import * as THREE from 'three';
import { createMistBanks, createLightMotes } from './atmosphere.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { restoreFacade } from './facades.js';
import { loadDistrict, applyDistrictMist } from './district.js';
import metadata from './blender-render.json' with { type: 'json' };

export function classifyClips(root, clips) {
  const valid=[], foreign=[], mixed=[];
  for (const clip of clips) {
    const found=clip.tracks.filter(track=>THREE.PropertyBinding.findNode(root,THREE.PropertyBinding.parseTrackName(track.name).nodeName));
    if (found.length===clip.tracks.length) valid.push(clip);
    else if (found.length===0) foreign.push(clip);
    else mixed.push(clip);
  }
  return {valid,foreign,mixed};
}

export async function indexBlenderNodes(gltf) {
  const byName=new Map();
  const json=gltf.parser.json, indices=new Set();
  function visit(i){if(indices.has(i))return;indices.add(i);for(const child of json.nodes[i].children??[])visit(child);}
  for(const i of json.scenes[json.scene??0].nodes)visit(i);
  // getDependency returns the exact node instance even when other scenes have pruned associations.
  await Promise.all([...indices].map(async i=>byName.set(json.nodes[i].name,await gltf.parser.getDependency('node',i))));
  return byName;
}

export async function createCityRendering(renderer, scene, gltf, assets) {
  const nodes=await indexBlenderNodes(gltf), graphs=new Map(metadata.facades.map(g=>[g.name,g]));
  const district=await loadDistrict(gltf,nodes,assets);
  const materials=new Set(), punctual=[], areas=[], scale=new THREE.Vector3();
  const stats={facadeMaterials:0,facadeMeshes:0,areaLights:0,posters:0,shadowLights:[],hiddenVolume:false,assetRepairs:[],lightGain:1};
  stats.backgroundBuildings=district.profile.backgroundBuildings.length;
  stats.districtLocalLights=district.profile.localLights;
  stats.groundSurfaces=district.groundMeshes;
  stats.quarantinedInvalidTransforms=[];
  for(const name of metadata.invalidTransforms??[]){const object=nodes.get(name);if(object){object.visible=false;stats.quarantinedInvalidTransforms.push(name);}}
  for(const name of metadata.hiddenRenderObjects??[]){const object=nodes.get(name);if(object)object.visible=false;}
  gltf.scene.traverse(object=>{
    if(object.name==='CP2_ATMOSPHERE_PREVIEW_ONLY'){object.visible=false;stats.hiddenVolume=true;}
    if(object.isLight)punctual.push({light:object,intensity:object.intensity});
    if(!object.isMesh)return;
    object.castShadow=true;object.receiveShadow=true;
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      if(graphs.has(material.name))stats.facadeMeshes++;
      if(materials.has(material))continue;
      materials.add(material);
      if(graphs.has(material.name)){restoreFacade(material,graphs.get(material.name));stats.facadeMaterials++;}
      if(material.name.startsWith('RF_')&&material.name.includes('Artwork_Exact'))stats.posters++;
      if(material.name==='Iridescent Metal Blue.001'){
        material.metalness=1;material.roughness=.2;
        material.onBeforeCompile=shader=>{
          shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
            float facing=clamp(1.0-abs(dot(normalize(normal),normalize(vViewPosition))),0.0,1.0);
            float rampA=clamp((facing-.3909089565)/(.8590910435-.3909089565),0.0,1.0);
            float rampB=clamp(facing/.3636365235,0.0,1.0);
            diffuseColor.rgb=mix(mix(vec3(1.,0.,.2737968266),vec3(0.,.010785725,1.),rampB),vec3(0.,1.,.2531082034),rampA);
          `);
        };
        material.customProgramCacheKey=()=> 'synth-original-iridescence-v1';material.needsUpdate=true;
      }
    }
  });

  RectAreaLightUniformsLib.init();
  const C=new THREE.Matrix4().set(1,0,0,0, 0,0,1,0, 0,-1,0,0, 0,0,0,1);
  for(const data of metadata.areaLights){
    let anchor=nodes.get(data.name);
    if(!anchor){
      const parent=nodes.get(data.parent)??gltf.scene;
      anchor=new THREE.Object3D();anchor.name=`${data.name}_RestoredAnchor`;
      // Missing glTF light nodes: preserve the Blender parent-local placement.
      const local=new THREE.Matrix4().fromArray(data.matrix);
      const converted=C.clone().multiply(local);
      converted.decompose(anchor.position,anchor.quaternion,anchor.scale);parent.add(anchor);
    }
    const factor=['DISK','ELLIPSE'].includes(data.shape)?Math.sqrt(Math.PI)/2:1;
    const light=new THREE.RectAreaLight(new THREE.Color().fromArray(data.color),0,data.size*factor,data.sizeY*factor);
    light.name=`${data.name}_Area`;anchor.add(light);areas.push({anchor,light,data,width:light.width,height:light.height});
  }
  stats.areaLights=areas.length;

  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.AgXToneMapping;
  renderer.toneMappingExposure=2**metadata.view.exposure;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  for(const name of ['CP_City_Moon_0','Spot.005']){
    const light=nodes.get(name);
    if(!light?.shadow)continue;
    light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.bias=-.00015;light.shadow.normalBias=.035;
    if(light.isDirectionalLight){Object.assign(light.shadow.camera,{left:-170,right:170,top:170,bottom:-170,near:.1,far:600});light.shadow.camera.updateProjectionMatrix();}
    stats.shadowLights.push(name);
  }

  const background=new THREE.Color().setRGB(.003,.005,.013);
  scene.background=background;scene.fog=new THREE.FogExp2(background,district.profile.globalFogDensity);
  const pmrem=new THREE.PMREMGenerator(renderer), world=new THREE.Scene();world.background=background;
  const envMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,vertexShader:'varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 dir;void main(){float h=smoothstep(-.2,1.,normalize(dir).y);gl_FragColor=vec4(mix(vec3(.003,.004,.009),vec3(.024,.035,.075),h),1.);}'});
  const envSphere=new THREE.Mesh(new THREE.SphereGeometry(5,24,12),envMaterial);world.add(envSphere);
  const strips=[];
  for(const [x,color] of [[-3.5,0x3c6ea8],[3.5,0x7555b5]]){const strip=new THREE.Mesh(new THREE.PlaneGeometry(.3,3),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));strip.position.set(x,1,-2);world.add(strip);strips.push(strip);}
  const environment=pmrem.fromScene(world,.12);scene.environment=environment.texture;pmrem.dispose();
  envSphere.geometry.dispose();envMaterial.dispose();strips.forEach(o=>{o.geometry.dispose();o.material.dispose();});
  for(const [name,color,intensity,pos] of [['CITY_Cyan_Bounce',0x459dd6,32,[40,9,-50]],['CITY_Violet_Bounce',0x9258d4,25,[5,6,-95]]]){const light=new THREE.PointLight(color,intensity,22,2);light.name=name;light.position.fromArray(pos);scene.add(light);}
  const anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  for(const material of materials)for(const key of ['map','emissiveMap','normalMap','roughnessMap','metalnessMap']){const tex=material[key];if(tex){tex.anisotropy=anisotropy;tex.needsUpdate=true;}}
  const mist=createMistBanks(scene),motes=createLightMotes(scene);
  const composer=new EffectComposer(renderer);
  for(const buffer of [composer.renderTarget1,composer.renderTarget2])buffer.depthTexture=new THREE.DepthTexture(buffer.width,buffer.height,THREE.UnsignedIntType);
  const skyMask=new SkyMaskPass();
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  let animatedShadows=false,lastShadow=-Infinity;
  const bloom=new UnrealBloomPass(new THREE.Vector2(window.innerWidth,window.innerHeight),.22,.36,1.05);
  const smaa=new SMAAPass();
  const output=new OutputPass();
  const colorStage='// color space';
  output.material.fragmentShader=output.material.fragmentShader.replace(colorStage,`
    // Very subtle edge falloff; protect the central reading area and original artwork colors.
    vec2 screenEdge=(vUv-.5)*vec2(1.15,1.0);
    float edgeFalloff=smoothstep(.16,.62,dot(screenEdge,screenEdge));
    gl_FragColor.rgb*=1.0-.12*edgeFalloff;
    // color space
  `);
  addAmbientVeil(output,.85);
  let renderPass;
  // Calibrated against the native Blender reference at the same camera pose.
  // The exporter multiplied radiant Blender units by 683; leave material emission untouched.
  let gain=1/683;
  function setLightGain(value){
    gain=value;stats.lightGain=value;
    punctual.forEach(({light,intensity})=>light.intensity=intensity*gain);
  }
  setLightGain(gain);
  function update(seconds){
    mist.update(seconds);motes.update(seconds);
    if(animatedShadows&&seconds-lastShadow>.2){renderer.shadowMap.needsUpdate=true;lastShadow=seconds;}
    const sample=((seconds%8)+8)%8*metadata.fps, i=Math.floor(sample), t=sample-i;
    for(const {anchor,light,data,width,height} of areas){
      anchor.getWorldScale(scale);light.width=width*Math.abs(scale.x);light.height=height*Math.abs(scale.y);
      const energy=data.samples.length?THREE.MathUtils.lerp(data.samples[i],data.samples[Math.min(i+1,data.samples.length-1)],t):data.energy;
      const synthGain=data.parent==='ABOUT_SYNTH_SPATIAL_MOVE_ME'?(district.profile.synthOriginalLightGain??1):1;
      light.intensity=energy*683*gain*synthGain/(Math.PI*Math.max(.000001,light.width*light.height));
    }
  }
  if(import.meta.env?.DEV&&new URLSearchParams(location.search).has('city-audit')){
    const panel=document.createElement('aside');panel.setAttribute('aria-label','Comparaison de lumière');
    panel.style.cssText='position:fixed;right:20px;bottom:28px;z-index:30;padding:12px;background:#050817ed;color:#dfe8ff;font:12px system-ui;border:1px solid #445577;max-width:320px';
    const label=document.createElement('label');label.textContent='Intensité des lumières ';
    const select=document.createElement('select');select.setAttribute('aria-label','Intensité des lumières');
    for(const [value,text] of [[1,'Photométrie glTF'],[.1,'Comparaison ×0,1'],[.01,'Comparaison ×0,01'],[1/683,'Unités Blender']]){
      const option=document.createElement('option');option.value=String(value);option.textContent=text;option.selected=value===gain;select.append(option);
    }
    select.addEventListener('change',()=>setLightGain(Number(select.value)));label.append(select);panel.append(label);document.body.append(panel);
  }
  return {stats,nodes,update,setLightGain,
    freezeStaticTransforms(){
      // Keep all animated targets and their descendants live, including attached
      // neon strips, bones and skinned surfaces. Only cache static local matrices.
      const dynamic=new Set();
      for(const clip of gltf.animations)for(const track of clip.tracks){
        const target=THREE.PropertyBinding.findNode(gltf.scene,THREE.PropertyBinding.parseTrackName(track.name).nodeName);
        target?.traverse(object=>dynamic.add(object));
      }
      let cached=0;
      gltf.scene.traverse(object=>{
        if(dynamic.has(object)||object.isBone||object.isSkinnedMesh||object.isLight||object.isCamera)return;
        object.updateMatrix();object.matrixAutoUpdate=false;cached++;
      });
      stats.cachedStaticTransforms=cached;
    },
    setShadowActivity(value){animatedShadows=value;},
    async prepare(camera, setWarmupPose, progress = () => {}){
      // Warm the initial movement before exposing the entry button. This covers
      // materials entering the first view without compiling the entire city.
      const preparationCache = createPreparationCache();
      stats.openingViews = [];
      // RenderPass draws to this linear off-screen target. Compiling against
      // the screen instead creates different tone-mapping/color-space variants
      // that must be compiled all over again at the first composer render.
      const previousTarget=renderer.getRenderTarget();
      renderer.setRenderTarget(composer.readBuffer);
      try {
      for(let step=0;step<4;step++){
        await yieldMainThread();
        await setWarmupPose?.(step);
        update(0);
        const limits=[55,85,94,96,97];
        stats.openingViews.push(await prepareCityView(renderer, scene, camera, preparationCache, undefined, (message,fraction) => progress(message, limits[step]+(limits[step+1]-limits[step])*(fraction??0))));
        progress('Vue initiale préparée…',limits[step+1]);
      }
      } finally { renderer.setRenderTarget(previousTarget); }
      traceCityStage('opening-programs-ready', { programs:renderer.info.programs.length });
      // The last pose restores the opening camera: draw its snapshot only once.
      progress('Premier rendu de la ville…',97);
      await yieldMainThread();
      traceCityStage('opening-render-begin');
      composer.render();
      traceCityStage('opening-render-end');
      progress('Finalisation de l’affichage…',99);
      // RAF is a browser paint boundary, not a GPU completion signal. Wait for
      // the submitted opening views once, with a bounded non-blocking WebGL2 fence.
      const gl=renderer.getContext(),sync=gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE,0);
      if(sync){
        gl.flush();const started=performance.now();
        try{await new Promise(resolve=>{
          function poll(){const status=gl.clientWaitSync(sync,0,0);
            if(status===gl.ALREADY_SIGNALED||status===gl.CONDITION_SATISFIED||status===gl.WAIT_FAILED||gl.isContextLost()||performance.now()-started>2500){stats.openingGpuWaitMs=Math.round(performance.now()-started);stats.openingGpuReady=status===gl.ALREADY_SIGNALED||status===gl.CONDITION_SATISFIED;resolve();}
            else setTimeout(poll, 16);
          }poll();
        });}finally{gl.deleteSync(sync);}
      }

    },
    refreshAtmosphere(){stats.mistMaterials=(stats.mistMaterials??0)+applyDistrictMist(gltf.scene);},
    setCamera(camera){renderPass=new RenderPass(scene,camera);composer.addPass(renderPass);composer.addPass(skyMask);composer.addPass(bloom);composer.addPass(smaa);composer.addPass(output);},
    render(){composer.render();},
    getSkyMask(){return skyMask.target.texture;},
    renderTexture(){const previous=composer.renderToScreen;composer.renderToScreen=false;skyMask.enabled=true;try{composer.render();return composer.readBuffer.texture;}finally{composer.renderToScreen=previous;skyMask.enabled=false;}},
    resize(width,height){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(width,height);},
    dispose(){mist.dispose();motes.dispose();environment.dispose();skyMask.dispose();composer.dispose();bloom.dispose();smaa.dispose();output.dispose();},
  };
}

// Correct only portable surfaces/morphs missing from the city export. Original animation nodes stay put.
export async function restoreAssetSurfaces(gltf, loader, rendering, {deferTrails=false}={}) {
  const {nodes,stats}=rendering;
  const tasks=[];
  if(nodes.has('SPARKY_FUSEE_body'))tasks.push(loader.loadAsync('/models/city-render/SparkySurfaces.glb').then(asset=>{
    for(const source of asset.scene.children){
      const sourceName=source.userData.sparkyFuseeSource??source.name;
      const target=nodes.get(`SPARKY_FUSEE_${sourceName}`);
      if(!target)continue;
      if(source.isMesh&&target.isMesh){target.geometry=source.geometry;target.material=source.material;}
      else{
        if(target.isMesh)target.geometry=new THREE.BufferGeometry();
        target.children.filter(o=>o.isMesh).forEach(o=>o.visible=false);
        const replacement=new THREE.Group();replacement.name='PortableSurfaces';
        source.traverse(mesh=>{if(mesh.isMesh){const part=new THREE.Mesh(mesh.geometry,mesh.material);part.castShadow=true;part.receiveShadow=true;replacement.add(part);}});
        target.add(replacement);
      }
      stats.assetRepairs.push(sourceName);
    }
  }));
  let trails;
  let trailRequest;
  function prepareDeferred(){
    if(trailRequest)return trailRequest;
    if(![...nodes.keys()].some(n=>n.startsWith('TRAIL |')))return Promise.resolve();
    trailRequest=loader.loadAsync('/models/city-render/SynthTrails.glb').then(asset=>{
    const copies=[];
    asset.scene.traverse(source=>{
      if(!source.isMesh)return;
      const anchor=nodes.get(source.userData.aboutSynthSource??source.name);
      if(!anchor)return;
      const target=anchor.isMesh?anchor:new THREE.Mesh(source.geometry,source.material);
      if(target!==anchor){target.name=`${anchor.name}_RestoredSurface`;anchor.add(target);}
      target.geometry=source.geometry;target.updateMorphTargets();target.userData.cityRestoredTrail=true;copies.push({source,target});
    });
    const mixer=new THREE.AnimationMixer(asset.scene);
    for(const clip of asset.animations)mixer.clipAction(clip).setLoop(THREE.LoopRepeat,Infinity).play();
    trails={mixer,copies};stats.trailMeshes=copies.length;rendering.refreshAtmosphere?.();
    });return trailRequest;
  }
  if(!deferTrails)tasks.push(prepareDeferred());
  await Promise.all(tasks);
  rendering.refreshAtmosphere?.();
  return {prepareDeferred,update(seconds){
    if(!trails)return;
    trails.mixer.setTime(seconds);
    for(const {source,target} of trails.copies){for(let i=0;i<source.morphTargetInfluences.length;i++)target.morphTargetInfluences[i]=source.morphTargetInfluences[i];}
  }};
}
