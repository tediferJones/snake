import type {
  Actions,
  ClientData,
  ClientGameData,
  ClientMsg,
  ClientSocket,
  Coordinate,
  Directions,
  GameData,
  StrIdxObj
} from '@/types';

export default class GamesManager {
  allGames: StrIdxObj<GameData>
  movements: { [key in Directions]: Coordinate<1 | 0 | -1> }
  defaultTickRate: number;
  defaultBoardSize: number;
  actions: { [key in Actions]: (ws: ClientSocket, msg: ClientMsg<key>) => void }

  constructor() {
    this.defaultTickRate = 500;
    this.defaultBoardSize = 6;
    this.allGames = {};
    this.movements = {
      'ArrowUp':    { row: -1, col: 0 },
      'ArrowDown':  { row: 1, col: 0 },
      'ArrowLeft':  { row: 0, col: -1 },
      'ArrowRight': { row: 0, col: 1 },
    }
    this.actions = {
      changeDir: (ws, msg) => {
        const dir = msg.dir
        if (Object.keys(this.movements).includes(dir)) {
          ws.data.dir = dir as Directions;
        }
      },
      toggleReady: (ws, msg) => {
        ws.data.state = ws.data.state === 'ready' ? 'notReady' : 'ready'
        this.sendClientMsg(ws.data.gameCode)

        
        if (
          Object.values(this.allGames[ws.data.gameCode].players).every(player => player.data.state === 'ready')
        ) {
          this.startGame(ws.data.gameCode);
        }
      },
      toggleRematch: (ws, msg) => {
        if (ws.data.state !== 'rematch') {
          ws.data.oldState = ws.data.state;
          ws.data.state = 'rematch';
        } else {
          if (!ws.data.oldState) throw Error('Cant find old state');
          ws.data.state = ws.data.oldState;
        }

        const gameInfo = this.allGames[ws.data.gameCode]
        if (
          Object.values(gameInfo.players).every(player => player.data.state === 'rematch')
        ) {
          Object.values(gameInfo.players).forEach(player => player.data.state = 'notReady')
          gameInfo.gameState = 'lobby'
        }
        this.sendClientMsg(ws.data.gameCode)
      }
    }
  }

  joinLobby(ws: ClientSocket) {
    const game = this.allGames[ws.data.gameCode];
    let uuid = crypto.randomUUID();
    if (game) {
      while (game.players[uuid]) uuid = crypto.randomUUID();
      game.players[uuid] = ws;
    } else {
      this.allGames[ws.data.gameCode] = {
        boardSize: 0,
        players: { [uuid]: ws },
        interval: setInterval(this.refreshGameState(ws.data.gameCode), Number.MAX_SAFE_INTEGER),
        foodLocations: [],
        gameState: 'lobby'
      }
      // If at all possible, this attribute assignment should be moved into the object above
      this.allGames[ws.data.gameCode].foodLocations = this.getOpenPositions(ws.data.gameCode, 1);
    }
    ws.data.uuid = uuid;
    ws.data.state = 'notReady';
    this.sendClientMsg(ws.data.gameCode)
    // console.log('OPENED', this.allGames)
  }

  startGame(gameCode: string) {
    const gameInfo = this.allGames[gameCode];
    const players = Object.values(gameInfo.players);
    gameInfo.boardSize = Math.floor(Math.sqrt((this.defaultBoardSize ** 2) * players.length + 1));
    gameInfo.gameState = 'running';
    const openPos = this.getOpenPositions(gameCode, players.length * 2);

    players.forEach((player, i) => {
      const index = i * 2;
      player.data.pos = [ openPos[index] ];
      player.data.dir = this.getRandomDir();
      player.data.state = 'playing';
      gameInfo.foodLocations.push(openPos[index + 1]);
    });
    gameInfo.interval = setInterval(this.refreshGameState(gameCode), this.defaultTickRate);
    this.sendClientMsg(gameCode);
  }

  leaveLobby(ws: ClientSocket) {
    const gameInfo = this.allGames[ws.data.gameCode];
    delete gameInfo.players[ws.data.uuid];
    gameInfo.foodLocations.shift();
    if (Object.keys(gameInfo.players).length === 0) {
      clearInterval(gameInfo.interval);
      delete this.allGames[ws.data.gameCode];
    }
    // console.log('CLOSED', this.allGames)
  }

