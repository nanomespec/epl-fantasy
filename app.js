// Ethiopian Premier League Full Dataset
const initialPlayers = [
    // Goalkeepers
    { id: 1, name: "Lealem Birhanu", team: "Saint George SC", pos: "GK", price: 5.5, buyPrice: 5.5, selectedPct: 42.1, points: 0, lastGW: 0, minutes: 0 },
    { id: 2, name: "Yidnekachew Ali", team: "Sidama Coffee SC", pos: "GK", price: 5.0, buyPrice: 5.0, selectedPct: 18.3, points: 0, lastGW: 0, minutes: 0 },
    { id: 3, name: "Mintesinot Allo", team: "Defense Force SC", pos: "GK", price: 5.5, buyPrice: 5.5, selectedPct: 24.5, points: 0, lastGW: 0, minutes: 0 },

    // Defenders
    { id: 4, name: "Aschalew Tamene", team: "Ethiopian Coffee SC", pos: "DEF", price: 6.5, buyPrice: 6.5, selectedPct: 58.0, points: 0, lastGW: 0, minutes: 0 },
    { id: 5, name: "Firew Solomon", team: "Defense Force SC", pos: "DEF", price: 6.0, buyPrice: 6.0, selectedPct: 31.2, points: 0, lastGW: 0, minutes: 0 },
    { id: 6, name: "Suleman Hamid", team: "Saint George SC", pos: "DEF", price: 6.0, buyPrice: 6.0, selectedPct: 29.8, points: 0, lastGW: 0, minutes: 0 },
    { id: 7, name: "Fetudin Jamal", team: "Bahir Dar Kenema", pos: "DEF", price: 5.5, buyPrice: 5.5, selectedPct: 14.2, points: 0, lastGW: 0, minutes: 0 },
    { id: 8, name: "Desta Yohannes", team: "Fasil Kenema SC", pos: "DEF", price: 5.5, buyPrice: 5.5, selectedPct: 19.5, points: 0, lastGW: 0, minutes: 0 },
    { id: 9, name: "Abebe Tilahun", team: "Sidama Coffee SC", pos: "DEF", price: 5.0, buyPrice: 5.0, selectedPct: 12.1, points: 0, lastGW: 0, minutes: 0 },

    // Midfielders
    { id: 10, name: "Chernet Gugsa", team: "Saint George SC", pos: "MID", price: 8.5, buyPrice: 8.5, selectedPct: 45.6, points: 0, lastGW: 0, minutes: 0 },
    { id: 11, name: "Wogene Gezahegn", team: "Ethiopian Coffee SC", pos: "MID", price: 7.5, buyPrice: 7.5, selectedPct: 22.4, points: 0, lastGW: 0, minutes: 0 },
    { id: 12, name: "Surafel Dagnachew", team: "Fasil Kenema SC", pos: "MID", price: 9.0, buyPrice: 9.0, selectedPct: 51.0, points: 0, lastGW: 0, minutes: 0 },
    { id: 13, name: "Fereb Zewdu", team: "Bahir Dar Kenema", pos: "MID", price: 7.0, buyPrice: 7.0, selectedPct: 16.8, points: 0, lastGW: 0, minutes: 0 },
    { id: 14, name: "Amanuel Yohannes", team: "Ethiopian Coffee SC", pos: "MID", price: 8.0, buyPrice: 8.0, selectedPct: 38.9, points: 0, lastGW: 0, minutes: 0 },
    { id: 15, name: "Gatoch Panom", team: "Saint George SC", pos: "MID", price: 8.0, buyPrice: 8.0, selectedPct: 27.5, points: 0, lastGW: 0, minutes: 0 },

    // Forwards
    { id: 16, name: "Abubeker Nasir", team: "Ethiopian Coffee SC", pos: "FWD", price: 9.5, buyPrice: 9.5, selectedPct: 68.4, points: 0, lastGW: 0, minutes: 0 },
    { id: 17, name: "Ramkel Lok", team: "Saint George SC", pos: "FWD", price: 9.0, buyPrice: 9.0, selectedPct: 41.2, points: 0, lastGW: 0, minutes: 0 },
    { id: 18, name: "Safee Assefa", team: "Sidama Coffee SC", pos: "FWD", price: 8.0, buyPrice: 8.0, selectedPct: 20.1, points: 0, lastGW: 0, minutes: 0 },
    { id: 19, name: "Oumed Oukri", team: "Fasil Kenema SC", pos: "FWD", price: 8.0, buyPrice: 8.0, selectedPct: 25.3, points: 0, lastGW: 0, minutes: 0 },
    { id: 20, name: "Ali Sulieman", team: "Bahir Dar Kenema", pos: "FWD", price: 8.5, buyPrice: 8.5, selectedPct: 18.9, points: 0, lastGW: 0, minutes: 0 }
];

