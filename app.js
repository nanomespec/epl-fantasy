/* ==========================================================================
   EPL-FANTASY app.js — UX improvements
   - Staged transfer list with detailed items and Undo
   - Transfer cost & hits preview before confirm
   - Custom modal dialogs (alert/confirm/prompt replacement)
   - Keeps all previous game logic: validation, formations, chips, GW finalize
   ========================================================================== */

/* ---------------------------
   1) DATA + CONSTANTS (unchanged)
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
   2) STATE (unchanged fields + pendingTransfers)
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
  pendingTransfers: [], // staged transfers: { id, type:'buy'|'sell', playerId, ts }
  history: [],
  hasSeenWelcome: false,
  _gwCaptainOverride: null
};

/* ---------------------------
   3) UTILITIES + MODAL UI
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
    try { const parsed = JSON.parse(s); state = Object.assign(state, parsed); } catch (e) {}
  }
}

/* Modal system: insert modal root once, and helper functions showAlert/confirm/prompt-like */
function ensureModalRoot() {
  if (document.getElementById('app-modal-root')) return;
  const root = document.createElement('div');
  root.id = 'app-modal-root';
  document.body.appendChild(root);
  root.style.position = 'fixed';
  root.style.left = '0'; root.style.top = '0'; root.style.width = '100%'; root.style.height = '100%';
  root.style.display = 'none';
  root.style.alignItems = 'center';
  root.style.justifyContent = 'center';
  root.style.zIndex = 9999;
}

