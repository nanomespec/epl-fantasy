/* ==========================================================================
   FULL-FEATURED EPL-FANTASY app.js
   - Squad rules enforcement
   - Staged transfers + Confirm Transfers
   - Chips (Wildcard, Free Hit, Triple Captain, Bench Boost)
   - Flexible formations and automatic substitutions
   - Scoring engine following provided rules
   - Finalize GW simulation UI (paste match-play JSON)
   ========================================================================== */

/* ---------------------------
   1) DATA + CONSTANTS
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

// Allowed formations (def, mid, fwd)
const ALLOWED_FORMATIONS = [
  { def: 3, mid: 4, fwd: 3 }, // 3-4-3
  { def: 3, mid: 5, fwd: 2 }, // 3-5-2
  { def: 4, mid: 4, fwd: 2 }, // 4-4-2
  { def: 4, mid: 3, fwd: 3 }, // 4-3-3
  { def: 5, mid: 3, fwd: 2 }, // 5-3-2
  { def: 5, mid: 4, fwd: 1 }  // 5-4-1
];

const CHIPS = ['wildcard', 'freeHit', 'tripleCaptain', 'benchBoost'];

/* ---------------------------
   2) STATE
   --------------------------- */
let state = {
  // UI state
  activeTab: 'pick-team',

  // squad selections
  squad: [],
  startingXI: [],
  bench: [],
  purchasePrices: {},

  // roles
  captainId: null,
  viceCaptainId: null,

  // economy
  bank: INITIAL_BUDGET,
  freeTransfers: 1,           // starting after GW1
  transfersMadeThisGW: 0,     // applied transfers this GW (after Confirm)
  transferPenalty: 0,

  // chips
  activeChip: null,
  usedChipsThisSeason: [],

  // freeHit snapshot
  savedFreeHitSquad: null,

  // tracking
  currentGameweek: 1,
  lastTransferConfirmed: false,
  pendingTransfers: [], // staged transfer objects: { type: 'buy'|'sell', playerId }
  history: [] // store GW results
};

/* ---------------------------
   3) UTILITIES
   --------------------------- */
function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function saveState() {
  localStorage.setItem('epl_state', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('epl_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = Object.assign(state, parsed);
    } catch (e) {
      // ignore
    }
  }
}

/* ---------------------------
   4) VALIDATION & SQUAD RULES
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

  // positions
  for (const pos of ['GK','DEF','MID','FWD']) {
    if (counts[pos] !== SQUAD_RULES[pos]) {
      return { ok: false, reason: `Squad must contain exactly ${SQUAD_RULES[pos]} ${pos}s` };
    }
  }

  // club limit
  for (const c in clubCount) {
    if (clubCount[c] > MAX_PER_CLUB) {
      return { ok: false, reason: `More than ${MAX_PER_CLUB} players from ${c}` };
    }
  }

  if (totalValue > INITIAL_BUDGET + 1e-6) {
    return { ok: false, reason: `Total value exceeds budget Br ${INITIAL_BUDGET}M (current ${totalValue.toFixed(1)}M)` };
  }

  return { ok: true };
}

/* ---------------------------
   5) ECONOMY HELPERS
   --------------------------- */
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

/* ---------------------------
   6) TRANSFERS (STAGED + CONFIRM)
   --------------------------- */
function stageBuy(playerId) {
  // prevent duplicate stages
  if (state.pendingTransfers.find(t => t.type === 'buy' && t.playerId === playerId)) return;
  state.pendingTransfers.push({ type: 'buy', playerId });
  renderApp();
}

function stageSell(playerId) {
  if (state.pendingTransfers.find(t => t.type === 'sell' && t.playerId === playerId)) return;
  state.pendingTransfers.push({ type: 'sell', playerId });
  renderApp();
}

function clearPendingTransfers() {
  state.pendingTransfers = [];
  renderApp();
}

