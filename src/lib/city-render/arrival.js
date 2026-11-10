// Absolute clip times: animation data and relative lever delay remain untouched.
const smooth = t => { t = Math.max(0, Math.min(1, t)); return t*t*(3-2*t); };
export function sampleHyperspace(time) {
  if (time < 1.2) return { speed: .08, streak: .06 };
  if (time < 2.9) { const t=smooth((time-1.2)/1.7); return {speed:.08+2.32*t,streak:.06+3.74*t}; }
  if (time < 4) return { speed: 2.4, streak: 3.8 };
  const t=smooth((time-4)/1.6); return {speed:2.4-2.34*t,streak:3.8-3.74*t};
}
export function createArrivalSequence({ arrivalTime, endTime, actorStart, actorEnd, ascentDuration=2.1, warpDuration=7, fadeDuration=1.4 }) {
  let clock=0, started=null;
  const interactionDuration=actorEnd-actorStart;
  if (!(interactionDuration>0 && endTime>arrivalTime && ascentDuration>0 && warpDuration>fadeDuration)) throw new Error('Invalid arrival timeline');
  return {
    get locked(){return started!==null;},
    reset(){clock=0;started=null;},
    update(delta,requestedTime){
      clock+=Math.max(0,delta);
      if(started===null && requestedTime>=arrivalTime-.002) started=clock;
      if(started===null) return {phase:'city',cameraTime:Math.min(requestedTime,arrivalTime),actorTime:actorStart,warpTime:0,blend:0};
      const elapsed=clock-started;
      if(elapsed<interactionDuration) return {phase:'interaction',cameraTime:arrivalTime,actorTime:actorStart+elapsed,warpTime:0,blend:0};
      const ascent=elapsed-interactionDuration;
      if(ascent<ascentDuration) return {phase:'ascent',cameraTime:arrivalTime+(endTime-arrivalTime)*smooth(ascent/ascentDuration),actorTime:actorEnd,warpTime:0,blend:0,ascentProgress:ascent/ascentDuration};
      const warpTime=ascent-ascentDuration;
      return {phase:warpTime>=warpDuration?'projects':warpTime>=warpDuration-fadeDuration?'project-transition':'hyperspace',cameraTime:endTime,actorTime:actorEnd,warpTime,blend:smooth((warpTime-(warpDuration-fadeDuration))/fadeDuration)};
    }
  };
}
