// Ethiopian Premier League Player Dataset
const players = [
    // Goalkeepers
    { id: 1, name: "Lealem Birhanu", team: "Saint George SC", pos: "GK", price: 5.5, points: 0 },
    { id: 2, name: "Yidnekachew Ali", team: "Sidama Bunna", pos: "GK", price: 5.0, points: 0 },
    { id: 3, name: "Mintesinot Allo", team: "Defense Force SC", pos: "GK", price: 5.5, points: 0 },

    // Defenders
    { id: 4, name: "Aschalew Tamene", team: "Ethiopian Coffee SC", pos: "DEF", price: 6.5, points: 0 },
    { id: 5, name: "Firew Solomon", team: "Defense Force SC", pos: "DEF", price: 6.0, points: 0 },
    { id: 6, name: "Suleman Hamid", team: "Saint George SC", pos: "DEF", price: 6.0, points: 0 },
    { id: 7, name: "Fetudin Jamal", team: "Bahir Dar Kenema", pos: "DEF", price: 5.5, points: 0 },
    { id: 8, name: "Desta Yohannes", team: "Fasil Kenema", pos: "DEF", price: 5.5, points: 0 },
    { id: 9, name: "Abebe Tilahun", team: "Sidama Bunna", pos: "DEF", price: 5.0, points: 0 },

    // Midfielders
    { id: 10, name: "Chernet Gugsa", team: "Saint George SC", pos: "MID", price: 8.5, points: 0 },
    { id: 11, name: "Wogene Gezahegn", team: "Ethiopian Coffee SC", pos: "MID", price: 7.5, points: 0 },
    { id: 12, name: "Surafel Dagnachew", team: "Fasil Kenema", pos: "MID", price: 9.0, points: 0 },
    { id: 13, name: "Fereb Zewdu", team: "Bahir Dar Kenema", pos: "MID", price: 7.0, points: 0 },
    { id: 14, name: "Amanuel Yohannes", team: "Ethiopian Coffee SC", pos: "MID", price: 8.0, points: 0 },
    { id: 15, name: "Gatoch Panom", team: "Saint George SC", pos: "MID", price: 8.0, points: 0 },

    // Forwards
    { id: 16, name: "Abubeker Nasir", team: "Ethiopian Coffee SC", pos: "FWD", price: 9.5, points: 0 },
    { id: 17, name: "Ramkel Lok", team: "Saint George SC", pos: "FWD", price: 9.0, points: 0 },
    { id: 18, name: "Safee Assefa", team: "Sidama Bunna", pos: "FWD", price: 8.0, points: 0 },
    { id: 19, name: "Oumed Oukri", team: "Fasil Kenema", pos: "FWD", price: 8.0, points: 0 },
    { id: 20, name: "Ali Sulieman", team: "Bahir Dar Kenema", pos: "FWD", price: 8.5, points: 0 }
];

// User Manager State
let userState = {
    squad: [],          // Up to 15 players
    startingIds: [],    // Exactly 11 player IDs
    benchIds: [],       // Exactly 4 player IDs
    captainId: null,
    viceCaptainId: null,
    budget: 100.0,
    freeTransfers: 1,
    transfersMade: 0,
    totalPoints: 0,
    lastGWPoints: 0,
    activeChip: null,   // "wildcard", "freehit", "benchboost", "triplecaptain"
    usedChips: { wildcard: false, freehit: false, benchboost: false, triplecaptain: false }
};

// Global Leaderboard Mock Data
let leaderboard = [
    { rank: 1, name: "Addis Ababa Warriors", gw: 0, total: 120 },
    { rank: 2, name: "Bunna Kings", gw: 0, total: 112 },
    { rank: 3, name: "Sheger United", gw: 0, total: 105 }
];

// Initialize Engine
document.addEventListener("DOMContentLoaded", () => {
    renderMarket(players);
    setupEventListeners();
    renderSquadView();
    renderLeaderboard();
});

