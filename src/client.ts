import t from '@/lib/getTag'

let ws: WebSocket;

document.body.appendChild(
  t('button', {
    textContent: 'Join General Lobby',
    className: 'm-4 p-4 border-4 border-black',
    onclick: () => {
      const { host, protocol } = window.location
      ws = new WebSocket(`${protocol === 'http:' ? 'ws' : 'wss'}://${host}?gameCode=general`)
      ws.onmessage = (ws) => {
        console.log(ws.data)
      }
    }
  })
)
