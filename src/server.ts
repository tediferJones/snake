import type { Actions, ClientData, ClientMsg } from '@/types';
import GamesManager from '@/lib/GamesManager';

// TO-DO
//
// The end result of this project should diff the current and previous game state,
// only sending the diff to the client (this should speed up client rendering)
//
// Latency seems to spike around 1028 users, find a reasonable maximum player count
//  - At a certain point the board becomes too large to see which player is which anyways
//
//  [ DONE ] Player should be able to make an exact circle, i.e. pop tail then determine if next move can be made
//  [ DONE ] Fix issue where when player winners previous game, and they rematch, server crashes when new game leaves lobby
//    - [ DONE ] Investigate getRandomDirV2 function in gamesManager
//  There is still a problem with player collisions
//    - One player can make a perfect circle, but two players cannot because tails are popped sequentially as we iterate through players

await Bun.build({
  entrypoints: [ 'src/client.ts' ],
  outdir: 'public/',
  minify: true,
  splitting: true,
})

Bun.spawnSync('bunx tailwindcss -i src/globals.css -o public/style.css --minify'.split(' '))

const GamesMan = new GamesManager();

Bun.serve<ClientData>({
  fetch: async (req, server) => {
    let { pathname, searchParams } = new URL(req.url);
    if (process.env.DEBUG) console.log(req.url)
    if (server.upgrade(req, { data: {
      gameCode: searchParams.get('gameCode')?.toUpperCase(),
      color: searchParams.get('color'),
      username: searchParams.get('username')
    } })) return

    if (pathname === '/') pathname = '/index.html';
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
