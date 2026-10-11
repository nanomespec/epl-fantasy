/* =========
   Data / constants
   ========= */
const PLAYERS = [
  { id:1, name:"Abebe Tilahun", pos:"GK", club:"St. George", price:4.5, points:28, bio:"Reliable keeper." },
  { id:2, name:"Bahiru Negash", pos:"GK", club:"Ethiopia Bunna", price:4.5, points:24, bio:"Agile shot-stopper." },
  { id:3, name:"Aschalew Tamene", pos:"DEF", club:"Fasil Kenema", price:5.0, points:42, bio:"Ball-playing center back." },
  { id:4, name:"Yared Bayeh", pos:"DEF", club:"Bahir Dar", price:5.0, points:38, bio:"Strong in duels." },
  { id:5, name:"Suleman Hamid", pos:"DEF", club:"St. George", price:4.5, points:31, bio:"Attacking fullback." },
  { id:6, name:"Henok Gebre", pos:"DEF", club:"Ethiopia Bunna", price:4.5, points:29, bio:"Consistent starter." },
  { id:7, name:"Ramkel Lok", pos:"DEF", club:"EEPCO", price:4.0, points:18, bio:"Young prospect." },
  { id:8, name:"Gatoch Panom", pos:"MID", club:"St. George", price:6.0, points:55, bio:"Creative midfielder." },
  { id:9, name:"Surafel Dagnachew", pos:"MID", club:"Fasil Kenema", price:6.5, points:61, bio:"Box-to-box engine." },
  { id:10, name:"Amanuel Yohannes", pos:"MID", club:"Ethiopia Bunna", price:6.0, points:48, bio:"Set-piece threat." },
  { id:11, name:"Canaan Markneh", pos:"MID", club:"Defense Force", price:5.5, points:39, bio:"Tidy passer." },
  { id:12, name:"Biniyam Fikre", pos:"MID", club:"Sidama Bunna", price:5.0, points:32, bio:"Good work rate." },
  { id:13, name:"Getaneh Kebede", pos:"FWD", club:"Wolkite", price:7.0, points:68, bio:"Prolific striker." },
  { id:14, name:"Abel Yalew", pos:"FWD", club:"Mechal", price:7.5, points:74, bio:"Clinical finisher." },
  { id:15, name:"Dawa Hotessa", pos:"FWD", club:"Adama City", price:6.5, points:52, bio:"Strong hold-up play." },
  { id:16, name:"Chernet Gugsa", pos:"FWD", club:"St. George", price:6.0, points:45, bio:"Pacy forward." }
];

const SQUAD_RULES = { GK:2, DEF:5, MID:5, FWD:3 };
const MAX_SQUAD = 15;
const BUDGET = 100.0;
const MAX_CLUB = 3;
const HIT = 4;
const CHIPS = ['wildcard','freeHit','tripleCaptain','benchBoost'];

/* =========
   App state
   ========= */
const defaultState = {
  activeTab: 'pick-team',
  squad: [1,2,3,4,5,6,8,9,10,11,12,13,14,15,16], // prefilled 15
  purchasePrices: {}, // track buy prices
  startingXI: [],
  bench: [],
  captainId: 14,
  viceCaptainId: 9,
  bank: BUDGET,
  freeTransfers: 1,
  transfersMade: 0,
  transferPenalty: 0,
  activeChip: null,
  usedChips: [],
  savedFreeHit: null,
  gameweek: 1,
  pending: [],
  history: [],
  marketFilter: 'All',
  marketSearch: '',
  seenWelcome: false,
  _gwCaptainOverride: null
};

let state = {};
const STORAGE_KEY = 'epl_v7_state';
let pendingCounter = Date.now();

