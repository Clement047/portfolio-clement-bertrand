import './loader.css';
import { traceCityStage } from './trace.js';
export function describeCityError(error) {
  const message=String(error?.message??error??'');
  if(/webgl|graphics context|gpu context/i.test(message)) return 'L’affichage 3D est indisponible dans ce navigateur. La version 2D reste accessible.';
  if(/fetch|network|load|404|403|http|failed to parse/i.test(message)) return 'Une ressource n’a pas pu être chargée. Vérifie ta connexion et réessaie.';
  return 'La préparation de l’expérience a échoué. Tu peux réessayer ou découvrir la version 2D.';
}
export function createCityLoading(element) {
  let failed=false,lastProgress=Date.now(),value=0,lastStage='Initialisation';
  const host=element?.parentElement;
  element.innerHTML=`<div class="experience-loader"><video class="loader-sparky" autoplay loop muted playsinline preload="auto" poster="/images/projects/sparky-fusee-poster.png" aria-label="Animation de Sparky et sa fusée"><source src="/images/projects/sparky-fusee.webm" type="video/webm"></video><p class="loader-audio">Pour profiter de l’expérience sonore,<br>mettez un casque ou des écouteurs.</p><div class="loader-track" role="progressbar" aria-label="Chargement de l’expérience" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div><p class="loader-status" role="status" aria-live="polite"></p><button class="loader-retry" hidden>Réessayer</button></div>`;
  const video=element.querySelector('video');
  if(video){video.muted=true;video.play()?.catch(()=>{});}
  const status=element.querySelector('.loader-status'),bar=element.querySelector('.loader-track'),fill=bar.firstElementChild,retry=element.querySelector('button');
  retry.addEventListener('click',()=>window.location.reload());
  const watchdog=window.setInterval(()=>{if(!failed&&Date.now()-lastProgress>90000){status.textContent='La préparation reste bloquée à l’étape : '+lastStage; element.dataset.state='slow';retry.hidden=false;}},1000);
  function stop(){window.clearInterval(watchdog);video?.pause();}
  return {
    get failed(){return failed;},
    stage(text,progress){if(failed)return;lastProgress=Date.now();if(text!==lastStage){lastStage=text;traceCityStage(text);}status.textContent=text;retry.hidden=true;if(progress!==undefined){value=Math.max(value,Math.min(99,progress));fill.style.transform=`scaleX(${value/100})`;bar.setAttribute('aria-valuenow',String(Math.round(value)));}},
    download(event){this.stage('Découverte de la ville…',event.total>0?event.loaded/event.total*30:Math.min(28,value+1));},
    fail(error){failed=true;stop();console.error('Initialisation de la ville :',error);if(!element.isConnected)host?.append(element);element.dataset.state='error';status.textContent=describeCityError(error);status.setAttribute('role','alert');retry.hidden=false;},
    complete(){fill.style.transform='scaleX(1)';bar.setAttribute('aria-valuenow','100');stop();}
  };
}
export function createCityRenderer(Renderer){
  let renderer;try{renderer=new Renderer({antialias:false,powerPreference:'high-performance'});}catch{renderer=new Renderer({antialias:false,powerPreference:'default'});}
  // The extra scene render used for glass is quarter-area; the final image keeps
  // its normal resolution and all original materials remain intact.
  renderer.transmissionResolutionScale=.5;
  return renderer;
}
