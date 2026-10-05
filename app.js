/* ==========================================================================
   ETHIOPIAN PREMIER LEAGUE FANTASY - COMPLETE APP LOGIC
   ========================================================================== */

// --- 1. INITIAL REGISTERED PLAYERS (16 PLAYERS) ---
const INITIAL_PLAYERS = [
  { id: 1, name: "Abebe Tilahun", pos: "GK", club: "St. George", price: 4.5, points: 0 },
  { id: 2, name: "Bahiru Negash", pos: "GK", club: "Ethiopia Bunna", price: 4.5, points: 0 },
  { id: 3, name: "Aschalew Tamene", pos: "DEF", club: "Fasil Kenema", price: 5.0, points: 0 },
  { id: 4, name: "Yared Bayeh", pos: "DEF", club: "Bahir Dar", price: 5.0, points: 0 },
  { id: 5, name: "Suleman Hamid", pos: "DEF", club: "St. George", price: 4.5, points: 0 },
  { id: 6, name: "Henok Gebre", pos: "DEF", club: "Ethiopia Bunna", price: 4.5, points: 0 },
  { id: 7, name: "Ramkel Lok", pos: "DEF", club: "EEPCO", price: 4.0, points: 0 },
  { id: 8, name: "Gatoch Panom", pos: "MID", club: "St. George", price: 6.0, points: 0 },
  { id: 9, name: "Surafel Dagnachew", pos: "MID", club: "Fasil Kenema", price: 6.5, points: 0 },
  { id: 10, name: "Amanuel Yohannes", pos: "MID", club: "Ethiopia Bunna", price: 6.0, points: 0 },
  { id: 11, name: "Canaan Markneh", pos: "MID", club: "Defense Force", price: 5.5, points: 0 },
  { id: 12, name: "Biniyam Fikre", pos: "MID", club: "Sidama Bunna", price: 5.0, points: 0 },
  { id: 13, name: "Getaneh Kebede", pos: "FWD", club: "Wolkite", price: 7.0, points: 0 },
  { id: 14, name: "Abel Yalew", pos: "FWD", club: "Mechal", price: 7.5, points: 0 },
  { id: 15, name: "Dawa Hotessa", pos: "FWD", club: "Adama City", price: 6.5, points: 0 },
  { id: 16, name: "Chernet Gugsa", pos: "FWD", club: "St. George", price: 6.0, points: 0 }
];

// POSITIONAL SQUAD REQUIREMENTS
const SQUAD_LIMITS = {
  GK: 2,
  DEF: 5,
  MID: 5,
  FWD: 3
};
const MAX_SQUAD_SIZE = 15;
const INITIAL_BUDGET = 100.0;
const MAX_PER_CLUB = 3;

// --- 2. GLOBAL APP STATE ---
let state = {
  activeTab: 'pick-team', // 'pick-team' | 'transfers'
  squad: [],              // Array of selected player IDs
  bank: INITIAL_BUDGET,
  positionFilter: 'ALL',   // 'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD'
  searchQuery: '',
  hasSeenWelcome: false
};

// --- 3. STORAGE HELPERS ---
function loadState() {
  const savedSquad = localStorage.getItem('epl_fantasy_squad');
  const savedWelcome = localStorage.getItem('epl_fantasy_welcome');
  
  if (savedSquad) {
    try {
      state.squad = JSON.parse(savedSquad);
      recalculateBank();
    } catch (e) {
      state.squad = [];
    }
  }
  
  if (savedWelcome) {
    state.hasSeenWelcome = JSON.parse(savedWelcome);
  }
}

function saveState() {
  localStorage.setItem('epl_fantasy_squad', JSON.stringify(state.squad));
  localStorage.setItem('epl_fantasy_welcome', JSON.stringify(state.hasSeenWelcome));
}

function recalculateBank() {
  const totalSpent = state.squad.reduce((sum, id) => {
    const p = INITIAL_PLAYERS.find(item => item.id === id);
    return sum + (p ? p.price : 0);
  }, 0);
  state.bank = parseFloat((INITIAL_BUDGET - totalSpent).toFixed(1));
}

// --- 4. VALIDATION & HELPERS ---
function getPlayerCountByPosition(pos) {
  return state.squad.filter(id => {
    const p = INITIAL_PLAYERS.find(item => item.id === id);
    return p && p.pos === pos;
  }).length;
}

function getClubCount(clubName) {
  return state.squad.filter(id => {
    const p = INITIAL_PLAYERS.find(item => item.id === id);
    return p && p.club === clubName;
  }).length;
}

