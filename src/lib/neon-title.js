// Shared sculpted neon: darker faces and bright cyan/violet grazing edges.
export function neonTitle(material){
 const m=material.clone();if(!m.emissive)return m;
 m.color.setRGB(.025,.07,.19);m.metalness=.45;m.roughness=.28;
 m.emissive.setRGB(.035,.38,1);m.emissiveIntensity=1.9;
 const previous=m.onBeforeCompile;
 m.onBeforeCompile=(shader,renderer)=>{previous.call(m,shader,renderer);shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 float neonEdge=pow(1.-abs(dot(normalize(normal),normalize(vViewPosition))),2.);
 float neonBand=smoothstep(-.5,.7,normal.y);
 vec3 neonHue=mix(vec3(.20,.035,.65),vec3(.035,.65,1.4),neonBand);
 totalEmissiveRadiance=neonHue*(.65+2.4*neonEdge);
 `);};m.customProgramCacheKey=()=> 'sculpted-neon-title-v1';return m;
}
