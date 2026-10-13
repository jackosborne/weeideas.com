import { createControlsPreview } from './controls-preview.js';
/** Keep one mounted panel; only its disclosure and position change with the viewport. */
export function createControlsLayout(target) {
  const aside = target.closest('.project-controls');
  const disclosure = aside?.querySelector('.controls-disclosure');
  if (!disclosure) return () => {};
  const shell = aside.parentElement?.classList.contains('shell') ? aside.parentElement : null;
  const media = matchMedia('(max-width: 900px)');
  let mobileOpen = false;
  function syncLayout() {
    disclosure.open = media.matches ? mobileOpen : true;
    disclosure.dataset.enhanced = 'true';
    if (shell) {
      if (media.matches) shell.append(aside);
      else shell.prepend(aside);
    }
    if (media.matches && !disclosure.open && disclosure.contains(document.activeElement)) {
      disclosure.querySelector('summary').focus({ preventScroll: true });
    }
  }
  function rememberOpenState() {
    if (media.matches) mobileOpen = disclosure.open;
  }
  disclosure.addEventListener('toggle', rememberOpenState);
  media.addEventListener('change', syncLayout);
  syncLayout();
  const disposePreview = createControlsPreview(aside, disclosure, shell, media);
  return () => {
    disposePreview();
    disclosure.removeEventListener('toggle', rememberOpenState);
    media.removeEventListener('change', syncLayout);
  };
}