function confirmTransfers() {
  if (state.pendingTransfers.length === 0) {
    alert('No staged transfers to confirm.');
    return;
  }

  // Apply transfers in order. Respect wildcard (free/unlimited) and freeHit
  const usingWildcard = state.activeChip === 'wildcard';
  const usingFreeHit = state.activeChip === 'freeHit';

  let transfersApplied = 0;
  for (const t of state.pendingTransfers) {
    if (t.type === 'buy') {
      const player = INITIAL_PLAYERS.find(p => p.id === t.playerId);
      if (!player) continue;
      // check buy constraints (except budget transfers conditions under wildcard/wave)
      const check = canBuyPlayerImmediate(player);
      if (!check.allowed) {
        alert(`Cannot buy ${player.name}: ${check.reason}`);
        continue;
      }
      // apply buy
      state.squad.push(player.id);
      state.purchasePrices[player.id] = player.price;
      transfersApplied += 1;
    } else if (t.type === 'sell') {
      const player = INITIAL_PLAYERS.find(p => p.id === t.playerId);
      if (!player) continue;
      if (!state.squad.includes(player.id)) {
        continue;
      }
      // apply sell
      const sellPrice = getSellingPrice(player);
      state.squad = state.squad.filter(id => id !== player.id);
      delete state.purchasePrices[player.id];
      state.bank = parseFloat((state.bank + sellPrice).toFixed(1));
      transfersApplied += 1;
    }
  }

  // If wildcard active: transfers are free (do not increment transfersMadeThisGW)
  if (!usingWildcard && !usingFreeHit) {
    state.transfersMadeThisGW += transfersApplied;
  }

  // If freeHit: keep snapshot behavior (we already applied changes to state.squad)
  if (usingFreeHit) {
    // freeHit behavior: we already replaced squad; savedFreeHitSquad holds original to restore at next GW
    // savedFreeHitSquad should have been created on activating freeHit.
    // if not present, create snapshot (defensive)
    if (!state.savedFreeHitSquad) {
      // snapshot old was not stored - try to deduce by reversing transfers? fallback: set saved to current so revert will do nothing.
      state.savedFreeHitSquad = [...state.squad];
    }
  }

  // mark that a transfer was confirmed
  state.lastTransferConfirmed = transfersApplied > 0;

  recalculateBank();
  updateTransferPenalty();
  saveState();
  state.pendingTransfers = [];
  autoAssignXIAndBench();
  renderApp();

  alert(`Confirmed ${transfersApplied} transfer(s).`);
}

// quick helper: checks immediate buy constraints ignoring pending sells (used in stage confirm)
function canBuyPlayerImmediate(player) {
  if (state.squad.includes(player.id)) return { allowed: false, reason: "Already in squad" };
  if (state.squad.length >= MAX_SQUAD_SIZE) return { allowed: false, reason: "Squad full (15/15)" };
  if (state.bank < player.price) return { allowed: false, reason: "Insufficient budget" };
  // position limits
  const posCount = state.squad.filter(id => {
    const p = INITIAL_PLAYERS.find(x => x.id === id);
    return p && p.pos === player.pos;
  }).length;
  if (posCount >= SQUAD_RULES[player.pos]) return { allowed: false, reason: `Max ${SQUAD_RULES[player.pos]} ${player.pos}s allowed` };
  // club
  const clubCount = state.squad.filter(id => {
    const p = INITIAL_PLAYERS.find(x => x.id === id);
    return p && p.club === player.club;
  }).length;
  if (clubCount >= MAX_PER_CLUB) return { allowed: false, reason: `Max ${MAX_PER_CLUB} players per club` };
  return { allowed: true };
}

/* ---------------------------
   7) SELL PRICE CALC
   --------------------------- */
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
   8) FORMATION & AUTO-ASSIGN
   --------------------------- */
