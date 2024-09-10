import type { ClientGameData, ClientMsg, Directions } from '@/types';
import onScreenControls from '@/components/onScreenControls';
import board from '@/components/board';
import fromCamelCase from '@/lib/fromCamelCase';
import t from '@/lib/getTag';

let ws: WebSocket | undefined;
let lastMsg: ClientGameData | undefined;

let previousTime: number | undefined;
let latStat = {
  min: Infinity,
  max: -Infinity,
  total: 0,
  count: 0,
}

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

const drawPlayerSet = new Set(['playing', 'winner'])

const renders: { [key in ClientGameData['gameState']]: (gameData: ClientGameData) => void } = {
  running: (msg) => {
    const currentTime = Date.now();
    if (previousTime) {
      const timeDiff = currentTime - previousTime;
      console.log('Time between messages:', timeDiff)
      if (timeDiff < latStat.min) latStat.min = timeDiff;
      if (timeDiff > latStat.max) latStat.max = timeDiff;
      latStat.total += timeDiff;
      latStat.count += 1;
      console.log('min', latStat.min)
      console.log('max', latStat.max)
      console.log('avg', latStat.total / latStat.count)
    }
    previousTime = currentTime

    document.querySelector('#onScreenControls')?.classList.remove('hidden');
    // Draw game board
    const boardElement = clearContainer('board');
    boardElement.appendChild(board({ boardSize: msg.boardSize }));

    // Color in where the players are
    Object.values(msg.players)
      .filter(player => drawPlayerSet.has(player.state) || drawPlayerSet.has(player.oldState!))
      .forEach(player => {
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
    console.log('Draw time:', Date.now() - previousTime)
  },
  lobby: (msg) => {
    // console.log('rendering lobby', msg, msg.players[msg.uuid])
    const isReady = msg.players[msg.uuid].state === 'ready';
    clearContainer('leaderboard');
    const boardElement = clearContainer('board');
    boardElement.appendChild(
      t('div', { className: 'flex flex-col gap-8 items-center'}, [
        t('div', { textContent: `Players ready: ${Object.values(msg.players).filter(player => player.state === 'ready').length} / ${Object.keys(msg.players).length}` }),
        t('div', { className: `p-4 flex justify-center items-center gap-4 bg-gray-200 rounded-xl border-2 border-black` }, [
          t('div', { textContent: 'Are you ready?' }),
          t('button', {
            textContent: '🖒',
            className: `p-2 text-6xl transition-all duration-1000 border-2 rounded-xl ${isReady ? 'bg-green-300 text-green-500 border-green-500' : 'rotate-180 bg-red-300 text-red-500 border-red-500' }`,
            onclick: () => {
              console.log('send ready toggle msg to server')
              ws?.send(JSON.stringify({ action: 'toggleReady' } satisfies ClientMsg))
            }
          })
        ])
      ])
    )
  },
  done: (msg) => {
    renders.running(msg)
    const rematch = msg.players[msg.uuid].state === 'rematch';
    const leaderboard = clearContainer('leaderboard');
    document.querySelector('#onScreenControls')?.classList.add('hidden');
    const highlightColor: { [key: string]: string } = {
      winner: 'bg-yellow-500',
      gameOver: 'bg-red-500',
      rematch: 'bg-green-500',
    }
    leaderboard.appendChild(
      t('div', { className: 'flex flex-col items-center gap-4' }, [
        t('div', { textContent: `Players ready: ${Object.values(msg.players).filter(player => player.state === 'rematch').length} / ${Object.keys(msg.players).length}` }),
        t('div', { className: `p-4 flex justify-center items-center gap-4 bg-gray-200 rounded-xl border-2 border-black` }, [
          t('div', { textContent: 'Do you want a rematch?' }),
          t('button', {
            textContent: '🖒',
            className: `p-2 text-6xl transition-all duration-1000 border-2 rounded-xl ${rematch ? 'bg-green-300 text-green-500 border-green-500' : 'rotate-180 bg-red-300 text-red-500 border-red-500' }`,
            onclick: () => {
              console.log('send ready toggle msg to server')
              ws?.send(JSON.stringify({ action: 'toggleRematch' } satisfies ClientMsg))
            }
          })
        ]),
        ...Object.values(msg.players)
        .filter(player => player.pos && player.pos.length > 0)
        .sort((a, b) => b.pos.length - a.pos.length)
        .map((player, i) => 
          t('div', { className: `flex gap-4 items-center justify-between p-4 w-full ${highlightColor[player.state]}` }, [
            t('span', { textContent: `${i + 1}.)` }),
            t('span', { textContent: player.username, className: `text-xl font-bold` }),
            t('span', { textContent: player.pos.length.toString() }),
          ])
        )
      ])
    )
  }
}

function clearContainer(id: string) {
  const element = document.querySelector(`#${id}`);
  if (!element) throw Error('Cant find board element');
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
  return element;
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
  if (lastMsg?.players[lastMsg.uuid].state !== 'playing') {
    return
  }

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
  // ws.send(dir)
  ws.send(JSON.stringify({
    action: 'changeDir',
    dir: dir
  }));
}

function submitFunc(e: SubmitEvent) {
  e.preventDefault();
  const { host, protocol } = window.location;
  const color = (document.querySelector('#colorPicker') as HTMLInputElement).value.slice(1);
  const gameCode = (document.querySelector('#gameCode') as HTMLInputElement).value.toUpperCase();
  const username = (document.querySelector('#username') as HTMLInputElement).value;
  document.querySelector('#connectForm')?.classList.add('hidden');
  document.querySelector('#connectedInfo')?.classList.remove('hidden');
  // document.querySelector('#onScreenControls')?.classList.remove('hidden');
  console.log(color);

  ws = new WebSocket(`${protocol === 'http:' ? 'ws' : 'wss'}://${host}?gameCode=${gameCode || 'general'}&color=${color}&username=${username}`)
  ws.onmessage = (ws) => {
    const msg: ClientGameData = JSON.parse(ws.data);
    lastMsg = msg;
    if (msg as any === 'TESTRES') {
      return console.log('recieved test res')
    }

    // Update player status
    document.querySelector('#gameState')!.textContent = fromCamelCase(msg.players[msg.uuid].state);
    document.querySelector('#playerCount')!.textContent = `Player Count: ${Object.keys(msg.players).length.toString()}`;

    // Select render function based on gameState
    renders[msg.gameState](msg);
  }
}

document.addEventListener('keydown', e => {
  console.log(e.key, lastMsg)
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    changeDirection(e.key as Directions);
  }
});

document.body.className = 'flex flex-col gap-8 justify-between max-w-screen';

document.body.append(
  // t('div', { className: 'p-8 flex flex-col gap-8 justify-between items-center border-b-2 flex-wrap' }, [
  t('div', { className: 'p-8 border-b-2 flex-wrap' }, [
    t('form', { id: 'connectForm', className: 'flex flex-col justify-center items-center gap-8', onsubmit: submitFunc }, [
      t('label', { className: 'flex items-center gap-4', textContent: 'Pick you color:', htmlFor: 'colorPicker' }, [
        t('input', {
          id: 'colorPicker',
          type: 'color',
          // Generate a random hex string
          value: '#' + [ ...Array(6).keys() ].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
        }),
      ]),
      t('label', { className: 'flex flex-wrap justify-center items-center gap-4', textContent: 'Username' }, [
        t('input', {
          className: 'border-2 border-black p-4 rounded-xl',
          id: 'username',
          type: 'text',
          maxLength: '32',
          required: true,
          value: [ ...Array(6).keys() ].map(() => String.fromCharCode(Math.floor(Math.random() * 57) + 65)).join(''),
        })
      ]),
      t('label', { className: 'flex flex-wrap justify-center items-center gap-4', textContent: 'Game Code' }, [
        t('input', {
          id: 'gameCode',
          className: 'border-2 border-black p-4 rounded-xl',
          type: 'text',
          minLength: '5',
          maxLength: '5',
          required: false,
          placeholder: 'Leave blank to enter general lobby'
        }),
      ]),
      t('button', {
        textContent: 'Join General Lobby',
        className: 'p-4 border-2 border-black rounded-xl',
        id: 'joinBtn',
        type: 'submit',
      }),
    ]),
    t('div', { id: 'connectedInfo', className: 'flex justify-center items-center gap-8 hidden' }, [
      t('button', {
        // id: 'disconnect',
        textContent: 'Disconnect',
        className: 'border-2 border-black p-4 rounded-xl',
        onclick: () => {
          ws?.close();
          ws = undefined;
          clearContainer('board');
          document.querySelector('#connectedInfo')?.classList.add('hidden');
          document.querySelector('#connectForm')?.classList.remove('hidden');
          document.querySelector('#onScreenControls')?.classList.add('hidden');
        }
      }),
      t('span', { id: 'gameState' }),
      t('span', { id: 'playerCount' }),
    ]),
    // t('div', { className: 'w-0 h-0 border-l-[50px] border-r-[50px] border-b-[100px] border-transparent border-b-blue-500' }),
  ]),
  t('div', { id: 'board', className: 'flex justify-center items-center' }),
  onScreenControls({ changeDirFunc: changeDirection }),
  t('div', { id: 'leaderboard', className: 'w-min mx-auto mb-8' }),
);