function canBuyPlayer(player) {
  if (state.squad.includes(player.id)) return { allowed: false, reason: "Already in squad" };
  if (state.squad.length >= MAX_SQUAD_SIZE) return { allowed: false, reason: "Squad is full (15/15)" };
  if (state.bank < player.price) return { allowed: false, reason: "Insufficient budget" };
  if (getPlayerCountByPosition(player.pos) >= SQUAD_LIMITS[player.pos]) {
    return { allowed: false, reason: `Max ${SQUAD_LIMITS[player.pos]} ${player.pos}s allowed` };
  }
  if (getClubCount(player.club) >= MAX_PER_CLUB) {
    return { allowed: false, reason: `Max ${MAX_PER_CLUB} players per club` };
  }
  return { allowed: true };
}

function addPlayerToSquad(playerId) {
  const player = INITIAL_PLAYERS.find(p => p.id === playerId);
  if (!player) return;
  
  const check = canBuyPlayer(player);
  if (!check.allowed) {
    alert(check.reason);
    return;
  }

  state.squad.push(playerId);
  recalculateBank();
  saveState();
  renderApp();
}

function removePlayerFromSquad(playerId) {
  state.squad = state.squad.filter(id => id !== playerId);
  recalculateBank();
  saveState();
  renderApp();
}

function navigateToTransfersForPosition(pos) {
  state.positionFilter = pos;
  state.activeTab = 'transfers';
  renderApp();
}

// --- 5. RENDER COMPONENTS ---

// A. Welcome Modal
function renderWelcomeModal() {
  if (state.hasSeenWelcome) return '';

  return `
    <div id="welcome-modal" class="modal-overlay">
      <div class="modal-card">
        <h2> Welcome to Ethiopian Premier League Fantasy!</h2>
        <p>Build your ultimate 15-player squad and compete against fans across Ethiopia.</p>
        
        <div class="rules-list">
          <h4>Official Squad Selection Rules:</h4>
          <ul>
            <li><strong>Budget:</strong> Br ${INITIAL_BUDGET} Million</li>
            <li><strong>Squad Size:</strong> 15 Players (2 GK, 5 DEF, 5 MID, 3 FWD)</li>
            <li><strong>Club Limit:</strong> Max 3 players from any single team</li>
          </ul>
        </div>

        <p class="guide-tip">
          <strong>Tip:</strong> Tap any empty slot (<span class="plus-badge">+</span>) on the pitch to pick a player for that position.
        </p>

        <button id="close-welcome-btn" class="btn-primary">Got it, Let's Build!</button>
      </div>
    </div>
  `;
}

// B. Header Stats Bar
function renderHeaderStats() {
  const squadVal = (INITIAL_BUDGET - state.bank).toFixed(1);
  return `
    <header class="app-header">
      <div class="brand">
        <h1>EPL Fantasy</h1>
      </div>
      <div class="stats-bar">
        <div class="stat-box">
          <span class="label">Players</span>
          <span class="val ${state.squad.length === 15 ? 'complete' : ''}">${state.squad.length} / 15</span>
        </div>
        <div class="stat-box">
          <span class="label">Bank</span>
          <span class="val">Br ${state.bank.toFixed(1)}M</span>
        </div>
        <div class="stat-box">
          <span class="label">Squad Value</span>
          <span class="val">Br ${squadVal}M</span>
        </div>
      </div>
    </header>
  `;
}

// C. Navigation Tabs
function renderNavigation() {
  return `
    <nav class="tab-nav">
      <button class="tab-btn ${state.activeTab === 'pick-team' ? 'active' : ''}" data-tab="pick-team">
        Pick Team
      </button>
      <button class="tab-btn ${state.activeTab === 'transfers' ? 'active' : ''}" data-tab="transfers">
        Transfer Market
      </button>
    </nav>
  `;
}

// D. Pitch / Squad View
function renderPitchView() {
  const positions = [
    { key: 'GK', name: 'Goalkeepers', req: 2 },
    { key: 'DEF', name: 'Defenders', req: 5 },
    { key: 'MID', name: 'Midfielders', req: 5 },
    { key: 'FWD', name: 'Forwards', req: 3 }
  ];

  let html = `<div class="pitch-container"><div class="pitch">`;

  positions.forEach(posGroup => {
    const selectedInPos = state.squad
      .map(id => INITIAL_PLAYERS.find(p => p.id === id))
      .filter(p => p && p.pos === posGroup.key);

    html += `<div class="pitch-row position-${posGroup.key.toLowerCase()}">`;

    for (let i = 0; i < posGroup.req; i++) {
      const player = selectedInPos[i];
      if (player) {
        html += `
          <div class="player-card filled">
            <button class="remove-btn" data-remove="${player.id}">×</button>
            <div class="shirt-icon">${player.pos}</div>
            <div class="player-name">${player.name}</div>
            <div class="player-club">${player.club}</div>
            <div class="player-price">Br ${player.price}M</div>
          </div>
        `;
      } else {
        html += `
          <div class="player-card empty" data-pick-pos="${posGroup.key}">
            <div class="add-slot-btn">+</div>
            <div class="slot-label">Add ${posGroup.key}</div>
          </div>
        `;
      }
    }

    html += `</div>`;
  });

  html += `</div></div>`;
  return html;
}

