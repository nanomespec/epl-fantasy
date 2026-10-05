// Ethiopian Premier League Full Dataset
const initialPlayers = [
    // Goalkeepers
    { id: 1, name: "Lealem Birhanu", team: "Saint George SC", pos: "GK", price: 5.5, buyPrice: 5.5, selectedPct: 42.1, points: 0, lastGW: 0 },
    { id: 2, name: "Yidnekachew Ali", team: "Sidama Coffee SC", pos: "GK", price: 5.0, buyPrice: 5.0, selectedPct: 18.3, points: 0, lastGW: 0 },
    { id: 3, name: "Mintesinot Allo", team: "Defense Force SC", pos: "GK", price: 5.5, buyPrice: 5.5, selectedPct: 24.5, points: 0, lastGW: 0 },

    // Defenders
    { id: 4, name: "Aschalew Tamene", team: "Ethiopian Coffee SC", pos: "DEF", price: 6.5, buyPrice: 6.5, selectedPct: 58.0, points: 0, lastGW: 0 },
    { id: 5, name: "Firew Solomon", team: "Defense Force SC", pos: "DEF", price: 6.0, buyPrice: 6.0, selectedPct: 31.2, points: 0, lastGW: 0 },
    { id: 6, name: "Suleman Hamid", team: "Saint George SC", pos: "DEF", price: 6.0, buyPrice: 6.0, selectedPct: 29.8, points: 0, lastGW: 0 },
    { id: 7, name: "Fetudin Jamal", team: "Bahir Dar Kenema", pos: "DEF", price: 5.5, buyPrice: 5.5, selectedPct: 14.2, points: 0, lastGW: 0 },
    { id: 8, name: "Desta Yohannes", team: "Fasil Kenema SC", pos: "DEF", price: 5.5, buyPrice: 5.5, selectedPct: 19.5, points: 0, lastGW: 0 },
    { id: 9, name: "Abebe Tilahun", team: "Sidama Coffee SC", pos: "DEF", price: 5.0, buyPrice: 5.0, selectedPct: 12.1, points: 0, lastGW: 0 },

    // Midfielders
    { id: 10, name: "Chernet Gugsa", team: "Saint George SC", pos: "MID", price: 8.5, buyPrice: 8.5, selectedPct: 45.6, points: 0, lastGW: 0 },
    { id: 11, name: "Wogene Gezahegn", team: "Ethiopian Coffee SC", pos: "MID", price: 7.5, buyPrice: 7.5, selectedPct: 22.4, points: 0, lastGW: 0 },
    { id: 12, name: "Surafel Dagnachew", team: "Fasil Kenema SC", pos: "MID", price: 9.0, buyPrice: 9.0, selectedPct: 51.0, points: 0, lastGW: 0 },
    { id: 13, name: "Fereb Zewdu", team: "Bahir Dar Kenema", pos: "MID", price: 7.0, buyPrice: 7.0, selectedPct: 16.8, points: 0, lastGW: 0 },
    { id: 14, name: "Amanuel Yohannes", team: "Ethiopian Coffee SC", pos: "MID", price: 8.0, buyPrice: 8.0, selectedPct: 38.9, points: 0, lastGW: 0 },
    { id: 15, name: "Gatoch Panom", team: "Saint George SC", pos: "MID", price: 8.0, buyPrice: 8.0, selectedPct: 27.5, points: 0, lastGW: 0 },

    // Forwards
    { id: 16, name: "Abubeker Nasir", team: "Ethiopian Coffee SC", pos: "FWD", price: 9.5, buyPrice: 9.5, selectedPct: 68.4, points: 0, lastGW: 0 },
    { id: 17, name: "Ramkel Lok", team: "Saint George SC", pos: "FWD", price: 9.0, buyPrice: 9.0, selectedPct: 41.2, points: 0, lastGW: 0 },
    { id: 18, name: "Safee Assefa", team: "Sidama Coffee SC", pos: "FWD", price: 8.0, buyPrice: 8.0, selectedPct: 20.1, points: 0, lastGW: 0 },
    { id: 19, name: "Oumed Oukri", team: "Fasil Kenema SC", pos: "FWD", price: 8.0, buyPrice: 8.0, selectedPct: 25.3, points: 0, lastGW: 0 },
    { id: 20, name: "Ali Sulieman", team: "Bahir Dar Kenema", pos: "FWD", price: 8.5, buyPrice: 8.5, selectedPct: 18.9, points: 0, lastGW: 0 }
];