// Tab Switcher
function switchTab(tabId, evt) {
    document.querySelectorAll(".view-section").forEach(sec => sec.style.display = "none");
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    
    document.getElementById(`${tabId}-section`).style.display = "block";
    if (evt) evt.currentTarget.classList.add("active");
}

// Render Transfer Market
function renderMarket(data) {
    const body = document.getElementById("player-market-body");
    body.innerHTML = "";
    data.forEach(p => {
        const inSquad = userState.squad.some(s => s.id === p.id);
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><strong>${p.name}</strong></td>
            <td>${p.team}</td>
            <td><span class="badge ${p.pos}">${p.pos}</span></td>
            <td>${p.price.toFixed(1)}M ETB</td>
            <td>
                ${inSquad 
                    ? `<button class="remove-btn" onclick="removePlayer(${p.id})">Remove</button>` 
                    : `<button class="add-btn" onclick="addPlayer(${p.id})">Add</button>`
                }
            </td>
        `;
        body.appendChild(row);
    });
}

// Add Player to 15-Man Squad
function addPlayer(id) {
    const p = players.find(x => x.id === id);
    if (!p) return;

    if (userState.squad.length >= 15) return alert("Squad full (15/15)!");
    if (userState.budget < p.price) return alert("Insufficient budget!");
    
    const clubCount = userState.squad.filter(x => x.team === p.team).length;
    if (clubCount >= 3) return alert(`Max 3 players from ${p.team}!`);

    userState.squad.push(p);
    userState.budget -= p.price;
    userState.transfersMade++;

    // Assign to Starting XI if space allows, otherwise Bench
    if (userState.startingIds.length < 11) {
        userState.startingIds.push(p.id);
    } else {
        userState.benchIds.push(p.id);
    }

    // Default C / VC if unassigned
    if (!userState.captainId) userState.captainId = p.id;
    else if (!userState.viceCaptainId) userState.viceCaptainId = p.id;

    updateUI();
}

// Remove Player
function removePlayer(id) {
    const p = userState.squad.find(x => x.id === id);
    if (!p) return;

    userState.squad = userState.squad.filter(x => x.id !== id);
    userState.startingIds = userState.startingIds.filter(x => x !== id);
    userState.benchIds = userState.benchIds.filter(x => x !== id);
    userState.budget += p.price;

    if (userState.captainId === id) userState.captainId = userState.startingIds[0] || null;
    if (userState.viceCaptainId === id) userState.viceCaptainId = userState.startingIds[1] || null;

    updateUI();
}

// Swap Player between Starting XI and Bench
function swapSlot(id) {
    if (userState.startingIds.includes(id)) {
        if (userState.startingIds.length <= 11) {
            const benchTarget = userState.benchIds[0];
            if (!benchTarget) return alert("Need a benched player to swap with!");
            
            // Swap array entries
            userState.startingIds = userState.startingIds.filter(x => x !== id);
            userState.benchIds = userState.benchIds.filter(x => x !== benchTarget);
            userState.startingIds.push(benchTarget);
            userState.benchIds.push(id);
        }
    } else {
        const startTarget = userState.startingIds[0];
        userState.benchIds = userState.benchIds.filter(x => x !== id);
        userState.startingIds = userState.startingIds.filter(x => x !== startTarget);
        userState.benchIds.push(startTarget);
        userState.startingIds.push(id);
    }
    updateUI();
}

// Set Captain / Vice-Captain
function setCaptain(id) {
    if (userState.viceCaptainId === id) userState.viceCaptainId = userState.captainId;
    userState.captainId = id;
    updateUI();
}

function setViceCaptain(id) {
    if (userState.captainId === id) return alert("Player is already Captain!");
    userState.viceCaptainId = id;
    updateUI();
}

// Chips Logic
function toggleChip(chipName) {
    if (userState.usedChips[chipName]) return alert(`${chipName} chip has already been used!`);
    
    if (userState.activeChip === chipName) {
        userState.activeChip = null;
    } else {
        userState.activeChip = chipName;
    }
    updateUI();
}

// Render Starting XI Pitch and Bench
function renderSquadView() {
    const positions = ['GK', 'DEF', 'MID', 'FWD'];
    
    // Clear Pitch Rows
    positions.forEach(pos => {
        const row = document.getElementById(`pitch-${pos}`);
        if (row) row.innerHTML = "";
    });

    // Populate Starting XI
    userState.startingIds.forEach(id => {
        const p = userState.squad.find(x => x.id === id);
        if (!p) return;

        const row = document.getElementById(`pitch-${p.pos}`);
        if (row) {
            const isC = userState.captainId === p.id;
            const isVC = userState.viceCaptainId === p.id;

            const card = document.createElement("div");
            card.className = "player-slot";
            card.innerHTML = `
                <div class="pitch-player-name">${p.name.split(" ").pop()}</div>
                <div class="pitch-player-meta">${p.price.toFixed(1)}M | ${p.team.substring(0, 3).toUpperCase()}</div>
                <div class="card-actions">
                    <button class="badge-btn ${isC ? 'active-c' : ''}" onclick="setCaptain(${p.id})">C</button>
                    <button class="badge-btn ${isVC ? 'active-vc' : ''}" onclick="setViceCaptain(${p.id})">VC</button>
                    <button class="swap-btn" onclick="swapSlot(${p.id})">⇄</button>
                </div>
            `;
            row.appendChild(card);
        }
    });

    // Populate Bench
    const benchRow = document.getElementById("bench-row");
    benchRow.innerHTML = "";
    
    if (userState.benchIds.length === 0) {
        benchRow.innerHTML = `<div class="player-slot placeholder">Bench Empty</div>`;
    } else {
        userState.benchIds.forEach((id, index) => {
            const p = userState.squad.find(x => x.id === id);
            if (!p) return;

            const card = document.createElement("div");
            card.className = "player-slot";
            card.innerHTML = `
                <div style="font-size: 0.65rem; color: #888;">SUB ${index + 1}</div>
                <div class="pitch-player-name">${p.name.split(" ").pop()}</div>
                <div class="pitch-player-meta">${p.pos} | ${p.price.toFixed(1)}M</div>
                <div class="card-actions">
                    <button class="swap-btn" onclick="swapSlot(${p.id})">⇄ Sub In</button>
                </div>
            `;
            benchRow.appendChild(card);
        });
    }
}

// Gameweek Simulation Engine
function simulateGameweek() {
    if (userState.squad.length < 15) {
        return alert("Complete your 15-man squad before simulating the Gameweek!");
    }

    let gwScore = 0;
    let playedMinutes = {};

    // 1. Simulate real-world performance for all 15 players
    userState.squad.forEach(p => {
        const mins = Math.random() > 0.15 ? Math.floor(Math.random() * 30) + 65 : 0; // 15% chance player is rested/injured
        playedMinutes[p.id] = mins;

        let pPoints = 0;
        if (mins > 0) {
            pPoints += mins >= 60 ? 2 : 1;
            
            // Random Goals / Assists / Clean Sheets
            const goals = Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 1 : 0;
            const assists = Math.random() > 0.75 ? 1 : 0;
            
            if (p.pos === 'FWD') pPoints += goals * 4;
            if (p.pos === 'MID') pPoints += goals * 5 + assists * 3;
            if (p.pos === 'DEF') pPoints += goals * 6 + assists * 3;
            if (p.pos === 'GK') pPoints += goals * 6;

            // Clean Sheet bonus
            if ((p.pos === 'DEF' || p.pos === 'GK') && Math.random() > 0.5) pPoints += 4;
        }
        p.lastGW = pPoints;
    });

    // 2. Handle Auto-Substitutions if Starting XI players scored 0 mins
    let activeStarters = [...userState.startingIds];
    let activeBench = [...userState.benchIds];

    activeStarters.forEach((id, idx) => {
        if (playedMinutes[id] === 0 && activeBench.length > 0) {
            const subId = activeBench.shift();
            activeStarters[idx] = subId;
        }
    });

    // 3. Score Calculation with Captaincy Multipliers & Chips
    let mult = userState.activeChip === 'triplecaptain' ? 3 : 2;
    
    activeStarters.forEach(id => {
        const p = userState.squad.find(x => x.id === id);
        let pts = p.lastGW;

        // Captain / Vice-Captain logic
        if (id === userState.captainId && playedMinutes[id] > 0) {
            pts *= mult;
        } else if (id === userState.captainId && playedMinutes[id] === 0 && userState.viceCaptainId) {
            if (id === userState.viceCaptainId) pts *= mult;
        }

        gwScore += pts;
    });

    // Bench Boost Chip
    if (userState.activeChip === 'benchboost') {
        activeBench.forEach(id => {
            const p = userState.squad.find(x => x.id === id);
            gwScore += p.lastGW;
        });
    }

    // 4. Deduct Transfer Hits (-4 pts per extra transfer, unless Wildcard or Free Hit active)
    let hits = 0;
    if (userState.activeChip !== 'wildcard' && userState.activeChip !== 'freehit') {
        if (userState.transfersMade > userState.freeTransfers) {
            hits = (userState.transfersMade - userState.freeTransfers) * 4;
            gwScore -= hits;
        }
    }

    // Mark chip as used
    if (userState.activeChip) {
        userState.usedChips[userState.activeChip] = true;
        userState.activeChip = null;
    }

    // Reset transfers for next GW
    userState.transfersMade = 0;
    userState.lastGWPoints = gwScore;
    userState.totalPoints += gwScore;

    // Update Global Leaderboard
    leaderboard.push({ rank: 0, name: "Your Team", gw: gwScore, total: userState.totalPoints });
    leaderboard.sort((a, b) => b.total - a.total);
    leaderboard.forEach((item, index) => item.rank = index + 1);

    renderLeaderboard();
    updateUI();

    alert(`Gameweek Complete!\nYour Score: ${gwScore} pts (Transfer Hits: -${hits} pts)`);
}

// UI State Synchronization
function updateUI() {
    document.getElementById("budget-val").innerText = userState.budget.toFixed(1);
    document.getElementById("transfers-val").innerText = userState.freeTransfers;
    
    let hits = 0;
    if (userState.transfersMade > userState.freeTransfers && !['wildcard', 'freehit'].includes(userState.activeChip)) {
        hits = (userState.transfersMade - userState.freeTransfers) * 4;
    }
    document.getElementById("hits-val").innerText = hits;
    document.getElementById("points-val").innerText = userState.totalPoints;

    // Chips Styling
    ['wildcard', 'freehit', 'benchboost', 'triplecaptain'].forEach(chip => {
        const btn = document.getElementById(`chip-${chip}`);
        if (!btn) return;
        btn.classList.remove('active', 'used');
        if (userState.usedChips[chip]) btn.classList.add('used');
        else if (userState.activeChip === chip) btn.classList.add('active');
    });

    renderMarket(players);
    renderSquadView();
}

// Render Leaderboard Table
function renderLeaderboard() {
    const body = document.getElementById("leaderboard-body");
    if (!body) return;
    body.innerHTML = "";

    leaderboard.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>#${row.rank}</strong></td>
            <td>${row.name}</td>
            <td>${row.gw}</td>
            <td><strong>${row.total}</strong></td>
        `;
        body.appendChild(tr);
    });
}

// Search and Filter Listeners
function setupEventListeners() {
    const searchBar = document.getElementById("search-bar");
    const posFilter = document.getElementById("pos-filter");

    const filterHandler = () => {
        const query = searchBar.value.toLowerCase();
        const selectedPos = posFilter.value;

        const filtered = players.filter(p => {
            const matchesQuery = p.name.toLowerCase().includes(query) || p.team.toLowerCase().includes(query);
            const matchesPos = selectedPos === "ALL" || p.pos === selectedPos;
            return matchesQuery && matchesPos;
        });

        renderMarket(filtered);
    };

    if (searchBar) searchBar.addEventListener("input", filterHandler);
    if (posFilter) posFilter.addEventListener("change", filterHandler);
}