function autoAssignXIAndBench() {
  state.startingXI = [];
  state.bench = [];

  const squadPlayers = state.squad.map(id => INITIAL_PLAYERS.find(p => p.id === id)).filter(Boolean);
  if (squadPlayers.length === 0) { state.startingXI = []; state.bench = []; return; }

  const gkList = squadPlayers.filter(p => p.pos === 'GK').sort((a,b) => b.points - a.points);
  const defList = squadPlayers.filter(p => p.pos === 'DEF').sort((a,b) => b.points - a.points);
  const midList = squadPlayers.filter(p => p.pos === 'MID').sort((a,b) => b.points - a.points);
  const fwdList = squadPlayers.filter(p => p.pos === 'FWD').sort((a,b) => b.points - a.points);

  if (gkList.length === 0) {
    state.startingXI = [];
    state.bench = state.squad.slice();
    return;
  }

  let bestSetup = { total: -Infinity, starters: [] };

  ALLOWED_FORMATIONS.forEach(form => {
    if (gkList.length < 1) return;
    if (defList.length < form.def) return;
    if (midList.length < form.mid) return;
    if (fwdList.length < form.fwd) return;

    const starters = [gkList[0], ...defList.slice(0, form.def), ...midList.slice(0, form.mid), ...fwdList.slice(0, form.fwd)];
    if (starters.length !== 11) return;

    const totalPts = starters.reduce((s,p) => s + (p.points || 0), 0);
    if (totalPts > bestSetup.total) {
      bestSetup = { total: totalPts, starters: starters.map(p => p.id) };
    }
  });

  if (bestSetup.total === -Infinity) {
    // fallback: GK + top 10 outfielders
    const outfield = squadPlayers.filter(p => p.pos !== 'GK').sort((a,b) => b.points - a.points);
    const starters = [gkList[0].id, ...outfield.slice(0,10).map(p => p.id)];
    state.startingXI = starters;
  } else {
    state.startingXI = bestSetup.starters;
  }

  state.bench = state.squad.filter(id => !state.startingXI.includes(id));
  if (state.startingXI.length > 0 && !state.captainId) state.captainId = state.startingXI[0];
  if (state.startingXI.length > 1 && !state.viceCaptainId) state.viceCaptainId = state.startingXI[1];
}

/* ---------------------------
   9) AUTO-SUBSTITUTIONS & FINALIZE GAMEWEEK
   - applyAutomaticSubstitutions(playedData)
   - finalizeGameweek(playedData)
   --------------------------- */

/*
  playedData format: { playerId: { minutes, goals, assists, conceded, saves, yellow, red, ownGoal, penSave, penMiss, bonus, cbi, recoveries } }
  Any missing numeric field defaults to 0. minutes = 0 means did not play.
*/

function normalizeStat(obj = {}) {
  return {
    minutes: Number(obj.minutes || 0),
    goals: Number(obj.goals || 0),
    assists: Number(obj.assists || 0),
    conceded: Number(obj.conceded || 0),
    saves: Number(obj.saves || 0),
    yellow: Number(obj.yellow || 0),
    red: Number(obj.red || 0),
    ownGoal: Number(obj.ownGoal || 0),
    penSave: Number(obj.penSave || 0),
    penMiss: Number(obj.penMiss || 0),
    bonus: Number(obj.bonus || 0),
    cbi: Number(obj.cbi || 0), // clearances+blocks+interceptions
    recoveries: Number(obj.recoveries || 0)
  };
}

// check whether a substitution would keep formation valid (>=3 DEF and >=1 FWD and GK=1)
function formationValidAfterSwap(startersIds) {
  const players = startersIds.map(id => INITIAL_PLAYERS.find(p => p.id === id)).filter(Boolean);
  const counts = { GK:0, DEF:0, MID:0, FWD:0 };
  players.forEach(p => { counts[p.pos] = (counts[p.pos] || 0) + 1; });
  return counts.GK === 1 && counts.DEF >= 3 && counts.FWD >= 1 && players.length === 11;
}

