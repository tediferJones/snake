import type {
  ClientData,
  Coordinate,
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

function refreshGameState(gameCode: string) {
  return () => {
    const gameInfo = allGames[gameCode]

    // Move each character once, and detect out of bounds
    Object.values(gameInfo.players).forEach(player => {
      if (player.data.state !== 'playing') return

      // const newRow = player.data.pos.row += player.data.dir.row;
      // const newCol = player.data.pos.col += player.data.dir.col;

      // player.data.pos.forEach(pos => {
      //   pos.row += player.data.dir.row
      //   pos.col += player.data.dir.col
      // })

      const { pos, dir } = player.data;
      const newRow = pos[0].row + dir.row;
      const newCol = pos[0].col + dir.col;

      if (
        // Check if player is out of bounds
        0 > newRow || newRow > gameInfo.boardSize - 1 ||
          0 > newCol || newCol > gameInfo.boardSize - 1 ||
          // Check if newPos intersects with any player's existing pos
          Object.values(gameInfo.players).some(player => {
            return player.data.pos.some(pos => {
              return pos.row === newRow && pos.col === newCol
            })
          })
      ) {
        player.data.state = 'gameover';
        gameInfo.foodLocations.shift()
        return
      }

      player.data.pos.unshift({
        row: newRow,
        col: newCol,
      });
      
      const foundFood = gameInfo.foodLocations.findIndex(coor => coor.row === newRow && coor.col === newCol);
      if (foundFood !== -1) {
        // player.data.length += 1;
        gameInfo.foodLocations.splice(foundFood, 1)
      } else {
        player.data.pos.pop();
      }
    });

    const activePlayerCount = Object.values(gameInfo.players).filter(player => player.data.state !== 'gameover').length 
    const newFoodCount = activePlayerCount - gameInfo.foodLocations.length;
    if (newFoodCount > 0) {
      [ ...Array(newFoodCount).keys() ].forEach(() => {
        gameInfo.foodLocations.push(getRandomCoor(gameInfo.boardSize))
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
  const options = [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
  ]
  return movements[options[Math.floor(Math.random() * options.length)]]
}

const allGames: StrIdxObj<GameData> = {}

const movements: StrIdxObj<Coordinate<1 | 0 | -1>> = {
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
      ws.data.dir = movements[msg.toString()]
    },
    open: (ws) => {
      const game = allGames[ws.data.gameCode];
      let uuid = crypto.randomUUID();
      if (game) {
        while (game.players[uuid]) uuid = crypto.randomUUID()
        game.players[uuid] = ws
        game.foodLocations.push(getRandomCoor(game.boardSize))
      } else {
        const defaultBoardSize = 10
        allGames[ws.data.gameCode] = {
          boardSize: defaultBoardSize,
          players: {
            [uuid]: ws
          },
          interval: setInterval(refreshGameState(ws.data.gameCode), 1000),
          foodLocations: [ getRandomCoor(defaultBoardSize) ],
        }
      }
      ws.data.uuid = uuid;
      // ws.data.length = 1;
      ws.data.state = 'playing';
      ws.data.pos = [ getRandomCoor(allGames[ws.data.gameCode].boardSize) ];
      ws.data.dir = getRandomDir();
      // ws.data.dir = { row: 0, col: 0 };
      ws.send(JSON.stringify({ ...getClientMsg(ws.data.gameCode), uuid }));
      console.log('OPENED', allGames)
    },
    close: (ws, code, reason) => {
      delete allGames[ws.data.gameCode].players[ws.data.uuid];
      allGames[ws.data.gameCode].foodLocations.shift();
      console.log('CLOSED', allGames)
    }
  }
});
