/** A small live canvas preview for mobile editing, without resizing the original artwork. */
export function createControlsPreview(aside, disclosure, shell, media) {
  const source = shell?.querySelector('.artwork-frame');
  const canvas = source?.querySelector('canvas');
  if (!canvas) return () => {};
  const sourceItem = [...shell.children].find((child) => child !== aside && child.contains(canvas));
  const previousAriaHidden = sourceItem.getAttribute('aria-hidden');
  const previousInert = sourceItem.inert;
  const preview = document.createElement('div');
  preview.className = 'controls-preview';
  preview.hidden = true;
  const image = document.createElement('canvas');
  image.className = 'controls-preview__image';
  image.setAttribute('role', 'img');
  image.setAttribute(
    'aria-label',
    `Live preview: ${canvas.getAttribute('aria-label') || 'artwork'}`,
  );
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'action-button controls-preview__back';
  back.textContent = 'Back to artwork';
  preview.append(image, back);
  aside.prepend(preview);
  const context = image.getContext('2d');
  let frame = 0;
  let active = false;
  let lastPaint = 0;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');

  function paint() {
    if (!active || document.hidden || !canvas.width || !canvas.height) return;
    const ratio = canvas.width / canvas.height;
    const height = Math.min(200 / ratio, window.innerHeight * 0.3);
    const width = height * ratio;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * dpr),
      pixelHeight = Math.round(height * dpr);
    if (image.width !== pixelWidth || image.height !== pixelHeight) {
      image.width = pixelWidth;
      image.height = pixelHeight;
    }
    image.style.width = `${width}px`;
    image.style.height = `${height}px`;
    context.clearRect(0, 0, image.width, image.height);
    context.fillStyle = getComputedStyle(canvas).backgroundColor;
    context.fillRect(0, 0, image.width, image.height);
    context.drawImage(canvas, 0, 0, image.width, image.height);
  }
  function tick(time) {
    frame = 0;
    if (!active || document.hidden) return;
    if (preference.matches) {
      paint();
      return;
    }
    if (time - lastPaint >= 33) {
      paint();
      lastPaint = time;
    }
    frame = requestAnimationFrame(tick);
  }
  function restart() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (active && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function sync() {
    const next = media.matches && disclosure.open;
    if (next && !active)
      shell.style.setProperty(
        '--tweaking-source-width',
        `${sourceItem.getBoundingClientRect().width}px`,
      );
    active = next;
    preview.hidden = !active;
    sourceItem.toggleAttribute('data-tweaking-source', active);
    if (active) {
      sourceItem.setAttribute('aria-hidden', 'true');
      sourceItem.inert = true;
    } else {
      if (previousAriaHidden === null) sourceItem.removeAttribute('aria-hidden');
      else sourceItem.setAttribute('aria-hidden', previousAriaHidden);
      sourceItem.inert = previousInert;
    }
    restart();
  }
  function resize() {
    if (active) {
      const width =
        shell.clientWidth -
        parseFloat(getComputedStyle(shell).paddingLeft) -
        parseFloat(getComputedStyle(shell).paddingRight);
      shell.style.setProperty(
        '--tweaking-source-width',
        `${Math.min(width, parseFloat(getComputedStyle(shell).getPropertyValue('--artwork-width')) || width)}px`,
      );
    }
    paint();
  }
  function returnToArtwork() {
    disclosure.open = false;
    sync();
    source.scrollIntoView({ block: 'start', behavior: 'instant' });
    disclosure.querySelector('summary').focus({ preventScroll: true });
  }
  back.addEventListener('click', returnToArtwork);
  disclosure.addEventListener('toggle', sync);
  media.addEventListener('change', sync);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', restart);
  preference.addEventListener('change', restart);
  aside.addEventListener('input', restart);
  aside.addEventListener('click', restart);
  aside.addEventListener('pointermove', restart);
  aside.addEventListener('keydown', restart);
  sync();
  return () => {
    cancelAnimationFrame(frame);
    back.removeEventListener('click', returnToArtwork);
    disclosure.removeEventListener('toggle', sync);
    media.removeEventListener('change', sync);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', restart);
    preference.removeEventListener('change', restart);
    aside.removeEventListener('input', restart);
    aside.removeEventListener('click', restart);
    aside.removeEventListener('pointermove', restart);
    aside.removeEventListener('keydown', restart);
    sourceItem.removeAttribute('data-tweaking-source');
    sourceItem.inert = previousInert;
    if (previousAriaHidden === null) sourceItem.removeAttribute('aria-hidden');
    else sourceItem.setAttribute('aria-hidden', previousAriaHidden);
    preview.remove();
  };
}
