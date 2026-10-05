/* ==========================================================================
   ETHIOPIAN PREMIER LEAGUE FANTASY - COMPLETE APP LOGIC (app.js)
   Includes:
   - Dynamic Formation Engine & Strict Validation
   - Pitch & Bench Player Swaps with Automatic Formation Updates
   - Transfer Market (Buy / Sell, Budget Tracking, Club & Position Constraints)
   - Captain & Vice-Captain Management
   - LocalStorage State Persistence & Toast UI Notifications
   ========================================================================== */

// --- 1. DATA CONSTANTS & PLAYER DATABASE ---
const INITIAL_PLAYERS = [
  { id: 1, name: "Abebe Tilahun", pos: "GK", club: "St. George", price: 5.0 },
  { id: 2, name: "Bahiru Negash", pos: "GK", club: "Ethiopia Bunna", price: 4.5 },
  { id: 3, name: "Aschalew Tamene", pos: "DEF", club: "Fasil Kenema", price: 5.5 },
  { id: 4, name: "Yared Bayeh", pos: "DEF", club: "Bahir Dar", price: 5.0 },
  { id: 5, name: "Suleman Hamid", pos: "DEF", club: "St. George", price: 5.0 },
  { id: 6, name: "Henok Gebre", pos: "DEF", club: "Ethiopia Bunna", price: 4.5 },
  { id: 7, name: "Ramkel Lok", pos: "DEF", club: "EEPCO", price: 4.0 },
  { id: 8, name: "Gatoch Panom", pos: "MID", club: "St. George", price: 7.0 },
  { id: 9, name: "Surafel Dagnachew", pos: "MID", club: "Fasil Kenema", price: 7.5 },
  { id: 10, name: "Amanuel Yohannes", pos: "MID", club: "Ethiopia Bunna", price: 6.5 },
  { id: 11, name: "Biniam Fetu", pos: "MID", club: "Adama City", price: 5.5 },
  { id: 12, name: "Dawa Hotessa", pos: "MID", club: "Adama City", price: 6.0 },
  { id: 13, name: "Getaneh Kebede", pos: "FWD", club: "Fasil Kenema", price: 8.5 },
  { id: 14, name: "Abubeker Nassir", pos: "FWD", club: "Ethiopia Bunna", price: 9.0 },
  { id: 15, name: "Chernet Gugsa", pos: "FWD", club: "St. George", price: 7.5 },
  { id: 16, name: "Mujib Kassim", pos: "FWD", club: "Hawassa City", price: 7.0 },
  { id: 17, name: "Fikru Teferra", pos: "FWD", club: "Sidama Bunna", price: 6.5 },
  { id: 18, name: "Minyelu Wondimu", pos: "DEF", club: "Defense Force", price: 4.5 }
];

const RULES = {
  MAX_BUDGET: 100.0,
  MAX_SQUAD_SIZE: 15,
  MAX_PER_CLUB: 3,
  POS_LIMITS: { GK: 2, DEF: 5, MID: 5, FWD: 3 }
};

// --- 2. GLOBAL SQUAD STATE ---
let squadState = {
  squad: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  starters: [1, 3, 4, 5, 6, 8, 9, 10, 11, 13, 14], // 1 GK, 4 DEF, 4 MID, 2 FWD = 4-4-2
  bench: [2, 7, 12, 15], // 1 GK, 1 DEF, 1 MID, 1 FWD
  captainId: 14,
  viceCaptainId: 13,
  selectedPlayerId: null,
  bank: 12.0,
  formation: "4-4-2"
};

// --- 3. LOCAL STORAGE PERSISTENCE ---
function saveState() {
  try {
    localStorage.setItem("epl_fantasy_squad", JSON.stringify(squadState));
  } catch (e) {
    console.warn("Could not save squad state to LocalStorage", e);
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem("epl_fantasy_squad");
    if (saved) {
      const parsed = JSON.parse(saved);
      squadState = { ...squadState, ...parsed };
    }
  } catch (e) {
    console.warn("Could not load squad state from LocalStorage", e);
  }
}

// --- 4. FORMATION CALCULATOR & VALIDATION ENGINE ---

/**
 * Calculates formation string dynamically based on starters
 * @param {Array} startersList - Array of player objects
 * @returns {string} e.g. "4-4-2", "3-5-2", "4-5-1", "3-4-3"
 */
function calculateFormation(startersList) {
  const defs = startersList.filter(p => p.pos === "DEF").length;
  const mids = startersList.filter(p => p.pos === "MID").length;
  const fwds = startersList.filter(p => p.pos === "FWD").length;
  return `${defs}-${mids}-${fwds}`;
}

