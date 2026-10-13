import { findWordPaths } from './rules.js';
import { createProjectControls } from '/_/js/lib/controls.js';
import { createArtworkLifecycle } from '/_/js/lib/lifecycle.js';

const canvas = document.getElementById('art');
const context = canvas.getContext('2d');
const word = 'PRACTICE';
const size = 1200;
const inset = size * 0.12;
const cell = (size - inset * 2) / word.length;
const rowKeys = Array.from(word, (_, index) => `Row ${index + 1}`);
canvas.width = canvas.height = size;

function rowShift(value) {
  const shift = value / 12;
  const nearest = Math.round(shift);
  return Math.abs(value - nearest * 12) <= 2 ? nearest : shift;
}

function makeAttempt() {
  const path = Math.floor(Math.random() * 3);
  const column = Math.floor(Math.random() * 8);
  const targets = Array.from(word, () => (1 + Math.floor(Math.random() * 7)) * 12);
  const puzzle = {
    path,
    columns: Array.from(word, (_, row) => {
      const destination = path === 0 ? column : path === 1 ? row : 7 - row;
      return (destination - targets[row] / 12 + 8) % 8;
    }),
    targets,
    letters: Array.from({ length: 64 }, () => word[Math.floor(Math.random() * 8)]),
    speeds: Array.from(
      { length: 64 },
      () => (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 5),
    ),
    angles: Array.from({ length: 64 }, () => 35 + Math.random() * 290),
  };
  puzzle.decoys = {};
  for (const row of [0, 1, 2, 7]) {
    const endpoint = word[row];
    const otherLetters = word.replaceAll(endpoint, '');
    for (let column = 0; column < 8; column++) {
      puzzle.letters[row * 8 + column] =
        otherLetters[Math.floor(Math.random() * otherLetters.length)];
    }
    const columns = Array.from({ length: 8 }, (_, column) => column).filter(
      (column) => column !== puzzle.columns[row],
    );
    const settings = Array.from({ length: 7 }, (_, index) => (index + 1) * 12).filter(
      (value) => value !== targets[row],
    );
    for (let decoy = 0; decoy < (row === 0 || row === 7 ? 2 : 1); decoy++) {
      const column = columns.splice(Math.floor(Math.random() * columns.length), 1)[0];
      const setting = settings.splice(Math.floor(Math.random() * settings.length), 1)[0];
      const index = row * 8 + column;
      puzzle.letters[index] = endpoint;
      puzzle.decoys[index] = setting;
    }
  }
  return puzzle;
}

let attempt = makeAttempt();
let values = Object.fromEntries(rowKeys.map((key) => [key, 0]));
let hasSolved = false;
let hintRevealed = false;

function visibleCell(row, column, value = values[rowKeys[row]]) {
  const shift = rowShift(value);
  const sourceColumn = (((column - Math.floor(shift)) % 8) + 8) % 8;
  const index = row * 8 + sourceColumn;
  const target = sourceColumn === attempt.columns[row];
  const setting = target ? attempt.targets[row] : attempt.decoys[index];
  const difference = value - attempt.targets[row];
  const degrees =
    setting === undefined
      ? attempt.angles[index] + difference * attempt.speeds[index]
      : Math.abs(value - setting) <= 2
        ? 0
        : (value - setting) * 1.8;
  const angle = Math.abs((((degrees % 360) + 540) % 360) - 180);
  return {
    letter: target ? word[row] : attempt.letters[index],
    degrees,
    upright: Number.isInteger(shift) && angle <= 3.6,
  };
}

function syncHint() {
  const button = document.querySelector('[data-action-path="hint"]');
  if (!button) return;
  const label = hintRevealed
    ? ['↓ Read down', '↘ Down and right', '↙ Down and left'][attempt.path]
    : 'Hint';
  button.setAttribute('aria-live', 'polite');
  if (button.textContent !== label) button.textContent = label;
}

function render() {
  const grid = Array.from({ length: 8 }, (_, row) =>
    Array.from({ length: 8 }, (_, column) => visibleCell(row, column)),
  );
  const paths = findWordPaths(grid, word);
  const highlights = new Set(paths.flat());
  const complete = paths.length > 0;
  syncHint();
  if (complete) hasSolved = true;
  kit.setActionBusy('again', !hasSolved);
  canvas.setAttribute(
    'aria-label',
    `An eight by eight letter grid. Find an upright PRACTICE in a straight line. ${complete ? 'Perfect. PRACTICE is complete.' : 'Slide and rotate each row using its slider.'}`,
  );
  context.fillStyle = '#fff';
  context.fillRect(0, 0, size, size);
  context.font = `600 ${cell * 0.65}px "Helvetica Neue", Arial, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  for (let row = 0; row < 8; row++) {
    const shift = rowShift(values[rowKeys[row]]);
    const wholeShift = Math.floor(shift);
    const fraction = shift - wholeShift;
    context.save();
    context.beginPath();
    context.rect(inset + 1, inset + row * cell + 1, cell * 8 - 2, cell - 2);
    context.clip();
    for (let column = -1; column < 8; column++) {
      const { letter, degrees } = visibleCell(row, column);
      context.save();
      context.translate(inset + (column + fraction + 0.5) * cell, inset + (row + 0.5) * cell);
      if (highlights.has(`${row}:${column}`)) {
        context.fillStyle = '#dce5cb';
        context.fillRect(-cell / 2 + 2, -cell / 2 + 2, cell - 4, cell - 4);
      }
      context.rotate((degrees * Math.PI) / 180);
      context.fillStyle = '#282b25';
      context.fillText(letter, 0, cell * 0.03);
      context.restore();
    }
    context.restore();
  }
}

const kit = createProjectControls(
  'Practice',
  {
    ...Object.fromEntries(rowKeys.map((key) => [key, [0, 0, 100, 1]])),
    hint: { type: 'action', label: 'Hint' },
    reset: { type: 'action', label: 'Reset' },
    again: { type: 'action', label: 'Again' },
  },
  {
    primaryAction: 'again',
    valueText: Object.fromEntries(
      rowKeys.map((key, row) => [
        key,
        (value) => {
          const candidates = Array.from({ length: 8 }, (_, column) => ({
            ...visibleCell(row, column, value),
            column: column + 1,
          })).filter((cell) => cell.upright);
          return `${value}, ${candidates.length ? `upright letters ${candidates.map((cell) => `${cell.letter} in column ${cell.column}`).join(', ')}` : 'letters tilted or between squares'}`;
        },
      ]),
    ),
    onAction: (action) => {
      if (action === 'hint') {
        hintRevealed = true;
        render();
      }
      if (action === 'again') {
        if (!hasSolved) return;
        attempt = makeAttempt();
        hasSolved = false;
        hintRevealed = false;
      }
      if (action === 'reset' || action === 'again') {
        values = Object.fromEntries(rowKeys.map((key) => [key, 0]));
        kit.setValues(values);
        render();
      }
    },
  },
);
kit.subscribe((next) => {
  values = next;
  render();
});

// Dialkit may rebuild its buttons while slider values change.
const lifecycle = createArtworkLifecycle();
const actionObserver = new MutationObserver(() => {
  kit.setActionBusy('again', !hasSolved);
  syncHint();
});
actionObserver.observe(document.getElementById('project-dials'), {
  childList: true,
  subtree: true,
});
lifecycle.cleanup(() => actionObserver.disconnect());
kit.setActionBusy('again', !hasSolved);
