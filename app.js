/* ==========================================================================
   EPL-FANTASY app.js — Adds:
   - Animations for staging/undo
   - Per-player replacement suggestions (auto-swap proposals)
   - Transfer cost impact on squad value & club counts
   ========================================================================== */

/* ---------------------------
   1) DATA & CONSTANTS
   --------------------------- */
const INITIAL_PLAYERS = [
  { id: 1, name: "Abebe Tilahun", pos: "GK", club: "St. George", price: 4.5, points: 28 },
  { id: 2, name: "Bahiru Negash", pos: "GK", club: "Ethiopia Bunna", price: 4.5, points: 24 },
  { id: 3, name: "Aschalew Tamene", pos: "DEF", club: "Fasil Kenema", price: 5.0, points: 42 },
  { id: 4, name: "Yared Bayeh", pos: "DEF", club: "Bahir Dar", price: 5.0, points: 38 },
  { id: 5, name: "Suleman Hamid", pos: "DEF", club: "St. George", price: 4.5, points: 31 },
  { id: 6, name: "Henok Gebre", pos: "DEF", club: "Ethiopia Bunna", price: 4.5, points: 29 },
  { id: 7, name: "Ramkel Lok", pos: "DEF", club: "EEPCO", price: 4.0, points: 18 },
  { id: 8, name: "Gatoch Panom", pos: "MID", club: "St. George", price: 6.0, points: 55 },
  { id: 9, name: "Surafel Dagnachew", pos: "MID", club: "Fasil Kenema", price: 6.5, points: 61 },
  { id: 10, name: "Amanuel Yohannes", pos: "MID", club: "Ethiopia Bunna", price: 6.0, points: 48 },
  { id: 11, name: "Canaan Markneh", pos: "MID", club: "Defense Force", price: 5.5, points: 39 },
  { id: 12, name: "Biniyam Fikre", pos: "MID", club: "Sidama Bunna", price: 5.0, points: 32 },
  { id: 13, name: "Getaneh Kebede", pos: "FWD", club: "Wolkite", price: 7.0, points: 68 },
  { id: 14, name: "Abel Yalew", pos: "FWD", club: "Mechal", price: 7.5, points: 74 },
  { id: 15, name: "Dawa Hotessa", pos: "FWD", club: "Adama City", price: 6.5, points: 52 },
  { id: 16, name: "Chernet Gugsa", pos: "FWD", club: "St. George", price: 6.0, points: 45 }
];

const SQUAD_RULES = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
const MAX_SQUAD_SIZE = 15;
const INITIAL_BUDGET = 100.0;
const MAX_PER_CLUB = 3;
const HIT_PENALTY_PTS = 4;

const ALLOWED_FORMATIONS = [
  { def: 3, mid: 4, fwd: 3 },
  { def: 3, mid: 5, fwd: 2 },
  { def: 4, mid: 4, fwd: 2 },
  { def: 4, mid: 3, fwd: 3 },
  { def: 5, mid: 3, fwd: 2 },
  { def: 5, mid: 4, fwd: 1 }
];

const CHIPS = ['wildcard', 'freeHit', 'tripleCaptain', 'benchBoost'];

/* ---------------------------
   2) STATE
   --------------------------- */
let state = {
  activeTab: 'pick-team',
  squad: [],
  startingXI: [],
  bench: [],
  purchasePrices: {},
  captainId: null,
  viceCaptainId: null,
  bank: INITIAL_BUDGET,
  freeTransfers: 1,
  transfersMadeThisGW: 0,
  transferPenalty: 0,
  activeChip: null,
  usedChipsThisSeason: [],
  savedFreeHitSquad: null,
  currentGameweek: 1,
  lastTransferConfirmed: false,
  pendingTransfers: [], // { id, type:'buy'|'sell', playerId, ts, removing?:bool }
  history: [],
  hasSeenWelcome: false,
  _gwCaptainOverride: null
};

/* ---------------------------
   3) UTILITIES & MODAL + ANIMATION CSS
   --------------------------- */
function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function saveState() { localStorage.setItem('epl_state', JSON.stringify(state)); }
function loadState() {
  const s = localStorage.getItem('epl_state');
  if (s) {
    try { const parsed = JSON.parse(s); state = Object.assign(state, parsed); } catch(e) {}
  }
}
function ensureModalRoot() {
  if (document.getElementById('app-modal-root')) return;
  const root = document.createElement('div');
  root.id = 'app-modal-root';
  document.body.appendChild(root);
  root.style.position = 'fixed';
  root.style.left = '0'; root.style.top = '0'; root.style.width = '100%'; root.style.height = '100%';
  root.style.display = 'none'; root.style.alignItems = 'center'; root.style.justifyContent = 'center'; root.style.zIndex = 9999;
  // inject CSS including animation styles
  const style = document.createElement('style');
  style.id = 'app-modal-styles';
  style.innerHTML = `
    /* modal styles */
    #app-modal-root .modal-overlay { position:fixed; left:0; top:0; width:100%; height:100%; background: rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; padding:20px; box-sizing:border-box; }
    #app-modal-root .modal-card { background: linear-gradient(180deg,#ffffff,#f7f7fb); border-radius:12px; box-shadow: 0 12px 40px rgba(0,0,0,0.35); max-width:760px; width:100%; padding:18px; font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#111; }
    #app-modal-root h3 { margin:0 0 10px 0; font-size:18px; }
    #app-modal-root .modal-body { max-height:60vh; overflow:auto; margin-bottom:12px; color:#222; }
    #app-modal-root .modal-actions { display:flex; gap:10px; justify-content:flex-end; }
    .btn { padding:8px 12px; border-radius:8px; border: 1px solid #cfcfe1; background:#fff; cursor:pointer; }
    .btn-primary { padding:8px 12px; border-radius:8px; background: linear-gradient(180deg,#2e7d32,#1b5e20); color:#fff; border:none; }
    .btn-danger { background: linear-gradient(180deg,#c62828,#8e0000); color:#fff; border:none; }
    .btn-ghost { background:transparent; border:1px solid #ddd; }
    .transfer-line { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed #eee; align-items:center; }
    .chip-badge { padding:4px 8px; border-radius:6px; background:#f0f0f8; font-size:12px; }
    .price-badge { background:#f7f7ff; padding:4px 8px; border-radius:6px; font-weight:600; }
    /* pending animations */
    .pending-item { transition: transform 260ms ease, opacity 260ms ease; transform-origin: left center; }
    .pending-item.enter { opacity: 0; transform: translateY(-8px) scale(0.98); }
    .pending-item.enter.show { opacity: 1; transform: translateY(0) scale(1); }
    .pending-item.removing { opacity: 0; transform: translateX(40px) rotate(3deg); height:0; margin:0; padding:0; }
  `;
  document.head.appendChild(style);
}

