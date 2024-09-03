import type { ClientGameData, ClientMsg } from '@/types';

const playerCount = 128;

const dirs = [
  'ArrowUp',
  'ArrowRight',
  'ArrowDown',
  'ArrowLeft',
]

let gameOverCount = 0;
const openingQueue: Promise<void>[] = [];
const players: WebSocket[] = [];
for (let i = 0; i < playerCount; i++) {
  openingQueue.push(
    new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:3000/?gameCode=general&color=${[ ...Array(6).keys() ].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`)
      ws.onopen = () => {
        // players.push(ws);
        players[i] = ws
        resolve();
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
    console.log(players.length)
    ws.send(JSON.stringify({
      action: 'changeDir',
      dir: dirs[Math.floor(Math.random() * dirs.length)],
    } as ClientMsg<'changeDir'>))
  })
}, 500)
