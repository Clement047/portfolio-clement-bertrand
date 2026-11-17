import { PropertyBinding } from 'three';

// Retain the exact transforms. Only skip recomputing world matrices that cannot
// change: every animated target, its descendants, bones, cameras and lights stay live.
export function cacheStaticTransforms(root, clips) {
  const dynamic = new Set();
  for (const clip of clips) for (const track of clip.tracks) {
    const target = PropertyBinding.findNode(root, PropertyBinding.parseTrackName(track.name).nodeName);
    target?.traverse(object => dynamic.add(object));
  }
  root.updateWorldMatrix(true, true);
  let cached = 0;
  root.traverse(object => {
    if (dynamic.has(object) || object.isBone || object.isSkinnedMesh || object.isLight || object.isCamera) return;
    object.updateMatrix();
    object.matrixAutoUpdate = false;
    object.matrixWorldAutoUpdate = false;
    cached++;
  });
  return cached;
}
