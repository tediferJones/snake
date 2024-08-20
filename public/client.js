function k(A,u,v){const x=document.createElement(A);if(u)Object.keys(u).forEach((j)=>x[j]=u[j]);if(v?.length)x.append(...v.filter((j)=>j!=null));return x}var B;document.body.append(k("button",{textContent:"Join General Lobby",className:"m-4 p-4 border-4 border-black",onclick:()=>{const{host:A,protocol:u}=window.location,v=document.querySelector("#colorPicker").value.slice(1);console.log(v),B=new WebSocket(`${u==="http:"?"ws":"wss"}://${A}?gameCode=general&color=${v}`),B.onmessage=(x)=>{const j=JSON.parse(x.data);console.log(j),document.querySelector("#gameOver").textContent="",document.querySelector("#board")?.remove(),document.body.appendChild(k("div",{id:"board",className:"mx-auto w-min border-4 border-black flex flex-col bg-cyan-500"},[...Array(j.boardSize).keys()].map((z)=>{return k("div",{className:"flex"},[...Array(j.boardSize).keys()].map((q)=>{return k("div",{id:`cell-${z}-${q}`,className:"aspect-square min-h-12"})}))}))),Object.values(j.players).forEach((z)=>{if(z.state==="gameover"){if(z.uuid===j.uuid)document.querySelector("#gameOver").textContent="Game Over";return}const{pos:q,color:D}=z;console.log(q.row,q.col,D),document.querySelector(`#cell-${q.row}-${q.col}`).style.backgroundColor=`#${D}`})}}}),k("input",{id:"colorPicker",type:"color"}),k("button",{textContent:"Disconnect",className:"m-4 p-4 border-4 border-black",onclick:()=>B?.close()}),k("span",{id:"gameOver"}));
