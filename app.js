/* ==========================================================================
   ETHIOPIAN PREMIER LEAGUE FANTASY - COMPLETE & UNIFIED APP LOGIC
   ========================================================================== */

// --- 1. DATA CONSTANTS & INITIAL REGISTERED PLAYERS (16 PLAYERS) ---
const INITIAL_PLAYERS = [
  { id: 1, name: "Abebe Tilahun", pos: "GK", club: "St. George", price: 4.5, points: 28, goals: 0, assists: 0, cleanSheets: 4 },
  { id: 2, name: "Bahiru Negash", pos: "GK", club: "Ethiopia Bunna", price: 4.5, points: 24, goals: 0, assists: 0, cleanSheets: 3 },
  { id: 3, name: "Aschalew Tamene", pos: "DEF", club: "Fasil Kenema", price: 5.0, points: 42, goals: 2, assists: 1, cleanSheets: 5 },
  { id: 4, name: "Yared Bayeh", pos: "DEF", club: "Bahir Dar", price: 5.0, points: 38, goals: 1, assists: 2, cleanSheets: 4 },
  { id: 5, name: "Suleman Hamid", pos: "DEF", club: "St. George", price: 4.5, points: 31, goals: 0, assists: 3, cleanSheets: 4 },
  { id: 6, name: "Henok Gebre", pos: "DEF", club: "Ethiopia Bunna", price: 4.5, points: 29, goals: 1, assists: 1, cleanSheets: 3 },
  { id: 7, name: "Ramkel Lok", pos: "DEF", club: "EEPCO", price: 4.0, points: 18, goals: 0, assists: 0, cleanSheets: 2 },
  { id: 8, name: "Gatoch Panom", pos: "MID", club: "St. George", price: 6.0, points: 55, goals: 4, assists: 4, cleanSheets: 0 },
  { id: 9, name: "Surafel Dagnachew", pos: "MID", club: "Fasil Kenema", price: 6.5, points: 61, goals: 6, assists: 5, cleanSheets: 0 },
  { id: 10, name: "Amanuel Yohannes", pos: "MID", club: "Ethiopia Bunna", price: 6.0, points: 48, goals: 3, assists: 4, cleanSheets: 0 },
  { id: 11, name: "Canaan Markneh", pos: "MID", club: "Defense Force", price: 5.5, points: 39, goals: 3, assists: 2, cleanSheets: 0 },
  { id: 12, name: "Biniyam Fikre", pos: "MID", club: "Sidama Bunna", price: 5.0, points: 32, goals: 2, assists: 2, cleanSheets: 0 },
  { id: 13, name: "Getaneh Kebede", pos: "FWD", club: "Wolkite", price: 7.0, points: 68, goals: 8, assists: 3, cleanSheets: 0 },
  { id: 14, name: "Abel Yalew", pos: "FWD", club: "Mechal", price: 7.5, points: 74, goals: 9, assists: 4, cleanSheets: 0 },
  { id: 15, name: "Dawa Hotessa", pos: "FWD", club: "Adama City", price: 6.5, points: 52, goals: 6, assists: 2, cleanSheets: 0 },
  { id: 16, name: "Chernet Gugsa", pos: "FWD", club: "St. George", price: 6.0, points: 45, goals: 5, assists: 3, cleanSheets: 0 }
];

const SQUAD_LIMITS = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
const MAX_SQUAD_SIZE = 15;
const INITIAL_BUDGET = 100.0;
const MAX_PER_CLUB = 3;

// --- 2. GLOBAL APP STATE ---
let state = {
  activeTab: 'pick-team', // 'pick-team' | 'transfers' | 'points' | 'rules'
  squad: [],              // Array of selected player IDs (up to 15)
  startingXI: [],         // Array of starting XI player IDs (up to 11)
  bench: [],              // Array of bench player IDs (up to 4)
  captainId: null,
  viceCaptainId: null,
  bank: INITIAL_BUDGET,
  positionFilter: 'ALL',   // 'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD'
  searchQuery: '',
  hasSeenWelcome: false,
  currentGameweek: 1,
  selectedForSwap: null,   // Tracks player ID selected for bench substitution
  activeChip: null,        // 'wildcard' | 'freeHit' | 'tripleCaptain' | 'benchBoost' | null
  usedChips: []            // Array of used chip names e.g. ['wildcard']
};