/**
 * Validates Fantasy Football formation constraints:
 * - Exactly 1 GK
 * - 3 to 5 Defenders
 * - 2 to 5 Midfielders
 * - 1 to 3 Forwards
 */
function isValidFormation(startersList) {
  if (startersList.length !== 11) {
    return { valid: false, reason: "Starting XI must have exactly 11 players." };
  }

  const gks = startersList.filter(p => p.pos === "GK").length;
  const defs = startersList.filter(p => p.pos === "DEF").length;
  const mids = startersList.filter(p => p.pos === "MID").length;
  const fwds = startersList.filter(p => p.pos === "FWD").length;

  if (gks !== 1) {
    return { valid: false, reason: "You must have exactly 1 Goalkeeper on the pitch." };
  }
  if (defs < 3 || defs > 5) {
    return { valid: false, reason: `Invalid formation (${defs}-${mids}-${fwds}). Teams must have 3-5 Defenders.` };
  }
  if (mids < 2 || mids > 5) {
    return { valid: false, reason: `Invalid formation (${defs}-${mids}-${fwds}). Teams must have 2-5 Midfielders.` };
  }
  if (fwds < 1 || fwds > 3) {
    return { valid: false, reason: `Invalid formation (${defs}-${mids}-${fwds}). Teams must have 1-3 Forwards.` };
  }

  return { valid: true };
}

// --- 5. PLAYER SWAP SYSTEM (DYNAMIC FORMATION UPDATE) ---

function handlePlayerSwap(player1Id, player2Id) {
  // Deselect if clicking the same player twice
  if (player1Id === player2Id) {
    squadState.selectedPlayerId = null;
    renderApp();
    return;
  }

  const isP1Starter = squadState.starters.includes(player1Id);
  const isP2Starter = squadState.starters.includes(player2Id);

  // Starter to Starter swap: Position update on pitch
  if (isP1Starter && isP2Starter) {
    squadState.selectedPlayerId = null;
    renderApp();
    return;
  }

  // Bench to Bench swap: Reorder bench
  if (!isP1Starter && !isP2Starter) {
    const idx1 = squadState.bench.indexOf(player1Id);
    const idx2 = squadState.bench.indexOf(player2Id);
    if (idx1 !== -1 && idx2 !== -1) {
      squadState.bench[idx1] = player2Id;
      squadState.bench[idx2] = player1Id;
    }
    squadState.selectedPlayerId = null;
    saveState();
    renderApp();
    return;
  }

  // Starter to Bench swap
  let newStarters = [...squadState.starters];
  let newBench = [...squadState.bench];

  const starterId = isP1Starter ? player1Id : player2Id;
  const benchId = isP1Starter ? player2Id : player1Id;

  const starterObj = getPlayerById(starterId);
  const benchObj = getPlayerById(benchId);

  // Strict Goalkeeper Rule
  if ((starterObj.pos === "GK" || benchObj.pos === "GK") && starterObj.pos !== benchObj.pos) {
    showNotification("Goalkeepers can only be swapped with another Goalkeeper.", "error");
    squadState.selectedPlayerId = null;
    renderApp();
    return;
  }

  // Swap trial execution
  const starterIdx = newStarters.indexOf(starterId);
  const benchIdx = newBench.indexOf(benchId);

  newStarters[starterIdx] = benchId;
  newBench[benchIdx] = starterId;

  // Validate trial formation (e.g. FWD <-> MID substitution altering formation)
  const fullNewStarterObjs = newStarters.map(getPlayerById);
  const validation = isValidFormation(fullNewStarterObjs);

  if (!validation.valid) {
    showNotification(validation.reason, "error");
    squadState.selectedPlayerId = null;
    renderApp();
    return;
  }

  // Commit valid swap
  squadState.starters = newStarters;
  squadState.bench = newBench;
  squadState.selectedPlayerId = null;

  // AUTO-FIX & UPDATE FORMATION
  squadState.formation = calculateFormation(fullNewStarterObjs);

  showNotification(`Substitution complete! Formation updated to ${squadState.formation}`, "success");
  saveState();
  renderApp();
}

function onPlayerClick(playerId) {
  if (!squadState.squad.includes(playerId)) return;

  if (!squadState.selectedPlayerId) {
    squadState.selectedPlayerId = playerId;
    renderApp();
  } else {
    handlePlayerSwap(squadState.selectedPlayerId, playerId);
  }
}

// --- 6. TRANSFERS ENGINE (BUY & SELL) ---