function applyAutomaticSubstitutions(playedData) {
  // playedData normalized
  const stats = {};
  for (const k in playedData) stats[Number(k)] = normalizeStat(playedData[k]);

  // Build current starters and bench objects
  const starters = state.startingXI.slice(); // ids
  const bench = state.bench.slice(); // ids ordered by bench priority (earlier = higher priority)

  // Step 1: GK substitution
  const keeperStarterId = starters.find(id => {
    const p = INITIAL_PLAYERS.find(x => x.id === id);
    return p && p.pos === 'GK';
  });

  if (keeperStarterId) {
    const keeperStats = stats[keeperStarterId] || { minutes: 0 };
    if ((keeperStats.minutes || 0) === 0) {
      // try to find bench GK who played
      for (let i=0;i<bench.length;i++) {
        const bId = bench[i];
        const b = INITIAL_PLAYERS.find(p => p.id === bId);
        if (b && b.pos === 'GK') {
          const bStats = stats[bId] || { minutes: 0 };
          if (bStats.minutes > 0) {
            // swap GK starter with bench GK
            starters[starters.indexOf(keeperStarterId)] = bId;
            bench[i] = keeperStarterId;
            break;
          }
        }
      }
    }
  }

  // Step 2: Outfield substitutions - for each starter who didn't play, find highest priority bench outfielder who played and whose insertion keeps formation valid
  // We iterate through starters list (copy) and for each non-playing outfield starter, attempt to find bench sub
  for (let i = 0; i < starters.length; i++) {
    const sid = starters[i];
    const p = INITIAL_PLAYERS.find(x => x.id === sid);
    if (!p || p.pos === 'GK') continue;
    const sStats = stats[sid] || { minutes: 0 };
    if ((sStats.minutes || 0) > 0) continue; // starter played; no sub needed

    // find bench candidate (highest priority = lowest index) who played and won't break formation constraints
    let candidateIndex = -1;
    for (let bi = 0; bi < bench.length; bi++) {
      const bid = bench[bi];
      const b = INITIAL_PLAYERS.find(x => x.id === bid);
      if (!b) continue;
      const bStats = stats[bid] || { minutes: 0 };
      if ((bStats.minutes || 0) === 0) continue; // bench didn't play
      // simulate swap: replace starter sid with bid, check formation validity and position constraints
      const simulatedStarters = starters.slice();
      simulatedStarters[i] = bid;
      if (formationValidAfterSwap(simulatedStarters)) {
        candidateIndex = bi;
        break;
      }
    }
    if (candidateIndex !== -1) {
      const bid = bench[candidateIndex];
      // perform swap in arrays
      starters[i] = bid;
      bench[candidateIndex] = sid;
    }
  }

  // After substitutions computed, update state.startingXI and state.bench
  state.startingXI = starters;
  state.bench = bench;

  // adjust captain/vice if captain didn't play:
  const capStats = stats[state.captainId] || { minutes: 0 };
  const vcStats = stats[state.viceCaptainId] || { minutes: 0 };
  if ((capStats.minutes || 0) === 0 && (vcStats.minutes || 0) > 0) {
    // swap for scoring this GW: we'll set a temp variable in the scoring stage; but for our local scoring, we can swap ids temporarily
    // We'll set state._gwCaptainOverride to handle scoring without changing persistent captain (so UI retains original)
    state._gwCaptainOverride = state.viceCaptainId;
  } else {
    state._gwCaptainOverride = null;
  }

  saveState();
}

// scoring per player based on rules provided
function calculatePlayerPoints(player, matchStats) {
  // matchStats normalized
  const m = normalizeStat(matchStats || {});
  let pts = 0;

  // Minutes
  if (m.minutes >= 60) pts += 2;
  else if (m.minutes > 0) pts += 1;

  // Goals by position
  if (m.goals > 0) {
    if (player.pos === 'GK') pts += 10 * m.goals;
    else if (player.pos === 'DEF') pts += 6 * m.goals;
    else if (player.pos === 'MID') pts += 5 * m.goals;
    else if (player.pos === 'FWD') pts += 4 * m.goals;
  }

  // Assists
  pts += 3 * m.assists;

  // Clean sheet (must play >=60 minutes)
  if (m.minutes >= 60) {
    if ((player.pos === 'GK' || player.pos === 'DEF') && (m.conceded === 0)) pts += 4;
    else if (player.pos === 'MID' && (m.conceded === 0)) pts += 1;
  }

  // Saves (GK) -> 1 point per 3 saves
  if (player.pos === 'GK' && m.saves) {
    pts += Math.floor(m.saves / 3);
  }

  // Defensive contribution points
  // defenders: CBI+TACKLES >=10 -> +2
  // mids/forwards: CBI+TACKLES+RECOVERIES >=12 -> +2
  const defContribution = (m.cbi || 0) + (m.recoveries || 0);
  if (player.pos === 'DEF' && (m.cbi || 0) >= 10) pts += 2;
  if ((player.pos === 'MID' || player.pos === 'FWD') && ((m.cbi || 0) + (m.recoveries || 0) >= 12)) pts += 2;

  // Penalty save/miss
  pts += (m.penSave || 0) * 5;
  pts += (m.penMiss || 0) * -2;

  // Bonus
  pts += (m.bonus || 0);

  // Conceded goals negative: every 2 goals conceded by GK/DEF -> -1
  if ((player.pos === 'GK' || player.pos === 'DEF') && m.conceded) {
    pts -= Math.floor(m.conceded / 2);
  }

  // Cards & own goals
  pts -= (m.yellow || 0) * 1;
  pts -= (m.red || 0) * 3; // red deduction also includes yellow deduction per rules
  pts -= (m.ownGoal || 0) * 2;

  return pts;
}

