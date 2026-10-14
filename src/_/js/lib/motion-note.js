/** Explain a motion preference using the artwork's existing lifecycle. */
export function bindMotionNote(root, preference, lifecycle) {
  const note = root.querySelector('[data-motion-note]');
  if (!note) return;
  const update = () => {
    note.hidden = !preference.matches;
  };
  update();
  lifecycle.listen(preference, 'change', update);
}
