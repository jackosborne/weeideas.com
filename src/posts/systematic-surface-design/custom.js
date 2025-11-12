// --- tiny state store ------------------------------------------------------
const CELLS = Array.from({length:16}, () => ({ shape:'blank', locked:false }));
const SHAPES = ['blank','square','circle','triangle'];
const board  = document.getElementById('board');
const gCells = document.getElementById('cells');
const legend = document.getElementById('legend');
const btnRandom = document.getElementById('randomise');
const btnReset  = document.getElementById('reset');

// default tool: square
let activeShape = 'square';
setLegendActive(activeShape);

// --- build the 16 cell groups ---------------------------------------------
// Each cell is a <g> translated to its 25×25 slot.
const size = 25; // cell units in viewBox coords
CELLS.forEach((cell, i) => {
  const r = Math.floor(i / 4), c = i % 4;
  const g = mkSVG('g', { class:'cell', 'data-index': i, 'data-state':'tentative',
                          transform:`translate(${c*size} ${r*size})` });

  // Background (white tile) to guarantee full-bleed base
  const bg = mkSVG('rect', { x:0, y:0, width:size, height:size, fill:'transparent'});
  g.appendChild(bg);

  // A holder group where the shape will live
  const shapeWrap = mkSVG('g', { class:'shape' });
  g.appendChild(shapeWrap);

  // Accessible label
  g.setAttribute('role','button');
  g.setAttribute('tabindex','0');
  g.setAttribute('aria-label', labelForCell(i));

  gCells.appendChild(g);
});

// initial render (empty)
renderAll();

// --- interactions ----------------------------------------------------------
// Legend selection
legend.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-shape]');
  if(!b) return;
  activeShape = b.dataset.shape;
  setLegendActive(activeShape);
});

// Grid click — two-step place → lock | blank = immediate clear
board.addEventListener('click', (e) => {
  const g = e.target.closest('g.cell');
  if(!g) return;
  const i = +g.dataset.index;
  const state = CELLS[i];

  if (activeShape === 'blank') {
    // micro-reset
    state.shape = 'blank';
    state.locked = false;
    updateCell(i);
    return;
  }

  if (state.locked) {
    // unlock (keeps shape but becomes tentative/transparent)
    state.locked = false;
    updateCell(i);
    return;
  }

  if (state.shape === activeShape && state.shape !== 'blank') {
    // second click with same shape → lock
    state.locked = true;
    updateCell(i);
  } else {
    // set/replace shape (remains tentative)
    state.shape = activeShape;
    state.locked = false;
    updateCell(i);
  }
});

// Keyboard (Enter/Space)
board.addEventListener('keydown', (e) => {
  if(e.key !== 'Enter' && e.key !== ' ') return;
  const g = e.target.closest('g.cell');
  if(!g) return;
  e.preventDefault();
  g.dispatchEvent(new MouseEvent('click', {bubbles:true}));
});

// Randomise only tentative cells
btnRandom.addEventListener('click', () => {
  CELLS.forEach((cell, i) => {
    if (cell.locked) return;
    const pick = SHAPES[Math.floor(Math.random()*SHAPES.length)];
    CELLS[i].shape = pick;
    // stays tentative
    updateCell(i);
  });
});

// Reset all
btnReset.addEventListener('click', () => {
  CELLS.forEach(c => { c.shape='blank'; c.locked=false; });
  renderAll();
});

// --- rendering -------------------------------------------------------------
function renderAll(){
  CELLS.forEach((_, i) => updateCell(i));
}

function updateCell(i){
  const g = gCells.querySelector(`g.cell[data-index="${i}"]`);
  const wrap = g.querySelector('.shape');
  // wipe
  while (wrap.firstChild) wrap.removeChild(wrap.firstChild);

  const {shape, locked} = CELLS[i];
  if(shape !== 'blank'){
    wrap.appendChild( shapeElement(shape, size) );
  }
  g.setAttribute('data-state', locked ? 'locked' : 'tentative');
  g.setAttribute('aria-label', labelForCell(i));
}

// Draw a full-bleed shape sized to the cell
function shapeElement(kind, S){
  switch(kind){
    case 'square':  return mkSVG('rect',    {x:0,y:0,width:S,height:S});
    case 'circle':  return mkSVG('circle',  {cx:S/2,cy:S/2,r:S/2});
    case 'triangle':return mkSVG('polygon', {points:`0,${S} ${S},${S} 0,0`});
    default:        return mkSVG('g',{});
  }
}

// Helpers
function mkSVG(tag, attrs){
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for(const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function setLegendActive(shape){
  legend.querySelectorAll('button[data-shape]').forEach(b=>{
    const on = b.dataset.shape === shape;
    b.setAttribute('aria-pressed', on ? 'true':'false');
  });
}

function labelForCell(i){
  const r = Math.floor(i/4)+1, c = (i%4)+1;
  const s = CELLS[i].shape === 'blank' ? 'empty' : CELLS[i].shape;
  const st = CELLS[i].locked ? 'locked' : 'tentative';
  return `Row ${r}, Column ${c}, ${s}, ${st}`;
}