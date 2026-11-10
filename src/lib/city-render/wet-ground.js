import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

// One shared, low-resolution planar reflection for the connected street surface.
// The original ground still supplies its PBR texture, normals, and direct lighting.
export function createWetGroundReflection(scene) {
  const reflectionScene = new THREE.Scene();
  reflectionScene.background = scene.background;
  reflectionScene.fog = scene.fog;
  reflectionScene.add(new THREE.HemisphereLight(0x8095bb, 0x080c15, .14));
  const reflected = [];
  scene.updateMatrixWorld(true);
  scene.traverse(source => {
    if (!source.isMesh || source.isSkinnedMesh || !source.visible) return;
    const materials = Array.isArray(source.material) ? source.material : [source.material];
    const architecture = source.name.startsWith('Group') || source.name.startsWith('DISTRICT_Background_');
    const sign = materials.some(material => material.name.startsWith('RF_') || material.name.startsWith('CP6_'));
    if (!architecture && !sign) return;
    for (let parent = source.parent; parent; parent = parent.parent) if (!parent.visible) return;
    const proxy = new THREE.Mesh(source.geometry, source.material);
    proxy.matrixAutoUpdate = false;
    proxy.matrix.copy(source.matrixWorld);
    reflectionScene.add(proxy);
    reflected.push({ source, proxy });
  });
  const outline = new THREE.Shape();
  outline.moveTo(-96.2175, -89.1221);
  for (const [x, y] of [[85.7813,-89.1221],[85.7813,92.8767],[180,370],[-180,370],[-96.2175,92.8767]]) outline.lineTo(x,y);
  outline.closePath();
  const reflector = new Reflector(new THREE.ShapeGeometry(outline), {
    textureWidth: 768, textureHeight: 432, clipBias: .004,
    color: 0x8995aa, multisample: 0,
  });
  reflector.name = 'DISTRICT_Wet_Ground_Reflection';
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.y = -.488;
  reflector.material.transparent = true;
  reflector.material.depthWrite = false;
  reflector.material.uniforms.reflectionOpacity = { value: .24 };
  reflector.material.fragmentShader = reflector.material.fragmentShader
    .replace('uniform vec3 color;', 'uniform vec3 color;\nuniform float reflectionOpacity;')
    .replace('vec4 base = texture2DProj( tDiffuse, vUv );', `
      vec2 uv = vUv.xy / vUv.w;
      vec2 pixel = vec2(1.0 / 768.0, 1.0 / 432.0);
      vec4 base = texture2D(tDiffuse, uv) * .4;
      base += texture2D(tDiffuse, uv + pixel * vec2(1.5,0.0)) * .15;
      base += texture2D(tDiffuse, uv - pixel * vec2(1.5,0.0)) * .15;
      base += texture2D(tDiffuse, uv + pixel * vec2(0.0,1.5)) * .15;
      base += texture2D(tDiffuse, uv - pixel * vec2(0.0,1.5)) * .15;
    `)
    .replace('blendOverlay( base.rgb, color ), 1.0', 'blendOverlay( base.rgb, color ), reflectionOpacity');
  const renderReflection = reflector.onBeforeRender;
  let frame = 0;
  reflector.onBeforeRender = function (...args) {
    if (args[2].position.y > 25 || frame++ % 3 !== 0) return;
    const renderer = args[0];
    const autoUpdate = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;
    for (const { source, proxy } of reflected) proxy.matrix.copy(source.matrixWorld);
    const reflectionArgs = [...args];
    reflectionArgs[1] = reflectionScene;
    try { renderReflection.apply(this, reflectionArgs); }
    finally { renderer.shadowMap.autoUpdate = autoUpdate; }
  };
  scene.add(reflector);
  return {
    object: reflector,
    dispose() { scene.remove(reflector); reflectionScene.clear(); reflector.getRenderTarget().dispose(); reflector.geometry.dispose(); reflector.material.dispose(); },
  };
}
