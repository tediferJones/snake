import type { ServerWebSocket } from 'bun';

export type Coordinate<T = number> = {
  row: T,
  col: T,
}

export type ClientData = {
  gameCode: string,
  uuid: string,
  length: number,
  color: string,
  corners: Coordinate[],
  state: 'playing' | 'gameover',
  pos: Coordinate,
  dir: Coordinate<-1 | 0 | 1>,
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
