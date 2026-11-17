// Page-owned binary models use abortable fetches. A page that has gone away
// must not start decoding a downloaded file or keep a late model's resources.
export function disposeModel(model){
 const roots=model?.scenes??(model?.scene?[model.scene]:model?[model]:[]);
 const geometries=new Set(),materials=new Set(),textures=new Set();
 for(const root of roots)root.traverse?.(object=>{
  if(object.geometry)geometries.add(object.geometry);
  for(const material of Array.isArray(object.material)?object.material:[object.material])if(material){
   materials.add(material);
   for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
   for(const uniform of Object.values(material.uniforms??{}))if(uniform?.value?.isTexture)textures.add(uniform.value);
  }
 });
 geometries.forEach(value=>value.dispose());materials.forEach(value=>value.dispose());textures.forEach(value=>value.dispose());
}

function aborted(signal){
 if(signal?.aborted)throw new DOMException('Page left during model loading','AbortError');
}
export async function loadPageModel(loader,url,signal){
 aborted(signal);
 const absolute=new URL(url,location.href);
 const response=await fetch(absolute,{signal});
 if(!response.ok)throw new Error(`Model download failed: HTTP ${response.status}`);
 const binary=await response.arrayBuffer();
 aborted(signal);
 let released=false,onAbort;
 const release=model=>{if(!released){released=true;disposeModel(model);}};
 // Decoders cannot all be interrupted. Stop waiting immediately, and dispose
 // their result if it arrives later instead of mounting it on a departed page.
 const cancelled=signal?new Promise((_,reject)=>{
  onAbort=()=>reject(new DOMException('Page left during model decoding','AbortError'));
  signal.addEventListener('abort',onAbort,{once:true});if(signal.aborted)onAbort();
 }):null;
 try{
  const decoded=Promise.resolve().then(()=>{aborted(signal);return loader.parseAsync(binary,new URL('.',absolute).href);})
   .then(model=>{if(signal?.aborted){release(model);aborted(signal);}return model;});
  const model=await (cancelled?Promise.race([decoded,cancelled]):decoded);
  if(signal?.aborted){release(model);aborted(signal);}
  return model;
 }finally{if(onAbort)signal.removeEventListener('abort',onAbort);}
}
