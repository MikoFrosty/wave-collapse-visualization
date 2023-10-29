import { TILE_COUNT_X, TILE_COUNT_Y } from '@/pages/Index';
import tiles from './tiles';
import { Grid, Settlement, Tile, Direction } from './types';
import createGrid from './createGrid';

export default async function waveCollapse() {
  function manhattanDistance(x1: number, y1: number, x2: number, y2: number) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  function isOnEdge(x: number, y: number) {
    return x === 0 || x === width - 1 || y === 0 || y === height - 1;
  }

  function getAllSettlements(grid: Grid) {
    let settlements = [];
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        if (grid[y][x] === 6) {
          // 6 is the ID for Settlement
          settlements.push({ x, y });
        }
      }
    }
    return settlements;
  }

  const SETTLEMENT_MIN_DISTANCE = 15; // Define this as per your requirements

  function isValidSettlementPosition(x: number, y: number, grid: Grid, tile: number, allSettlements: Settlement[]) {
    if (
      allSettlements.some((settlement) => manhattanDistance(x, y, settlement.x, settlement.y) < SETTLEMENT_MIN_DISTANCE)
    ) {
      return false;
    }

    const dx = [-1, 0, 1, 0, -1, -1, 1, 1];
    const dy = [0, -1, 0, 1, -1, 1, -1, 1];

    return !dx.some((offsetX, i) => {
      const nx = x + offsetX;
      const ny = y + dy[i];

      return nx >= 0 && ny >= 0 && nx < grid[0].length && ny < grid.length && grid[ny][nx] === tile;
    });
  }

  const width = TILE_COUNT_X;
  const height = TILE_COUNT_Y;

  function getValidTilesFromNeighbors(x: number, y: number, grid: Grid, height: number, width: number) {
    // Get all possible tiles
    let validTiles = Object.keys(tiles).map(Number);

    // Filtering logic for Ocean tile
    validTiles = validTiles.filter((tile) => {
      if (tile !== 7) return true;
      return isOnEdge(x, y) || [grid[y][x - 1], grid[y][x + 1], grid[y - 1]?.[x], grid[y + 1]?.[x]].includes(7);
    });

    const neighbors = {
      bottom: y < height - 1 ? grid[y + 1][x] : null,
      right: x < width - 1 ? grid[y][x + 1] : null,
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

  // Gets the cascade boost for a given tile type.
  function getCascadeBoost(
    x: number,
    y: number,
    grid: Grid,
    targetTile: number,
    MAX_BOOST: number,
    BOOST_AMOUNT: number,
  ) {
    let boost = 0;
    const dx = [-1, 0, 1, 0];
    const dy = [0, -1, 0, 1];
    for (let i = 0; i < dx.length; i++) {
      const nx = x + dx[i];
      const ny = y + dy[i];
      if (nx >= 0 && ny >= 0 && nx < grid[0].length && ny < grid.length && grid[ny][nx] === targetTile) {
        boost += BOOST_AMOUNT;
        if (boost > MAX_BOOST) {
          boost = MAX_BOOST;
          break;
        }
      }
    }
    return boost;
  }

  function getWeightedRandomTile(
    validTiles: number[],
    adjacentTile: number | null,
    currentTile: number,
    grid: Grid,
    x: number,
    y: number,
  ) {
    if (!adjacentTile) return validTiles[Math.floor(Math.random() * validTiles.length)];
    const affinityBoost = tiles[currentTile].affinities?.[adjacentTile] || 0;

    let cascadeBoost = 0;
    if (adjacentTile === 7) {
      cascadeBoost = getCascadeBoost(x, y, grid, 7, MAX_OCEAN_BOOST, OCEAN_CASCADE_BOOST);
    } else if (adjacentTile === 1) {
      cascadeBoost = getCascadeBoost(x, y, grid, 1, MAX_WATER_BOOST, WATER_CASCADE_BOOST);
    }

    const weightedArray: number[] = [];
    validTiles.forEach((tile) => {
      let weight = tiles[tile].weight;
      if (tile === adjacentTile) {
        weight += affinityBoost + cascadeBoost;
      }
      for (let i = 0; i < weight; i++) {
        weightedArray.push(tile);
      }
    });

    const weightedResult = weightedArray[Math.floor(Math.random() * weightedArray.length)];
    return weightedResult;
  }

  function getAverageAdjacentTile(x: number, y: number, grid: Grid) {
    const dx = [-1, 0, 1, 0, -1, 1, -1, 1];
    const dy = [0, -1, 0, 1, -1, -1, 1, 1];
    let sum = 0;
    let count = 0;

    for (let i = 0; i < dx.length; i++) {
      const nx = x + dx[i];
      const ny = y + dy[i];
      if (nx >= 0 && ny >= 0 && nx < grid[0].length && ny < grid.length) {
        sum += grid[ny][nx];
        count++;
      }
    }

    return count > 0 ? sum / count : null;
  }

  function getPriorityAdjacentTile(x: number, y: number, grid: Grid) {
    // Try to get the left tile, then top, then right, then bottom
    const dx = [-1, 0, 1, 0];
    const dy = [0, -1, 0, 1];

    for (let i = 0; i < dx.length; i++) {
      const nx = x + dx[i];
      const ny = y + dy[i];
      if (
        nx >= 0 &&
        ny >= 0 &&
        nx < grid[0].length &&
        ny < grid.length &&
        grid[ny][nx] !== 0 // Exclude '0', or whatever you use for uninitialized tiles
      ) {
        return grid[ny][nx];
      }
    }
    return null;
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

    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

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

  const OCEAN_TILE = 7; // Assuming 7 is the ocean tile based on your previous examples

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

  async function collapse(grid: Grid) {
    // Function logic that remains the same for all iterations
    const collapsingLogic = (x: number, y: number, grid: Grid) => {
      const allSettlements = getAllSettlements(grid);
      const currentTile = grid[y][x];
      // if (currentTile !== 0) return; // WHY IS THIS HERE??
      if (tiles[currentTile].name === 'Water' && currentTile !== OCEAN_TILE && isAdjacentToOcean(x, y, grid)) {
        grid[y][x] = OCEAN_TILE;
        return;
      }

      let validTiles = getValidTilesFromNeighbors(x, y, grid, grid.length, grid[0].length);

      // Determine adjacent tile for affinity
      const adjacentTile = x > 0 ? grid[y][x - 1] : null;

      if (validTiles.length > 0) {
        if (validTiles.includes(6) && !isValidSettlementPosition(x, y, grid, 6, allSettlements)) {
          validTiles = validTiles.filter((tile) => tile !== 6);
        }

        grid[y][x] = getWeightedRandomTile(validTiles, adjacentTile, currentTile, grid, x, y);
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

    function delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    //2. Spiral-Wise Iteration
    const spiralCoordinates = getSpiralCoordinates(grid.length, grid[0].length);

    async function executeCollapsingLogic() {
      for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        for (let index = 0; index < spiralCoordinates.length; index++) {
          const { x, y } = spiralCoordinates[index];
          console.log('logic happening');

          // Apply the collapsing logic
          collapsingLogic(x, y, grid);

          // Clear previous tiles only
          const tiles = gridContainer.querySelectorAll('div:not(.tooltip-class)'); // Assuming you add a tooltip-class to the tooltip
          tiles.forEach((tile) => tile.remove());

          // Render the current grid state
          renderGrid(grid);

          // Introduce a delay
          await delay(0);
        }
      }
    }

    await executeCollapsingLogic();

    //3. Column-Wise Iteration
    // for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    //   for (let x = 0; x < grid[0].length; x++) {
    //     for (let y = 0; y < grid.length; y++) {
    //       collapsingLogic(x, y, grid);
    //     }
    //   }
    // }
  }

  function correctLandlockedOceans(grid: Grid) {
    for (let y = 1; y < grid.length - 1; y++) {
      for (let x = 1; x < grid[0].length - 1; x++) {
        if (grid[y][x] === 7) {
          // Ocean tile
          const neighbors = [
            grid[y - 1][x],
            grid[y + 1][x],
            grid[y][x - 1],
            grid[y][x + 1],
            grid[y - 1][x - 1], // top-left
            grid[y - 1][x + 1], // top-right
            grid[y + 1][x - 1], // bottom-left
            grid[y + 1][x + 1], // bottom-right
          ];

          if (neighbors.filter((tile) => tile !== 7).length > 3) {
            // All neighbors are not Ocean
            grid[y][x] = 0; // Change to Grass for simplicity; adapt as needed
          }
        }
      }
    }
  }

  //await collapse(grid);
  //   await correctLandlockedOceans(grid);
  //   await renderGrid(grid);
}