/* =========
   Helpers
   ========= */
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e){} }
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { state = JSON.parse(JSON.stringify(defaultState)); return; }
    state = Object.assign(JSON.parse(JSON.stringify(defaultState)), JSON.parse(raw));
  } catch(e){ state = JSON.parse(JSON.stringify(defaultState)); }
}
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function byId(id){ return document.getElementById(id); }
function playerById(id){ return PLAYERS.find(p=>p.id===id); }
function escapeHtml(s=''){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function recalcBank(){
  const spent = state.squad.reduce((s,id)=>{
    const p = playerById(id); const price = state.purchasePrices[id] !== undefined ? state.purchasePrices[id] : (p? p.price : 0);
    return s + price;
  },0);
  state.bank = parseFloat((BUDGET - spent).toFixed(1));
}

function updatePenalty(){
  if (state.gameweek===1 || state.activeChip==='wildcard' || state.activeChip==='freeHit'){ state.transferPenalty = 0; return; }
  const excess = Math.max(0, state.transfersMade - state.freeTransfers);
  state.transferPenalty = excess * HIT;
}

function squadCounts(){
  const c = { GK:0, DEF:0, MID:0, FWD:0 };
  state.squad.forEach(id=>{ const p = playerById(id); if (p) c[p.pos]++; });
  return c;
}

function clubCounts(squad = state.squad){
  const counts = {};
  squad.forEach(id=>{ const p = playerById(id); if (!p) return; counts[p.club] = (counts[p.club]||0)+1; });
  return counts;
}

function sellingPrice(p){
  const buy = state.purchasePrices[p.id] !== undefined ? state.purchasePrices[p.id] : p.price;
  if (p.price > buy){
    const profit = p.price - buy;
    const half = Math.floor((profit*10)/2)/10;
    return parseFloat((buy + half).toFixed(1));
  }
  return p.price;
}

/* =========
   Auto XI and bench
   ========= */
const FORMATIONS = [
  {def:3,mid:4,fwd:3},
  {def:3,mid:5,fwd:2},
  {def:4,mid:4,fwd:2},
  {def:4,mid:3,fwd:3},
  {def:5,mid:3,fwd:2},
  {def:5,mid:4,fwd:1}
];

function autoAssign(){
  state.startingXI = [];
  state.bench = [];
  const team = state.squad.map(playerById).filter(Boolean);
  if (!team.length) return;

  const gk = team.filter(p=>p.pos==='GK').sort((a,b)=>b.points-a.points);
  const def = team.filter(p=>p.pos==='DEF').sort((a,b)=>b.points-a.points);
  const mid = team.filter(p=>p.pos==='MID').sort((a,b)=>b.points-a.points);
  const fwd = team.filter(p=>p.pos==='FWD').sort((a,b)=>b.points-a.points);

  if (!gk.length){ state.startingXI = []; state.bench = [...state.squad]; return; }

  let best = {total:-Infinity, starters:[]};
  FORMATIONS.forEach(f=>{
    if (def.length < f.def || mid.length < f.mid || fwd.length < f.fwd) return;
    const starters = [gk[0], ...def.slice(0,f.def), ...mid.slice(0,f.mid), ...fwd.slice(0,f.fwd)];
    if (starters.length !== 11) return;
    const total = starters.reduce((s,p)=>s+p.points,0);
    if (total > best.total) best = {total, starters:starters.map(p=>p.id)};
  });

  if (best.total===-Infinity){
    const out = team.filter(p=>p.pos!=='GK').sort((a,b)=>b.points-a.points);
    state.startingXI = [gk[0].id, ...out.slice(0,10).map(p=>p.id)];
  } else state.startingXI = best.starters;

  state.bench = state.squad.filter(id => !state.startingXI.includes(id));
  if (!state.captainId && state.startingXI.length) state.captainId = state.startingXI[0];
  if (!state.viceCaptainId && state.startingXI.length>1) state.viceCaptainId = state.startingXI[1];
}

/* =========
   Modal helpers
   ========= */
function ensureModal(){
  let root = byId('app-modal-root');
  if (!root){ root = document.createElement('div'); root.id='app-modal-root'; document.body.appendChild(root); }
  return root;
}
function showModal(title, bodyHtml, confirmText='OK', onConfirm=null, onCancel=null, hideCancel=false){
  const root = ensureModal();
  root.innerHTML = `<div class="modal-overlay" role="dialog" aria-modal="true">
    <div class="modal-card">
      <div class="modal-header"><div class="modal-title">${escapeHtml(title)}</div><button id="modal-close" class="small-btn" title="Close">✕</button></div>
      <div class="modal-body">${bodyHtml}</div>
      <div class="modal-actions">${hideCancel ? '' : '<button id="modal-cancel" class="btn btn-ghost">Cancel</button>'}<button id="modal-confirm" class="btn btn-primary">${escapeHtml(confirmText)}</button></div>
    </div>
  </div>`;
  root.style.display='block';
  const clean = ()=>{ root.innerHTML=''; root.style.display='none'; };

  byId('modal-close')?.addEventListener('click', ()=>{ clean(); if (onCancel) onCancel(); });
  byId('modal-cancel')?.addEventListener('click', ()=>{ clean(); if (onCancel) onCancel(); });
  byId('modal-confirm')?.addEventListener('click', ()=>{ clean(); if (onConfirm) onConfirm(); });
}
function showAlert(msg){ showModal('Notice', `<div style="white-space:pre-wrap">${escapeHtml(msg)}</div>`, 'Close', null, null, true); }
function showConfirm(msg, onYes, onNo){ showModal('Confirm', `<div>${escapeHtml(msg)}</div>`, 'Yes', onYes, onNo, false); }

/* =========
   Pending/preview/apply
   ========= */
function stageBuy(id){
  if (state.pending.some(t=>t.type==='buy'&&t.playerId===id)){ showAlert('Already staged.'); return; }
  state.pending.push({id:++pendingCounter,type:'buy',playerId:id,ts:Date.now(),rem:false});
  render();
}
function stageSell(id){
  if (!state.squad.includes(id)){ showAlert('Not in squad'); return; }
  if (state.pending.some(t=>t.type==='sell'&&t.playerId===id)){ showAlert('Already staged'); return; }
  state.pending.push({id:++pendingCounter,type:'sell',playerId:id,ts:Date.now(),rem:false});
  render();
}
function removePending(id){
  const idx = state.pending.findIndex(t=>t.id===id); if (idx===-1) return;
  state.pending[idx].rem = true; render();
  setTimeout(()=>{ state.pending = state.pending.filter(t=>t.id!==id); render(); },260);
}
function clearPending(){
  if (!state.pending.length) return;
  showConfirm('Clear all staged transfers?', ()=>{
    state.pending.forEach(t=>t.rem=true); render();
    setTimeout(()=>{ state.pending=[]; render(); },260);
  }, null);
}

function calcPreview(extra=null){
  const staged = [...state.pending];
  if (extra) staged.push({id:'hyp',type:extra.type,playerId:extra.playerId});
  let future = [...state.squad];
  staged.filter(t=>t.type==='sell').forEach(t=>{ future = future.filter(id=>id!==t.playerId); });
  staged.filter(t=>t.type==='buy').forEach(t=>{ if (!future.includes(t.playerId)) future.push(t.playerId); });
  const buys = staged.filter(t=>t.type==='buy').map(t=>playerById(t.playerId)).filter(Boolean);
  const sells = staged.filter(t=>t.type==='sell').map(t=>playerById(t.playerId)).filter(Boolean);
  const sumBuy = buys.reduce((s,p)=>s+p.price,0);
  const sumSell = sells.reduce((s,p)=>s+sellingPrice(p),0);
  const projectedBank = parseFloat((state.bank - sumBuy + sumSell).toFixed(1));
  const pendingCount = staged.length;
  const usingWC = state.activeChip==='wildcard';
  const usingFH = state.activeChip==='freeHit';
  let projectedTransfersMade = state.transfersMade + pendingCount;
  let extraTransfers = 0;
  if (!usingWC && !usingFH) extraTransfers = Math.max(0, projectedTransfersMade - state.freeTransfers);
  return {
    projectedBank,
    projectedHits: extraTransfers * HIT,
    transfersApplied: pendingCount,
    projectedValue: parseFloat(computeSquadValue(future).toFixed(1)),
    projectedClubs: clubCounts(future),
    buys, sells
  };
}

function applyPending(){
  if (!state.pending.length){ showAlert('No staged transfers.'); return; }
  const usingWC = state.activeChip==='wildcard';
  const usingFH = state.activeChip==='freeHit';
  let applied = 0;
  // process sells first
  const sells = state.pending.filter(t=>t.type==='sell');
  sells.forEach(t=>{
    const p = playerById(t.playerId);
    if (!p || !state.squad.includes(p.id)) return;
    const soldFor = sellingPrice(p);
    state.squad = state.squad.filter(id=>id!==p.id);
    delete state.purchasePrices[p.id];
    state.bank = parseFloat((state.bank + soldFor).toFixed(1));
    applied++;
  });
  // process buys
  const buys = state.pending.filter(t=>t.type==='buy');
  buys.forEach(t=>{
    const p = playerById(t.playerId);
    if (!p) return;
    const check = canAdd(p);
    if (!check.allowed){ showAlert(`Cannot buy ${p.name}: ${check.reason}`); return; }
    state.squad.push(p.id);
    state.purchasePrices[p.id] = p.price;
    state.bank = parseFloat((state.bank - p.price).toFixed(1));
    applied++;
  });
  if (!usingWC && !usingFH) state.transfersMade += applied;
  state.pending = [];
  recalcBank(); updatePenalty(); autoAssign(); save(); render(); showAlert(`Applied ${applied} transfers.`);
}

/* =========
   Replacement suggestions
   ========= */
function canAdd(player){
  if (state.squad.includes(player.id)) return {allowed:false,reason:'Already in squad'}
  if (state.squad.length >= MAX_SQUAD) return {allowed:false,reason:'Squad full (15)'}
  if (state.bank < player.price) return {allowed:false,reason:'Insufficient budget'}
  const posCount = state.squad.filter(id=>playerById(id).pos===player.pos).length;
  if (posCount >= SQUAD_RULES[player.pos]) return {allowed:false,reason:`Max ${SQUAD_RULES[player.pos]} ${player.pos}s`}
  const clubCount = state.squad.filter(id=>playerById(id).club===player.club).length;
  if (clubCount >= MAX_CLUB) return {allowed:false,reason:`Max ${MAX_CLUB} from ${player.club}`}
  return {allowed:true}
}

function findReplacements(targetId){
  const target = playerById(targetId);
  if (!target) return {direct:[],swaps:[]};
  const direct = PLAYERS.filter(p=>!state.squad.includes(p.id) && p.pos===target.pos && p.id!==targetId).sort((a,b)=>b.points-a.points).slice(0,8);
  const sellCandidates = state.squad.map(playerById).filter(Boolean).filter(p=>p.pos===target.pos).sort((a,b)=>a.points-b.points).slice(0,8);
  const swaps = [];
  direct.forEach(d=>{
    if (canAdd(d).allowed) swaps.push({buy:d,sell:null,reason:'Affordable'});
    else{
      for (const s of sellCandidates){
        const temp = state.bank + sellingPrice(s);
        if (temp >= d.price){ swaps.push({buy:d,sell:s,reason:`Sell ${s.name} to afford`}); break; }
      }
    }
  });
  return {direct, swaps};
}

/* =========
   Scoring & GW
   ========= */
function normalize(s={}){ return {
  minutes:Number(s.minutes||0),goals:Number(s.goals||0),assists:Number(s.assists||0),conceded:Number(s.conceded||0),
  saves:Number(s.saves||0),yellow:Number(s.yellow||0),red:Number(s.red||0),ownGoal:Number(s.ownGoal||0),
  penSave:Number(s.penSave||0),penMiss:Number(s.penMiss||0),bonus:Number(s.bonus||0),cbi:Number(s.cbi||0),recoveries:Number(s.recoveries||0)
}}

function formationOk(starters){
  const players = starters.map(playerById).filter(Boolean);
  const counts={GK:0,DEF:0,MID:0,FWD:0}; players.forEach(p=>counts[p.pos]++);
  return counts.GK===1 && counts.DEF>=3 && counts.FWD>=1 && players.length===11;
}

function autoSubs(playedData){
  const stats = {}; for (const k in playedData) stats[Number(k)] = normalize(playedData[k]);
  let starters = [...state.startingXI]; let bench = [...state.bench];
  // GK swap
  const gk = starters.find(id=>playerById(id).pos==='GK');
  if (gk){
    const gs = stats[gk]||{minutes:0};
    if ((gs.minutes||0)===0){
      for (let i=0;i<bench.length;i++){
        const bid = bench[i]; const b=playerById(bid);
        if (!b || b.pos!=='GK') continue;
        const bs = stats[bid]||{minutes:0}; if ((bs.minutes||0)>0){ starters[starters.indexOf(gk)]=bid; bench[i]=gk; break; }
      }
    }
  }
  // outfield swaps
  for (let i=0;i<starters.length;i++){
    const sid = starters[i]; const p=playerById(sid); if(!p||p.pos==='GK') continue;
    const sStats = stats[sid]||{minutes:0}; if ((sStats.minutes||0)>0) continue;
    let cand=-1;
    for (let bi=0;bi<bench.length;bi++){
      const bid = bench[bi]; const b=playerById(bid); if(!b) continue;
      const bStats = stats[bid]||{minutes:0}; if ((bStats.minutes||0)===0) continue;
      const sim=starters.slice(); sim[i]=bid; if (formationOk(sim)){ cand=bi; break; }
    }
    if (cand!==-1){ const bid=bench[cand]; starters[i]=bid; bench[cand]=sid; }
  }
  state.startingXI = starters; state.bench = bench;
  const capStats = stats[state.captainId]||{minutes:0}; const vcStats = stats[state.viceCaptainId]||{minutes:0};
  state._gwCaptainOverride = ((capStats.minutes||0)===0 && (vcStats.minutes||0)>0) ? state.viceCaptainId : null;
  save();
}

function playerPoints(player,stat){
  const m = normalize(stat||{}); let pts=0;
  if (m.minutes>=60) pts+=2; else if (m.minutes>0) pts+=1;
  if (m.goals>0){ if (player.pos==='GK') pts+=10*m.goals; else if (player.pos==='DEF') pts+=6*m.goals; else if (player.pos==='MID') pts+=5*m.goals; else pts+=4*m.goals; }
  pts += 3 * m.assists;
  if (m.minutes>=60){
    if ((player.pos==='GK' || player.pos==='DEF') && m.conceded===0) pts+=4;
    else if (player.pos==='MID' && m.conceded===0) pts+=1;
  }
  if (player.pos==='GK' && m.saves) pts += Math.floor(m.saves/3);
  if (player.pos==='DEF' && (m.cbi||0)>=10) pts+=2;
  if ((player.pos==='MID' || player.pos==='FWD') && ((m.cbi||0)+(m.recoveries||0) >= 12)) pts+=2;
  pts += (m.penSave||0)*5; pts += (m.penMiss||0)*-2; pts += (m.bonus||0);
  if ((player.pos==='GK' || player.pos==='DEF') && m.conceded) pts -= Math.floor(m.conceded/2);
  pts -= (m.yellow||0)*1; pts -= (m.red||0)*3; pts -= (m.ownGoal||0)*2;
  return pts;
}

function finalizeGW(playedData){
  if (!playedData || typeof playedData !== 'object'){ showAlert('Invalid playedData JSON'); return; }
  applyAutomaticSubstitutionsWrapper(playedData);
  const stats = {}; for (const k in playedData) stats[Number(k)] = normalize(playedData[k]);
  let gross=0; const per = {}; const cap = state._gwCaptainOverride || state.captainId;
  state.startingXI.forEach(id=>{
    const p = playerById(id); if (!p) return;
    let pts = playerPoints(p, stats[id]||{});
    if (id===cap){ if (state.activeChip==='tripleCaptain') pts*=3; else pts*=2; }
    per[id]=pts; gross += pts;
  });
  if (state.activeChip==='benchBoost'){
    state.bench.forEach(id=>{ const p=playerById(id); if(!p) return; const pts=playerPoints(p,stats[id]||{}); per[id]=pts; gross+=pts; });
  } else { state.bench.forEach(id=>{ const p=playerById(id); if(!p) return; per[id]=playerPoints(p,stats[id]||{}); }); }
  const hits = state.transferPenalty || 0; const net = gross - hits;
  const res = { gw: state.gameweek, gross, hits, net, per, starters:[...state.startingXI], bench:[...state.bench], captain:cap, chip:state.activeChip };
  state.history.push(res);
  if (state.activeChip==='freeHit' && state.savedFreeHit) { state.squad = [...state.savedFreeHit]; state.savedFreeHit = null; }
  if (state.activeChip && !state.usedChips.includes(state.activeChip)) state.usedChips.push(state.activeChip);
  state.activeChip = null; state.lastTransferConfirmed = false; state.transfersMade = 0; state.transferPenalty = 0;
  autoAssign(); save(); render(); showAlert(`Gameweek ${res.gw} finalised.\nGross ${gross} • Hits -${hits} • Net ${net}`);
}

/* wrapper to preserve naming */
function applyAutomaticSubstitutionsWrapper(playedData){
  autoSubs(playedData);
}

/* =========
   Chip logic
   ========= */
function canActivateChip(chip){
  if (!CHIPS.includes(chip)) return {ok:false,reason:'Unknown chip'};
  if (state.usedChips.includes(chip)) return {ok:false,reason:'Chip already used'};
  if (state.activeChip && state.activeChip!==chip) return {ok:false,reason:'Another chip active this GW'};
  if (state.gameweek>1 && !state.lastTransferConfirmed) return {ok:false,reason:'Confirm a transfer before activating a chip in later GWs'};
  return {ok:true};
}

function toggleChip(chip){
  const check = canActivateChip(chip);
  if (!check.ok){ showAlert(check.reason); return; }
  if (state.activeChip===chip){
    if (chip==='freeHit' && state.savedFreeHit) { state.squad = [...state.savedFreeHit]; state.savedFreeHit=null; autoAssign(); }
    state.activeChip=null; save(); render(); showAlert(`${chip} cancelled`); return;
  }
  if (chip==='freeHit') state.savedFreeHit = [...state.squad];
  state.activeChip = chip; state.lastTransferConfirmed=false; save(); render(); showAlert(`${chip} activated`);
}

/* =========
   Renderers
   ========= */
function renderHeader(){
  const val = computeSquadValue(state.squad).toFixed(1);
  const ft = state.gameweek===1 ? 'Unlimited' : `${state.freeTransfers} FT`;
  const hits = state.transferPenalty>0 ? `-${state.transferPenalty} pts` : '0 pts';
  return `
    <div class="topbar">
      <div class="brand"><h1>EPL Fantasy</h1><div class="gw-pill">GW ${state.gameweek}</div></div>
      <div class="top-stats">
        <div class="stat">Bank <strong>Br ${state.bank.toFixed(1)}M</strong></div>
        <div class="stat">Value <strong>Br ${val}M</strong></div>
        <div class="stat">Transfers <strong>${ft}</strong></div>
        <div class="stat">Hits <strong>${hits}</strong></div>
        <div class="stat">Pending <strong>${state.pending.length}</strong></div>
        <button id="finalize-btn" class="small-btn" title="Finalize GW">Finalize GW</button>
      </div>
    </div>
  `;
}

function renderTabs(){
  return `
    <div class="tabs">
      <button class="tab-btn ${state.activeTab==='pick-team'?'active':''}" data-tab="pick-team">My Team</button>
      <button class="tab-btn ${state.activeTab==='transfers'?'active':''}" data-tab="transfers">Transfers</button>
      <button class="tab-btn ${state.activeTab==='points'?'active':''}" data-tab="points">Points</button>
      <button class="tab-btn ${state.activeTab==='rules'?'active':''}" data-tab="rules">Rules</button>
    </div>
  `;
}

function renderPitch(){
  // markup: left/right penalty boxes drawn via CSS absolutely
  const pitchMark = `<div class="pitch-markings"><div class="pitch-box pen-left"></div><div class="pitch-center"></div><div class="pitch-box pen-right"></div></div>`;
  // create rows according to current starters grouped by pos
  const starters = state.startingXI.map(playerById).filter(Boolean);
  const groups = {GK:[],DEF:[],MID:[],FWD:[]};
  starters.forEach(p=>groups[p.pos].push(p));
  const row1 = (groups.GK.length? groups.GK.map(p=>renderPitchPlayer(p)).join('') : renderEmpty(1));
  const row2 = (groups.DEF.length? groups.DEF.map(p=>renderPitchPlayer(p)).join('') : renderEmpty(3));
  const row3 = (groups.MID.length? groups.MID.map(p=>renderPitchPlayer(p)).join('') : renderEmpty(4));
  const row4 = (groups.FWD.length? groups.FWD.map(p=>renderPitchPlayer(p)).join('') : renderEmpty(3));
  const benchHtml = state.bench.length ? state.bench.map(id=>playerById(id)).map(p=>`<div class="bench-player">${escapeHtml(p.name)} • ${p.pos}</div>`).join('') : '<div style="color:var(--muted)">No bench players</div>';
  return `
    <div class="pitch-wrap">
      ${pitchMark}
      <div class="pitch-grid">
        <div class="pitch">
          <div class="pitch-row">${row1}</div>
          <div class="pitch-row">${row2}</div>
          <div class="pitch-row">${row3}</div>
          <div class="pitch-row">${row4}</div>
          <div class="bench-wrap"><div class="bench-title">Bench</div><div class="bench-list">${benchHtml}</div></div>
        </div>
      </div>
    </div>
  `;
}

function renderPitchPlayer(p){
  const cap = state.captainId===p.id? '<span class="badge-capt" title="Captain">C</span>':'';
  const vc = state.viceCaptainId===p.id? '<span style="margin-left:6px;color:var(--muted);font-size:12px">(VC)</span>':'';
  return `<div class="player-card" data-player="${p.id}">
    <div class="top"><div class="player-name">${escapeHtml(p.name)}</div>${cap}</div>
    <div class="player-meta">${escapeHtml(p.pos)} • ${escapeHtml(p.club)} ${vc}</div>
    <div class="player-actions">
      <button class="small-btn captain-set" data-id="${p.id}" title="Set Captain">Captain</button>
      <button class="small-btn vice-set" data-id="${p.id}" title="Set Vice">Vice</button>
      <button class="small-btn view-player" data-id="${p.id}" title="Details">Info</button>
    </div>
  </div>`;
}

function renderEmpty(n){
  return Array.from({length:n}).map(()=>`<div class="player-card empty">Empty</div>`).join('');
}

function renderSquadSidebar(){
  const c = squadCounts(); const val = computeSquadValue(state.squad).toFixed(1);
  return `
    <div class="panel">
      <h3 class="card-title">Squad Summary</h3>
      <div class="kv"><span>Value</span><strong>Br ${val}M</strong></div>
      <div class="kv"><span>Bank</span><strong>Br ${state.bank.toFixed(1)}M</strong></div>
      <div class="kv"><span>Players</span><strong>${state.squad.length}/15</strong></div>
      <div style="margin-top:8px" class="kv"><span>Free slots</span><strong>${MAX_SQUAD - state.squad.length}</strong></div>
      <div style="margin-top:10px;border-top:1px solid var(--line);padding-top:8px">
        <div class="kv"><span>GK</span><strong>${c.GK}/2</strong></div>
        <div class="kv"><span>DEF</span><strong>${c.DEF}/5</strong></div>
        <div class="kv"><span>MID</span><strong>${c.MID}/5</strong></div>
        <div class="kv"><span>FWD</span><strong>${c.FWD}/3</strong></div>
      </div>
    </div>
  `;
}

function renderSquadGrid(){
  const html = state.squad.map(id=>{
    const p=playerById(id);
    return `<div class="squad-card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-weight:700">${escapeHtml(p.name)}</div>
          <div style="font-size:13px;color:var(--muted)">${escapeHtml(p.pos)} • ${escapeHtml(p.club)}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700">Br ${p.price}M</div>
          <div style="font-size:12px;color:var(--muted)">${state.purchasePrices[p.id] ? `bought ${state.purchasePrices[p.id]}M` : 'market price'}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px;justify-content:flex-end">
        <button class="small-btn view-player" data-id="${p.id}">Details</button>
        <button class="small-btn stage-sell" data-id="${p.id}">Stage Sell</button>
        <button class="small-btn remove-from-squad" data-id="${p.id}">Remove</button>
      </div>
    </div>`;
  }).join('');
  return `<div class="panel"><h3 class="card-title">Your Squad</h3><div class="squad-grid">${html}</div></div>`;
}

/* Transfers view */
function renderTransfers(){
  const filters = ['All','GK','DEF','MID','FWD'];
  const list = getFilteredPlayers().map(p=>{
    const inSquad = state.squad.includes(p.id);
    const check = canAdd(p);
    const badge = `<div style="font-size:12px;color:var(--muted)">${p.points} pts</div>`;
    return `<div class="market-item">
      <div class="market-left">
        <div class="player-avatar">${escapeHtml(p.name.split(' ').map(s=>s[0]).slice(0,2).join(''))}</div>
        <div>
          <div style="font-weight:700">${escapeHtml(p.name)}</div>
          <div class="player-meta">${escapeHtml(p.pos)} • ${escapeHtml(p.club)}</div>
        </div>
      </div>
      <div class="market-actions">
        <div style="margin-right:10px" class="price-tag">Br ${p.price}M</div>
        ${inSquad? `<button class="small-btn stage-sell" data-id="${p.id}">Stage Sell</button>` : `<button class="small-btn ${check.allowed?'':'disabled'} stage-buy" data-id="${p.id}" ${check.allowed?'':'disabled'}>Stage Buy</button>`}
        <button class="small-btn preview-single" data-id="${p.id}">Preview</button>
        <button class="small-btn suggest-btn" data-id="${p.id}">Suggest</button>
      </div>
    </div>`;
  }).join('');
  const pendingHtml = state.pending.map(t=>{
    const p = playerById(t.playerId); const type = t.type==='buy'?'Buy':'Sell'; const price = t.type==='buy'?`Br ${p.price}M`:`Br ${sellingPrice(p)}M`;
    return `<div class="pending-item" data-pending="${t.id}"><div><div style="font-weight:700">${type} ${escapeHtml(p.name)}</div><div style="font-size:12px;color:var(--muted)">${price}</div></div><div><button class="small-btn pending-undo" data-id="${t.id}">Undo</button></div></div>`;
  }).join('');
  const chipsHtml = CHIPS.map(chip=>{
    const active = state.activeChip===chip; const used = state.usedChips.includes(chip);
    return `<button class="filter-btn ${active?'active':''}" data-chip="${chip}" ${used?'disabled':''}>${chip}${used?' (used)':''}${active?' (active)':''}</button>`;
  }).join('');
  const preview = calcPreview();
  return `
    <div class="panel">
      <h3 class="card-title">Transfer Market</h3>
      <div class="search-row">
        <input id="market-search" class="search-input" placeholder="Search player, club or position" value="${escapeHtml(state.marketSearch)}" />
        <div style="display:flex;gap:8px;align-items:center">
          ${['All','GK','DEF','MID','FWD'].map(f=>`<button class="filter-btn ${state.marketFilter===f?'active':''}" data-filter="${f}">${f}</button>`).join('')}
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">${chipsHtml}</div>
      <div class="market-list">${list}</div>
    </div>
    <div class="panel" style="margin-top:10px">
      <h3 class="card-title">Pending Transfers</h3>
      <div class="pending-list">${pendingHtml || '<div style="color:var(--muted)">No pending transfers</div>'}</div>
      <div class="preview-box">
        <div class="preview-row"><span>Projected Bank</span><strong>Br ${preview.projectedBank}M</strong></div>
        <div class="preview-row"><span>Projected Value</span><strong>Br ${preview.projectedValue}M</strong></div>
        <div class="preview-row"><span>Projected Hits</span><strong>-${preview.projectedHits} pts</strong></div>
      </div>
      <div style="margin-top:10px;display:flex;gap:8px">
        <button id="confirm-transfers" class="small-btn">Confirm Transfers</button>
        <button id="clear-transfers" class="small-btn">Clear Pending</button>
      </div>
    </div>
  `;
}

function getFilteredPlayers(){
  const q = (state.marketSearch||'').trim().toLowerCase();
  return PLAYERS.filter(p=>{
    const posOk = state.marketFilter==='All' ? true : p.pos===state.marketFilter;
    const qOk = !q || p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q) || p.pos.toLowerCase().includes(q);
    return posOk && qOk;
  });
}

