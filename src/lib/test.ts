const playerCount = 8;

const dirs = [
  'ArrowUp',
  'ArrowRight',
  'ArrowDown',
  'ArrowLeft',
]

let count = 0;

// const players: WebSocket[] = []
// for (let i = 0; i < playerCount; i++) {
//   players.push(
//     new WebSocket(`ws://localhost:3000/?gameCode=general&color=${[ ...Array(6).keys() ].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`)
//   )
// }
// 
// await new Promise((resolve, reject) => {
//   console.log('promise')
//   if (players.every(ws => ws.readyState > 0)) {
//     resolve(true)
//   }
// })

const openingQueue: Promise<void>[] = []
const players: WebSocket[] = []
for (let i = 0; i < playerCount; i++) {
  openingQueue.push(
    new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:3000/?gameCode=general&color=${[ ...Array(6).keys() ].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`)
      ws.onopen = () => {
        players.push(ws);
        resolve();
      }
      ws.onerror = (err) => reject(err);
    })
  )
}

await Promise.all(openingQueue)
console.log(players)

setInterval(() => {
  console.log('sending msg', players)
  // players.forEach(ws => ws.send(dirs[count]))
  // count = count >= 3 ? 0 : count + 1
  players.forEach(ws => ws.send(dirs[Math.floor(Math.random() * dirs.length)]))
}, 500)