// E. Transfer Market View
function renderTransferMarket() {
  const filteredPlayers = INITIAL_PLAYERS.filter(player => {
    const matchesPos = state.positionFilter === 'ALL' || player.pos === state.positionFilter;
    const matchesSearch = player.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                          player.club.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchesPos && matchesSearch;
  });

  return `
    <div class="transfer-gate">
      <div class="filter-controls">
        <input 
          type="text" 
          id="player-search" 
          placeholder="Search player or club..." 
          value="${state.searchQuery}"
        />
        <div class="position-filters">
          ${['ALL', 'GK', 'DEF', 'MID', 'FWD'].map(pos => `
            <button 
              class="filter-chip ${state.positionFilter === pos ? 'active' : ''}" 
              data-filter-pos="${pos}">
              ${pos}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="market-list">
        ${filteredPlayers.length === 0 ? `<p class="no-results">No players found matching your filter.</p>` : ''}
        ${filteredPlayers.map(player => {
          const isSelected = state.squad.includes(player.id);
          const check = canBuyPlayer(player);

          return `
            <div class="market-item ${isSelected ? 'in-squad' : ''}">
              <div class="item-info">
                <span class="pos-badge ${player.pos.toLowerCase()}">${player.pos}</span>
                <div class="details">
                  <span class="name">${player.name}</span>
                  <span class="club">${player.club}</span>
                </div>
              </div>
              <div class="item-action">
                <span class="price">Br ${player.price}M</span>${isSelected ? `
                  <button class="btn-sell" data-sell-id="${player.id}">Remove</button>
                ` : `
                  <button 
                    class="btn-buy" 
                    data-buy-id="${player.id}" 
                    ${!check.allowed ? `disabled title="${check.reason}"` : ''}>
                    + Buy
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// --- 6. MAIN RENDER CONTROLLER ---
function renderApp() {
  const appRoot = document.getElementById('app') || document.body;
  
  let mainContent = '';
  if (state.activeTab === 'pick-team') {
    mainContent = renderPitchView();
  } else if (state.activeTab === 'transfers') {
    mainContent = renderTransferMarket();
  }

  appRoot.innerHTML = `
    <div class="app-container">
      ${renderWelcomeModal()}
      ${renderHeaderStats()}
      ${renderNavigation()}
      <main class="content-body">
        ${mainContent}
      </main>
    </div>
  `;

  attachEventListeners();
}

// --- 7. EVENT LISTENERS ---
function attachEventListeners() {
  // Close Welcome Modal
  const closeWelcomeBtn = document.getElementById('close-welcome-btn');
  if (closeWelcomeBtn) {
    closeWelcomeBtn.addEventListener('click', () => {
      state.hasSeenWelcome = true;
      saveState();
      renderApp();
    });
  }

  // Tab Switcher
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      state.activeTab = e.currentTarget.dataset.tab;
      renderApp();
    });
  });

  // Pick player (+) slot click -> Route to transfers with pre-filter
  document.querySelectorAll('[data-pick-pos]').forEach(slot => {
    slot.addEventListener('click', (e) => {
      const pos = e.currentTarget.dataset.pickPos;
      navigateToTransfersForPosition(pos);
    });
  });

  // Remove player directly from Pitch Card
  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(e.currentTarget.dataset.remove, 10);
      removePlayerFromSquad(id);
    });
  });

  // Position Filter Chips in Transfers
  document.querySelectorAll('[data-filter-pos]').forEach(chip => {
    chip.addEventListener('click', (e) => {
      state.positionFilter = e.currentTarget.dataset.filterPos;
      renderApp();
    });
  });

  // Search Bar Input
  const searchInput = document.getElementById('player-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      // Retain focus on re-render
      const cursor = e.target.selectionStart;
      renderApp();
      const newSearchInput = document.getElementById('player-search');
      if (newSearchInput) {
        newSearchInput.focus();
        newSearchInput.setSelectionRange(cursor, cursor);
      }
    });
  }

  // Buy Player Button
  document.querySelectorAll('[data-buy-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.buyId, 10);
      addPlayerToSquad(id);
    });
  });

  // Sell Player Button
  document.querySelectorAll('[data-sell-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.sellId, 10);
      removePlayerFromSquad(id);
    });
  });
}

// --- 8. INIT APP ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderApp();
});
