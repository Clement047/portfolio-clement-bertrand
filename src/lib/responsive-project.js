// Reflow the original artboard on small screens without duplicating its media or controls.
export function mountResponsiveProject(shell, artboard) {
  const root = artboard.firstElementChild;
  if (!root) return () => {};
  const query = matchMedia('(max-width: 900px)');
  const original = new Map();
  const remember = element => { if (!original.has(element)) original.set(element, element.getAttribute('style')); };
  const set = (element, values) => {
    remember(element);
    for (const [key,value] of Object.entries(values)) element.style.setProperty(key,value,'important');
  };
  // Read design coordinates before the first mobile reflow.
  const flatten = parent => [...parent.children].flatMap(element => getComputedStyle(element).display === 'contents' ? flatten(element) : [element]);
  const sourceNodes=flatten(root);
  const placements=sourceNodes.map(element=>({element,parent:element.parentNode,next:element.nextSibling}));
  const nodes = sourceNodes.map((element,index) => {
    const style = getComputedStyle(element);
    return {element,index,top:parseFloat(style.top)||0,left:parseFloat(style.left)||0,
      width:parseFloat(style.width)||1,height:parseFloat(style.height)||1,
      heading:style.fontFamily.includes('Murmure'),font:parseFloat(style.fontSize)||16,
      media:!!element.querySelector('img,video,canvas,iframe') || element.matches('img,video,iframe'),
      text:element.textContent.replace(/[\s\u200b]/g,'')};
  }).sort((a,b)=>a.top-b.top||a.left-b.left);
  const wrappers=[];
  function restore(){
    for(const wrapper of wrappers.splice(0)){wrapper.replaceWith(...wrapper.childNodes);}
    for(const {element,parent,next} of [...placements].reverse()){if(element.parentNode!==parent)parent.insertBefore(element,next?.parentNode===parent?next:null);}
    for(const [element,style] of original){if(style===null)element.removeAttribute('style');else element.setAttribute('style',style);}
    original.clear();
    shell.classList.remove('project-reflow');
  }
  function update(){
    restore();
    if(!query.matches)return;
    shell.classList.add('project-reflow');
    set(artboard,{position:'relative',width:'100%',height:'auto',transform:'none',overflow:'visible'});
    set(root,{display:'flex','flex-direction':'column',gap:'24px',width:'100%',height:'auto',padding:'120px 24px 48px',overflow:'visible'});
    const available = Math.max(1,shell.clientWidth-48);
    for(const item of nodes){
      const {element}=item;
      if(element.matches('script,style'))continue;
      if(item.media){
        const scale=Math.min(1,available/item.width);
        const wrapper=document.createElement('div');wrapper.className='project-mobile-media';
        wrapper.style.cssText=`position:relative;width:${item.width*scale}px;max-width:100%;height:${item.height*scale}px;align-self:center;flex:none;overflow:hidden`;
        element.before(wrapper);wrapper.append(element);wrappers.push(wrapper);
        set(element,{position:'absolute',left:'0',top:'0',right:'auto',bottom:'auto',translate:'none',margin:'0',width:item.width+'px',height:item.height+'px',transform:`scale(${scale})`,'transform-origin':'top left'});
      }else if(item.text){
        const number=item.heading&&/^\d{1,2}$/.test(item.text);
        set(element,{position:'relative',left:'auto',right:'auto',top:'auto',bottom:'auto',translate:'none',transform:'none',width:'100%',height:'auto','min-height':'0',margin:'0',overflow:'visible','white-space':'normal','overflow-wrap':'anywhere','word-break':'normal','letter-spacing':item.heading?'.02em':'normal','line-height':item.heading?'1.12':'1.65','font-size':element.matches('a')?'17px':item.heading?(number?'25px':'clamp(38px,6vw,56px)'):'17px','text-align':'left'});
        for(const p of element.querySelectorAll('p'))set(p,{'line-height':'1.65','white-space':'normal','margin-bottom':'14px','font-size':'inherit'});
      }else set(element,{display:'none'}); // Artboard separators and purely decorative shapes.
      root.append(element.closest('.project-mobile-media')||element);
    }
  }
  query.addEventListener('change',update);
  let width=-1;
  const observer=new ResizeObserver(()=>{if(shell.clientWidth!==width){width=shell.clientWidth;update();}});
  observer.observe(shell);update();
  return ()=>{observer.disconnect();query.removeEventListener('change',update);restore();};
}