function addPlayerToSquad(playerId) {
  const player = getPlayerById(playerId);
  if (!player) return;

  if (squadState.squad.includes(playerId)) {
    showNotification(`${player.name} is already in your squad.`, "error");
    return;
  }

  if (squadState.squad.length >= RULES.MAX_SQUAD_SIZE) {
    showNotification("Squad is full (15 players max). Sell a player first.", "error");
    return;
  }

  if (squadState.bank < player.price) {
    showNotification(`Insufficient budget. Need ${player.price.toFixed(1)}m.`, "error");
    return;
  }

  // Position limit check
  const squadObjs = squadState.squad.map(getPlayerById);
  const countInPos = squadObjs.filter(p => p.pos === player.pos).length;
  if (countInPos >= RULES.POS_LIMITS[player.pos]) {
    showNotification(`Maximum ${RULES.POS_LIMITS[player.pos]} ${player.pos}s allowed in squad.`, "error");
    return;
  }

  // Club limit check
  const countInClub = squadObjs.filter(p => p.club === player.club).length;
  if (countInClub >= RULES.MAX_PER_CLUB) {
    showNotification(`Maximum ${RULES.MAX_PER_CLUB} players allowed from ${player.club}.`, "error");
    return;
  }

  // Add to squad
  squadState.squad.push(playerId);
  squadState.bank = parseFloat((squadState.bank - player.price).toFixed(1));

  // Determine if player should go to starters or bench
  if (squadState.starters.length < 11) {
    const trialStarters = [...squadState.starters, playerId].map(getPlayerById);
    if (isValidFormation(trialStarters).valid || trialStarters.length < 11) {
      squadState.starters.push(playerId);
    } else {
      squadState.bench.push(playerId);
    }
  } else {
    squadState.bench.push(playerId);
  }

  // Recalculate formation if added to starters
  const starterObjs = squadState.starters.map(getPlayerById);
  if (starterObjs.length === 11) {
    squadState.formation = calculateFormation(starterObjs);
  }

  showNotification(`${player.name} bought for ${player.price.toFixed(1)}m!`, "success");
  saveState();
  renderApp();
}

function removePlayerFromSquad(playerId) {
  const player = getPlayerById(playerId);
  if (!player || !squadState.squad.includes(playerId)) return;

  squadState.squad = squadState.squad.filter(id => id !== playerId);
  squadState.starters = squadState.starters.filter(id => id !== playerId);
  squadState.bench = squadState.bench.filter(id => id !== playerId);

  squadState.bank = parseFloat((squadState.bank + player.price).toFixed(1));

  if (squadState.captainId === playerId) squadState.captainId = null;
  if (squadState.viceCaptainId === playerId) squadState.viceCaptainId = null;
  if (squadState.selectedPlayerId === playerId) squadState.selectedPlayerId = null;

  // Recalculate formation if starters remaining equal 11
  const starterObjs = squadState.starters.map(getPlayerById);
  if (starterObjs.length === 11) {
    squadState.formation = calculateFormation(starterObjs);
  }

  showNotification(`${player.name} sold for ${player.price.toFixed(1)}m.`, "info");
  saveState();
  renderApp();
}

// --- 7. CAPTAINCY CONTROLS ---

function setCaptain(playerId) {
  if (!squadState.starters.includes(playerId)) {
    showNotification("Captain must be an active starter on the pitch.", "error");
    return;
  }
  if (squadState.viceCaptainId === playerId) {
    squadState.viceCaptainId = squadState.captainId;
  }
  squadState.captainId = playerId;
  saveState();
  renderApp();
}

function setViceCaptain(playerId) {
  if (!squadState.starters.includes(playerId)) {
    showNotification("Vice-captain must be an active starter on the pitch.", "error");
    return;
  }
  if (squadState.captainId === playerId) {
    showNotification("Player is already Captain.", "error");
    return;
  }
  squadState.viceCaptainId = playerId;
  saveState();
  renderApp();
}

// --- 8. HELPER UTILITIES ---

function getPlayerById(id) {
  return INITIAL_PLAYERS.find(p => p.id === id);
}

function calculateSquadValue() {
  return squadState.squad
    .reduce((total, id) => total + getPlayerById(id).price, 0)
    .toFixed(1);
}

// --- 9. UI RENDERING LOGIC ---