/* Points, rules */
function renderPoints(){
  return `<div class="panel"><h3 class="card-title">Gameweek History</h3>
    ${state.history.length? state.history.map(h=>`<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div style="font-weight:700">GW ${h.gw}</div><div style="color:var(--muted)">Gross ${h.gross} • Hits -${h.hits} • Net ${h.net}</div></div>`).join('') : '<div style="color:var(--muted)">No gameweeks yet</div>'}
  </div>`;
}
function renderRules(){ return `<div class="panel"><h3 class="card-title">Rules</h3><ul style="padding-left:18px;color:var(--muted)"><li>15 players: 2 GK, 5 DEF, 5 MID, 3 FWD</li><li>Budget Br ${BUDGET}M, max ${MAX_CLUB} from a club</li><li>1 free transfer per GW, extra transfers cost -${HIT} pts</li><li>Chips: Wildcard, Free Hit, Triple Captain, Bench Boost</li></ul></div>`; }

/* Player detail modal */
function showPlayerModal(id){
  const p = playerById(id); if (!p) return;
  const buy = state.purchasePrices[p.id] !== undefined ? `${state.purchasePrices[p.id]}M` : '—';
  const isInSquad = state.squad.includes(p.id);
  const html = `<div style="display:flex;gap:12px">
    <div style="width:84px;height:84px;border-radius:10px;background:rgba(255,255,255,0.03);display:flex;align-items:center;justify-content:center;font-weight:700">${escapeHtml(p.name.split(' ').map(s=>s[0]).slice(0,2).join(''))}</div>
    <div style="flex:1">
      <div style="font-weight:800;font-size:18px">${escapeHtml(p.name)}</div>
      <div style="color:var(--muted);margin-top:6px">${escapeHtml(p.pos)} • ${escapeHtml(p.club)}</div>
      <div style="margin-top:8px;color:var(--muted)">Price: Br ${p.price}M • Bought: ${buy}</div>
      <div style="margin-top:8px;color:var(--muted)">${escapeHtml(p.bio)}</div>
    </div>
  </div>
  <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
    ${isInSquad ? `<button class="small-btn stage-sell" data-id="${p.id}">Stage Sell</button><button class="small-btn remove-from-squad" data-id="${p.id}">Remove</button>` : `<button class="small-btn stage-buy" data-id="${p.id}">Stage Buy</button>`}
    <button class="small-btn" id="close-player">Close</button>
  </div>`;
  showModal(`${p.name}`, html, 'Close', null, null, true);
  // close button binds automatically by modal helper (id close-player not used there) — add explicit handler to close modal root
  const root = document.getElementById('app-modal-root');
  root.querySelector('#close-player')?.addEventListener('click', ()=>{ root.innerHTML=''; root.style.display='none'; });
}

