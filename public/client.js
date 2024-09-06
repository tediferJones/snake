// src/lib/getTag.ts
function getTag(type, props, children) {
  const node = document.createElement(type);
  if (props)
    Object.keys(props).forEach((propKey) => node[propKey] = props[propKey]);
  if (children?.length)
    node.append(...children.filter((child) => child != null));
  return node;
}

// src/components/board.ts
function board({ boardSize }) {
  return getTag("div", { className: "w-full mx-8 border-4 border-black flex flex-col bg-gray-200" }, [...Array(boardSize).keys()].map((row) => {
    return getTag("div", { className: "flex flex-1" }, [...Array(boardSize).keys()].map((col) => {
      return getTag("div", {
        id: `cell-${row}-${col}`,
        className: `aspect-square flex-1 flex justify-center items-center border-[1px] border-gray-300`
      });
    }));
  }));
}

// src/components/onScreenControls.ts
function onScreenControls({ changeDirFunc }) {
  return getTag("div", { className: "grid grid-cols-3 mx-auto" }, [
    getTag("div"),
    getTag("div", { className: "aspect-square text-7xl", textContent: "\u2B06", onclick: () => changeDirFunc("ArrowUp") }),
    getTag("div"),
    getTag("div", { className: "aspect-square text-7xl", textContent: "\u2B05", onclick: () => changeDirFunc("ArrowLeft") }),
    getTag("div"),
    getTag("div", { className: "aspect-square text-7xl", textContent: "\u27A1", onclick: () => changeDirFunc("ArrowRight") }),
    getTag("div"),
    getTag("div", { className: "aspect-square text-7xl", textContent: "\u2B07", onclick: () => changeDirFunc("ArrowDown") }),
    getTag("div")
  ]);
}

// src/lib/fromCamelCase.ts
function fromCamelCase(str, isPlural) {
  return str.split("").reduce((str2, char, i) => {
    if (i === 0)
      return char.toUpperCase();
    if ("A" <= char && char <= "Z")
      return `${str2} ${char}`;
    return str2 + char;
  }, "") + (isPlural ? "s" : "");
}

