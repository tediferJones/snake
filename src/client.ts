import t from '@/lib/getTag';
import board from '@/components/board';
import type {
  ClientGameData,
  Directions
} from '@/types';

let ws: WebSocket | undefined;
let lastMsg: ClientGameData | undefined;

function changeDirection(dir: Directions) {
  if (!ws || ws.readyState > 1) return
  console.log('sending websocket msg')

  // If player is moving up and hits the up key, no point in sending that to server so it can be ignored
  // Likewise if player is moving left and hits the right key, that is an impossible move and should also be ignored
  const verticalMoves: Directions[] = [ 'ArrowUp', 'ArrowDown' ]
  const horizontalMoves: Directions[] = [ 'ArrowRight', 'ArrowLeft' ]
  if (lastMsg) {
    const currentDir = lastMsg.players[lastMsg.uuid].dir;
    console.log('current player dir', currentDir)
    if (verticalMoves.includes(dir) && verticalMoves.includes(currentDir)) return console.log('ignore vertical move')
    if (horizontalMoves.includes(dir) && horizontalMoves.includes(currentDir)) return console.log('ignore horizontal move')
  }
  ws.send(dir)

  // if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(dir)) {
  //   ws.send(dir);
  // }
}

document.addEventListener('keydown', e => {
  console.log(e.key, lastMsg)
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    changeDirection(e.key as Directions)
  }
  // const key = e.key as Directions
  // if (!ws || ws.readyState > 1) return
  // console.log('sending websocket msg')

  // // If player is moving up and hits the up key, no point in sending that to server so it can be ignored
  // // Likewise if player is moving left and hits the right key, that is an impossible move and should also be ignored
  // const verticalMoves: Directions[] = [ 'ArrowUp', 'ArrowDown' ]
  // const horizontalMoves: Directions[] = [ 'ArrowRight', 'ArrowLeft' ]
  // if (lastMsg) {
  //   const currentDir = lastMsg.players[lastMsg.uuid].dir;
  //   console.log('current player dir', currentDir)
  //   if (verticalMoves.includes(key) && verticalMoves.includes(currentDir)) return console.log('ignore vertical move')
  //   if (horizontalMoves.includes(key) && horizontalMoves.includes(currentDir)) return console.log('ignore horizontal move')
  // }

  // if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
  //   ws?.send(e.key);
  // }
});

document.body.className = 'flex flex-col justify-between max-h-screen';

document.body.append(
  t('div', { className: 'p-4 flex justify-between items-center border-b-2' }, [
    t('button', {
      textContent: 'Join General Lobby',
      className: 'p-4 border-4 border-black',
      onclick: (e) => {
        const { host, protocol } = window.location
        const color = (document.querySelector('#colorPicker') as HTMLInputElement).value.slice(1)
        console.log(color)
        if (ws) {
          ws.close();
          ws = undefined;
          (e.currentTarget as HTMLButtonElement).textContent = 'Join Game'
          return
        }
        (e.currentTarget as HTMLButtonElement).textContent = 'Disconnect'

        ws = new WebSocket(`${protocol === 'http:' ? 'ws' : 'wss'}://${host}?gameCode=general&color=${color}`)
        ws.onmessage = (ws) => {
          const msg: ClientGameData = JSON.parse(ws.data)
          lastMsg = msg;

          // Draw game board
          document.querySelector('#gameOver')!.textContent = '';
          // document.querySelector('#board')?.remove();
          // document.body.appendChild(board({ boardSize: msg.boardSize }));
          const boardElement = document.querySelector('#board');
          if (!boardElement) throw Error('Cant find board element')
          while (boardElement.firstChild) {
            boardElement.removeChild(boardElement.firstChild)
          }
          boardElement.appendChild(board({ boardSize: msg.boardSize }));

          // Color in where the players are
          Object.values(msg.players).forEach(player => {
            if (player.state !== 'playing') {
              if (player.uuid === msg.uuid) {
                document.querySelector('#gameOver')!.textContent = player.state
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
            // (document.querySelector(`#cell-${coor.row}-${coor.col}`) as HTMLDivElement).textContent = '*'
            document.querySelector(`#cell-${coor.row}-${coor.col}`)?.append(
              t('div', { className: 'h-1/2 w-1/2 bg-black rotate-45'})
            )
          })

        }
      }
    }),
    t('label', { className: 'flex items-center gap-4', textContent: 'Pick you color:', htmlFor: 'colorPicker' }, [
      t('input', {
        id: 'colorPicker',
        type: 'color',
        // Generate a random hex string
        value: '#' + [ ...Array(6).keys() ].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
      }),
    ]),
    t('span', { id: 'gameOver' }),
    // t('button', {
    //   textContent: 'Disconnect',
    //   className: 'p-4 border-4 border-black',
    //   onclick: () => ws?.close()
    // })
  ]),
  t('div', { id: 'board', className: 'aspect-square flex justify-center items-center' }),
  t('div', { className: 'grid grid-cols-3 mx-auto' }, [
    t('div'),
    t('div', { className: 'aspect-square text-8xl', textContent: '⬆', onclick: () => changeDirection('ArrowUp') }),
    t('div'),
    t('div', { className: 'aspect-square text-8xl', textContent: '⬅', onclick: () => changeDirection('ArrowLeft') }),
    t('div'),
    t('div', { className: 'aspect-square text-8xl', textContent: '➡', onclick: () => changeDirection('ArrowRight') }),
    t('div'),
    t('div', { className: 'aspect-square text-8xl', textContent: '⬇', onclick: () => changeDirection('ArrowDown') }),
    t('div'),
  ])
);