// Official Fixtures Schedule & FDR Ratings
const fixtures = [
    { home: "Saint George SC", away: "Negele Arsi", fdrHome: 2, fdrAway: 5, date: "Gameweek 1" },
    { home: "Ethiopian Coffee SC", away: "Sheger Ketema", fdrHome: 2, fdrAway: 4, date: "Gameweek 1" },
    { home: "Wolaitta Dicha SC", away: "Fasil Kenema SC", fdrHome: 4, fdrAway: 3, date: "Gameweek 1" },
    { home: "Defense Force SC", away: "Bahir Dar Kenema", fdrHome: 3, fdrAway: 3, date: "Gameweek 1" },
    { home: "Sidama Coffee SC", away: "CBE SA", fdrHome: 3, fdrAway: 3, date: "Gameweek 1" }
];

// State Initialization with LocalStorage Persistence
let players = JSON.parse(localStorage.getItem("epl_players")) || initialPlayers;
let userState = JSON.parse(localStorage.getItem("epl_userState")) || {
    squad: [],
    startingIds: [],
    benchIds: [],
    captainId: null,
    viceCaptainId: null,
    budget: 100.0,
    freeTransfers: 1,
    transfersMade: 0,
    totalPoints: 0,
    lastGWPoints: 0,
    activeChip: null,
    usedChips: { wildcard: false, freehit: false, benchboost: false, triplecaptain: false }
};

let leaderboard = JSON.parse(localStorage.getItem("epl_leaderboard")) || [
    { rank: 1, name: "Addis Ababa Warriors", gw: 0, total: 120 },
    { rank: 2, name: "Bunna Kings", gw: 0, total: 112 },
    { rank: 3, name: "Sheger United", gw: 0, total: 105 }
];

let adminStatsOverride = {};

document.addEventListener("DOMContentLoaded", () => {
    updateUI();
    renderFixtures();
    renderLeaderboard();
    populateAdminDropdown();
});

function saveState() {
    localStorage.setItem("epl_players", JSON.stringify(players));
    localStorage.setItem("epl_userState", JSON.stringify(userState));
    localStorage.setItem("epl_leaderboard", JSON.stringify(leaderboard));
}

// 50% Profit Tax Selling Price Calculation
function getSellingPrice(player) {
    if (player.price > player.buyPrice) {
        const profit = player.price - player.buyPrice;
        return player.buyPrice + Math.floor((profit / 2) * 10) / 10;
    }
    return player.price;
}

// Strict 15-Man Positional Quota Verification
function checkPositionalQuota(pos) {
    const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    userState.squad.forEach(p => counts[p.pos]++);
    
    const limits = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
    return counts[pos] < limits[pos];
}

// Add Player Logic
function addPlayer(id) {
    const p = players.find(x => x.id === id);
    if (!p) return;

    if (userState.squad.length >= 15) return alert("Squad capacity full (15/15)!");
    if (userState.budget < p.price) return alert("Insufficient budget!");
    
    if (!checkPositionalQuota(p.pos)) {
        return alert(`Positional quota reached! Maximum allowed for ${p.pos} exceeded.`);
    }

    const clubCount = userState.squad.filter(x => x.team === p.team).length;
    if (clubCount >= 3) return alert(`Rule violation: Maximum 3 players from ${p.team}!`);

    p.buyPrice = p.price;
    userState.squad.push(p);
    userState.budget -= p.price;
    userState.transfersMade++;

    if (userState.startingIds.length < 11) userState.startingIds.push(p.id);
    else userState.benchIds.push(p.id);

    if (!userState.captainId) userState.captainId = p.id;
    else if (!userState.viceCaptainId) userState.viceCaptainId = p.id;

    saveState();
    updateUI();
}