// Official Fixtures Schedule & FDR Ratings
const fixtures = [
    { home: "Saint George SC", away: "Negele Arsi", fdrHome: 2, fdrAway: 5, date: "Gameweek 1" },
    { home: "Ethiopian Coffee SC", away: "Sheger Ketema", fdrHome: 2, fdrAway: 4, date: "Gameweek 1" },
    { home: "Wolaitta Dicha SC", away: "Fasil Kenema SC", fdrHome: 4, fdrAway: 3, date: "Gameweek 1" },
    { home: "Defense Force SC", away: "Bahir Dar Kenema", fdrHome: 3, fdrAway: 3, date: "Gameweek 1" },
    { home: "Sidama Coffee SC", away: "CBE SA", fdrHome: 3, fdrAway: 3, date: "Gameweek 1" }
];

// State Initialization
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
    usedChips: { wildcard: false, freehit: false, benchboost: false, triplecaptain: false },
    freeHitBackup: null // To restore team after FH
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
    if (!checkPositionalQuota(p.pos)) return alert(`Positional quota reached! Maximum allowed for ${p.pos} exceeded.`);

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

// Strict Pitch Formation Validator
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

// Swap Player Logic
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

// ------------------------------------------------------------------
// AUTO-SUB & SIMULATION ENGINE (UPGRADED)
// ------------------------------------------------------------------

