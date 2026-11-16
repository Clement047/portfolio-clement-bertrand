const bounded = value => Math.max(-600, Math.min(600, Number(value) || 0));
// Reverse the previous mapping consistently across the full 3D journey.
export function wheelAdvance(event, height = innerHeight) { return bounded(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1)); }
export function keyAdvance(key) { const sign = ['ArrowDown','PageDown'].includes(key) ? 1 : ['ArrowUp','PageUp'].includes(key) ? -1 : 0; return sign * (key.startsWith('Page') ? 240 : 80); }
export function touchAdvance(previousY, currentY) { return bounded((previousY-currentY)*2); }
export function initialPixelRatio(width, height, deviceRatio=1) { return Math.min(deviceRatio, 1.25, Math.sqrt(1800000/Math.max(1,width*height))); }
// Sustained frame pacing, never an isolated loading spike, controls the render budget.
export function createFrameBudget(initial, onChange) {
 let ratio=initial, total=0, samples=0, stable=0, cooldown=0;
 return { get ratio(){return ratio;}, sample(seconds, eligible=true){
  if(!eligible||seconds<=0||!Number.isFinite(seconds)){total=0;samples=0;stable=0;return;}
  cooldown=Math.max(0,cooldown-seconds);total+=Math.min(seconds,.12);samples++;
  if(samples<24)return;
  const average=total/samples;total=0;samples=0;
  stable=average<.0178?stable+1:0;
  if(cooldown>0)return;
  // Below .72 distant windows and tower edges turn coarse: keep this floor.
  const floor=Math.min(initial,.72);
  // Frame cost follows the pixel count (ratio²): a slow frame jumps straight to the
  // ratio that should reach ~19 ms, instead of 14 % steps every 4 s (20 s+ of stutter).
  const next=average>.021?Math.max(floor,ratio*Math.min(.86,Math.max(.6,Math.sqrt(.019/average)))):stable>=18?Math.min(initial,ratio+.06):ratio;
  if(Math.abs(next-ratio)>.015){ratio=next;stable=0;cooldown=4;onChange(ratio);}
 }};
}
