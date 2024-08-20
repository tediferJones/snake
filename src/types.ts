import type { ServerWebSocket } from 'bun';

export type ClientData = {
  gameCode: string,
  uuid: string,
  length: number,
  color: string,
  corners: { row: number, col: number }[],
  state: 'playing' | 'gameover',
  pos: {
    row: number,
    col: number,
  },
  dir: {
    row: -1 | 0 | 1,
    col: -1 | 0 | 1,
  },
}

export type ClientSocket = ServerWebSocket<ClientData>;

export type GameData = {
  boardSize: number,
  players: StrIdxObj<ClientSocket>,
  interval: Timer,
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