// src/client.ts
var clearContainer = function(id) {
  const element = document.querySelector(`#${id}`);
  if (!element)
    throw Error("Cant find board element");
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
  return element;
};
var invertHexColor = function(hex) {
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const newR = (255 - r).toString(16).padStart(2, "0");
  const newG = (255 - g).toString(16).padStart(2, "0");
  const newB = (255 - b).toString(16).padStart(2, "0");
  return `#${newR}${newG}${newB}`;
};
var changeDirection = function(dir) {
  if (!ws || ws.readyState > 1)
    return;
  console.log("sending websocket msg");
  if (lastMsg?.players[lastMsg.uuid].state !== "playing") {
    return;
  }
  const verticalMoves = ["ArrowUp", "ArrowDown"];
  const horizontalMoves = ["ArrowRight", "ArrowLeft"];
  if (lastMsg) {
    const currentDir = lastMsg.players[lastMsg.uuid].dir;
    console.log("current player dir", currentDir);
    if (verticalMoves.includes(dir) && verticalMoves.includes(currentDir))
      return console.log("ignore vertical move");
    if (horizontalMoves.includes(dir) && horizontalMoves.includes(currentDir))
      return console.log("ignore horizontal move");
  }
  ws.send(JSON.stringify({
    action: "changeDir",
    dir
  }));
};
var submitFunc = function(e) {
  e.preventDefault();
  const { host, protocol } = window.location;
  const color = document.querySelector("#colorPicker").value.slice(1);
  const gameCode = document.querySelector("#gameCode").value.toUpperCase();
  const username = document.querySelector("#username").value;
  document.querySelector("#connectForm")?.classList.add("hidden");
  document.querySelector("#connectedInfo")?.classList.remove("hidden");
  console.log(color);
  ws = new WebSocket(`${protocol === "http:" ? "ws" : "wss"}://${host}?gameCode=${gameCode || "general"}&color=${color}&username=${username}`);
  ws.onmessage = (ws) => {
    const msg = JSON.parse(ws.data);
    lastMsg = msg;
    document.querySelector("#gameState").textContent = fromCamelCase(msg.players[msg.uuid].state);
    document.querySelector("#playerCount").textContent = `Player Count: ${Object.keys(msg.players).length.toString()}`;
    renders[msg.gameState](msg);
  };
};
var ws;
var lastMsg;
var renderDirection = {
  ArrowUp: "-rotate-90",
  ArrowRight: "rotate-0",
  ArrowDown: "rotate-90",
  ArrowLeft: "rotate-180"
};
var roundingDir = {
  ArrowUp: "rounded-t-3xl",
  ArrowRight: "rounded-r-3xl",
  ArrowDown: "rounded-b-3xl",
  ArrowLeft: "rounded-l-3xl"
};
var drawPlayerSet = new Set(["playing", "winner"]);
var renders = {
  running: (msg) => {
    const boardElement = clearContainer("board");
    boardElement.appendChild(board({ boardSize: msg.boardSize }));
    Object.values(msg.players).filter((player) => drawPlayerSet.has(player.state) || drawPlayerSet.has(player.oldState)).forEach((player) => {
      const { pos, color } = player;
      const playerColor = `#${color}`;
      pos.forEach(({ row, col }, i) => {
        const cell = document.querySelector(`#cell-${row}-${col}`);
        cell.style.backgroundColor = playerColor;
        if (i === 0) {
          cell.classList.add(roundingDir[player.dir]);
          cell.appendChild(getTag("div", { className: `h-full w-full flex flex-col justify-center items-center ${renderDirection[player.dir]}` }, [
            getTag("div", { className: "h-1/5 w-1/5 rounded-full", id: `lefteye-${player.uuid}` }),
            getTag("div", { className: "h-1/5 w-1/5" }),
            getTag("div", { className: "h-1/5 w-1/5 rounded-full", id: `righteye-${player.uuid}` })
          ]));
          document.querySelector(`#lefteye-${player.uuid}`).style.backgroundColor = invertHexColor(player.color);
          document.querySelector(`#righteye-${player.uuid}`).style.backgroundColor = invertHexColor(player.color);
        }
        const before = pos[i - 1];
        const after = pos[i + 1];
        if (before) {
          if (before.row < row)
            cell.style.borderTopColor = playerColor;
          if (before.row > row)
            cell.style.borderBottomColor = playerColor;
          if (before.col < col)
            cell.style.borderLeftColor = playerColor;
          if (before.col > col)
            cell.style.borderRightColor = playerColor;
        }
        if (after) {
          if (row < after.row)
            cell.style.borderBottomColor = playerColor;
          if (row > after.row)
            cell.style.borderTopColor = playerColor;
          if (col < after.col)
            cell.style.borderRightColor = playerColor;
          if (col > after.col)
            cell.style.borderLeftColor = playerColor;
        }
        if (before && after) {
          if (before.row < row && after.col < col)
            cell.classList.add("rounded-br-3xl");
          if (before.row < row && after.col > col)
            cell.classList.add("rounded-bl-3xl");
          if (before.row > row && after.col < col)
            cell.classList.add("rounded-tr-3xl");
          if (before.row > row && after.col > col)
            cell.classList.add("rounded-tl-3xl");
          if (row < after.row && col < before.col)
            cell.classList.add("rounded-tl-3xl");
          if (row < after.row && col > before.col)
            cell.classList.add("rounded-tr-3xl");
          if (row > after.row && col < before.col)
            cell.classList.add("rounded-bl-3xl");
          if (row > after.row && col > before.col)
            cell.classList.add("rounded-br-3xl");
        }
      });
    });
    msg.foodLocations.forEach((coor) => {
      document.querySelector(`#cell-${coor.row}-${coor.col}`)?.append(getTag("div", { className: "h-1/2 w-1/2 bg-black rotate-45" }));
    });
  },
  lobby: (msg) => {
    console.log("rendering lobby", msg, msg.players[msg.uuid]);
    const isReady = msg.players[msg.uuid].state === "ready";
    clearContainer("leaderboard");
    const boardElement = clearContainer("board");
    boardElement.appendChild(getTag("div", { className: "flex flex-col gap-8 items-center" }, [
      getTag("div", { textContent: `Players ready: ${Object.values(msg.players).filter((player) => player.state === "ready").length} / ${Object.keys(msg.players).length}` }),
      getTag("div", { className: `p-4 flex justify-center items-center gap-4 bg-gray-200 rounded-xl border-2 border-black` }, [
        getTag("div", { textContent: "Are you ready?" }),
        getTag("button", {
          textContent: "\uD83D\uDD92",
          className: `p-2 text-6xl transition-all duration-1000 border-2 rounded-xl ${isReady ? "bg-green-300 text-green-500 border-green-500" : "rotate-180 bg-red-300 text-red-500 border-red-500"}`,
          onclick: () => {
            console.log("send ready toggle msg to server");
            ws?.send(JSON.stringify({ action: "toggleReady" }));
          }
        })
      ])
    ]));
  },
  done: (msg) => {
    renders.running(msg);
    const rematch = msg.players[msg.uuid].state === "rematch";
    const leaderboard = clearContainer("leaderboard");
    const highlightColor = {
      winner: "bg-yellow-500",
      gameOver: "bg-red-500",
      rematch: "bg-green-500"
    };
    leaderboard.appendChild(getTag("div", { className: "flex flex-col items-center gap-4" }, [
      getTag("div", { textContent: `Players ready: ${Object.values(msg.players).filter((player) => player.state === "rematch").length} / ${Object.keys(msg.players).length}` }),
      getTag("div", { className: `p-4 flex justify-center items-center gap-4 bg-gray-200 rounded-xl border-2 border-black` }, [
        getTag("div", { textContent: "Do you want a rematch?" }),
        getTag("button", {
          textContent: "\uD83D\uDD92",
          className: `p-2 text-6xl transition-all duration-1000 border-2 rounded-xl ${rematch ? "bg-green-300 text-green-500 border-green-500" : "rotate-180 bg-red-300 text-red-500 border-red-500"}`,
          onclick: () => {
            console.log("send ready toggle msg to server");
            ws?.send(JSON.stringify({ action: "toggleRematch" }));
          }
        })
      ]),
      ...Object.values(msg.players).filter((player) => player.pos.length > 0).sort((a, b) => b.pos.length - a.pos.length).map((player, i) => getTag("div", { className: `flex gap-4 items-center justify-between p-4 w-full ${highlightColor[player.state]}` }, [
        getTag("span", { textContent: `${i + 1}.)` }),
        getTag("span", {
          textContent: player.username,
          className: `text-xl font-bold`
        }),
        getTag("span", { textContent: player.pos.length.toString() })
      ]))
    ]));
  }
};
document.addEventListener("keydown", (e) => {
  console.log(e.key, lastMsg);
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    changeDirection(e.key);
  }
});
document.body.className = "flex flex-col gap-8 justify-between max-h-screen w-screen";
document.body.append(getTag("div", { className: "p-8 border-b-2 flex-wrap" }, [
  getTag("form", { id: "connectForm", className: "flex flex-col justify-center items-center gap-8", onsubmit: submitFunc }, [
    getTag("button", {
      textContent: "Join General Lobby",
      className: "p-4 border-4 border-black",
      id: "joinBtn",
      type: "submit"
    }),
    getTag("label", { className: "flex items-center gap-4", textContent: "Pick you color:", htmlFor: "colorPicker" }, [
      getTag("input", {
        id: "colorPicker",
        type: "color",
        value: "#" + [...Array(6).keys()].map(() => Math.floor(Math.random() * 16).toString(16)).join("")
      })
    ]),
    getTag("label", { className: "flex flex-wrap justify-center items-center gap-4", textContent: "Username" }, [
      getTag("input", {
        className: "border-2 border-black p-4",
        id: "username",
        type: "text",
        maxLength: "32",
        required: true,
        value: [...Array(6).keys()].map(() => String.fromCharCode(Math.floor(Math.random() * 57) + 65)).join("")
      })
    ]),
    getTag("label", { className: "flex flex-wrap justify-center items-center gap-4", textContent: "Game Code" }, [
      getTag("input", {
        id: "gameCode",
        className: "border-2 border-black p-4",
        type: "text",
        minLength: "5",
        maxLength: "5",
        required: false,
        placeholder: "Leave blank to enter general lobby"
      })
    ])
  ]),
  getTag("div", { id: "connectedInfo", className: "flex justify-center items-center gap-8 hidden" }, [
    getTag("button", {
      textContent: "Disconnect",
      className: "border-2 border-black p-4 rounded-xl",
      onclick: () => {
        ws?.close();
        ws = undefined;
        clearContainer("board");
        document.querySelector("#connectedInfo")?.classList.add("hidden");
        document.querySelector("#connectForm")?.classList.remove("hidden");
      }
    }),
    getTag("span", { id: "gameState" }),
    getTag("span", { id: "playerCount" })
  ])
]), getTag("div", { id: "board", className: "aspect-square flex justify-center items-center" }), getTag("div", { id: "leaderboard", className: "w-min mx-auto py-8" }), onScreenControls({ changeDirFunc: changeDirection }));