// finalizeGameweek: apply subs, scoring, chips, hits
function finalizeGameweek(playedData) {
  // validate input
  if (!playedData || typeof playedData !== 'object') {
    alert('Invalid playedData. Provide an object mapping playerId->stats.');
    return;
  }

  // Step 1: apply automatic substitutions based on playedData
  applyAutomaticSubstitutions(playedData);

  // Prepare stats
  const stats = {};
  for (const k in playedData) stats[Number(k)] = normalizeStat(playedData[k]);

  // Step 2: compute points for starters and bench if benchBoost active
  let grossPoints = 0;
  const perPlayerPoints = {};

  const captainId = state._gwCaptainOverride || state.captainId;
  const viceId = state.viceCaptainId;

  // Starter points
  state.startingXI.forEach(id => {
    const p = INITIAL_PLAYERS.find(x => x.id === id);
    const s = stats[id] || { minutes: 0 };
    let pts = calculatePlayerPoints(p, s);

    // captain/vice points multiplication
    if (id === captainId) {
      if (state.activeChip === 'tripleCaptain') pts *= 3;
      else pts *= 2;
    }

    perPlayerPoints[id] = pts;
    grossPoints += pts;
  });

  // Bench Boost: include bench points only if activeChip === 'benchBoost'
  if (state.activeChip === 'benchBoost') {
    state.bench.forEach(id => {
      const p = INITIAL_PLAYERS.find(x => x.id === id);
      const s = stats[id] || { minutes: 0 };
      const pts = calculatePlayerPoints(p, s);
      perPlayerPoints[id] = pts;
      grossPoints += pts;
    });
  } else {
    // bench not counted in normal GW points
    state.bench.forEach(id => {
      const p = INITIAL_PLAYERS.find(x => x.id === id);
      const s = stats[id] || { minutes: 0 };
      perPlayerPoints[id] = calculatePlayerPoints(p, s);
    });
  }

  // Step 3: apply transfer hits (transferPenalty already computed on confirm)
  const hits = state.transferPenalty || 0;
  const netPoints = grossPoints - hits;

  // Step 4: store GW result in history
  const gwResult = {
    gw: state.currentGameweek,
    grossPoints,
    hits,
    netPoints,
    perPlayerPoints,
    starters: [...state.startingXI],
    bench: [...state.bench],
    captainId,
    usedChip: state.activeChip
  };

  state.history = state.history || [];
  state.history.push(gwResult);

  // Step 5: handle Free Hit revert (if freeHit was active)
  if (state.activeChip === 'freeHit' && state.savedFreeHitSquad) {
    // restore original squad saved when freeHit activated
    state.squad = [...state.savedFreeHitSquad];
    state.savedFreeHitSquad = null;
    // recompute purchasePrices and bank may be inconsistent - keep as-is for now
  }

  // Mark chip as used this GW if an activeChip was set
  if (state.activeChip) {
    if (!state.usedChipsThisSeason.includes(state.activeChip)) {
      state.usedChipsThisSeason.push(state.activeChip);
    }
    // chips: only one per GW - we ensure activation logic prevents more
  }

  // After finalize: reset GW-level flags
  state.activeChip = null;
  state.lastTransferConfirmed = false;
  state.transfersMadeThisGW = 0;
  state.transferPenalty = 0;
  state.freeTransfers = Math.max(1, state.freeTransfers); // leave rollover management to advanceGameweek if desired

  // persist and render
  autoAssignXIAndBench();
  saveState();
  renderApp();

  alert(`Gameweek ${gwResult.gw} finalised.\nGross: ${grossPoints} pts\nHits: -${hits} pts\nNet: ${netPoints} pts`);
  return gwResult;
}

/* ---------------------------
   10) CHIPS BEHAVIOR
   --------------------------- */
