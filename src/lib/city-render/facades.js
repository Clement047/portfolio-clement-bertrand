// Compile the small, audited subset of the Blender CP4 graphs, without changing geometry or UVs.
export function compileFacade(graph) {
  const links = new Map(graph.links.map(l => [`${l.target}:${l.targetSocket}`, l]));
  const cache = new Map();
  const lines = [];
  const number = n => Number(n).toFixed(10);
  function literal(value) {
    return Array.isArray(value)
      ? { type: value.length === 4 ? 'vec4' : 'vec3', code: `${value.length === 4 ? 'vec4' : 'vec3'}(${value.map(number).join(',')})` }
      : { type: 'float', code: number(value ?? 0) };
  }
  function cast(value, type) {
    if (value.type === type) return value.code;
    if (type === 'vec3' && value.type === 'vec4') return `(${value.code}).rgb`;
    if (type === 'vec4' && value.type === 'vec3') return `vec4(${value.code},1.0)`;
    return `${type}(${value.code})`;
  }
  function input(index, socket, type) {
    const l = links.get(`${index}:${socket}`);
    return cast(l ? output(l.source, l.sourceSocket) : literal(graph.nodes[index].inputs[socket].value), type);
  }
  function output(index, socket) {
    const key = `${index}:${socket}`;
    if (cache.has(key)) return cache.get(key);
    const n = graph.nodes[index];
    let type = 'float', expression;
    if (n.type === 'NEW_GEOMETRY') {
      type = 'vec3'; expression = n.outputs[socket] === 'Position' ? 'cpPosition' : 'cpNormal';
    } else if (n.type === 'SEPXYZ') {
      expression = `(${input(index, 0, 'vec3')}).${'xyz'[socket]}`;
    } else if (n.type === 'COMBXYZ') {
      type = 'vec3'; expression = `vec3(${[0,1,2].map(i => input(index,i,'float')).join(',')})`;
    } else if (n.type === 'MATH') {
      const a = input(index,0,'float'), b = input(index,1,'float');
      const ops = { ABSOLUTE:`abs(${a})`, DIVIDE:`(${a}/${b})`, GREATER_THAN:`(${a}>${b}?1.0:0.0)`, LESS_THAN:`(${a}<${b}?1.0:0.0)` };
      expression = ops[n.operation];
      if (!expression) throw new Error(`Unsupported facade operation ${n.operation}`);
    } else if (n.type === 'TEX_IMAGE') {
      const sampler = n.image.includes('Emission') ? 'cpEmissionMap' : n.image.includes('ORM') ? 'cpOrmMap' : 'cpBaseMap';
      // glTF texture V points down, while the source Blender projection points up.
      expression = `texture2D(${sampler},(${input(index,0,'vec3')}).xy*vec2(1.0,-1.0)+vec2(0.0,1.0))`;
      type = 'vec4';
      if (socket === 1) { type = 'float'; expression += '.a'; }
    } else if (n.type === 'MIX_RGB' && n.blendType === 'MIX') {
      type = 'vec4'; expression = `mix(${input(index,1,'vec4')},${input(index,2,'vec4')},clamp(${input(index,0,'float')},0.0,1.0))`;
    } else if (n.type === 'SEPARATE_COLOR') {
      expression = `(${input(index,0,'vec4')}).${'rgba'[socket]}`;
    } else throw new Error(`Unsupported facade node ${n.type}`);
    if (n.clamp && type === 'float') expression = `clamp(${expression},0.0,1.0)`;
    const value = { type, code:`cp_${index}_${socket}` };
    lines.push(`${type} ${value.code} = ${expression};`);
    cache.set(key,value);
    return value;
  }
  const principled = graph.nodes.findIndex(n => n.type === 'BSDF_PRINCIPLED');
  const get = (name,type) => input(principled,graph.nodes[principled].inputs.findIndex(i=>i.name===name),type);
  const base=get('Base Color','vec3'), emission=get('Emission Color','vec3'), roughness=get('Roughness','float'), metallic=get('Metallic','float');
  return `${lines.join('\n')}\nvec3 cpBase=${base};\nvec3 cpEmission=${emission};\nfloat cpRoughness=${roughness};\nfloat cpMetallic=${metallic};`;
}

export function restoreFacade(material, graph) {
  if (!material.map || !material.emissiveMap || !material.metalnessMap) throw new Error(`Incomplete facade maps: ${material.name}`);
  const evaluation=compileFacade(graph);
  material.onBeforeCompile=shader=>{
    shader.uniforms.cpBaseMap={value:material.map};
    shader.uniforms.cpEmissionMap={value:material.emissiveMap};
    shader.uniforms.cpOrmMap={value:material.metalnessMap};
    shader.vertexShader='varying vec3 vCpWorldPosition;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvCpWorldPosition=(modelMatrix*vec4(transformed,1.0)).xyz;');
    shader.fragmentShader='varying vec3 vCpWorldPosition;\nuniform sampler2D cpBaseMap;\nuniform sampler2D cpEmissionMap;\nuniform sampler2D cpOrmMap;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      vec3 cpPosition=vec3(vCpWorldPosition.x,-vCpWorldPosition.z,vCpWorldPosition.y);
      vec3 cpNormalGL=normalize(cross(dFdx(vCpWorldPosition),dFdy(vCpWorldPosition)));
      vec3 cpNormal=vec3(cpNormalGL.x,-cpNormalGL.z,cpNormalGL.y);
      ${evaluation}
      diffuseColor.rgb*=cpBase;
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','float roughnessFactor=cpRoughness;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <metalnessmap_fragment>','float metalnessFactor=cpMetallic;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','totalEmissiveRadiance=emissive*cpEmission;');
  };
  material.customProgramCacheKey=()=>`blender-facade-v2:${evaluation}`;
  material.needsUpdate=true;
}