/* =========
   Main render
   ========= */
function render(){
  const app = document.getElementById('app');
  if (!app) return;
  recalcBank(); updatePenalty(); autoAssign(); save();
  const header = renderHeader(); const tabs = renderTabs();
  let main = '';
  if (state.activeTab==='pick-team'){
    main = `<div class="layout"><div>
      <div class="panel"><h3 class="card-title">My Team</h3>${renderPitch()}</div>
      ${renderSquadGrid()}
    </div><div>${renderSquadSidebar()}</div></div>`;
  } else if (state.activeTab==='transfers'){
    main = `<div class="layout"><div>${renderTransfers()}</div><div>${renderSquadSidebar()}</div></div>`;
  } else if (state.activeTab==='points') main = `<div>${renderPoints()}</div>`;
  else main = `<div>${renderRules()}</div>`;

  app.innerHTML = `<div class="app-shell">${header}${tabs}<div class="content">${main}</div></div>`;
}

/* =========
   Event handling (one-time global delegation)
   ========= */
function globalClick(e){
  const tab = e.target.closest('.tab-btn'); if (tab && tab.dataset.tab){ state.activeTab = tab.dataset.tab; render(); return; }
  const finalize = e.target.closest('#finalize-btn'); if (finalize){ showModal('Finalize GW (simulate)','<div><label>Paste playedData JSON (playerId -> stats):</label><textarea id="gw-json" style="width:100%;min-height:160px"></textarea></div>','Run', ()=>{
    try{ const raw = document.getElementById('gw-json').value || '{}'; const parsed = JSON.parse(raw); finalizeGW(parsed);}catch(err){ showAlert('Invalid JSON'); } }, null, false); return; }
  const chipBtn = e.target.closest('[data-chip]'); if (chipBtn && chipBtn.dataset.chip){ toggleChip(chipBtn.dataset.chip); return; }
  const stageBuyBtn = e.target.closest('.stage-buy'); if (stageBuyBtn && stageBuyBtn.dataset.id){ stageBuy(Number(stageBuyBtn.dataset.id)); return; }
  const stageSellBtn = e.target.closest('.stage-sell'); if (stageSellBtn && stageSellBtn.dataset.id){ stageSell(Number(stageSellBtn.dataset.id)); return; }
  const removeBtn = e.target.closest('.remove-from-squad'); if (removeBtn && removeBtn.dataset.id){ const id=Number(removeBtn.dataset.id); state.squad = state.squad.filter(i=>i!==id); delete state.purchasePrices[id]; autoAssign(); save(); render(); return; }
  const viewBtn = e.target.closest('.view-player'); if (viewBtn && viewBtn.dataset.id){ showPlayerModal(Number(viewBtn.dataset.id)); return; }
  const captainSet = e.target.closest('.captain-set'); if (captainSet && captainSet.dataset.id){ state.captainId = Number(captainSet.dataset.id); if (state.viceCaptainId===state.captainId) state.viceCaptainId=null; save(); render(); return; }
  const viceSet = e.target.closest('.vice-set'); if (viceSet && viceSet.dataset.id){ state.viceCaptainId = Number(viceSet.dataset.id); if (state.captainId===state.viceCaptainId) state.captainId=null; save(); render(); return; }
  const preview = e.target.closest('.preview-single'); if (preview && preview.dataset.id){ const id=Number(preview.dataset.id); const extra={type: state.squad.includes(id)?'sell':'buy', playerId:id}; const pr = calcPreview(extra); const html = `<div>${pr.buys.length? pr.buys.map(p=>`<div>${escapeHtml(p.name)} - Br ${p.price}M</div>`).join(''):'No buys'}${pr.sells.length? '<hr/>'+pr.sells.map(p=>`<div>${escapeHtml(p.name)} - Br ${sellingPrice(p)}M</div>`).join(''):''}</div>`; showModal('Preview transfers', html, 'Stage & Confirm', ()=>{ state.pending.push({id:Date.now(),type:extra.type,playerId:extra.playerId,ts:Date.now()}); applyPending();}, null, false); return; }
  const suggest = e.target.closest('.suggest-btn'); if (suggest && suggest.dataset.id){ const id = Number(suggest.dataset.id); const {direct,swaps} = findReplacements(id); let html = '<div><h4>Direct</h4>'; html += direct.map(d=>`<div style="padding:6px 0"><strong>${escapeHtml(d.name)}</strong> Br ${d.price}M <button class="small-btn preview-single" data-id="${d.id}">Preview</button> <button class="small-btn stage-swap" data-buy="${d.id}" data-sell="${id}">Stage swap</button></div>`).join('') || '<div style="color:var(--muted)">none</div>'; html += '<h4>Swap proposals</h4>'; html += swaps.map(s=>`<div style="padding:6px 0"><strong>${escapeHtml(s.buy.name)}</strong> Br ${s.buy.price}M ${s.sell?` (Sell ${escapeHtml(s.sell.name)})`:''} <button class="small-btn stage-swap" data-buy="${s.buy.id}" data-sell="${s.sell? s.sell.id : id}">Stage swap</button></div>`).join('') || '<div style="color:var(--muted)">none</div>'; html += '</div>'; showModal('Replacements', html, 'Close', null, null, true); return; }
  const stageSwap = e.target.closest('.stage-swap'); if (stageSwap && stageSwap.dataset.buy && stageSwap.dataset.sell){ const buy=Number(stageSwap.dataset.buy); const sell=Number(stageSwap.dataset.sell); state.pending.push({id:++pendingCounter,type:'sell',playerId:sell,ts:Date.now()}); state.pending.push({id:++pendingCounter,type:'buy',playerId:buy,ts:Date.now()}); save(); render(); showAlert(`Staged swap: sell ${sell} + buy ${buy}`); return; }
  const pendingUndo = e.target.closest('.pending-undo'); if (pendingUndo && pendingUndo.dataset.id){ removePending(Number(pendingUndo.dataset.id)); return; }
  const confirmTransfers = e.target.closest('#confirm-transfers'); if (confirmTransfers){ showTransferPreviewAndConfirm(); return; }
  const clearBtn = e.target.closest('#clear-transfers'); if (clearBtn){ clearPending(); return; }
  // modal internal buttons are handled by modal helper; close handled there
}

