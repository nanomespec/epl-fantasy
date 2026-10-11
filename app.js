/* ==========================================================================
   EPL FANTASY APP — VERSION 2
   FPL-style dashboard + squad builder + transfer market + scoring logic
   ==========================================================================
   Designed to be a single-file app.js for browser use.
   ========================================================================== */

/* ---------------------------
   Theme CSS
   --------------------------- */
(function injectTheme() {
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    :root {
      --bg: #0b1020;
      --bg2: #0f172a;
      --panel: #101b2d;
      --panel-2: #121f34;
      --card: #122033;
      --card-2: #0d182b;
      --muted: #a6b6cf;
      --text: #edf4ff;
      --line: rgba(255,255,255,0.08);
      --purple: #5f3db9;
      --purple-2: #7b56d7;
      --green: #2e7d32;
      --red: #c62828;
      --yellow: #d4a42d;
      --shadow: 0 18px 36px rgba(0,0,0,0.25);
      --radius: 14px;
    }

    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      min-height: 100%;
      background: linear-gradient(180deg, #0b1020, #0a1328);
      color: var(--text);
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    body { line-height: 1.4; }
    button, input, textarea { font: inherit; }

    #app {
      max-width: 1280px;
      margin: 16px auto;
      padding: 0 10px 28px;
    }

    .app-shell {
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--line);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: var(--shadow);
    }

    .topbar {
      background: linear-gradient(90deg, var(--purple), var(--purple-2));
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .brand-title {
      font-weight: 800;
      font-size: 1.5rem;
      letter-spacing: 0.2px;
    }
    .gw-pill {
      border-radius: 999px;
      background: rgba(255,255,255,0.08);
      color: #fff;
      padding: 6px 12px;
      font-size: 0.76rem;
      border: 1px solid rgba(255,255,255,0.08);
    }

    .topbar-stats {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .mini-stat {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 7px 10px;
      font-size: 0.76rem;
      color: rgba(255,255,255,0.95);
      min-width: 90px;
      text-align: center;
    }
    .mini-stat strong { font-size: 0.8rem; }

    .tabs {
      display: flex;
      gap: 8px;
      padding: 12px 16px 0;
      border-bottom: 1px solid var(--line);
      background: rgba(255,255,255,0.015);
      flex-wrap: wrap;
    }
    .tab-btn {
      background: transparent;
      color: var(--muted);
      border: 1px solid rgba(255,255,255,0.04);
      border-radius: 10px 10px 0 0;
      padding: 10px 14px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.18s ease;
    }
    .tab-btn.active {
      background: rgba(255,255,255,0.04);
      color: var(--text);
      border-color: rgba(255,255,255,0.08);
    }

    .content {
      padding: 16px;
      display: block;
    }

    .dashboard {
      display: grid;
      grid-template-columns: minmax(0, 1.6fr) minmax(280px, 420px);
      gap: 18px;
    }

    .panel {
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 14px;
    }

    .card-title {
      margin: 0 0 12px;
      font-size: 1.02rem;
      font-weight: 700;
      letter-spacing: 0.12px;
    }

    .pitch {
      background: linear-gradient(180deg, #0c2d1d, #0c321f);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 14px;
    }
    .pitch-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
    }
    .pitch-row + .pitch-row { margin-top: 10px; }

    .player-card {
      width: 140px;
      min-height: 82px;
      background: rgba(11, 17, 27, 0.5);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 10px 20px rgba(0,0,0,0.18);
    }
    .player-card.empty {
      border-style: dashed;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.3);
      background: rgba(255,255,255,0.02);
    }

    .player-name {
      font-weight: 700;
      font-size: 0.85rem;
      line-height: 1.3;
    }
    .player-meta {
      font-size: 0.72rem;
      color: rgba(255,255,255,0.7);
      line-height: 1.2;
    }

    .bench-wrap {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .bench-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
    .bench-player {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 8px;
      padding: 6px 8px;
      font-size: 0.74rem;
      color: rgba(255,255,255,0.85);
    }

    .chip-bar {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .chip-btn {
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.02);
      color: #eaf2ff;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 0.72rem;
      cursor: pointer;
      transition: all 0.16s ease;
    }
    .chip-btn.active {
      background: #fff;
      color: #122033;
      font-weight: 700;
    }
    .chip-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .side-panel {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .squad-summary {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .summary-box {
      background: rgba(255,255,255,0.025);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 10px 12px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 6px 0;
      font-size: 0.8rem;
      color: var(--muted);
    }
    .summary-row strong { color: var(--text); }

    .market-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 500px;
      overflow: auto;
      padding-right: 4px;
    }
    .market-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      background: rgba(255,255,255,0.025);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 10px;
      padding: 10px 12px;
    }
    .market-main {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }
    .market-name {
      font-weight: 700;
      font-size: 0.85rem;
    }
    .market-meta {
      color: var(--muted);
      font-size: 0.72rem;
    }
    .market-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      justify-content: flex-end;
    }
    .price-tag {
      font-weight: 700;
      font-size: 0.78rem;
      color: #fff;
    }

    .btn {
      border-radius: 8px;
      padding: 8px 12px;
      cursor: pointer;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03);
      color: var(--text);
      transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
    }
    .btn:hover { transform: translateY(-1px); }
    .btn-primary {
      background: linear-gradient(180deg, #7c55d8, #5d3ab8);
      border: none;
      box-shadow: 0 8px 18px rgba(88, 60, 160, 0.25);
    }
    .btn-ghost {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .btn-danger {
      background: linear-gradient(180deg, #d93a3a, #b82424);
      border: none;
    }
    .btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .pending-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 10px;
    }
    .pending-item {
      border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.02);
      border-radius: 10px;
      padding: 8px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      transition: transform 0.25s ease, opacity 0.25s ease;
    }
    .pending-item.enter { opacity: 0; transform: translateY(-6px); }
    .pending-item.enter.show { opacity: 1; transform: translateY(0); }
    .pending-item.removing {
      opacity: 0; transform: translateX(30px); height: 0; overflow: hidden; margin: 0; padding: 0;
    }

    .preview-box {
      margin-top: 12px;
      padding: 10px 12px;
      border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.02);
      border-radius: 10px;
    }
    .preview-box .row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 5px 0;
      color: var(--muted);
      font-size: 0.78rem;
    }
    .preview-box strong { color: var(--text); }

    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.45);
      padding: 24px;
      z-index: 2000;
    }
    .modal-card {
      background: linear-gradient(180deg, rgba(14,22,35,0.98), rgba(11,17,28,0.98));
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      width: min(760px, 100%);
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      padding: 18px 18px 14px;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .modal-title {
      font-size: 1.1rem;
      font-weight: 700;
    }
    .modal-body {
      max-height: 70vh;
      overflow: auto;
      color: var(--text);
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 12px;
    }

    .transfer-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px dashed rgba(255,255,255,0.08);
    }
    .transfer-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge {
      font-size: 0.68rem;
      border-radius: 999px;
      padding: 4px 7px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03);
      color: #edf4ff;
      white-space: nowrap;
    }

    textarea {
      width: 100%;
      min-height: 180px;
      border-radius: 10px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.08);
      color: #edf4ff;
      padding: 10px 12px;
    }

    @media (max-width: 980px) {
      .dashboard {
        grid-template-columns: 1fr;
      }
      .topbar { align-items: flex-start; }
      .topbar-stats { width: 100%; }
      .market-item { flex-direction: column; align-items: stretch; }
      .market-actions { justify-content: flex-start; }
    }
  `;

  const s = document.createElement('style');
  s.innerHTML = css;
  document.head.appendChild(s);
})();

/* ---------------------------
   Data
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
  _gwCaptainOverride: null
};

let pendingIdCounter = Date.now();

/* ---------------------------
   Helpers
   --------------------------- */
function escapeHtml(value = '') {
  return String(value)
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
  const raw = localStorage.getItem('epl_state');
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state = Object.assign(state, parsed);
  } catch (e) {}
}

function ensureModalRoot() {
  if (document.getElementById('app-modal-root')) return;
  const root = document.createElement('div');
  root.id = 'app-modal-root';
  document.body.appendChild(root);
}

function showModal({ title = '', html = '', onConfirm = null, onCancel = null, confirmText = 'OK', cancelText = 'Cancel', hideCancel = false }) {
  ensureModalRoot();
  const root = document.getElementById('app-modal-root');

  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">${escapeHtml(title)}</div>
        </div>
        <div class="modal-body">${html}</div>
        <div class="modal-actions">
          ${hideCancel ? '' : `<button class="btn btn-ghost" id="modal-cancel-btn">${escapeHtml(cancelText)}</button>`}
          <button class="btn btn-primary" id="modal-confirm-btn">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    </div>
  `;

  const confirmBtn = document.getElementById('modal-confirm-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  const overlay = root.querySelector('.modal-overlay');

  const cleanup = () => {
    root.innerHTML = '';
    root.style.display = 'none';
  };

  root.style.display = 'block';

  if (confirmBtn) {
    confirmBtn.onclick = () => {
      cleanup();
      if (onConfirm) onConfirm();
    };
  }

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      cleanup();
      if (onCancel) onCancel();
    };
  }

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
  showModal({
    title: 'Notice',
    html: `<div>${escapeHtml(message)}</div>`,
    confirmText: 'Close',
    hideCancel: true
  });
}

