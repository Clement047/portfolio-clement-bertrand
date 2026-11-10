const clamp=x=>Math.max(0,Math.min(1,x));

export function createSpaceScroll(onReturn){

 let target=0,current=0,returnRequested=false,returnSent=false,overscroll=0;

 return {

  get progress(){return clamp(current);},get journey(){return current;},get orbitProgress(){return clamp((current-.65)/.9);},get target(){return target;},

  scroll(delta){if(returnSent)return;const next=target+delta*.00035;if(next<0){overscroll-=next;target=0;if(overscroll>.018)returnRequested=true;}else{overscroll=0;target=Math.min(4.8,Math.max(0,next));if(delta>0)returnRequested=false;}},

  goTo(value){target=Math.max(0,Math.min(4.8,value));returnRequested=false;returnSent=false;},

  requestReturn(){returnRequested=true;target=0;},

  update(delta){current+=(target-current)*(1-Math.exp(-6*delta));if(returnRequested&&current<.0006&&!returnSent){current=0;returnSent=true;onReturn();}return clamp(current);},

  seek(value){overscroll=0;target=Math.max(0,Math.min(4.8,value));current=target;returnRequested=false;returnSent=false;},

  reset(){overscroll=0;target=0;current=0;returnRequested=false;returnSent=false;}

 };

}

export function sampleReturnBridge(seconds){

 const warpDuration=7,ascentDuration=2.1;

 if(seconds<warpDuration){const t=Math.max(0,seconds);const x=Math.min(1,t/1.4),s=x*x*(3-2*x);return {phase:'return-hyperspace',warpTime:Math.max(0,7-t),projectBlend:1-s,ascentProgress:1};}

 const p=seconds>=warpDuration+ascentDuration-1e-9?0:Math.max(0,1-(seconds-warpDuration)/ascentDuration);return {phase:p>0?'return-ascent':'city',warpTime:0,projectBlend:0,ascentProgress:p};

}