// --- 3. STORAGE & STATE PERSISTENCE ---
function loadState() {
  const savedSquad = localStorage.getItem('epl_fantasy_squad');
  const savedWelcome = localStorage.getItem('epl_fantasy_welcome');
  const savedXI = localStorage.getItem('epl_fantasy_xi');
  const savedRoles = localStorage.getItem('epl_fantasy_roles');
  const savedChips = localStorage.getItem('epl_fantasy_chips');

  if (savedSquad) {
    try {
      state.squad = JSON.parse(savedSquad);
      recalculateBank();
    } catch (e) {
      state.squad = [];
    }
  }

  if (savedXI) {
    try {
      const parsed = JSON.parse(savedXI);
      state.startingXI = parsed.startingXI || [];
      state.bench = parsed.bench || [];
    } catch (e) {
      autoAssignXIAndBench();
    }
  } else {
    autoAssignXIAndBench();
  }

  if (savedRoles) {
    try {
      const roles = JSON.parse(savedRoles);
      state.captainId = roles.captainId || null;
      state.viceCaptainId = roles.viceCaptainId || null;
    } catch (e) {}
  }

  if (savedChips) {
    try {
      const parsed = JSON.parse(savedChips);
      state.activeChip = parsed.activeChip || null;
      state.usedChips = parsed.usedChips || [];
    } catch (e) {}
  }

  if (savedWelcome) {
    state.hasSeenWelcome = JSON.parse(savedWelcome);
  }
}

function saveState() {
  localStorage.setItem('epl_fantasy_squad', JSON.stringify(state.squad));
  localStorage.setItem('epl_fantasy_welcome', JSON.stringify(state.hasSeenWelcome));
  localStorage.setItem('epl_fantasy_xi', JSON.stringify({ startingXI: state.startingXI, bench: state.bench }));
  localStorage.setItem('epl_fantasy_roles', JSON.stringify({ captainId: state.captainId, viceCaptainId: state.viceCaptainId }));
  localStorage.setItem('epl_fantasy_chips', JSON.stringify({ activeChip: state.activeChip, usedChips: state.usedChips }));
}

function recalculateBank() {
  const totalSpent = state.squad.reduce((sum, id) => {
    const p = INITIAL_PLAYERS.find(item => item.id === id);
    return sum + (p ? p.price : 0);
  }, 0);
  state.bank = parseFloat((INITIAL_BUDGET - totalSpent).toFixed(1));
}

function autoAssignXIAndBench() {
  state.startingXI = [];
  state.bench = [];

  const squadPlayers = state.squad.map(id => INITIAL_PLAYERS.find(p => p.id === id)).filter(Boolean);

  const posOrder = ['GK', 'DEF', 'MID', 'FWD'];
  posOrder.forEach(pos => {
    const posPlayers = squadPlayers.filter(p => p.pos === pos);
    const starterLimit = pos === 'GK' ? 1 : pos === 'DEF' ? 4 : pos === 'MID' ? 4 : 2;
    
    posPlayers.forEach((p, idx) => {
      if (idx < starterLimit && state.startingXI.length < 11) {
        state.startingXI.push(p.id);
      } else {
        state.bench.push(p.id);
      }
    });
  });

  if (state.startingXI.length > 0 && !state.captainId) {
    state.captainId = state.startingXI[0];
  }
  if (state.startingXI.length > 1 && !state.viceCaptainId) {
    state.viceCaptainId = state.startingXI[1];
  }
}

// --- 4. VALIDATION, SQUAD & SWAP ACTIONS ---
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
  if (state.squad.length >= MAX_SQUAD_SIZE) return { allowed: false, reason: "Squad full (15/15)" };
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
  autoAssignXIAndBench();
  recalculateBank();
  saveState();
  renderApp();
}

