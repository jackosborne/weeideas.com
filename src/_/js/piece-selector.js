import { createArtworkLifecycle } from '/_/js/lib/lifecycle.js';

const lifecycle = createArtworkLifecycle();
const stages = new Map([[location.pathname, document.querySelector('.artboard')]]);
const selector = document.querySelector('.piece-selector');
const steps = Array.from(selector.querySelectorAll('.piece-selector__step'));
const pills = steps.map((step) => step.querySelector('span'));

function updateSelector(path) {
  const activeIndex = steps.findIndex((step) => new URL(step.href).pathname === path);
  steps.forEach((step, index) => {
    if (index === activeIndex) step.setAttribute('aria-current', 'page');
    else step.removeAttribute('aria-current');
  });
  selector.querySelectorAll('.piece-selector__arrow').forEach((arrow, index) => {
    const destination = steps[activeIndex + (index === 0 ? -1 : 1)];
    const replacement = document.createElement(destination ? 'a' : 'button');
    replacement.className = arrow.className;
    replacement.setAttribute('aria-label', arrow.getAttribute('aria-label'));
    replacement.append(arrow.firstElementChild.cloneNode(true));
    if (destination) replacement.href = destination.href;
    else {
      replacement.type = 'button';
      replacement.disabled = true;
    }
    arrow.replaceWith(replacement);
  });
}

let currentPath = location.pathname;
let navigation = 0;

async function loadStage(path) {
  if (stages.has(path)) return stages.get(path);
  const response = await fetch(path, { signal: lifecycle.signal });
  if (!response.ok) throw new Error('Piece unavailable');
  const page = new DOMParser().parseFromString(await response.text(), 'text/html');
  const stage = page.querySelector('.artboard');
  if (!stage?.querySelector('.piece-selector')) throw new Error('Invalid collection page');
  const styles = Array.from(page.querySelectorAll('link[rel="stylesheet"]'));
  await Promise.all(
    styles.map((link) => {
      const href = new URL(link.getAttribute('href'), location.origin).href;
      if (Array.from(document.styleSheets).some((sheet) => sheet.href === href)) return;
      return new Promise((resolve, reject) => {
        const stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = href;
        stylesheet.onload = resolve;
        stylesheet.onerror = reject;
        document.head.append(stylesheet);
      });
    }),
  );
  stages.set(path, stage);
  return stage;
}

async function selectPiece(path, push, focus) {
  const request = ++navigation;
  try {
    const stage = await loadStage(path);
    if (request !== navigation || lifecycle.signal.aborted) return;
    const previous = stages.get(currentPath);
    if (previous !== stage) {
      // Preserve the pill nodes and their outgoing widths across the artwork swap.
      pills.forEach((pill) => {
        pill.style.width = `${pill.getBoundingClientRect().width}px`;
      });
      stage.querySelector('.piece-selector')?.remove();
      stage.querySelector('.artwork-stack').append(selector);
      previous.replaceWith(stage);
      updateSelector(path);
      // Establish the starting widths before releasing them to the new CSS state.
      selector.getBoundingClientRect();
      lifecycle.frame(() =>
        pills.forEach((pill) => {
          pill.style.removeProperty('width');
        }),
      );
      currentPath = path;
      await import(`${path}custom.js`);
      if (request !== navigation) return;
    }
    if (push && location.pathname !== path) history.pushState(null, '', path);
    if (focus)
      stage.querySelector('.piece-selector [aria-current="page"]').focus({ preventScroll: true });
  } catch (error) {
    if (!lifecycle.signal.aborted && request === navigation) location.assign(path);
  }
}

lifecycle.listen(document, 'click', (event) => {
  const link = event.target.closest?.('.piece-selector a');
  if (
    !link ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  event.preventDefault();
  selectPiece(new URL(link.href).pathname, true, true);
});
lifecycle.listen(window, 'popstate', () => selectPiece(location.pathname, false, false));
