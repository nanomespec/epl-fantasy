/* ==========================================================================
   ETHIOPIAN PREMIER LEAGUE FANTASY - COMPLETE & UNIFIED APP LOGIC
   ========================================================================== */

// --- 1. DATA CONSTANTS & REGISTERED PLAYERS (20 PLAYERS DATASET) ---
const INITIAL_PLAYERS = [
  {
    id: 1,
    name: "Abebe Tilahun",
    pos: "GK",
    club: "St. George",
    price: 5.0,
    points: 42,
    form: 4.5,
    goals: 0,
    assists: 0,
    cleanSheets: 5,
    yellowCards: 1,
    redCards: 0,
    selectedBy: "35.2%",
    nextFixture: "vs Bahir Dar (H)"
  },
  {
    id: 2,
    name: "Bahiru Negash",
    pos: "GK",
    club: "Ethiopia Bunna",
    price: 4.5,
    points: 38,
    form: 3.8,
    goals: 0,
    assists: 0,
    cleanSheets: 4,
    yellowCards: 0,
    redCards: 0,
    selectedBy: "22.1%",
    nextFixture: "vs Fasil Kenema (A)"
  },
  {
    id: 3,
    name: "Aschalew Tamene",
    pos: "DEF",
    club: "Fasil Kenema",
    price: 5.5,
    points: 58,
    form: 5.2,
    goals: 2,
    assists: 1,
    cleanSheets: 6,
    yellowCards: 2,
    redCards: 0,
    selectedBy: "48.5%",
    nextFixture: "vs Ethiopia Bunna (H)"
  },
  {
    id: 4,
    name: "Yared Bayeh",
    pos: "DEF",
    club: "Bahir Dar",
    price: 5.0,
    points: 45,
    form: 4.0,
    goals: 1,
    assists: 2,
    cleanSheets: 5,
    yellowCards: 3,
    redCards: 0,
    selectedBy: "18.9%",
    nextFixture: "vs St. George (A)"
  },
  {
    id: 5,
    name: "Suleman Hamid",
    pos: "DEF",
    club: "St. George",
    price: 5.0,
    points: 51,
    form: 4.8,
    goals: 1,
    assists: 4,
    cleanSheets: 5,
    yellowCards: 1,
    redCards: 0,
    selectedBy: "29.4%",
    nextFixture: "vs Bahir Dar (H)"
  },
  {
    id: 6,
    name: "Henok Gebre",
    pos: "DEF",
    club: "Ethiopia Bunna",
    price: 4.5,
    points: 36,
    form: 3.5,
    goals: 0,
    assists: 2,
    cleanSheets: 4,
    yellowCards: 2,
    redCards: 0,
    selectedBy: "12.0%",
    nextFixture: "vs Fasil Kenema (A)"
  },
  {
    id: 7,
    name: "Ramkel Lok",
    pos: "DEF",
    club: "EEPCO",
    price: 4.0,
    points: 28,
    form: 2.8,
    goals: 0,
    assists: 1,
    cleanSheets: 3,
    yellowCards: 4,
    redCards: 0,
    selectedBy: "8.3%",
    nextFixture: "vs Defense Force (H)"
  },
  {
    id: 8,
    name: "Gatoch Panom",
    pos: "MID",
    club: "St. George",
    price: 7.0,
    points: 68,
    form: 6.1,
    goals: 4,
    assists: 5,
    cleanSheets: 5,
    yellowCards: 3,
    redCards: 0,
    selectedBy: "52.1%",
    nextFixture: "vs Bahir Dar (H)"
  },
  {
    id: 9,
    name: "Surafel Dagnachew",
    pos: "MID",
    club: "Fasil Kenema",
    price: 7.5,
    points: 74,
    form: 6.8,
    goals: 6,
    assists: 6,
    cleanSheets: 6,
    yellowCards: 1,
    redCards: 0,
    selectedBy: "61.3%",
    nextFixture: "vs Ethiopia Bunna (H)"
  },
  {
    id: 10,
    name: "Amanuel Yohannes",
    pos: "MID",
    club: "Ethiopia Bunna",
    price: 6.5,
    points: 55,
    form: 5.0,
    goals: 3,
    assists: 4,
    cleanSheets: 4,
    yellowCards: 2,
    redCards: 0,
    selectedBy: "27.8%",
    nextFixture: "vs Fasil Kenema (A)"
  },
  {
    id: 11,
    name: "Canaan Markneh",
    pos: "MID",
    club: "Defense Force",
    price: 6.0,
    points: 49,
    form: 4.2,
    goals: 3,
    assists: 3,
    cleanSheets: 3,
    yellowCards: 1,
    redCards: 0,
    selectedBy: "15.4%",
    nextFixture: "vs EEPCO (A)"
  },
  {
    id: 12,
    name: "Biniyam Fikre",
    pos: "MID",
    club: "Sidama Bunna",
    price: 5.5,
    points: 41,
    form: 3.9,
    goals: 2,
    assists: 3,
    cleanSheets: 2,
    yellowCards: 0,
    redCards: 0,
    selectedBy: "9.1%",
    nextFixture: "vs Adama City (H)"
  },
  {
    id: 13,
    name: "Dawa Hotessa",
    pos: "MID",
    club: "Adama City",
    price: 6.0,
    points: 47,
    form: 4.4,
    goals: 4,
    assists: 2,
    cleanSheets: 2,
    yellowCards: 2,
    redCards: 0,
    selectedBy: "14.2%",
    nextFixture: "vs Sidama Bunna (A)"
  },
  {
    id: 14,
    name: "Getaneh Kebede",
    pos: "FWD",
    club: "Fasil Kenema",
    price: 8.5,
    points: 82,
    form: 7.2,
    goals: 10,
    assists: 3,
    cleanSheets: 6,
    yellowCards: 2,
    redCards: 0,
    selectedBy: "68.9%",
    nextFixture: "vs Ethiopia Bunna (H)"
  },
  {
    id: 15,
    name: "Abubeker Nassir",
    pos: "FWD",
    club: "Ethiopia Bunna",
    price: 9.0,
    points: 91,
    form: 8.1,
    goals: 12,
    assists: 4,
    cleanSheets: 4,
    yellowCards: 1,
    redCards: 0,
    selectedBy: "75.4%",
    nextFixture: "vs Fasil Kenema (A)"
  },
  {
    id: 16,
    name: "Chernet Gugsa",
    pos: "FWD",
    club: "St. George",
    price: 7.5,
    points: 62,
    form: 5.6,
    goals: 7,
    assists: 2,
    cleanSheets: 5,
    yellowCards: 0,
    redCards: 0,
    selectedBy: "31.0%",
    nextFixture: "vs Bahir Dar (H)"
  },
  {
    id: 17,
    name: "Mujib Kassim",
    pos: "FWD",
    club: "Hawassa City",
    price: 7.0,
    points: 54,
    form: 4.9,
    goals: 6,
    assists: 1,
    cleanSheets: 2,
    yellowCards: 3,
    redCards: 0,
    selectedBy: "19.5%",
    nextFixture: "vs EEPCO (H)"
  },
  {
    id: 18,
    name: "Fikru Teferra",
    pos: "FWD",
    club: "Sidama Bunna",
    price: 6.5,
    points: 44,
    form: 4.1,
    goals: 5,
    assists: 1,
    cleanSheets: 2,
    yellowCards: 2,
    redCards: 0,
    selectedBy: "11.3%",
    nextFixture: "vs Adama City (H)"
  },
  {
    id: 19,
    name: "Mesud Mohammed",
    pos: "MID",
    club: "Jimma Aba Jifar",
    price: 5.5,
    points: 39,
    form: 3.6,
    goals: 2,
    assists: 4,
    cleanSheets: 1,
    yellowCards: 1,
    redCards: 0,
    selectedBy: "6.7%",
    nextFixture: "vs Hawassa City (A)"
  },
  {
    id: 20,
    name: "Amanueal Gebremichael",
    pos: "FWD",
    club: "St. George",
    price: 8.0,
    points: 69,
    form: 5.8,
    goals: 8,
    assists: 3,
    cleanSheets: 5,
    yellowCards: 1,
    redCards: 0,
    selectedBy: "24.6%",
    nextFixture: "vs Bahir Dar (H)"
  }
];

