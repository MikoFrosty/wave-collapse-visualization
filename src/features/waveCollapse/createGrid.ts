import { TILE_COUNT_X, TILE_COUNT_Y } from '@/pages/Index';
import { getRandomWeightedTile } from './utils';
import { Grid } from './types';

export default function createGrid(): Grid {
  function fuzzyEdge(grid: Grid, y: number, x: number, threshold: number) {
    return Math.random() < threshold ? 7 : grid[y][x];
  }

  const grid = Array.from({ length: TILE_COUNT_Y }, () =>
    Array.from({ length: TILE_COUNT_X }, () => {
      let randomTile = getRandomWeightedTile();
      return randomTile;
    }),
  );

  // Fill all edges with guaranteed ocean and the 3rd row and column with fuzzy ocean
  for (let y = 0; y < TILE_COUNT_Y; y++) {
    for (let x = 0; x < TILE_COUNT_X; x++) {
      if (y < 2 || y > TILE_COUNT_Y - 3 || x < 2 || x > TILE_COUNT_X - 3) {
        grid[y][x] = 7;
      } else if (y === 2 || y === TILE_COUNT_Y - 3 || x === 2 || x === TILE_COUNT_X - 3) {
        grid[y][x] = fuzzyEdge(grid, y, x, 0.8);
      }
    }
  }

  return grid;
}