function showConfirm(message, onYes, onNo) {
  showModal({
    title: 'Confirm',
    html: `<div>${escapeHtml(message)}</div>`,
    confirmText: 'Yes',
    cancelText: 'No',
    onConfirm: onYes,
    onCancel: onNo
  });
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
    state.transferPenalty = 0;
    return;
  }
  const excess = Math.max(0, state.transfersMadeThisGW - state.freeTransfers);
  state.transferPenalty = excess * HIT_PENALTY;
}

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
  if (squad.length !== MAX_SQUAD_SIZE) return { ok: false, reason: `Squad must be ${MAX_SQUAD_SIZE} players.` };

  const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  const clubs = {};
  let totalValue = 0;

  for (const id of squad) {
    const p = INITIAL_PLAYERS.find(x => x.id === id);
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

function canBuyPlayerImmediate(player) {
  if (state.squad.includes(player.id)) return { allowed: false, reason: 'Already in squad.' };
  if (state.squad.length >= MAX_SQUAD_SIZE) return { allowed: false, reason: 'Squad is full (15/15).' };
  if (state.bank < player.price) return { allowed: false, reason: 'Insufficient budget.' };

  const posCount = state.squad.filter(id => {
    const p = INITIAL_PLAYERS.find(x => x.id === id);
    return p && p.pos === player.pos;
  }).length;
  if (posCount >= SQUAD_RULES[player.pos]) {
    return { allowed: false, reason: `Max ${SQUAD_RULES[player.pos]} ${player.pos}s allowed.` };
  }

  const clubCount = state.squad.filter(id => {
    const p = INITIAL_PLAYERS.find(x => x.id === id);
    return p && p.club === player.club;
  }).length;
  if (clubCount >= MAX_PER_CLUB) {
    return { allowed: false, reason: `Max ${MAX_PER_CLUB} players per club.` };
  }

  return { allowed: true };
}

/* ---------------------------
   Squad auto-select
   --------------------------- */
function autoAssignXIAndBench() {
  state.startingXI = [];
  state.bench = [];

  const players = state.squad.map(id => INITIAL_PLAYERS.find(p => p.id === id)).filter(Boolean);

  if (!players.length) return;

  const gk = players.filter(p => p.pos === 'GK').sort((a, b) => b.points - a.points);
  const def = players.filter(p => p.pos === 'DEF').sort((a, b) => b.points - a.points);
  const mid = players.filter(p => p.pos === 'MID').sort((a, b) => b.points - a.points);
  const fwd = players.filter(p => p.pos === 'FWD').sort((a, b) => b.points - a.points);

  if (gk.length === 0) {
    state.startingXI = [];
    state.bench = [...state.squad];
    return;
  }

  let best = { total: -Infinity, starters: [] };

  ALLOWED_FORMATIONS.forEach(form => {
    if (def.length < form.def) return;
    if (mid.length < form.mid) return;
    if (fwd.length < form.fwd) return;

    const starters = [
      gk[0],
      ...def.slice(0, form.def),
      ...mid.slice(0, form.mid),
      ...fwd.slice(0, form.fwd)
    ];

    if (starters.length !== 11) return;

    const total = starters.reduce((sum, p) => sum + p.points, 0);
    if (total > best.total) {
      best = { total, starters: starters.map(p => p.id) };
    }
  });

  if (best.total === -Infinity) {
    const outfield = players.filter(p => p.pos !== 'GK').sort((a, b) => b.points - a.points);
    state.startingXI = [gk[0].id, ...outfield.slice(0, 10).map(p => p.id)];
  } else {
    state.startingXI = best.starters;
  }

  state.bench = state.squad.filter(id => !state.startingXI.includes(id));

  if (!state.captainId && state.startingXI.length) state.captainId = state.startingXI[0];
  if (!state.viceCaptainId && state.startingXI.length > 1) state.viceCaptainId = state.startingXI[1];
}

/* ---------------------------
   Pending transfers and preview
   --------------------------- */
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

  const buys = staged.filter(t => t.type === 'buy').map(t => INITIAL_PLAYERS.find(p => p.id === t.playerId)).filter(Boolean);
  const sells = staged.filter(t => t.type === 'sell').map(t => INITIAL_PLAYERS.find(p => p.id === t.playerId)).filter(Boolean);

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
    buys,
    sells,
    projectedSquadValue: parseFloat(computeSquadValue(futureSquad).toFixed(1)),
    projectedClubCounts: computeClubCounts(futureSquad),
    futureSquad
  };
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
      <div style="display:flex;justify-content:space-between;gap:8px;padding:4px 0;">
        <span>Projected Bank</span>
        <strong>Br ${preview.projectedBank}M</strong>
      </div>
      <div style="display:flex;justify-content:space-between;gap:8px;padding:4px 0;">
        <span>Projected Squad Value</span>
        <strong>Br ${preview.projectedSquadValue}M</strong>
      </div>
      <div style="display:flex;justify-content:space-between;gap:8px;padding:4px 0;">
        <span>Projected Hits</span>
        <strong>-${preview.projectedHits} pts</strong>
      </div>
      <div style="margin-top:10px;">
        <div style="font-weight:700;margin-bottom:4px;">Club counts</div>
        ${clubCountsHtml}
      </div>
    </div>
  `;

  showModal({
    title: 'Transfer Cost Breakdown',
    html: `<div>${htmlLines}${totals}</div>`,
    confirmText: extra ? 'Stage & Confirm' : 'Confirm Transfers',
    cancelText: 'Cancel',
    onConfirm: () => {
      if (extra) {
        state.pendingTransfers.push({ id: Date.now(), type: extra.type, playerId: extra.playerId, ts: Date.now() });
      }
      applyPendingTransfers();
    }
  });
}

function stageBuy(playerId) {
  const player = INITIAL_PLAYERS.find(p => p.id === playerId);
  if (!player) return;

  if (state.pendingTransfers.find(t => t.type === 'buy' && t.playerId === playerId)) {
    showAlert('This buy is already pending.');
    return;
  }

  const item = { id: ++pendingIdCounter, type: 'buy', playerId, ts: Date.now(), removing: false };
  state.pendingTransfers.push(item);
  renderApp();

  setTimeout(() => {
    const el = document.querySelector(`.pending-item[data-pending-id="${item.id}"]`);
    if (el) el.classList.add('enter', 'show');
  }, 20);
}

function stageSell(playerId) {
  const player = INITIAL_PLAYERS.find(p => p.id === playerId);
  if (!player) return;

  if (!state.squad.includes(playerId)) {
    showAlert('Player not in squad.');
    return;
  }

  if (state.pendingTransfers.find(t => t.type === 'sell' && t.playerId === playerId)) {
    showAlert('This sell is already pending.');
    return;
  }

  const item = { id: ++pendingIdCounter, type: 'sell', playerId, ts: Date.now(), removing: false };
  state.pendingTransfers.push(item);
  renderApp();

  setTimeout(() => {
    const el = document.querySelector(`.pending-item[data-pending-id="${item.id}"]`);
    if (el) el.classList.add('enter', 'show');
  }, 20);
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

/* ---------------------------
   Replacement suggestions
   --------------------------- */
function findReplacementCandidates(targetPlayerId) {
  const target = INITIAL_PLAYERS.find(p => p.id === targetPlayerId);
  if (!target) return { direct: [], swapProposals: [] };

  const direct = INITIAL_PLAYERS.filter(p => !state.squad.includes(p.id) && p.pos === target.pos && p.id !== targetPlayerId)
    .sort((a, b) => b.points - a.points)
    .slice(0, 8);

  const sellCandidates = state.squad
    .map(id => INITIAL_PLAYERS.find(p => p.id === id))
    .filter(Boolean)
    .filter(p => p.pos === target.pos)
    .sort((a, b) => a.points - b.points)
    .slice(0, 8);

  const swapProposals = [];
  direct.forEach(dc => {
    const affordable = canBuyPlayerImmediate(dc).allowed;
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
  const target = INITIAL_PLAYERS.find(p => p.id === targetPlayerId);
  if (!target) return;

  const { direct, swapProposals } = findReplacementCandidates(targetPlayerId);

  const directHtml = direct.length === 0
    ? '<div style="color:#9bb0c9;">No direct candidates found.</div>'
    : direct.map(player => {
      const affordable = canBuyPlayerImmediate(player).allowed;
      return `
        <div class="transfer-line">
          <div class="transfer-left">
            <span class="badge">${escapeHtml(player.pos)}</span>
            <div>
              <div style="font-weight:700;">${escapeHtml(player.name)}</div>
              <div style="font-size:12px;color:#a7b9d8;">${escapeHtml(player.club)} • Br ${player.price}M</div>
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
    ? '<div style="color:#9bb0c9;">No affordable swap suggestions found.</div>'
    : swapProposals.map(item => {
      const buy = item.buy;
      const sell = item.sell;
      return `
        <div class="transfer-line">
          <div class="transfer-left">
            <span class="badge">Swap</span>
            <div>
              <div style="font-weight:700;">${escapeHtml(buy.name)}</div>
              <div style="font-size:12px;color:#a7b9d8;">
                ${sell ? `Sells: ${escapeHtml(sell.name)} • ` : ''}Br ${buy.price}M
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-ghost preview-single" data-id="${buy.id}">Preview</button>
            <button class="btn btn-primary stage-swap" data-buy="${buy.id}" data-sell="${sell ? sell.id : targetPlayerId}">Stage swap</button>
          </div>
        </div>
      `;
    }).join('');

  showModal({
    title: `Replacement suggestions for ${escapeHtml(target.name)}`,
    html: `
      <div>
        <h4>Direct candidates</h4>
        ${directHtml}
        <h4 style="margin-top:18px;">Swap proposals</h4>
        ${swapHtml}
      </div>
    `,
    confirmText: 'Close',
    hideCancel: true
  });

  setTimeout(() => {
    document.querySelectorAll('.stage-swap').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const buyId = Number(e.currentTarget.dataset.buy);
        const sellId = Number(e.currentTarget.dataset.sell);

        state.pendingTransfers.push({ id: ++pendingIdCounter, type: 'sell', playerId: sellId, ts: Date.now() });
        state.pendingTransfers.push({ id: ++pendingIdCounter, type: 'buy', playerId: buyId, ts: Date.now() });

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
   Gameweek scoring & substitutions
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
  const players = startersIds.map(id => INITIAL_PLAYERS.find(p => p.id === id)).filter(Boolean);
  const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  players.forEach(p => { counts[p.pos] = (counts[p.pos] || 0) + 1; });
  return counts.GK === 1 && counts.DEF >= 3 && counts.FWD >= 1 && players.length === 11;
}

function applyAutomaticSubstitutions(playedData) {
  const stats = {};
  for (const k in playedData) stats[Number(k)] = normalizeStat(playedData[k]);

  const starters = [...state.startingXI];
  const bench = [...state.bench];

  const keeperStarterId = starters.find(id => (INITIAL_PLAYERS.find(x => x.id === id) || {}).pos === 'GK');
  if (keeperStarterId) {
    const keeperStats = stats[keeperStarterId] || { minutes: 0 };
    if ((keeperStats.minutes || 0) === 0) {
      for (let i = 0; i < bench.length; i++) {
        const bid = bench[i];
        const p = INITIAL_PLAYERS.find(x => x.id === bid);
        if (!p || p.pos !== 'GK') continue;
        const bStats = stats[bid] || { minutes: 0 };
        if ((bStats.minutes || 0) > 0) {
          starters[starters.indexOf(keeperStarterId)] = bid;
          bench[i] = keeperStarterId;
          break;
        }
      }
    }
  }

  for (let i = 0; i < starters.length; i++) {
    const sid = starters[i];
    const p = INITIAL_PLAYERS.find(x => x.id === sid);
    if (!p || p.pos === 'GK') continue;

    const sStats = stats[sid] || { minutes: 0 };
    if ((sStats.minutes || 0) > 0) continue;

    let candidateIndex = -1;
    for (let bi = 0; bi < bench.length; bi++) {
      const bid = bench[bi];
      const b = INITIAL_PLAYERS.find(x => x.id === bid);
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

  if (player.pos === 'GK' && m.saves) {
    pts += Math.floor(m.saves / 3);
  }

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
    const p = INITIAL_PLAYERS.find(x => x.id === id);
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
      const p = INITIAL_PLAYERS.find(x => x.id === id);
      const s = stats[id] || {};
      const pts = calculatePlayerPoints(p, s);
      perPlayer[id] = pts;
      gross += pts;
    });
  } else {
    state.bench.forEach(id => {
      const p = INITIAL_PLAYERS.find(x => x.id === id);
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
  if (state.activeChip && state.activeChip !== chipName) return { ok: false, reason: 'Another chip is already active this Gameweek.' };
  if (state.currentGameweek > 1 && !state.lastTransferConfirmed) return { ok: false, reason: 'You must confirm a transfer this Gameweek before activating a chip.' };
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
   Rendering
   --------------------------- */
function renderHeader() {
  const squadValue = state.squad.reduce((sum, id) => {
    const p = INITIAL_PLAYERS.find(x => x.id === id);
    return sum + (p ? p.price : 0);
  }, 0).toFixed(1);

  const ftLabel = state.currentGameweek === 1 ? 'Unlimited' : `${state.freeTransfers} FT`;
  const hitsLabel = state.transferPenalty > 0 ? `-${state.transferPenalty} pts` : '0 pts';

  return `
    <header class="topbar">
      <div class="brand">
        <div class="brand-title">EPL Fantasy</div>
        <span class="gw-pill">GW ${state.currentGameweek}</span>
      </div>

      <div class="topbar-stats">
        <div class="mini-stat">Bank <strong>Br ${state.bank.toFixed(1)}M</strong></div>
        <div class="mini-stat">Squad <strong>Br ${squadValue}M</strong></div>
        <div class="mini-stat">Transfers <strong>${ftLabel}</strong></div>
        <div class="mini-stat">Hits <strong>${hitsLabel}</strong></div>
        <div class="mini-stat">Pending <strong>${state.pendingTransfers.length}</strong></div>
        <button id="finalize-gw-btn" class="btn btn-primary">Finalize GW</button>
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

function renderPitchView() {
  const starters = state.startingXI.map(id => INITIAL_PLAYERS.find(p => p.id === id)).filter(Boolean);

  const groups = { GK: [], DEF: [], MID: [], FWD: [] };
  starters.forEach(p => groups[p.pos].push(p));

  const chipHtml = CHIPS.map(chip => {
    const active = state.activeChip === chip;
    const used = state.usedChipsThisSeason.includes(chip);
    return `<button class="chip-btn ${active ? 'active' : ''}" data-chip="${chip}" ${used ? 'disabled' : ''}>${chip}${used ? ' (used)' : ''}${active ? ' (active)' : ''}</button>`;
  }).join(' ');

  const makeCard = (player) => `
    <div class="player-card">
      <div class="player-name">${escapeHtml(player.name)} ${state.captainId === player.id ? '(C)' : ''} ${state.viceCaptainId === player.id ? '(VC)' : ''}</div>
      <div class="player-meta">${escapeHtml(player.pos)} • ${escapeHtml(player.club)}</div>
    </div>
  `;

  return `
    <div class="dashboard">
      <div class="panel">
        <div class="chip-bar">${chipHtml}</div>

        <div class="pitch">
          <div class="pitch-row">${groups.GK.map(makeCard).join('')}</div>
          <div class="pitch-row">${groups.DEF.map(makeCard).join('')}</div>
          <div class="pitch-row">${groups.MID.map(makeCard).join('')}</div>
          <div class="pitch-row">${groups.FWD.map(makeCard).join('')}</div>

          <div class="bench-wrap">
            <div style="font-weight:700;margin-bottom:8px;">Bench</div>
            <div class="bench-list">
              ${state.bench.length ? state.bench.map(id => {
                const p = INITIAL_PLAYERS.find(x => x.id === id);
                return `<div class="bench-player">${escapeHtml(p.name)} • ${escapeHtml(p.pos)}</div>`;
              }).join('') : '<div style="color:rgba(255,255,255,0.6);font-size:0.74rem;">No bench players selected</div>'}
            </div>
          </div>
        </div>
      </div>

      <aside class="side-panel">
        <div class="panel">
          <h3 class="card-title">Squad Summary</h3>
          <div class="squad-summary">
            <div class="summary-box">
              <div class="summary-row"><span>Squad Value</span><strong>Br ${computeSquadValue(state.squad).toFixed(1)}M</strong></div>
              <div class="summary-row"><span>Bank</span><strong>Br ${state.bank.toFixed(1)}M</strong></div>
              <div class="summary-row"><span>Players</span><strong>${state.squad.length}/15</strong></div>
            </div>

            <div class="summary-box">
              <div class="summary-row"><span>GK</span><strong>${state.squad.filter(id => INITIAL_PLAYERS.find(p => p.id === id)?.pos === 'GK').length}/2</strong></div>
              <div class="summary-row"><span>DEF</span><strong>${state.squad.filter(id => INITIAL_PLAYERS.find(p => p.id === id)?.pos === 'DEF').length}/5</strong></div>
              <div class="summary-row"><span>MID</span><strong>${state.squad.filter(id => INITIAL_PLAYERS.find(p => p.id === id)?.pos === 'MID').length}/5</strong></div>
              <div class="summary-row"><span>FWD</span><strong>${state.squad.filter(id => INITIAL_PLAYERS.find(p => p.id === id)?.pos === 'FWD').length}/3</strong></div>
            </div>
          </div>
        </div>

        <div class="panel">
          <h3 class="card-title">Selected Squad</h3>
          <div class="pending-list">
            ${state.squad.length ? state.squad.map(id => {
              const p = INITIAL_PLAYERS.find(x => x.id === id);
              return `<div class="pending-item"><div><strong>${escapeHtml(p.name)}</strong><div style="font-size:12px;color:#a7b9d8;">${escapeHtml(p.pos)} • ${escapeHtml(p.club)}</div></div><button class="btn btn-ghost sell-squad-player" data-id="${p.id}">Sell</button></div>`;
            }).join('') : '<div style="color:#a6b6cf;">No players selected yet.</div>'}
          </div>
        </div>
      </aside>
    </div>
  `;
}

function renderTransfersView() {
  const marketHtml = INITIAL_PLAYERS.map(player => {
    const inSquad = state.squad.includes(player.id);
    const pendingBuy = state.pendingTransfers.find(t => t.type === 'buy' && t.playerId === player.id);
    const pendingSell = state.pendingTransfers.find(t => t.type === 'sell' && t.playerId === player.id);
    const check = canBuyPlayerImmediate(player);

    const preview = calculatePendingPreview({ type: inSquad ? 'sell' : 'buy', playerId: player.id });
    const clubCounts = preview.projectedClubCounts[player.club] || 0;
    const overClub = clubCounts > MAX_PER_CLUB;

    const badge = pendingBuy
      ? '<span class="badge">Pending Buy</span>'
      : pendingSell
      ? '<span class="badge">Pending Sell</span>'
      : '<span class="badge">Preview</span>';

    return `
      <div class="market-item">
        <div class="market-main">
          <div class="market-name">${escapeHtml(player.name)}</div>
          <div class="market-meta">${escapeHtml(player.pos)} • ${escapeHtml(player.club)} • ${player.points} pts</div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <span class="badge">${escapeHtml(player.pos)}</span>
            ${badge}
            ${overClub ? `<span style="color:#ff8a80;font-size:11px;">Club count: ${clubCounts}/${MAX_PER_CLUB}</span>` : ''}
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
    const player = INITIAL_PLAYERS.find(x => x.id === t.playerId);
    const typeLabel = t.type === 'buy' ? 'Buy' : 'Sell';
    const priceLabel = t.type === 'buy' ? `Br ${player.price}M` : `Br ${getSellingPrice(player)}M`;
    const itemClass = t.removing ? 'pending-item removing' : 'pending-item enter show';

    return `
      <div class="${itemClass}" data-pending-id="${t.id}">
        <div>
          <div style="font-weight:700;">${typeLabel} ${escapeHtml(player.name)}</div>
          <div style="font-size:12px;color:#a7b9d8;">${priceLabel}</div>
        </div>
        <button class="btn btn-ghost pending-undo" data-id="${t.id}">Undo</button>
      </div>
    `;
  }).join('');

  const preview = calculatePendingPreview();
  const previewHtml = `
    <div class="preview-box">
      <div class="row"><span>Projected Bank</span><strong>Br ${preview.projectedBank}M</strong></div>
      <div class="row"><span>Projected Squad Value</span><strong>Br ${preview.projectedSquadValue}M</strong></div>
      <div class="row"><span>Projected Hits</span><strong>-${preview.projectedHits} pts</strong></div>
      <div class="row"><span>Transfers to apply</span><strong>${preview.transfersApplied}</strong></div>
    </div>
  `;

  return `
    <div class="dashboard">
      <div class="panel">
        <h3 class="card-title">Transfer Market</h3>
        <div class="market-list">${marketHtml}</div>
      </div>

      <aside class="side-panel">
        <div class="panel">
          <h3 class="card-title">Pending Transfers</h3>
          <div class="pending-list">${pendingHtml || '<div style="color:#a6b6cf;">No pending transfers.</div>'}</div>
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
        ? '<div style="color:#a6b6cf;">No finalized gameweeks yet.</div>'
        : state.history.map(item => `
            <div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="font-weight:700;">GW ${item.gw}</div>
              <div style="font-size:12px;color:#a6b6cf;">Gross ${item.grossPoints} • Hits -${item.hits} • Net ${item.netPoints}</div>
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
      <ul style="margin:0;padding-left:18px;color:#edf4ff;line-height:1.6;">
        <li>Build a 15-player squad: 2 GK, 5 DEF, 5 MID, 3 FWD</li>
        <li>Budget: Br ${INITIAL_BUDGET}M</li>
        <li>Max 3 players per club</li>
        <li>Starting XI must meet formation rules: 1 GK, at least 3 DEF, at least 1 FWD</li>
        <li>1 free transfer per Gameweek, rollover up to 5</li>
        <li>Extra transfers cost -4 points each</li>
        <li>Chips: Wildcard, Free Hit, Triple Captain, Bench Boost</li>
      </ul>
    </div>
  `;
}

function renderApp() {
  const root = document.getElementById('app');
  if (!root) return;

  let mainContent = '';

  if (state.activeTab === 'pick-team') mainContent = renderPitchView();
  else if (state.activeTab === 'transfers') mainContent = renderTransfersView();
  else if (state.activeTab === 'points') mainContent = renderPointsView();
  else mainContent = renderRulesView();

  root.innerHTML = `
    <div class="app-shell">
      ${renderWelcomeModal()}
      ${renderHeader()}
      ${renderTabs()}
      <div class="content">${mainContent}</div>
    </div>
  `;

  attachEventListeners();
  ensureModalRoot();
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
          <p style="margin:0 0 10px;">Build your 15-player squad, manage transfers, and score points every Gameweek.</p>
          <p style="margin:0;">Rules: 2 GK, 5 DEF, 5 MID, 3 FWD • Budget Br ${INITIAL_BUDGET}M • Max 3 per club</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" id="welcome-close-btn">Start</button>
        </div>
      </div>
    </div>
  `;
}

/* ---------------------------
   Event listeners
   --------------------------- */
function attachEventListeners() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      state.activeTab = e.currentTarget.dataset.tab;
      renderApp();
    });
  });

  const finalizeBtn = document.getElementById('finalize-gw-btn');
  if (finalizeBtn) {
    finalizeBtn.addEventListener('click', () => {
      showModal({
        title: 'Finalize GW (simulate)',
        html: `
          <div>
            <label style="display:block;margin-bottom:8px;font-weight:600;">Paste playedData JSON:</label>
            <textarea id="gw-json"></textarea>
          </div>
        `,
        confirmText: 'Run Finalize',
        cancelText: 'Cancel',
        onConfirm: () => {
          const raw = document.getElementById('gw-json').value;
          try {
            const obj = JSON.parse(raw);
            finalizeGameweek(obj);
          } catch (e) {
            showAlert('Invalid JSON. Use a valid object like { "1": { "minutes": 90 } }');
          }
        }
      });
    });
  }

  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const chip = e.currentTarget.dataset.chip;
      playChip(chip);
    });
  });

  document.querySelectorAll('.stage-buy').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.currentTarget.dataset.id);
      stageBuy(id);
    });
  });

  document.querySelectorAll('.stage-sell').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.currentTarget.dataset.id);
      stageSell(id);
    });
  });

  document.querySelectorAll('.sell-squad-player').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.currentTarget.dataset.id);
      stageSell(id);
    });
  });

  document.querySelectorAll('.preview-single').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.currentTarget.dataset.id);
      const extra = { type: state.squad.includes(id) ? 'sell' : 'buy', playerId: id };
      showTransferBreakdownModal(extra);
    });
  });

  document.querySelectorAll('.suggest-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.currentTarget.dataset.id);
      showReplacementModal(id);
    });
  });

  document.querySelectorAll('.pending-undo').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.currentTarget.dataset.id);
      removePendingByIdAnimated(id);
    });
  });

  const confirmBtn = document.getElementById('confirm-transfers-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (!state.pendingTransfers.length) {
        showAlert('No pending transfers.');
        return;
      }
      showTransferBreakdownModal();
    });
  }

  const clearBtn = document.getElementById('clear-transfers-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => clearPendingTransfers());
  }

  const welcomeClose = document.getElementById('welcome-close-btn');
  if (welcomeClose) {
    welcomeClose.addEventListener('click', () => {
      state.hasSeenWelcome = true;
      saveState();
      renderApp();
    });
  }
}

/* ---------------------------
   Init
   --------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  autoAssignXIAndBench();
  recalculateBank();
  updateTransferPenalty();
  renderApp();
});
