// The city does not need a second scene, its render targets, or its downloads
// before the locked departure sequence. Standalone space still uses the eager API.
import {createSpaceExperience} from './experience.js';
export function createDeferredSpaceExperience(...args){
 let instance;
 const ensure=()=>instance??=createSpaceExperience(...args);
 return {
  get stats(){return instance?.stats??{prepared:false,loaded:false};},
  get progress(){return instance?.progress??0;},
  get ready(){return ensure().ready;},
  prepare(){return ensure().prepare();},
  beginArrival(){ensure().beginArrival();},
  show(){ensure().show();},hide(){instance?.hide();},
  scroll(delta){ensure().scroll(delta);},seek(value){ensure().seek(value);},
  reset(){instance?.reset();},resize(){instance?.resize();},
  render(time){ensure().render(time);},renderTo(target,time){ensure().renderTo(target,time);},
  dispose(){instance?.dispose();instance=undefined;}
 };
}
