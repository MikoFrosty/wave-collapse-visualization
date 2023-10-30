import createGrid from '@/features/waveCollapse/createGrid';
import tiles from '@/features/waveCollapse/tiles';
import { Direction, Grid } from '@/features/waveCollapse/types';
import { handleMouseOut, handleMouseOver } from '@/features/waveCollapse/utils';
import { styled } from '@mui/material';
import React, { useState, useEffect } from 'react';

export const TILE_COUNT_X = 40;
export const TILE_COUNT_Y = 40;
export const TILE_PIXEL_WIDTH = 20;
export const TILE_PIXEL_HEIGHT = 20;

export const MAX_ITERATIONS = 3;
export const OCEAN_CASCADE_BOOST = 100000;
export const MAX_OCEAN_BOOST = 300000;
export const WATER_CASCADE_BOOST = 100;
export const MAX_WATER_BOOST = 1000;
export const OCEAN_TILE = 7;

const GridContainer = styled('div')({
  display: 'grid',
  width: TILE_COUNT_X * TILE_PIXEL_WIDTH + 'px',
  height: TILE_COUNT_Y * TILE_PIXEL_HEIGHT + 'px',
  gridTemplateColumns: `repeat(${TILE_COUNT_X}, ${TILE_PIXEL_WIDTH}px)`,
  gridTemplateRows: `repeat(${TILE_COUNT_Y}, ${TILE_PIXEL_HEIGHT}px)`,
  gap: '0px',
});

const ToolTip = styled('div')({
  position: 'absolute',
  backgroundColor: '#333',
  color: '#fff',
  padding: '10px 15px',
  borderRadius: '5px',
  zIndex: '10',
  display: 'none',
});

const Cell = styled('div')({
  width: TILE_PIXEL_WIDTH + 'px',
  height: TILE_PIXEL_HEIGHT + 'px',
  //border: '1px solid #000',
});

