// Shader animation does not alter hit geometry. Reuse a hit until pointer,
// camera/projection or card transforms change, without changing the render loop.
export function createHoverPicker(ray,camera,objects){
 let previousX=NaN,previousY=NaN,previousCamera,previousProjection,previousObjects=[],hit;
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>v===b[i]);
 return {
  invalidate(){previousX=NaN;},
  pick(pointer){
   if(Math.abs(pointer.x)>1||Math.abs(pointer.y)>1){previousX=NaN;hit=undefined;return hit;}
   camera.updateWorldMatrix(true,false);
   objects.forEach(object=>object.updateWorldMatrix(true,false));
   const changed=pointer.x!==previousX||pointer.y!==previousY||
    !same(previousCamera,camera.matrixWorld.elements)||!same(previousProjection,camera.projectionMatrix.elements)||
    objects.length!==previousObjects.length||objects.some((object,i)=>!same(previousObjects[i],object.matrixWorld.elements));
   if(changed){
    objects.forEach(object=>object.updateWorldMatrix(false,true));
    ray.setFromCamera(pointer,camera);hit=ray.intersectObjects(objects,true)[0];
    previousX=pointer.x;previousY=pointer.y;previousCamera=camera.matrixWorld.elements.slice();
    previousProjection=camera.projectionMatrix.elements.slice();previousObjects=objects.map(object=>object.matrixWorld.elements.slice());
   }
   return hit;
  }
 };
}