function showModal({ title = '', html = '', onConfirm = null, onCancel = null, confirmText = 'OK', cancelText = 'Cancel', hideCancel = false }) {
  ensureModalRoot();
  const root = document.getElementById('app-modal-root');
  root.innerHTML = `
    <div class="modal-overlay" style="position:fixed;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;">
      <div class="modal-card" style="background:#fff;padding:18px;border-radius:8px;max-width:720px;width:90%;box-shadow:0 6px 30px rgba(0,0,0,0.3)">
        <h3 style="margin-top:0">${escapeHtml(title)}</h3>
        <div class="modal-body" style="margin:12px 0">${html}</div>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          ${hideCancel ? '' : `<button id="modal-cancel-btn" class="btn">${escapeHtml(cancelText)}</button>`}
          <button id="modal-confirm-btn" class="btn btn-primary">${escapeHtml(confirmText)}</button>
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

  // click overlay to cancel
  root.querySelector('.modal-overlay').onclick = (e) => {
    if (e.target === root.querySelector('.modal-overlay')) {
      cleanup(); if (onCancel) onCancel();
    }
  };
}

function showAlert(message) {
  showModal({ title: 'Notice', html: `<div>${escapeHtml(message)}</div>`, onConfirm: null, cancelText: 'Close', hideCancel: true, confirmText: 'Close' });
}

function showConfirm(message, onYes, onNo) {
  showModal({ title: 'Confirm', html: `<div>${escapeHtml(message)}</div>`, onConfirm: onYes, onCancel: onNo, confirmText: 'Yes', cancelText: 'No' });
}

/* ---------------------------
   4) VALIDATION, ECONOMY & HELPERS (same logic)
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
  if (state.currentGameweek === 1 || state.activeChip === 'wildcard' || state.activeChip === 'freeHit') {
    state.transferPenalty = 0; return;
  }
  const excess = Math.max(0, state.transfersMadeThisGW - state.freeTransfers);
  state.transferPenalty = excess * HIT_PENALTY_PTS;
}

function getSellingPrice(player) {
  const buyPrice = state.purchasePrices[player.id] !== undefined ? state.purchasePrices[player.id] : player.price;
  if (player.price > buyPrice) {
    const profit = player.price - buyPrice;
    const splitProfit = Math.floor((profit * 10) / 2) / 10;
    return parseFloat((buyPrice + splitProfit).toFixed(1));
  }
  return player.price;
}

/* ---------------------------
   5) TRANSFERS UX IMPROVEMENTS (staging, undo, preview)
   --------------------------- */
let pendingIdCounter = 1;

function stageBuy(playerId) {
  const player = INITIAL_PLAYERS.find(p => p.id === playerId);
  if (!player) return;
  // Don't allow same buy twice in pending; allow buy-sell combos (sell then buy) but handle on confirm
  if (state.pendingTransfers.find(t => t.type === 'buy' && t.playerId === playerId)) {
    showAlert('This buy is already pending.');
    return;
  }
  state.pendingTransfers.push({ id: pendingIdCounter++, type: 'buy', playerId, ts: Date.now() });
  renderApp();
}

function stageSell(playerId) {
  const player = INITIAL_PLAYERS.find(p => p.id === playerId);
  if (!player) return;
  if (!state.squad.includes(playerId)) { showAlert('Player not in squad'); return; }
  if (state.pendingTransfers.find(t => t.type === 'sell' && t.playerId === playerId)) {
    showAlert('This sell is already pending.');
    return;
  }
  state.pendingTransfers.push({ id: pendingIdCounter++, type: 'sell', playerId, ts: Date.now() });
  renderApp();
}

function removePendingById(pendingId) {
  state.pendingTransfers = state.pendingTransfers.filter(t => t.id !== pendingId);
  renderApp();
}

function clearPendingTransfers() {
  if (state.pendingTransfers.length === 0) return;
  showConfirm('Clear all pending transfers?', () => {
    state.pendingTransfers = [];
    renderApp();
  });
}

function calculatePendingPreview() {
  // returns { projectedBank, projectedHits, transfersApplied, buys:[], sells:[] }
  const buys = state.pendingTransfers.filter(t => t.type === 'buy').map(t => INITIAL_PLAYERS.find(p => p.id === t.playerId));
  const sells = state.pendingTransfers.filter(t => t.type === 'sell').map(t => INITIAL_PLAYERS.find(p => p.id === t.playerId));

  const sumBuys = buys.reduce((s, p) => s + (p ? p.price : 0), 0);
  const sumSells = sells.reduce((s, p) => s + (p ? getSellingPrice(p) : 0), 0);

  let projectedBank = state.bank - sumBuys + sumSells;
  // account for buy/sell of same player? sells remove from squad before buys; we assume user stages logically.

  // transfers count: transfersMadeThisGW + pending (except wildcard/freeHit)
  const pendingCount = state.pendingTransfers.length;
  let projectedTransfersMade = state.transfersMadeThisGW + pendingCount;

  const usingWildcard = state.activeChip === 'wildcard';
  const usingFreeHit = state.activeChip === 'freeHit';

  let extraTransfers = 0;
  if (!usingWildcard && !usingFreeHit) {
    extraTransfers = Math.max(0, projectedTransfersMade - state.freeTransfers);
  } else {
    extraTransfers = 0;
  }
  const projectedHits = extraTransfers * HIT_PENALTY_PTS;

  return {
    projectedBank: parseFloat(projectedBank.toFixed(1)),
    projectedHits,
    transfersApplied: pendingCount,
    buys, sells
  };
}

function confirmTransfers() {
  if (state.pendingTransfers.length === 0) {
    showAlert('No staged transfers to confirm.'); return;
  }
  const preview = calculatePendingPreview();
  const msg = `You are about to confirm ${preview.transfersApplied} transfer(s).\nProjected bank: Br ${preview.projectedBank}M\nProjected hits: -${preview.projectedHits} pts\nProceed?`;
  showConfirm(msg, () => {
    // apply pending transfers (similar logic to earlier confirmTransfers)
    const usingWildcard = state.activeChip === 'wildcard';
    const usingFreeHit = state.activeChip === 'freeHit';
    let applied = 0;

    // apply sells first to free up budget
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

    // apply buys
    const buys = state.pendingTransfers.filter(t => t.type === 'buy');
    for (const t of buys) {
      const player = INITIAL_PLAYERS.find(p => p.id === t.playerId);
      if (!player) continue;
      // re-check immediate buy constraints (bank etc)
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

    // if freeHit, ensure savedFreeHitSquad was set on activation (done elsewhere)
    // clear pending transfers after applying
    state.pendingTransfers = [];
    recalculateBank();
    updateTransferPenalty();
    autoAssignXIAndBench();
    saveState();
    renderApp();
    showAlert(`Confirmed ${applied} transfers.`);
  });
}

/* ---------------------------
   6) Other game logic (formation, autosub, scoring)
   - Kept largely the same as before; omitted comments for brevity
   --------------------------- */

function canBuyPlayerImmediate(player) {
  if (state.squad.includes(player.id)) return { allowed: false, reason: "Already in squad" };
  if (state.squad.length >= MAX_SQUAD_SIZE) return { allowed: false, reason: "Squad full (15/15)" };
  if (state.bank < player.price) return { allowed: false, reason: "Insufficient budget" };
  const posCount = state.squad.filter(id => {
    const p = INITIAL_PLAYERS.find(x => x.id === id);
    return p && p.pos === player.pos;
  }).length;
  if (posCount >= SQUAD_RULES[player.pos]) return { allowed: false, reason: `Max ${SQUAD_RULES[player.pos]} ${player.pos}s allowed` };
  const clubCount = state.squad.filter(id => {
    const p = INITIAL_PLAYERS.find(x => x.id === id);
    return p && p.club === player.club;
  }).length;
  if (clubCount >= MAX_PER_CLUB) return { allowed: false, reason: `Max ${MAX_PER_CLUB} players per club` };
  return { allowed: true };
}

function autoAssignXIAndBench() {
  state.startingXI = [];
  state.bench = [];
  const squadPlayers = state.squad.map(id => INITIAL_PLAYERS.find(p => p.id === id)).filter(Boolean);
  if (squadPlayers.length === 0) { state.startingXI = []; state.bench = []; return; }
  const gkList = squadPlayers.filter(p => p.pos === 'GK').sort((a,b) => b.points - a.points);
  const defList = squadPlayers.filter(p => p.pos === 'DEF').sort((a,b) => b.points - a.points);
  const midList = squadPlayers.filter(p => p.pos === 'MID').sort((a,b) => b.points - a.points);
  const fwdList = squadPlayers.filter(p => p.pos === 'FWD').sort((a,b) => b.points - a.points);
  if (gkList.length === 0) { state.startingXI = []; state.bench = state.squad.slice(); return; }
  let bestSetup = { total: -Infinity, starters: [] };
  ALLOWED_FORMATIONS.forEach(form => {
    if (gkList.length < 1) return;
    if (defList.length < form.def) return;
    if (midList.length < form.mid) return;
    if (fwdList.length < form.fwd) return;
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

/* Auto substitutions & scoring functions (same as before) */
function normalizeStat(obj = {}) {
  return {
    minutes: Number(obj.minutes || 0), goals: Number(obj.goals || 0), assists: Number(obj.assists || 0),
    conceded: Number(obj.conceded || 0), saves: Number(obj.saves || 0), yellow: Number(obj.yellow || 0),
    red: Number(obj.red || 0), ownGoal: Number(obj.ownGoal || 0), penSave: Number(obj.penSave || 0),
    penMiss: Number(obj.penMiss || 0), bonus: Number(obj.bonus || 0), cbi: Number(obj.cbi || 0), recoveries: Number(obj.recoveries || 0)
  };
}

function formationValidAfterSwap(startersIds) {
  const players = startersIds.map(id => INITIAL_PLAYERS.find(p => p.id === id)).filter(Boolean);
  const counts = { GK:0, DEF:0, MID:0, FWD:0 };
  players.forEach(p => { counts[p.pos] = (counts[p.pos]||0)+1; });
  return counts.GK === 1 && counts.DEF >= 3 && counts.FWD >= 1 && players.length === 11;
}

function applyAutomaticSubstitutions(playedData) {
  const stats = {};
  for (const k in playedData) stats[Number(k)] = normalizeStat(playedData[k]);
  const starters = state.startingXI.slice();
  const bench = state.bench.slice();
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
    const sStats = stats[sid] || { minutes:0 };
    if ((sStats.minutes || 0) > 0) continue;
    let candidateIndex = -1;
    for (let bi = 0; bi < bench.length; bi++) {
      const bid = bench[bi]; const b = INITIAL_PLAYERS.find(x => x.id === bid);
      if (!b) continue;
      const bStats = stats[bid] || { minutes:0 };
      if ((bStats.minutes || 0) === 0) continue;
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
  const m = normalizeStat(matchStats || {});
  let pts = 0;
  if (m.minutes >= 60) pts += 2; else if (m.minutes > 0) pts += 1;
  if (m.goals > 0) {
    if (player.pos === 'GK') pts += 10 * m.goals;
    else if (player.pos === 'DEF') pts += 6 * m.goals;
    else if (player.pos === 'MID') pts += 5 * m.goals;
    else if (player.pos === 'FWD') pts += 4 * m.goals;
  }
  pts += 3 * m.assists;
  if (m.minutes >= 60) {
    if ((player.pos === 'GK' || player.pos === 'DEF') && (m.conceded === 0)) pts += 4;
    else if (player.pos === 'MID' && (m.conceded === 0)) pts += 1;
  }
  if (player.pos === 'GK' && m.saves) pts += Math.floor(m.saves / 3);
  if (player.pos === 'DEF' && (m.cbi || 0) >= 10) pts += 2;
  if ((player.pos === 'MID' || player.pos === 'FWD') && ((m.cbi || 0) + (m.recoveries || 0) >= 12)) pts += 2;
  pts += (m.penSave || 0) * 5; pts += (m.penMiss || 0) * -2;
  pts += (m.bonus || 0);
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
    const p = INITIAL_PLAYERS.find(x => x.id === id);
    const s = stats[id] || { minutes: 0 };
    let pts = calculatePlayerPoints(p, s);
    if (id === captainId) { if (state.activeChip === 'tripleCaptain') pts *= 3; else pts *= 2; }
    perPlayerPoints[id] = pts; grossPoints += pts;
  });
  if (state.activeChip === 'benchBoost') {
    state.bench.forEach(id => { const p = INITIAL_PLAYERS.find(x => x.id === id); const s = stats[id] || {}; const pts = calculatePlayerPoints(p, s); perPlayerPoints[id] = pts; grossPoints += pts; });
  } else {
    state.bench.forEach(id => { const p = INITIAL_PLAYERS.find(x => x.id === id); const s = stats[id] || {}; perPlayerPoints[id] = calculatePlayerPoints(p, s); });
  }
  const hits = state.transferPenalty || 0; const netPoints = grossPoints - hits;
  const gwResult = { gw: state.currentGameweek, grossPoints, hits, netPoints, perPlayerPoints, starters: [...state.startingXI], bench: [...state.bench], captainId, usedChip: state.activeChip };
  state.history = state.history || []; state.history.push(gwResult);
  if (state.activeChip === 'freeHit' && state.savedFreeHitSquad) { state.squad = [...state.savedFreeHitSquad]; state.savedFreeHitSquad = null; }
  if (state.activeChip) { if (!state.usedChipsThisSeason.includes(state.activeChip)) state.usedChipsThisSeason.push(state.activeChip); }
  state.activeChip = null; state.lastTransferConfirmed = false; state.transfersMadeThisGW = 0; state.transferPenalty = 0;
  autoAssignXIAndBench(); saveState(); renderApp();
  showAlert(`Gameweek ${gwResult.gw} finalised.\nGross: ${grossPoints} pts\nHits: -${hits} pts\nNet: ${netPoints} pts`);
  return gwResult;
}

/* ---------------------------
   7) CHIPS & GW ADVANCE (small helpers)
   --------------------------- */
function canActivateChip(chipName) {
  if (!CHIPS.includes(chipName)) return { ok: false, reason: 'Unknown chip' };
  if (state.usedChipsThisSeason.includes(chipName)) return { ok: false, reason: 'Chip already used this season' };
  if (state.activeChip && state.activeChip !== chipName) return { ok: false, reason: 'Another chip already active this Gameweek' };
  if (state.currentGameweek > 1 && !state.lastTransferConfirmed) return { ok: false, reason: 'You must confirm a transfer this Gameweek to activate a chip (GW2+).' };
  return { ok: true };
}

function playChip(chipName) {
  const check = canActivateChip(chipName);
  if (!check.ok) { showAlert(check.reason); return; }
  if (state.activeChip === chipName) {
    if (chipName === 'freeHit' && state.savedFreeHitSquad) { state.squad = [...state.savedFreeHitSquad]; state.savedFreeHitSquad = null; autoAssignXIAndBench(); }
    state.activeChip = null; saveState(); renderApp(); showAlert(`${chipName} cancelled.`); return;
  }
  if (chipName === 'freeHit') state.savedFreeHitSquad = [...state.squad];
  state.activeChip = chipName; state.lastTransferConfirmed = false; saveState(); renderApp(); showAlert(`${chipName} activated for GW ${state.currentGameweek}.`);
}

function advanceGameweek() {
  const valid = validateSquad(state.squad);
  if (!valid.ok) { showAlert(`Cannot advance: ${valid.reason}`); return; }
  if (state.currentGameweek === 1) state.freeTransfers = 1;
  else {
    const usedFTs = Math.min(state.freeTransfers, state.transfersMadeThisGW);
    state.freeTransfers = Math.min(5, Math.max(1, state.freeTransfers - usedFTs + 1));
  }
  state.currentGameweek += 1; state.transfersMadeThisGW = 0; state.transferPenalty = 0; state.lastTransferConfirmed = false; state.activeChip = null; state.savedFreeHitSquad = null;
  autoAssignXIAndBench(); recalculateBank(); saveState(); renderApp(); showAlert(`Advanced to Gameweek ${state.currentGameweek}.`);
}

/* ---------------------------
   8) RENDERING (updated Transfers view + modal)
   --------------------------- */
function renderWelcome() {
  if (state.hasSeenWelcome) return '';
  return `<div id="welcome-modal" class="modal-overlay"><div class="modal-card"><h2>Welcome to Ethiopian Premier League Fantasy</h2><p>Select 15 players: 2 GK,5 DEF,5 MID,3 FWD. Budget Br ${INITIAL_BUDGET}M.</p><button id="close-welcome-btn">Got it</button></div></div>`;
}

function renderHeader() {
  const squadVal = state.squad.reduce((s,id)=>{ const p = INITIAL_PLAYERS.find(x=>x.id===id); return s + (p? p.price:0); },0).toFixed(1);
  const ftLabel = state.currentGameweek===1 ? 'Unlimited' : `${state.freeTransfers} FT`;
  const hitLabel = state.transferPenalty > 0 ? `-${state.transferPenalty} pts` : '0 pts';
  const pendingCount = state.pendingTransfers.length;
  return `<header class="app-header"><div class="brand"><h1>EPL Fantasy</h1><div>GW ${state.currentGameweek}</div></div><div class="stats"><div>Bank: Br ${state.bank.toFixed(1)}M</div><div>Squad value: Br ${squadVal}M</div><div>Free Transfers: ${ftLabel}</div><div>Hits: ${hitLabel}</div><div>Pending: ${pendingCount}</div><button id="finalize-gw-btn">Finalize GW (simulate)</button></div></header>`;
}

function renderNav() {
  return `<nav class="tab-nav"><button class="tab-btn ${state.activeTab==='pick-team'?'active':''}" data-tab="pick-team">Pick Team</button><button class="tab-btn ${state.activeTab==='transfers'?'active':''}" data-tab="transfers">Transfers</button><button class="tab-btn ${state.activeTab==='points'?'active':''}" data-tab="points">Points</button><button class="tab-btn ${state.activeTab==='rules'?'active':''}" data-tab="rules">Rules</button></nav>`;
}

function renderPitch() {
  const starters = state.startingXI.map(id => INITIAL_PLAYERS.find(p=>p.id===id)).filter(Boolean);
  const groups = { GK:[], DEF:[], MID:[], FWD:[] };
  starters.forEach(p => groups[p.pos].push(p));
  const chipsHtml = CHIPS.map(chip=>{ const used = state.usedChipsThisSeason.includes(chip); const active = state.activeChip===chip; return `<button class="chip-btn" data-chip="${escapeHtml(chip)}" ${used?'disabled':''}>${escapeHtml(chip)}${used? ' (used)':''}${active? ' (active)':''}</button>`; }).join(' ');
  const renderCard = (p, filled=true) => { if(!filled) return `<div class="player-card empty"><div class="add-slot">+</div></div>`; return `<div class="player-card filled" data-player-id="${p.id}"><div class="name">${escapeHtml(p.name)} ${state.captainId===p.id?'<strong>(C)</strong>':''} ${state.viceCaptainId===p.id?'<em>(VC)</em>':''}</div><div class="meta">${escapeHtml(p.pos)} • ${escapeHtml(p.club)}</div></div>`; };
  return `<div class="pitch"><div class="chips-area">${chipsHtml}</div><div class="row gk">${groups.GK.map(p=>renderCard(p)).join('')}</div><div class="row def">${groups.DEF.map(p=>renderCard(p)).join('')}</div><div class="row mid">${groups.MID.map(p=>renderCard(p)).join('')}</div><div class="row fwd">${groups.FWD.map(p=>renderCard(p)).join('')}</div><div class="bench"><h3>Bench</h3><div class="bench-row">${state.bench.map(id=>{ const p=INITIAL_PLAYERS.find(x=>x.id===id); return `<div class="bench-card" data-player-id="${id}">${escapeHtml(p.name)} • ${escapeHtml(p.pos)}</div>`; }).join('')}</div></div></div>`;
}

function renderTransfers() {
  const listHtml = INITIAL_PLAYERS.map(p => {
    const inSquad = state.squad.includes(p.id);
    const check = canBuyPlayerImmediate(p);
    const buyDisabled = inSquad || !check.allowed;
    return `<div class="market-item"><div class="info">${escapeHtml(p.name)} • ${escapeHtml(p.pos)} • ${escapeHtml(p.club)}</div><div class="actions"><span>Br ${p.price}M</span>${inSquad ? `<button class="stage-sell" data-id="${p.id}">Stage Sell</button>` : `<button class="stage-buy" data-id="${p.id}" ${buyDisabled? 'disabled':''}>Stage Buy</button>`}</div></div>`;
  }).join('');

  const pendingHtml = state.pendingTransfers.map((t, idx) => {
    const p = INITIAL_PLAYERS.find(x => x.id === t.playerId);
    const typeLabel = t.type === 'buy' ? 'Buy' : 'Sell';
    const priceLabel = t.type === 'buy' ? `Br ${p.price}M` : `Br ${getSellingPrice(p)}M`;
    return `<div class="pending-item" data-pending-id="${t.id}"><div class="pending-main"><strong>${typeLabel}</strong> ${escapeHtml(p.name)} <span class="pending-price">${priceLabel}</span></div><div class="pending-meta"><small>${new Date(t.ts).toLocaleTimeString()}</small></div><button class="pending-undo" data-pid="${t.id}">Undo</button></div>`;
  }).join('');

  const preview = calculatePendingPreview();
  const previewHtml = `<div class="preview"><div>Projected Bank: <strong>Br ${preview.projectedBank}M</strong></div><div>Projected Hits: <strong>-${preview.projectedHits} pts</strong></div><div>Transfers to apply: <strong>${preview.transfersApplied}</strong></div></div>`;

  const canConfirm = state.pendingTransfers.length > 0;

  return `<div class="transfers-view"><div class="market"><h3>Market</h3>${listHtml}</div><aside class="pending-panel"><h4>Pending Transfers</h4>${pendingHtml || '<div class="none-pending">(none)</div>'}${previewHtml}<div style="margin-top:10px;"><button id="confirm-transfers-btn" ${canConfirm ? '' : 'disabled'}>Confirm Transfers</button> <button id="clear-transfers-btn" ${canConfirm ? '' : 'disabled'}>Clear Pending</button></div></aside></div>`;
}

function renderPoints() {
  return `<div class="points"><h2>Gameweek History</h2>${state.history.length===0? '<p>No results yet.</p>' : state.history.map(h => `<div class="gw-card"><h3>GW ${h.gw}: Net ${h.netPoints} pts (Gross ${h.grossPoints}, Hits -${h.hits})</h3></div>`).join('')}</div>`;
}

function renderRules() {
  return `<div class="rules"><h2>Rules Summary</h2><ul><li>Pick 15 players: 2 GK,5 DEF,5 MID,3 FWD</li><li>Budget Br ${INITIAL_BUDGET}M; max 3 per club</li><li>Pick Starting 11 by deadline; automatic subs apply</li><li>1 FT per GW (rollover up to 5), extra transfers cost -4 each</li><li>Chips: Wildcard, Free Hit, Triple Captain, Bench Boost (1 per GW)</li></ul></div>`;
}

function renderApp() {
  const root = document.getElementById('app') || document.body;
  let main = '';
  if (state.activeTab === 'pick-team') main = renderPitch();
  else if (state.activeTab === 'transfers') main = renderTransfers();
  else if (state.activeTab === 'points') main = renderPoints();
  else main = renderRules();

  root.innerHTML = `${renderWelcome()}${renderHeader()}${renderNav()}<main class="main-content">${main}</main>`;
  attachEventListeners();
  ensureModalRoot();
}

/* ---------------------------
   9) EVENTS wiring (updated to use Undo & modal)
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
        try {
          const obj = JSON.parse(raw);
          finalizeGameweek(obj);
        } catch (e) { showAlert('Invalid JSON'); }
      },
      confirmText: 'Run Finalize',
      cancelText: 'Cancel'
    });
  });

  document.querySelectorAll('.stage-buy').forEach(btn => btn.addEventListener('click', e => { const id = Number(e.currentTarget.dataset.id); stageBuy(id); }));
  document.querySelectorAll('.stage-sell').forEach(btn => btn.addEventListener('click', e => { const id = Number(e.currentTarget.dataset.id); stageSell(id); }));

  document.querySelectorAll('.pending-undo').forEach(btn => btn.addEventListener('click', e => {
    const pid = Number(e.currentTarget.dataset.pid);
    removePendingById(pid);
  }));

  const confirmBtn = document.getElementById('confirm-transfers-btn');
  if (confirmBtn) confirmBtn.addEventListener('click', confirmTransfers);

  const clearBtn = document.getElementById('clear-transfers-btn');
  if (clearBtn) clearBtn.addEventListener('click', () => { if (state.pendingTransfers.length === 0) return; showConfirm('Clear pending transfers?', () => { state.pendingTransfers = []; renderApp(); }); });

  document.querySelectorAll('.chip-btn').forEach(btn => btn.addEventListener('click', e => {
    const chip = e.currentTarget.dataset.chip;
    playChip(chip);
  }));
}

/* ---------------------------
   10) INIT
   --------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  autoAssignXIAndBench();
  recalculateBank();
  updateTransferPenalty();
  renderApp();
});

/* End of file */
