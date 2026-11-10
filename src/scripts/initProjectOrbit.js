/** Astro adapter: native section scrolling, no drag/hover, explicit disposal. */
export function initProjectOrbit(root, embedded=null) {
  let embeddedUpdate=()=>{},embeddedVisible=false;
  let disposed=false,frame=0,cleanup=()=>{};
  const base=new URL(root.dataset.assetBase||'/project-orbit/',location.origin);
  if(!base.pathname.endsWith('/'))base.pathname+='/';
  const url=p=>new URL(p,base).href;
  async function setup(){
    const [THREE,componentModule,pathModule,compat,hlsModule]=embedded?.modules??await Promise.all([
      embedded?Promise.resolve(embedded.THREE):import(/* @vite-ignore */url('vendor/three.module.js')),
      import(/* @vite-ignore */url(embedded?'GlassVideoCardCore.js':'GlassVideoCard.js')),
      import(/* @vite-ignore */url(embedded?'OrbitPathCore.js':'OrbitPath.js')),
      embedded?Promise.resolve({}):import(/* @vite-ignore */url('CanvasCompatibilityRenderer.js')),
      import(/* @vite-ignore */url('vendor/hls.mjs')),
    ]);
    if(disposed)return;
    const component=embedded?componentModule.bindGlassCards(THREE):componentModule,path=embedded?pathModule.bindOrbitPath(THREE):pathModule;
    const Hls=hlsModule.default,viewport=root.querySelector('.project-orbit__viewport');
    const canvas=embedded?.canvas??root.querySelector('[data-orbit-canvas]'),status=root.querySelector('[data-orbit-status]'),resume=root.querySelector('[data-orbit-resume]');
    const scene=embedded?.scene??new THREE.Scene(),camera=embedded?.camera??new THREE.PerspectiveCamera(38,1,.1,100);
    const cardParent=embedded?.group??scene;
    const projects=[
      {
        title:'SULL',
        aspect:1918/882,
        tint:0xb1263d,
        src:'assets/video/sull.m3u8',
        poster:'assets/poster.jpg'
      },
      {
        title:'SPARKY',
        aspect:1916/908,
        tint:0x167bd1,
        src:'assets/sparky/sparky.m3u8',
        poster:'assets/sparky/poster.jpg'
      },
      {
        title:'ÉBÈNE',
        aspect:1918/882,
        tint:0xb88a52,
        src:'assets/ebene/ebene.mp4',
        poster:null
      },
      {
        title:'DERRIÈRE LE PROMPT',
        aspect:1918/882,
        tint:0x824dff,
        src:'assets/derriere-le-prompt/derriere-le-prompt.mp4',
        poster:null
      },
      {
        title:'REFLECTIONS',
        aspect:2616/1042,
        tint:0x3458a4,
        src:'assets/reflections/reflections-motion.mp4',
        poster:null
      },
      {
        title:'NOKTURNE STUDIO',
        aspect:1918/882,
        tint:0x563b91,
        src:null,
        poster:null
      },
      {
        title:'VOID',
        aspect:1918/882,
        tint:0x3c9d83,
        src:null,
        poster:null
      },
    ];

    const projectDetails = [
      {
        index: '01 / SULL',
        description: 'Une plateforme de VOD pensée pour les cinéphiles, mêlant découverte de films, communauté et expériences immersives autour du cinéma.',
        skills: [
          'Développement web',
          'UX/UI',
          '3D',
          'Direction artistique'
        ],
        color: '#B1263D'
      },
      {
        index: '02 / SPARKY',
        description: 'Un robot 3D animé, associé à une intelligence artificielle développée pour interagir avec son environnement et enrichir l’expérience utilisateur.',
        skills: [
          'Modélisation 3D',
          'Animation',
          'Développement IA',
          'Blender'
        ],
        color: '#167BD1'
      },
      {
        index: '03 / ÉBÈNE',
        description: 'Une marque de lunettes artisanales en bois, alliant design, personnalisation et savoir-faire traditionnel.',
        skills: [
          'Design produit',
          'Modélisation 3D',
          'UX/UI',
          'Identité visuelle'
        ],
        color: '#B88A52'
      },
      {
        index: '04 / DERRIÈRE LE PROMPT',
        description: 'Une expérience de datavisualisation interactive qui explore l’impact environnemental des intelligences artificielles, en comparant leur consommation d’énergie, d’eau et leurs émissions de CO₂.',
        skills: [
          'Développement web',
          'Datavisualisation',
          'Analyse de données',
          'UX/UI'
        ],
        color: '#824DFF'
      },
      {
        index: '05 / REFLECTIONS',
        description: 'Une série de deux affiches inspirées de l’univers Star Wars, mettant en scène Dark Vador et Yoda. Un travail de composition et d’atmosphère cinématographique, mêlant modélisation 3D, éclairage et effets visuels.',
        skills: [
          'Modélisation 3D',
          'Lighting',
          'Composition visuelle',
          'Direction artistique'
        ],
        color: '#3458A4'
      },
      {
        index: '06 / NOKTURNE STUDIO',
        description: 'Un studio de création audiovisuelle fondé par trois passionnés, réunissant leurs compétences pour imaginer et donner vie à des univers singuliers. Entre courts-métrages, clips, publicités, musique et écriture, Nokturne Studio explore différentes formes de narration.',
        skills: [
          'Gestion de projet',
          'Réalisation audiovisuelle',
          'Composition musicale',
          'Écriture & scénarisation'
        ],
        color: '#563B91'
      },
      {
        index: '07 / VOID',
        description: 'Une créature horrifique imaginée et modélisée en 3D, prenant vie dans une mise en scène immersive inspirée des codes du cinéma d’horreur.',
        skills: [
          'Modélisation 3D',
          'Character Design',
          'Animation 3D',
          'Blender'
        ],
        color: '#3C9D83'
      },    ];

    const infoPanel = root.querySelector('[data-orbit-info]');
    const infoIndex = root.querySelector('[data-orbit-info-index]');
    const infoDescription = root.querySelector('[data-orbit-info-description]');
    const infoSkills = root.querySelector('[data-orbit-info-skills]');

    let activeProject = -1;

    function showProjectInfo(index) {
      if (index === activeProject) return;

      activeProject = index;

      const project = projectDetails[index];

      infoPanel.classList.remove('is-visible');

      if (!project) return;

      infoIndex.textContent = project.index;
      infoDescription.textContent = project.description;
      infoPanel.style.setProperty('--project-accent', project.color);

      infoSkills.replaceChildren();

      for (const skill of project.skills) {
        const tag = document.createElement('span');
        tag.className = 'project-orbit__skill';
        tag.textContent = skill;
        infoSkills.appendChild(tag);
      }

      const reveal=()=>{if(!disposed&&activeProject===index)infoPanel.classList.add('is-visible');};
      if(embedded)reveal();else requestAnimationFrame(reveal);
    }

    const players=[],cards=[],fallbacks=[];let renderer,environment,resizeObserver,angle=-.48,last=performance.now(),videoBudgetTime=0;
    cleanup=()=>{
      cancelAnimationFrame(frame);resizeObserver?.disconnect();
      resume.removeEventListener('click',resumeAll);
      players.forEach(p=>{p.video.pause();p.hls?.destroy();p.video.removeAttribute('src');p.video.load();p.video.remove();});
      cards.forEach(c=>c.dispose());fallbacks.forEach(f=>f.dispose());if(!embedded)renderer?.dispose();environment?.dispose();cards.forEach(c=>c.parent?.remove(c));
    };
    for(const p of projects){
      const video=document.createElement('video');
      video.muted=true;
      video.loop=true;
      video.playsInline=true;
      video.preload='auto';

      if(p.poster) video.poster=url(p.poster);

      video.hidden=true;
      video.setAttribute('aria-hidden','true');
      root.append(video);

      // Les cartes sans vidéo utilisent provisoirement
      // une surface de verre colorée.
      if(!p.src){
        video.width=16;
        video.height=9;
      }
      const card=new component.GlassVideoCard(video,{width:8,aspect:p.aspect*(7/5.8),placeholder:!p.src,title:p.title,tint:p.tint,titleDepth:.12,fontUrl:url('assets/fonts/le-murmure.otf')});if(embedded?.cardScale)card.scale.setScalar(embedded.cardScale);cards.push(card);cardParent.add(card);
      const player={video,hls:null};players.push(player);
      const play=()=>{if(!disposed&&(!embedded||embeddedVisible))video.play().catch(()=>{resume.hidden=false;});};
      video.addEventListener('loadeddata',()=>{status.hidden=true;});
      if(!p.src){
        // Projet sans vidéo : aucun chargement réseau.
      }else if(p.src.toLowerCase().endsWith('.mp4')){
        video.src=url(p.src);
        video.addEventListener('canplay',play,{once:true});
        video.load();
      }else if(Hls.isSupported()){
        player.hls=new Hls({maxBufferLength:14,maxMaxBufferLength:24,backBufferLength:6,capLevelToPlayerSize:true});
        player.hls.loadSource(url(p.src));
        player.hls.attachMedia(video);
        player.hls.on(Hls.Events.MANIFEST_PARSED,play);
        player.hls.on(Hls.Events.ERROR,(_,event)=>{
          if(event.fatal&&!disposed){
            status.hidden=false;
            status.textContent='Impossible de charger la vidéo '+p.title+'.';
          }
        });
      }else if(video.canPlayType('application/vnd.apple.mpegurl')){
        video.src=url(p.src);
        video.addEventListener('canplay',play,{once:true});
      }else{
        status.hidden=false;
        status.textContent='Lecture vidéo indisponible dans ce navigateur.';
      }
    }
    const context=embedded?null:canvas.getContext('webgl2',{alpha:true,antialias:true});
    if(embedded){renderer=embedded.renderer;}else if(context){
      renderer=new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
      environment=component.createStudioEnvironment(renderer);scene.environment=environment.texture;
      scene.add(new THREE.AmbientLight(0xa8b9c9,.6));const key=new THREE.DirectionalLight(0xe2e9ef,1.2);key.position.set(-2,3,5);scene.add(key);
    }else{
      cards.forEach((card,i)=>fallbacks.push(new compat.CanvasCompatibilityRenderer(canvas,card,camera,{poster:url(projects[i].poster)})));
      root.dataset.renderer='canvas-compatible';
    }
    // ===== PROJECT CARD NAVIGATION =====

    const projectSlugs = [
      'sull',
      'sparky',
      'ebene',
      'derriere-le-prompt',
      'reflections',
      'nokturne-studio',
      'void'
    ];

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function getCardAtPointer(event) {
      if(embedded&&(!embeddedVisible||(embedded.getVisibility?.()??1)<.01))return -1;
      const bounds = canvas.getBoundingClientRect();

      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      const intersections = raycaster.intersectObjects(cards, true);
      const blocker=embedded?.occluders?.length?raycaster.intersectObjects(embedded.occluders,true)[0]:null;

      for (const hit of intersections) {
        if(blocker&&blocker.distance<hit.distance-.001)return -1;
        let object = hit.object;

        while (object && !cards.includes(object)) {
          object = object.parent;
        }

        const index = cards.indexOf(object);

        if (index !== -1) return index;
      }

      return -1;
    }

    function onCardPointerMove(event) {
      canvas.style.cursor =
        getCardAtPointer(event) !== -1 ? 'pointer' : 'default';
    }

    function onCardClick(event) {
      const index = getCardAtPointer(event);

      if (index === -1) return;

      window.location.assign('/projets/' + projectSlugs[index]);
    }

    canvas.addEventListener('pointermove', onCardPointerMove);
    canvas.addEventListener('click', onCardClick);

    const previousCleanup = cleanup;

    cleanup = () => {
      canvas.removeEventListener('pointermove', onCardPointerMove);
      canvas.removeEventListener('click', onCardClick);
      previousCleanup();
    };

    // ===== END PROJECT CARD NAVIGATION =====
    function resize(){
      if(embedded)return;
      const w=viewport.clientWidth,h=viewport.clientHeight;camera.aspect=w/h;camera.position.set(0,.18,Math.max(11.2,11.8/camera.aspect));camera.lookAt(0,.18,-2.5);camera.updateProjectionMatrix();
      renderer?.setSize(w,h,false);fallbacks.forEach(f=>{f.setPixelRatio(Math.min(devicePixelRatio,1.25));f.setSize(w,h);});
    }
    if(!embedded){resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);resize();}
    function resumeAll(){players.forEach(p=>p.video.play().catch(()=>{}));resume.hidden=true;}
    resume.addEventListener('click',resumeAll);
    function animate(now){
      if(disposed)return;if(!embedded)frame=requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;
      const rect=root.getBoundingClientRect();
      const progress=embedded?embedded.getProgress():THREE.MathUtils.clamp(-rect.top/Math.max(1,root.offsetHeight-viewport.clientHeight),0,1);
      angle=THREE.MathUtils.damp(angle,-.48+progress*Math.PI*2*(embedded?.rotationDirection??-1),5,dt);
      embedded?.onOrbitAngle?.(angle);
      const order=cards.map((card,i)=>{card.update(dt);const cardAngle = angle + i * (Math.PI * 2 / cards.length);
const localCamera=embedded?cardParent.worldToLocal(camera.getWorldPosition(new THREE.Vector3())):camera.position;
const pose = path.orbitPose(cardAngle, localCamera, embedded?{...embedded.orbitSettings,readabilityUp:(embedded.readabilityUp?.()??new THREE.Vector3(0,1,0)).clone().transformDirection(cardParent.matrixWorld.clone().invert())}:undefined);

card.position.copy(pose.position);
card.visible = !embedded||(embedded.getVisibility?.()??1)>.005;
card.quaternion.copy(pose.quaternion);


if(embedded)card.uniforms.uReveal.value*=embedded.getVisibility?.()??1;
return { card, i };
}).sort((a, b) => embedded?b.card.getWorldPosition(new THREE.Vector3()).distanceToSquared(camera.getWorldPosition(new THREE.Vector3()))-a.card.getWorldPosition(new THREE.Vector3()).distanceToSquared(camera.getWorldPosition(new THREE.Vector3())):a.card.position.z-b.card.position.z);
      order.forEach(({card},i)=>{card.body.renderOrder=i*10;card.videoMesh.renderOrder=i*10+1;card.glassMesh.renderOrder=i*10+2;card.titleMesh.renderOrder=i*10+3;});


      // Embedded 3D only: avoid decoding/uploading seven full-resolution videos
      // when their cards are behind the camera or after leaving Saturn.
      if(embedded){videoBudgetTime+=dt;if(videoBudgetTime>.25){videoBudgetTime=0;cards.forEach((card,i)=>{
        const point=card.getWorldPosition(new THREE.Vector3()).project(camera);
        const visible=embeddedVisible&&(embedded.getVisibility?.()??1)>.01&&point.z>-1&&point.z<1&&Math.abs(point.x)<1.6&&Math.abs(point.y)<1.6;
        const video=players[i].video;if(visible&&video.paused)video.play().catch(()=>{});else if(!visible&&!video.paused)video.pause();
      });}}
      // Synchronisation des descriptions avec les cartes 3D
      // Détection de la carte réellement au premier plan.
      // On privilégie la profondeur, puis l'orientation et le centrage.
      const cameraForward = new THREE.Vector3();
      camera.getWorldDirection(cameraForward);

      const candidates = cards.map((card, index) => {
        const worldPosition=embedded?card.getWorldPosition(new THREE.Vector3()):card.position;
        const toCamera = camera.getWorldPosition(new THREE.Vector3())
          .sub(worldPosition)
          .normalize();

        const normal = new THREE.Vector3(0, 0, 1)
          .applyQuaternion(embedded?card.getWorldQuaternion(new THREE.Quaternion()):card.quaternion)
          .normalize();

        const facing = Math.abs(normal.dot(toCamera));

        const viewPosition = worldPosition.clone()
          .project(camera);

        const centerDistance = Math.sqrt(
          viewPosition.x * viewPosition.x +
          viewPosition.y * viewPosition.y
        );

        const depth = worldPosition.clone()
          .sub(camera.position)
          .dot(cameraForward);

        return {
          index,
          facing,
          centerDistance,
          depth,
          inView: depth > 0 &&
                  Math.abs(viewPosition.x) < 0.75 &&
                  Math.abs(viewPosition.y) < 0.75
        };
      });

      // Une carte doit être visible et proche de l'axe central.
      const visibleCandidates = candidates.filter(
        candidate => candidate.inView&&(!embedded||(embedded.getVisibility?.()??1)>.5)
      );

      // Parmi les cartes visibles, la plus proche de la caméra
      // est considérée comme celle du premier plan.
      visibleCandidates.sort((a,b)=>embedded?a.centerDistance-b.centerDistance:a.depth-b.depth);

      const foreground = visibleCandidates[0];

      if (
        foreground &&
        foreground.facing > 0.78 &&
        foreground.centerDistance < (embedded?.88:.48)
      ) {
        showProjectInfo(foreground.index);
      } else {
        infoPanel.classList.remove('is-visible');
        activeProject = -1;
      }
      if(!embedded&&!document.hidden&&rect.bottom>0&&rect.top<innerHeight){if(renderer)renderer.render(scene,camera);else order.forEach(({i},j)=>fallbacks[i].render(scene,camera,{clear:j===0}));}
    }
    if(embedded){embeddedUpdate=dt=>animate(last+dt*1000);embedded.onReady?.({cards,players,showProjectInfo});}
    else frame=requestAnimationFrame(animate);
  }
  const ready=setup().catch(error=>{console.error(error);if(!disposed){const status=root.querySelector('[data-orbit-status]');status.hidden=false;status.textContent='Impossible d’initialiser les cartes : '+error.message;}if(embedded)throw error;});
  const dispose=()=>{disposed=true;cancelAnimationFrame(frame);cleanup();};
  dispose.ready=ready;dispose.update=dt=>embeddedUpdate(dt);dispose.setVisible=value=>{embeddedVisible=value;root.hidden=!value;if(!value&&embedded?.canvas)embedded.canvas.style.cursor='default';root.querySelectorAll('video').forEach(video=>{if(value&&(video.currentSrc||video.src))video.play().catch(()=>{root.querySelector('[data-orbit-resume]').hidden=false;});else video.pause();});};
  return dispose;
}













