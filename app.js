/* ==========================================================================
   EPL FANTASY — VERSION 4
   Full front-end with:
   - pitch layout
   - welcome modal
   - squad tab
   - market tab
   - points tab
   - rules
   - chips
   - captain / vice captain
   - pending transfers
   - gameweek finalization simulation
   ==========================================================================
   Works as browser app with index.html and styles.css.
   ========================================================================== */

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
const HIT_PENALTY = 4;
const CHIPS = ['wildcard', 'freeHit', 'tripleCaptain', 'benchBoost'];
const ALLOWED_FORMATIONS = [
  { def: 3, mid: 4, fwd: 3 },
  { def: 3, mid: 5, fwd: 2 },
  { def: 4, mid: 4, fwd: 2 },
  { def: 4, mid: 3, fwd: 3 },
  { def: 5, mid: 3, fwd: 2 },
  { def: 5, mid: 4, fwd: 1 }
];

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
  pendingTransfers: [],
  history: [],
  hasSeenWelcome: false,
  _gwCaptainOverride: null,
  marketFilter: 'All',
  marketSearch: ''
};

let pendingIdCounter = Date.now();

function saveState() {
  try {
    localStorage.setItem('epl_state', JSON.stringify(state));
  } catch {}
}

function loadState() {
  try {
    const raw = localStorage.getItem('epl_state');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state = Object.assign(state, parsed);
  } catch {}
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPlayerById(id) {
  return INITIAL_PLAYERS.find(p => p.id === id);
}

function recalculateBank() {
  const totalSpent = state.squad.reduce((sum, id) => {
    const price = state.purchasePrices[id] !== undefined ? state.purchasePrices[id] : (getPlayerById(id)?.price || 0);
    return sum + price;
  }, 0);
  state.bank = parseFloat((INITIAL_BUDGET - totalSpent).toFixed(1));
}

function updateTransferPenalty() {
  if (state.currentGameweek === 1 || state.activeChip === 'wildcard' || state.activeChip === 'freeHit') {
    state.transferPenalty = 0;
    return;
  }
  const excess = Math.max(0, state.transfersMadeThisGW - state.freeTransfers);
  state.transferPenalty = excess * HIT_PENALTY;
}

function getSquadCounts() {
  const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  state.squad.forEach(id => {
    const p = getPlayerById(id);
    if (p) counts[p.pos] = (counts[p.pos] || 0) + 1;
  });
  return counts;
}

function getClubCounts() {
  const counts = {};
  state.squad.forEach(id => {
    const p = getPlayerById(id);
    if (!p) return;
    counts[p.club] = (counts[p.club] || 0) + 1;
  });
  return counts;
}

function computeSquadValue(squadArray) {
  return squadArray.reduce((sum, id) => {
    const p = getPlayerById(id);
    return sum + (p ? p.price : 0);
  }, 0);
}

function computeClubCounts(squadArray) {
  const counts = {};
  for (const id of squadArray) {
    const p = getPlayerById(id);
    if (!p) continue;
    counts[p.club] = (counts[p.club] || 0) + 1;
  }
  return counts;
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

function validateSquad(squad = state.squad) {
  if (!Array.isArray(squad)) return { ok: false, reason: 'Invalid squad format.' };
  if (squad.length !== MAX_SQUAD_SIZE) return { ok: false, reason: `Squad must contain ${MAX_SQUAD_SIZE} players.` };

  const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  const clubs = {};
  let totalValue = 0;

  for (const id of squad) {
    const p = getPlayerById(id);
    if (!p) return { ok: false, reason: `Player id ${id} not found.` };
    counts[p.pos] = (counts[p.pos] || 0) + 1;
    clubs[p.club] = (clubs[p.club] || 0) + 1;
    totalValue += p.price;
  }

  for (const pos of ['GK', 'DEF', 'MID', 'FWD']) {
    if (counts[pos] !== SQUAD_RULES[pos]) {
      return { ok: false, reason: `Squad must contain exactly ${SQUAD_RULES[pos]} ${pos}s.` };
    }
  }

  for (const club in clubs) {
    if (clubs[club] > MAX_PER_CLUB) {
      return { ok: false, reason: `More than ${MAX_PER_CLUB} players from ${club}.` };
    }
  }

  if (totalValue > INITIAL_BUDGET + 1e-6) {
    return { ok: false, reason: `Total value exceeds Br ${INITIAL_BUDGET}M.` };
  }

  return { ok: true };
}

function canAddPlayer(player) {
  if (state.squad.includes(player.id)) return { allowed: false, reason: 'Already in squad.' };
  if (state.squad.length >= MAX_SQUAD_SIZE) return { allowed: false, reason: 'Squad is full (15/15).' };
  if (state.bank < player.price) return { allowed: false, reason: 'Insufficient budget.' };

  const posCount = state.squad.filter(id => (getPlayerById(id) || {}).pos === player.pos).length;
  if (posCount >= SQUAD_RULES[player.pos]) return { allowed: false, reason: `Max ${SQUAD_RULES[player.pos]} ${player.pos}s.` };

  const clubCount = state.squad.filter(id => (getPlayerById(id) || {}).club === player.club).length;
  if (clubCount >= MAX_PER_CLUB) return { allowed: false, reason: `Max ${MAX_PER_CLUB} players per club.` };

  return { allowed: true };
}

function autoAssignXIAndBench() {
  state.startingXI = [];
  state.bench = [];

  const teamPlayers = state.squad.map(id => getPlayerById(id)).filter(Boolean);
  if (!teamPlayers.length) return;

  const gk = teamPlayers.filter(p => p.pos === 'GK').sort((a, b) => b.points - a.points);
  const def = teamPlayers.filter(p => p.pos === 'DEF').sort((a, b) => b.points - a.points);
  const mid = teamPlayers.filter(p => p.pos === 'MID').sort((a, b) => b.points - a.points);
  const fwd = teamPlayers.filter(p => p.pos === 'FWD').sort((a, b) => b.points - a.points);

  if (gk.length === 0) {
    state.startingXI = [];
    state.bench = state.squad.slice();
    return;
  }

  let best = { total: -Infinity, starters: [] };
  ALLOWED_FORMATIONS.forEach(form => {
    if (def.length < form.def) return;
    if (mid.length < form.mid) return;
    if (fwd.length < form.fwd) return;

    const starters = [gk[0], ...def.slice(0, form.def), ...mid.slice(0, form.mid), ...fwd.slice(0, form.fwd)];
    if (starters.length !== 11) return;
    const total = starters.reduce((sum, p) => sum + p.points, 0);
    if (total > best.total) best = { total, starters: starters.map(p => p.id) };
  });

  if (best.total === -Infinity) {
    const outfield = teamPlayers.filter(p => p.pos !== 'GK').sort((a, b) => b.points - a.points);
    state.startingXI = [gk[0].id, ...outfield.slice(0, 10).map(p => p.id)];
  } else state.startingXI = best.starters;

  state.bench = state.squad.filter(id => !state.startingXI.includes(id));

  if (!state.captainId && state.startingXI.length) state.captainId = state.startingXI[0];
  if (!state.viceCaptainId && state.startingXI.length > 1) state.viceCaptainId = state.startingXI[1];
}

function ensureModalRoot() {
  let root = document.getElementById('app-modal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'app-modal-root';
    document.body.appendChild(root);
  }
  return root;
}

function showModal(title, html, confirmText = 'OK', onConfirm = null, onCancel = null, hideCancel = false) {
  const root = ensureModalRoot();
  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">${escapeHtml(title)}</div>
        </div>
        <div class="modal-body">${html}</div>
        <div class="modal-actions">
          ${hideCancel ? '' : `<button class="btn btn-ghost" id="modal-cancel-btn">Cancel</button>`}
          <button class="btn btn-primary" id="modal-confirm-btn">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    </div>
  `;
  root.style.display = 'block';

  const cleanup = () => { root.style.display = 'none'; root.innerHTML = ''; };

  const confirmBtn = document.getElementById('modal-confirm-btn');
  if (confirmBtn) confirmBtn.onclick = () => { cleanup(); if (onConfirm) onConfirm(); };

  const cancelBtn = document.getElementById('modal-cancel-btn');
  if (cancelBtn) cancelBtn.onclick = () => { cleanup(); if (onCancel) onCancel(); };

  const overlay = root.querySelector('.modal-overlay');
  if (overlay) {
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        cleanup();
        if (onCancel) onCancel();
      }
    };
  }
}

function showAlert(message) {
  showModal('Notice', `<div>${escapeHtml(message)}</div>`, 'Close', null, null, true);
}

function showConfirm(message, onYes, onNo) {
  showModal('Confirm', `<div>${escapeHtml(message)}</div>`, 'Yes', onYes, onNo, false);
}

/* ---------------------------
   Pending transfers
   --------------------------- */
function stageBuy(playerId) {
  if (state.pendingTransfers.find(t => t.type === 'buy' && t.playerId === playerId)) {
    showAlert('This buy is already pending.');
    return;
  }
  state.pendingTransfers.push({ id: ++pendingIdCounter, type: 'buy', playerId, ts: Date.now(), removing: false });
  renderApp();
}

function stageSell(playerId) {
  if (!state.squad.includes(playerId)) {
    showAlert('Player not in squad.');
    return;
  }
  if (state.pendingTransfers.find(t => t.type === 'sell' && t.playerId === playerId)) {
    showAlert('This sell is already pending.');
    return;
  }
  state.pendingTransfers.push({ id: ++pendingIdCounter, type: 'sell', playerId, ts: Date.now(), removing: false });
  renderApp();
}

function removePendingByIdAnimated(id) {
  const idx = state.pendingTransfers.findIndex(t => t.id === id);
  if (idx === -1) return;
  state.pendingTransfers[idx].removing = true;
  renderApp();

  setTimeout(() => {
    state.pendingTransfers = state.pendingTransfers.filter(t => t.id !== id);
    renderApp();
  }, 260);
}

function clearPendingTransfers() {
  if (!state.pendingTransfers.length) return;
  showConfirm('Clear all pending transfers?', () => {
    state.pendingTransfers.forEach(t => t.removing = true);
    renderApp();
    setTimeout(() => {
      state.pendingTransfers = [];
      renderApp();
    }, 260);
  });
}

function calculatePendingPreview(extra = null) {
  const staged = [...state.pendingTransfers];
  if (extra) staged.push({ id: 'hyp', type: extra.type, playerId: extra.playerId });

  let futureSquad = [...state.squad];
  staged.filter(t => t.type === 'sell').forEach(t => {
    futureSquad = futureSquad.filter(id => id !== t.playerId);
  });
  staged.filter(t => t.type === 'buy').forEach(t => {
    if (!futureSquad.includes(t.playerId)) futureSquad.push(t.playerId);
  });

  const buys = staged.filter(t => t.type === 'buy').map(t => getPlayerById(t.playerId)).filter(Boolean);
  const sells = staged.filter(t => t.type === 'sell').map(t => getPlayerById(t.playerId)).filter(Boolean);

  const sumBuys = buys.reduce((sum, p) => sum + p.price, 0);
  const sumSells = sells.reduce((sum, p) => sum + getSellingPrice(p), 0);

  let projectedBank = state.bank - sumBuys + sumSells;

  const pendingCount = staged.length;
  const usingWildcard = state.activeChip === 'wildcard';
  const usingFreeHit = state.activeChip === 'freeHit';
  let projectedTransfersMade = state.transfersMadeThisGW + pendingCount;
  let extraTransfers = 0;
  if (!usingWildcard && !usingFreeHit) {
    extraTransfers = Math.max(0, projectedTransfersMade - state.freeTransfers);
  }

  const projectedHits = extraTransfers * HIT_PENALTY;
  return {
    projectedBank: parseFloat(projectedBank.toFixed(1)),
    projectedHits,
    transfersApplied: pendingCount,
    projectedSquadValue: parseFloat(computeSquadValue(futureSquad).toFixed(1)),
    projectedClubCounts: computeClubCounts(futureSquad),
    buys,
    sells
  };
}

function applyPendingTransfers() {
  if (!state.pendingTransfers.length) {
    showAlert('No pending transfers to apply.');
    return;
  }

  const usingWildcard = state.activeChip === 'wildcard';
  const usingFreeHit = state.activeChip === 'freeHit';
  let applied = 0;

  const sells = state.pendingTransfers.filter(t => t.type === 'sell');
  for (const t of sells) {
    const p = getPlayerById(t.playerId);
    if (!p || !state.squad.includes(p.id)) continue;

    const soldFor = getSellingPrice(p);
    state.squad = state.squad.filter(id => id !== p.id);
    delete state.purchasePrices[p.id];
    state.bank = parseFloat((state.bank + soldFor).toFixed(1));
    applied++;
  }

  const buys = state.pendingTransfers.filter(t => t.type === 'buy');
  for (const t of buys) {
    const p = getPlayerById(t.playerId);
    if (!p) continue;

    const check = canAddPlayer(p);
    if (!check.allowed) {
      showAlert(`Cannot buy ${p.name}: ${check.reason}`);
      continue;
    }

    state.squad.push(p.id);
    state.purchasePrices[p.id] = p.price;
    state.bank = parseFloat((state.bank - p.price).toFixed(1));
    applied++;
  }

  if (!usingWildcard && !usingFreeHit) {
    state.transfersMadeThisGW += applied;
  }

  state.lastTransferConfirmed = applied > 0;
  state.pendingTransfers = [];
  recalculateBank();
  updateTransferPenalty();
  autoAssignXIAndBench();
  saveState();
  renderApp();
  showAlert(`Confirmed ${applied} transfer(s).`);
}

function showTransferBreakdownModal(extra = null) {
  const preview = calculatePendingPreview(extra);
  const lines = [];
  preview.sells.forEach(p => lines.push({ type: 'Sell', name: p.name, price: getSellingPrice(p), sign: '+' }));
  preview.buys.forEach(p => lines.push({ type: 'Buy', name: p.name, price: p.price, sign: '-' }));

  const htmlLines = lines.length === 0
    ? '<div>(no transfers)</div>'
    : lines.map(line => `
      <div class="transfer-line">
        <div class="transfer-left">
          <span class="badge">${escapeHtml(line.type)}</span>
          <span>${escapeHtml(line.name)}</span>
        </div>
        <span class="price-badge">${line.sign} Br ${line.price}M</span>
      </div>
    `).join('');

  const clubCountsHtml = Object.keys(preview.projectedClubCounts).map(club => {
    const n = preview.projectedClubCounts[club];
    const over = n > MAX_PER_CLUB;
    return `
      <div style="display:flex;justify-content:space-between;padding:4px 0;">
        <span>${escapeHtml(club)}</span>
        <span style="color:${over ? '#ff8a80' : '#edf4ff'}">${n}${over ? ' ⚠︎' : ''}</span>
      </div>
    `;
  }).join('');

  const totals = `
    <div style="margin-top:14px;border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;">
      <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Projected Bank</span><strong>Br ${preview.projectedBank}M</strong></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Projected Squad Value</span><strong>Br ${preview.projectedSquadValue}M</strong></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Projected Hits</span><strong>-${preview.projectedHits} pts</strong></div>
      <div style="margin-top:8px;"><div style="font-weight:700;margin-bottom:4px;">Club counts</div>${clubCountsHtml}</div>
    </div>
  `;

  showModal('Transfer Cost Breakdown', `<div>${htmlLines}${totals}</div>`, extra ? 'Stage & Confirm' : 'Confirm Transfers', () => {
    if (extra) {
      state.pendingTransfers.push({ id: Date.now(), type: extra.type, playerId: extra.playerId, ts: Date.now() });
    }
    applyPendingTransfers();
  }, null, false);
}

/* ---------------------------
   Replacement suggestions
   --------------------------- */
function findReplacementCandidates(targetPlayerId) {
  const target = getPlayerById(targetPlayerId);
  if (!target) return { direct: [], swapProposals: [] };

  const direct = INITIAL_PLAYERS.filter(p => !state.squad.includes(p.id) && p.pos === target.pos && p.id !== targetPlayerId)
    .sort((a, b) => b.points - a.points)
    .slice(0, 8);

  const sellCandidates = state.squad
    .map(id => getPlayerById(id))
    .filter(Boolean)
    .filter(p => p.pos === target.pos)
    .sort((a, b) => a.points - b.points)
    .slice(0, 8);

  const swapProposals = [];
  direct.forEach(dc => {
    const affordable = canAddPlayer(dc).allowed;
    if (affordable) {
      swapProposals.push({ buy: dc, sell: null, reason: 'Affordable' });
    } else {
      for (const sc of sellCandidates) {
        const tempBank = state.bank + getSellingPrice(sc);
        if (tempBank >= dc.price) {
          swapProposals.push({ buy: dc, sell: sc, reason: `Sell ${sc.name} to afford` });
          break;
        }
      }
    }
  });

  return { direct, swapProposals };
}

function showReplacementModal(targetPlayerId) {
  const target = getPlayerById(targetPlayerId);
  if (!target) return;

  const { direct, swapProposals } = findReplacementCandidates(targetPlayerId);

  const directHtml = direct.length === 0
    ? '<div style="color:#a7b8d0;">No direct candidates found.</div>'
    : direct.map(player => {
      const affordable = canAddPlayer(player).allowed;
      return `
        <div class="transfer-line">
          <div class="transfer-left">
            <span class="badge">${escapeHtml(player.pos)}</span>
            <div>
              <div style="font-weight:700;">${escapeHtml(player.name)}</div>
              <div style="font-size:12px;color:#a7b8d0;">${escapeHtml(player.club)} • Br ${player.price}M</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-ghost preview-single" data-id="${player.id}">Preview</button>
            <button class="btn btn-primary stage-swap" data-buy="${player.id}" data-sell="${targetPlayerId}" ${affordable ? '' : 'disabled'}>Stage swap</button>
          </div>
        </div>
      `;
    }).join('');

  const swapHtml = swapProposals.length === 0
    ? '<div style="color:#a7b8d0;">No swap suggestions found.</div>'
    : swapProposals.map(item => {
      const buy = item.buy;
      const sell = item.sell;
      return `
        <div class="transfer-line">
          <div class="transfer-left">
            <span class="badge">Swap</span>
            <div>
              <div style="font-weight:700;">${escapeHtml(buy.name)}</div>
              <div style="font-size:12px;color:#a7b8d0;">${sell ? `Sells: ${escapeHtml(sell.name)} • ` : ''}Br ${buy.price}M</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-ghost preview-single" data-id="${buy.id}">Preview</button>
            <button class="btn btn-primary stage-swap" data-buy="${buy.id}" data-sell="${sell ? sell.id : targetPlayerId}">Stage swap</button>
          </div>
        </div>
      `;
    }).join('');

  showModal(`Replacement suggestions for ${escapeHtml(target.name)}`, `
    <div>
      <h4>Direct candidates</h4>
      ${directHtml}
      <h4 style="margin-top:18px;">Swap proposals</h4>
      ${swapHtml}
    </div>
  `, 'Close', null, null, true);

  setTimeout(() => {
    document.querySelectorAll('.stage-swap').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const buyId = Number(e.currentTarget.dataset.buy);
        const sellId = Number(e.currentTarget.dataset.sell);

        state.pendingTransfers.push({ id: ++pendingIdCounter, type: 'sell', playerId: sellId, ts: Date.now() });
        state.pendingTransfers.push({ id: ++pendingIdCounter, type: 'buy', playerId: buyId, ts: Date.now() });
        saveState();
        renderApp();
        showAlert(`Staged swap: sell ${sellId} + buy ${buyId}`);
      });
    });

    document.querySelectorAll('.preview-single').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.currentTarget.dataset.id);
        const extra = { type: state.squad.includes(id) ? 'sell' : 'buy', playerId: id };
        showTransferBreakdownModal(extra);
      });
    });
  }, 20);
}

/* ---------------------------
   Gameweek logic
   --------------------------- */
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
    cbi: Number(obj.cbi || 0),
    recoveries: Number(obj.recoveries || 0)
  };
}

function formationValidAfterSwap(startersIds) {
  const players = startersIds.map(id => getPlayerById(id)).filter(Boolean);
  const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  players.forEach(p => { counts[p.pos] = (counts[p.pos] || 0) + 1; });
  return counts.GK === 1 && counts.DEF >= 3 && counts.FWD >= 1 && players.length === 11;
}

function applyAutomaticSubstitutions(playedData) {
  const stats = {};
  for (const k in playedData) stats[Number(k)] = normalizeStat(playedData[k]);

  const starters = [...state.startingXI];
  const bench = [...state.bench];

  const keeperStarter = starters.find(id => (getPlayerById(id) || {}).pos === 'GK');
  if (keeperStarter) {
    const keeperStats = stats[keeperStarter] || { minutes: 0 };
    if ((keeperStats.minutes || 0) === 0) {
      for (let i = 0; i < bench.length; i++) {
        const bid = bench[i];
        const p = getPlayerById(bid);
        if (!p || p.pos !== 'GK') continue;

        const bStats = stats[bid] || { minutes: 0 };
        if ((bStats.minutes || 0) > 0) {
          starters[starters.indexOf(keeperStarter)] = bid;
          bench[i] = keeperStarter;
          break;
        }
      }
    }
  }

  for (let i = 0; i < starters.length; i++) {
    const sid = starters[i];
    const p = getPlayerById(sid);
    if (!p || p.pos === 'GK') continue;

    const sStats = stats[sid] || { minutes: 0 };
    if ((sStats.minutes || 0) > 0) continue;

    let candidateIndex = -1;
    for (let bi = 0; bi < bench.length; bi++) {
      const bid = bench[bi];
      const b = getPlayerById(bid);
      if (!b) continue;
      const bStats = stats[bid] || { minutes: 0 };
      if ((bStats.minutes || 0) === 0) continue;

      const sim = starters.slice();
      sim[i] = bid;
      if (formationValidAfterSwap(sim)) {
        candidateIndex = bi;
        break;
      }
    }

    if (candidateIndex !== -1) {
      const bid = bench[candidateIndex];
      starters[i] = bid;
      bench[candidateIndex] = sid;
    }
  }

  state.startingXI = starters;
  state.bench = bench;

  const capStats = stats[state.captainId] || { minutes: 0 };
  const vcStats = stats[state.viceCaptainId] || { minutes: 0 };
  state._gwCaptainOverride = ((capStats.minutes || 0) === 0 && (vcStats.minutes || 0) > 0) ? state.viceCaptainId : null;

  saveState();
}

function calculatePlayerPoints(player, matchStats) {
  const m = normalizeStat(matchStats || {});
  let pts = 0;

  if (m.minutes >= 60) pts += 2;
  else if (m.minutes > 0) pts += 1;

  if (m.goals > 0) {
    if (player.pos === 'GK') pts += 10 * m.goals;
    else if (player.pos === 'DEF') pts += 6 * m.goals;
    else if (player.pos === 'MID') pts += 5 * m.goals;
    else if (player.pos === 'FWD') pts += 4 * m.goals;
  }

  pts += 3 * m.assists;

  if (m.minutes >= 60) {
    if ((player.pos === 'GK' || player.pos === 'DEF') && m.conceded === 0) pts += 4;
    else if (player.pos === 'MID' && m.conceded === 0) pts += 1;
  }

  if (player.pos === 'GK' && m.saves) pts += Math.floor(m.saves / 3);
  if (player.pos === 'DEF' && (m.cbi || 0) >= 10) pts += 2;
  if ((player.pos === 'MID' || player.pos === 'FWD') && ((m.cbi || 0) + (m.recoveries || 0) >= 12)) pts += 2;

  pts += (m.penSave || 0) * 5;
  pts += (m.penMiss || 0) * -2;
  pts += (m.bonus || 0);

  if ((player.pos === 'GK' || player.pos === 'DEF') && m.conceded) {
    pts -= Math.floor(m.conceded / 2);
  }

  pts -= (m.yellow || 0) * 1;
  pts -= (m.red || 0) * 3;
  pts -= (m.ownGoal || 0) * 2;

  return pts;
}

function finalizeGameweek(playedData) {
  if (!playedData || typeof playedData !== 'object') {
    showAlert('Invalid playedData. Provide JSON mapping playerId -> stats.');
    return;
  }

  applyAutomaticSubstitutions(playedData);

  const stats = {};
  for (const key in playedData) {
    stats[Number(key)] = normalizeStat(playedData[key]);
  }

  let gross = 0;
  const perPlayer = {};
  const captainId = state._gwCaptainOverride || state.captainId;

  state.startingXI.forEach(id => {
    const p = getPlayerById(id);
    const s = stats[id] || { minutes: 0 };
    let pts = calculatePlayerPoints(p, s);

    if (id === captainId) {
      if (state.activeChip === 'tripleCaptain') pts *= 3;
      else pts *= 2;
    }

    perPlayer[id] = pts;
    gross += pts;
  });

  if (state.activeChip === 'benchBoost') {
    state.bench.forEach(id => {
      const p = getPlayerById(id);
      const s = stats[id] || {};
      const pts = calculatePlayerPoints(p, s);
      perPlayer[id] = pts;
      gross += pts;
    });
  } else {
    state.bench.forEach(id => {
      const p = getPlayerById(id);
      const s = stats[id] || {};
      perPlayer[id] = calculatePlayerPoints(p, s);
    });
  }

  const hits = state.transferPenalty || 0;
  const net = gross - hits;

  const result = {
    gw: state.currentGameweek,
    grossPoints: gross,
    hits,
    netPoints: net,
    perPlayerPoints: perPlayer,
    starters: [...state.startingXI],
    bench: [...state.bench],
    captainId,
    usedChip: state.activeChip
  };

  state.history.push(result);

  if (state.activeChip === 'freeHit' && state.savedFreeHitSquad) {
    state.squad = [...state.savedFreeHitSquad];
    state.savedFreeHitSquad = null;
  }

  if (state.activeChip && !state.usedChipsThisSeason.includes(state.activeChip)) {
    state.usedChipsThisSeason.push(state.activeChip);
  }

  state.activeChip = null;
  state.lastTransferConfirmed = false;
  state.transfersMadeThisGW = 0;
  state.transferPenalty = 0;

  autoAssignXIAndBench();
  saveState();
  renderApp();

  showAlert(`Gameweek ${result.gw} finalised.\nGross: ${gross} pts\nHits: -${hits} pts\nNet: ${net} pts`);
  return result;
}

function canActivateChip(chipName) {
  if (!CHIPS.includes(chipName)) return { ok: false, reason: 'Unknown chip.' };
  if (state.usedChipsThisSeason.includes(chipName)) return { ok: false, reason: 'Chip already used this season.' };
  if (state.activeChip && state.activeChip !== chipName) return { ok: false, reason: 'Another chip is active this Gameweek.' };
  if (state.currentGameweek > 1 && !state.lastTransferConfirmed) return { ok: false, reason: 'You must confirm a transfer before activating a chip in later GWs.' };
  return { ok: true };
}

function playChip(chipName) {
  const check = canActivateChip(chipName);
  if (!check.ok) {
    showAlert(check.reason);
    return;
  }

  if (state.activeChip === chipName) {
    if (chipName === 'freeHit' && state.savedFreeHitSquad) {
      state.squad = [...state.savedFreeHitSquad];
      state.savedFreeHitSquad = null;
      autoAssignXIAndBench();
    }
    state.activeChip = null;
    saveState();
    renderApp();
    showAlert(`${chipName} cancelled.`);
    return;
  }

  if (chipName === 'freeHit') {
    state.savedFreeHitSquad = [...state.squad];
  }

  state.activeChip = chipName;
  state.lastTransferConfirmed = false;
  saveState();
  renderApp();
  showAlert(`${chipName} activated for Gameweek ${state.currentGameweek}.`);
}

function advanceGameweek() {
  const valid = validateSquad(state.squad);
  if (!valid.ok) {
    showAlert(`Cannot advance: ${valid.reason}`);
    return;
  }

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
  showAlert(`Advanced to Gameweek ${state.currentGameweek}.`);
}

/* ---------------------------
   Render views
   --------------------------- */
function buildPitchCards() {
  const starters = state.startingXI.map(id => getPlayerById(id)).filter(Boolean);

  const groups = { GK: [], DEF: [], MID: [], FWD: [] };
  starters.forEach(p => groups[p.pos].push(p));

  const renderPlayer = (player) => `
    <div class="player-card">
      <div class="player-name">${escapeHtml(player.name)} ${state.captainId === player.id ? '(C)' : ''} ${state.viceCaptainId === player.id ? '(VC)' : ''}</div>
      <div class="player-meta">${escapeHtml(player.pos)} • ${escapeHtml(player.club)}</div>
    </div>
  `;

  const fillEmpty = (count) => Array.from({ length: count }, () => '<div class="player-card empty">Empty</div>').join('');

  const gkRendered = groups.GK.length ? groups.GK.map(renderPlayer).join('') : fillEmpty(1);
  const defRendered = groups.DEF.length ? groups.DEF.map(renderPlayer).join('') : fillEmpty(3);
  const midRendered = groups.MID.length ? groups.MID.map(renderPlayer).join('') : fillEmpty(4);
  const fwdRendered = groups.FWD.length ? groups.FWD.map(renderPlayer).join('') : fillEmpty(3);

  return `
    <div class="pitch">
      <div class="pitch-row">${gkRendered}</div>
      <div class="pitch-row">${defRendered}</div>
      <div class="pitch-row">${midRendered}</div>
      <div class="pitch-row">${fwdRendered}</div>

      <div class="bench-wrap">
        <div class="bench-title">Bench</div>
        <div class="bench-list">
          ${state.bench.length ? state.bench.map(id => {
            const p = getPlayerById(id);
            return `<div class="bench-player">${escapeHtml(p.name)} • ${escapeHtml(p.pos)}</div>`;
          }).join('') : '<div style="color:rgba(255,255,255,0.6);font-size:0.74rem;">No bench players</div>'}
        </div>
      </div>
    </div>
  `;
}

function renderSquadView() {
  const summary = {
    counts: getSquadCounts(),
    squadValue: computeSquadValue(state.squad)
  };

  const selectedPlayers = state.squad.map(id => getPlayerById(id)).filter(Boolean);

  const squadGrid = selectedPlayers.length ? selectedPlayers.map(player => `
    <div class="selected-player-card">
      <div class="selected-player-top">
        <div>
          <div style="font-weight:700;">${escapeHtml(player.name)}</div>
          <div style="color:#a7b8d0;font-size:12px;">${escapeHtml(player.pos)} • ${escapeHtml(player.club)}</div>
        </div>
        <span class="pill">${player.price}M</span>
      </div>

      <div class="selected-player-actions">
        <button class="btn btn-ghost captain-btn" data-id="${player.id}" ${state.captainId === player.id ? 'disabled' : ''}>Captain</button>
        <button class="btn btn-ghost vice-btn" data-id="${player.id}" ${state.viceCaptainId === player.id ? 'disabled' : ''}>Vice</button>
        <button class="btn btn-danger remove-squad-btn" data-id="${player.id}">Remove</button>
      </div>
    </div>
  `).join('') : '<div style="color:#a7b8d0;">No players selected yet.</div>';

  return `
    <div class="dashboard">
      <div class="pitch-panel">
        <div class="chip-strip">
          ${CHIPS.map(chip => {
            const active = state.activeChip === chip;
            const used = state.usedChipsThisSeason.includes(chip);
            return `<button class="chip-btn ${active ? 'active' : ''}" data-chip="${chip}" ${used ? 'disabled' : ''}>${chip}${used ? ' (used)' : ''}${active ? ' (active)' : ''}</button>`;
          }).join('')}
        </div>

        ${buildPitchCards()}
      </div>

      <aside class="side-stack">
        <div class="panel">
          <h3 class="card-title">Squad Summary</h3>
          <div class="summary-box">
            <div class="summary-row"><span>Squad Value</span><strong>Br ${summary.squadValue.toFixed(1)}M</strong></div>
            <div class="summary-row"><span>Bank</span><strong>Br ${state.bank.toFixed(1)}M</strong></div>
            <div class="summary-row"><span>Players</span><strong>${state.squad.length}/15</strong></div>
            <div class="summary-row"><span>Free slots</span><strong>${MAX_SQUAD_SIZE - state.squad.length}</strong></div>
          </div>

          <div class="summary-box" style="margin-top:10px;">
            <div class="summary-row"><span>GK</span><strong>${summary.counts.GK}/2</strong></div>
            <div class="summary-row"><span>DEF</span><strong>${summary.counts.DEF}/5</strong></div>
            <div class="summary-row"><span>MID</span><strong>${summary.counts.MID}/5</strong></div>
            <div class="summary-row"><span>FWD</span><strong>${summary.counts.FWD}/3</strong></div>
          </div>
        </div>

        <div class="panel">
          <h3 class="card-title">Your Squad</h3>
          <div class="squad-grid">${squadGrid}</div>
        </div>
      </aside>
    </div>
  `;
}

function getFilteredPlayers() {
  const q = (state.marketSearch || '').trim().toLowerCase();
  return INITIAL_PLAYERS.filter(player => {
    const matchesPos = state.marketFilter === 'All' || player.pos === state.marketFilter;
    const matchesSearch = !q || player.name.toLowerCase().includes(q) || player.club.toLowerCase().includes(q) || player.pos.toLowerCase().includes(q);
    return matchesPos && matchesSearch;
  });
}

function renderTransfersView() {
  const filtered = getFilteredPlayers();

  const marketList = filtered.map(player => {
    const inSquad = state.squad.includes(player.id);
    const pendingBuy = state.pendingTransfers.find(t => t.type === 'buy' && t.playerId === player.id);
    const pendingSell = state.pendingTransfers.find(t => t.type === 'sell' && t.playerId === player.id);
    const check = canAddPlayer(player);
    const preview = calculatePendingPreview({ type: inSquad ? 'sell' : 'buy', playerId: player.id });
    const clubCount = preview.projectedClubCounts[player.club] || 0;
    const overClub = clubCount > MAX_PER_CLUB;
    const badge = pendingBuy ? '<span class=\"badge\">Pending Buy</span>' : pendingSell ? '<span class=\"badge\">Pending Sell</span>' : '<span class=\"badge\">Preview</span>';

    return `
      <div class="market-item">
        <div class="market-main">
          <div class="market-name">${escapeHtml(player.name)}</div>
          <div class="market-meta">${escapeHtml(player.pos)} • ${escapeHtml(player.club)} • ${player.points} pts</div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <span class="badge">${escapeHtml(player.pos)}</span>
            ${badge}
            ${overClub ? `<span style="color:#ff8a80;font-size:11px;">Club count: ${clubCount}/${MAX_PER_CLUB}</span>` : ''}
          </div>
        </div>

        <div class="market-actions">
          <span class="price-tag">Br ${player.price}M</span>
          ${inSquad
            ? `<button class="btn btn-ghost stage-sell" data-id="${player.id}">Stage Sell</button>`
            : `<button class="btn btn-primary stage-buy" data-id="${player.id}" ${!check.allowed ? 'disabled' : ''}>Stage Buy</button>`}
          <button class="btn btn-ghost preview-single" data-id="${player.id}">Preview</button>
          <button class="btn btn-ghost suggest-btn" data-id="${player.id}">Replace</button>
        </div>
      </div>
    `;
  }).join('');

  const pendingHtml = state.pendingTransfers.map(t => {
    const p = getPlayerById(t.playerId);
    const typeLabel = t.type === 'buy' ? 'Buy' : 'Sell';
    const priceLabel = t.type === 'buy' ? `Br ${p.price}M` : `Br ${getSellingPrice(p)}M`;
    const cls = t.removing ? 'pending-item removing' : 'pending-item enter show';

    return `
      <div class="${cls}" data-pending-id="${t.id}">
        <div>
          <div style="font-weight:700;">${typeLabel} ${escapeHtml(p.name)}</div>
          <div style="font-size:12px;color:#a7b9d8;">${priceLabel}</div>
        </div>
        <button class="btn btn-ghost pending-undo" data-id="${t.id}">Undo</button>
      </div>
    `;
  }).join('');

  const preview = calculatePendingPreview();
  const previewHtml = `
    <div class="preview-box">
      <div class="preview-row"><span>Projected Bank</span><strong>Br ${preview.projectedBank}M</strong></div>
      <div class="preview-row"><span>Projected Squad Value</span><strong>Br ${preview.projectedSquadValue}M</strong></div>
      <div class="preview-row"><span>Projected Hits</span><strong>-${preview.projectedHits} pts</strong></div>
      <div class="preview-row"><span>Transfers to apply</span><strong>${preview.transfersApplied}</strong></div>
    </div>
  `;

  return `
    <div class="dashboard">
      <div class="panel market-panel">
        <h3 class="card-title">Transfer Market</h3>

        <div class="search-row">
          <input class="search-box" id="market-search" placeholder="Search player, club or position" value="${escapeHtml(state.marketSearch)}" />
          <div class="filter-group">
            ${['All', 'GK', 'DEF', 'MID', 'FWD'].map(filter => `
              <button class="filter-btn ${state.marketFilter === filter ? 'active' : ''}" data-filter="${filter}">${filter}</button>
            `).join('')}
          </div>
        </div>

        <div class="market-list">${marketList || '<div style="color:#a7b8d0;">No players match your search.</div>'}</div>
      </div>

      <aside class="side-stack">
        <div class="panel">
          <h3 class="card-title">Pending Transfers</h3>
          <div class="pending-list">${pendingHtml || '<div style="color:#a7b8d0;">No pending transfers.</div>'}</div>
          ${previewHtml}
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
            <button id="confirm-transfers-btn" class="btn btn-primary" ${state.pendingTransfers.length === 0 ? 'disabled' : ''}>Confirm Transfers</button>
            <button id="clear-transfers-btn" class="btn btn-ghost" ${state.pendingTransfers.length === 0 ? 'disabled' : ''}>Clear Pending</button>
          </div>
        </div>
      </aside>
    </div>
  `;
}

function renderPointsView() {
  return `
    <div class="panel">
      <h3 class="card-title">Gameweek History</h3>
      ${state.history.length === 0
        ? '<div style="color:#a7b8d0;">No finalized Gameweeks yet.</div>'
        : state.history.map(item => `
          <div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="font-weight:700;">GW ${item.gw}</div>
            <div style="font-size:12px;color:#a7b8d0;">Gross ${item.grossPoints} • Hits -${item.hits} • Net ${item.netPoints}</div>
          </div>
        `).join('')
      }
    </div>
  `;
}

function renderRulesView() {
  return `
    <div class="panel">
      <h3 class="card-title">Rules Summary</h3>
      <ul style="margin:0;padding-left:18px;color:#edf4ff;line-height:1.7;">
        <li>Build a 15-player squad: 2 GK, 5 DEF, 5 MID, 3 FWD.</li>
        <li>Budget: Br ${INITIAL_BUDGET}M and max 3 players per club.</li>
        <li>Captain and vice-captain can be set from your squad.</li>
        <li>1 free transfer each Gameweek. Extra transfers cost -4 points each.</li>
        <li>Chips: Wildcard, Free Hit, Triple Captain, Bench Boost.</li>
      </ul>
    </div>
  `;
}

function renderWelcomeModal() {
  if (state.hasSeenWelcome) return '';
  return `
    <div class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">Welcome to EPL Fantasy</div>
        </div>

        <div class="modal-body">
          <p style="margin:0 0 8px;">Build your team, manage your squad, and score points every Gameweek.</p>
          <p style="margin:0;">Rules: 2 GK • 5 DEF • 5 MID • 3 FWD • Budget Br ${INITIAL_BUDGET}M • Max 3 per club</p>
        </div>

        <div class="modal-actions">
          <button class="btn btn-primary" id="welcome-close-btn">Start</button>
        </div>
      </div>
    </div>
  `;
}

function renderApp() {
  const root = document.getElementById('app');
  if (!root) return;

  let main = '';
  if (state.activeTab === 'pick-team') main = renderSquadView();
  else if (state.activeTab === 'transfers') main = renderTransfersView();
  else if (state.activeTab === 'points') main = renderPointsView();
  else main = renderRulesView();

  root.innerHTML = `
    <div class="app-shell">
      ${renderWelcomeModal()}
      ${renderHeader()}
      ${renderTabs()}
      <div class="content">${main}</div>
    </div>
  `;

  attachEventListeners();
}

function renderHeader() {
  const squadValue = state.squad.reduce((sum, id) => {
    const p = getPlayerById(id);
    return sum + (p ? p.price : 0);
  }, 0).toFixed(1);

  const ftLabel = state.currentGameweek === 1 ? 'Unlimited' : `${state.freeTransfers} FT`;
  const hitsLabel = state.transferPenalty > 0 ? `-${state.transferPenalty} pts` : '0 pts';

  return `
    <header class="topbar">
      <div class="brand-wrap">
        <div class="brand-title">EPL Fantasy</div>
        <span class="gw-pill">GW ${state.currentGameweek}</span>
      </div>

      <div class="topbar-stats">
        <div class="mini-stat">Bank <strong>Br ${state.bank.toFixed(1)}M</strong></div>
        <div class="mini-stat">Squad <strong>Br ${squadValue}M</strong></div>
        <div class="mini-stat">Transfers <strong>${ftLabel}</strong></div>
        <div class="mini-stat">Hits <strong>${hitsLabel}</strong></div>
        <div class="mini-stat">Pending <strong>${state.pendingTransfers.length}</strong></div>
        <button class="btn btn-primary" id="finalize-gw-btn">Finalize GW</button>
      </div>
    </header>
  `;
}

function renderTabs() {
  return `
    <nav class="tabs">
      <button class="tab-btn ${state.activeTab === 'pick-team' ? 'active' : ''}" data-tab="pick-team">Squad</button>
      <button class="tab-btn ${state.activeTab === 'transfers' ? 'active' : ''}" data-tab="transfers">Transfers</button>
      <button class="tab-btn ${state.activeTab === 'points' ? 'active' : ''}" data-tab="points">Points</button>
      <button class="tab-btn ${state.activeTab === 'rules' ? 'active' : ''}" data-tab="rules">Rules</button>
    </nav>
  `;
}

/* ---------------------------
   Event handling
   --------------------------- */
function attachEventListeners() {
  const app = document.getElementById('app');
  if (!app) return;

  // Avoid duplicate listeners from re-render by using a single delegated click listener
  if (app.__clickHandler) app.removeEventListener('click', app.__clickHandler);

  const clickHandler = (e) => {
    const tabBtn = e.target.closest('.tab-btn');
    if (tabBtn && tabBtn.dataset.tab) {
      state.activeTab = tabBtn.dataset.tab;
      renderApp();
      return;
    }

    const chipBtn = e.target.closest('.chip-btn');
    if (chipBtn && chipBtn.dataset.chip) {
      const chipName = chipBtn.dataset.chip;
      const ok = canActivateChip(chipName);
      if (!ok.ok) { showAlert(ok.reason); return; }

      if (state.activeChip === chipName) {
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

      if (chipName === 'freeHit') state.savedFreeHitSquad = [...state.squad];
      state.activeChip = chipName;
      saveState();
      renderApp();
      return;
    }

    const stageBuyBtn = e.target.closest('.stage-buy');
    if (stageBuyBtn && stageBuyBtn.dataset.id) {
      stageBuy(Number(stageBuyBtn.dataset.id));
      return;
    }

    const stageSellBtn = e.target.closest('.stage-sell');
    if (stageSellBtn && stageSellBtn.dataset.id) {
      stageSell(Number(stageSellBtn.dataset.id));
      return;
    }

    const removeSquadBtn = e.target.closest('.remove-squad-btn');
    if (removeSquadBtn && removeSquadBtn.dataset.id) {
      removeFromSquad(Number(removeSquadBtn.dataset.id));
      return;
    }

    const captainBtn = e.target.closest('.captain-btn');
    if (captainBtn && captainBtn.dataset.id) {
      state.captainId = Number(captainBtn.dataset.id);
      if (state.viceCaptainId === state.captainId) state.viceCaptainId = null;
      saveState();
      renderApp();
      return;
    }

    const viceBtn = e.target.closest('.vice-btn');
    if (viceBtn && viceBtn.dataset.id) {
      state.viceCaptainId = Number(viceBtn.dataset.id);
      if (state.captainId === state.viceCaptainId) state.captainId = null;
      saveState();
      renderApp();
      return;
    }

    const previewBtn = e.target.closest('.preview-single');
    if (previewBtn && previewBtn.dataset.id) {
      const id = Number(previewBtn.dataset.id);
      const extra = { type: state.squad.includes(id) ? 'sell' : 'buy', playerId: id };
      showTransferBreakdownModal(extra);
      return;
    }

    const suggestBtn = e.target.closest('.suggest-btn');
    if (suggestBtn && suggestBtn.dataset.id) {
      showReplacementModal(Number(suggestBtn.dataset.id));
      return;
    }

    const pendingUndoBtn = e.target.closest('.pending-undo');
    if (pendingUndoBtn && pendingUndoBtn.dataset.id) {
      removePendingByIdAnimated(Number(pendingUndoBtn.dataset.id));
      return;
    }

    const confirmTransfersBtn = e.target.closest('#confirm-transfers-btn');
    if (confirmTransfersBtn) {
      if (!state.pendingTransfers.length) {
        showAlert('No pending transfers.');
        return;
      }
      showTransferBreakdownModal();
      return;
    }

    const clearTransfersBtn = e.target.closest('#clear-transfers-btn');
    if (clearTransfersBtn) {
      clearPendingTransfers();
      return;
    }

    const stageSwapBtn = e.target.closest('.stage-swap');
    if (stageSwapBtn && stageSwapBtn.dataset.buy && stageSwapBtn.dataset.sell) {
      const buyId = Number(stageSwapBtn.dataset.buy);
      const sellId = Number(stageSwapBtn.dataset.sell);
      state.pendingTransfers.push({ id: ++pendingIdCounter, type: 'sell', playerId: sellId, ts: Date.now() });
      state.pendingTransfers.push({ id: ++pendingIdCounter, type: 'buy', playerId: buyId, ts: Date.now() });
      saveState();
      renderApp();
      showAlert(`Staged swap: sell ${sellId} + buy ${buyId}`);
      return;
    }

    const filterBtn = e.target.closest('.filter-btn');
    if (filterBtn && filterBtn.dataset.filter) {
      state.marketFilter = filterBtn.dataset.filter;
      renderApp();
      return;
    }

    const finalizeBtn = e.target.closest('#finalize-gw-btn');
    if (finalizeBtn) {
      showModal(
        'Finalize GW (simulate)',
        `<div><label style="display:block;margin-bottom:8px;font-weight:600;">Paste playedData JSON:</label><textarea id="gw-json"></textarea></div>`,
        'Run Finalize',
        () => {
          try {
            const raw = document.getElementById('gw-json').value || '{}';
            const parsed = JSON.parse(raw);
            finalizeGameweek(parsed);
          } catch (err) {
            showAlert('Invalid JSON. Use a valid object like { "1": { "minutes": 90 } }');
          }
        },
        null,
        false
      );
      return;
    }

    const welcomeClose = e.target.closest('#welcome-close-btn');
    if (welcomeClose) {
      state.hasSeenWelcome = true;
      saveState();
      renderApp();
      return;
    }
  };

  app.__clickHandler = clickHandler;
  app.addEventListener('click', clickHandler);

  const inputHandler = (e) => {
    if (e.target && e.target.id === 'market-search') {
      state.marketSearch = e.target.value;
      renderApp();
    }
  };

  if (app.__inputHandler) app.removeEventListener('input', app.__inputHandler);
  app.__inputHandler = inputHandler;
  app.addEventListener('input', inputHandler);
}

function addToSquad(playerId) {
  const player = getPlayerById(playerId);
  if (!player) return;

  const check = canAddPlayer(player);
  if (!check.allowed) {
    showAlert(check.reason);
    return;
  }

  state.squad.push(player.id);
  state.purchasePrices[player.id] = player.price;
  recalculateBank();
  autoAssignXIAndBench();
  saveState();
  renderApp();
}

function removeFromSquad(playerId) {
  if (!state.squad.includes(playerId)) return;
  state.squad = state.squad.filter(id => id !== playerId);
  delete state.purchasePrices[playerId];
  if (state.captainId === playerId) state.captainId = null;
  if (state.viceCaptainId === playerId) state.viceCaptainId = null;
  autoAssignXIAndBench();
  recalculateBank();
  saveState();
  renderApp();
}

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  autoAssignXIAndBench();
  recalculateBank();
  updateTransferPenalty();
  renderApp();
});