export default function Index() {
  const [grid, setGrid] = useState<Grid>(createGrid());
  const [showTooltip, setShowTooltip] = useState(false);
  const [toolTipPosition, setToolTipPosition] = useState<[number, number]>([0, 0]);

  // Collapse
  useEffect(() => {
    collapse(grid, setGrid);
  }, []);

  // Tooltip
  useEffect(() => {
    const gridContainerElement = document.getElementById('grid-container') as HTMLElement;
    const tooltipElement = document.getElementById('tooltip') as HTMLElement;

    if (!gridContainerElement || !tooltipElement || !grid) {
      return;
    }

    const gridMouseOverFunc = (e: MouseEvent) => handleMouseOver(e, gridContainerElement, tooltipElement, grid);
    const gridMouseOutFunc = () => handleMouseOut(tooltipElement);

    gridContainerElement.addEventListener('mouseover', gridMouseOverFunc);
    gridContainerElement.addEventListener('mouseout', gridMouseOutFunc);

    return () => {
      gridContainerElement.removeEventListener('mouseover', gridMouseOverFunc);
      gridContainerElement.removeEventListener('mouseout', gridMouseOutFunc);
    };
  }, [grid]);

  const handleCellMouseOver = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // Highlight cell
    const cell = e.target as HTMLDivElement;
    cell.style.border = '1px solid #000';

    // This is too slow and laggy
    // setToolTipPosition([e.clientX, e.clientY]);
    // setShowTooltip(true);
  };

  const handleCellMouseOut = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const cell = e.target as HTMLDivElement;
    cell.style.border = 'none';

    // This is too slow and laggy
    // setShowTooltip(false);
  };

  return (
    <>
      <h1>Wave Collapse Function</h1>
      <GridContainer id="grid-container">
        {grid.map((row, y) => {
          return (
            <React.Fragment key={y}>
              {row.map((cell, x) => {
                return (
                  <Cell
                    onMouseOver={handleCellMouseOver}
                    onMouseOut={handleCellMouseOut}
                    key={x}
                    className={`cell cell-${cell}`}
                    sx={{ backgroundColor: tiles[cell].color }}
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </GridContainer>
      <ToolTip id="tooltip" />
    </>
  );
}

function isOnEdge(x: number, y: number) {
  return x === 0 || x === TILE_PIXEL_WIDTH - 1 || y === 0 || y === TILE_COUNT_Y - 1;
}

function getValidTilesFromNeighbors(x: number, y: number, grid: Grid) {
  // Get all possible tiles
  let validTiles = Object.keys(tiles).map(Number);

  // Filtering logic for Ocean tile
  validTiles = validTiles.filter((tile) => {
    if (tile !== 7) return true;
    return isOnEdge(x, y) || [grid[y][x - 1], grid[y][x + 1], grid[y - 1]?.[x], grid[y + 1]?.[x]].includes(7);
  });

  const neighbors = {
    bottom: y < TILE_COUNT_Y - 1 ? grid[y + 1][x] : null,
    right: x < TILE_COUNT_X - 1 ? grid[y][x + 1] : null,
  };

  for (const [direction, tile] of Object.entries(neighbors)) {
    if (tile !== null) {
      validTiles = validTiles.filter((t) =>
        tiles[t.toString()].allowedNeighbors[direction as Direction].includes(tile),
      );
    }
  }

  return validTiles;
}

function getWeightedRandomTile(
  validTiles: number[],
  adjacentTiles: number[],
  currentTile: number,
  grid: Grid,
  x: number,
  y: number,
) {
  if (!adjacentTiles.length) return validTiles[Math.floor(Math.random() * validTiles.length)];
  const affinityBoost = tiles[currentTile].affinities?.[adjacentTiles[0]] || 0; // TODO: adjacent tiles

  let cascadeBoost = 0;
  // if (adjacentTile === 7) {
  //   cascadeBoost = getCascadeBoost(x, y, grid, 7, MAX_OCEAN_BOOST, OCEAN_CASCADE_BOOST);
  // } else if (adjacentTile === 1) {
  //   cascadeBoost = getCascadeBoost(x, y, grid, 1, MAX_WATER_BOOST, WATER_CASCADE_BOOST);
  // }

  const weightedArray: number[] = [];
  validTiles.forEach((tile) => {
    let weight = tiles[tile].weight;
    if (tile === adjacentTiles[0]) { // TODO: adjacent tiles
      weight += affinityBoost + cascadeBoost;
    }
    for (let i = 0; i < weight; i++) {
      weightedArray.push(tile);
    }
  });

  const weightedResult = weightedArray[Math.floor(Math.random() * weightedArray.length)];
  return weightedResult;
}

type OrientationDirection = 'north' | 'east' | 'south' | 'west';

interface Orientation {
  north: 'north';
  east: 'east';
  south: 'south';
  west: 'west';
  orderedValues: OrientationDirection[];
  turnRight(fromOrientation: OrientationDirection): OrientationDirection;
  turnLeft(fromOrientation: OrientationDirection): OrientationDirection;
  oneStepOffset(inOrientation: OrientationDirection): [number, number];
}

const OrientationValues: Orientation = {
  north: 'north',
  east: 'east',
  south: 'south',
  west: 'west',
  orderedValues: ['north', 'east', 'south', 'west'],

  turnRight(fromOrientation: OrientationDirection) {
    return this.orderedValues[(this.orderedValues.indexOf(fromOrientation) + 1) % 4];
  },

  turnLeft(fromOrientation: OrientationDirection) {
    return this.orderedValues[(this.orderedValues.indexOf(fromOrientation) + 3) % 4];
  },

  oneStepOffset(inOrientation: OrientationDirection): [number, number] {
    switch (inOrientation) {
      case this.north:
        return [0, -1];
      case this.east:
        return [1, 0];
      case this.south:
        return [0, 1];
      case this.west:
        return [-1, 0];
      default:
        throw new Error('Invalid orientation direction');
    }
  },
};

const Direction = {
  straight: 'straight',
  right: 'right',
  left: 'left',
};

function spiral(n: number, initialOrientation = OrientationValues.east, turningDirection = Direction.right) {
  if (turningDirection === Direction.straight) {
    throw new Error('The spiral must turn left or right');
  }
  if (n < 0) {
    throw new Error('The spiral only takes a positive integer as the number of steps');
  }

  class Step {
    position: number[];
    orientation: OrientationDirection;

    constructor(position: any[], orientation: OrientationDirection) {
      this.position = position;
      this.orientation = orientation;
    }
  }

  function nextPosition(lastStep: Step, direction: (typeof Direction)[keyof typeof Direction]) {
    let newOrientation: OrientationDirection;
    switch (direction) {
      case Direction.straight:
        newOrientation = lastStep.orientation;
        break;
      case Direction.right:
        newOrientation = OrientationValues.turnRight(lastStep.orientation);
        break;
      case Direction.left:
        newOrientation = OrientationValues.turnLeft(lastStep.orientation);
        break;
      default:
        throw new Error('Invalid direction');
    }

    const offset = OrientationValues.oneStepOffset(newOrientation);
    return [lastStep.position[0] + offset[0], lastStep.position[1] + offset[1]];
  }

  function takeStep(lastStep: Step, occupiedPositions: number[][]) {
    const positionAfterTurning = nextPosition(lastStep, turningDirection);
    let newOrientation: OrientationDirection;
    if (occupiedPositions.some((pos) => pos[0] === positionAfterTurning[0] && pos[1] === positionAfterTurning[1])) {
      return new Step(nextPosition(lastStep, Direction.straight), lastStep.orientation);
    } else {
      switch (turningDirection) {
        case Direction.left:
          newOrientation = OrientationValues.turnLeft(lastStep.orientation);
          break;
        case Direction.right:
          newOrientation = OrientationValues.turnRight(lastStep.orientation);
          break;
        default:
          throw new Error('Invalid direction');
      }
      return new Step(positionAfterTurning, newOrientation);
    }
  }

  const centerX = Math.floor(TILE_COUNT_X / 2) - 1;
  const centerY = Math.floor(TILE_COUNT_Y / 2) - 1;

  function calculateSpiral(upTo: number): Step[] {
    if (upTo === 0) return [new Step([centerX, centerY], initialOrientation)];
    if (upTo === 1)
      return [
        new Step(
          [
            centerX + OrientationValues.oneStepOffset(initialOrientation)[0],
            centerY + OrientationValues.oneStepOffset(initialOrientation)[1],
          ],
          initialOrientation,
        ),
        new Step([centerX, centerY], initialOrientation),
      ];

    const spiralUntilNow = calculateSpiral(upTo - 1);
    const nextStep = takeStep(
      spiralUntilNow[0],
      spiralUntilNow.map((step) => step.position),
    );
    return [nextStep, ...spiralUntilNow];
  }

  return calculateSpiral(n)
    .map((step) => {
      return { x: step.position[0], y: step.position[1] }; // Return as objects
    })
    .reverse();
}

function getSpiralCoordinates(width: number, height: number) {
  const totalCells = width * height;
  const rawCoordinates = spiral(totalCells);

  // Make sure we only return the coordinates that are within our grid's dimensions
  return rawCoordinates.filter((coord) => coord.x >= 0 && coord.y >= 0 && coord.x < width && coord.y < height);
}

// Check if a tile is adjacent to an ocean tile
const isAdjacentToOcean = (x: number, y: number, grid: Grid) => {
  const directions = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];
  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length && grid[ny][nx] === OCEAN_TILE) {
      return true;
    }
  }
  return false;
};

async function collapse(grid: Grid, setGrid: React.Dispatch<React.SetStateAction<Grid>>) {
  // Function logic that remains the same for all iterations
  const collapsingLogic = (x: number, y: number, grid: Grid) => {
    // TODO: const allSettlements = getAllSettlements(grid);
    const currentTile = grid[y][x];
    // if (currentTile !== 0) return; // WHY IS THIS HERE??
    if (tiles[currentTile].name === 'Water' && currentTile !== OCEAN_TILE && isAdjacentToOcean(x, y, grid)) {
      console.log('Water tile is adjacent to ocean tile');
      grid[y][x] = OCEAN_TILE;
      return;
    }

    let validTiles = getValidTilesFromNeighbors(x, y, grid);
    //console.log('validTiles', validTiles)

    const adjacentTiles = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]
      .map(([dx, dy]) => grid[y + dy]?.[x + dx])
      .filter((tile) => tile !== undefined);

    //adjancentTiles.sort((a, b) => (a === null ? 1 : b === null ? -1 : 0));

    // Determine adjacent tile for affinity
    //const adjacentTile = x > 0 ? grid[y][x - 1] : null; // ! I think this is wrong

    // check affinities in all directions
    // if (adjacentTile !== null) {
    //   const directions = [
    //     [0, 1],
    //     [1, 0],
    //     [0, -1],
    //     [-1, 0],
    //   ];
    //   for (const [dx, dy] of directions) {
    //     const nx = x + dx;
    //     const ny = y + dy;
    //     if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length && grid[ny][nx] === adjacentTile) {
    //       validTiles = validTiles.filter((tile) => tiles[tile].affinities?.[adjacentTile] !== undefined);
    //     }
    //   }
    // }

    if (validTiles.length > 0) {
      //   if (validTiles.includes(6) && !isValidSettlementPosition(x, y, grid, 6, allSettlements)) {
      //     validTiles = validTiles.filter((tile) => tile !== 6);
      //   }

      grid[y][x] = getWeightedRandomTile(validTiles, adjacentTiles, currentTile, grid, x, y);
    } else {
      grid[y][x] = Math.floor(Math.random() * Object.keys(tiles).length);
    }
  };

  //1. Original Row-Wise Iteration
  // for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
  //   for (let y = 0; y < grid.length; y++) {
  //     for (let x = 0; x < grid[0].length; x++) {
  //       collapsingLogic(x, y, grid);
  //     }
  //   }
  // }

  function delay() {
    return new Promise((resolve) => requestAnimationFrame(resolve));
  }

  //2. Spiral-Wise Iteration
  const spiralCoordinates = getSpiralCoordinates(grid.length, grid[0].length);

  let counter = 0;
  async function executeCollapsingLogic() {
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      for (let index = 0; index < spiralCoordinates.length; index++) {
        counter++;
        const { x, y } = spiralCoordinates[index];

        // Apply the collapsing logic
        let newGrid = [...grid];
        collapsingLogic(x, y, newGrid);

        // Clear previous tiles only
        // const tiles = gridContainer.querySelectorAll('div:not(.tooltip-class)'); // Assuming you add a tooltip-class to the tooltip
        // tiles.forEach((tile) => tile.remove());

        // Render the current grid state
        setGrid(newGrid);

        // Introduce a delay
        if (counter % 20 === 0) {
          await delay();
        }
      }
    }
  }

  executeCollapsingLogic();

  //3. Column-Wise Iteration
  // for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
  //   for (let x = 0; x < grid[0].length; x++) {
  //     for (let y = 0; y < grid.length; y++) {
  //       collapsingLogic(x, y, grid);
  //     }
  //   }
  // }
}
