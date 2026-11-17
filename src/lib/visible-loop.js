// Suspend scheduling, not only drawing, when a scene is hidden. Existing render
// cadence is retained; timed scenes do not wake on every display refresh.
export function createVisibleLoop(draw,{interval=0,visible=true,environment=globalThis}={}){
 let frame=0,timer=0,last=-Infinity,disposed=false;
 const active=()=>!disposed&&visible&&!environment.document.hidden;
 function pause(){if(frame)environment.cancelAnimationFrame(frame);if(timer)environment.clearTimeout(timer);frame=0;timer=0;}
 function queue(){
  if(!active()||frame||timer)return;
  const remaining=Math.max(0,interval-(environment.performance.now()-last));
  if(remaining>0)timer=environment.setTimeout(()=>{timer=0;if(active())frame=environment.requestAnimationFrame(tick);},remaining);
  else frame=environment.requestAnimationFrame(tick);
 }
 function tick(now){frame=0;if(!active())return;if(now-last>=interval){last=now;draw(now);}queue();}
 function visibility(){pause();if(active()){last=-Infinity;queue();}}
 environment.document.addEventListener('visibilitychange',visibility);
 queue();
 return {
  setVisible(value){visible=Boolean(value);visibility();},
  invalidate(){pause();last=-Infinity;queue();},
  dispose(){if(disposed)return;disposed=true;pause();environment.document.removeEventListener('visibilitychange',visibility);}
 };
}