function renderPlayerCard(player, isStarter) {
  const isSelected = squadState.selectedPlayerId === player.id;
  const isCaptain = squadState.captainId === player.id;
  const isVice = squadState.viceCaptainId === player.id;

  const card = document.createElement("div");
  card.className = `player-card ${isSelected ? "selected" : ""} ${isStarter ? "starter" : "bench"}`;
  card.onclick = () => onPlayerClick(player.id);

  card.innerHTML = `
    <div class="card-header">
      <span class="player-pos pos-${player.pos.toLowerCase()}">${player.pos}</span>
      <span class="player-price">${player.price.toFixed(1)}m</span>
    </div>
    <div class="player-name">${player.name}</div>
    <div class="player-club">${player.club}</div>
    <div class="card-badges">
      ${isCaptain ? '<span class="badge captain">C</span>' : ""}
      ${isVice ? '<span class="badge vice">V</span>' : ""}
    </div>
    <div class="card-actions">
      ${isStarter ? `
        <button class="btn-role" onclick="event.stopPropagation(); setCaptain(${player.id})">C</button>
        <button class="btn-role" onclick="event.stopPropagation(); setViceCaptain(${player.id})">V</button>
      ` : ""}
      <button class="btn-sell" onclick="event.stopPropagation(); removePlayerFromSquad(${player.id})">Sell</button>
    </div>
  `;
  return card;
}

function renderPitch() {
  const pitchContainer = document.getElementById("pitch");
  if (!pitchContainer) return;
  pitchContainer.innerHTML = "";

  const starterObjs = squadState.starters.map(getPlayerById);

  const lines = {
    GK: starterObjs.filter(p => p.pos === "GK"),
    DEF: starterObjs.filter(p => p.pos === "DEF"),
    MID: starterObjs.filter(p => p.pos === "MID"),
    FWD: starterObjs.filter(p => p.pos === "FWD")
  };

  ["GK", "DEF", "MID", "FWD"].forEach(posGroup => {
    const row = document.createElement("div");
    row.className = `pitch-row ${posGroup.toLowerCase()}-row`;

    lines[posGroup].forEach(player => {
      row.appendChild(renderPlayerCard(player, true));
    });

    pitchContainer.appendChild(row);
  });
}

function renderBench() {
  const benchContainer = document.getElementById("bench");
  if (!benchContainer) return;
  benchContainer.innerHTML = "";

  squadState.bench.map(getPlayerById).forEach(player => {
    benchContainer.appendChild(renderPlayerCard(player, false));
  });
}

function renderMarket() {
  const marketContainer = document.getElementById("market-list");
  if (!marketContainer) return;
  marketContainer.innerHTML = "";

  INITIAL_PLAYERS.forEach(player => {
    const isOwned = squadState.squad.includes(player.id);
    const item = document.createElement("div");
    item.className = `market-item ${isOwned ? "owned" : ""}`;

    item.innerHTML = `
      <div class="market-info">
        <span class="player-pos pos-${player.pos.toLowerCase()}">${player.pos}</span>
        <strong>${player.name}</strong> (${player.club}) - ${player.price.toFixed(1)}m
      </div>
      <div class="market-action">
        ${
          isOwned
            ? `<button class="btn-action btn-sell" data-sell-id="${player.id}">Sell</button>`
            : `<button class="btn-action btn-buy" data-buy-id="${player.id}">Buy</button>`
        }
      </div>
    `;
    marketContainer.appendChild(item);
  });
}

function renderHeaderInfo() {
  const formationDisplay = document.getElementById("formation-display");
  const bankDisplay = document.getElementById("bank-display");
  const squadValDisplay = document.getElementById("squad-val-display");
  const squadCountDisplay = document.getElementById("squad-count-display");

  if (formationDisplay) formationDisplay.textContent = squadState.formation;
  if (bankDisplay) bankDisplay.textContent = `${squadState.bank.toFixed(1)}m`;
  if (squadValDisplay) squadValDisplay.textContent = `${calculateSquadValue()}m`;
  if (squadCountDisplay) squadCountDisplay.textContent = `${squadState.squad.length}/${RULES.MAX_SQUAD_SIZE}`;
}

function showNotification(msg, type = "info") {
  const toast = document.getElementById("toast-notification");
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.className = "toast";
  }, 3200);
}

function renderApp() {
  renderHeaderInfo();
  renderPitch();
  renderBench();
  renderMarket();
  attachEventListeners();
}

// --- 10. EVENT LISTENERS & INITIALIZATION ---

function attachEventListeners() {
  // Buy Player buttons
  document.querySelectorAll("[data-buy-id]").forEach(btn => {
    btn.onclick = e => {
      const id = parseInt(e.currentTarget.dataset.buyId, 10);
      addPlayerToSquad(id);
    };
  });

  // Sell Player buttons
  document.querySelectorAll("[data-sell-id]").forEach(btn => {
    btn.onclick = e => {
      const id = parseInt(e.currentTarget.dataset.sellId, 10);
      removePlayerFromSquad(id);
    };
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadState();

  // Initial calculation of formation on startup
  const starterObjs = squadState.starters.map(getPlayerById);
  if (starterObjs.length === 11) {
    squadState.formation = calculateFormation(starterObjs);
  }

  renderApp();
});
