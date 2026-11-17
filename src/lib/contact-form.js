export const MAX_ATTACHMENT_SIZE=10*1024*1024;
export function attachmentError(file){return file&&file.size>MAX_ATTACHMENT_SIZE?'Le fichier dépasse 10 Mo. Choisis un fichier plus léger.':'';}
export function submissionResult(data,ok){
 const message=String(data?.message||'');
 if(/activat|confirm.*email/i.test(message))return {success:false,message:'Le formulaire doit encore être activé. Tu peux aussi m’écrire directement par e-mail.'};
 if(ok&&(data?.success===true||data?.success==='true'))return {success:true,message:'Merci ! Ton message a bien été envoyé. Je te répondrai rapidement.'};
 return {success:false,message:'Le message n’a pas pu être envoyé. Réessaie ou contacte-moi directement par e-mail.'};
}
export function mountContactForms(){
 for(const form of document.querySelectorAll('[data-contact-form]')){
  if(form.dataset.ready)continue;form.dataset.ready='true';
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches,cleanups=[];
  const fields=[...form.querySelectorAll('[data-contact-field]')];
  for(const field of fields){
   const input=field.querySelector('input,textarea'),path=field.querySelector('path');let frame=0,lastPulse=-Infinity;
   const filled=()=>{field.classList.toggle('is-filled',!!input.value);if(input.tagName==='TEXTAREA'){input.style.height='auto';input.style.height=Math.max(51,input.scrollHeight)+'px';}};
   function pulse(event){if(reduced)return;cancelAnimationFrame(frame);lastPulse=performance.now();const rect=field.getBoundingClientRect(),x=Number.isFinite(event?.clientX)?Math.max(60,Math.min(940,(event.clientX-rect.left)/rect.width*1000)):500;const start=performance.now();
    const animate=now=>{const t=(now-start)/1000;if(t>1){path.setAttribute('d','M0 12 Q500 12 1000 12');frame=0;return;}const bend=17*Math.exp(-t*6)*Math.sin(t*21);path.setAttribute('d',`M0 12 Q${x.toFixed(1)} ${(12+bend).toFixed(2)} 1000 12`);frame=requestAnimationFrame(animate);};frame=requestAnimationFrame(animate);
   }
   const focus=()=>{if(performance.now()-lastPulse>120)pulse();};input.addEventListener('pointerdown',pulse);input.addEventListener('focus',focus);input.addEventListener('input',filled);filled();
   cleanups.push(()=>{cancelAnimationFrame(frame);input.removeEventListener('pointerdown',pulse);input.removeEventListener('focus',focus);input.removeEventListener('input',filled);});
  }
  const file=form.querySelector('input[type=file]'),chosen=form.querySelector('[data-file-chosen]'),filename=form.querySelector('[data-file-name]'),remove=form.querySelector('[data-remove-file]'),status=form.querySelector('[data-form-status]'),send=form.querySelector('[type=submit]');
  function fileChange(){const selected=file.files?.[0],error=attachmentError(selected);file.setCustomValidity(error);chosen.hidden=!selected;filename.textContent=selected?.name||'';if(error){status.textContent=error;status.dataset.state='error';file.reportValidity();}else if(status.dataset.state==='error'){status.textContent='';delete status.dataset.state;}}
  function removeFile(){file.value='';file.setCustomValidity('');fileChange();file.focus();}
  file.addEventListener('change',fileChange);remove.addEventListener('click',removeFile);
  const direct=form.querySelector('[data-contact-direct]');
  let pending=false,controller;
  function submitDirect(){
   if(pending)return;
   fileChange();if(!form.reportValidity()||form.elements.namedItem('_honey').value)return;
   form.elements.namedItem('_captcha').value='true';
   HTMLFormElement.prototype.submit.call(form);
  }
  direct?.addEventListener('click',submitDirect);
  async function submit(event){event.preventDefault();if(pending)return;fileChange();if(!form.reportValidity())return;
   if(form.elements.namedItem('_honey').value)return;
   pending=true;send.disabled=true;if(direct)direct.disabled=true;send.setAttribute('aria-busy','true');status.textContent='Envoi en cours…';delete status.dataset.state;
   controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),25000);
   const body=new FormData(form);if(!file.files?.length)body.delete('attachment');body.set('_url',location.href);
   try{
    const endpoint=form.action.replace('https://formsubmit.co/','https://formsubmit.co/ajax/');
    const response=await fetch(endpoint,{method:'POST',headers:{Accept:'application/json'},body,signal:controller.signal});
    const result=submissionResult(await response.json(),response.ok);status.textContent=result.message;status.dataset.state=result.success?'success':'error';if(direct)direct.hidden=result.success;
    if(result.success){form.reset();fileChange();for(const field of fields)field.querySelector('input,textarea').dispatchEvent(new Event('input'));}
   }catch(error){if(form.isConnected){if(direct)direct.hidden=false;status.textContent=error.name==='AbortError'?'L’envoi prend trop de temps. Ton message est conservé, tu peux réessayer.':'Connexion interrompue. Ton message est conservé, tu peux réessayer.';status.dataset.state='error';}}
   finally{clearTimeout(timeout);pending=false;send.disabled=false;if(direct)direct.disabled=false;send.removeAttribute('aria-busy');}
  }
  form.addEventListener('submit',submit);
  document.addEventListener('astro:before-swap',()=>{controller?.abort();for(const cleanup of cleanups)cleanup();file.removeEventListener('change',fileChange);remove.removeEventListener('click',removeFile);form.removeEventListener('submit',submit);direct?.removeEventListener('click',submitDirect);delete form.dataset.ready;},{once:true});
 }
}