// Remove Player Logic
function removePlayer(id) {
    const p = userState.squad.find(x => x.id === id);
    if (!p) return;

    const sellPrice = getSellingPrice(p);
    userState.squad = userState.squad.filter(x => x.id !== id);
    userState.startingIds = userState.startingIds.filter(x => x !== id);
    userState.benchIds = userState.benchIds.filter(x => x !== id);
    userState.budget += sellPrice;

    if (userState.captainId === id) userState.captainId = userState.startingIds[0] || null;
    if (userState.viceCaptainId === id) userState.viceCaptainId = userState.startingIds[1] || null;

    saveState();
    updateUI();
}

// Strict Pitch Formation Validator (1 GK, >=3 DEF, >=2 MID, >=1 FWD)
function validateFormation(testStartingIds) {
    const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    testStartingIds.forEach(id => {
        const p = userState.squad.find(x => x.id === id);
        if (p) counts[p.pos]++;
    });

    if (counts.GK !== 1) return { valid: false, msg: "Starting XI must have exactly 1 Goalkeeper!" };
    if (counts.DEF < 3) return { valid: false, msg: "Starting XI must have at least 3 Defenders!" };
    if (counts.MID < 2) return { valid: false, msg: "Starting XI must have at least 2 Midfielders!" };
    if (counts.FWD < 1) return { valid: false, msg: "Starting XI must have at least 1 Forward!" };

    return { valid: true, formation: `${counts.DEF}-${counts.MID}-${counts.FWD}` };
}

// Swap Player between Pitch and Bench
function swapSlot(id) {
    let testStarters = [...userState.startingIds];
    let testBench = [...userState.benchIds];

    if (testStarters.includes(id)) {
        const targetBenchId = testBench[0];
        if (!targetBenchId) return alert("Bench is empty!");

        testStarters = testStarters.filter(x => x !== id);
        testBench = testBench.filter(x => x !== targetBenchId);
        testStarters.push(targetBenchId);
        testBench.push(id);
    } else {
        const targetStarterId = testStarters[0];
        testBench = testBench.filter(x => x !== id);
        testStarters = testStarters.filter(x => x !== targetStarterId);
        testBench.push(targetStarterId);
        testStarters.push(id);
    }

    const check = validateFormation(testStarters);
    if (!check.valid && testStarters.length === 11) return alert(check.msg);

    userState.startingIds = testStarters;
    userState.benchIds = testBench;
    saveState();
    updateUI();
}

// Render Squad Pitch & Bench
function renderSquadView() {
    const positions = ['GK', 'DEF', 'MID', 'FWD'];
    positions.forEach(pos => {
        const row = document.getElementById(`pitch-${pos}`);
        if (row) row.innerHTML = "";
    });

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
                <div class="pitch-player-name" onclick="openPlayerModal(${p.id})">${p.name.split(" ").pop()}</div>
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

    const benchRow = document.getElementById("bench-row");
    benchRow.innerHTML = "";
    userState.benchIds.forEach((id, idx) => {
        const p = userState.squad.find(x => x.id === id);
        if (!p) return;

        const card = document.createElement("div");
        card.className = "player-slot";
        card.innerHTML = `
            <div style="font-size: 0.65rem; color: #888;">SUB ${idx + 1}</div>
            <div class="pitch-player-name" onclick="openPlayerModal(${p.id})">${p.name.split(" ").pop()}</div>
            <div class="pitch-player-meta">${p.pos} | ${p.price.toFixed(1)}M</div>
            <div class="card-actions">
                <button class="swap-btn" onclick="swapSlot(${p.id})">⇄ Sub In</button>
            </div>
        `;
        benchRow.appendChild(card);
    });

    const fCheck = validateFormation(userState.startingIds);
    if (fCheck.valid) {
        document.getElementById("formation-display").innerText = `Current Formation: ${fCheck.formation}`;
    }
}

