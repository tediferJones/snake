import t from '@/lib/getTag';
import board from '@/components/board';
import onScreenControls from '@/components/onScreenControls';
import type {
  ClientGameData,
  Directions
} from '@/types';

let ws: WebSocket | undefined;
let lastMsg: ClientGameData | undefined;

const renderDirection = {
  ArrowUp: '-rotate-90',
  ArrowRight: 'rotate-0',
  ArrowDown: 'rotate-90',
  ArrowLeft: 'rotate-180',
}

const roundingDir = {
  ArrowUp: 'rounded-t-3xl',
  ArrowRight: 'rounded-r-3xl',
  ArrowDown: 'rounded-b-3xl',
  ArrowLeft: 'rounded-l-3xl',
}

function invertHexColor(hex: string) {
  // Convert the hex color to RGB components
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Invert each component
  const newR = (255 - r).toString(16).padStart(2, '0');
  const newG = (255 - g).toString(16).padStart(2, '0');
  const newB = (255 - b).toString(16).padStart(2, '0');

  // Return the inverted color as a hex string
  return `#${newR}${newG}${newB}`;
}

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
}

function submitFunc(e: SubmitEvent) {
  e.preventDefault();
  const { host, protocol } = window.location;
  const color = (document.querySelector('#colorPicker') as HTMLInputElement).value.slice(1);
  const gameCode = (document.querySelector('#gameCode') as HTMLInputElement).value.toUpperCase();
  const joinBtn = document.querySelector('#joinBtn')! as HTMLButtonElement;
  console.log(color);
  if (ws) {
    ws.close();
    ws = undefined;
    joinBtn.textContent = 'Join Game'
    return
  }
  joinBtn.textContent = 'Disconnect'

  ws = new WebSocket(`${protocol === 'http:' ? 'ws' : 'wss'}://${host}?gameCode=${gameCode || 'general'}&color=${color}`)
  ws.onmessage = (ws) => {
    const msg: ClientGameData = JSON.parse(ws.data)
    lastMsg = msg;

    // Draw game board
    document.querySelector('#gameOver')!.textContent = '';
    document.querySelector('#playerCount')!.textContent = `Player Count: ${Object.keys(msg.players).length.toString()}`

    const boardElement = document.querySelector('#board');
    if (!boardElement) throw Error('Cant find board element')
    while (boardElement.firstChild) {
      boardElement.removeChild(boardElement.firstChild)
    }
    boardElement.appendChild(board({ boardSize: msg.boardSize }));

    // Update player status
    document.querySelector('#gameOver')!.textContent = msg.players[msg.uuid].state

    // Color in where the players are
    Object.values(msg.players).filter(player => player.state !== 'gameover').forEach(player => {
      const { pos, color } = player;
      const playerColor = `#${color}`;
      pos.forEach(({ row, col }, i) => {
        const cell = (document.querySelector(`#cell-${row}-${col}`) as HTMLDivElement)
        cell.style.backgroundColor = playerColor;
        if (i === 0) { 
          cell.classList.add(roundingDir[player.dir])
          cell.appendChild(
            t('div', { className: `h-full w-full flex flex-col justify-center items-center ${renderDirection[player.dir]}` }, [
              t('div', { className: 'h-1/5 w-1/5 rounded-full', id: `lefteye-${player.uuid}` }),
              t('div', { className: 'h-1/5 w-1/5' }),
              t('div', { className: 'h-1/5 w-1/5 rounded-full', id: `righteye-${player.uuid}` }),
            ])
          );
          (document.querySelector(`#lefteye-${player.uuid}`) as HTMLDivElement).style.backgroundColor = invertHexColor(player.color);
          (document.querySelector(`#righteye-${player.uuid}`) as HTMLDivElement).style.backgroundColor = invertHexColor(player.color);
        }

        // Add outline to player
        const before = pos[i - 1];
        const after = pos[i + 1]
        if (before) {
          if (before.row < row) cell.style.borderTopColor = playerColor;
          if (before.row > row) cell.style.borderBottomColor = playerColor;
          if (before.col < col) cell.style.borderLeftColor = playerColor;
          if (before.col > col) cell.style.borderRightColor = playerColor;
        }

        if (after) {
          if (row < after.row) cell.style.borderBottomColor = playerColor;
          if (row > after.row) cell.style.borderTopColor = playerColor;
          if (col < after.col) cell.style.borderRightColor = playerColor;
          if (col > after.col) cell.style.borderLeftColor = playerColor;
        }

        if (before && after) {
          if (before.row < row && after.col < col) cell.classList.add('rounded-br-3xl')
          if (before.row < row && after.col > col) cell.classList.add('rounded-bl-3xl')
          if (before.row > row && after.col < col) cell.classList.add('rounded-tr-3xl')
          if (before.row > row && after.col > col) cell.classList.add('rounded-tl-3xl')

          if (row < after.row && col < before.col) cell.classList.add('rounded-tl-3xl')
          if (row < after.row && col > before.col) cell.classList.add('rounded-tr-3xl')
          if (row > after.row && col < before.col) cell.classList.add('rounded-bl-3xl')
          if (row > after.row && col > before.col) cell.classList.add('rounded-br-3xl')
        }
      })
    })

    // Color in where food is
    msg.foodLocations.forEach(coor => {
      document.querySelector(`#cell-${coor.row}-${coor.col}`)?.append(
        t('div', { className: 'h-1/2 w-1/2 bg-black rotate-45'})
      )
    })
  }
}

document.addEventListener('keydown', e => {
  console.log(e.key, lastMsg)
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    changeDirection(e.key as Directions)
  }
});

document.body.className = 'flex flex-col justify-between max-h-screen';

