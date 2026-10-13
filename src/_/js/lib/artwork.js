/** Download without large data URLs; report failures to the caller. */
export async function downloadCanvas(canvas, filename) {
  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error('PNG export failed'))),
      'image/png',
    ),
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Draw once for reduced motion; pause when hidden; redraw on interaction. */
export function animate(draw, target = document, { signal } = {}) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  function tick(time) {
    frame = 0;
    if (document.hidden) return;
    draw(time);
    if (!preference.matches) frame = requestAnimationFrame(tick);
  }
  function refresh() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(tick);
  }
  document.addEventListener('visibilitychange', refresh);
  preference.addEventListener('change', refresh);
  target.addEventListener('input', refresh);
  target.addEventListener('click', refresh);
  target.addEventListener('pointermove', refresh);
  window.addEventListener('resize', refresh);
  window.addEventListener('keydown', refresh);
  refresh();
  const dispose = () => {
    cancelAnimationFrame(frame);
    signal?.removeEventListener('abort', dispose);
    document.removeEventListener('visibilitychange', refresh);
    preference.removeEventListener('change', refresh);
    target.removeEventListener('input', refresh);
    target.removeEventListener('click', refresh);
    target.removeEventListener('pointermove', refresh);
    window.removeEventListener('resize', refresh);
    window.removeEventListener('keydown', refresh);
  };
  if (signal?.aborted) dispose();
  else signal?.addEventListener('abort', dispose, { once: true });
  return dispose;
}
