import type { ServerWebSocket } from 'bun';

interface ClientData {
  gameCode: string
}

type ClientSocket = ServerWebSocket<ClientData>;

await Bun.build({
  entrypoints: [ 'src/client.ts' ],
  outdir: 'public/',
  minify: true,
  splitting: true,
})

Bun.spawnSync('bunx tailwindcss -i src/globals.css -o public/style.css --minify'.split(' '))

const allGames: { [key: string]: ClientSocket[] } = {}

Bun.serve<ClientData>({
  fetch: async (req, server) => {
    console.log(new URL(req.url))
    let { pathname, searchParams } = new URL(req.url);
    if (server.upgrade(req, { data: { gameCode: searchParams.get('gameCode') } })) return

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
      console.log('OPENED', ws)
      const game = allGames[ws.data.gameCode];
      if (game) {
        game.push(ws)
      } else {
        allGames[ws.data.gameCode] = [ ws ]
      }
      ws.send(`connected to ${ws.data.gameCode}`)
    },
    close: (ws, code, reason) => {
      console.log('CLOSED')
    }
  }
});
