import type {
  ClientData,
  GameData,
  StrIdxObj
} from './types';

await Bun.build({
  entrypoints: [ 'src/client.ts' ],
  outdir: 'public/',
  minify: true,
  splitting: true,
})

Bun.spawnSync('bunx tailwindcss -i src/globals.css -o public/style.css --minify'.split(' '))

const allGames: StrIdxObj<GameData> = {}

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
    Object.values(gameInfo.players).forEach(player => {
      if (player.data.state !== 'playing') return

      const newRow = player.data.pos.row += player.data.dir.row;
      const newCol = player.data.pos.col += player.data.dir.col;
      if (0 > newRow || newRow > gameInfo.boardSize - 1) player.data.state = 'gameover'
      if (0 > newCol || newCol > gameInfo.boardSize - 1) player.data.state = 'gameover'
    });

    const gameState = getClientMsg(gameCode);
    Object.values(allGames[gameCode].players)
      .forEach(player => player.send(JSON.stringify({
        ...gameState,
        uuid: player.data.uuid
      })));
  }
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
      console.log(msg)
    },
    open: (ws) => {
      const game = allGames[ws.data.gameCode];
      let uuid = crypto.randomUUID();
      if (game) {
        while (game.players[uuid]) uuid = crypto.randomUUID()
        game.players[uuid] = ws
      } else {
        allGames[ws.data.gameCode] = {
          boardSize: 10,
          players: {
            [uuid]: ws
          },
          interval: setInterval(refreshGameState(ws.data.gameCode), 1000),
        }
      }
      ws.data.uuid = uuid;
      ws.data.length = 1;
      ws.data.pos = {
        row: Math.floor(Math.random() * allGames[ws.data.gameCode].boardSize),
        col: Math.floor(Math.random() * allGames[ws.data.gameCode].boardSize),
      };
      ws.data.state = 'playing'
      ws.data.dir = { row: 0, col: 1 };
      ws.send(JSON.stringify({ ...getClientMsg(ws.data.gameCode), uuid }));
      console.log('OPENED', allGames)
    },
    close: (ws, code, reason) => {
      delete allGames[ws.data.gameCode].players[ws.data.uuid];
      console.log('CLOSED', allGames)
    }
  }
});