function simulateGameweek() {
    if (userState.squad.length < 15) return alert("Draft all 15 players first!");
    if (!validateFormation(userState.startingIds).valid) return alert("Invalid starting formation!");

    // 1. Assign Match Data
    userState.squad.forEach(p => {
        if (adminStatsOverride[p.id]) {
            p.lastGW = adminStatsOverride[p.id].points;
            p.minutes = adminStatsOverride[p.id].minutes;
        } else {
            // Random Simulator: 10% chance of 0 mins, otherwise 90 mins. Points randomized 1-8.
            const played = Math.random() > 0.1; 
            p.minutes = played ? 90 : 0;
            p.lastGW = played ? Math.floor(Math.random() * 8) + 1 : 0;
        }
        p.points += p.lastGW; // Add to global total
    });

    let currentStarters = [...userState.startingIds];
    let currentBench = [...userState.benchIds];

    // 2. Auto-Substitution Engine (Triggered if Bench Boost is OFF)
    if (userState.activeChip !== 'benchboost') {
        for (let i = 0; i < currentStarters.length; i++) {
            const starter = userState.squad.find(x => x.id === currentStarters[i]);
            if (starter.minutes === 0) {
                // Find highest priority bench player who played > 0 mins and keeps formation valid
                for (let j = 0; j < currentBench.length; j++) {
                    const sub = userState.squad.find(x => x.id === currentBench[j]);
                    if (sub.minutes > 0) {
                        let testStarters = [...currentStarters];
                        testStarters[i] = sub.id; // Swap trial
                        if (validateFormation(testStarters).valid) {
                            currentStarters[i] = sub.id; // Confirm sub in
                            currentBench[j] = starter.id; // Confirm sub out
                            break; // Move to next starter
                        }
                    }
                }
            }
        }
    }

    // 3. Captain & Vice-Captain Fallback Logic
    let activeCapId = userState.captainId;
    let cap = userState.squad.find(x => x.id === activeCapId);
    let viceCap = userState.squad.find(x => x.id === userState.viceCaptainId);
    
    if (cap.minutes === 0 && viceCap.minutes > 0) {
        activeCapId = viceCap.id; // Auto-VC assignment
    }

    // 4. Calculate Final GW Points
    let gwScore = 0;
    const scoringIds = userState.activeChip === 'benchboost' 
        ? [...currentStarters, ...currentBench] 
        : currentStarters;

    let capMultiplier = userState.activeChip === 'triplecaptain' ? 3 : 2;

    scoringIds.forEach(id => {
        const p = userState.squad.find(x => x.id === id);
        let pts = p.lastGW;
        if (id === activeCapId) pts *= capMultiplier;
        gwScore += pts;
    });

    // 5. Transfer Hits Deduction (Wildcard/Freehit negate hits)
    let hitsDeducted = 0;
    if (userState.activeChip !== 'wildcard' && userState.activeChip !== 'freehit') {
        if (userState.transfersMade > userState.freeTransfers) {
            hitsDeducted = (userState.transfersMade - userState.freeTransfers) * 4;
            gwScore -= hitsDeducted;
        }
    }

    // Update Totals
    userState.lastGWPoints = gwScore;
    userState.totalPoints += gwScore;
    userState.transfersMade = 0; // Reset for next GW
    userState.freeTransfers = 1;

    // 6. FPL Price Fluctuation (Simulated Market Trend)
    players.forEach(p => {
        // Random 10% chance to rise or fall 0.1m based on performance
        if (Math.random() > 0.9) {
            if (p.lastGW > 5) p.price = Math.round((p.price + 0.1) * 10) / 10;
            else if (p.lastGW < 2 && p.price > 4.0) p.price = Math.round((p.price - 0.1) * 10) / 10;
        }
    });

    // 7. Free Hit Revert Engine
    if (userState.activeChip === 'freehit' && userState.freeHitBackup) {
        userState.squad = userState.freeHitBackup.squad;
        userState.startingIds = userState.freeHitBackup.startingIds;
        userState.benchIds = userState.freeHitBackup.benchIds;
        userState.budget = userState.freeHitBackup.budget;
        userState.freeHitBackup = null;
    }

    // 8. Chip Cleanup
    if (userState.activeChip) {
        userState.usedChips[userState.activeChip] = true;
        userState.activeChip = null;
    }

    adminStatsOverride = {}; // Clear Admin Input
    
    // Update Leaderboard
    const myTeam = leaderboard.find(x => x.name === "Your Team");
    if (myTeam) {
        myTeam.gw = gwScore;
        myTeam.total = userState.totalPoints;
    } else {
        leaderboard.push({ rank: 0, name: "Your Team", gw: gwScore, total: userState.totalPoints });
    }
    leaderboard.sort((a, b) => b.total - a.total);
    leaderboard.forEach((item, idx) => item.rank = idx + 1);

    saveState();
    renderLeaderboard();
    updateUI();
    alert(`Gameweek complete! You scored ${gwScore} pts ${hitsDeducted > 0 ? `(after -${hitsDeducted} transfer hits)` : ''}. Auto-subs & price changes applied.`);
}

// ------------------------------------------------------------------
// REAL FPL POSITIONAL POINT SCORING ENGINE (ADMIN)
// ------------------------------------------------------------------
function applyAdminStats() {
    const pId = parseInt(document.getElementById("admin-player-select").value);
    const p = players.find(x => x.id === pId);
    if (!p) return;

    const mins = parseInt(document.getElementById("admin-mins").value) || 0;
    const goals = parseInt(document.getElementById("admin-goals").value) || 0;
    const assists = parseInt(document.getElementById("admin-assists").value) || 0;
    const cs = parseInt(document.getElementById("admin-cleansheet").value) || 0;
    const yellow = parseInt(document.getElementById("admin-yc").value) || 0;
    const red = parseInt(document.getElementById("admin-rc").value) || 0;

    let pts = 0;
    
    // Minutes Played
    if (mins >= 60) pts += 2;
    else if (mins > 0) pts += 1;

    // Goals Scored
    if (p.pos === 'GK' || p.pos === 'DEF') pts += (goals * 6);
    else if (p.pos === 'MID') pts += (goals * 5);
    else if (p.pos === 'FWD') pts += (goals * 4);

    // Assists
    pts += (assists * 3);

    // Clean Sheets (Only awarded if played 60+ mins)
    if (cs === 1 && mins >= 60) {
        if (p.pos === 'GK' || p.pos === 'DEF') pts += 4;
        else if (p.pos === 'MID') pts += 1;
    }

    // Penalties
    pts -= (yellow * 1);
    pts -= (red * 3);

    adminStatsOverride[pId] = { points: pts, minutes: mins };
    alert(`FPL stats logged! Custom score of ${pts} pts queued for ${p.name}.`);
}

