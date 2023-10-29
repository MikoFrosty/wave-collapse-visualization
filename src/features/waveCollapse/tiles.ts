import { Tile } from './types';

const tiles: Record<string, Tile> = {
  0: {
    name: 'Grass',
    color: 'green',
    weight: 300,
    affinities: {},
    allowedNeighbors: {
      top: [0, 1, 2, 3, 4, 5, 6, 7],
      bottom: [0, 1, 2, 3, 4, 5, 6, 7],
      left: [0, 1, 2, 3, 4, 5, 6, 7],
      right: [0, 1, 2, 3, 4, 5, 6, 7],
    },
  },
  1: {
    name: 'Water',
    color: 'blue',
    weight: 2,
    affinities: { 1: 20000 },
    allowedNeighbors: {
      top: [0, 1, 3, 6],
      bottom: [0, 1, 3, 6],
      left: [0, 1, 3, 6],
      right: [0, 1, 3, 6],
    },
  },
  2: {
    name: 'Lava',
    color: 'red',
    weight: 0.0001,
    affinities: {},
    allowedNeighbors: {
      top: [2, 4],
      bottom: [2, 4],
      left: [2, 4],
      right: [2, 4],
    },
  },
  3: {
    name: 'Sand',
    color: 'tan',
    weight: 10,
    affinities: { 3: 100, 1: 10, 7: 1.5 },
    allowedNeighbors: {
      top: [0, 1, 3, 6, 7],
      bottom: [0, 1, 3, 6, 7],
      left: [0, 1, 3, 6, 7],
      right: [0, 1, 3, 6, 7],
    },
  },
  4: {
    name: 'Rocky',
    color: 'grey',
    weight: 7,
    affinities: { 4: 20000 },
    allowedNeighbors: {
      top: [0, 4, 5, 6, 7],
      bottom: [0, 4, 5, 6, 7],
      left: [0, 4, 5, 6, 7],
      right: [0, 4, 5, 6, 7],
    },
  },
  5: {
    name: 'Forest',
    color: 'darkgreen',
    weight: 40,
    affinities: { 5: 2000 },
    allowedNeighbors: {
      top: [0, 4, 5, 6],
      bottom: [0, 4, 5, 6],
      left: [0, 4, 5, 6],
      right: [0, 4, 5, 6],
    },
  },
  6: {
    name: 'Settlement',
    color: 'purple',
    weight: 0.0001,
    affinities: { 1: 1 },
    allowedNeighbors: {
      top: [0, 1, 3, 4, 7],
      bottom: [0, 1, 3, 4, 7],
      left: [0, 1, 3, 4, 7],
      right: [0, 1, 3, 4, 7],
    },
  },
  7: {
    name: 'Ocean',
    color: 'teal',
    weight: 40,
    affinities: { 7: 20000 },
    allowedNeighbors: {
      top: [0, 3, 6, 7],
      bottom: [0, 3, 6, 7],
      left: [0, 3, 6, 7],
      right: [0, 3, 6, 7],
    },
  },
};

export default tiles;
