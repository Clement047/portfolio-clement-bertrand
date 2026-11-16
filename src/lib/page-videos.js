// Native loop plus an ended fallback for Safari and segmented media.
// Only page videos: orbit textures manage their own visibility and lifecycle.
export function mountPageVideos() {
  const videos=[...document.querySelectorAll('main video, .v2-shell video')];
  const cleanups=[];
  for(const video of videos){
    if(video.dataset.loopReady)continue;
    video.dataset.loopReady='true';
    video.loop=true;video.setAttribute('loop','');
    video.playsInline=true;video.setAttribute('playsinline','');
    const autoplay=video.autoplay||video.hasAttribute('data-page-autoplay');
    if(autoplay){video.defaultMuted=true;video.muted=true;video.setAttribute('muted','');}
    let visible=false,manuallyPaused=false,automaticPause=false;
    function play(){
      if(!visible||document.hidden||manuallyPaused||!autoplay)return;
      video.play()?.then(()=>{delete video.dataset.autoplayBlocked;}).catch(()=>{
        video.dataset.autoplayBlocked='true';video.controls=true;
      });
    }
    function pause(){automaticPause=true;video.pause();}
    function onPause(){if(automaticPause)automaticPause=false;else if(visible&&!video.ended)manuallyPaused=true;}
    function onPlay(){manuallyPaused=false;delete video.dataset.autoplayBlocked;}
    function ended(){
      if(!visible||document.hidden)return;
      video.currentTime=video.seekable.length?video.seekable.start(0):0;
      video.play()?.catch(()=>{video.controls=true;});
    }
    const observer=new IntersectionObserver(entries=>{
      visible=entries.some(entry=>entry.isIntersecting);
      if(visible)play();else if(!video.paused)pause();
    },{threshold:.05});observer.observe(video);
    function visibility(){if(document.hidden){if(!video.paused)pause();}else play();}
    function gesture(){if(video.dataset.autoplayBlocked){manuallyPaused=false;play();}}
    video.addEventListener('ended',ended);video.addEventListener('pause',onPause);video.addEventListener('play',onPlay);
    video.addEventListener('loadeddata',play);document.addEventListener('visibilitychange',visibility);
    document.addEventListener('pointerdown',gesture,{passive:true});
    cleanups.push(()=>{observer.disconnect();video.removeEventListener('ended',ended);video.removeEventListener('pause',onPause);video.removeEventListener('play',onPlay);video.removeEventListener('loadeddata',play);document.removeEventListener('visibilitychange',visibility);document.removeEventListener('pointerdown',gesture);video.pause();delete video.dataset.loopReady;});
  }
  document.addEventListener('astro:before-swap',()=>cleanups.forEach(cleanup=>cleanup()),{once:true});
}
