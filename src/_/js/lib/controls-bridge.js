/** Dialkit 2.x renders action controls depth-first, with the .dialkit-button class. */
export function actionPaths(controls) {
  return controls.flatMap((control) =>
    control.type === 'action'
      ? [control.path]
      : control.type === 'folder'
        ? actionPaths(control.children || [])
        : [],
  );
}

export function tagActionButtons(target, controls, primaryAction) {
  // Inline roots have a static heading, not a collapsible button.
  for (const title of target.querySelectorAll(
    '.dialkit-folder-root > .dialkit-panel-header > .dialkit-folder-header-top:not([role="button"])',
  )) {
    title.removeAttribute('aria-expanded');
    title.removeAttribute('aria-label');
  }
  const paths = actionPaths(controls);
  const buttons = [...target.querySelectorAll('.dialkit-button')];
  if (buttons.length !== paths.length)
    throw new Error(
      'Dialkit action rendering changed: action buttons do not match registered controls.',
    );
  buttons.forEach((button, index) => {
    const primary = paths[index] === primaryAction;
    button.dataset.actionPath = paths[index];
    button.classList.add('action-button');
    button.classList.toggle('action-button--primary', primary);
    button.toggleAttribute('data-primary-action', primary);
  });
}

export function tagSliderValues(target, controls, formatters) {
  if (!formatters) return;
  function flatten(list) {
    return list.flatMap((control) =>
      control.type === 'slider'
        ? [control]
        : control.type === 'folder'
          ? flatten(control.children || [])
          : [],
    );
  }
  const metadata = flatten(controls);
  const sliders = [...target.querySelectorAll('.dialkit-slider[role="slider"]')];
  if (sliders.length !== metadata.length)
    throw new Error(
      'Dialkit slider rendering changed: configured value announcements need review.',
    );
  sliders.forEach((slider, index) => {
    const path = metadata[index].path;
    slider.dataset.controlPath = path;
    if (formatters[path])
      slider.setAttribute(
        'aria-valuetext',
        formatters[path](Number(slider.getAttribute('aria-valuenow'))),
      );
  });
}