// Player Modal Trigger
function openPlayerModal(id) {
    const p = players.find(x => x.id === id);
    if (!p) return;

    const modal = document.getElementById("player-modal");
    const content = document.getElementById("modal-content");

    content.innerHTML = `
        <h2>${p.name}</h2>
        <p><strong>Club:</strong> ${p.team} | <strong>Position:</strong> ${p.pos}</p>
        <hr style="border-color: #333;">
        <p><strong>Current Market Price:</strong> ${p.price.toFixed(1)}M ETB</p>
        <p><strong>League Ownership:</strong> ${p.selectedPct}% of managers</p>
        <p><strong>Total Points Scored:</strong> ${p.points} pts</p>
        <p><strong>Last Gameweek Performance:</strong> ${p.lastGW} pts</p>
    `;
    modal.style.display = "flex";
}

function closePlayerModal() {
    document.getElementById("player-modal").style.display = "none";
}

// Render Transfer Market
function renderMarket(data) {
    const body = document.getElementById("player-market-body");
    body.innerHTML = "";
    data.forEach(p => {
        const inSquad = userState.squad.some(s => s.id === p.id);
        const sellPrice = inSquad ? getSellingPrice(p) : p.price;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><strong style="cursor:pointer; text-decoration:underline;" onclick="openPlayerModal(${p.id})">${p.name}</strong></td>
            <td>${p.team}</td>
            <td><span class="badge ${p.pos}">${p.pos}</span></td>
            <td>${p.price.toFixed(1)}M ETB</td>
            <td>${inSquad ? sellPrice.toFixed(1) + "M ETB" : "-"}</td>
            <td>${p.selectedPct}%</td>
            <td>
                ${inSquad 
                    ? `<button class="remove-btn" onclick="removePlayer(${p.id})">Sell</button>` 
                    : `<button class="add-btn" onclick="addPlayer(${p.id})">Buy</button>`
                }
            </td>
        `;
        body.appendChild(row);
    });
}

// Render Fixtures and FDR
function renderFixtures() {
    const container = document.getElementById("fixtures-container");
    if (!container) return;
    container.innerHTML = "";

    fixtures.forEach(f => {
        const card = document.createElement("div");
        card.className = "fixture-card";
        card.innerHTML = `
            <div style="font-size: 0.8rem; color: #aaa; margin-bottom: 0.5rem;">${f.date}</div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div><strong>${f.home}</strong> <span class="fdr-badge fdr-${f.fdrHome}">FDR ${f.fdrHome}</span></div>
                <div>vs</div>
                <div><strong>${f.away}</strong> <span class="fdr-badge fdr-${f.fdrAway}">FDR ${f.fdrAway}</span></div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Gameweek Simulation
function simulateGameweek() {
    if (userState.squad.length < 15) return alert("Draft all 15 players first!");

    let gwScore = 0;
    userState.squad.forEach(p => {
        let pPoints = adminStatsOverride[p.id] ? adminStatsOverride[p.id] : Math.floor(Math.random() * 8) + 1;
        p.lastGW = pPoints;
        p.points += pPoints;
    });

    let mult = userState.activeChip === 'triplecaptain' ? 3 : 2;
    userState.startingIds.forEach(id => {
        const p = userState.squad.find(x => x.id === id);
        let pts = p.lastGW;
        if (id === userState.captainId) pts *= mult;
        gwScore += pts;
    });

    userState.totalPoints += gwScore;
    adminStatsOverride = {};

    leaderboard.push({ rank: 0, name: "Your Team", gw: gwScore, total: userState.totalPoints });
    leaderboard.sort((a, b) => b.total - a.total);
    leaderboard.forEach((item, idx) => item.rank = idx + 1);

    saveState();
    renderLeaderboard();
    updateUI();
    alert(`Gameweek simulation complete! You scored ${gwScore} pts.`);
}

// Admin Panel
function populateAdminDropdown() {
    const sel = document.getElementById("admin-player-select");
    if (!sel) return;
    sel.innerHTML = "";
    players.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.innerText = `${p.name} (${p.team})`;
        sel.appendChild(opt);
    });
}

function applyAdminStats() {
    const pId = parseInt(document.getElementById("admin-player-select").value);
    const goals = parseInt(document.getElementById("admin-goals").value) || 0;
    const assists = parseInt(document.getElementById("admin-assists").value) || 0;
    const cs = parseInt(document.getElementById("admin-cleansheet").value) || 0;

    let total = 2 + (goals * 4) + (assists * 3) + (cs * 4);
    adminStatsOverride[pId] = total;
    alert(`Stats logged! Custom score of ${total} pts queued for next simulation.`);
}

function resetAllData() {
    if (confirm("Reset all stored fantasy data?")) {
        localStorage.clear();
        location.reload();
    }
}

// UI State Sync
function updateUI() {
    document.getElementById("budget-val").innerText = userState.budget.toFixed(1);
    
    let sqVal = userState.squad.reduce((acc, curr) => acc + curr.price, 0);
    document.getElementById("squad-val").innerText = sqVal.toFixed(1);

    document.getElementById("transfers-val").innerText = userState.freeTransfers;
    document.getElementById("hits-val").innerText = userState.transfersMade > userState.freeTransfers ? (userState.transfersMade - userState.freeTransfers) * 4 : 0;
    document.getElementById("points-val").innerText = userState.totalPoints;

    // Positional Quotas
    const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    userState.squad.forEach(p => counts[p.pos]++);
    document.getElementById("q-gk").innerText = `${counts.GK}/2`;
    document.getElementById("q-def").innerText = `${counts.DEF}/5`;
    document.getElementById("q-mid").innerText = `${counts.MID}/5`;
    document.getElementById("q-fwd").innerText = `${counts.FWD}/3`;

    renderMarket(players);
    renderSquadView();
}

// Navigation Tab Switcher
function switchTab(tabId, evt) {
    document.querySelectorAll(".view-section").forEach(sec => sec.style.display = "none");
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById(`${tabId}-section`).style.display = "block";
    if (evt) evt.currentTarget.classList.add("active");
}

function renderLeaderboard() {
    const body = document.getElementById("leaderboard-body");
    if (!body) return;
    body.innerHTML = "";
    leaderboard.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td><strong>#${row.rank}</strong></td><td>${row.name}</td><td>${row.gw}</td><td><strong>${row.total}</strong></td>`;
        body.appendChild(tr);
    });
}

function setCaptain(id) { userState.captainId = id; saveState(); updateUI(); }
function setViceCaptain(id) { userState.viceCaptainId = id; saveState(); updateUI(); }
function toggleChip(name) { userState.activeChip = userState.activeChip === name ? null : name; updateUI(); }

function setupEventListeners() {
    const searchBar = document.getElementById("search-bar");
    const posFilter = document.getElementById("pos-filter");
    const filterHandler = () => {
        const query = searchBar.value.toLowerCase();
        const pos = posFilter.value;
        const filtered = players.filter(p => (p.name.toLowerCase().includes(query) || p.team.toLowerCase().includes(query)) && (pos === "ALL" || p.pos === pos));
        renderMarket(filtered);
    };
    if (searchBar) searchBar.addEventListener("input", filterHandler);
    if (posFilter) posFilter.addEventListener("change", filterHandler);
}
