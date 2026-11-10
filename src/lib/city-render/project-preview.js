import * as THREE from 'three';

export function createProjectPreview(renderer, onReturn) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#030612');
  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, .1, 100);
  camera.position.set(0, .4, 9);
  const group = new THREE.Group();
  scene.add(group);
  const textures = [];
  for (let i = 0; i < 3; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = 768; canvas.height = 512;
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 768, 512);
    gradient.addColorStop(0, '#10254c'); gradient.addColorStop(1, '#281348');
    context.fillStyle = gradient; context.fillRect(0, 0, 768, 512);
    context.strokeStyle = ['#84e0ff', '#a89aff', '#e998ff'][i]; context.lineWidth = 4; context.strokeRect(14, 14, 740, 484);
    context.fillStyle = '#e8f4ff'; context.font = '28px Arial'; context.fillText(`PROJET 0${i + 1}`, 52, 80);
    context.font = '54px Arial'; context.fillText('À DÉCOUVRIR', 52, 265);
    context.font = '22px Arial'; context.fillText('Emplacement provisoire', 52, 430);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
    const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
    const card = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.74, .1), material);
    card.position.set((i - 1) * 3, 0, Math.abs(i - 1) * -.7); card.rotation.y = (1 - i) * .13;
    group.add(card);
  }
  const positions = new Float32Array(600 * 3);
  for (let i = 0; i < positions.length; i += 3) { positions[i] = Math.sin(i * 12.9898) * 25; positions[i + 1] = Math.cos(i * 5.781) * 15; positions[i + 2] = -8 - (i % 80); }
  const stars = new THREE.BufferGeometry(); stars.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  scene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: '#a6c7ff', size: .035, toneMapped: false })));
  const hud = document.createElement('div');
  hud.style.cssText = 'position:fixed;inset:0;z-index:20;pointer-events:none;color:#d9e8ff;font:12px Arial;letter-spacing:.12em';
  const title = document.createElement('p'); title.textContent = 'PROJETS — SCÈNE PROVISOIRE'; title.style.cssText = 'position:absolute;top:24px;left:35px';
  const button = document.createElement('button'); button.textContent = 'Retour à la ville'; button.style.cssText = 'position:absolute;bottom:30px;left:35px;padding:12px 20px;pointer-events:auto;background:#10203b;border:1px solid #648bc6;border-radius:6px;color:#e4efff;cursor:pointer';
  button.addEventListener('click', onReturn); hud.append(title, button); hud.hidden = true; document.body.append(hud);
  let offset = 0;
  return {
    show() { hud.hidden = false; }, hide() { hud.hidden = true; },
    scroll(delta) { offset = THREE.MathUtils.clamp(offset + delta * .003, -2.5, 2.5); },
    renderTo(target, time) { group.position.x += (offset - group.position.x) * .08; group.position.y = Math.sin(time * .4) * .06; renderer.setRenderTarget(target); renderer.clear(); renderer.render(scene, camera); },
    render(time) { this.renderTo(null,time); },
    prepare() { renderer.compile(scene,camera); },
    resize() { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); },
    dispose() { hud.remove(); scene.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); }); textures.forEach(texture => texture.dispose()); },
  };
}
