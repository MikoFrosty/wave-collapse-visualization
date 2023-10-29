import { TILE_PIXEL_HEIGHT, TILE_PIXEL_WIDTH } from '@/pages/Index';
import tiles from './tiles';
import { Grid } from './types';

export function getRandomWeightedTile() {
  let sum = Object.values(tiles).reduce((a, b) => a + b.weight, 0);
  let r = Math.random() * sum;
  for (let tile in tiles) {
    if (r < tiles[tile].weight) return parseInt(tile); // Changed this line
    r -= tiles[tile].weight;
  }
  return 0; // Default
}

export function handleMouseOver(
  e: MouseEvent,
  gridContainerElement: HTMLElement,
  tooltipElement: HTMLElement,
  grid: Grid,
) {
  const gridRect = gridContainerElement.getBoundingClientRect();
  let relativeX = e.clientX - Math.floor(gridRect.left);
  let relativeY = e.clientY - Math.floor(gridRect.top);
  if (relativeX >= gridRect.width) {
    relativeX = gridRect.width - 1;
  }
  if (relativeY >= gridRect.height) {
    relativeY = gridRect.height - 1;
  }

  const x = Math.floor(relativeX / TILE_PIXEL_WIDTH);
  const y = Math.floor(relativeY / TILE_PIXEL_HEIGHT);

  const cell = grid[y][x];
  tooltipElement.innerText = `${tiles[cell].name}`;

  // Adjusted the tooltip positioning
  const tooltipX = x * TILE_PIXEL_WIDTH + gridRect.left + window.scrollX;
  const tooltipY = y * TILE_PIXEL_HEIGHT + gridRect.top + window.scrollY - 70;

  tooltipElement.style.left = `${tooltipX}px`;
  tooltipElement.style.top = `${tooltipY}px`;
  tooltipElement.style.display = 'block';
}

export function handleMouseOut(tooltipElement: HTMLElement) {
  tooltipElement.style.display = 'none';
}
