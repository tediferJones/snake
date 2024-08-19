import type { ServerWebSocket } from 'bun';

export type ClientData = {
  gameCode: string,
  uuid: string,
  length: number,
  row: number,
  col: number,
}

export type ClientSocket = ServerWebSocket<ClientData>;

export type GameData = {
  boardSize: number,
  players: StrIdxObj<ClientSocket>
}

export type StrIdxObj<T> = { [key: string]: T }
