export const SCROLL_INTRO_DURATION=6000;

// Count readable time only: changing tabs must not dismiss the instructions.
export function advanceIntroReading(elapsed,delta,hidden){
 return hidden?elapsed:elapsed+Math.max(0,Math.min(delta,100));
}

export function showScrollIntro(panel,{duration=SCROLL_INTRO_DURATION}={}){
 if(!panel)return Promise.resolve(true);
 panel.hidden=false;
 return new Promise(resolve=>{
  let elapsed=0,last=performance.now(),frame=0,finished=false;
  function finish(reveal){if(finished)return;finished=true;cancelAnimationFrame(frame);panel.hidden=true;document.removeEventListener('astro:before-swap',cancel);resolve(reveal);}
  function cancel(){finish(false);}
  function tick(now){elapsed=advanceIntroReading(elapsed,now-last,document.hidden);last=now;if(elapsed>=duration)finish(true);else frame=requestAnimationFrame(tick);}
  document.addEventListener('astro:before-swap',cancel,{once:true});
  frame=requestAnimationFrame(tick);
 });
}

export function streamedDialogue(line,elapsed,interval=26){
 const letters=Array.from(line);
 return letters.slice(0,Math.max(0,Math.floor(elapsed/interval))).join('');
}
