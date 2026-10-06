const KEY = "ironlog_v1";
const days = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const defaultData = {
  workouts: {
    A:{name:"Treino A", exercises:["Supino reto","Remada baixa","Elevação lateral"]},
    B:{name:"Treino B", exercises:["Agachamento","Leg press","Mesa flexora"]},
    C:{name:"Treino C", exercises:["Desenvolvimento","Puxada alta","Rosca direta"]},
    D:{name:"Treino D", exercises:[]}, E:{name:"Treino E", exercises:[]}, F:{name:"Treino F", exercises:[]}
  },
  schedule:{}, sessions:[]
};
let data = JSON.parse(localStorage.getItem(KEY) || "null") || structuredClone(defaultData);
let chart;

function save(){localStorage.setItem(KEY,JSON.stringify(data));}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function today(){return new Date();}
function isoDate(d){return d.toISOString().slice(0,10);}
function getDayKey(date){return isoDate(date);}
function showPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active-page"));
  document.getElementById(id).classList.add("active-page");
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
  document.getElementById("pageTitle").textContent={dashboard:"Dashboard",workouts:"Treinos",week:"Semana",progress:"Progresso"}[id];
  if(id==="dashboard") renderDashboard();
  if(id==="workouts") renderWorkouts();
  if(id==="week") renderWeek();
  if(id==="progress") renderProgress();
}
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
document.querySelectorAll("[data-page-link]").forEach(b=>b.onclick=()=>showPage(b.dataset.pageLink));

function openModal(html){document.getElementById("modalContent").innerHTML=html;document.getElementById("modal").classList.remove("hidden");}
function closeModal(){document.getElementById("modal").classList.add("hidden");}
document.getElementById("closeModal").onclick=closeModal;
document.querySelector(".modal-backdrop").onclick=closeModal;

function renderDashboard(){
  const sessions=data.sessions;
  const volume=sessions.reduce((a,s)=>a+s.sets.reduce((x,z)=>x+(+z.weight||0)*(+z.reps||0),0),0);
  const exerciseSet=new Set(Object.values(data.workouts).flatMap(w=>w.exercises));
  const prs={}; sessions.forEach(s=>s.sets.forEach(z=>{prs[z.exercise]=Math.max(prs[z.exercise]||0,+z.weight||0)}));
  document.getElementById("statWorkouts").textContent=sessions.length;
  document.getElementById("statVolume").textContent=Math.round(volume).toLocaleString("pt-BR")+" kg";
  document.getElementById("statExercises").textContent=exerciseSet.size;
  document.getElementById("heroPR").textContent=Object.keys(prs).length;
  document.getElementById("statStreak").textContent=calcStreak()+" dias";
  const now=today(), start=new Date(now); start.setDate(now.getDate()-now.getDay());
  let html="";
  for(let i=0;i<7;i++){let d=new Date(start);d.setDate(start.getDate()+i);let k=isoDate(d), a=data.schedule[k];
    html+=`<div class="day-mini ${isoDate(now)===k?"today":""}"><div class="day-name">${days[d.getDay()]}</div><div class="day-number">${d.getDate()}</div><div class="day-workout">${a?esc(data.workouts[a]?.name||a):"—"}</div></div>`;
  }
  document.getElementById("miniWeek").innerHTML=html;
  const recent=[...sessions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  document.getElementById("recentList").innerHTML=recent.length?recent.map(s=>`<div class="recent-item"><div><div class="item-title">${esc(s.workoutName)}</div><div class="item-sub">${formatDate(s.date)} · ${s.sets.length} séries</div></div><span class="badge">${Math.round(s.sets.reduce((x,z)=>x+(+z.weight||0)*(+z.reps||0),0))} kg</span></div>`).join(""):`<div class="empty">Nenhum treino registrado ainda.</div>`;
}
function calcStreak(){let set=new Set(data.sessions.map(s=>s.date));let d=today(), count=0;if(!set.has(isoDate(d)))d.setDate(d.getDate()-1);while(set.has(isoDate(d))){count++;d.setDate(d.getDate()-1)}return count;}
function formatDate(s){return new Date(s+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});}