// --- 2. GAME RULES & CONSTRAINTS ---
const RULES = {
  MAX_BUDGET: 100.0,
  MAX_SQUAD_SIZE: 15,
  MAX_PER_CLUB: 3,
  POS_LIMITS: { GK: 2, DEF: 5, MID: 5, FWD: 3 },
  FORMATION_RULES: {
    MIN_DEF: 3,
    MAX_DEF: 5,
    MIN_MID: 2,
    MAX_MID: 5,
    MIN_FWD: 1,
    MAX_FWD: 3
  }
};

// --- 3. GLOBAL SQUAD STATE ---
let squadState = {
  squad: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16],
  starters: [1, 3, 4, 5, 6, 8, 9, 10, 11, 14, 15], // 1 GK, 4 DEF, 4 MID, 2 FWD = 4-4-2
  bench: [2, 7, 12, 16], // 1 GK, 1 DEF, 1 MID, 1 FWD
  captainId: 15,
  viceCaptainId: 14,
  selectedPlayerId: null,
  bank: 12.0,
  formation: "4-4-2",
  transfersFree: 1,
  transfersCost: 0,
  filterPos: "ALL",
  searchQuery: "",
  sortBy: "points"
};

// --- 4. LOCAL STORAGE PERSISTENCE & RECOVERY ---
function saveState() {
  try {
    localStorage.setItem("epl_fantasy_squad_v2", JSON.stringify(squadState));
  } catch (e) {
    console.warn("Unable to save state to LocalStorage:", e);
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem("epl_fantasy_squad_v2");
    if (saved) {
      const parsed = JSON.parse(saved);
      squadState = { ...squadState, ...parsed };
    }
  } catch (e) {
    console.warn("Unable to load state from LocalStorage:", e);
  }
}

