import { Frustum, Group, Matrix4 } from 'three';
import { traceCityStage } from './trace.js';

// Meshopt's default "async" decoder still runs its WASM work on the UI thread.
// Its worker API transfers decoded buffers back without changing the asset.
export async function configureCityDecoder(decoder, environment = globalThis) {
  await decoder.ready;
  const cores = environment.navigator?.hardwareConcurrency ?? 4;
  const count = typeof environment.Worker === 'function' ? Math.min(2, Math.max(1, cores - 2)) : 0;
  if (!count || typeof decoder.useWorkers !== 'function') return 0;
  try {
    decoder.useWorkers(count);
    return count;
  } catch (error) {
    // Restricted worker policies must not make the regular decoder unusable.
    try { decoder.useWorkers(0); } catch {}
    console.warn('Décodage en arrière-plan indisponible, utilisation du décodeur standard.', error);
    return 0;
  }
}

// Loading must not wait for a displayed frame: Firefox can suspend RAF in
// an occluded/background window. Posted tasks still give input events a turn.
export function yieldMainThread() {
  if (globalThis.scheduler?.yield) return globalThis.scheduler.yield();
  if (typeof MessageChannel !== 'function') return new Promise(resolve => setTimeout(resolve, 0));
  return new Promise(resolve => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => { channel.port1.close(); channel.port2.close(); resolve(); };
    channel.port2.postMessage(null);
  });
}

// Compile only geometry in the opening view, with the real city's lighting.
// Compiling the entire scene here also compiles materials nowhere near the camera.
export function createPreparationCache() { return { textures: new Set(), variants: new Set(), programs: new Set() }; }

// Counts and transforms don't affect GLSL. Attribute/morph/instance signatures
// do: retain those distinctions when skipping already-prepared mesh variants.
export function cityShaderVariant(object) {
  const geometry = object.geometry;
  const attributes = Object.entries(geometry?.attributes ?? {}).sort(([a], [b]) => a.localeCompare(b)).map(([name, attribute]) => `${name}:${attribute.itemSize}:${Boolean(attribute.normalized)}:${Boolean(attribute.isInstancedBufferAttribute)}`).join('|');
  const morphs = Object.entries(geometry?.morphAttributes ?? {}).sort(([a], [b]) => a.localeCompare(b)).map(([name, values]) => `${name}:${values.length}`).join('|');
  const materials = (Array.isArray(object.material) ? object.material : [object.material]).map(m => m?.uuid).join(',');
  return `${materials}/${object.type}/${Boolean(object.isInstancedMesh)}/${Boolean(object.isSkinnedMesh)}/${Boolean(object.isBatchedMesh)}/${attributes}/${morphs}/${Boolean(geometry?.morphTargetsRelative)}/${Boolean(object.instanceColor)}/${Boolean(object.receiveShadow)}`;
}

export async function prepareCityView(renderer, scene, camera, cache, yieldFrame = yieldMainThread, progress = () => {}) {
  scene.updateMatrixWorld(true);
  camera.updateWorldMatrix(true, false);
  const frustum = new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
  const pending = new Map();
  const textures = new Set();
  scene.traverseVisible(object => {
    if (!(object.isMesh || object.isPoints || object.isLine || object.isSprite) || !object.layers.test(camera.layers)) return;
    if (object.frustumCulled && !frustum.intersectsObject(object)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (!materials.some(material => material?.visible)) return;
    // Shallow clones retain skinned/instanced geometry flags and share original
    // resources. The live hierarchy, camera, materials and animations stay put.
    const variant = cityShaderVariant(object);
    if (!cache.variants.has(variant) && !pending.has(variant)) pending.set(variant, object);
    for (const material of materials) for (const value of Object.values(material ?? {})) {
      if (value?.isTexture && !cache.textures.has(value)) textures.add(value);
    }
  });
  const started = performance.now();
  const objects = [...pending];
  // compileAsync still performs its initial compile synchronously. A large
  // scene passed in one call can trigger Firefox's "slow page" warning.
  for (let offset = 0; offset < objects.length; offset += 2) {
    const batch = objects.slice(offset, offset + 2), view = new Group();
    for (const [, object] of batch) view.add(object.clone(false));
    progress(`Préparation des matériaux ${Math.min(offset + 2, objects.length)}/${objects.length}…`);
    await yieldFrame();
    traceCityStage('shader-batch-begin', { offset, total: objects.length, materials: batch.map(([, o]) => (Array.isArray(o.material) ? o.material : [o.material]).map(m => m.name)).flat() });
    if (renderer.compileAsync) await renderer.compileAsync(view, camera, scene);
    else renderer.compile(view, camera, scene);
    // Without KHR_parallel_shader_compile Three can report "ready" before
    // Firefox's driver has completed linking/introspection. Complete each new
    // program here, between UI task boundaries, not all at the first draw.
    for (const program of renderer.info?.programs ?? []) {
      if (cache.programs.has(program)) continue;
      traceCityStage('program-link-begin', { name: program.name, id: program.id });
      program.getUniforms?.();
      program.getAttributes?.();
      traceCityStage('program-link-end', { id: program.id });
      cache.programs.add(program);
      await yieldFrame();
    }
    for (const [variant] of batch) cache.variants.add(variant);
    traceCityStage('shader-batch-end', { offset });
    progress(`Préparation des matériaux ${Math.min(offset + 2, objects.length)}/${objects.length}…`, Math.min(offset + 2, objects.length) / objects.length);
  }
  const compileMs = performance.now() - started;
  // Eager initTexture caused minute-long Firefox driver stalls in the measured
  // run. Let normal rendering bind/upload textures in its established GL state.
  // The GLTF loader has already decoded their source images.
  for (const texture of textures) cache.textures.add(texture);
  return { variants: objects.length, textures: textures.size, compileMs: Math.round(compileMs) };
}