function canActivateChip(chipName) {
  if (!CHIPS.includes(chipName)) return { ok: false, reason: 'Unknown chip' };
  if (state.usedChipsThisSeason.includes(chipName)) return { ok: false, reason: 'Chip already used this season' };
  // only one chip per GW: if activeChip already set or a chip was used this GW, disallow
  // We track used chips per season; to enforce only one chip per GW we check activeChip
  if (state.activeChip && state.activeChip !== chipName) return { ok: false, reason: 'Another chip already active this Gameweek' };
  // GW2+ activation requires lastTransferConfirmed (except wildcard/freeHit can be used during squad changes? per earlier rules only after a confirmed transfer)
  if (state.currentGameweek > 1 && !state.lastTransferConfirmed) {
    return { ok: false, reason: 'You must confirm a transfer this Gameweek to activate a chip (GW2+).' };
  }
  return { ok: true };
}

function playChip(chipName) {
  const check = canActivateChip(chipName);
  if (!check.ok) {
    alert(check.reason);
    return;
  }

  if (state.activeChip === chipName) {
    // cancel
    if (chipName === 'freeHit' && state.savedFreeHitSquad) {
      state.squad = [...state.savedFreeHitSquad];
      state.savedFreeHitSquad = null;
      autoAssignXIAndBench();
    }
    state.activeChip = null;
    saveState();
    renderApp();
    return;
  }

  // ACTIVATION PATH
  if (chipName === 'freeHit') {
    // snapshot current squad to revert later
    state.savedFreeHitSquad = [...state.squad];
  }

  if (chipName === 'wildcard') {
    // wildcard: transfers in this GW are free and unlimited; we set activeChip and allow confirmTransfers to skip hits
    // nothing else immediate
  }

  // mark active
  state.activeChip = chipName;
  // note: we add to usedChipsThisSeason at finalizeGameweek
  // require another confirmed transfer before activating another chip
  state.lastTransferConfirmed = false;

  saveState();
  renderApp();
  alert(`${chipName} activated for Gameweek ${state.currentGameweek}.`);
}

/* ---------------------------
   11) GAMEWEEK ADVANCE & ROLLOVER
   --------------------------- */
function advanceGameweek() {
  // ensure starting XI valid and squad valid before advancing
  const valid = validateSquad(state.squad);
  if (!valid.ok) {
    alert(`Cannot advance: ${valid.reason}`);
    return;
  }

  // finalize any necessary cleanups: restore freeHit if active? freeHit reverts after GW finalization, not here.
  // handle free transfers roll-over logic:
  if (state.currentGameweek === 1) {
    state.freeTransfers = 1;
  } else {
    const usedFTs = Math.min(state.freeTransfers, state.transfersMadeThisGW);
    state.freeTransfers = Math.min(5, Math.max(1, state.freeTransfers - usedFTs + 1));
  }

  state.currentGameweek += 1;
  state.transfersMadeThisGW = 0;
  state.transferPenalty = 0;
  state.lastTransferConfirmed = false;
  state.activeChip = null;
  state.savedFreeHitSquad = null;
  autoAssignXIAndBench();
  recalculateBank();
  saveState();
  renderApp();
  alert(`Advanced to Gameweek ${state.currentGameweek}.`);
}

/* ---------------------------
   12) RENDERING
   --------------------------- */
function renderWelcome() {
  if (state.hasSeenWelcome) return '';
  return `
    <div id="welcome-modal" class="modal-overlay">
      <div class="modal-card">
        <h2>Welcome to Ethiopian Premier League Fantasy</h2>
        <p>Select your 15-player squad (2 GK, 5 DEF, 5 MID, 3 FWD). Budget Br ${INITIAL_BUDGET}M. Max 3 players per club.</p>
        <button id="close-welcome-btn" class="btn-primary">Got it</button>
      </div>
    </div>
  `;
}

function renderHeader() {
  const squadVal = state.squad.reduce((s, id) => {
    const p = INITIAL_PLAYERS.find(x => x.id === id);
    return s + (p ? p.price : 0);
  }, 0).toFixed(1);

  const ftLabel = state.currentGameweek === 1 ? 'Unlimited' : `${state.freeTransfers} FT`;
  const hitLabel = state.transferPenalty > 0 ? `-${state.transferPenalty} pts` : '0 pts';

  // show pending transfers count
  const pendingCount = state.pendingTransfers.length;

  return `
    <header class="app-header">
      <div class="brand">
        <h1>EPL Fantasy</h1>
        <div>GW ${state.currentGameweek}</div>
      </div>
      <div class="stats">
        <div>Bank: Br ${state.bank.toFixed(1)}M</div>
        <div>Squad value: Br ${squadVal}M</div>
        <div>Free Transfers: ${ftLabel}</div>
        <div>Hits: ${hitLabel}</div>
        <div>Pending Transfers: ${pendingCount}</div>
        <button id="finalize-gw-btn" class="btn">Finalize GW (simulate)</button>
      </div>
    </header>
  `;
}

