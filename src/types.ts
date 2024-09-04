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
  state: 'notReady' | 'ready' | 'playing' | 'gameover' | 'winner',
  pos: Coordinate[]
  dir: Directions,
  username: string,
}

export type ClientSocket = ServerWebSocket<ClientData>;

export type GameData = {
  boardSize: number,
  players: StrIdxObj<ClientSocket>,
  interval: Timer,
  foodLocations: Coordinate[],
  gameState: 'lobby' | 'running' | 'done'
}

export type ClientGameData = Omit<GameData, 'interval' | 'players'> & {
  players: StrIdxObj<ClientData>,
  uuid: string,
}

export type StrIdxObj<T> = { [key: string]: T }

export type Actions = 'changeDir' | 'toggleReady'

export type ClientMsg<T extends Actions = Actions> = {
  action: Actions,
} & MsgTypes[T]

type MsgTypes = {
  changeDir: {
    dir: Directions
  },
  toggleReady: {},
}