function renderWorkouts(){
  document.getElementById("workoutCards").innerHTML=Object.entries(data.workouts).map(([key,w])=>`
    <div class="workout-card">
      <div class="workout-letter">TREINO ${key}</div><h3>${esc(w.name)}</h3>
      <div class="exercise-count">${w.exercises.length} exercício${w.exercises.length===1?"":"s"}</div>
      <div class="card-actions"><button class="secondary" onclick="editWorkout('${key}')">Editar</button><button class="primary" onclick="startWorkout('${key}')">Registrar</button></div>
    </div>`).join("");
}
function editWorkout(key){
  const w=data.workouts[key];
  openModal(`<p class="eyebrow green">TREINO ${key}</p><h2>Editar exercícios</h2>
    <div class="field"><label>NOME</label><input id="wname" value="${esc(w.name)}"></div>
    <div id="exerciseEdit">${w.exercises.map((e,i)=>`<div class="exercise-row"><div class="set-row"><input class="ex-name" value="${esc(e)}"><button class="remove" onclick="this.closest('.exercise-row').remove()">×</button></div></div>`).join("")}</div>
    <button class="secondary" onclick="addExerciseEdit()">＋ Adicionar exercício</button>
    <div class="modal-footer"><button class="secondary" onclick="closeModal()">Cancelar</button><button class="primary" onclick="saveWorkout('${key}')">Salvar</button></div>`);
}
function addExerciseEdit(){document.getElementById("exerciseEdit").insertAdjacentHTML("beforeend",`<div class="exercise-row"><div class="set-row"><input class="ex-name" placeholder="Nome do exercício"><button class="remove" onclick="this.closest('.exercise-row').remove()">×</button></div></div>`);}
function saveWorkout(key){data.workouts[key].name=document.getElementById("wname").value.trim()||`Treino ${key}`;data.workouts[key].exercises=[...document.querySelectorAll(".ex-name")].map(x=>x.value.trim()).filter(Boolean);save();closeModal();renderWorkouts();}

function startWorkout(key,date=isoDate(today())){
  const w=data.workouts[key];
  if(!w.exercises.length){editWorkout(key);return;}
  const rows=w.exercises.map((e,i)=>`<div class="exercise-row"><div class="exercise-top"><strong>${esc(e)}</strong><button class="secondary" onclick="addSet(${i})">＋ série</button></div><div id="sets-${i}"><div class="set-row"><input type="number" min="0" step=".5" placeholder="Peso (kg)"><input type="number" min="0" step="1" placeholder="Reps"><button class="remove" onclick="this.parentElement.remove()">×</button></div></div></div>`).join("");
  openModal(`<p class="eyebrow green">${esc(w.name)}</p><h2>Registrar treino</h2><div class="muted">Data: ${formatDate(date)}</div><div id="sessionExercises">${rows}</div>
    <div class="modal-footer"><button class="secondary" onclick="closeModal()">Cancelar</button><button class="primary" onclick="saveSession('${key}','${date}')">Concluir treino</button></div>`);
}
function addSet(i){document.getElementById(`sets-${i}`).insertAdjacentHTML("beforeend",`<div class="set-row"><input type="number" min="0" step=".5" placeholder="Peso (kg)"><input type="number" min="0" step="1" placeholder="Reps"><button class="remove" onclick="this.parentElement.remove()">×</button></div>`);}
function saveSession(key,date){
  const sets=[];document.querySelectorAll("#sessionExercises .exercise-row").forEach((row)=>{
    const exercise=row.querySelector("strong").textContent;
    row.querySelectorAll(".set-row").forEach(r=>{const inputs=r.querySelectorAll("input"),weight=+inputs[0].value,reps=+inputs[1].value;if(weight>0&&reps>0)sets.push({exercise,weight,reps});});
  });
  if(!sets.length){alert("Registre pelo menos uma série.");return;}
  data.sessions.push({id:Date.now(),date,workout:key,workoutName:data.workouts[key].name,sets});save();closeModal();renderDashboard();
  alert("Treino salvo! 💪");
}
function renderWeek(){
  const now=today(), start=new Date(now);start.setDate(now.getDate()-now.getDay());
  let html="";
  for(let i=0;i<7;i++){let d=new Date(start);d.setDate(start.getDate()+i);let k=isoDate(d), assigned=data.schedule[k];
    html+=`<div class="week-day ${isoDate(now)===k?"today":""}"><h3>${days[d.getDay()]}</h3><div class="date">${d.getDate()}</div>
      ${assigned?`<div class="assigned"><strong>${assigned}</strong><span>${esc(data.workouts[assigned]?.name||"Treino")}</span></div><button class="primary" style="width:100%;font-size:11px;padding:9px" onclick="startWorkout('${assigned}','${k}')">Registrar</button><button class="add-day" style="margin-top:7px" onclick="chooseWorkout('${k}')">Trocar treino</button>`:`<button class="add-day" onclick="chooseWorkout('${k}')">＋ Add treino</button>`}</div>`;
  }
  document.getElementById("weekGrid").innerHTML=html;
}
function chooseWorkout(date){
  openModal(`<p class="eyebrow green">AGENDA</p><h2>Adicionar treino</h2><p class="muted">${formatDate(date)}</p><div class="field"><label>ESCOLHA O TREINO</label><select id="chooseWorkout">${Object.entries(data.workouts).map(([k,w])=>`<option value="${k}">${k} — ${esc(w.name)}</option>`).join("")}</select></div><div class="modal-footer"><button class="secondary" onclick="closeModal()">Cancelar</button><button class="primary" onclick="assignWorkout('${date}')">Adicionar</button></div>`);
}
function assignWorkout(date){data.schedule[date]=document.getElementById("chooseWorkout").value;save();closeModal();renderWeek();renderDashboard();}