  getRandomDir() {
    const dirs = Object.keys(this.movements) as Directions[];
    return dirs[Math.floor(Math.random() * dirs.length)];
  }

  getOpenPositions(gameCode: string, count: number) {
    const gameInfo = this.allGames[gameCode];
    if (!gameInfo) return [];

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
      const randomIndex = Math.floor(Math.random() * openPositions.length);
      const randomPosition = openPositions[randomIndex];
      openPositions.splice(randomIndex, 1);
      return randomPosition;
    }).filter(coor => coor);
  }

  sendClientMsg(gameCode: string) {
    const msg = {
      ...this.allGames[gameCode],
      players: Object.keys(this.allGames[gameCode].players).reduce((newPlayers, uuid) => {
        newPlayers[uuid] = this.allGames[gameCode].players[uuid].data;
        return newPlayers
      }, {} as StrIdxObj<ClientData>),
      interval: undefined,
      uuid: '',
    } as ClientGameData
    // const gameState: any = this.getClientMsg(gameCode);
    Object.values(this.allGames[gameCode].players)
      .forEach(player => {
        msg.uuid = player.data.uuid;
        player.send(JSON.stringify(msg));
      });
  }

  refreshGameState(gameCode: string) {
    return () => {
      const gameInfo = this.allGames[gameCode];
      if (!gameInfo) throw Error('Cant find gameCode at refreshGameState method');

      const allPlayers = Object.values(gameInfo.players)
      const availablePlayers = allPlayers.filter(player => player.data.state === 'playing');
      // Move each character once, and detect out of bounds
      availablePlayers.forEach(player => {
        // if (player.data.state !== 'playing') return

        const { pos, dir } = player.data;
        const newRow = pos[0].row + this.movements[dir].row;
        const newCol = pos[0].col + this.movements[dir].col;
        const usedPositions = Object.values(gameInfo.players).flatMap(
          player => player.data.state === 'playing' ? player.data.pos : []
        );

        if (
          // Check if player is out of bounds
          0 > newRow || newRow > gameInfo.boardSize - 1 ||
            0 > newCol || newCol > gameInfo.boardSize - 1 ||
            // Check if newPos intersects with any player's existing pos
            usedPositions.find(pos => pos.row === newRow && pos.col === newCol)
        ) {
          player.data.state = 'gameOver';
          gameInfo.foodLocations.shift();
          return
        }

        // Add new pos to head of player pos
        player.data.pos.unshift({ row: newRow, col: newCol });

        // If new position is on food, remove that food location and DONT pop the player's tail position
        // This will result the in the players length growing (we add to the head and dont remove from the tail)
        const foundFood = gameInfo.foodLocations.findIndex(coor => coor.row === newRow && coor.col === newCol);
        if (foundFood !== -1) {
          gameInfo.foodLocations.splice(foundFood, 1);
        } else {
          player.data.pos.pop();
        }
      });

      if (Object.values(gameInfo.players).every(player => player.data.state !== 'playing')) {
        gameInfo.gameState = 'done'
        clearInterval(gameInfo.interval)
        this.sendClientMsg(gameCode)
        return
      }

      // Check active player count and current food count, and add more food if needed
      // and make sure food does not spawn in a position that is alread occupied by a player or food
      const activePlayerCount = Object.values(gameInfo.players).filter(player => player.data.state === 'playing').length;
      const newFoodCount = activePlayerCount - gameInfo.foodLocations.length;

      if (newFoodCount > 0) {
        const availablePositions = this.getOpenPositions(gameCode, newFoodCount);
        // If there are no available positions, game is over and all players remaining are winners
        if (availablePositions.length === 0) {
          gameInfo.gameState = 'done';
          return Object.values(gameInfo.players)
            .forEach(player => {
              if (player.data.state === 'playing') {
                player.data.state = 'winner';
              }
            });
        }
        gameInfo.foodLocations = gameInfo.foodLocations.concat(availablePositions);
      }

      this.sendClientMsg(gameCode)
    }
  }
}
