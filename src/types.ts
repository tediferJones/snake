import type { ServerWebSocket } from 'bun';

export type Coordinate<T = number> = {
  row: T,
  col: T,
}

export type Directions = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

// export type Corner = Coordinate & { dir: any }

export type ClientData = {
  gameCode: string,
  uuid: string,
  // length: number,
  color: string,
  // corners: Corner[],
  state: 'playing' | 'gameover' | 'winner',
  pos: Coordinate[]
  // pos: Coordinate,
  // head: Coordinate,
  // tail: Coordinate,
  // dir: Coordinate<-1 | 0 | 1>,
  dir: Directions,
}

export type ClientSocket = ServerWebSocket<ClientData>;

export type GameData = {
  boardSize: number,
  players: StrIdxObj<ClientSocket>,
  interval: Timer,
  foodLocations: Coordinate[]
}

// export type ClientGameData = {
//   boardSize: number,
//   players: StrIdxObj<ClientData>,
// }

export type ClientGameData = Omit<GameData, 'interval'> & {
  players: StrIdxObj<ClientData>,
  uuid: string,
}

export type StrIdxObj<T> = { [key: string]: T }