function renderNav() {
  return `
    <nav class="tab-nav">
      <button class="tab-btn ${state.activeTab==='pick-team'?'active':''}" data-tab="pick-team">Pick Team</button>
      <button class="tab-btn ${state.activeTab==='transfers'?'active':''}" data-tab="transfers">Transfers</button>
      <button class="tab-btn ${state.activeTab==='points'?'active':''}" data-tab="points">Points</button>
      <button class="tab-btn ${state.activeTab==='rules'?'active':''}" data-tab="rules">Rules</button>
    </nav>
  `;
}

function renderPitch() {
  // show startingXI and bench as earlier, but reflect formation chosen
  const starters = state.startingXI.map(id => INITIAL_PLAYERS.find(p => p.id === id)).filter(Boolean);
  // build simple layout grouped by pos for visualization
  const groups = { GK: [], DEF: [], MID: [], FWD: [] };
  starters.forEach(p => groups[p.pos].push(p));

  const chipsHtml = CHIPS.map(chip => {
    const used = state.usedChipsThisSeason.includes(chip);
    const active = state.activeChip === chip;
    return `<button class="chip-btn" data-chip="${escapeHtml(chip)}" ${used? 'disabled':''}>${escapeHtml(chip)}${used? ' (used)':''}${active?' (active)':''}</button>`;
  }).join(' ');

  const renderCard = (p, filled=true) => {
    if (!filled) return `<div class="player-card empty"><div class="add-slot">+</div></div>`;
    return `
      <div class="player-card filled" data-player-id="${p.id}">
        <div class="name">${escapeHtml(p.name)} ${state.captainId===p.id?'<strong>(C)</strong>':''} ${state.viceCaptainId===p.id?'<em>(VC)</em>':''}</div>
        <div class="meta">${escapeHtml(p.pos)} • ${escapeHtml(p.club)}</div>
      </div>
    `;
  };

  return `
    <div class="pitch">
      <div class="chips-area">${chipsHtml}</div>
      <div class="row gk">${groups.GK.map(p => renderCard(p)).join('')}</div>
      <div class="row def">${groups.DEF.map(p => renderCard(p)).join('')}</div>
      <div class="row mid">${groups.MID.map(p => renderCard(p)).join('')}</div>
      <div class="row fwd">${groups.FWD.map(p => renderCard(p)).join('')}</div>

      <div class="bench">
        <h3>Bench</h3>
        <div class="bench-row">
          ${state.bench.map(id => {
            const p = INITIAL_PLAYERS.find(x => x.id === id);
            return `<div class="bench-card" data-player-id="${id}">${escapeHtml(p.name)} • ${escapeHtml(p.pos)}</div>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderTransfers() {
  const listHtml = INITIAL_PLAYERS.map(p => {
    const inSquad = state.squad.includes(p.id);
    const buyDisabled = inSquad || !canBuyPlayerImmediate(p).allowed;
    return `
      <div class="market-item">
        <div class="info">${escapeHtml(p.name)} • ${escapeHtml(p.pos)} • ${escapeHtml(p.club)}</div>
        <div class="actions">
          <span>Br ${p.price}M</span>
          ${inSquad ? `<button class="stage-sell" data-id="${p.id}">Stage Sell</button>` : `<button class="stage-buy" data-id="${p.id}" ${buyDisabled? 'disabled':''}>Stage Buy</button>`}
        </div>
      </div>
    `;
  }).join('');

  const pendingHtml = state.pendingTransfers.map((t, idx) => {
    const p = INITIAL_PLAYERS.find(x => x.id === t.playerId);
    return `<div class="pending-item">${escapeHtml(t.type)} ${escapeHtml(p.name)} <button class="pending-remove" data-idx="${idx}">x</button></div>`;
  }).join('');

  const canConfirm = state.pendingTransfers.length > 0;

  return `
    <div class="transfers-view">
      <div class="market">${listHtml}</div>
      <div class="pending">
        <h4>Pending Transfers</h4>
        ${pendingHtml || '<div>(none)</div>'}
        <button id="confirm-transfers-btn" ${canConfirm ? '' : 'disabled'}>Confirm Transfers</button>
        <button id="clear-transfers-btn" ${canConfirm ? '' : 'disabled'}>Clear Pending</button>
      </div>
    </div>
  `;
}

function renderPoints() {
  return `
    <div class="points">
      <h2>Gameweek History</h2>
      ${state.history.length === 0 ? '<p>No gameweeks finalized yet.</p>' : state.history.map(h => {
        return `<div class="gw-card">
          <h3>GW ${h.gw}: Net ${h.netPoints} pts (Gross ${h.grossPoints}, Hits -${h.hits})</h3>
        </div>`;
      }).join('')}
    </div>
  `;
}

function renderRules() {
  // show shortened rules summary (you provided full rules; show link or summary)
  return `
    <div class="rules">
      <h2>Game Rules Summary</h2>
      <ul>
        <li>Pick 15 players: 2 GK, 5 DEF, 5 MID, 3 FWD</li>
        <li>Budget Br ${INITIAL_BUDGET}M; max 3 players per club</li>
        <li>Pick a Starting 11 by Gameweek deadline; automatic subs applied if starters don't play</li>
        <li>1 free transfer per GW (rollover up to 5); extra transfers cost -4 each</li>
        <li>Chips: Wildcard, Free Hit, Triple Captain, Bench Boost (one chip per GW)</li>
        <li>Finalize a Gameweek by providing match stats (simulate) to apply subs and scoring</li>
      </ul>
    </div>
  `;
}

function renderApp() {
  const root = document.getElementById('app') || document.body;
  let main = '';
  if (state.activeTab === 'pick-team') main = renderPitch();
  else if (state.activeTab === 'transfers') main = renderTransfers();
  else if (state.activeTab === 'points') main = renderPoints();
  else main = renderRules();

  root.innerHTML = `
    ${renderWelcome()}
    ${renderHeader()}
    ${renderNav()}
    <main class="main-content">${main}</main>
  `;

  attachEventListeners();
}

/* ---------------------------
   13) EVENTS
   --------------------------- */
function attachEventListeners() {
  // welcome close
  const closeWelcome = document.getElementById('close-welcome-btn');
  if (closeWelcome) {
    closeWelcome.addEventListener('click', () => {
      state.hasSeenWelcome = true;
      saveState();
      renderApp();
    });
  }

  // nav
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.addEventListener('click', e => {
      state.activeTab = e.currentTarget.dataset.tab;
      renderApp();
    });
  });

  // finalize GW simulate button
  const finalizeBtn = document.getElementById('finalize-gw-btn');
  if (finalizeBtn) {
    finalizeBtn.addEventListener('click', () => {
      const raw = prompt('Paste playedData JSON (playerId -> stats). Example: { "1": {"minutes":90, "goals":0}, "2": {"minutes":0} }');
      if (!raw) return;
      try {
        const obj = JSON.parse(raw);
        finalizeGameweek(obj);
      } catch (e) {
        alert('Invalid JSON');
      }
    });
  }

  // transfers tab: stage buy/sell
  document.querySelectorAll('.stage-buy').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = Number(e.currentTarget.dataset.id);
      stageBuy(id);
    });
  });
  document.querySelectorAll('.stage-sell').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = Number(e.currentTarget.dataset.id);
      stageSell(id);
    });
  });

  // pending remove buttons
  document.querySelectorAll('.pending-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = Number(e.currentTarget.dataset.idx);
      if (!Number.isInteger(idx)) return;
      state.pendingTransfers.splice(idx, 1);
      renderApp();
    });
  });

  // confirm/clear
  const confirmBtn = document.getElementById('confirm-transfers-btn');
  if (confirmBtn) confirmBtn.addEventListener('click', confirmTransfers);
  const clearBtn = document.getElementById('clear-transfers-btn');
  if (clearBtn) clearBtn.addEventListener('click', () => { if (confirm('Clear pending transfers?')) { clearPendingTransfers(); } });

  // chips in pitch area
  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const chip = e.currentTarget.dataset.chip;
      playChip(chip);
    });
  });

  // stage buy/sell from market or bench interactions happen via data attributes above
}

/* ---------------------------
   14) INIT
   --------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  autoAssignXIAndBench();
  recalculateBank();
  updateTransferPenalty();
  renderApp();
});
