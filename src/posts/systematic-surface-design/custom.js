// --- tiny state store ------------------------------------------------------
const CELLS = Array.from({ length: 16 }, () => ({ shape: 'blank', locked: false }));
const SHAPES = ['blank', 'square', 'circle', 'triangle'];
const board = document.getElementById('board');
const gCells = document.getElementById('cells');
const legend = document.getElementById('legend');
const btnRandom = document.getElementById('randomise');
const btnReset = document.getElementById('reset');
const status = document.getElementById('surface-status');

// default tool: square
let activeShape = 'square';
setLegendActive(activeShape);

// --- build the 16 cell groups ---------------------------------------------
// Each cell is a <g> translated to its 25×25 slot.
const size = 25; // cell units in viewBox coords
CELLS.forEach((cell, i) => {
  const r = Math.floor(i / 4),
    c = i % 4;
  const g = mkSVG('g', {
    class: 'cell',
    'data-index': i,
    'data-state': 'tentative',
    transform: `translate(${c * size} ${r * size})`,
  });

  // Background (white tile) to guarantee full-bleed base
  const bg = mkSVG('rect', { x: 0, y: 0, width: size, height: size, fill: 'transparent' });
  g.appendChild(bg);

  // A holder group where the shape will live
  const shapeWrap = mkSVG('g', { class: 'shape' });
  g.appendChild(shapeWrap);

  // A crisp inset focus marker stays inside the tile and above its artwork.
  for (const className of ['cell-focus-halo', 'cell-focus']) {
    g.appendChild(
      mkSVG('rect', {
        class: className,
        x: 1,
        y: 1,
        width: size - 2,
        height: size - 2,
        fill: 'none',
        'aria-hidden': 'true',
        'pointer-events': 'none',
        'vector-effect': 'non-scaling-stroke',
      }),
    );
  }

  // Accessible label
  g.setAttribute('role', 'button');
  g.setAttribute('tabindex', '0');
  g.setAttribute('aria-label', labelForCell(i));

  gCells.appendChild(g);
});

// initial render (empty)
renderAll();

// --- interactions ----------------------------------------------------------
// Legend selection
legend.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-shape]');
  if (!b) return;
  activeShape = b.dataset.shape;
  setLegendActive(activeShape);
});

// Grid click — two-step place → lock | blank = immediate clear
board.addEventListener('click', (e) => {
  const g = e.target.closest('g.cell');
  if (!g) return;
  const i = +g.dataset.index;
  const state = CELLS[i];

  if (activeShape === 'blank') {
    // micro-reset
    state.shape = 'blank';
    state.locked = false;
    updateCell(i);
    status.textContent = labelForCell(i);
    return;
  }

  if (state.locked) {
    // unlock (keeps shape but becomes tentative/transparent)
    state.locked = false;
    updateCell(i);
    status.textContent = labelForCell(i);
    return;
  }

  if (state.shape === activeShape && state.shape !== 'blank') {
    // second click with same shape → lock
    state.locked = true;
    updateCell(i);
    status.textContent = labelForCell(i);
  } else {
    // set/replace shape (remains tentative)
    state.shape = activeShape;
    state.locked = false;
    updateCell(i);
    status.textContent = labelForCell(i);
  }
});

// Keyboard (Enter/Space)
board.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const g = e.target.closest('g.cell');
  if (!g) return;
  e.preventDefault();
  g.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});

// Randomise only tentative cells
btnRandom.addEventListener('click', () => {
  const unlocked = CELLS.filter((cell) => !cell.locked).length;
  CELLS.forEach((cell, i) => {
    if (cell.locked) return;
    const pick = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    CELLS[i].shape = pick;
    // stays tentative
    updateCell(i);
  });
  status.textContent = `Randomised ${unlocked} unlocked tiles. ${16 - unlocked} locked ${16 - unlocked === 1 ? 'tile' : 'tiles'} preserved.`;
});

// Reset all
btnReset.addEventListener('click', () => {
  CELLS.forEach((c) => {
    c.shape = 'blank';
    c.locked = false;
  });
  renderAll();
  status.textContent = 'Grid reset. All 16 tiles are empty and unlocked.';
});

// --- rendering -------------------------------------------------------------
function renderAll() {
  CELLS.forEach((_, i) => updateCell(i));
}

function updateCell(i) {
  const g = gCells.querySelector(`g.cell[data-index="${i}"]`);
  const wrap = g.querySelector('.shape');
  // wipe
  while (wrap.firstChild) wrap.removeChild(wrap.firstChild);

  const { shape, locked } = CELLS[i];
  if (shape !== 'blank') {
    wrap.appendChild(shapeElement(shape, size));
  }
  g.setAttribute('data-state', locked ? 'locked' : 'tentative');
  g.setAttribute('aria-label', labelForCell(i));
  const action =
    activeShape === 'blank'
      ? 'clear this tile'
      : locked
        ? 'unlock this tile'
        : shape === activeShape
          ? 'lock this tile'
          : `place a ${activeShape} in this tile`;
  g.setAttribute('aria-description', `Activate to ${action}.`);
}

// Draw a full-bleed shape sized to the cell
function shapeElement(kind, S) {
  switch (kind) {
    case 'square':
      return mkSVG('rect', { x: 0, y: 0, width: S, height: S });
    case 'circle':
      return mkSVG('circle', { cx: S / 2, cy: S / 2, r: S / 2 });
    case 'triangle':
      return mkSVG('polygon', { points: `0,${S} ${S},${S} 0,0` });
    default:
      return mkSVG('g', {});
  }
}

// Helpers
function mkSVG(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function setLegendActive(shape) {
  legend.querySelectorAll('button[data-shape]').forEach((b) => {
    const on = b.dataset.shape === shape;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  gCells.querySelectorAll('g.cell').forEach((g) => updateCell(Number(g.dataset.index)));
}

function labelForCell(i) {
  const r = Math.floor(i / 4) + 1,
    c = (i % 4) + 1;
  const s = CELLS[i].shape === 'blank' ? 'empty' : CELLS[i].shape;
  const st = CELLS[i].locked ? 'locked' : 'tentative';
  return `Row ${r}, Column ${c}, ${s}, ${st}`;
}
