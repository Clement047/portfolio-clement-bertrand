// Shared appearance and opacity keep the two views of Saturn continuous.
export function styleSaturn(globe,rings,halo){
 const surface=Array.isArray(globe.material)?globe.material:[globe.material];
 for(const m of surface){m.color?.setRGB(.48,.59,.88);m.roughness=.72;m.metalness=.08;m.emissive?.setRGB(.018,.035,.09);m.emissiveIntensity=.4;m.transparent=true;}
 if(rings.material.isShaderMaterial){rings.material.uniforms.tint.value.setRGB(.78,.86,1);rings.material.fragmentShader=rings.material.fragmentShader.replace('vec3(.15,.35,.8)','vec3(.38,.55,.95)').replace('(.025+(1.-shadow)*(.09+.5*incidence))','(.10+(1.-shadow)*(.25+.75*incidence))');}
 for(const object of [rings,halo])if(object?.material?.isShaderMaterial){const m=object.material;m.uniforms.saturnOpacity={value:1};m.fragmentShader='uniform float saturnOpacity;\n'+m.fragmentShader;m.fragmentShader=m.fragmentShader.replace('#include <tonemapping_fragment>','gl_FragColor.a*=saturnOpacity;\n#include <tonemapping_fragment>');m.needsUpdate=true;}
 return opacity=>{for(const m of surface)m.opacity=opacity;for(const object of [rings,halo])if(object?.material?.uniforms?.saturnOpacity)object.material.uniforms.saturnOpacity.value=opacity;for(const object of [globe,rings,halo])if(object)object.visible=opacity>.001;};
}
