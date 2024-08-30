function x(u,$,U){const L=document.createElement(u);if($)Object.keys($).forEach((I)=>L[I]=$[I]);if(U?.length)L.append(...U.filter((I)=>I!=null));return L}function X({boardSize:u}){return x("div",{className:"w-full m-8 border-4 border-black flex flex-col bg-gray-200"},[...Array(u).keys()].map(($)=>{return x("div",{className:"flex flex-1"},[...Array(u).keys()].map((U)=>{return x("div",{id:`cell-${$}-${U}`,className:"aspect-square flex-1 flex justify-center items-center border-[1px] border-gray-300"})}))}))}function Y({changeDirFunc:u}){return x("div",{className:"grid grid-cols-3 mx-auto"},[x("div"),x("div",{className:"aspect-square text-7xl",textContent:"\u2B06",onclick:()=>u("ArrowUp")}),x("div"),x("div",{className:"aspect-square text-7xl",textContent:"\u2B05",onclick:()=>u("ArrowLeft")}),x("div"),x("div",{className:"aspect-square text-7xl",textContent:"\u27A1",onclick:()=>u("ArrowRight")}),x("div"),x("div",{className:"aspect-square text-7xl",textContent:"\u2B07",onclick:()=>u("ArrowDown")}),x("div")])}var Z=function(u){const $=parseInt(u.substring(0,2),16),U=parseInt(u.substring(2,4),16),L=parseInt(u.substring(4,6),16),I=(255-$).toString(16).padStart(2,"0"),R=(255-U).toString(16).padStart(2,"0"),S=(255-L).toString(16).padStart(2,"0");return`#${I}${R}${S}`},_=function(u){if(!J||J.readyState>1)return;console.log("sending websocket msg");const $=["ArrowUp","ArrowDown"],U=["ArrowRight","ArrowLeft"];if(Q){const L=Q.players[Q.uuid].dir;if(console.log("current player dir",L),$.includes(u)&&$.includes(L))return console.log("ignore vertical move");if(U.includes(u)&&U.includes(L))return console.log("ignore horizontal move")}J.send(u)},F=function(u){u.preventDefault();const{host:$,protocol:U}=window.location,L=document.querySelector("#colorPicker").value.slice(1),I=document.querySelector("#gameCode").value.toUpperCase(),R=document.querySelector("#joinBtn");if(console.log(L),J){J.close(),J=void 0,R.textContent="Join Game";return}R.textContent="Disconnect",J=new WebSocket(`${U==="http:"?"ws":"wss"}://${$}?gameCode=${I||"general"}&color=${L}`),J.onmessage=(S)=>{const O=JSON.parse(S.data);Q=O,document.querySelector("#gameOver").textContent="",document.querySelector("#playerCount").textContent=`Player Count: ${Object.keys(O.players).length.toString()}`;const P=document.querySelector("#board");if(!P)throw Error("Cant find board element");while(P.firstChild)P.removeChild(P.firstChild);P.appendChild(X({boardSize:O.boardSize})),document.querySelector("#gameOver").textContent=O.players[O.uuid].state,Object.values(O.players).filter((k)=>k.state!=="gameover").forEach((k)=>{const{pos:V,color:j}=k,G=`#${j}`;V.forEach(({row:v,col:m},W)=>{const N=document.querySelector(`#cell-${v}-${m}`);if(N.style.backgroundColor=G,W===0)N.classList.add(T[k.dir]),N.appendChild(x("div",{className:`h-full w-full flex flex-col justify-center items-center ${z[k.dir]}`},[x("div",{className:"h-1/5 w-1/5 rounded-full",id:`lefteye-${k.uuid}`}),x("div",{className:"h-1/5 w-1/5"}),x("div",{className:"h-1/5 w-1/5 rounded-full",id:`righteye-${k.uuid}`})])),document.querySelector(`#lefteye-${k.uuid}`).style.backgroundColor=Z(k.color),document.querySelector(`#righteye-${k.uuid}`).style.backgroundColor=Z(k.color);const A=V[W-1],q=V[W+1];if(A){if(A.row<v)N.style.borderTopColor=G;if(A.row>v)N.style.borderBottomColor=G;if(A.col<m)N.style.borderLeftColor=G;if(A.col>m)N.style.borderRightColor=G}if(q){if(v<q.row)N.style.borderBottomColor=G;if(v>q.row)N.style.borderTopColor=G;if(m<q.col)N.style.borderRightColor=G;if(m>q.col)N.style.borderLeftColor=G}if(A&&q){if(A.row<v&&q.col<m)N.classList.add("rounded-br-3xl");if(A.row<v&&q.col>m)N.classList.add("rounded-bl-3xl");if(A.row>v&&q.col<m)N.classList.add("rounded-tr-3xl");if(A.row>v&&q.col>m)N.classList.add("rounded-tl-3xl");if(v<q.row&&m<A.col)N.classList.add("rounded-tl-3xl");if(v<q.row&&m>A.col)N.classList.add("rounded-tr-3xl");if(v>q.row&&m<A.col)N.classList.add("rounded-bl-3xl");if(v>q.row&&m>A.col)N.classList.add("rounded-br-3xl")}})}),O.foodLocations.forEach((k)=>{document.querySelector(`#cell-${k.row}-${k.col}`)?.append(x("div",{className:"h-1/2 w-1/2 bg-black rotate-45"}))})}},J,Q,z={ArrowUp:"-rotate-90",ArrowRight:"rotate-0",ArrowDown:"rotate-90",ArrowLeft:"rotate-180"},T={ArrowUp:"rounded-t-3xl",ArrowRight:"rounded-r-3xl",ArrowDown:"rounded-b-3xl",ArrowLeft:"rounded-l-3xl"};document.addEventListener("keydown",(u)=>{if(console.log(u.key,Q),["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(u.key))_(u.key)});document.body.className="flex flex-col justify-between max-h-screen";document.body.append(x("form",{className:"p-4 flex justify-between items-center border-b-2",onsubmit:F},[x("button",{textContent:"Join General Lobby",className:"p-4 border-4 border-black",id:"joinBtn",type:"submit"}),x("label",{className:"flex items-center gap-4",textContent:"Pick you color:",htmlFor:"colorPicker"},[x("input",{id:"colorPicker",type:"color",value:"#"+[...Array(6).keys()].map(()=>Math.floor(Math.random()*16).toString(16)).join("")})]),x("label",{className:"flex justify-center items-center gap-4",textContent:"Game Code"},[x("input",{id:"gameCode",className:"border-2 border-black p-4",type:"text",minLength:"5",maxLength:"5",required:!1})]),x("span",{id:"gameOver"}),x("span",{id:"playerCount"})]),x("div",{id:"board",className:"aspect-square flex justify-center items-center"}),Y({changeDirFunc:_}));
