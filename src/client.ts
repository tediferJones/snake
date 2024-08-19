import t from '@/lib/getTag'
import type { GameData } from './types';

let ws: WebSocket;

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
        console.log(ws.data)
        const msg: GameData = JSON.parse(ws.data)
        document.querySelector('#board')?.remove();
        console.log(msg.boardSize)
        document.body.appendChild(
          t('div', { id: 'board', className: 'mx-auto w-min border-4 border-black flex flex-col bg-cyan-500' },
            [ ...Array(msg.boardSize).keys() ].map(row => {
              return t('div', { className: 'flex' },
                [ ...Array(msg.boardSize).keys() ].map(col => {
                  return t('div', { className: 'aspect-square min-h-12' })
                })
              )
            })
          )
        )
      }
    }
  }),
  t('input', { id: 'colorPicker', type: 'color' })
)
