import type { Actions, ClientData, ClientMsg } from '@/types';
import GamesManager from '@/lib/GamesManager';

await Bun.build({
  entrypoints: [ 'src/client.ts' ],
  outdir: 'public/',
  // minify: true,
  // splitting: true,
})

Bun.spawnSync('bunx tailwindcss -i src/globals.css -o public/style.css --minify'.split(' '))

const GamesMan = new GamesManager();

Bun.serve<ClientData>({
  fetch: async (req, server) => {
    let { pathname, searchParams } = new URL(req.url);
    // console.log(req.url)
    if (server.upgrade(req, { data: {
      gameCode: searchParams.get('gameCode'),
      color: searchParams.get('color'),
      username: searchParams.get('username')
    } })) return

    if (pathname === '/') pathname = '/index.html';
    // console.log(pathname);
    const file = Bun.file('public' + pathname);
    const exists = await file.exists();
    return new Response(
      exists ? file : 'File not found',
      { status: exists ? 200 : 404 }
    )
  },
  websocket: {
    // message: (ws, msg) => GamesMan.changeDir(ws, msg),
    // message: (ws, msg) => GamesMan.handleClientMsg(ws, JSON.parse(msg.toString())),
    message: (ws, msg) => {
      const clientMsg = JSON.parse(msg.toString())
      GamesMan.actions[clientMsg.action as Actions](ws, clientMsg)
    },
    open: (ws) => GamesMan.joinLobby(ws),
    close: (ws) => GamesMan.leaveLobby(ws),
  }
});
