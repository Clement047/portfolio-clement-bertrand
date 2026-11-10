import { traceCityStage } from './trace.js';
// Gzip transport is decoded as a stream. Meshopt then restores the original data.
// Keep a regular GLB path for browsers without native stream decompression.
export function loadCityModel(loader,url,onLoad,onProgress,onError){
  if(typeof DecompressionStream!=='function'||typeof TransformStream!=='function'){
    loader.load(url,onLoad,onProgress,onError);return;
  }
  const run=async()=>{
    const downloadStart=performance.now();
    const response=await fetch(url+'.gz');
    if(response.status===404)return loader.loadAsync(url,onProgress);
    if(!response.ok||!response.body)throw new Error(`City download failed: HTTP ${response.status}`);
    const total=Number(response.headers.get('content-length'))||0;let loaded=0;
    const tracking=new TransformStream({transform(chunk,controller){loaded+=chunk.byteLength;onProgress?.({loaded,total,lengthComputable:total>0});controller.enqueue(chunk);}});
    let stream=response.body.pipeThrough(tracking);
    // Fetch already decodes bodies explicitly served with Content-Encoding: gzip.
    if(!/gzip/i.test(response.headers.get('content-encoding')??''))stream=stream.pipeThrough(new DecompressionStream('gzip'));
    const binary=await new Response(stream).arrayBuffer();
    const decodedAt=performance.now();traceCityStage('model-download-complete');
    await new Promise(resolve=>setTimeout(resolve,0));
    const model=await loader.parseAsync(binary,url.slice(0,url.lastIndexOf('/')+1));
    traceCityStage('model-parsed');
    console.info('City load phases',{downloadAndInflateMs:Math.round(decodedAt-downloadStart),modelParseMs:Math.round(performance.now()-decodedAt)});
    return model;
  };
  run().then(onLoad).catch(onError);
}