// ------------------------------------------------------------------
// UI RENDERERS
// ------------------------------------------------------------------
function renderSquadView() {
    ['GK', 'DEF', 'MID', 'FWD'].forEach(pos => {
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
                <button class="swap-btn" onclick="swapSlot(${p.id})">⇄</button>
            </div>
        `;
        benchRow.appendChild(card);
    });

    const fCheck = validateFormation(userState.startingIds);
    if (fCheck.valid) document.getElementById("formation-display").innerText = `Current Formation: ${fCheck.formation}`;
}

function updateUI() {
    document.getElementById("budget-val").innerText = userState.budget.toFixed(1);
    
    let sqVal = userState.squad.reduce((acc, curr) => acc + curr.price, 0);
    document.getElementById("squad-val").innerText = sqVal.toFixed(1);

    document.getElementById("transfers-val").innerText = userState.freeTransfers;
    
    // Live Hit Tracker
    let hitCost = (userState.transfersMade > userState.freeTransfers && userState.activeChip !== 'wildcard' && userState.activeChip !== 'freehit') 
        ? (userState.transfersMade - userState.freeTransfers) * 4 : 0;
    document.getElementById("hits-val").innerText = `-${hitCost}`;
    
    document.getElementById("points-val").innerText = userState.totalPoints;

    ['wildcard', 'freehit', 'benchboost', 'triplecaptain'].forEach(chip => {
        const btn = document.getElementById(`chip-${chip}`);
        if(btn) {
            if (userState.usedChips[chip]) btn.className = "chip-btn used";
            else if (userState.activeChip === chip) btn.className = "chip-btn active";
            else btn.className = "chip-btn";
        }
    });

    const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    userState.squad.forEach(p => counts[p.pos]++);
    document.getElementById("q-gk").innerText = `${counts.GK}/2`;
    document.getElementById("q-def").innerText = `${counts.DEF}/5`;
    document.getElementById("q-mid").innerText = `${counts.MID}/5`;
    document.getElementById("q-fwd").innerText = `${counts.FWD}/3`;

    renderMarket(players);
    renderSquadView();
}

function toggleChip(name) {
    if (userState.usedChips[name]) return alert("Chip already used this season!");
    
    // Free Hit Backup Logic
    if (name === 'freehit' && userState.activeChip !== 'freehit') {
        userState.freeHitBackup = {
            squad: [...userState.squad],
            startingIds: [...userState.startingIds],
            benchIds: [...userState.benchIds],
            budget: userState.budget
        };
        alert("Free Hit active! Unlimited transfers for 1 GW. Team will revert after simulation.");
    } else if (userState.activeChip === 'freehit' && name !== 'freehit') {
        // Canceling free hit
        userState.freeHitBackup = null; 
    }

    userState.activeChip = userState.activeChip === name ? null : name; 
    saveState();
    updateUI(); 
}

function setCaptain(id) { userState.captainId = id; saveState(); updateUI(); }
function setViceCaptain(id) { userState.viceCaptainId = id; saveState(); updateUI(); }

// Modal, Admin, and Market rendering logic functions remain structurally identical
function openPlayerModal(id) { /*... unchanged ...*/ }
function closePlayerModal() { /*... unchanged ...*/ }
function renderMarket(data) { /*... unchanged ...*/ }
function renderFixtures() { /*... unchanged ...*/ }
function renderLeaderboard() { /*... unchanged ...*/ }
function switchTab(tabId, evt) { /*... unchanged ...*/ }
function resetAllData() { localStorage.clear(); location.reload(); }

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