function allExercises(){return [...new Set(Object.values(data.workouts).flatMap(w=>w.exercises))];}
function renderProgress(){
  const sel=document.getElementById("exerciseSelect"), old=sel.value, ex=allExercises();
  sel.innerHTML=ex.length?ex.map(e=>`<option value="${esc(e)}">${esc(e)}</option>`).join(""):`<option>Sem exercícios</option>`;
  if(ex.includes(old))sel.value=old;
  sel.onchange=drawChart; drawChart();
  const prs={};data.sessions.forEach(s=>s.sets.forEach(z=>prs[z.exercise]=Math.max(prs[z.exercise]||0,+z.weight||0)));
  document.getElementById("prsList").innerHTML=Object.entries(prs).sort((a,b)=>b[1]-a[1]).map(([e,v])=>`<div class="pr-item"><span class="item-title">${esc(e)}</span><strong class="green">${v} kg</strong></div>`).join("")||`<div class="empty">Nenhum PR ainda.</div>`;
  const vols=[...data.sessions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7);
  document.getElementById("volumeList").innerHTML=vols.map(s=>`<div class="volume-item"><span><span class="item-title">${esc(s.workoutName)}</span><div class="item-sub">${formatDate(s.date)}</div></span><strong>${Math.round(s.sets.reduce((x,z)=>x+z.weight*z.reps,0))} kg</strong></div>`).join("")||`<div class="empty">Nenhuma sessão.</div>`;
}
function drawChart(){
  const ex=document.getElementById("exerciseSelect").value, points=[];
  data.sessions.slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(s=>{const rows=s.sets.filter(z=>z.exercise===ex);if(rows.length)points.push({x:formatDate(s.date),y:Math.max(...rows.map(z=>+z.weight))})});
  const empty=document.getElementById("chartEmpty");empty.style.display=points.length<2?"grid":"none";
  if(chart)chart.destroy();
  chart=new Chart(document.getElementById("progressChart"),{type:"line",data:{labels:points.map(p=>p.x),datasets:[{label:"Maior peso (kg)",data:points.map(p=>p.y),borderColor:"#39e875",backgroundColor:"#39e87518",tension:.35,fill:true,pointRadius:4,pointBackgroundColor:"#39e875"}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:"#849089"}}},scales:{x:{ticks:{color:"#849089"},grid:{color:"#172019"}},y:{ticks:{color:"#849089"},grid:{color:"#172019"}}}}});
}

document.getElementById("quickAdd").onclick=()=>chooseWorkout(isoDate(today()));
document.getElementById("resetData").onclick=()=>{if(confirm("Isso apagará todos os seus registros. Continuar?")){localStorage.removeItem(KEY);data=structuredClone(defaultData);showPage("dashboard");}};
renderDashboard();
