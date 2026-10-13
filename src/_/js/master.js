// minimal, framework-free filtering
(function () {
  const filters = document.getElementById('filters');
  if (!filters) return;
  const pills = Array.from(filters.querySelectorAll('.pill'));
  const cards = Array.from(document.querySelectorAll('.card[data-tags]'));

  // persist selection via URL hash (#tag=motion)
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  let active = params.get('tag') || 'all';
  if (!pills.some((pill) => pill.dataset.tag === active)) active = 'all';
  setActivePill(active);
  applyFilter(active);

  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-tag]');
    if (!btn) return;
    const tag = btn.getAttribute('data-tag');
    if (tag === active) return;
    active = tag;
    setActivePill(active);
    applyFilter(active);
    const next = new URLSearchParams(location.hash.replace(/^#/, ''));
    next.set('tag', active);
    location.hash = next.toString();
  });

  window.addEventListener('hashchange', () => {
    const tag = new URLSearchParams(location.hash.slice(1)).get('tag') || 'all';
    active = pills.some((pill) => pill.dataset.tag === tag) ? tag : 'all';
    setActivePill(active);
    applyFilter(active);
  });

  function setActivePill(tag) {
    pills.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tag === tag)));
  }

  function applyFilter(tag) {
    const showAll = tag === 'all';
    cards.forEach((card) => {
      const tags = (card.dataset.tags || '').split(/\s+/).filter(Boolean);
      const show = showAll || tags.includes(tag);
      card.toggleAttribute('hidden', !show);
    });
  }
})();
