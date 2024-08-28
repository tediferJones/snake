function x(t,N,m){const k=document.createElement(t);if(N)Object.keys(N).forEach((G)=>k[G]=N[G]);if(m?.length)k.append(...m.filter((G)=>G!=null));return k}function I({boardSize:t}){return x("div",{className:"w-full m-8 border-4 border-black flex flex-col bg-gray-200"},[...Array(t).keys()].map((N)=>{return x("div",{className:"flex flex-1"},[...Array(t).keys()].map((m)=>{return x("div",{id:`cell-${N}-${m}`,className:"aspect-square flex-1 flex justify-center items-center border-[1px] border-gray-300"})}))}))}function J({changeDirFunc:t}){return x("div",{className:"grid grid-cols-3 mx-auto"},[x("div"),x("div",{className:"aspect-square text-7xl",textContent:"\u2B06",onclick:()=>t("ArrowUp")}),x("div"),x("div",{className:"aspect-square text-7xl",textContent:"\u2B05",onclick:()=>t("ArrowLeft")}),x("div"),x("div",{className:"aspect-square text-7xl",textContent:"\u27A1",onclick:()=>t("ArrowRight")}),x("div"),x("div",{className:"aspect-square text-7xl",textContent:"\u2B07",onclick:()=>t("ArrowDown")}),x("div")])}var O=function(t){if(!q||q.readyState>1)return;console.log("sending websocket msg");const N=["ArrowUp","ArrowDown"],m=["ArrowRight","ArrowLeft"];if(f){const k=f.players[f.uuid].dir;if(console.log("current player dir",k),N.includes(t)&&N.includes(k))return console.log("ignore vertical move");if(m.includes(t)&&m.includes(k))return console.log("ignore horizontal move")}q.send(t)},q,f,S={ArrowUp:"-rotate-90",ArrowRight:"rotate-0",ArrowDown:"rotate-90",ArrowLeft:"rotate-180"};document.addEventListener("keydown",(t)=>{if(console.log(t.key,f),["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(t.key))O(t.key)});document.body.className="flex flex-col justify-between max-h-screen";document.body.append(x("div",{className:"p-4 flex justify-between items-center border-b-2"},[x("button",{textContent:"Join General Lobby",className:"p-4 border-4 border-black",onclick:(t)=>{const{host:N,protocol:m}=window.location,k=document.querySelector("#colorPicker").value.slice(1);if(console.log(k),q){q.close(),q=void 0,t.currentTarget.textContent="Join Game";return}t.currentTarget.textContent="Disconnect",q=new WebSocket(`${m==="http:"?"ws":"wss"}://${N}?gameCode=general&color=${k}`),q.onmessage=(G)=>{const L=JSON.parse(G.data);f=L,document.querySelector("#gameOver").textContent="";const U=document.querySelector("#board");if(!U)throw Error("Cant find board element");while(U.firstChild)U.removeChild(U.firstChild);U.appendChild(I({boardSize:L.boardSize})),Object.values(L.players).forEach((v)=>{if(v.state!=="playing"){if(v.uuid===L.uuid)document.querySelector("#gameOver").textContent=v.state;return}const{pos:B,color:R}=v;B.forEach(({row:P,col:Q},H)=>{const u=document.querySelector(`#cell-${P}-${Q}`);if(u.style.backgroundColor=`#${R}`,H===0)u.classList.add("rounded-r-3xl","text-xl",S[v.dir]);const $=B[H-1],j=B[H+1];if($&&j){const A=`#${R}`;if($.row-j.row===0)u.style.borderRightColor=`#${R}`,u.style.borderLeftColor=`#${R}`;else if($.col-j.col===0)u.style.borderTopColor=`#${R}`,u.style.borderBottomColor=`#${R}`;else if($.row-j.row===1)if($.col-j.col===1)u.style.borderRightColor=A,u.style.borderTopColor=A;else u.style.borderLeftColor=A,u.style.borderTopColor=A;else if($.row-j.row===-1)if($.col-j.col===1)u.style.borderRightColor=A,u.style.borderBottomColor=A;else u.style.borderLeftColor=A,u.style.borderBottomColor=A}})}),console.log("rendering food",L.foodLocations),L.foodLocations.forEach((v)=>{document.querySelector(`#cell-${v.row}-${v.col}`)?.append(x("div",{className:"h-1/2 w-1/2 bg-black rotate-45"}))})}}}),x("label",{className:"flex items-center gap-4",textContent:"Pick you color:",htmlFor:"colorPicker"},[x("input",{id:"colorPicker",type:"color",value:"#"+[...Array(6).keys()].map(()=>Math.floor(Math.random()*16).toString(16)).join("")})]),x("span",{id:"gameOver"})]),x("div",{id:"board",className:"aspect-square flex justify-center items-center"}),J({changeDirFunc:O}));