function resetSquadState() {
  squadState.squad = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16];
  squadState.starters = [1, 3, 4, 5, 6, 8, 9, 10, 11, 14, 15];
  squadState.bench = [2, 7, 12, 16];
  squadState.captainId = 15;
  squadState.viceCaptainId = 14;
  squadState.selectedPlayerId = null;
  squadState.bank = 12.0;
  squadState.formation = "4-4-2";
  saveState();
  renderApp();
  showNotification("Squad state reset to default configuration.", "info");
}

// --- 5. DYNAMIC FORMATION CALCULATOR & VALIDATION ENGINE ---

/**
 * Calculates formation string dynamically based on starters
 * @param {Array} startersList - Array of starter player objects
 * @returns {string} e.g. "4-4-2", "3-5-2", "4-3-3", "5-3-2", "4-5-1"
 */
function calculateFormation(startersList) {
  const defs = startersList.filter(p => p.pos === "DEF").length;
  const mids = startersList.filter(p => p.pos === "MID").length;
  const fwds = startersList.filter(p => p.pos === "FWD").length;
  return `${defs}-${mids}-${fwds}`;
}

/**
 * Validates whether a given 11-player lineup conforms to FPL formation rules
 * @param {Array} startersList - Array of starter player objects
 * @returns {Object} { valid: boolean, reason: string }
 */
function isValidFormation(startersList) {
  if (startersList.length !== 11) {
    return { valid: false, reason: "Lineup must contain exactly 11 starting players." };
  }

  const gks = startersList.filter(p => p.pos === "GK").length;
  const defs = startersList.filter(p => p.pos === "DEF").length;
  const mids = startersList.filter(p => p.pos === "MID").length;
  const fwds = startersList.filter(p => p.pos === "FWD").length;

  if (gks !== 1) {
    return { valid: false, reason: "You must have exactly 1 Goalkeeper on the pitch." };
  }
  if (defs < RULES.FORMATION_RULES.MIN_DEF || defs > RULES.FORMATION_RULES.MAX_DEF) {
    return {
      valid: false,
      reason: `Invalid Defender count (${defs}). Teams require 3 to 5 Defenders.`
    };
  }
  if (mids < RULES.FORMATION_RULES.MIN_MID || mids > RULES.FORMATION_RULES.MAX_MID) {
    return {
      valid: false,
      reason: `Invalid Midfielder count (${mids}). Teams require 2 to 5 Midfielders.`
    };
  }
  if (fwds < RULES.FORMATION_RULES.MIN_FWD || fwds > RULES.FORMATION_RULES.MAX_FWD) {
    return {
      valid: false,
      reason: `Invalid Forward count (${fwds}). Teams require 1 to 3 Forwards.`
    };
  }

  return { valid: true };
}

// --- 6. SUBSTITUTION & PLAYER SWAP SYSTEM ---

/**
 * Handles clicks and substitutions between pitch and bench players
 */
