// Optical atmosphere in the existing output pass: no extra render target or draw.
export function addAmbientVeil(output,strength=1){
 const marker='// color space';
 if(!output.material.fragmentShader.includes(marker))throw Error('Output color stage missing');
 output.material.fragmentShader=output.material.fragmentShader.replace(marker,`
 vec2 veilP=vUv-vec2(.52,.58);
 float veilBlue=exp(-dot(veilP*vec2(.8,1.6),veilP*vec2(.8,1.6))*4.);
 vec2 veilQ=vUv-vec2(.16,.32);
 float veilViolet=exp(-dot(veilQ,veilQ)*8.);
 float veilLuma=dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722));
 // Protect highlights and retain dark silhouettes beneath the optical veil.
 float veilMask=1.-smoothstep(.18,.85,veilLuma);
 gl_FragColor.rgb+=vec3(.006,.019,.045)*veilBlue*veilMask*${strength.toFixed(2)};
 gl_FragColor.rgb+=vec3(.027,.004,.048)*veilViolet*veilMask*${strength.toFixed(2)};
 // color space
 `);
 output.material.needsUpdate=true;
}
