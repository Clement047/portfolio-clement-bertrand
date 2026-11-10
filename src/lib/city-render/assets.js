export function createCityAssetCache(loader){
  const requests=new Map();
  return {loadAsync(url){if(!requests.has(url)){const promise=loader.loadAsync(url);promise.catch(()=>{});requests.set(url,promise);}return requests.get(url);},
    prefetch(){for(const name of ['DistrictAdditions','SparkySurfaces','SynthTrails'])this.loadAsync(`/models/city-render/${name}.glb`);}
  };
}
