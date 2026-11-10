/** Native states keep the original Figma crops, layers and prototype destinations. */
export function initEbeneConfigurator() {
  document.querySelectorAll<HTMLElement>('.ebene-configurator').forEach((root) => {
    if (root.dataset.initialized) return;
    root.dataset.initialized = 'true';
    const states = [...root.querySelectorAll<HTMLElement>('.config-state')];
    const load = async (state: HTMLElement) => {
      await Promise.all([...state.querySelectorAll<HTMLImageElement>('img[data-src]')].map(async (image) => {
        if (!image.src) image.src = image.dataset.src!;
        try { await image.decode(); } catch { /* The original image remains visible if decoding is deferred. */ }
      }));
    };
    const initial = states.find(state => !state.hidden);
    if (initial) void load(initial);
    let request = 0;
    root.addEventListener('click', async (event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>('button[data-target]');
      if (!button || !root.contains(button)) return;
      const next = states.find(state => state.dataset.state === button.dataset.target);
      if (!next) return;
      const currentRequest = ++request;
      root.setAttribute('aria-busy', 'true');
      await load(next);
      if (currentRequest !== request) return;
      const focused = document.activeElement === button;
      for (const state of states) state.hidden = state !== next;
      root.dataset.currentState = next.dataset.state;
      root.setAttribute('aria-busy', 'false');
      const selected = [...next.querySelectorAll<HTMLButtonElement>('[aria-pressed="true"]')].map(item => item.getAttribute('aria-label'));
      root.querySelector<HTMLElement>('.config-status')!.textContent = selected.join(' · ');
      if (focused) next.querySelector<HTMLButtonElement>(`[data-choice="${button.dataset.choice}"]`)?.focus({ preventScroll: true });
    });
  });
}
