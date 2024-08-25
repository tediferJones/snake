import type {
  ClientData,
  Coordinate,
  Directions,
  GameData,
  StrIdxObj
} from '@/types';

await Bun.build({
  entrypoints: [ 'src/client.ts' ],
  outdir: 'public/',
  minify: true,
  splitting: true,
})

Bun.spawnSync('bunx tailwindcss -i src/globals.css -o public/style.css --minify'.split(' '))

// All of this stuff (except for server) should be stuffed into a single class
//  - Probably called GamesManager

function getClientMsg(gameCode: string) {
  const newPlayers: StrIdxObj<ClientData> = {}
  Object.keys(allGames[gameCode].players).forEach(uuid => {
    newPlayers[uuid] = allGames[gameCode].players[uuid].data
  })

  return {
    ...allGames[gameCode],
    players: newPlayers,
    interval: undefined,
  }
}

function getOpenPositions(gameCode: string) {
  const gameInfo = allGames[gameCode];
  if (!gameInfo) return

  const usedPositions = Object.values(gameInfo.players).flatMap(player => player.data.pos).concat(gameInfo.foodLocations)
  return [...Array(gameInfo.boardSize).keys()].flatMap(row => 
    [...Array(gameInfo.boardSize).keys()].map(col => ({ row, col }))
  ).filter(available => !usedPositions.some(used => 
      available.row === used.row && available.col === used.col
    )
  )
}

function refreshGameState(gameCode: string) {
  return () => {
    const gameInfo = allGames[gameCode]
    if (!gameInfo) return

    // Move each character once, and detect out of bounds
    Object.values(gameInfo.players).forEach(player => {
      if (player.data.state !== 'playing') return

      const { pos, dir } = player.data;
      const newRow = pos[0].row + movements[dir].row;
      const newCol = pos[0].col + movements[dir].col;
      const usedPositions = Object.values(gameInfo.players)
        .map(player => player.data.pos)
        .flat()

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
      const availablePositions = getOpenPositions(gameCode);
      // If there are no available positions, game is over and all players remaining are winners
      if (!availablePositions || availablePositions.length === 0) {
        return Object.values(gameInfo.players)
          .forEach(player => player.data.state = 'winner')
      }

      // Randomly select new locations for food to spawn
      [ ...Array(newFoodCount).keys() ].forEach(() => {
        const randomIndex = Math.floor(Math.random() * availablePositions.length);
        gameInfo.foodLocations.push(availablePositions[randomIndex])
        availablePositions.splice(randomIndex, 1)
      })
    }

    const gameState = getClientMsg(gameCode);
    Object.values(allGames[gameCode].players)
      .forEach(player => player.send(JSON.stringify({
        ...gameState,
        uuid: player.data.uuid
      })));
  }
}

function getRandomCoor(size: number) {
  return {
    row: Math.floor(Math.random() * size),
    col: Math.floor(Math.random() * size),
  }
}

function getRandomDir() {
  const dirs = Object.keys(movements) as Directions[];
  return dirs[Math.floor(Math.random() * dirs.length)];
}

const allGames: StrIdxObj<GameData> = {};
const defaultTickRate = 500;
const defaultBoardSize = 10;

const movements: { [key in Directions]: Coordinate<1 | 0 | -1> } = {
  'ArrowUp':    { row: -1, col: 0 },
  'ArrowDown':  { row: 1, col: 0 },
  'ArrowLeft':  { row: 0, col: -1 },
  'ArrowRight': { row: 0, col: 1 },
}

Bun.serve<ClientData>({
  fetch: async (req, server) => {
    let { pathname, searchParams } = new URL(req.url);
    if (server.upgrade(req, { data: {
      gameCode: searchParams.get('gameCode'),
      color: searchParams.get('color')
    } })) return

    if (pathname === '/') pathname = '/index.html';
    console.log(pathname);
    const file = Bun.file('public' + pathname);
    const exists = await file.exists();
    return new Response(
      exists ? file : 'File not found',
      { status: exists ? 200 : 404 }
    )
  },
  websocket: {
    message: (ws, msg) => {
      console.log('this is a new msg from', ws.data.uuid, msg)
      const newDir = msg.toString();
      if (Object.keys(movements).includes(newDir)) {
        ws.data.dir = newDir as Directions;
      }
    },
    open: (ws) => {
      const game = allGames[ws.data.gameCode];
      let uuid = crypto.randomUUID();
      if (game) {
        while (game.players[uuid]) uuid = crypto.randomUUID()
        game.players[uuid] = ws
        game.foodLocations.push(getRandomCoor(game.boardSize))
        game.boardSize = Math.floor(Math.sqrt((game.boardSize ** 2) + 100))
      } else {
        allGames[ws.data.gameCode] = {
          boardSize: defaultBoardSize,
          players: {
            [uuid]: ws
          },
          interval: setInterval(refreshGameState(ws.data.gameCode), defaultTickRate),
          // YOU CAN JUST CHOOSE A RANDOM POSITION
          // YOU MUST CHOOSE A RANDOM POSITION THAT IS AVAILABLE
          foodLocations: [ getRandomCoor(defaultBoardSize) ],
        }
      }
      ws.data.uuid = uuid;
      ws.data.state = 'playing';
      // YOU CAN JUST CHOOSE A RANDOM POSITION
      // YOU MUST CHOOSE A RANDOM POSITION THAT IS AVAILABLE
      ws.data.pos = [ getRandomCoor(allGames[ws.data.gameCode].boardSize) ];
      ws.data.dir = getRandomDir();
      ws.send(JSON.stringify({ ...getClientMsg(ws.data.gameCode), uuid }));
      console.log('OPENED', allGames)
    },
    close: (ws, code, reason) => {
      const gameInfo = allGames[ws.data.gameCode];
      delete gameInfo.players[ws.data.uuid];
      gameInfo.foodLocations.shift();
      if (Object.keys(gameInfo.players).length === 0) {
        clearInterval(gameInfo.interval)
        delete allGames[ws.data.gameCode]
      }
      console.log('CLOSED', allGames)
    }
  }
});