function showTransferPreviewAndConfirm(){
  const preview = calcPreview();
  let html = '';
  if (preview.sells.length || preview.buys.length){
    html += preview.sells.map(p=>`<div>${escapeHtml(p.name)} — Sell for Br ${sellingPrice(p)}M</div>`).join('');
    html += preview.buys.map(p=>`<div>${escapeHtml(p.name)} — Buy for Br ${p.price}M</div>`).join('');
  } else html += '<div>No transfers staged</div>';
  html += `<div style="margin-top:10px" class="preview-box"><div class="preview-row"><span>Projected Bank</span><strong>Br ${preview.projectedBank}M</strong></div><div class="preview-row"><span>Projected Hits</span><strong>-${preview.projectedHits} pts</strong></div></div>`;
  showModal('Transfer breakdown', html, 'Confirm', ()=>{ applyPending(); }, null, false);
}

/* =========
   Input handlers
   ========= */
function globalInput(e){
  if (e.target && e.target.id==='market-search'){ state.marketSearch = e.target.value; render(); }
  const filter = e.target.closest('.filter-btn'); if (filter && filter.dataset.filter){ state.marketFilter = filter.dataset.filter; render(); }
  const chip = e.target.closest('[data-chip]'); if (chip && chip.dataset.chip){ /* handled on click */ }
}

/* =========
   Init
   ========= */
function init(){
  load();
  recalcBank(); updatePenalty(); autoAssign();
  // single delegated listeners
  document.addEventListener('click', globalClick);
  document.addEventListener('input', globalInput);
  render();
}

/* =========
   Start the app
   ========= */
init();
