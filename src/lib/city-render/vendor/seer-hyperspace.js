// Seer.js Hyperspace — official effect, MIT. See SEER-NOTICE.md.
// Only the module wrapper is adapted; THREE is supplied by the host application.
export function createSeer(THREE) {
if(typeof THREE==='undefined'){throw new Error('Seer.js: three.js is required. Include the three.js CDN tag before this script, or use the full bundle (seer.min.js).')}
var Seer=(function(e){var t=Object.create,n=Object.defineProperty,r=Object.getOwnPropertyDescriptor,i=Object.getOwnPropertyNames,a=Object.getPrototypeOf,o=Object.prototype.hasOwnProperty,s=(e,t,a,s)=>{if(t&&typeof t==`object`||typeof t==`function`)for(var c=i(t),l=0,u=c.length,d;l<u;l++)d=c[l],!o.call(e,d)&&d!==a&&n(e,d,{get:(e=>t[e]).bind(null,d),enumerable:!(s=r(t,d))||s.enumerable});return e};e=((e,r,i)=>(i=e==null?{}:t(a(e)),s(r||!e||!e.__esModule||!o.call(e,`default`)?n(i,`default`,{value:e,enumerable:!0}):i,e)))(e);var c={el:null,mouseControls:!0,touchControls:!0,scale:1,scaleMobile:1,minHeight:200,minWidth:200,backgroundColor:null};function l(e){return typeof e==`string`?document.querySelector(e):e instanceof Element?e:null}function u(t){return t==null?null:t instanceof e.Color?t:new e.Color(t)}var d=class{constructor(t={}){if(this.options={...c,...t},this.el=l(this.options.el),!this.el)throw Error(`Seer.js: "el" is required and must be a selector string or DOM element.`);this.mouse={x:0,y:0,px:0,py:0,active:!1},this.rect=null,this.width=0,this.height=0,this.destroyed=!1,this.listeners=[],this.clock=new e.Clock,this.buildCanvas(),this.buildRenderer(),this.buildCamera(),this.bindEvents(),this.resize(),this.applyOptions(),this.start()}buildCanvas(){let e=document.createElement(`canvas`);e.style.position=`absolute`,e.style.top=`0`,e.style.left=`0`,e.style.width=`100%`,e.style.height=`100%`,e.style.pointerEvents=`none`,e.style.zIndex=`0`,this.canvas=e,this.el.appendChild(e)}buildRenderer(){this.renderer=new e.WebGLRenderer({canvas:this.canvas,antialias:!0,alpha:!0,powerPreference:`high-performance`}),this.renderer.setClearColor(0,0),this.scene=new e.Scene}buildCamera(){this.camera=new e.PerspectiveCamera(60,1,.1,1e4),this.camera.position.set(0,0,500),this.camera.lookAt(0,0,0)}bindEvents(){this.addListener(window,`resize`,this.resize),this.bindControls()}bindControls(){this.options.mouseControls&&this.addListener(window,`pointermove`,this.onPointerMove),this.options.touchControls&&(this.addListener(window,`touchstart`,this.onTouchStart),this.addListener(window,`touchmove`,this.onTouchMove))}addListener(e,t,n){let r=n.bind(this);e.addEventListener(t,r,{passive:!0}),this.listeners.push({target:e,type:t,fn:r})}removeListeners(){for(let e of this.listeners)e.target.removeEventListener(e.type,e.fn);this.listeners=[]}updateRect(){this.rect=this.el.getBoundingClientRect()}onPointerMove(e){this.mouse.active=!0,this.mouse.px=this.mouse.x,this.mouse.py=this.mouse.y,this.mouse.x=(e.clientX-this.rect.left)/this.rect.width,this.mouse.y=(e.clientY-this.rect.top)/this.rect.height}updateTouch(e,t){this.mouse.active=!0,this.mouse.px=this.mouse.x,this.mouse.py=this.mouse.y,this.mouse.x=(e-this.rect.left)/this.rect.width,this.mouse.y=(t-this.rect.top)/this.rect.height}onTouchStart(e){if(e.touches&&e.touches.length){let t=e.touches[0];this.updateTouch(t.clientX,t.clientY)}}onTouchMove(e){if(e.touches&&e.touches.length){let t=e.touches[0];this.updateTouch(t.clientX,t.clientY)}}resize(){this.updateRect();let e=Math.max(this.el.clientWidth||this.rect.width||0,this.options.minWidth),t=Math.max(this.el.clientHeight||this.rect.height||0,this.options.minHeight),n=typeof window.matchMedia==`function`&&window.matchMedia(`(max-width: 640px)`).matches,r=this.options.scale*(n?this.options.scaleMobile:1),i=(window.devicePixelRatio||1)*r;this.renderer.setPixelRatio(i),this.renderer.setSize(e,t,!1),this.width=e,this.height=t,this.camera&&(this.camera.aspect=e/t,this.camera.updateProjectionMatrix()),this.onResize(e,t)}setOptions(e={}){return Object.assign(this.options,e),this.applyOptions(),this}applyOptions(){this.options.backgroundColor==null?this.renderer.setClearColor(0,0):this.renderer.setClearColor(u(this.options.backgroundColor),1);let e={m:!!this.options.mouseControls,t:!!this.options.touchControls};(!this.lastControls||this.lastControls.m!==e.m||this.lastControls.t!==e.t)&&(this.removeListeners(),this.bindEvents(),this.lastControls=e),typeof this.updateOptions==`function`&&this.updateOptions()}start(){let e=()=>{if(this.destroyed)return;let t=Math.min(this.clock.getDelta(),.05);this.onFrame(t,this.clock.elapsedTime),this.render(),this.rafId=requestAnimationFrame(e)};this.rafId=requestAnimationFrame(e)}renderNow(){let e=Math.min(this.clock.getDelta(),.05);this.onFrame(e,this.clock.elapsedTime),this.render()}render(){this.renderer.render(this.scene,this.camera)}destroy(){this.destroyed||(this.destroyed=!0,cancelAnimationFrame(this.rafId),this.removeListeners(),this.disposeScene(),this.renderer.dispose(),this.canvas.parentNode&&this.canvas.parentNode.removeChild(this.canvas))}disposeScene(){this.scene.traverse(e=>{e.geometry&&e.geometry.dispose(),e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.dispose()):e.material.dispose())})}onResize(){}onFrame(){}updateOptions(){}},f={color:`#bcd9ff`,backgroundColor:`#05050f`,mode:`warp`,count:260,speed:1,streak:1.6,depth:1,size:2,cycleSpeed:1,focusX:0,focusY:0,variety:.4,mouseInfluence:.08};function p(e){let t=e+1831565813|0;return t=(t^t>>>15)*(t|1)|0,t=t^t+Math.imul(t^t>>>7,t|61)|0,((t^t>>>14)>>>0)/4294967296}var m=`
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;

uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uDepthScale;
uniform float uFarZ;

varying vec3 vColor;
varying float vBright;
varying float vDim;

void main() {
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float z = max(-mv.z, 1.0);
  float tw = 0.7 + 0.3 * sin(uTime * 2.2 + aPhase * 6.28318);
  vBright = tw;
  vDim = clamp(1.0 - 0.8 * (z / uFarZ), 0.15, 1.0);
  gl_PointSize = min(uSize * aSize * uPixelRatio * (uDepthScale / z) * (0.7 + 0.5 * tw), 160.0 * uPixelRatio);
  gl_Position = projectionMatrix * mv;
}
`,h=`
uniform float uBright;

varying vec3 vColor;
varying float vBright;
varying float vDim;

void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float d = length(uv);
  float star = exp(-8.0 * d * d);
  float circle = 1.0 - smoothstep(0.75, 1.0, d);
  float alpha = star * circle * vBright * vDim;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(vColor * uBright * vDim * (0.5 + star), alpha);
}
`,g=`
attribute float aFade;

uniform vec3 uColor;
uniform float uFarZ;

varying vec3 vColor;
varying float vFade;
varying float vDim;

void main() {
  vColor = uColor;
  vFade = aFade;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDim = clamp(1.0 - 0.8 * (max(-mv.z, 1.0) / uFarZ), 0.1, 1.0);
  gl_Position = projectionMatrix * mv;
}
`,_=`
varying vec3 vColor;
varying float vFade;
varying float vDim;

void main() {
  float a = vFade * vDim;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * (0.3 + 1.1 * vFade) * vDim, a);
}
`,v=class extends d{constructor(e={}){super({...f,...e}),this.pointer={x:0,y:0}}onResize(e,t){this.frameCamera(),this.buildField(e,t)}frameCamera(){this.camera.position.set(0,0,0),this.camera.lookAt(0,0,-1),this.camera.updateProjectionMatrix(),this.tanHalf=Math.tan(e.MathUtils.degToRad(this.camera.fov)/2)}buildField(t,n){this.disposeField();let r=e.MathUtils.clamp(Math.round(this.options.count),120,600);this.currentCount=r;let i=t/n,a=e.MathUtils.clamp(this.options.depth,.3,1.6),o=60+45*a;this.aspect=i,this.farZ=o,this.nearZ=6,this.farRadius=o*this.tanHalf*Math.sqrt(1+i*i)*.9,this.sx=new Float32Array(r),this.sy=new Float32Array(r),this.sz=new Float32Array(r),this.speedF=new Float32Array(r),this.bright=new Float32Array(r);let s=new Float32Array(r),c=new Float32Array(r);for(let e=0;e<r;e++){this.sz[e]=-(o*(.45+p(e+100)*.55));let t=Math.sqrt(p(e+150))*this.farRadius,n=p(e+180)*Math.PI*2,r=-this.sz[e]/o;this.sx[e]=Math.cos(n)*t*r,this.sy[e]=Math.sin(n)*t*r,this.speedF[e]=(.4+p(e+300)*.9)*(.55+.75*a),this.bright[e]=.55+p(e+400)*.6,s[e]=.6+p(e+500)*.8,c[e]=p(e+600)}let l=new e.BufferGeometry;l.setAttribute(`position`,new e.BufferAttribute(new Float32Array(r*3),3)),l.setAttribute(`aSize`,new e.BufferAttribute(s,1)),l.setAttribute(`aPhase`,new e.BufferAttribute(c,1)),l.setAttribute(`aColor`,new e.BufferAttribute(new Float32Array(r*3),3)),this.geometry=l;let d=new e.ShaderMaterial({uniforms:{uTime:{value:0},uSize:{value:this.options.size},uPixelRatio:{value:this.renderer.getPixelRatio()},uDepthScale:{value:3*o},uFarZ:{value:o},uBright:{value:1}},vertexShader:m,fragmentShader:h,transparent:!0,depthWrite:!1,blending:this.options.backgroundColor==null?e.NormalBlending:e.AdditiveBlending});this.material=d;let f=new e.Points(l,d);f.frustumCulled=!1,this.scene.add(f),this.points=f;let v=new e.BufferGeometry;v.setAttribute(`position`,new e.BufferAttribute(new Float32Array(r*6),3)),v.setAttribute(`aFade`,new e.BufferAttribute(new Float32Array(r*2),1)),this.trailGeom=v;let y=new e.ShaderMaterial({uniforms:{uColor:{value:u(this.options.color).clone()},uFarZ:{value:o}},vertexShader:g,fragmentShader:_,transparent:!0,depthWrite:!1,blending:this.options.backgroundColor==null?e.NormalBlending:e.AdditiveBlending});this.trailMat=y;let b=new e.LineSegments(v,y);b.frustumCulled=!1,this.scene.add(b),this.lines=b,this.updateOptions()}disposeField(){this.points&&=(this.scene.remove(this.points),this.points.geometry.dispose(),this.points.material.dispose(),null),this.lines&&=(this.scene.remove(this.lines),this.lines.geometry.dispose(),this.lines.material.dispose(),null),this.geometry=null,this.material=null,this.trailGeom=null,this.trailMat=null}applyHeadColors(){if(!this.geometry)return;let t=this.accent||u(this.options.color),n=e.MathUtils.clamp(this.options.variety,0,1),r=this.geometry.attributes.aColor.array,i=new e.Color,a={h:0,s:0,l:0},o=this.currentCount;for(let e=0;e<o;e++){if(i.copy(t),n>.01){t.getHSL(a);let r=(p(e+900)-.5)*2*n*.12;i.setHSL((a.h+r+1)%1,Math.min(1,a.s*(.7+p(e+901)*.6)),Math.min(1,a.l*(.7+p(e+902)*.6)))}i.multiplyScalar(this.bright[e]),r[e*3]=i.r,r[e*3+1]=i.g,r[e*3+2]=i.b}this.geometry.attributes.aColor.needsUpdate=!0}warpAt(e){let t=(e*Math.max(.25,this.options.cycleSpeed)*.16%1+1)%1;if(t<.45)return 0;if(t<.7){let e=(t-.45)/.25;return e*e*(3-2*e)}if(t<.82)return 1;let n=(t-.82)/.18;return Math.max(0,1-n*n*(3-2*n))}isOffScreen(e,t,n){if(n>-this.nearZ)return!0;let r=-n*this.tanHalf,i=e/(r*this.aspect),a=t/r,o=(i*.5+.5)*this.width,s=(.5-a*.5)*this.height;return o<-80||o>this.width+80||s<-80||s>this.height+80}respawn(e,t){this.sz[e]=-this.farZ;let n=Math.sqrt(p(e+2e3+t))*this.farRadius,r=p(e+2100+t)*Math.PI*2;this.sx[e]=Math.cos(r)*n,this.sy[e]=Math.sin(r)*n}onFrame(t,n){if(!this.points)return;let r=this.options;this.pointer.x+=(this.mouse.x-.5-this.pointer.x)*Math.min(t*1.5,1),this.pointer.y+=(.5-this.mouse.y-this.pointer.y)*Math.min(t*1.5,1);let i=r.mode===`constant`?1:this.warpAt(n),a=1+i*4,o=1+i*.7,s=this.farZ*a*t/5.5*e.MathUtils.clamp(r.speed,.2,3),c=e.MathUtils.clamp(r.streak,0,4)*6*(.4+.6*i),l=e.MathUtils.clamp(r.mouseInfluence,0,.2),u=r.focusX*this.farRadius*.8+this.pointer.x*this.farRadius*l*2,d=r.focusY*this.farRadius*.8+this.pointer.y*this.farRadius*l*2,f=this.geometry.attributes.position.array,p=this.trailGeom.attributes.position.array,m=this.trailGeom.attributes.aFade.array,h=this.currentCount,g=Math.floor(n*10);for(let e=0;e<h;e++){let t=this.sz[e]+this.speedF[e]*s;this.isOffScreen(this.sx[e],this.sy[e],t)&&(this.respawn(e,g),t=this.sz[e]),this.sz[e]=t;let n=this.sx[e]+u,r=this.sy[e]+d,i=t-c*this.speedF[e];f[e*3]=n,f[e*3+1]=r,f[e*3+2]=t;let a=e*6;p[a]=n,p[a+1]=r,p[a+2]=i,p[a+3]=n,p[a+4]=r,p[a+5]=t;let o=e*2;m[o]=.08,m[o+1]=1}this.geometry.attributes.position.needsUpdate=!0,this.trailGeom.attributes.position.needsUpdate=!0,this.trailGeom.attributes.aFade.needsUpdate=!0,this.material.uniforms.uTime.value=n,this.material.uniforms.uBright.value=o}updateOptions(){let t=u(this.options.color);if(!t)return;if(this.accent=t,e.MathUtils.clamp(Math.round(this.options.count),120,600)!==this.currentCount&&this.width&&this.height){this.buildField(this.width,this.height);return}if(!this.material)return;this.material.uniforms.uSize.value=e.MathUtils.clamp(this.options.size,.5,8),this.applyHeadColors(),this.trailMat&&this.trailMat.uniforms.uColor.value.copy(t);let n=this.options.backgroundColor==null?e.NormalBlending:e.AdditiveBlending;this.material.blending!==n&&(this.material.blending=n),this.trailMat&&this.trailMat.blending!==n&&(this.trailMat.blending=n)}};return{Hyperspace(e){return new v(e)}}})(THREE);

return Seer;
}
