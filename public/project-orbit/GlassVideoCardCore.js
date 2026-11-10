export function bindGlassCards(THREE){

const vertexShader = /* glsl */`
  varying vec2 vUv; varying vec3 vWorldPosition; varying vec3 vWorldNormal;
  void main(){
    vUv=uv;
    vec4 world=modelMatrix*vec4(position,1.0);
    vWorldPosition=world.xyz;
    vWorldNormal=normalize(mat3(modelMatrix)*normal);
    gl_Position=projectionMatrix*viewMatrix*world;
  }
`;

const common = /* glsl */`
  varying vec2 vUv; varying vec3 vWorldPosition; varying vec3 vWorldNormal;
  uniform float uGlass, uReveal, uTime; uniform vec2 uSize; uniform sampler2D uSurface; uniform vec3 uTint;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){return .56*noise2(p)+.28*noise2(p*2.03+9.)+.16*noise2(p*4.11-7.);}
  float border(vec2 uv){return min(min(uv.x,1.-uv.x)*uSize.x,min(uv.y,1.-uv.y)*uSize.y);}
  vec3 linearize(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
`;

const videoFragment = /* glsl */`
  ${common}
  uniform sampler2D uVideo; uniform sampler2D uTitle; uniform vec2 uCover; uniform float uOpacity;
  void main(){
    float edge=1.-smoothstep(.012,.34,border(vUv));
    float micro=fbm(vUv*vec2(17.,10.));
    vec2 warp=vec2(fbm(vUv*7.3+13.)-.5,fbm(vUv*8.1-9.)-.5);
    // Optical distortion grows only near the perimeter; the interface stays sharp.
    vec2 offset=warp*(.0018+edge*edge*.0070)*uGlass;
    vec2 ripple=vec2(sin(vUv.y*27.+vUv.x*6.+uTime*.22),cos(vUv.x*22.-vUv.y*8.-uTime*.18));
    vec2 uv=(vUv-.5)*uCover+.5+offset+ripple*.0025*uGlass;
    vec3 color=linearize(texture2D(uVideo,uv).rgb);
    float radius=(.00012+edge*edge*.0012)*uGlass;
    vec3 blurred=linearize(texture2D(uVideo,uv+vec2(radius,0)).rgb)+linearize(texture2D(uVideo,uv-vec2(radius,0)).rgb);
    color=mix(color,blurred*.5,edge*.42*uGlass);
    // Thin smoked glass, not a grey/white veil over the entire video.
    color*=1.-uGlass*(.020+edge*.08);
    color=mix(color,color*(vec3(.76)+normalize(uTint+vec3(.001))*.48)+uTint*.014,.32*uGlass);
    float grain=texture2D(uSurface,vUv*vec2(3.,1.4)).r;
    color+=vec3((grain-.5)*.008*uGlass);
    // Dark pixels transmit the scene, rather than painting an opaque black screen.
    float lum=dot(color,vec3(.2126,.7152,.0722));
    float opticalAlpha=.88+.08*sqrt(clamp(lum,0.,1.));
    float opacity=mix(.99,opticalAlpha,clamp(uGlass,0.,1.));
    opacity*=1.-edge*.06*uGlass;
    gl_FragColor=vec4(max(color,vec3(0)),opacity*uReveal);
    #include <colorspace_fragment>
  }
`;

const glassFragment = /* glsl */`
  ${common}
  float box(vec2 p,vec2 halfSize,float softness){vec2 d=abs(p)-halfSize;return 1.-smoothstep(-softness,softness,max(d.x,d.y));}
  vec3 environment(vec3 r,float rough){
    vec2 p=r.xy/max(.25,abs(r.z));
    // Wide broken silk reflection plus a narrow strip, fixed in world space.
    float silk=exp(-pow((p.x+.24+p.y*.44)/(.36+rough*.23),2.))*exp(-pow((p.y-.22)/1.15,2.));
    float light1=box(p-vec2(-.58,.52),vec2(.10,.52),.10+rough*.16);
    float light2=box(p-vec2(.67,-.08),vec2(.022,.72),.025+rough*.06);
    float crown=exp(-dot((p-vec2(-.15,1.15))*vec2(.8,2.),(p-vec2(-.15,1.15))*vec2(.8,2.)));
    return vec3(.41,.46,.48)*silk+vec3(.50,.57,.61)*light1+vec3(.70,.76,.81)*light2+vec3(.10,.14,.17)*crown;
  }
  void main(){
    vec2 p=vUv*uSize;
    float e=1.-smoothstep(.012,.19,border(vUv));
    float cloud=fbm(p*3.2+1.7);
    float grain=texture2D(uSurface,vUv*vec2(3.,1.4)).r;
    vec2 tuv=vUv*vec2(3.,1.4);
    float height=texture2D(uSurface,tuv).r;
    vec2 etched=vec2(texture2D(uSurface,tuv+vec2(.001,0)).r-height,texture2D(uSurface,tuv+vec2(0,.001)).r-height);
    vec2 slope=vec2(fbm(p*5.1+3.)-.5,fbm(p*5.2-4.)-.5)+etched*1.8;
    vec2 flow=vec2(sin(p.y*7.+p.x*2.+uTime*.18),cos(p.x*6.-p.y*3.-uTime*.16));
    vec3 n=normalize(vWorldNormal+vec3((slope*.045+flow*.018)*uGlass,0));
    n=normalize(n+vec3((vUv-.5)*vec2(.08,.11)*e*uGlass,0));
    vec3 v=normalize(cameraPosition-vWorldPosition);
    float ndv=clamp(abs(dot(n,v)),0.,1.);
    float fresnel=.04+.96*pow(1.-ndv,5.);
    vec3 r=reflect(-v,n);
    vec3 reflection=environment(r,.20+cloud*.30);
    float broken=mix(.94,1.,smoothstep(.12,.80,cloud));
    reflection*=broken;
    // Slow narrow caustics and thin-film colour, broken by the etched surface.
    float field=sin(p.x*4.3+sin(p.y*3.4+uTime*.17)*1.8)+cos(p.y*5.1-p.x*1.5-uTime*.13);
    float caustic=pow(clamp(1.-abs(field+(cloud-.5)*1.2)*2.6,0.,1.),3.)*smoothstep(.30,.68,cloud);
    float filmPhase=dot(r,vec3(3.1,4.7,2.3))+cloud*1.7+uTime*.035;
    vec3 film=.5+.5*cos(filmPhase*4.+vec3(0.,2.1,4.2));
    vec3 tint=normalize(uTint+vec3(.001));
    reflection=reflection*(.42+tint*.95)+film*.30*caustic+tint*.12*caustic;
    float scratch=pow(max(0.,noise2(vec2(p.x*210.,p.y*2.7))-.68)*3.125,5.)*.035;
    float intensity=(.35+fresnel*2.5+e*.27)*uGlass;
    float reflected=max(reflection.r,max(reflection.g,reflection.b))*intensity;
    float haze=(.020+cloud*.035+abs(grain-.5)*.16+scratch)*uGlass;
    float alpha=clamp((haze+reflected+caustic*.05*uGlass+e*.09*uGlass)*uReveal,0.,.52);
    vec3 frost=uTint*.30+vec3(.022)+(grain-.5)*.10;
    vec3 color=mix(frost,reflection,clamp((reflected+caustic*.08)/max(alpha,.001),0.,1.));
    gl_FragColor=vec4(max(color,vec3(0)),alpha);
    #include <colorspace_fragment>
  }

`;

function roundedShape(w,h,r){
  const s=new THREE.Shape(),x=-w/2,y=-h/2;
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}
function surfaceGeometry(w,h,r){
  const g=new THREE.ShapeGeometry(roundedShape(w,h,r),32),p=g.attributes.position;
  const uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){uv[i*2]=p.getX(i)/w+.5;uv[i*2+1]=p.getY(i)/h+.5;}
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2));return g;
}

