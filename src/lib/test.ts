import type { ClientMsg, ClientGameData, Directions } from '@/types';

type CustomWs = WebSocket & { lastMsg?: ClientGameData }

// const playerCount = 256;
const playerCount = 16;

const dirs = [
  'ArrowUp',
  'ArrowRight',
  'ArrowDown',
  'ArrowLeft',
]

function findNextDir(ws: CustomWs) {
  if (!ws || ws.readyState > 1) throw Error('websocket is closed')
  if (!ws.lastMsg) return
  const { dir, pos } = ws.lastMsg.players[ws.lastMsg.uuid]

  // If player is moving up and hits the up key, no point in sending that to server so it can be ignored
  // Likewise if player is moving left and hits the right key, that is an impossible move and should also be ignored
  const verticalMoves: Directions[] = [ 'ArrowUp', 'ArrowDown' ]
  const horizontalMoves: Directions[] = [ 'ArrowRight', 'ArrowLeft' ]

  const randIndex = Math.floor(Math.random() * 2)
  if (Math.random() < 0.5) return
  if (pos && pos[0]) {
    if (pos[0].row === 0) return 'ArrowDown'
    if (pos[0].row === ws.lastMsg.boardSize - 1) return 'ArrowUp'
    if (pos[0].col === 0) return 'ArrowRight'
    if (pos[0].col === ws.lastMsg.boardSize - 1) return 'ArrowLeft'
  }
  return verticalMoves.includes(dir) ? horizontalMoves[randIndex] : verticalMoves[randIndex]

  // ws.send(JSON.stringify({
  //   action: 'changeDir',
  //   dir: dir
  // }));
}

let gameOverCount = 0;
const openingQueue: Promise<void>[] = [];
const players: CustomWs[] = [];
for (let i = 0; i < playerCount; i++) {
  openingQueue.push(
    new Promise((resolve, reject) => {
      const ws: CustomWs = new WebSocket(`ws://localhost:3000/?gameCode=general&color=${[ ...Array(6).keys() ].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}&username=bot${i + 1}`)
      ws.onopen = () => {
        // players.push(ws);
        players[i] = ws
        resolve();
      }
      ws.onmessage = (e) => {
        ws.lastMsg = JSON.parse(e.data);
      }
      ws.onerror = (err) => reject(err);
      // ws.onmessage = (ws) => {
      //   const msg = JSON.parse(ws.data) as ClientGameData;
      //   if (['gameover', 'winner'].includes(msg.players[msg.uuid].state)) {
      //     gameOverCount++
      //     console.log('before', players.length)
      //     players.splice(i, 1)
      //     console.log('after', players.length)
      //   }
      //   // if (gameOverCount === playerCount) clearInterval(interval)
      //   // console.log(gameOverCount, playerCount)
      // }
    })
  )
}

await Promise.all(openingQueue)

players.forEach(ws => {
  ws.send(JSON.stringify({ action: 'toggleReady' }))
})

// const interval =
setInterval(() => {
  players.forEach(ws => {
    if (!ws?.lastMsg?.players) return
    const nextDir = findNextDir(ws);

    if (nextDir) {
      ws.send(JSON.stringify({
        action: 'changeDir',
        dir: nextDir,
      } as ClientMsg<'changeDir'>))
    }
  })
}, 500)
