import { createControlsLayout } from './controls-layout.js';
import { tagActionButtons, tagSliderValues } from './controls-bridge.js';
import { createDialKit, createDialRoot, DialStore } from '/_/vendor/dialkit/index.js';

/** One inline visitor-facing panel per project. Versions are opt-in. */
export function createProjectControls(name, config, options = {}) {
  const target = document.getElementById('project-dials');
  if (!target)
    throw new Error('Include components/controls.html before creating project controls.');
  const disposeLayout = createControlsLayout(target);
  target.dataset.versions = String(options.versions ?? false);
  const action = options.primaryAction?.split('.').reduce((value, key) => value?.[key], config);
  if (options.primaryAction && action?.type !== 'action')
    throw new Error('primaryAction must identify an action in the controls config.');
  const root = createDialRoot({ target, mode: 'inline', theme: 'system', productionEnabled: true });
  const kit = createDialKit(name, config, { onAction: options.onAction });
  function markPrimaryAction() {
    const controls = DialStore.getPanel(kit.id)?.controls || [];
    tagActionButtons(target, controls, options.primaryAction);
    tagSliderValues(target, controls, options.valueText);
  }
  // Dialkit may rebuild controls; keep the action treatment after those renders.
  const observer = new MutationObserver(markPrimaryAction);
  observer.observe(target, { childList: true, subtree: true });
  markPrimaryAction();
  function blockBusyAction(event) {
    const button = event.target.closest?.('[data-action-path][aria-disabled="true"]');
    if (button) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
  target.addEventListener('click', blockBusyAction, true);
  const destroyKit = kit.destroy;
  const destroy = () => {
    target.removeEventListener('click', blockBusyAction, true);
    disposeLayout();
    observer.disconnect();
    destroyKit();
    root.destroy();
    window.removeEventListener('pagehide', onPageHide);
  };
  function onPageHide(event) {
    if (!event.persisted) destroy();
  }
  window.addEventListener('pagehide', onPageHide);
  kit.setActionBusy = (path, busy) => {
    for (const button of target.querySelectorAll('[data-action-path]')) {
      if (button.dataset.actionPath === path) button.setAttribute('aria-disabled', String(busy));
    }
  };
  kit.destroy = destroy;
  return kit;
}
