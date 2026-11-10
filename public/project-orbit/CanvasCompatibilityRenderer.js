import * as THREE from './vendor/three.module.js';

// A mathematical 3D Canvas2D preview for browsers that disable WebGL entirely.
// The real WebGL card remains GlassVideoCard.js; this deliberately small fallback
// uses the same camera, object transforms and HTML video, not a CSS transform.
export class CanvasCompatibilityRenderer {
 constructor(canvas,card,camera,{poster='./assets/poster.jpg'}={}){
  this.canvas=canvas;this.card=card;this.camera=camera;this.ctx=canvas.getContext('2d',{alpha:true});
  if(!this.ctx)throw new Error('Canvas indisponible');this.dpr=1;this.w=1;this.h=1;
  this.layer=document.createElement('canvas');this.lctx=this.layer.getContext('2d');
  this.frame=document.createElement('canvas');this.fctx=this.frame.getContext('2d',{willReadFrequently:true});this.poster=new Image();this.poster.src=poster;this.lastGlass=-1;this.lastTitle=false;this.lastTime=-1;this.frameDirty=true;this.disposed=false;
  this._invalidate=()=>{this.frameDirty=true;};
  for(const type of ['seeked','loadeddata','canplay'])card.video.addEventListener(type,this._invalidate);
  const videoFrame=()=>{if(this.disposed)return;this.frameDirty=true;if(card.video.requestVideoFrameCallback)this._videoCallback=card.video.requestVideoFrameCallback(videoFrame);};
  if(card.video.requestVideoFrameCallback)this._videoCallback=card.video.requestVideoFrameCallback(videoFrame);
  this.reflect=document.createElement('canvas');this.reflect.width=144;this.reflect.height=72;this.rctx=this.reflect.getContext('2d');this.rimg=this.rctx.createImageData(144,72);
  const hash=(x,y)=>{const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);};
  const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);return (hash(ix,iy)*(1-sx)+hash(ix+1,iy)*sx)*(1-sy)+(hash(ix,iy+1)*(1-sx)+hash(ix+1,iy+1)*sx)*sy;};
  this.noise=Array.from({length:144*72},(_,i)=>{const x=i%144,y=Math.floor(i/144);return[noise(x*.12,y*.12),noise(x*.20+7,y*.20-4)-.5,noise(x*.20-3,y*.20+8)-.5];});
  this.grain=document.createElement('canvas');this.grain.width=1280;this.grain.height=640;
  const gc=this.grain.getContext('2d'),gi=gc.createImageData(1280,640);
  for(let i=0;i<1280*640;i++){const g=hash(i%1280,Math.floor(i/1280));gi.data[i*4]=110;gi.data[i*4+1]=124;gi.data[i*4+2]=133;gi.data[i*4+3]=Math.round(g*g*31);}
  gc.putImageData(gi,0,0);
  this.surfaceImage=new Image();this.surfaceImage.onload=()=>{
    gc.clearRect(0,0,1280,640);gc.drawImage(this.surfaceImage,0,0,1280,640);
    const pixels=gc.getImageData(0,0,1280,640),d=pixels.data,heights=new Uint8ClampedArray(pixels.data);
    for(let i=0;i<d.length;i+=4){const value=d[i],row=Math.floor(i/4/1280),col=(i/4)%1280,base=(heights[i-4]??value)+(heights[i+4]??value)+(heights[i-5120]??value)+(heights[i+5120]??value);d[i]=Math.round(100+card.tint.r*155);d[i+1]=Math.round(100+card.tint.g*155);d[i+2]=Math.round(100+card.tint.b*155);d[i+3]=Math.round(Math.abs(value-base/4)*1.3);}
    gc.putImageData(pixels,0,0);
  };this.surfaceImage.src=new URL('./assets/glass/etched-surface.png',import.meta.url).href;

 }
 setPixelRatio(n){this.dpr=Math.min(n,1.5);}
 setClearColor(){}
 setSize(w,h){this.w=w;this.h=h;this.canvas.width=Math.round(w*this.dpr);this.canvas.height=Math.round(h*this.dpr);this.layer.width=this.canvas.width;this.layer.height=this.canvas.height;}
 point(x,y,z){return new THREE.Vector3(x,y,z).applyMatrix4(this.card.matrixWorld).project(this.camera).multiply(new THREE.Vector3(this.w/2,-this.h/2,1)).add(new THREE.Vector3(this.w/2,this.h/2,0));}
 outline(w,h,r,z){const out=[];for(const[cx,cy,start]of[[w/2-r,-h/2+r,-Math.PI/2],[w/2-r,h/2-r,0],[-w/2+r,h/2-r,Math.PI/2],[-w/2+r,-h/2+r,Math.PI]]){for(let i=0;i<=12;i++){const a=start+i*Math.PI/24;out.push(this.point(cx+r*Math.cos(a),cy+r*Math.sin(a),z));}}return out;}
 path(points){const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();}
 triangle(image,a,b,c,sa,sb,sc){
  const ctx=this.ctx;const det=sa.x*(sb.y-sc.y)+sb.x*(sc.y-sa.y)+sc.x*(sa.y-sb.y);if(Math.abs(det)<1e-5)return;
  const mx=(a.x+b.x+c.x)/3,my=(a.y+b.y+c.y)/3;
  const expand=p=>{const x=p.x-mx,y=p.y-my,n=Math.hypot(x,y);return{x:p.x+x/n*0,y:p.y+y/n*0};};const aa=expand(a),bb=expand(b),cc=expand(c);
  ctx.save();ctx.beginPath();ctx.moveTo(aa.x,aa.y);ctx.lineTo(bb.x,bb.y);ctx.lineTo(cc.x,cc.y);ctx.closePath();ctx.clip();
  const A=(a.x*(sb.y-sc.y)+b.x*(sc.y-sa.y)+c.x*(sa.y-sb.y))/det;
  const B=(a.y*(sb.y-sc.y)+b.y*(sc.y-sa.y)+c.y*(sa.y-sb.y))/det;
  const C=(a.x*(sc.x-sb.x)+b.x*(sa.x-sc.x)+c.x*(sb.x-sa.x))/det;
  const D=(a.y*(sc.x-sb.x)+b.y*(sa.x-sc.x)+c.y*(sb.x-sa.x))/det;
  const E=(a.x*(sb.x*sc.y-sc.x*sb.y)+b.x*(sc.x*sa.y-sa.x*sc.y)+c.x*(sa.x*sb.y-sb.x*sa.y))/det;
  const F=(a.y*(sb.x*sc.y-sc.x*sb.y)+b.y*(sc.x*sa.y-sa.x*sc.y)+c.y*(sa.x*sb.y-sb.x*sa.y))/det;
  ctx.transform(A,B,C,D,E,F);ctx.drawImage(image,0,0);ctx.restore();
 }
 projectImage(image,w,h,z,cols=14,rows=7,offsetX=0,offsetY=0){
  // Accumulate clipped triangles additively on a cleared layer. Their antialiased
  // edges add to full coverage; source-over per triangle would create dark seams.
  const output=this.ctx,lc=this.lctx;lc.setTransform(1,0,0,1,0,0);lc.clearRect(0,0,this.layer.width,this.layer.height);lc.setTransform(this.dpr,0,0,this.dpr,0,0);lc.globalAlpha=1;lc.globalCompositeOperation='lighter';this.ctx=lc;
  const iw=image.width,ih=image.height,cover=image===this.frame?this.card.uniforms.uCover.value:{x:1,y:1};const grid=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++)grid.push(this.point((i/cols-.5)*w+offsetX,(.5-j/rows)*h+offsetY,z));
  const src=(i,j)=>{
   const u=i/cols,v=j/rows,t=this.card.uniforms.uTime.value,g=this.card.uniforms.uGlass.value;
   const wx=image===this.frame?Math.sin(v*27+u*6+t*.22)*.0025*g:0,wy=image===this.frame?Math.cos(u*22-v*8-t*.18)*.0025*g:0;
   return{x:Math.min(.999,Math.max(.001,(u-.5)*cover.x+.5+wx))*iw,y:Math.min(.999,Math.max(.001,(v-.5)*cover.y+.5+wy))*ih};
  };
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;
   this.triangle(image,grid[a],grid[b],grid[d],src(i,j),src(i+1,j),src(i+1,j+1));
   this.triangle(image,grid[a],grid[d],grid[c],src(i,j),src(i+1,j+1),src(i,j+1));
  }
  this.ctx=output;output.drawImage(this.layer,0,0,this.layer.width,this.layer.height,0,0,this.w,this.h);
 }
 makeReflection(){
  const card=this.card,glass=card.uniforms.uGlass.value,time=card.uniforms.uTime.value,tint=new THREE.Vector3(card.tint.r,card.tint.g,card.tint.b).normalize(),cam=this.camera.position,data=this.rimg.data;
  const smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
  const box=(x,y,hx,hy,soft)=>1-smooth(-soft,soft,Math.max(Math.abs(x)-hx,Math.abs(y)-hy));
  const wp=new THREE.Vector3(),n=new THREE.Vector3(),v=new THREE.Vector3(),r=new THREE.Vector3();
  for(let y=0;y<72;y++)for(let x=0;x<144;x++){
   const u=x/143,t=1-y/71,idx=y*144+x,k=idx*4,noise=this.noise[idx];
   const edge=1-smooth(.012,.23,Math.min(Math.min(u,1-u)*card.width,Math.min(t,1-t)*card.height));
   wp.set((u-.5)*card.width,(t-.5)*card.height,.025).applyMatrix4(card.matrixWorld);
   n.set((noise[1]*.045+Math.sin(t*card.height*7+u*card.width*2+time*.18)*.018)*glass+(u-.5)*.08*edge*glass,(noise[2]*.045+Math.cos(u*card.width*6-t*card.height*3-time*.16)*.018)*glass+(t-.5)*.11*edge*glass,1).transformDirection(card.matrixWorld);
   v.copy(cam).sub(wp).normalize();r.copy(v).negate().reflect(n);
   const px=r.x/Math.max(.25,Math.abs(r.z)),py=r.y/Math.max(.25,Math.abs(r.z));
   const rough=.20+noise[0]*.30;
   const a=box(px+.58,py-.52,.105,.52,.08+rough*.12),b=box(px-.67,py+.08,.025,.72,.028+rough*.045);
   const broad=Math.exp(-(((px+.15)*.8)**2)-(((py-1.15)*2)**2));
   const silk=Math.exp(-(((px+.24+py*.44)/(.36+rough*.23))**2))*Math.exp(-(((py-.22)/1.15)**2));
   const fresnel=.04+.96*(1-Math.min(1,Math.abs(n.dot(v))))**5;
   const strength=(.35+fresnel*2.5+edge*.27)*glass;
   const broken=.94+smooth(.12,.80,noise[0])*.06;
   const field=Math.sin(u*card.width*4.3+Math.sin(t*card.height*3.4+time*.17)*1.8)+Math.cos(t*card.height*5.1-u*card.width*1.5-time*.13);
   const caustic=Math.max(0,1-Math.abs(field+(noise[0]-.5)*1.2)*2.6)**3*smooth(.30,.68,noise[0]);
   const phase=(r.x*3.1+r.y*4.7+r.z*2.3)+noise[0]*1.7+time*.035;
   const film=[0,2.1,4.2].map(shift=>.5+.5*Math.cos(phase*4+shift));
   const cr=(silk*.41+a*.50+b*.70+broad*.10)*broken*(.42+tint.x*.95)+film[0]*.30*caustic+tint.x*.12*caustic;
   const cg=(silk*.46+a*.57+b*.76+broad*.14)*broken*(.42+tint.y*.95)+film[1]*.30*caustic+tint.y*.12*caustic;
   const cb=(silk*.48+a*.61+b*.81+broad*.17)*broken*(.42+tint.z*.95)+film[2]*.30*caustic+tint.z*.12*caustic;
   const reflected=Math.max(cr,cg,cb)*strength;
   const alpha=Math.min(.52,(.020+noise[0]*.035)*glass+reflected+caustic*.05*glass+edge*.09*glass);
   const blend=Math.min(1,(reflected+caustic*.08)/Math.max(.001,alpha));
   data[k]=Math.round(Math.max(0,card.tint.r*.3*(1-blend)+cr*blend)**(1/2.2)*255);data[k+1]=Math.round(Math.max(0,card.tint.g*.3*(1-blend)+cg*blend)**(1/2.2)*255);data[k+2]=Math.round(Math.max(0,card.tint.b*.3*(1-blend)+cb*blend)**(1/2.2)*255);
   data[k+3]=Math.round(alpha*255);

  }
  this.rctx.putImageData(this.rimg,0,0);
 }
 render(scene,camera,{clear=true}={}){
  this.camera=camera;camera.updateMatrixWorld();this.card.updateMatrixWorld(true);const ctx=this.ctx;
  ctx.setTransform(1,0,0,1,0,0);if(clear)ctx.clearRect(0,0,this.canvas.width,this.canvas.height);ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
  const card=this.card,reveal=card.uniforms.uReveal.value;if(reveal<=.001)return;
  const front=this.outline(card.width,card.height,.17,card.thickness/2),back=this.outline(card.width,card.height,.17,-card.thickness/2);
  ctx.save();ctx.globalAlpha=reveal;
  for(let i=0;i<front.length;i++){const j=(i+1)%front.length;ctx.beginPath();ctx.moveTo(front[i].x,front[i].y);ctx.lineTo(back[i].x,back[i].y);ctx.lineTo(back[j].x,back[j].y);ctx.lineTo(front[j].x,front[j].y);ctx.closePath();ctx.fillStyle=`rgba(${Math.round(card.tint.r*220)},${Math.round(card.tint.g*220)},${Math.round(card.tint.b*220)},.48)`;ctx.fill();}
  this.path(front);ctx.clip();
  const video=card.video,canVideo=video.readyState>=2&&video.videoWidth>0,src=canVideo?video:this.poster;
  const iw=canVideo?video.videoWidth:this.poster.naturalWidth,ih=canVideo?video.videoHeight:this.poster.naturalHeight;
  if(iw&&ih){
   const fw=Math.min(960,iw),fh=Math.round(fw*ih/iw),g=Math.min(1,card.uniforms.uGlass.value);
   if(this.frame.width!==fw){this.frame.width=fw;this.frame.height=fh;this.frameDirty=true;}
   if(!canVideo||this.frameDirty||Math.abs(g-this.lastGlass)>.005||card.titleReady!==this.lastTitle||(!video.seeking&&video.currentTime!==this.lastTime)){
    this.fctx.clearRect(0,0,fw,fh);this.fctx.drawImage(src,0,0,fw,fh);
    const pixels=this.fctx.getImageData(0,0,fw,fh),d=pixels.data;
    for(let i=0;i<d.length;i+=4){
     // Approximate the GLSL's linear luminance alpha, preserving the actual video colours.
     const lum=.2126*(d[i]/255)**2.2+.7152*(d[i+1]/255)**2.2+.0722*(d[i+2]/255)**2.2;
     const tint=card.tint;
     d[i]=Math.min(255,d[i]*(1-g*.10+tint.r*g*.22)+tint.r*g*7);
     d[i+1]=Math.min(255,d[i+1]*(1-g*.10+tint.g*g*.22)+tint.g*g*7);
     d[i+2]=Math.min(255,d[i+2]*(1-g*.10+tint.b*g*.22)+tint.b*g*7);
     d[i+3]=Math.round(255*(.99*(1-g)+(.16+.43*Math.sqrt(lum))*g));
    }
    this.fctx.putImageData(pixels,0,0);

    this.lastTime=video.currentTime;this.lastGlass=g;this.lastTitle=card.titleReady;this.frameDirty=false;
   }
   ctx.globalAlpha=reveal;this.projectImage(this.frame,card.width-.010,card.height-.010,card.thickness/2+.0008,22,12);

  }
  ctx.globalAlpha=reveal;this.makeReflection();this.projectImage(this.reflect,card.width-.01,card.height-.01,card.thickness/2+.005,8,4);
  ctx.globalAlpha=reveal*card.uniforms.uGlass.value;this.projectImage(this.grain,card.width-.01,card.height-.01,card.thickness/2+.006,8,4);
  ctx.restore();
  if(card.titleReady){ctx.globalAlpha=reveal;this.projectImage(card.titleCanvas,card.width-.010,card.height-.010,card.titleDepth,12,6,card.titleOffset.x,card.titleOffset.y);}
  this.path(front);ctx.lineWidth=.75;ctx.strokeStyle=`rgba(${Math.round(90+card.tint.r*150)},${Math.round(90+card.tint.g*150)},${Math.round(90+card.tint.b*150)},${(.13+card.uniforms.uGlass.value*.15)*reveal})`;ctx.stroke();
 }
 dispose(){this.disposed=true;for(const type of ['seeked','loadeddata','canplay'])this.card.video.removeEventListener(type,this._invalidate);if(this._videoCallback&&this.card.video.cancelVideoFrameCallback)this.card.video.cancelVideoFrameCallback(this._videoCallback);}
}
