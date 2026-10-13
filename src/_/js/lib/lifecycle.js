/** Own an artwork's events, observers and scheduled work until page exit. */
export function createArtworkLifecycle() {
  const controller = new AbortController();
  const cleanups = new Set();
  const frames = new Set();
  const timers = new Set();
  function dispose() {
    if (controller.signal.aborted) return;
    controller.abort();
    for (const frame of frames) cancelAnimationFrame(frame);
    for (const timer of timers) clearTimeout(timer);
    for (const cleanup of cleanups) cleanup();
    cleanups.clear();
    window.removeEventListener('pagehide', onPageHide);
  }
  function onPageHide(event) {
    if (!event.persisted) dispose();
  }
  window.addEventListener('pagehide', onPageHide);
  return {
    signal: controller.signal,
    dispose,
    cleanup(callback) {
      if (controller.signal.aborted) callback();
      else cleanups.add(callback);
      return callback;
    },
    listen(target, type, callback, options = {}) {
      target.addEventListener(type, callback, { ...options, signal: controller.signal });
    },
    frame(callback) {
      if (controller.signal.aborted) return 0;
      const id = requestAnimationFrame((time) => {
        frames.delete(id);
        if (!controller.signal.aborted) callback(time);
      });
      frames.add(id);
      return id;
    },
    timeout(callback, delay) {
      if (controller.signal.aborted) return 0;
      const id = setTimeout(() => {
        timers.delete(id);
        if (!controller.signal.aborted) callback();
      }, delay);
      timers.add(id);
      return id;
    },
    observeResize(element, callback) {
      const observer = new ResizeObserver((entries) => {
        if (!controller.signal.aborted) callback(entries);
      });
      observer.observe(element);
      cleanups.add(() => observer.disconnect());
    },
  };
}

export function isTypingTarget(target) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'),
    )
  );
}