function handlePlayerSwap(player1Id, player2Id) {
  // Deselect if clicking the same player twice
  if (player1Id === player2Id) {
    squadState.selectedPlayerId = null;
    renderApp();
    return;
  }

  const isP1Starter = squadState.starters.includes(player1Id);
  const isP2Starter = squadState.starters.includes(player2Id);

  // Case A: Starter to Starter click (Switch selection to new starter)
  if (isP1Starter && isP2Starter) {
    squadState.selectedPlayerId = player2Id;
    renderApp();
    return;
  }

  // Case B: Bench to Bench swap (Re-order bench preference)
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
    showNotification("Bench order re-arranged.", "info");
    return;
  }

  // Case C: Substitution (1 Starter, 1 Bench)
  let trialStarters = [...squadState.starters];
  let trialBench = [...squadState.bench];

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

  // Execute trial swap
  const starterIdx = trialStarters.indexOf(starterId);
  const benchIdx = trialBench.indexOf(benchId);

  trialStarters[starterIdx] = benchId;
  trialBench[benchIdx] = starterId;

  // Validate trial formation
  const fullTrialStarterObjs = trialStarters.map(getPlayerById);
  const validation = isValidFormation(fullTrialStarterObjs);

  if (!validation.valid) {
    showNotification(validation.reason, "error");
    squadState.selectedPlayerId = null;
    renderApp();
    return;
  }

  // Commit valid substitution
  squadState.starters = trialStarters;
  squadState.bench = trialBench;
  squadState.selectedPlayerId = null;

  // DYNAMIC FORMATION UPDATE
  squadState.formation = calculateFormation(fullTrialStarterObjs);

  showNotification(`Subbed ${starterObj.name} out for ${benchObj.name}. Formation: ${squadState.formation}`, "success");
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

// --- 7. TRANSFERS ENGINE (BUY & SELL) ---

function addPlayerToSquad(playerId) {
  const player = getPlayerById(playerId);
  if (!player) return;

  if (squadState.squad.includes(playerId)) {
    showNotification(`${player.name} is already in your squad.`, "error");
    return;
  }

  if (squadState.squad.length >= RULES.MAX_SQUAD_SIZE) {
    showNotification("Squad limit reached (15 players max). Sell a player first.", "error");
    return;
  }

  if (squadState.bank < player.price) {
    showNotification(`Insufficient budget. You need ${player.price.toFixed(1)}m.`, "error");
    return;
  }

  const squadObjs = squadState.squad.map(getPlayerById);

  // Position limit check
  const countInPos = squadObjs.filter(p => p.pos === player.pos).length;
  if (countInPos >= RULES.POS_LIMITS[player.pos]) {
    showNotification(`Maximum ${RULES.POS_LIMITS[player.pos]} ${player.pos}s allowed.`, "error");
    return;
  }

  // Club limit check
  const countInClub = squadObjs.filter(p => p.club === player.club).length;
  if (countInClub >= RULES.MAX_PER_CLUB) {
    showNotification(`Maximum ${RULES.MAX_PER_CLUB} players allowed from ${player.club}.`, "error");
    return;
  }

  // Deduct cost and add to squad
  squadState.squad.push(playerId);
  squadState.bank = parseFloat((squadState.bank - player.price).toFixed(1));

  // Determine starting vs bench placement
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

  // Update formation
  const starterObjs = squadState.starters.map(getPlayerById);
  if (starterObjs.length === 11) {
    squadState.formation = calculateFormation(starterObjs);
  }

  showNotification(`Purchased ${player.name} for ${player.price.toFixed(1)}m.`, "success");
  saveState();
  renderApp();
}

function removePlayerFromSquad(playerId) {
  const player = getPlayerById(playerId);
  if (!player || !squadState.squad.includes(playerId)) return;

  // Remove from arrays
  squadState.squad = squadState.squad.filter(id => id !== playerId);
  squadState.starters = squadState.starters.filter(id => id !== playerId);
  squadState.bench = squadState.bench.filter(id => id !== playerId);

  // Refund money
  squadState.bank = parseFloat((squadState.bank + player.price).toFixed(1));

  // Reset roles if needed
  if (squadState.captainId === playerId) squadState.captainId = null;
  if (squadState.viceCaptainId === playerId) squadState.viceCaptainId = null;
  if (squadState.selectedPlayerId === playerId) squadState.selectedPlayerId = null;

  // Recalculate formation if remaining starters are full
  const starterObjs = squadState.starters.map(getPlayerById);
  if (starterObjs.length === 11) {
    squadState.formation = calculateFormation(starterObjs);
  }

  showNotification(`Sold ${player.name} for ${player.price.toFixed(1)}m.`, "info");
  saveState();
  renderApp();
}

