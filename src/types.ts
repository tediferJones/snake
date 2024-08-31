import type { ServerWebSocket } from 'bun';

export type Coordinate<T = number> = {
  row: T,
  col: T,
}

export type Directions = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

export type ClientData = {
  gameCode: string,
  uuid: string,
  color: string,
  state: 'playing' | 'gameover' | 'winner',
  pos: Coordinate[]
  dir: Directions,
}

export type ClientSocket = ServerWebSocket<ClientData>;

export type GameData = {
  boardSize: number,
  players: StrIdxObj<ClientSocket>,
  interval: Timer,
  foodLocations: Coordinate[],
  // gameState: 'lobby' | 'playing' | 'gameover'
}

export type ClientGameData = Omit<GameData, 'interval'> & {
  players: StrIdxObj<ClientData>,
  uuid: string,
}

export type StrIdxObj<T> = { [key: string]: T }