/* Styled modal helper */
function showModal({ title = '', html = '', onConfirm = null, onCancel = null, confirmText = 'OK', cancelText = 'Cancel', hideCancel = false, confirmClass = 'btn-primary' }) {
  ensureModalRoot();
  const root = document.getElementById('app-modal-root');
  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-card">
        <h3>${escapeHtml(title)}</h3>
        <div class="modal-body">${html}</div>
        <div class="modal-actions">
          ${hideCancel ? '' : `<button id="modal-cancel-btn" class="btn btn-ghost">${escapeHtml(cancelText)}</button>`}
          <button id="modal-confirm-btn" class="${escapeHtml(confirmClass)}">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    </div>
  `;
  root.style.display = 'block';
  const cleanup = () => { root.style.display = 'none'; root.innerHTML = ''; };
  const confirmBtn = document.getElementById('modal-confirm-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  if (confirmBtn) confirmBtn.onclick = () => { cleanup(); if (onConfirm) onConfirm(); };
  if (cancelBtn) cancelBtn.onclick = () => { cleanup(); if (onCancel) onCancel(); };
  root.querySelector('.modal-overlay').onclick = (e) => { if (e.target === root.querySelector('.modal-overlay')) { cleanup(); if (onCancel) onCancel(); } };
}
function showAlert(message) { showModal({ title: 'Notice', html: `<div>${escapeHtml(message)}</div>`, onConfirm: null, confirmText: 'Close', hideCancel: true }); }
function showConfirm(message, onYes, onNo) { showModal({ title: 'Confirm', html: `<div>${escapeHtml(message)}</div>`, onConfirm: onYes, onCancel: onNo, confirmText: 'Yes', cancelText: 'No' }); }

/* ---------------------------
   4) VALIDATION & ECONOMY
   --------------------------- */
function validateSquad(squad = state.squad) {
  if (!Array.isArray(squad)) return { ok: false, reason: 'Invalid squad format' };
  if (squad.length !== MAX_SQUAD_SIZE) return { ok: false, reason: `Squad must be ${MAX_SQUAD_SIZE} players` };
  const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  const clubCount = {};
  let totalValue = 0;
  for (const id of squad) {
    const p = INITIAL_PLAYERS.find(x => x.id === id);
    if (!p) return { ok: false, reason: `Player id ${id} not found` };
    counts[p.pos] = (counts[p.pos] || 0) + 1;
    clubCount[p.club] = (clubCount[p.club] || 0) + 1;
    totalValue += p.price;
  }
  for (const pos of ['GK','DEF','MID','FWD']) {
    if (counts[pos] !== SQUAD_RULES[pos]) return { ok: false, reason: `Squad must contain exactly ${SQUAD_RULES[pos]} ${pos}s` };
  }
  for (const c in clubCount) if (clubCount[c] > MAX_PER_CLUB) return { ok: false, reason: `More than ${MAX_PER_CLUB} players from ${c}` };
  if (totalValue > INITIAL_BUDGET + 1e-6) return { ok: false, reason: `Total value exceeds Br ${INITIAL_BUDGET}M (current ${totalValue.toFixed(1)}M)` };
  return { ok: true };
}
function recalculateBank() {
  const totalSpent = state.squad.reduce((sum, id) => {
    const price = state.purchasePrices[id] !== undefined ? state.purchasePrices[id] : (INITIAL_PLAYERS.find(p => p.id === id)?.price || 0);
    return sum + price;
  }, 0);
  state.bank = parseFloat((INITIAL_BUDGET - totalSpent).toFixed(1));
}
function updateTransferPenalty() {
  if (state.currentGameweek === 1 || state.activeChip === 'wildcard' || state.activeChip === 'freeHit') { state.transferPenalty = 0; return; }
  const excess = Math.max(0, state.transfersMadeThisGW - state.freeTransfers);
  state.transferPenalty = excess * HIT_PENALTY_PTS;
}

/* Helper: compute squad value for any squad array */
function computeSquadValue(squadArray) {
  return squadArray.reduce((sum, id) => {
    const p = INITIAL_PLAYERS.find(x => x.id === id);
    return sum + (p ? p.price : 0);
  }, 0);
}
function computeClubCounts(squadArray) {
  const counts = {};
  for (const id of squadArray) {
    const p = INITIAL_PLAYERS.find(x => x.id === id);
    if (!p) continue;
    counts[p.club] = (counts[p.club] || 0) + 1;
  }
  return counts;
}

/* ---------------------------
   5) PENDING TRANSFERS: preview includes squad value & club counts
   --------------------------- */
function calculatePendingPreview(extra = null) {
  const staged = [...state.pendingTransfers];
  if (extra) staged.push({ id: 'hyp', type: extra.type, playerId: extra.playerId });

  // Derive future squad by applying staged sells then buys (simplified)
  let futureSquad = [...state.squad];

  // apply sells
  staged.filter(t => t.type === 'sell').forEach(t => { futureSquad = futureSquad.filter(id => id !== t.playerId); });

  // apply buys
  staged.filter(t => t.type === 'buy').forEach(t => {
    if (!futureSquad.includes(t.playerId)) futureSquad.push(t.playerId);
  });

  const buys = staged.filter(t => t.type === 'buy').map(t => INITIAL_PLAYERS.find(p => p.id === t.playerId)).filter(Boolean);
  const sells = staged.filter(t => t.type === 'sell').map(t => INITIAL_PLAYERS.find(p => p.id === t.playerId)).filter(Boolean);

  const sumBuys = buys.reduce((s,p) => s + p.price, 0);
  const sumSells = sells.reduce((s,p) => s + getSellingPrice(p), 0);

  let projectedBank = state.bank - sumBuys + sumSells;
  const pendingCount = staged.length;
  const usingWildcard = state.activeChip === 'wildcard';
  const usingFreeHit = state.activeChip === 'freeHit';
  let projectedTransfersMade = state.transfersMadeThisGW + pendingCount;
  let extraTransfers = 0;
  if (!usingWildcard && !usingFreeHit) extraTransfers = Math.max(0, projectedTransfersMade - state.freeTransfers);
  const projectedHits = extraTransfers * HIT_PENALTY_PTS;

  const projectedSquadValue = parseFloat(computeSquadValue(futureSquad).toFixed(1));
  const projectedClubCounts = computeClubCounts(futureSquad);

  return {
    projectedBank: parseFloat(projectedBank.toFixed(1)),
    projectedHits,
    transfersApplied: pendingCount,
    buys, sells,
    projectedSquadValue,
    projectedClubCounts,
    futureSquad
  };
}

/* Transfer breakdown modal */
function showTransferBreakdownModal(extra = null, onConfirm = null) {
  const preview = calculatePendingPreview(extra);
  const lines = [];
  preview.sells.forEach(p => lines.push({ type: 'Sell', name: p.name, price: getSellingPrice(p), sign: '+' }));
  preview.buys.forEach(p => lines.push({ type: 'Buy', name: p.name, price: p.price, sign: '-' }));

  const htmlLines = lines.length === 0 ? '<div>(no transfers)</div>' : lines.map(l => {
    return `<div class="transfer-line"><div class="left"><div class="chip-badge">${escapeHtml(l.type)}</div><div style="margin-left:8px">${escapeHtml(l.name)}</div></div><div class="right"><div class="price-badge">${l.sign} Br ${l.price}M</div></div></div>`;
  }).join('');

  // club counts detail
  const clubListHtml = Object.keys(preview.projectedClubCounts).map(c => {
    const cnt = preview.projectedClubCounts[c];
    const over = cnt > MAX_PER_CLUB;
    return `<div style="display:flex;justify-content:space-between;padding:4px 0"><div>${escapeHtml(c)}</div><div style="color:${over? '#c62828':'#111'}">${cnt}${over? ' ⚠︎' : ''}</div></div>`;
  }).join('');

  const totalsHtml = `
    <div style="margin-top:12px;padding-top:8px;border-top:1px solid #eee">
      <div style="display:flex;justify-content:space-between;padding:6px 0;"><div>Projected Bank</div><div><strong>Br ${preview.projectedBank}M</strong></div></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;"><div>Projected Squad Value</div><div><strong>Br ${preview.projectedSquadValue}M</strong></div></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;"><div>Projected Hits</div><div><strong>-${preview.projectedHits} pts</strong></div></div>
      <div style="margin-top:8px;"><strong>Club counts</strong>${clubListHtml}</div>
    </div>
  `;

  showModal({
    title: 'Transfer Cost Breakdown',
    html: `<div>${htmlLines}${totalsHtml}</div>`,
    confirmText: extra ? 'Stage & Confirm' : 'Confirm Transfers',
    cancelText: 'Cancel',
    confirmClass: 'btn-primary',
    onConfirm: () => {
      if (extra) {
        // stage extra then apply
        state.pendingTransfers.push({ id: Date.now(), type: extra.type, playerId: extra.playerId, ts: Date.now() });
        applyPendingTransfers();
      } else {
        applyPendingTransfers();
      }
      if (onConfirm) onConfirm();
    }
  });
}

/* ---------------------------
   6) Apply pending transfers (with animation removal handling)
   --------------------------- */
function applyPendingTransfers() {
  if (state.pendingTransfers.length === 0) { showAlert('No pending transfers to apply'); return; }
  const usingWildcard = state.activeChip === 'wildcard';
  const usingFreeHit = state.activeChip === 'freeHit';
  let applied = 0;
  // apply sells first
  const sells = state.pendingTransfers.filter(t => t.type === 'sell');
  for (const t of sells) {
    const player = INITIAL_PLAYERS.find(p => p.id === t.playerId);
    if (!player) continue;
    if (!state.squad.includes(player.id)) continue;
    const sellPrice = getSellingPrice(player);
    state.squad = state.squad.filter(id => id !== player.id);
    delete state.purchasePrices[player.id];
    state.bank = parseFloat((state.bank + sellPrice).toFixed(1));
    applied++;
  }
  const buys = state.pendingTransfers.filter(t => t.type === 'buy');
  for (const t of buys) {
    const player = INITIAL_PLAYERS.find(p => p.id === t.playerId);
    if (!player) continue;
    const check = canBuyPlayerImmediate(player);
    if (!check.allowed) {
      showAlert(`Cannot buy ${player.name}: ${check.reason}`);
      continue;
    }
    state.squad.push(player.id);
    state.purchasePrices[player.id] = player.price;
    state.bank = parseFloat((state.bank - player.price).toFixed(1));
    applied++;
  }
  if (!usingWildcard && !usingFreeHit) state.transfersMadeThisGW += applied;
  state.lastTransferConfirmed = applied > 0;
  // clear pending
  state.pendingTransfers = [];
  recalculateBank();
  updateTransferPenalty();
  autoAssignXIAndBench();
  saveState();
  renderApp();
  showAlert(`Confirmed ${applied} transfers.`);
}

/* ---------------------------
   7) Stage/undo helpers with animations
   --------------------------- */
let pendingIdCounter = Date.now();
function stageBuy(playerId) {
  const player = INITIAL_PLAYERS.find(p => p.id === playerId);
  if (!player) return;
  if (state.pendingTransfers.find(t => t.type === 'buy' && t.playerId === playerId)) { showAlert('This buy is already pending'); return; }
  const obj = { id: ++pendingIdCounter, type: 'buy', playerId, ts: Date.now(), removing: false };
  state.pendingTransfers.push(obj);
  renderApp();
  // mark enter animation using setTimeout (class applied after render)
  setTimeout(() => {
    const el = document.querySelector(`.pending-item[data-pending-id="${obj.id}"]`);
    if (el) el.classList.add('enter', 'show');
  }, 30);
}
function stageSell(playerId) {
  const player = INITIAL_PLAYERS.find(p => p.id === playerId);
  if (!player) return;
  if (!state.squad.includes(playerId)) { showAlert('Player not in squad'); return; }
  if (state.pendingTransfers.find(t => t.type === 'sell' && t.playerId === playerId)) { showAlert('This sell is already pending'); return; }
  const obj = { id: ++pendingIdCounter, type: 'sell', playerId, ts: Date.now(), removing: false };
  state.pendingTransfers.push(obj);
  renderApp();
  setTimeout(() => {
    const el = document.querySelector(`.pending-item[data-pending-id="${obj.id}"]`);
    if (el) el.classList.add('enter', 'show');
  }, 30);
}
function removePendingByIdAnimated(pendingId) {
  // set removing flag, re-render so element gets 'removing' class then remove after timeout
  const idx = state.pendingTransfers.findIndex(t => t.id === pendingId);
  if (idx === -1) return;
  state.pendingTransfers[idx].removing = true;
  renderApp();
  setTimeout(() => {
    state.pendingTransfers = state.pendingTransfers.filter(t => t.id !== pendingId);
    renderApp();
  }, 300);
}
function clearPendingTransfers() {
  if (state.pendingTransfers.length === 0) return;
  showConfirm('Clear all pending transfers?', () => {
    // animate all out then clear
    state.pendingTransfers.forEach(t => t.removing = true);
    renderApp();
    setTimeout(() => { state.pendingTransfers = []; renderApp(); }, 300);
  });
}

/* ---------------------------
   8) Formation, autosub, scoring (kept same as earlier)
   --------------------------- */
function canBuyPlayerImmediate(player) {
  if (state.squad.includes(player.id)) return { allowed: false, reason: "Already in squad" };
  if (state.squad.length >= MAX_SQUAD_SIZE) return { allowed: false, reason: "Squad full (15/15)" };
  if (state.bank < player.price) return { allowed: false, reason: "Insufficient budget" };
  const posCount = state.squad.filter(id => { const p = INITIAL_PLAYERS.find(x => x.id === id); return p && p.pos === player.pos; }).length;
  if (posCount >= SQUAD_RULES[player.pos]) return { allowed: false, reason: `Max ${SQUAD_RULES[player.pos]} ${player.pos}s allowed` };
  const clubCount = state.squad.filter(id => { const p = INITIAL_PLAYERS.find(x => x.id === id); return p && p.club === player.club; }).length;
  if (clubCount >= MAX_PER_CLUB) return { allowed: false, reason: `Max ${MAX_PER_CLUB} players per club` };
  return { allowed: true };
}
function getSellingPrice(player) {
  const buyPrice = state.purchasePrices[player.id] !== undefined ? state.purchasePrices[player.id] : player.price;
  if (player.price > buyPrice) { const profit = player.price - buyPrice; const splitProfit = Math.floor((profit * 10) / 2) / 10; return parseFloat((buyPrice + splitProfit).toFixed(1)); }
  return player.price;
}
function autoAssignXIAndBench() {
  state.startingXI = []; state.bench = [];
  const squadPlayers = state.squad.map(id => INITIAL_PLAYERS.find(p => p.id === id)).filter(Boolean);
  if (squadPlayers.length === 0) { state.startingXI = []; state.bench = []; return; }
  const gkList = squadPlayers.filter(p => p.pos === 'GK').sort((a,b) => b.points - a.points);
  const defList = squadPlayers.filter(p => p.pos === 'DEF').sort((a,b) => b.points - a.points);
  const midList = squadPlayers.filter(p => p.pos === 'MID').sort((a,b) => b.points - a.points);
  const fwdList = squadPlayers.filter(p => p.pos === 'FWD').sort((a,b) => b.points - a.points);
  if (gkList.length === 0) { state.startingXI = []; state.bench = state.squad.slice(); return; }
  let bestSetup = { total: -Infinity, starters: [] };
  ALLOWED_FORMATIONS.forEach(form => {
    if (gkList.length < 1) return; if (defList.length < form.def) return; if (midList.length < form.mid) return; if (fwdList.length < form.fwd) return;
    const starters = [gkList[0], ...defList.slice(0, form.def), ...midList.slice(0, form.mid), ...fwdList.slice(0, form.fwd)];
    if (starters.length !== 11) return;
    const totalPts = starters.reduce((s,p) => s + (p.points || 0), 0);
    if (totalPts > bestSetup.total) bestSetup = { total: totalPts, starters: starters.map(p => p.id) };
  });
  if (bestSetup.total === -Infinity) {
    const outfield = squadPlayers.filter(p => p.pos !== 'GK').sort((a,b) => b.points - a.points);
    state.startingXI = [gkList[0].id, ...outfield.slice(0,10).map(p => p.id)];
  } else state.startingXI = bestSetup.starters;
  state.bench = state.squad.filter(id => !state.startingXI.includes(id));
  if (state.startingXI.length > 0 && !state.captainId) state.captainId = state.startingXI[0];
  if (state.startingXI.length > 1 && !state.viceCaptainId) state.viceCaptainId = state.startingXI[1];
}
function normalizeStat(obj = {}) { return { minutes: Number(obj.minutes || 0), goals: Number(obj.goals || 0), assists: Number(obj.assists || 0), conceded: Number(obj.conceded || 0), saves: Number(obj.saves || 0), yellow: Number(obj.yellow || 0), red: Number(obj.red || 0), ownGoal: Number(obj.ownGoal || 0), penSave: Number(obj.penSave || 0), penMiss: Number(obj.penMiss || 0), bonus: Number(obj.bonus || 0), cbi: Number(obj.cbi || 0), recoveries: Number(obj.recoveries || 0) }; }
function formationValidAfterSwap(startersIds) {
  const players = startersIds.map(id => INITIAL_PLAYERS.find(p => p.id === id)).filter(Boolean);
  const counts = { GK:0, DEF:0, MID:0, FWD:0 };
  players.forEach(p => { counts[p.pos] = (counts[p.pos]||0)+1; });
  return counts.GK === 1 && counts.DEF >= 3 && counts.FWD >= 1 && players.length === 11;
}
function applyAutomaticSubstitutions(playedData) {
  const stats = {}; for (const k in playedData) stats[Number(k)] = normalizeStat(playedData[k]);
  const starters = state.startingXI.slice(); const bench = state.bench.slice();
  const keeperStarterId = starters.find(id => (INITIAL_PLAYERS.find(x => x.id === id) || {}).pos === 'GK');
  if (keeperStarterId) {
    const keeperStats = stats[keeperStarterId] || { minutes: 0 };
    if ((keeperStats.minutes || 0) === 0) {
      for (let i=0;i<bench.length;i++) {
        const bId = bench[i]; const b = INITIAL_PLAYERS.find(p => p.id === bId);
        if (b && b.pos === 'GK') {
          const bStats = stats[bId] || { minutes: 0 };
          if (bStats.minutes > 0) { starters[starters.indexOf(keeperStarterId)] = bId; bench[i] = keeperStarterId; break; }
        }
      }
    }
  }
  for (let i=0;i<starters.length;i++) {
    const sid = starters[i]; const p = INITIAL_PLAYERS.find(x => x.id === sid);
    if (!p || p.pos === 'GK') continue;
    const sStats = stats[sid] || { minutes:0 }; if ((sStats.minutes || 0) > 0) continue;
    let candidateIndex = -1;
    for (let bi=0;bi<bench.length;bi++) {
      const bid = bench[bi]; const b = INITIAL_PLAYERS.find(x => x.id === bid);
      if (!b) continue; const bStats = stats[bid] || { minutes:0 }; if ((bStats.minutes || 0) === 0) continue;
      const simulated = starters.slice(); simulated[i] = bid;
      if (formationValidAfterSwap(simulated)) { candidateIndex = bi; break; }
    }
    if (candidateIndex !== -1) { const bid = bench[candidateIndex]; starters[i] = bid; bench[candidateIndex] = sid; }
  }
  state.startingXI = starters; state.bench = bench;
  const capStats = stats[state.captainId] || { minutes:0 }, vcStats = stats[state.viceCaptainId] || { minutes:0 };
  if ((capStats.minutes || 0) === 0 && (vcStats.minutes || 0) > 0) state._gwCaptainOverride = state.viceCaptainId; else state._gwCaptainOverride = null;
  saveState();
}
function calculatePlayerPoints(player, matchStats) {
  const m = normalizeStat(matchStats || {}); let pts = 0;
  if (m.minutes >= 60) pts += 2; else if (m.minutes > 0) pts += 1;
  if (m.goals > 0) { if (player.pos === 'GK') pts += 10 * m.goals; else if (player.pos === 'DEF') pts += 6 * m.goals; else if (player.pos === 'MID') pts += 5 * m.goals; else if (player.pos === 'FWD') pts += 4 * m.goals; }
  pts += 3 * m.assists;
  if (m.minutes >= 60) { if ((player.pos === 'GK' || player.pos === 'DEF') && (m.conceded === 0)) pts += 4; else if (player.pos === 'MID' && (m.conceded === 0)) pts += 1; }
  if (player.pos === 'GK' && m.saves) pts += Math.floor(m.saves / 3);
  if (player.pos === 'DEF' && (m.cbi || 0) >= 10) pts += 2;
  if ((player.pos === 'MID' || player.pos === 'FWD') && ((m.cbi || 0) + (m.recoveries || 0) >= 12)) pts += 2;
  pts += (m.penSave || 0) * 5; pts += (m.penMiss || 0) * -2; pts += (m.bonus || 0);
  if ((player.pos === 'GK' || player.pos === 'DEF') && m.conceded) pts -= Math.floor(m.conceded / 2);
  pts -= (m.yellow || 0) * 1; pts -= (m.red || 0) * 3; pts -= (m.ownGoal || 0) * 2;
  return pts;
}
function finalizeGameweek(playedData) {
  if (!playedData || typeof playedData !== 'object') { showAlert('Invalid playedData. Provide JSON mapping playerId->stats.'); return; }
  applyAutomaticSubstitutions(playedData);
  const stats = {}; for (const k in playedData) stats[Number(k)] = normalizeStat(playedData[k]);
  let grossPoints = 0; const perPlayerPoints = {}; const captainId = state._gwCaptainOverride || state.captainId;
  state.startingXI.forEach(id => {
    const p = INITIAL_PLAYERS.find(x => x.id === id); const s = stats[id] || { minutes:0 };
    let pts = calculatePlayerPoints(p, s);
    if (id === captainId) { if (state.activeChip === 'tripleCaptain') pts *= 3; else pts *= 2; }
    perPlayerPoints[id] = pts; grossPoints += pts;
  });
  if (state.activeChip === 'benchBoost') {
    state.bench.forEach(id => { const p = INITIAL_PLAYERS.find(x => x.id === id); const s = stats[id] || {}; const pts = calculatePlayerPoints(p, s); perPlayerPoints[id] = pts; grossPoints += pts; });
  } else { state.bench.forEach(id => { const p = INITIAL_PLAYERS.find(x => x.id === id); const s = stats[id] || {}; perPlayerPoints[id] = calculatePlayerPoints(p, s); }); }
  const hits = state.transferPenalty || 0; const netPoints = grossPoints - hits;
  const gwResult = { gw: state.currentGameweek, grossPoints, hits, netPoints, perPlayerPoints, starters: [...state.startingXI], bench: [...state.bench], captainId, usedChip: state.activeChip };
  state.history = state.history || []; state.history.push(gwResult);
  if (state.activeChip === 'freeHit' && state.savedFreeHitSquad) { state.squad = [...state.savedFreeHitSquad]; state.savedFreeHitSquad = null; }
  if (state.activeChip) if (!state.usedChipsThisSeason.includes(state.activeChip)) state.usedChipsThisSeason.push(state.activeChip);
  state.activeChip = null; state.lastTransferConfirmed = false; state.transfersMadeThisGW = 0; state.transferPenalty = 0;
  autoAssignXIAndBench(); saveState(); renderApp();
  showAlert(`Gameweek ${gwResult.gw} finalised.\nGross: ${grossPoints} pts\nHits: -${hits} pts\nNet: ${netPoints} pts`);
  return gwResult;
}

/* ---------------------------
   9) Replacement suggestions (auto-swap proposals)
   - showReplacementModal(playerId)
   - stageSwap(sellId, buyId)
   --------------------------- */
function findReplacementCandidates(targetPlayerId) {
  // if target is in squad (sell scenario) -> suggest best available market players of same position not in squad
  // if target is not in squad (buy scenario) -> suggest squad members you could sell to free budget + direct candidates
  const target = INITIAL_PLAYERS.find(p => p.id === targetPlayerId);
  if (!target) return { direct: [], swapProposals: [] };

  const inSquad = state.squad.includes(targetPlayerId);
  const direct = INITIAL_PLAYERS.filter(p => !state.squad.includes(p.id) && p.pos === target.pos && p.id !== targetPlayerId)
    .sort((a,b) => b.points - a.points)
    .slice(0,8);

  // swap proposals: find cheapest or lowest-point squad members of the same position (possible sells) that when sold permit a buy of a direct candidate
  const swapProposals = [];
  const squadCandidates = state.squad.map(id => INITIAL_PLAYERS.find(p => p.id === id)).filter(Boolean);
  // propose selling low-point players in same position first
  const sellCandidates = squadCandidates.filter(p => p.pos === target.pos).sort((a,b) => a.points - b.points).slice(0,6);

  // For each direct candidate, see if it's affordable as-is; if not, find a sell candidate that makes it affordable
  direct.forEach(dc => {
    const check = canBuyPlayerImmediate(dc);
    if (check.allowed) swapProposals.push({ buy: dc, sell: null, reason: 'Affordable' });
    else {
      // try finds sells to free budget: pick cheapest squad player (any pos that doesn't break squad rules) whose sell makes buy possible
      for (const sc of sellCandidates) {
        // simulate sell sc then buy dc: create tempSquad
        const tempSquad = state.squad.filter(id => id !== sc.id).concat([]);
        // ensure removing sc won't violate minimum pos requirements if sc is starter (we allow selling but later must enforce full squad rules when confirming)
        const newBank = state.bank + getSellingPrice(sc);
        if (newBank >= dc.price) { swapProposals.push({ buy: dc, sell: sc, reason: `Sell ${sc.name} to afford` }); break; }
      }
    }
  });

  return { direct, swapProposals };
}

function showReplacementModal(targetPlayerId) {
  const target = INITIAL_PLAYERS.find(p => p.id === targetPlayerId);
  if (!target) return;
  const { direct, swapProposals } = findReplacementCandidates(targetPlayerId);

  const directHtml = direct.length === 0 ? '<div style="color:#666">No direct candidates found.</div>' : direct.map(p => {
    const affordable = canBuyPlayerImmediate(p).allowed;
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee">
      <div>
        <div style="font-weight:600">${escapeHtml(p.name)}</div>
        <div style="font-size:12px;color:#666">${escapeHtml(p.pos)} • ${escapeHtml(p.club)} • Br ${p.price}M</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="preview-single btn btn-ghost" data-id="${p.id}">Preview</button>
        <button class="stage-swap btn btn-primary" data-buy="${p.id}" data-sell="${targetPlayerId}" ${affordable ? '' : ''}>Stage Swap</button>
      </div>
    </div>`;
  }).join('');

  const swapHtml = swapProposals.length === 0 ? '<div style="color:#666">No swap proposals found that would make this affordable.</div>' : swapProposals.map(sp => {
    const buy = sp.buy; const sell = sp.sell;
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee">
      <div>
        <div style="font-weight:600">${escapeHtml(buy.name)} ${sell ? `<small style="color:#c62828"> (requires selling ${escapeHtml(sell.name)})</small>` : ''}</div>
        <div style="font-size:12px;color:#666">${escapeHtml(buy.pos)} • ${escapeHtml(buy.club)} • Br ${buy.price}M</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="preview-single btn btn-ghost" data-id="${buy.id}">Preview</button>
        <button class="stage-swap btn btn-primary" data-buy="${buy.id}" data-sell="${sell ? sell.id : targetPlayerId}">Stage Swap</button>
      </div>
    </div>`;
  }).join('');

  const html = `<div>
    <h4>Direct candidates</h4>
    <div style="max-height:220px;overflow:auto">${directHtml}</div>
    <h4 style="margin-top:12px">Swap proposals</h4>
    <div style="max-height:220px;overflow:auto">${swapHtml}</div>
  </div>`;

  showModal({
    title: `Replacement suggestions for ${escapeHtml(target.name)}`,
    html,
    confirmText: 'Close',
    hideCancel: true,
    onConfirm: () => {}
  });

  // wire modal buttons after rendering
  setTimeout(() => {
    document.querySelectorAll('.stage-swap').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const buyId = Number(e.currentTarget.dataset.buy);
        const sellId = Number(e.currentTarget.dataset.sell);
        // Stage swap as two pending transfers (sell then buy)
        state.pendingTransfers.push({ id: Date.now()+1, type: 'sell', playerId: sellId, ts: Date.now(), removing: false });
        state.pendingTransfers.push({ id: Date.now()+2, type: 'buy', playerId: buyId, ts: Date.now(), removing: false });
        saveState();
        renderApp();
        showAlert(`Staged swap: sell ${sellId} + buy ${buyId}`);
      });
    });
    // preview-single already wired in main attachEventListeners; ensure handlers exist by reattaching below
    document.querySelectorAll('.preview-single').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.currentTarget.dataset.id);
        const inSquad = state.squad.includes(id);
        const extra = { type: inSquad ? 'sell' : 'buy', playerId: id };
        showTransferBreakdownModal(extra);
      });
    });
  }, 10);
}

/* ---------------------------
   10) CHIPS, advance, etc.
   --------------------------- */
function canActivateChip(chipName) {
  if (!CHIPS.includes(chipName)) return { ok: false, reason: 'Unknown chip' };
  if (state.usedChipsThisSeason.includes(chipName)) return { ok: false, reason: 'Chip already used this season' };
  if (state.activeChip && state.activeChip !== chipName) return { ok: false, reason: 'Another chip already active this Gameweek' };
  if (state.currentGameweek > 1 && !state.lastTransferConfirmed) return { ok: false, reason: 'You must confirm a transfer this Gameweek to activate a chip (GW2+).' };
  return { ok: true };
}
function playChip(chipName) {
  const check = canActivateChip(chipName); if (!check.ok) { showAlert(check.reason); return; }
  if (state.activeChip === chipName) {
    if (chipName === 'freeHit' && state.savedFreeHitSquad) { state.squad = [...state.savedFreeHitSquad]; state.savedFreeHitSquad = null; autoAssignXIAndBench(); }
    state.activeChip = null; saveState(); renderApp(); showAlert(`${chipName} cancelled.`); return;
  }
  if (chipName === 'freeHit') state.savedFreeHitSquad = [...state.squad];
  state.activeChip = chipName; state.lastTransferConfirmed = false; saveState(); renderApp(); showAlert(`${chipName} activated for GW ${state.currentGameweek}.`);
}
function advanceGameweek() {
  const valid = validateSquad(state.squad); if (!valid.ok) { showAlert(`Cannot advance: ${valid.reason}`); return; }
  if (state.currentGameweek === 1) state.freeTransfers = 1; else { const usedFTs = Math.min(state.freeTransfers, state.transfersMadeThisGW); state.freeTransfers = Math.min(5, Math.max(1, state.freeTransfers - usedFTs + 1)); }
  state.currentGameweek += 1; state.transfersMadeThisGW = 0; state.transferPenalty = 0; state.lastTransferConfirmed = false; state.activeChip = null; state.savedFreeHitSquad = null;
  autoAssignXIAndBench(); recalculateBank(); saveState(); renderApp(); showAlert(`Advanced to Gameweek ${state.currentGameweek}.`);
}

/* ---------------------------
   11) RENDERING (market includes suggest button & inline preview of squad value & club counts)
   --------------------------- */
function renderWelcome() { if (state.hasSeenWelcome) return ''; return `<div id="welcome-modal" class="modal-overlay"><div class="modal-card"><h2>Welcome to EPL Fantasy</h2><p>Select 15 players: 2 GK,5 DEF,5 MID,3 FWD. Budget Br ${INITIAL_BUDGET}M.</p><button id="close-welcome-btn" class="btn btn-primary">Got it</button></div></div>`; }
function renderHeader() {
  const squadVal = state.squad.reduce((s,id)=>{ const p=INITIAL_PLAYERS.find(x=>x.id===id); return s + (p? p.price:0); },0).toFixed(1);
  const ftLabel = state.currentGameweek===1 ? 'Unlimited' : `${state.freeTransfers} FT`;
  const hitLabel = state.transferPenalty > 0 ? `-${state.transferPenalty} pts` : '0 pts';
  const pendingCount = state.pendingTransfers.length;
  return `<header class="app-header" style="display:flex;justify-content:space-between;align-items:center;padding:12px 18px;background:#fff;border-bottom:1px solid #eee">
    <div><h1 style="margin:0">EPL Fantasy</h1><div style="font-size:13px;color:#666">GW ${state.currentGameweek}</div></div>
    <div style="display:flex;gap:12px;align-items:center">
      <div style="font-size:13px;color:#333">Bank: <strong>Br ${state.bank.toFixed(1)}M</strong></div>
      <div style="font-size:13px;color:#333">Squad: <strong>Br ${squadVal}M</strong></div>
      <div style="font-size:13px;color:#333">FT: <strong>${ftLabel}</strong></div>
      <div style="font-size:13px;color:#333">Hits: <strong>${hitLabel}</strong></div>
      <div style="font-size:13px;color:#333">Pending: <strong>${pendingCount}</strong></div>
      <button id="finalize-gw-btn" class="btn btn-primary">Finalize GW (simulate)</button>
    </div>
  </header>`;
}
function renderNav() {
  return `<nav class="tab-nav" style="display:flex;gap:8px;padding:10px 18px;background:#fafafa;border-bottom:1px solid #eee">
    <button class="tab-btn ${state.activeTab==='pick-team'?'active':''}" data-tab="pick-team">Pick Team</button>
    <button class="tab-btn ${state.activeTab==='transfers'?'active':''}" data-tab="transfers">Transfers</button>
    <button class="tab-btn ${state.activeTab==='points'?'active':''}" data-tab="points">Points</button>
    <button class="tab-btn ${state.activeTab==='rules'?'active':''}" data-tab="rules">Rules</button>
  </nav>`;
}

function renderPitch() {
  const starters = state.startingXI.map(id => INITIAL_PLAYERS.find(p => p.id === id)).filter(Boolean);
  const groups = { GK: [], DEF: [], MID: [], FWD: [] };
  starters.forEach(p => groups[p.pos].push(p));
  const chipsHtml = CHIPS.map(chip => { const used = state.usedChipsThisSeason.includes(chip); const active = state.activeChip===chip; return `<button class="chip-btn" data-chip="${escapeHtml(chip)}" ${used? 'disabled':''}>${escapeHtml(chip)}${used? ' (used)':''}${active? ' (active)':''}</button>`; }).join(' ');
  const renderCard = (p) => `<div class="player-card filled" data-player-id="${p.id}" style="border:1px solid #eee;padding:8px;border-radius:8px;margin:6px;background:#fff"><div style="font-weight:600">${escapeHtml(p.name)} ${state.captainId===p.id?'<small>(C)</small>':''}</div><div style="font-size:12px;color:#666">${escapeHtml(p.pos)} • ${escapeHtml(p.club)}</div></div>`;
  return `<div style="padding:16px"><div style="margin-bottom:12px">${chipsHtml}</div>
    <div class="row gk">${groups.GK.map(p=>renderCard(p)).join('')}</div>
    <div class="row def">${groups.DEF.map(p=>renderCard(p)).join('')}</div>
    <div class="row mid">${groups.MID.map(p=>renderCard(p)).join('')}</div>
    <div class="row fwd">${groups.FWD.map(p=>renderCard(p)).join('')}</div>
    <div style="margin-top:16px"><h3>Bench</h3><div style="display:flex;gap:8px">${state.bench.map(id=> { const p=INITIAL_PLAYERS.find(x=>x.id===id); return `<div style="border:1px solid #eee;padding:6px;border-radius:8px;background:#fff">${escapeHtml(p.name)} • ${escapeHtml(p.pos)}</div>`; }).join('')}</div></div></div>`;
}

function renderTransfers() {
  const marketHtml = INITIAL_PLAYERS.map(p => {
    const inSquad = state.squad.includes(p.id);
    const pendingBuy = state.pendingTransfers.find(t => t.type === 'buy' && t.playerId === p.id);
    const pendingSell = state.pendingTransfers.find(t => t.type === 'sell' && t.playerId === p.id);
    const check = canBuyPlayerImmediate(p);
    const buyDisabled = inSquad || !check.allowed;
    const buyPreview = calculatePendingPreview({ type:'buy', playerId: p.id });
    const sellPreview = calculatePendingPreview({ type:'sell', playerId: p.id });

    const previewHtml = pendingBuy ? `<span style="color:#155724;background:#d4edda;padding:4px 8px;border-radius:6px;font-size:12px">Pending Buy • Br ${p.price}M</span>`
      : pendingSell ? `<span style="color:#856404;background:#fff3cd;padding:4px 8px;border-radius:6px;font-size:12px">Pending Sell • Br ${getSellingPrice(p)}M</span>`
      : `<span style="font-size:12px;color:#555">Preview Bank: <strong>Br ${buyPreview.projectedBank}M</strong></span>`;

    // club count after hypothetical buy
    const clubCounts = buyPreview.projectedClubCounts;
    const clubCountForP = clubCounts[p.club] || 0;
    const clubOver = clubCountForP > MAX_PER_CLUB;

    return `<div class="market-item" style="display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid #f0f0f0">
      <div style="display:flex;gap:12px;align-items:center">
        <div style="font-weight:600">${escapeHtml(p.name)}</div>
        <div style="font-size:12px;color:#666">${escapeHtml(p.pos)} • ${escapeHtml(p.club)}</div>
        <div style="margin-left:8px">${previewHtml}</div>
        ${clubOver ? `<div style="margin-left:8px;color:#c62828;font-weight:700">Club ${escapeHtml(p.club)}: ${clubCountForP}</div>` : ''}
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <div style="font-weight:700">Br ${p.price}M</div>
        ${inSquad ? `<button class="stage-sell btn" data-id="${p.id}">Stage Sell</button>` : `<button class="stage-buy btn" data-id="${p.id}" ${buyDisabled ? 'disabled' : ''}>Stage Buy</button>`}
        <button class="preview-single btn btn-ghost" data-id="${p.id}">Preview Cost</button>
        <button class="suggest-btn btn btn-ghost" data-id="${p.id}">Suggest replacements</button>
      </div>
    </div>`;
  }).join('');

  const pendingHtml = state.pendingTransfers.map(t => {
    const p = INITIAL_PLAYERS.find(x => x.id === t.playerId);
    const typeLabel = t.type === 'buy' ? 'Buy' : 'Sell';
    const priceLabel = t.type === 'buy' ? `Br ${p.price}M` : `Br ${getSellingPrice(p)}M`;
    return `<div class="pending-item ${t.removing? 'removing':''}" data-pending-id="${t.id}" style="display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid #eee;border-radius:8px;margin-bottom:8px;background:#fff">
      <div><div style="font-weight:600">${typeLabel} ${escapeHtml(p.name)}</div><div style="font-size:12px;color:#666">${priceLabel} • ${new Date(t.ts).toLocaleTimeString()}</div></div>
      <div><button class="pending-undo btn btn-ghost" data-id="${t.id}">Undo</button></div>
    </div>`;
  }).join('');

  const preview = calculatePendingPreview();
  const previewHtml = `<div style="padding:10px;border-radius:8px;background:#fbfbff;border:1px solid #eef">
    <div style="display:flex;justify-content:space-between"><div>Projected Bank</div><div><strong>Br ${preview.projectedBank}M</strong></div></div>
    <div style="display:flex;justify-content:space-between;margin-top:6px"><div>Projected Squad Value</div><div><strong>Br ${preview.projectedSquadValue}M</strong></div></div>
    <div style="display:flex;justify-content:space-between;margin-top:6px"><div>Projected Hits</div><div><strong>-${preview.projectedHits} pts</strong></div></div>
    <div style="margin-top:8px;font-size:13px;color:#555">Transfers to apply: <strong>${preview.transfersApplied}</strong></div>
  </div>`;

  return `<div style="display:flex;gap:16px;padding:16px">
    <div style="flex:1;max-width:760px">
      <h3>Market</h3>
      <div style="border:1px solid #eee;border-radius:8px;overflow:hidden">${marketHtml}</div>
    </div>
    <aside style="width:360px">
      <h4>Pending Transfers</h4>
      <div id="pending-list">${pendingHtml || '<div style="color:#666">No pending transfers</div>'}</div>
      <div style="margin-top:12px">${previewHtml}</div>
      <div style="margin-top:12px;display:flex;gap:8px"><button id="confirm-transfers-btn" class="btn btn-primary" ${state.pendingTransfers.length===0?'disabled':''}>Confirm Transfers</button><button id="clear-transfers-btn" class="btn btn-ghost" ${state.pendingTransfers.length===0?'disabled':''}>Clear Pending</button></div>
    </aside>
  </div>`;
}

function renderPoints() { return `<div style="padding:16px"><h2>History</h2>${state.history.length===0?'<p>No GWs yet</p>':state.history.map(h=>`<div style="padding:8px;border-bottom:1px solid #eee">GW ${h.gw}: Net ${h.netPoints} (Gross ${h.grossPoints}, Hits -${h.hits})</div>`).join('')}</div>`; }
function renderRules() { return `<div style="padding:16px"><h2>Rules Summary</h2><ul><li>Pick 15 players: 2 GK,5 DEF,5 MID,3 FWD</li><li>Budget Br ${INITIAL_BUDGET}M; max 3 per club</li><li>1 FT per GW (rollover up to 5); extra transfers cost -4 each</li><li>Chips: Wildcard, Free Hit, Triple Captain, Bench Boost</li></ul></div>`; }

function renderApp() {
  const root = document.getElementById('app') || document.body;
  let main = '';
  if (state.activeTab === 'pick-team') main = renderPitch();
  else if (state.activeTab === 'transfers') main = renderTransfers();
  else if (state.activeTab === 'points') main = renderPoints();
  else main = renderRules();

  root.innerHTML = `${renderWelcome()}${renderHeader()}${renderNav()}<main>${main}</main>`;
  attachEventListeners();
  ensureModalRoot();
}

/* ---------------------------
   12) EVENTS wiring
   --------------------------- */
function attachEventListeners() {
  const closeWelcome = document.getElementById('close-welcome-btn');
  if (closeWelcome) closeWelcome.addEventListener('click', () => { state.hasSeenWelcome = true; saveState(); renderApp(); });

  document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', e => { state.activeTab = e.currentTarget.dataset.tab; renderApp(); }));

  const finalizeBtn = document.getElementById('finalize-gw-btn');
  if (finalizeBtn) finalizeBtn.addEventListener('click', () => {
    showModal({
      title: 'Finalize GW (simulate)',
      html: `<div><label>Paste playedData JSON (playerId -> stats):</label><textarea id="gw-played-json" style="width:100%;height:160px"></textarea></div>`,
      onConfirm: () => {
        const raw = document.getElementById('gw-played-json').value;
        try { const obj = JSON.parse(raw); finalizeGameweek(obj); } catch (e) { showAlert('Invalid JSON'); }
      },
      confirmText: 'Run Finalize',
      cancelText: 'Cancel'
    });
  });

  document.querySelectorAll('.stage-buy').forEach(btn => btn.addEventListener('click', e => { const id = Number(e.currentTarget.dataset.id); stageBuy(id); }));
  document.querySelectorAll('.stage-sell').forEach(btn => btn.addEventListener('click', e => { const id = Number(e.currentTarget.dataset.id); stageSell(id); }));

  document.querySelectorAll('.preview-single').forEach(btn => btn.addEventListener('click', e => {
    const id = Number(e.currentTarget.dataset.id);
    const inSquad = state.squad.includes(id);
    const extra = { type: inSquad ? 'sell' : 'buy', playerId: id };
    showTransferBreakdownModal(extra);
  }));

  document.querySelectorAll('.suggest-btn').forEach(btn => btn.addEventListener('click', e => {
    const id = Number(e.currentTarget.dataset.id);
    showReplacementModal(id);
  }));

  document.querySelectorAll('.pending-undo').forEach(btn => btn.addEventListener('click', e => {
    const id = Number(e.currentTarget.dataset.id);
    removePendingByIdAnimated(id);
  }));

  const confirmBtn = document.getElementById('confirm-transfers-btn');
  if (confirmBtn) confirmBtn.addEventListener('click', () => {
    if (state.pendingTransfers.length === 0) { showAlert('No pending transfers'); return; }
    showTransferBreakdownModal(null, () => {});
  });

  const clearBtn = document.getElementById('clear-transfers-btn');
  if (clearBtn) clearBtn.addEventListener('click', () => clearPendingTransfers());

  document.querySelectorAll('.chip-btn').forEach(btn => btn.addEventListener('click', e => { const chip = e.currentTarget.dataset.chip; playChip(chip); }));
}

/* ---------------------------
   13) INIT
   --------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  autoAssignXIAndBench();
  recalculateBank();
  updateTransferPenalty();
  renderApp();
});
