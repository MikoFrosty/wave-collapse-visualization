export type Direction = 'top' | 'bottom' | 'left' | 'right';

export interface Tile {
  name: string;
  color: string;
  weight: number;
  affinities: { [key: number]: number };
  allowedNeighbors: {
    top: number[];
    bottom: number[];
    left: number[];
    right: number[];
  };
}

export interface Tiles {
  [key: number]: Tile;
}

export type Grid = number[][];

export interface Settlement {
  x: number;
  y: number;
}
