import test from 'node:test';
import assert from 'node:assert/strict';
import { findWordPaths } from '../../src/posts/practice/rules.js';

const blank = () =>
  Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => ({ letter: 'X', upright: true })),
  );
test('Practice recognises visible paths in every direction, independent of generated targets', () => {
  for (const [row, column, dr, dc] of [
    [0, 3, 1, 0],
    [7, 3, -1, 0],
    [4, 0, 0, 1],
    [4, 7, 0, -1],
    [0, 0, 1, 1],
    [0, 7, 1, -1],
    [7, 0, -1, 1],
    [7, 7, -1, -1],
  ]) {
    const grid = blank();
    Array.from('PRACTICE').forEach((letter, index) => {
      grid[row + index * dr][column + index * dc] = { letter, upright: true };
    });
    assert.equal(findWordPaths(grid, 'PRACTICE').length, 1);
    grid[row][column].upright = false;
    assert.equal(findWordPaths(grid, 'PRACTICE').length, 0);
  }
});
test('Practice rejects broken lines and counts simultaneous solutions', () => {
  const grid = blank();
  for (const column of [1, 6])
    Array.from('PRACTICE').forEach((letter, row) => {
      grid[row][column] = { letter, upright: true };
    });
  assert.equal(findWordPaths(grid, 'PRACTICE').length, 2);
  grid[3][1].letter = 'X';
  assert.equal(findWordPaths(grid, 'PRACTICE').length, 1);
});
