import type {
    ClientData,
  Coordinate,
  Directions,
  GameData,
  StrIdxObj
} from '@/types';
import type { ServerWebSocket } from 'bun';

export default class GamesManager {
  allGames: StrIdxObj<GameData>
  movements: { [key in Directions]: Coordinate<1 | 0 | -1> }
  defaultTickRate: number;
  defaultBoardSize: number;

  constructor() {
    this.allGames = {};
    this.movements = {
      'ArrowUp':    { row: -1, col: 0 },
      'ArrowDown':  { row: 1, col: 0 },
      'ArrowLeft':  { row: 0, col: -1 },
      'ArrowRight': { row: 0, col: 1 },
    }
    this.defaultTickRate = 500;
    this.defaultBoardSize = 6;
  }

  joinGame(ws: ServerWebSocket<ClientData>) {
    const game = this.allGames[ws.data.gameCode];
    let uuid = crypto.randomUUID();
    if (game) {
      while (game.players[uuid]) uuid = crypto.randomUUID()
      game.players[uuid] = ws
      game.foodLocations = game.foodLocations.concat(this.getOpenPositions(ws.data.gameCode, 1))
      game.boardSize = Math.floor(Math.sqrt((game.boardSize ** 2) + 100))
    } else {
      this.allGames[ws.data.gameCode] = {
        boardSize: this.defaultBoardSize,
        players: {
          [uuid]: ws
        },
        interval: setInterval(this.refreshGameState(ws.data.gameCode), this.defaultTickRate),
        foodLocations: []
      }
      this.allGames[ws.data.gameCode].foodLocations = this.getOpenPositions(ws.data.gameCode, 1);
    }
    ws.data.uuid = uuid;
    ws.data.state = 'playing';
    ws.data.pos = this.getOpenPositions(ws.data.gameCode, 1)
    ws.data.dir = this.getRandomDir();
    ws.send(JSON.stringify({ ...this.getClientMsg(ws.data.gameCode), uuid }));
    // console.log('OPENED', this.allGames)
  }

  leaveGame(ws: ServerWebSocket<ClientData>) {
    const gameInfo = this.allGames[ws.data.gameCode];
    delete gameInfo.players[ws.data.uuid];
    gameInfo.foodLocations.shift();
    if (Object.keys(gameInfo.players).length === 0) {
      clearInterval(gameInfo.interval)
      delete this.allGames[ws.data.gameCode]
    }
    // console.log('CLOSED', this.allGames)
  }

  changeDir(ws: ServerWebSocket<ClientData>, msg: string | Buffer) {
    // console.log('this is a new msg from', ws.data.uuid, msg)
    const newDir = msg.toString();
    if (Object.keys(this.movements).includes(newDir)) {
      ws.data.dir = newDir as Directions;
    }
  }

  getRandomDir() {
    const dirs = Object.keys(this.movements) as Directions[];
    return dirs[Math.floor(Math.random() * dirs.length)];
  }

  getOpenPositions(gameCode: string, count: number) {
    const gameInfo = this.allGames[gameCode];
    if (!gameInfo) return []

    const usedPositions = Object.values(gameInfo.players)
    .flatMap(player => player.data.pos || [])
    .concat(gameInfo.foodLocations || []);

    // Get all open positions by generating every possible position, and remove those that exist in usedPositions
    const openPositions = [...Array(gameInfo.boardSize).keys()].flatMap(row => 
      [...Array(gameInfo.boardSize).keys()].map(col => ({ row, col }))
    ).filter(available => !usedPositions.some(used =>
      available.row === used.row && available.col === used.col
    ));

    // Randomly select a certain number of positons from openPositions array
    // and make sure the same position doesnt get selected twice
    return [...Array(count).keys()].map(() => {
      const randomIndex = Math.floor(Math.random() * openPositions.length)
      const randomPosition = openPositions[randomIndex]
      openPositions.splice(randomIndex, 1)
      return randomPosition
    }).filter(coor => coor);
  }

  getClientMsg(gameCode: string) {
    const newPlayers: StrIdxObj<ClientData> = {}
    Object.keys(this.allGames[gameCode].players).forEach(uuid => {
      newPlayers[uuid] = this.allGames[gameCode].players[uuid].data
    })

    return {
      ...this.allGames[gameCode],
      players: newPlayers,
      interval: undefined,
    }
  }

  refreshGameState(gameCode: string) {
    return () => {
      const gameInfo = this.allGames[gameCode]
      if (!gameInfo) return

      // Move each character once, and detect out of bounds
      Object.values(gameInfo.players).forEach(player => {
        if (player.data.state !== 'playing') return

        const { pos, dir } = player.data;
        const newRow = pos[0].row + this.movements[dir].row;
        const newCol = pos[0].col + this.movements[dir].col;
        const usedPositions = Object.values(gameInfo.players)
        .flatMap(player => player.data.state === 'playing' ? player.data.pos : [])

        if (
          // Check if player is out of bounds
          0 > newRow || newRow > gameInfo.boardSize - 1 ||
            0 > newCol || newCol > gameInfo.boardSize - 1 ||
            // Check if newPos intersects with any player's existing pos
            usedPositions.find(pos => pos.row === newRow && pos.col === newCol)
        ) {
          player.data.state = 'gameover';
          gameInfo.foodLocations.shift();
          return
        }

        // Add new pos to head of player pos
        player.data.pos.unshift({ row: newRow, col: newCol });

        // If new position is on food, remove that food location and DONT pop the player's tail position
        // This will result the in the players length growing (we add to the head and dont remove from the tail)
        const foundFood = gameInfo.foodLocations.findIndex(coor => coor.row === newRow && coor.col === newCol);
        if (foundFood !== -1) {
          gameInfo.foodLocations.splice(foundFood, 1)
        } else {
          player.data.pos.pop();
        }
      });

      // Check active player count and current food count, and add more food if needed
      // and make sure food does not spawn in a position that is alread occupied by a player or food
      const activePlayerCount = Object.values(gameInfo.players).filter(player => player.data.state === 'playing').length 
      const newFoodCount = activePlayerCount - gameInfo.foodLocations.length;

      if (newFoodCount > 0) {
        const availablePositions = this.getOpenPositions(gameCode, newFoodCount);
        // If there are no available positions, game is over and all players remaining are winners
        if (availablePositions.length === 0) {
          return Object.values(gameInfo.players)
            .forEach(player => player.data.state = 'winner')
        }
        gameInfo.foodLocations = gameInfo.foodLocations.concat(availablePositions)
      }

      const gameState = this.getClientMsg(gameCode);
      Object.values(this.allGames[gameCode].players)
        .forEach(player => player.send(JSON.stringify({
          ...gameState,
          uuid: player.data.uuid
        })));
    }
  }
}
