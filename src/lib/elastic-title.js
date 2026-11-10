// Keep the original SVG sampling density, but prepare it in short slices and
// only animate contours within reach of the pointer (or still settling).
export async function initializeElasticTitle(svg, container) {
  const paths = [...svg.querySelectorAll('path')];
  const items = [];
  let slice = performance.now(), samples = 0;
  const yieldFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
  for (const path of paths) {
    const original = path.getAttribute('d') || '';
    if (!original) continue;
    const length = path.getTotalLength();
    if (!Number.isFinite(length) || length <= 0) continue;
    const count = Math.max(24, Math.min(350, Math.ceil(length / 3)));
    const item = { path, original, closed: /[zZ]\s*$/.test(original), points: [], moving: false, deformed: false, minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    for (let i = 0; i < count; i++) {
      const p = path.getPointAtLength(i / count * length);
      item.points.push({ x: p.x, y: p.y, ox: 0, oy: 0, vx: 0, vy: 0 });
      item.minX = Math.min(item.minX, p.x); item.maxX = Math.max(item.maxX, p.x);
      item.minY = Math.min(item.minY, p.y); item.maxY = Math.max(item.maxY, p.y);
      samples++;
      if (performance.now() - slice >= 3) { await yieldFrame(); slice = performance.now(); }
    }
    items.push(item);
  }
  container.dataset.elasticSamples = String(samples);
  container.dataset.elasticReady = 'true';
  const pointer = { x: 0, y: 0, active: false, clientX: 0, clientY: 0, dirty: false };
  let frame = 0, disposed = false;
  const wake = () => { if (!frame && !disposed) frame = requestAnimationFrame(animate); };
  const move = event => {
    pointer.clientX = event.clientX; pointer.clientY = event.clientY;
    pointer.active = true; pointer.dirty = true; wake();
  };
  const leave = () => { pointer.active = false; wake(); };
  container.addEventListener('pointermove', move, { passive: true });
  container.addEventListener('pointerleave', leave, { passive: true });

  function contour(item) {
    const p = item.points, n = p.length;
    let d = `M${(p[0].x + p[0].ox).toFixed(2)} ${(p[0].y + p[0].oy).toFixed(2)}`;
    if (item.closed) {
      for (let i = 0; i < n; i++) {
        const a = p[i], b = p[(i + 1) % n], x = a.x + a.ox, y = a.y + a.oy;
        d += `Q${x.toFixed(2)} ${y.toFixed(2)} ${((x + b.x + b.ox) / 2).toFixed(2)} ${((y + b.y + b.oy) / 2).toFixed(2)}`;
      }
      return d + 'Z';
    }
    for (let i = 1; i < n; i++) d += `L${(p[i].x + p[i].ox).toFixed(2)} ${(p[i].y + p[i].oy).toFixed(2)}`;
    return d;
  }

  function animate() {
    frame = 0;
    if (disposed || document.hidden || !container.getClientRects().length) {
      pointer.active = false;
      for (const item of items) if (item.moving || item.deformed) {
        item.path.setAttribute('d', item.original); item.moving = item.deformed = false;
        for (const p of item.points) p.ox = p.oy = p.vx = p.vy = 0;
      }
      return;
    }
    if (pointer.dirty) {
      // One SVG/layout read per displayed frame, not per raw pointer event.
      const matrix = svg.getScreenCTM();
      if (matrix) {
        const point = svg.createSVGPoint(); point.x = pointer.clientX; point.y = pointer.clientY;
        const local = point.matrixTransform(matrix.inverse());
        pointer.x = local.x; pointer.y = local.y;
      }
      pointer.dirty = false;
    }
    let moving = false, activePaths = 0;
    for (const item of items) {
      const near = pointer.active && pointer.x > item.minX - 180 && pointer.x < item.maxX + 180 && pointer.y > item.minY - 180 && pointer.y < item.maxY + 180;
      if (!near && !item.moving && !item.deformed) continue;
      activePaths++;
      let changed = false, deformed = false;
      for (const p of item.points) {
        let tx = 0, ty = 0;
        if (near) {
          const dx = pointer.x - p.x, dy = pointer.y - p.y, distance2 = dx * dx + dy * dy;
          if (distance2 < 32400) {
            const influence = (1 - Math.sqrt(distance2) / 180) ** 2 * 140 / 180;
            tx = dx * influence; ty = dy * influence;
          }
        }
        p.vx = (p.vx + (tx - p.ox) * .09) * .87;
        p.vy = (p.vy + (ty - p.oy) * .09) * .87;
        p.ox += p.vx; p.oy += p.vy;
        if (Math.abs(tx - p.ox) > .01 || Math.abs(ty - p.oy) > .01 || Math.abs(p.vx) > .01 || Math.abs(p.vy) > .01) changed = true;
        if (Math.abs(p.ox) > .01 || Math.abs(p.oy) > .01) deformed = true;
      }
      if (changed) item.path.setAttribute('d', contour(item));
      else if (!deformed && item.deformed) {
        item.path.setAttribute('d', item.original);
        for (const p of item.points) p.ox = p.oy = p.vx = p.vy = 0;
      }
      item.deformed = deformed; item.moving = changed; moving ||= changed;
    }
    container.dataset.elasticActivePaths = String(activePaths);
    // No permanent RAF, and no per-letter blur/filter invalidation. The shared
    // original glow stays in CSS, while the local elastic/glitch effects remain.
    if (moving) wake();
  }
  window.addEventListener('pagehide', () => {
    disposed = true; cancelAnimationFrame(frame);
    container.removeEventListener('pointermove', move); container.removeEventListener('pointerleave', leave);
  }, { once: true });
}

export function activateElasticTitleWhenVisible(svg, title) {
  let started = false;
  const start = () => {
    if (started || document.hidden || !title.getClientRects().length) return;
    started = true; observer.disconnect();
    void initializeElasticTitle(svg, title).catch(console.warn);
  };
  const observer = new MutationObserver(start);
  // City entry is toggled with hidden; do not sample its SVG during GLB decoding.
  const entry = title.closest('#city-entry');
  if (entry) observer.observe(entry, { attributes: true, attributeFilter: ['hidden'] });
  const visible = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { start(); if (started) visible.disconnect(); }
  });
  visible.observe(title); start();
  window.addEventListener('pagehide', () => { observer.disconnect(); visible.disconnect(); }, { once: true });
}
