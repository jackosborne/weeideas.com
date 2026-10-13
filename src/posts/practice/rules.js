/** Recognise words from visible cells, including reversed and diagonal paths. */
export function findWordPaths(grid, word) {
  const size = grid.length;
  const paths = [];
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const path = [];
          for (let index = 0; index < word.length; index++) {
            const r = row + index * dr;
            const c = column + index * dc;
            const cell = grid[r]?.[c];
            if (!cell?.upright || cell.letter !== word[index]) break;
            path.push(`${r}:${c}`);
          }
          if (path.length === word.length) paths.push(path);
        }
      }
    }
  }
  return paths;
}