document.body.append(
  t('form', { className: 'p-4 flex justify-between items-center border-b-2', onsubmit: submitFunc }, [
    t('button', {
      textContent: 'Join General Lobby',
      className: 'p-4 border-4 border-black',
      id: 'joinBtn',
      type: 'submit',
      // onclick: (e) => {
      //   const { host, protocol } = window.location;
      //   const color = (document.querySelector('#colorPicker') as HTMLInputElement).value.slice(1);
      //   const gameCode = (document.querySelector('#gameCode') as HTMLInputElement).value;
      //   console.log(color);
      //   if (ws) {
      //     ws.close();
      //     ws = undefined;
      //     (e.currentTarget as HTMLButtonElement).textContent = 'Join Game'
      //     return
      //   }
      //   (e.currentTarget as HTMLButtonElement).textContent = 'Disconnect'

      //   ws = new WebSocket(`${protocol === 'http:' ? 'ws' : 'wss'}://${host}?gameCode=${gameCode || 'general'}&color=${color}`)
      //   ws.onmessage = (ws) => {
      //     const msg: ClientGameData = JSON.parse(ws.data)
      //     lastMsg = msg;

      //     // Draw game board
      //     document.querySelector('#gameOver')!.textContent = '';
      //     document.querySelector('#playerCount')!.textContent = `Player Count: ${Object.keys(msg.players).length.toString()}`

      //     const boardElement = document.querySelector('#board');
      //     if (!boardElement) throw Error('Cant find board element')
      //     while (boardElement.firstChild) {
      //       boardElement.removeChild(boardElement.firstChild)
      //     }
      //     boardElement.appendChild(board({ boardSize: msg.boardSize }));

      //     // Update player status
      //     document.querySelector('#gameOver')!.textContent = msg.players[msg.uuid].state

      //     // Color in where the players are
      //     Object.values(msg.players).filter(player => player.state !== 'gameover').forEach(player => {
      //       const { pos, color } = player;
      //       const playerColor = `#${color}`;
      //       pos.forEach(({ row, col }, i) => {
      //         const cell = (document.querySelector(`#cell-${row}-${col}`) as HTMLDivElement)
      //         cell.style.backgroundColor = playerColor;
      //         if (i === 0) { 
      //           cell.classList.add(roundingDir[player.dir])
      //           cell.appendChild(
      //             t('div', { className: `h-full w-full flex flex-col justify-center items-center ${renderDirection[player.dir]}` }, [
      //               t('div', { className: 'h-1/5 w-1/5 rounded-full', id: `lefteye-${player.uuid}` }),
      //               t('div', { className: 'h-1/5 w-1/5' }),
      //               t('div', { className: 'h-1/5 w-1/5 rounded-full', id: `righteye-${player.uuid}` }),
      //             ])
      //           );
      //           (document.querySelector(`#lefteye-${player.uuid}`) as HTMLDivElement).style.backgroundColor = invertHexColor(player.color);
      //           (document.querySelector(`#righteye-${player.uuid}`) as HTMLDivElement).style.backgroundColor = invertHexColor(player.color);
      //         }

      //         // Add outline to player
      //         const before = pos[i - 1];
      //         const after = pos[i + 1]
      //         if (before) {
      //           if (before.row < row) cell.style.borderTopColor = playerColor;
      //           if (before.row > row) cell.style.borderBottomColor = playerColor;
      //           if (before.col < col) cell.style.borderLeftColor = playerColor;
      //           if (before.col > col) cell.style.borderRightColor = playerColor;
      //         }

      //         if (after) {
      //           if (row < after.row) cell.style.borderBottomColor = playerColor;
      //           if (row > after.row) cell.style.borderTopColor = playerColor;
      //           if (col < after.col) cell.style.borderRightColor = playerColor;
      //           if (col > after.col) cell.style.borderLeftColor = playerColor;
      //         }

      //         if (before && after) {
      //           if (before.row < row && after.col < col) cell.classList.add('rounded-br-3xl')
      //           if (before.row < row && after.col > col) cell.classList.add('rounded-bl-3xl')
      //           if (before.row > row && after.col < col) cell.classList.add('rounded-tr-3xl')
      //           if (before.row > row && after.col > col) cell.classList.add('rounded-tl-3xl')

      //           if (row < after.row && col < before.col) cell.classList.add('rounded-tl-3xl')
      //           if (row < after.row && col > before.col) cell.classList.add('rounded-tr-3xl')
      //           if (row > after.row && col < before.col) cell.classList.add('rounded-bl-3xl')
      //           if (row > after.row && col > before.col) cell.classList.add('rounded-br-3xl')
      //         }
      //       })
      //     })

      //     // Color in where food is
      //     msg.foodLocations.forEach(coor => {
      //       document.querySelector(`#cell-${coor.row}-${coor.col}`)?.append(
      //         t('div', { className: 'h-1/2 w-1/2 bg-black rotate-45'})
      //       )
      //     })
      //   }
      // }
    }),
    t('label', { className: 'flex items-center gap-4', textContent: 'Pick you color:', htmlFor: 'colorPicker' }, [
      t('input', {
        id: 'colorPicker',
        type: 'color',
        // Generate a random hex string
        value: '#' + [ ...Array(6).keys() ].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
      }),
    ]),
    t('label', { className: 'flex justify-center items-center gap-4', textContent: 'Game Code' }, [
      t('input', {
        id: 'gameCode',
        className: 'border-2 border-black p-4',
        type: 'text',
        minLength: '5',
        maxLength: '5',
        required: false,
      }),
    ]),
    t('span', { id: 'gameOver' }),
    t('span', { id: 'playerCount' }),
  ]),
  t('div', { id: 'board', className: 'aspect-square flex justify-center items-center' }),
  onScreenControls({ changeDirFunc: changeDirection })
);
