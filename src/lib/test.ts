const playerCount = 1000;

const dirs = [
  'ArrowUp',
  'ArrowRight',
  'ArrowDown',
  'ArrowLeft',
]

const players: WebSocket[] = []

let count = 0;

for (let i = 0; i < playerCount; i++) {
  players.push(
    new WebSocket(`ws://localhost:3000/?gameCode=general&color=${[ ...Array(6).keys() ].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`)
  )
}

await new Promise((resolve, reject) => {
  if (players.every(ws => ws.readyState > 0)) {
    resolve(true)
  }
})

setInterval(() => {
  players.forEach(ws => ws.send(dirs[count]))
  count = count >= 3 ? 0 : count + 1
}, 500)
