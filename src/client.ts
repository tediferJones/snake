import t from '@/lib/getTag'
import type { ClientGameData, StrIdxObj } from './types';

let ws: WebSocket | undefined;

document.addEventListener('keydown', e => {
  console.log(e.key)
  if (!ws || ws.readyState > 1) return
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    ws?.send(e.key)
  }
})

document.body.append(
  t('button', {
    textContent: 'Join General Lobby',
    className: 'm-4 p-4 border-4 border-black',
    onclick: () => {
      const { host, protocol } = window.location
      const color = (document.querySelector('#colorPicker') as HTMLInputElement).value.slice(1)
      console.log(color)
      ws = new WebSocket(`${protocol === 'http:' ? 'ws' : 'wss'}://${host}?gameCode=general&color=${color}`)
      ws.onmessage = (ws) => {
        const msg: ClientGameData = JSON.parse(ws.data)
        console.log(msg)

        // Draw game board
        document.querySelector('#gameOver')!.textContent = '';
        document.querySelector('#board')?.remove();
        document.body.appendChild(
          t('div', { id: 'board', className: 'mx-auto w-min border-4 border-black flex flex-col bg-gray-200' },
            [ ...Array(msg.boardSize).keys() ].map(row => {
              return t('div', { className: 'flex' },
                [ ...Array(msg.boardSize).keys() ].map(col => {
                  return t('div', {
                    id: `cell-${row}-${col}`,
                    className: `aspect-square min-h-12 flex justify-center items-center border-2 border-gray-300`,
                  })
                })
              )
            })
          )
        )

        // Color in where the players are
        Object.values(msg.players).forEach(player => {
          if (player.state === 'gameover') {
            if (player.uuid === msg.uuid) {
              document.querySelector('#gameOver')!.textContent = 'Game Over'
            }
            return
          }
          const { pos, color } = player;
          pos.forEach(pos => {
            (document.querySelector(`#cell-${pos.row}-${pos.col}`) as HTMLDivElement).style.backgroundColor = `#${color}`;
          })
        })

        // Color in where food is
        msg.foodLocations.forEach(coor => {
          (document.querySelector(`#cell-${coor.row}-${coor.col}`) as HTMLDivElement).textContent = '*'
        })

      }
    }
  }),
  t('input', { id: 'colorPicker', type: 'color' }),
  t('button', {
    textContent: 'Disconnect',
    className: 'm-4 p-4 border-4 border-black',
    onclick: () => ws?.close()
  }),
  t('span', { id: 'gameOver' })
)