/**
 * One reusable glass card. No DOM, player or scene is owned by this class.
 * video: an HTMLVideoElement (MP4, native HLS, or a video controlled by hls.js).
 * Call update(deltaSeconds) from your render loop. All assets remain in your scene.
 */
class GlassVideoCard extends THREE.Group {
  constructor(video,{width=5.8,aspect=1918/882,radius=.17,thickness=.035,glass=1.0,placeholder=false,title='SULL',titleDepth=.12,tint=0xa52a40,fontUrl=new URL('./assets/fonts/le-murmure.otf',import.meta.url).href}={}){
    super(); this.name='SULL_GlassVideoCard';this.video=video;this.width=width;this.height=width/aspect;
    this.tint=new THREE.Color(tint);this.aspect=aspect;this.thickness=thickness;this.amount=glass;this.comparing=false;this._age=0;
    this.baseRotation=new THREE.Vector3(-.035,-.16,.012);
    this._target=this.baseRotation.clone();this.rotation.set(.07,-.26,.018);
    this._drag=new THREE.Vector2();this._hover=new THREE.Vector2();this.surfaces=new THREE.Group();this.add(this.surfaces);
    this.titleCanvas=document.createElement('canvas');this.titleCanvas.width=2048;this.titleCanvas.height=Math.round(2048/aspect);
    this.titleTexture=new THREE.CanvasTexture(this.titleCanvas);this.titleTexture.colorSpace=THREE.NoColorSpace;
    this.titleReady=false;this._disposed=false;
    this.titlePromise=this.loadTitle(title,fontUrl);
    this.surfaceMap=new THREE.TextureLoader().load(new URL('./assets/glass/etched-surface.png',import.meta.url).href);
    this.surfaceMap.wrapS=this.surfaceMap.wrapT=THREE.RepeatWrapping;this.surfaceMap.colorSpace=THREE.NoColorSpace;
        if (placeholder) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;

      const ctx = canvas.getContext('2d');
      const hex = '#' + this.tint.getHexString();

      const gradient = ctx.createLinearGradient(
        0, 0, canvas.width, canvas.height
      );

      gradient.addColorStop(0, '#080b18');
      gradient.addColorStop(0.45, hex);
      gradient.addColorStop(1, '#090c19');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Voile sombre pour conserver une ambiance cinématographique
      const shade = ctx.createLinearGradient(
        0, 0, 0, canvas.height
      );

      shade.addColorStop(0, 'rgba(4,6,18,0.38)');
      shade.addColorStop(0.5, 'rgba(4,6,18,0.60)');
      shade.addColorStop(1, 'rgba(4,6,18,0.82)');

      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      this.texture = new THREE.CanvasTexture(canvas);
    } else {
      this.texture = new THREE.VideoTexture(video);
    }
    // This custom shader performs the sRGB EOTF exactly once; keep the sampler untagged.
    this.texture.colorSpace=THREE.NoColorSpace;this.texture.minFilter=THREE.LinearFilter;this.texture.magFilter=THREE.LinearFilter;this.texture.generateMipmaps=false;
    this.uniforms={uTint:{value:this.tint},uSurface:{value:this.surfaceMap},uVideo:{value:this.texture},uTitle:{value:this.titleTexture},uSize:{value:new THREE.Vector2(width,this.height)},uCover:{value:new THREE.Vector2(1,1)},uGlass:{value:glass},uReveal:{value:0},uOpacity:{value:.99},uTime:{value:0}};
    const material=new THREE.ShaderMaterial({vertexShader,fragmentShader:videoFragment,uniforms:this.uniforms,transparent:true,depthTest:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
    this.videoMesh=new THREE.Mesh(surfaceGeometry(width-.010,this.height-.010,radius-.005),material);
    this.videoMesh.name='Video_under_glass';this.videoMesh.position.z=thickness/2+.0008;this.videoMesh.renderOrder=2;this.surfaces.add(this.videoMesh);
    const glassMat=new THREE.ShaderMaterial({vertexShader,fragmentShader:glassFragment,uniforms:this.uniforms,transparent:true,depthTest:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
    this.glassMesh=new THREE.Mesh(surfaceGeometry(width-.010,this.height-.010,radius-.005),glassMat);
    this.glassMesh.name='Surface_reflections';this.glassMesh.position.z=thickness/2+.0050;this.glassMesh.renderOrder=3;this.surfaces.add(this.glassMesh);
    const titleMaterial=new THREE.ShaderMaterial({vertexShader,fragmentShader:`
      ${common}
      uniform sampler2D uTitle;
      void main(){
        vec4 ink=texture2D(uTitle,vUv);
        float grain=texture2D(uSurface,vUv*vec2(3.,1.4)).r;
        vec3 color=linearize(ink.rgb)*(1.-grain*.06);
        gl_FragColor=vec4(color,ink.a*.96*uReveal);
        #include <colorspace_fragment>
      }`,uniforms:this.uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
    this.titleDepth=titleDepth;this.titleOffset=new THREE.Vector2(0,0);
    this.titleMesh=new THREE.Mesh(surfaceGeometry(width-.010,this.height-.010,radius-.005),titleMaterial);
    this.titleMesh.name='Floating_project_title';this.titleMesh.position.set(this.titleOffset.x,this.titleOffset.y,this.titleDepth);this.titleMesh.rotation.y=0;this.titleMesh.renderOrder=5;this.surfaces.add(this.titleMesh);
    const geom=new THREE.ExtrudeGeometry(roundedShape(width-.010,this.height-.010,radius-.005),{depth:thickness,steps:1,bevelEnabled:true,bevelSegments:4,bevelSize:.004,bevelThickness:.003,curveSegments:24});
    geom.translate(0,0,-thickness/2);
    const invisible=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
    const edgeMat=new THREE.MeshPhysicalMaterial({color:tint,metalness:0,roughness:.23,transmission:.94,thickness:.064,ior:1.46,transparent:true,opacity:.75,envMapIntensity:.65,attenuationColor:this.tint.clone(),attenuationDistance:2,clearcoat:.65,clearcoatRoughness:.16,side:THREE.DoubleSide,depthWrite:false});
    this.body=new THREE.Mesh(geom,[invisible,edgeMat]);this.body.name='Glass_edge_real_thickness';this.body.renderOrder=1;this.surfaces.add(this.body);
    this._geometry=[this.videoMesh.geometry,this.glassMesh.geometry,this.titleMesh.geometry,geom];this._materials=[material,glassMat,titleMaterial,invisible,edgeMat];this._edgeMat=edgeMat;
    this._meta=()=>this.updateCover();video.addEventListener('loadedmetadata',this._meta);this.updateCover();
  }
  async loadTitle(text,url){
    try{
      const face=new FontFace('SULLMurmure',`url("${url}")`);await face.load();
      if(this._disposed)return;document.fonts.add(face);this._fontFace=face;
      const c=this.titleCanvas,ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
      ctx.font='600px SULLMurmure';const measured=ctx.measureText(text);
      const size=Math.min(c.width*.32/measured.width*600,c.height*.42);
      ctx.font=`${size}px SULLMurmure`;ctx.textAlign='center';ctx.textBaseline='alphabetic';
      const m=ctx.measureText(text),baseline=c.height*.50+(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2;
      // Fine chromatic offset at the ink edge, like the reference. Same physical surface.
      ctx.globalAlpha=.23;ctx.fillStyle='#9abac5';ctx.fillText(text,c.width/2-1.1,baseline);
      ctx.fillStyle='#c0a5b9';ctx.fillText(text,c.width/2+1.1,baseline);
      ctx.globalAlpha=1;ctx.fillStyle='#f1eee6';ctx.fillText(text,c.width/2,baseline);
      this.titleTexture.needsUpdate=true;this.titleReady=true;
    }catch(error){console.error('La police Le Murmure ne peut pas être chargée',error);}
  }
  updateCover(){
    if(!this.video.videoWidth)return;
    const source=this.video.videoWidth/this.video.videoHeight,target=this.aspect;
    this.uniforms.uCover.value.set(Math.min(1,target/source),Math.min(1,source/target));
  }
  setHover(x,y){this._hover.set(x,y);}
  setDrag(x,y){this._drag.set(THREE.MathUtils.clamp(x,-1.25,1.25),THREE.MathUtils.clamp(y,-.65,.65));}
  setGlass(value){this.amount=THREE.MathUtils.clamp(value,0,1.5);}
  compare(withoutGlass){this.comparing=!!withoutGlass;}
  reset(){this._hover.set(0,0);this._drag.set(0,0);}
  update(dt){
    dt=Math.min(dt,.05);this._age+=dt;
    const target=this._target;
    target.set(this.baseRotation.x+this._drag.y-this._hover.y*.075,this.baseRotation.y+this._drag.x+this._hover.x*.12,this.baseRotation.z+this._hover.x*.008);
    const k=1-Math.exp(-dt*7.5);
    this.rotation.x=THREE.MathUtils.lerp(this.rotation.x,target.x,k);
    this.rotation.y=THREE.MathUtils.lerp(this.rotation.y,target.y,k);
    this.rotation.z=THREE.MathUtils.lerp(this.rotation.z,target.z,k);
    const reveal=THREE.MathUtils.smoothstep(this._age,0,1.15);
    this.surfaces.position.y=(1-reveal)*.16;
    this.uniforms.uReveal.value=reveal;this.uniforms.uTime.value=this._age;
    this.uniforms.uGlass.value=THREE.MathUtils.damp(this.uniforms.uGlass.value,this.comparing?0:this.amount,11,dt);
    this._edgeMat.opacity=(.22+this.uniforms.uGlass.value*.42)*reveal;
    this._edgeMat.envMapIntensity=.24+this.uniforms.uGlass.value*.55;
  }
  dispose(){this._disposed=true;if(this._fontFace)document.fonts.delete(this._fontFace);this.titleTexture.dispose();this.surfaceMap.dispose();this.video.removeEventListener('loadedmetadata',this._meta);this.texture.dispose();this._geometry.forEach(g=>g.dispose());this._materials.forEach(m=>m.dispose());}
}

/** A neutral studio reflection map generated locally; it is never visible scenery. */
function createStudioEnvironment(renderer){
  const c=document.createElement('canvas');c.width=1024;c.height=512;const ctx=c.getContext('2d');
  ctx.fillStyle='#10141a';ctx.fillRect(0,0,c.width,c.height);
  function softbox(x,y,w,h,alpha){const g=ctx.createRadialGradient(x,y,0,x,y,Math.max(w,h));g.addColorStop(0,`rgba(220,232,242,${alpha})`);g.addColorStop(.4,`rgba(150,168,187,${alpha*.55})`);g.addColorStop(1,'rgba(20,25,32,0)');ctx.save();ctx.scale(w/h,1);ctx.fillStyle=g;ctx.fillRect(0,0,c.width*h/w,c.height);ctx.restore();}
  softbox(770,170,180,115,.7);ctx.fillStyle='rgba(195,207,220,.55)';ctx.fillRect(600,90,35,250);ctx.fillStyle='rgba(215,224,232,.4)';ctx.fillRect(875,150,9,220);
  const tex=new THREE.CanvasTexture(c);tex.mapping=THREE.EquirectangularReflectionMapping;tex.colorSpace=THREE.SRGBColorSpace;
  const pmrem=new THREE.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();const result=pmrem.fromEquirectangular(tex);tex.dispose();pmrem.dispose();return result;
}



return {GlassVideoCard,createStudioEnvironment};
}