// --- 8. CAPTAINCY CONTROLS ---

function setCaptain(playerId) {
  if (!squadState.starters.includes(playerId)) {
    showNotification("Captain must be an active starter in your main XI.", "error");
    return;
  }

  if (squadState.viceCaptainId === playerId) {
    squadState.viceCaptainId = squadState.captainId;
  }
  squadState.captainId = playerId;
  saveState();
  renderApp();
  showNotification(`${getPlayerById(playerId).name} is now Captain.`, "success");
}

function setViceCaptain(playerId) {
  if (!squadState.starters.includes(playerId)) {
    showNotification("Vice-Captain must be an active starter in your main XI.", "error");
    return;
  }
  if (squadState.captainId === playerId) {
    showNotification("Player is already Captain.", "error");
    return;
  }

  squadState.viceCaptainId = playerId;
  saveState();
  renderApp();
  showNotification(`${getPlayerById(playerId).name} is now Vice-Captain.`, "success");
}

// --- 9. HELPER UTILITIES ---

function getPlayerById(id) {
  return INITIAL_PLAYERS.find(p => p.id === id);
}

function calculateSquadValue() {
  return squadState.squad
    .reduce((total, id) => total + (getPlayerById(id)?.price || 0), 0)
    .toFixed(1);
}

function getFilteredMarketPlayers() {
  return INITIAL_PLAYERS.filter(player => {
    // Position Filter
    if (squadState.filterPos !== "ALL" && player.pos !== squadState.filterPos) {
      return false;
    }
    // Search Filter
    if (
      squadState.searchQuery &&
      !player.name.toLowerCase().includes(squadState.searchQuery.toLowerCase()) &&
      !player.club.toLowerCase().includes(squadState.searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (squadState.sortBy === "price") return b.price - a.price;
    if (squadState.sortBy === "form") return b.form - a.form;
    return b.points - a.points; // Default sort by points
  });
}

// --- 10. UI RENDERING ENGINES ---

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
    <div class="card-fixture">${player.nextFixture}</div>
    <div class="card-badges">
      ${isCaptain ? '<span class="badge captain" title="Captain (2x Points)">C</span>' : ""}
      ${isVice ? '<span class="badge vice" title="Vice-Captain">V</span>' : ""}
    </div>
    <div class="card-actions">
      ${
        isStarter
          ? `
        <button class="btn-role btn-c" title="Set Captain" onclick="event.stopPropagation(); setCaptain(${player.id})">C</button>
        <button class="btn-role btn-v" title="Set Vice-Captain" onclick="event.stopPropagation(); setViceCaptain(${player.id})">V</button>
      `
          : ""
      }
      <button class="btn-sell" title="Sell Player" onclick="event.stopPropagation(); removePlayerFromSquad(${player.id})">Sell</button>
    </div>
  `;
  return card;
}

function renderPitch() {
  const pitchContainer = document.getElementById("pitch");
  if (!pitchContainer) return;
  pitchContainer.innerHTML = "";

  const starterObjs = squadState.starters.map(getPlayerById).filter(Boolean);

  // Group starters by line
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

  squadState.bench
    .map(getPlayerById)
    .filter(Boolean)
    .forEach(player => {
      benchContainer.appendChild(renderPlayerCard(player, false));
    });
}

function renderMarket() {
  const marketContainer = document.getElementById("market-list");
  if (!marketContainer) return;
  marketContainer.innerHTML = "";

  const marketPlayers = getFilteredMarketPlayers();

  if (marketPlayers.length === 0) {
    marketContainer.innerHTML = `<div class="empty-market">No players match your current filter criteria.</div>`;
    return;
  }

  marketPlayers.forEach(player => {
    const isOwned = squadState.squad.includes(player.id);
    const item = document.createElement("div");
    item.className = `market-item ${isOwned ? "owned" : ""}`;

    item.innerHTML = `
      <div class="market-info" onclick="openPlayerModal(${player.id})">
        <span class="player-pos pos-${player.pos.toLowerCase()}">${player.pos}</span>
        <div class="market-details">
          <strong class="market-name">${player.name}</strong>
          <span class="market-subtext">${player.club} • Pts: ${player.points} • Form: ${player.form}</span>
        </div>
      </div>
      <div class="market-price-action">
        <span class="market-price">${player.price.toFixed(1)}m</span>
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

// --- 11. PLAYER MODAL DETAILS ENGINE ---

function openPlayerModal(playerId) {
  const player = getPlayerById(playerId);
  if (!player) return;

  const modal = document.getElementById("player-modal");
  const modalBody = document.getElementById("modal-body");
  if (!modal || !modalBody) return;

  modalBody.innerHTML = `
    <div class="modal-header-info">
      <h2>${player.name}</h2>
      <p>${player.club} | <span class="pos-${player.pos.toLowerCase()}">${player.pos}</span></p>
    </div>
    <div class="modal-stats-grid">
      <div class="stat-box"><span>Price</span><strong>${player.price.toFixed(1)}m</strong></div>
      <div class="stat-box"><span>Total Points</span><strong>${player.points}</strong></div>
      <div class="stat-box"><span>Form</span><strong>${player.form}</strong></div>
      <div class="stat-box"><span>Goals</span><strong>${player.goals}</strong></div>
      <div class="stat-box"><span>Assists</span><strong>${player.assists}</strong></div>
      <div class="stat-box"><span>Clean Sheets</span><strong>${player.cleanSheets}</strong></div>
      <div class="stat-box"><span>Yellow Cards</span><strong>${player.yellowCards}</strong></div>
      <div class="stat-box"><span>Selected By</span><strong>${player.selectedBy}</strong></div>
    </div>
    <div class="modal-fixture-next">
      <strong>Next Fixture:</strong> ${player.nextFixture}
    </div>
  `;
  modal.classList.add("open");
}

function closePlayerModal() {
  const modal = document.getElementById("player-modal");
  if (modal) modal.classList.remove("open");
}

// --- 12. FILTER & SORT EVENT CONTROLLERS ---

function setupFilterControls() {
  const filterBtns = document.querySelectorAll("[data-filter-pos]");
  filterBtns.forEach(btn => {
    btn.onclick = e => {
      filterBtns.forEach(b => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      squadState.filterPos = e.currentTarget.dataset.filterPos;
      renderMarket();
    };
  });

  const searchInput = document.getElementById("market-search");
  if (searchInput) {
    searchInput.oninput = e => {
      squadState.searchQuery = e.target.value;
      renderMarket();
    };
  }

  const sortSelect = document.getElementById("market-sort");
  if (sortSelect) {
    sortSelect.onchange = e => {
      squadState.sortBy = e.target.value;
      renderMarket();
    };
  }
}

// --- 13. MASTER RENDER & EVENT ATTACHMENT ---

function renderApp() {
  renderHeaderInfo();
  renderPitch();
  renderBench();
  renderMarket();
  attachEventListeners();
}

function attachEventListeners() {
  // Market Buy Buttons
  document.querySelectorAll("[data-buy-id]").forEach(btn => {
    btn.onclick = e => {
      const id = parseInt(e.currentTarget.dataset.buyId, 10);
      addPlayerToSquad(id);
    };
  });

  // Market Sell Buttons
  document.querySelectorAll("[data-sell-id]").forEach(btn => {
    btn.onclick = e => {
      const id = parseInt(e.currentTarget.dataset.sellId, 10);
      removePlayerFromSquad(id);
    };
  });

  // Reset Squad Button
  const resetBtn = document.getElementById("btn-reset-squad");
  if (resetBtn) {
    resetBtn.onclick = resetSquadState;
  }

  // Close Modal Button
  const closeModalBtn = document.getElementById("btn-close-modal");
  if (closeModalBtn) {
    closeModalBtn.onclick = closePlayerModal;
  }
}

// --- 14. APPLICATION INITIALIZATION ---

document.addEventListener("DOMContentLoaded", () => {
  loadState();

  // Initial calculation of formation on startup
  const starterObjs = squadState.starters.map(getPlayerById).filter(Boolean);
  if (starterObjs.length === 11) {
    squadState.formation = calculateFormation(starterObjs);
  }

  setupFilterControls();
  renderApp();
});
