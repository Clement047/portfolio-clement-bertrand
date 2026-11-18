import {portraitFacts} from '../data/portrait-facts.js';
import {getLang} from './i18n.js';

// A shuffled deck avoids repeats until every fact has been shown, including
// across the boundary between two decks.
export function createFactPicker(size,random=Math.random){
 let deck=[],previous=-1;
 return ()=>{
  if(!deck.length){
   deck=Array.from({length:size},(_,i)=>i);
   for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
   if(size>1&&deck[deck.length-1]===previous)[deck[0],deck[deck.length-1]]=[deck[deck.length-1],deck[0]];
  }
  return previous=deck.pop();
 };
}

export function createPortraitFacts(host,{reduced=false}={}){
 const visual=host.querySelector('[data-avatar-fact]'),announcement=host.querySelector('[data-avatar-announcement]');
 const pick=createFactPicker(portraitFacts.length);
 let current=-1,timer=0,letters=[],count=0,disposed=false;
 function cancel(){clearTimeout(timer);timer=0;}
 function step(){
  timer=0;if(disposed||document.hidden)return;
  visual.textContent=letters.slice(0,++count).join('');
  if(count<letters.length)timer=setTimeout(step,26);
  else announcement.textContent=letters.join('');
 }
 function write(){
  cancel();host.dataset.hasFact='true';announcement.textContent='';
  letters=Array.from(portraitFacts[current][getLang()==='en'?1:0]);count=0;
  visual.textContent='';
  if(reduced){visual.textContent=announcement.textContent=letters.join('');count=letters.length;}
  else step();
 }
 function visibility(){cancel();if(!document.hidden&&current>=0&&count<letters.length)step();}
 function language(){if(current>=0)write();}
 document.addEventListener('visibilitychange',visibility);
 document.addEventListener('portfolio:lang',language);
 return {
  show(){if(disposed)return;current=pick();write();},
  dispose(){disposed=true;cancel();document.removeEventListener('visibilitychange',visibility);document.removeEventListener('portfolio:lang',language);}
 };
}