function removePlayerFromSquad(playerId) {
  state.squad = state.squad.filter(id => id !== playerId);
  state.startingXI = state.startingXI.filter(id => id !== playerId);
  state.bench = state.bench.filter(id => id !== playerId);

  if (state.captainId === playerId) state.captainId = state.startingXI[0] || null;
  if (state.viceCaptainId === playerId) state.viceCaptainId = state.startingXI[1] || null;
  if (state.selectedForSwap === playerId) state.selectedForSwap = null;

  recalculateBank();
  saveState();
  renderApp();
}

// BENCH SUBSTITUTION & SWAP SYSTEM
function swapPlayers(player1Id, player2Id) {
  const p1 = INITIAL_PLAYERS.find(p => p.id === player1Id);
  const p2 = INITIAL_PLAYERS.find(p => p.id === player2Id);

  if (!p1 || !p2) return;

  const p1InXI = state.startingXI.includes(player1Id);
  const p2InXI = state.startingXI.includes(player2Id);

  if (p1InXI !== p2InXI) {
    const starterId = p1InXI ? player1Id : player2Id;
    const benchId = p1InXI ? player2Id : player1Id;

    const starter = INITIAL_PLAYERS.find(p => p.id === starterId);
    const benchPlayer = INITIAL_PLAYERS.find(p => p.id === benchId);

    if ((starter.pos === 'GK' || benchPlayer.pos === 'GK') && starter.pos !== benchPlayer.pos) {
      alert("Goalkeepers can only be swapped with another Goalkeeper.");
      state.selectedForSwap = null;
      renderApp();
      return;
    }

    state.startingXI = state.startingXI.map(id => id === starterId ? benchId : id);
    state.bench = state.bench.map(id => id === benchId ? starterId : id);
  } else {
    alert("Select one starting XI player and one bench player to make a substitution.");
  }

  state.selectedForSwap = null;
  saveState();
  renderApp();
}

function handlePlayerSelectForSwap(playerId) {
  if (!state.selectedForSwap) {
    state.selectedForSwap = playerId;
  } else if (state.selectedForSwap === playerId) {
    state.selectedForSwap = null;
  } else {
    swapPlayers(state.selectedForSwap, playerId);
    return;
  }
  renderApp();
}

function navigateToTransfersForPosition(pos) {
  state.positionFilter = pos;
  state.activeTab = 'transfers';
  renderApp();
}

function setCaptain(playerId) {
  if (!state.startingXI.includes(playerId)) return;
  if (state.viceCaptainId === playerId) {
    state.viceCaptainId = state.captainId;
  }
  state.captainId = playerId;
  saveState();
  renderApp();
}

function setViceCaptain(playerId) {
  if (!state.startingXI.includes(playerId)) return;
  if (state.captainId === playerId) return;
  state.viceCaptainId = playerId;
  saveState();
  renderApp();
}

// STRATEGIC CHIPS ACTIVATION
function playChip(chipName) {
  if (state.usedChips.includes(chipName)) {
    alert(`${chipName} has already been used this season!`);
    return;
  }

  if (state.activeChip === chipName) {
    state.activeChip = null;
  } else {
    state.activeChip = chipName;
  }

  saveState();
  renderApp();
}

// --- 5. RENDER COMPONENTS ---

// A. Welcome Onboarding Modal
function renderWelcomeModal() {
  if (state.hasSeenWelcome) return '';

  return `
    <div id="welcome-modal" class="modal-overlay">
      <div class="modal-card">
        <h2>Welcome to Ethiopian Premier League Fantasy!</h2>
        <p>Build your 15-player squad and compete across Gameweeks.</p>
        
        <div class="rules-list">
          <h4>Official Squad Selection Rules:</h4>
          <ul>
            <li><strong>Budget:</strong> Br ${INITIAL_BUDGET} Million</li>
            <li><strong>Squad Size:</strong> 15 Players (2 GK, 5 DEF, 5 MID, 3 FWD)</li>
            <li><strong>Club Limit:</strong> Max 3 players from any single club</li>
          </ul>
        </div>

        <p class="guide-tip">
          <strong>How to start:</strong> Click any empty slot (<span class="plus-badge">+</span>) on the pitch to go directly to the Transfer Market and buy a player for that position.
        </p>

        <button id="close-welcome-btn" class="btn-primary">Build My Squad</button>
      </div>
    </div>
  `;
}

