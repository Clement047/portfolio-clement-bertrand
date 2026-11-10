const start = performance.now();
const run = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
export function traceCityStage(stage, details = {}) {
  if (!import.meta.env?.DEV) return;
  const value = { run, stage, ms: Math.round(performance.now() - start), details };
  const host = document.querySelector('#city-experience');
  if (host) host.dataset.startupStage = stage;
  void fetch('/__city-startup-trace', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value)
  }).catch(() => {});
}

export function traceCityGraphics(renderer) {
  if (!import.meta.env?.DEV) return;
  const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
  traceCityStage('graphics-context', { renderer:gl.getParameter(debug?.UNMASKED_RENDERER_WEBGL??gl.RENDERER), parallelShaders:Boolean(gl.getExtension('KHR_parallel_shader_compile')) });
  for(const method of ['texImage2D','texSubImage2D','generateMipmap','getProgramParameter','getShaderParameter','getUniformLocation','getAttribLocation','bufferData','bufferSubData','drawElements','drawArrays','checkFramebufferStatus']) {
    const original=gl[method];if(typeof original!=='function')continue;
    gl[method]=function(...args){const start=performance.now();try{return original.apply(this,args);}finally{const ms=Math.round(performance.now()-start);if(ms>25)traceCityStage('webgl-slow-call',{method,ms});}};
  }
}