// B. Header & Squad Overview Bar
function renderHeaderStats() {
  const squadVal = (INITIAL_BUDGET - state.bank).toFixed(1);
  return `
    <header class="app-header">
      <div class="brand">
        <h1>EPL Fantasy</h1>
        <span class="gw-badge">Gameweek ${state.currentGameweek}</span>
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

// C. Tab Navigation
function renderNavigation() {
  return `
    <nav class="tab-nav">
      <button class="tab-btn ${state.activeTab === 'pick-team' ? 'active' : ''}" data-tab="pick-team">Pick Team</button>
      <button class="tab-btn ${state.activeTab === 'transfers' ? 'active' : ''}" data-tab="transfers">Transfers</button>
      <button class="tab-btn ${state.activeTab === 'points' ? 'active' : ''}" data-tab="points">Points</button>
      <button class="tab-btn ${state.activeTab === 'rules' ? 'active' : ''}" data-tab="rules">Rules</button>
    </nav>
  `;
}

// D. Pitch & Squad View (Pick Team)
function renderPitchView() {
  const chips = [
    { key: 'wildcard', label: 'Wildcard' },
    { key: 'freeHit', label: 'Free Hit' },
    { key: 'tripleCaptain', label: 'Triple Captain' },
    { key: 'benchBoost', label: 'Bench Boost' }
  ];

  let chipsHtml = `
    <div class="chips-bar" style="display:flex; gap:10px; justify-content:center; margin-bottom:15px; flex-wrap:wrap;">
      ${chips.map(chip => {
        const isUsed = state.usedChips.includes(chip.key);
        const isActive = state.activeChip === chip.key;
        return `
          <button 
            class="chip-btn ${isActive ? 'active' : ''}" 
            data-chip="${chip.key}" 
            ${isUsed ? 'disabled' : ''}
            style="padding: 8px 14px; border-radius: 20px; border: 1px solid #ccc; background: ${isActive ? '#2e7d32' : isUsed ? '#ccc' : '#fff'}; color: ${isActive ? '#fff' : '#000'}; cursor: ${isUsed ? 'not-allowed' : 'pointer'}; font-weight: bold;"
          >
            ${chip.label}${isUsed ? '(Used)' : isActive ? 'ACTIVE' : ''}
          </button>
        `;
      }).join('')}
    </div>
  `;

  const positions = [
    { key: 'GK', name: 'Goalkeeper', req: 1 },
    { key: 'DEF', name: 'Defenders', req: 4 },
    { key: 'MID', name: 'Midfielders', req: 4 },
    { key: 'FWD', name: 'Forwards', req: 2 }
  ];

  let html = `${chipsHtml}<div class="pitch-container"><div class="pitch">`;

  positions.forEach(posGroup => {
    const startersInPos = state.startingXI
      .map(id => INITIAL_PLAYERS.find(p => p.id === id))
      .filter(p => p && p.pos === posGroup.key);

    html += `<div class="pitch-row position-${posGroup.key.toLowerCase()}">`;

    for (let i = 0; i < posGroup.req; i++) {
      const player = startersInPos[i];
      if (player) {
        const isC = state.captainId === player.id;
        const isVC = state.viceCaptainId === player.id;
        const isSelectedSwap = state.selectedForSwap === player.id;

        html += `
          <div class="player-card filled ${isSelectedSwap ? 'swap-active' : ''}" data-player-id="${player.id}">
            <button class="remove-btn" data-remove="${player.id}" title="Remove player">×</button>
            <div class="shirt-icon">${player.pos}</div>
            <div class="player-name">
              ${player.name}
              ${isC ? '<span class="role-badge captain">C</span>' : ''}
              ${isVC ? '<span class="role-badge vice">VC</span>' : ''}
            </div>
            <div class="player-club">${player.club}</div>
            <div class="player-price">Br ${player.price}M</div>
            <div class="card-actions">
              <button class="btn-role" data-set-c="${player.id}">C</button>
              <button class="btn-role" data-set-vc="${player.id}">VC</button>
            </div>
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

  html += `</div>`;

  // Render Bench
  const benchPlayers = state.bench.map(id => INITIAL_PLAYERS.find(p => p.id === id)).filter(Boolean);
  html += `
    <div class="bench-container">
      <h3>Substitutes Bench</h3>
      <div class="bench-row">
        ${benchPlayers.length === 0 ? '<p class="empty-bench">No substitute players selected yet.</p>' : ''}
        ${benchPlayers.map(player => {
          const isSelectedSwap = state.selectedForSwap === player.id;
          return `
            <div class="player-card bench-card filled ${isSelectedSwap ? 'swap-active' : ''}" data-player-id="${player.id}">
              <button class="remove-btn" data-remove="${player.id}">×</button>
              <div class="shirt-icon bench-icon">${player.pos}</div>
              <div class="player-name">${player.name}</div>
              <div class="player-club">${player.club}</div>
              <div class="player-price">Br ${player.price}M</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  </div>`;

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
        ${filteredPlayers.length === 0 ? `<p class="no-results">No players found matching your search.</p>` : ''}
        ${filteredPlayers.map(player => {
          const isSelected = state.squad.includes(player.id);
          const check = canBuyPlayer(player);

          return `
            <div class="market-item ${isSelected ? 'in-squad' : ''}">
              <div class="item-info">
                <span class="pos-badge ${player.pos.toLowerCase()}">${player.pos}</span>
                <div class="details">
                  <span class="name">${player.name}</span>
                  <span class="club">${player.club} •${player.points} pts</span>
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

// F. Points & Scoreboard View
function renderPointsView() {
  let totalTeamPoints = 0;
  const isTripleCaptain = state.activeChip === 'tripleCaptain';
  const isBenchBoost = state.activeChip === 'benchBoost';

  const pointsListHtml = state.startingXI.map(id => {
    const p = INITIAL_PLAYERS.find(item => item.id === id);
    if (!p) return '';

    let multiplier = 1;
    let badge = '';
    if (state.captainId === p.id) {
      multiplier = isTripleCaptain ? 3 : 2;
      badge = isTripleCaptain ? ' (TC)' : ' (C)';
    } else if (state.viceCaptainId === p.id) {
      badge = ' (VC)';
    }

    const calculatedPts = p.points * multiplier;
    totalTeamPoints += calculatedPts;

    return `
      <div class="score-row">
        <span class="player-meta">${p.name}${badge} - <small>${p.club}</small></span>
        <span class="player-score">${calculatedPts} pts ${multiplier > 1 ? `(${multiplier}x)` : ''}</span>
      </div>
    `;
  }).join('');

  let benchPointsHtml = '';
  if (isBenchBoost) {
    benchPointsHtml = state.bench.map(id => {
      const p = INITIAL_PLAYERS.find(item => item.id === id);
      if (!p) return '';
      totalTeamPoints += p.points;
      return `
        <div class="score-row bench-score" style="opacity: 0.85; background: #e8f5e9;">
          <span class="player-meta">${p.name} (Bench Boost) - <small>${p.club}</small></span>
          <span class="player-score">${p.points} pts</span>
        </div>
      `;
    }).join('');
  }

  return `
    <div class="points-container">
      <div class="total-score-card">
        <h2>Gameweek ${state.currentGameweek} Score</h2>
        <div class="big-score">${totalTeamPoints}</div>
        <p>Total Points ${isBenchBoost ? '(Starting XI + Bench Boost)' : 'across Starting XI'}</p>
        ${state.activeChip ? `<p style="color:#2e7d32; font-weight:bold;">Active Chip: ${state.activeChip.toUpperCase()}</p>` : ''}
      </div>

      <div class="breakdown-card">
        <h3>Player Points Breakdown</h3>
        ${pointsListHtml || '<p>Select your squad to calculate Gameweek points.</p>'}
        ${benchPointsHtml}
      </div>
    </div>
  `;
}

// G. Rules View
function renderRulesView() {
  return `
    <div class="rules-container">
      <h2>Ethiopian Fantasy Premier League Rules</h2>
      <ul class="rules-guide">
        <li><strong>Squad Budget:</strong> You start with a maximum budget of Br 100.0M.</li>
        <li><strong>Squad Size:</strong> Exactly 15 players (2 Goalkeepers, 5 Defenders, 5 Midfielders, 3 Forwards).</li>
        <li><strong>Club Limit:</strong> Max 3 players from any single club (e.g., St. George, Ethiopia Bunna).</li>
        <li><strong>Captain (C):</strong> Earns 2x points for the Gameweek.</li>
        <li><strong>Vice-Captain (VC):</strong> Receives 2x points if your Captain does not play.</li>
        <li><strong>Substitutions:</strong> Click a player on the pitch and a player on the bench to swap them.</li>
        <li><strong>Strategic Chips:</strong> Activate Wildcard, Free Hit, Triple Captain (3x Captain points), or Bench Boost (adds bench score).</li>
      </ul>
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
  } else if (state.activeTab === 'points') {
    mainContent = renderPointsView();
  } else if (state.activeTab === 'rules') {
    mainContent = renderRulesView();
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
  // Onboarding Modal Close
  const closeBtn = document.getElementById('close-welcome-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      state.hasSeenWelcome = true;
      saveState();
      renderApp();
    });
  }

  // Navigation Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      state.activeTab = e.currentTarget.dataset.tab;
      renderApp();
    });
  });

  // Pick Slot (+ Button) Direct Routing
  document.querySelectorAll('[data-pick-pos]').forEach(slot => {
    slot.addEventListener('click', (e) => {
      const pos = e.currentTarget.dataset.pickPos;
      navigateToTransfersForPosition(pos);
    });
  });

  // Card Click for Bench Substitution / Swapping
  document.querySelectorAll('.player-card.filled').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.remove-btn') || e.target.closest('.btn-role')) return;
      const playerId = parseInt(card.dataset.playerId, 10);
      if (playerId) handlePlayerSelectForSwap(playerId);
    });
  });

  // Remove Player
  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(e.currentTarget.dataset.remove, 10);
      removePlayerFromSquad(id);
    });
  });

  // Captain Assignment
  document.querySelectorAll('[data-set-c]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(e.currentTarget.dataset.setC, 10);
      setCaptain(id);
    });
  });

  // Vice Captain Assignment
  document.querySelectorAll('[data-set-vc]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(e.currentTarget.dataset.setVc, 10);
      setViceCaptain(id);
    });
  });

  // Position Filter Chips
  document.querySelectorAll('[data-filter-pos]').forEach(chip => {
    chip.addEventListener('click', (e) => {
      state.positionFilter = e.currentTarget.dataset.filterPos;
      renderApp();
    });
  });

  // Search Input with Focus Retention
  const searchInput = document.getElementById('player-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      const cursor = e.target.selectionStart;
      renderApp();
      const refreshedInput = document.getElementById('player-search');
      if (refreshedInput) {
        refreshedInput.focus();
        refreshedInput.setSelectionRange(cursor, cursor);
      }
    });
  }

  // Buy Player
  document.querySelectorAll('[data-buy-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.buyId, 10);
      addPlayerToSquad(id);
    });
  });

  // Sell Player
  document.querySelectorAll('[data-sell-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.sellId, 10);
      removePlayerFromSquad(id);
    });
  });

  // Chip Activation Event Listener
  document.querySelectorAll('[data-chip]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const chipName = e.currentTarget.dataset.chip;
      playChip(chipName);
    });
  });
}

// --- 8. INIT APP ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderApp();
});
