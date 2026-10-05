// Ethiopian Premier League Full Dataset
const initialPlayers = [
    { id: 1, name: "L. Birhanu", team: "Saint George SC", pos: "GK", price: 5.5, buyPrice: 5.5, points: 0, lastGW: 0, minutes: 0 },
    { id: 2, name: "Y. Ali", team: "Sidama Coffee SC", pos: "GK", price: 5.0, buyPrice: 5.0, points: 0, lastGW: 0, minutes: 0 },
    { id: 3, name: "M. Allo", team: "Defense Force SC", pos: "GK", price: 5.5, buyPrice: 5.5, points: 0, lastGW: 0, minutes: 0 },
    { id: 4, name: "A. Tamene", team: "Ethiopian Coffee SC", pos: "DEF", price: 6.5, buyPrice: 6.5, points: 0, lastGW: 0, minutes: 0 },
    { id: 5, name: "F. Solomon", team: "Defense Force SC", pos: "DEF", price: 6.0, buyPrice: 6.0, points: 0, lastGW: 0, minutes: 0 },
    { id: 6, name: "S. Hamid", team: "Saint George SC", pos: "DEF", price: 6.0, buyPrice: 6.0, points: 0, lastGW: 0, minutes: 0 },
    { id: 7, name: "F. Jamal", team: "Bahir Dar Kenema", pos: "DEF", price: 5.5, buyPrice: 5.5, points: 0, lastGW: 0, minutes: 0 },
    { id: 8, name: "D. Yohannes", team: "Fasil Kenema SC", pos: "DEF", price: 5.5, buyPrice: 5.5, points: 0, lastGW: 0, minutes: 0 },
    { id: 9, name: "A. Tilahun", team: "Sidama Coffee SC", pos: "DEF", price: 5.0, buyPrice: 5.0, points: 0, lastGW: 0, minutes: 0 },
    { id: 10, name: "C. Gugsa", team: "Saint George SC", pos: "MID", price: 8.5, buyPrice: 8.5, points: 0, lastGW: 0, minutes: 0 },
    { id: 11, name: "W. Gezahegn", team: "Ethiopian Coffee SC", pos: "MID", price: 7.5, buyPrice: 7.5, points: 0, lastGW: 0, minutes: 0 },
    { id: 12, name: "S. Dagnachew", team: "Fasil Kenema SC", pos: "MID", price: 9.0, buyPrice: 9.0, points: 0, lastGW: 0, minutes: 0 },
    { id: 13, name: "F. Zewdu", team: "Bahir Dar Kenema", pos: "MID", price: 7.0, buyPrice: 7.0, points: 0, lastGW: 0, minutes: 0 },
    { id: 14, name: "A. Yohannes", team: "Ethiopian Coffee SC", pos: "MID", price: 8.0, buyPrice: 8.0, points: 0, lastGW: 0, minutes: 0 },
    { id: 15, name: "G. Panom", team: "Saint George SC", pos: "MID", price: 8.0, buyPrice: 8.0, points: 0, lastGW: 0, minutes: 0 },
    { id: 16, name: "A. Nasir", team: "Ethiopian Coffee SC", pos: "FWD", price: 9.5, buyPrice: 9.5, points: 0, lastGW: 0, minutes: 0 },
    { id: 17, name: "R. Lok", team: "Saint George SC", pos: "FWD", price: 9.0, buyPrice: 9.0, points: 0, lastGW: 0, minutes: 0 },
    { id: 18, name: "S. Assefa", team: "Sidama Coffee SC", pos: "FWD", price: 8.0, buyPrice: 8.0, points: 0, lastGW: 0, minutes: 0 },
    { id: 19, name: "O. Oukri", team: "Fasil Kenema SC", pos: "FWD", price: 8.0, buyPrice: 8.0, points: 0, lastGW: 0, minutes: 0 },
    { id: 20, name: "A. Sulieman", team: "Bahir Dar Kenema", pos: "FWD", price: 8.5, buyPrice: 8.5, points: 0, lastGW: 0, minutes: 0 }
];

// Club Kit Colors
const teamColors = {
    "Saint George SC": ["#ffda00", "#ff0000"],
    "Ethiopian Coffee SC": ["#6b4423", "#ffffff"],
    "Fasil Kenema SC": ["#ff0000", "#ffffff"],
    "Bahir Dar Kenema": ["#0000ff", "#ffffff"],
    "Sidama Coffee SC": ["#008000", "#ffffff"],
    "Defense Force SC": ["#333333", "#ffffff"],
    "Default": ["#02efff", "#37003c"]
};

// Global State
let players = JSON.parse(localStorage.getItem("fpl_players")) || initialPlayers;
let userState = JSON.parse(localStorage.getItem("fpl_userState")) || {
    squad: [], startingIds: [], benchIds: [],
    captainId: null, viceCaptainId: null,
    budget: 100.0, freeTransfers: 1, totalPoints: 0, lastGWPoints: 0, gameweek: 1,
    activeChip: null, usedChips: { wildcard: false, freehit: false, benchboost: false, triplecaptain: false },
};

// Draft Transfer State (To calculate net hits and allow cancellation)
let gwBaseState = JSON.parse(localStorage.getItem("fpl_gwBase")) || { squad: [...userState.squad], budget: userState.budget };

// AI Leagues State
let leaguesState = JSON.parse(localStorage.getItem("fpl_leagues")) || {
    teams: [
        { id: 'user', name: "Nate's Tacticians", manager: "Nate", totalPts: 0, gwPts: 0, h2hW: 0, h2hD: 0, h2hL: 0, h2hPts: 0 },
        { id: 'ai1', name: "Bunna Kings", manager: "Abebe", totalPts: 0, gwPts: 0, h2hW: 0, h2hD: 0, h2hL: 0, h2hPts: 0 },
        { id: 'ai2', name: "Sheger United", manager: "Dawit", totalPts: 0, gwPts: 0, h2hW: 0, h2hD: 0, h2hL: 0, h2hPts: 0 },
        { id: 'ai3', name: "Fasil Flames", manager: "Henok", totalPts: 0, gwPts: 0, h2hW: 0, h2hD: 0, h2hL: 0, h2hPts: 0 }
    ],
    fixtures: [] // Current GW fixtures
};

let adminStatsOverride = {};
let currentMode = 'pick-team'; // pick-team or transfers

// ------------------------------------------------------------------
// INIT & ROUTING
// ------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    updateUI();
    populateAdminDropdown();
    generateFixtures();
});

function saveState() {
    localStorage.setItem("fpl_players", JSON.stringify(players));
    localStorage.setItem("fpl_userState", JSON.stringify(userState));
    localStorage.setItem("fpl_gwBase", JSON.stringify(gwBaseState));
    localStorage.setItem("fpl_leagues", JSON.stringify(leaguesState));
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    currentMode = tabId;
    if (tabId === 'pick-team') renderPitch('pick-pitch-xi', 'pick-pitch-bench');
    if (tabId === 'transfers') { renderPitch('transfer-pitch-xi', 'transfer-pitch-bench'); renderMarket(); }
    if (tabId === 'leagues') renderLeagues();
}

// ------------------------------------------------------------------
// PITCH RENDERING (SHIRTS & UI)
// ------------------------------------------------------------------
function getShirtSVG(teamName) {
    const colors = teamColors[teamName] || teamColors["Default"];
    return `<svg viewBox="0 0 64 64" class="kit-svg" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 12 L48 12 L62 26 L52 38 L46 30 L46 60 L18 60 L18 30 L12 38 L2 26 Z" fill="${colors[0]}" stroke="${colors[1]}" stroke-width="3"/>
    </svg>`;
}

function createPlayerCard(p, context) {
    const isC = userState.captainId === p.id;
    const isVC = userState.viceCaptainId === p.id;
    
    let badges = '';
    if (isC) badges += `<div class="badge cap">C</div>`;
    else if (isVC) badges += `<div class="badge vcap">V</div>`;

    return `
        <div class="pitch-player" onclick="openPlayerModal(${p.id}, '${context}')">
            ${badges}
            ${getShirtSVG(p.team)}
            <div class="p-name">${p.name}</div>
            <div class="p-price">${context === 'transfers' ? p.price.toFixed(1) : p.lastGW + ' pts'}</div>
        </div>
    `;
}

function renderPitch(xiContainerId, benchContainerId) {
    const xiCont = document.getElementById(xiContainerId);
    const benchCont = document.getElementById(benchContainerId);
    if (!xiCont || !benchCont) return;

    xiCont.innerHTML = "";
    benchCont.innerHTML = "";

    const context = currentMode === 'transfers' ? 'transfers' : 'pick';
    
    // Group XI by position
    const xiPlayers = userState.startingIds.map(id => userState.squad.find(x => x.id === id)).filter(Boolean);
    const positions = ['GK', 'DEF', 'MID', 'FWD'];
    
    positions.forEach(pos => {
        const pGroup = xiPlayers.filter(p => p.pos === pos);
        if (pGroup.length > 0) {
            const row = document.createElement("div");
            row.className = "pitch-row";
            pGroup.forEach(p => row.innerHTML += createPlayerCard(p, context));
            xiCont.appendChild(row);
        }
    });

    // Render Bench
    userState.benchIds.forEach(id => {
        const p = userState.squad.find(x => x.id === id);
        if (p) benchCont.innerHTML += createPlayerCard(p, context);
    });

    // If empty squad, show placeholder
    if (userState.squad.length === 0) {
        xiCont.innerHTML = `<div style="color:white; text-align:center; font-weight:bold; margin-top:200px;">Pitch Empty. Go to Transfers.</div>`;
    }

    validateAndDisplayFormation();
}

function validateAndDisplayFormation() {
    const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    userState.startingIds.forEach(id => {
        const p = userState.squad.find(x => x.id === id);
        if (p) counts[p.pos]++;
    });
    
    const disp = document.getElementById("formation-display");
    if(disp) disp.innerText = `Formation: ${counts.DEF}-${counts.MID}-${counts.FWD}`;
    
    return (counts.GK === 1 && counts.DEF >= 3 && counts.MID >= 2 && counts.FWD >= 1 && userState.startingIds.length === 11);
}

// ------------------------------------------------------------------
// TRANSFERS & MARKET LOGIC
// ------------------------------------------------------------------
function getSellingPrice(player) {
    if (player.price > player.buyPrice) {
        const profit = player.price - player.buyPrice;
        return player.buyPrice + Math.floor((profit / 2) * 10) / 10;
    }
    return player.price;
}

function checkPositionalQuota(pos) {
    const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    userState.squad.forEach(p => counts[p.pos]++);
    const limits = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
    return counts[pos] < limits[pos];
}

function calcNetTransfersMade() {
    // Count how many players in current squad are NOT in the gwBaseState squad
    const newAdditions = userState.squad.filter(p => !gwBaseState.squad.find(b => b.id === p.id)).length;
    return newAdditions;
}

function buyPlayer(id) {
    const p = players.find(x => x.id === id);
    if (!p) return;
    if (userState.squad.length >= 15) return alert("Squad full (15/15)!");
    if (userState.budget < p.price) return alert("Insufficient budget!");
    if (!checkPositionalQuota(p.pos)) return alert(`Max allowed for ${p.pos} exceeded.`);
    if (userState.squad.filter(x => x.team === p.team).length >= 3) return alert(`Max 3 players from ${p.team}!`);

    p.buyPrice = p.price;
    userState.squad.push(p);
    userState.budget -= p.price;
    
    if (userState.startingIds.length < 11) userState.startingIds.push(p.id);
    else userState.benchIds.push(p.id);

    if (!userState.captainId) userState.captainId = p.id;
    else if (!userState.viceCaptainId) userState.viceCaptainId = p.id;

    saveState(); updateUI();
}

function sellPlayer(id) {
    const p = userState.squad.find(x => x.id === id);
    if (!p) return;
    
    userState.budget += getSellingPrice(p);
    userState.squad = userState.squad.filter(x => x.id !== id);
    userState.startingIds = userState.startingIds.filter(x => x !== id);
    userState.benchIds = userState.benchIds.filter(x => x !== id);
    
    if (userState.captainId === id) userState.captainId = userState.startingIds[0] || null;
    if (userState.viceCaptainId === id) userState.viceCaptainId = userState.startingIds[1] || null;

    closeModal(); saveState(); updateUI();
}

function resetTransfers() {
    userState.squad = [...gwBaseState.squad];
    userState.budget = gwBaseState.budget;
    // Reconstruct starting/bench arrays safely
    userState.startingIds = userState.squad.slice(0,11).map(p => p.id);
    userState.benchIds = userState.squad.slice(11).map(p => p.id);
    saveState(); updateUI();
    alert("Transfers reverted to Gameweek start state.");
}

function renderMarket() {
    if (currentMode !== 'transfers') return;
    
    const search = document.getElementById('market-search').value.toLowerCase();
    const pos = document.getElementById('market-filter-pos').value;
    const maxPrice = parseFloat(document.getElementById('market-filter-price')?.value || 15.0);

    const filtered = players.filter(p => {
        const owned = userState.squad.find(x => x.id === p.id);
        return !owned && p.name.toLowerCase().includes(search) && (pos === 'ALL' || p.pos === pos) && p.price <= maxPrice;
    }).sort((a, b) => b.price - a.price);

    const list = document.getElementById('market-list');
    list.innerHTML = "";
    filtered.forEach(p => {
        list.innerHTML += `
            <tr>
                <td><strong>${p.name}</strong><br><span style="font-size:0.75rem; color:#666;">${p.team.substring(0,3).toUpperCase()} | ${p.pos}</span></td>
                <td style="font-weight:bold; color:var(--fpl-purple);">£${p.price.toFixed(1)}</td>
                <td><button class="add-btn" onclick="buyPlayer(${p.id})">Add</button></td>
            </tr>
        `;
    });
}

// ------------------------------------------------------------------
// MODALS & PICK TEAM LOGIC
// ------------------------------------------------------------------
function openPlayerModal(id, context) {
    const p = userState.squad.find(x => x.id === id);
    if (!p) return;
    
    document.getElementById("modal-p-name").innerText = p.name;
    document.getElementById("modal-p-info").innerText = `${p.pos} | ${p.team} | £${p.price.toFixed(1)}m`;
    
    const actions = document.getElementById("modal-actions");
    actions.innerHTML = "";
    
    if (context === 'transfers') {
        actions.innerHTML = `<button onclick="sellPlayer(${p.id})" style="background:var(--fpl-red); color:white;">Sell for £${getSellingPrice(p).toFixed(1)}m</button>`;
    } else {
        const isStarter = userState.startingIds.includes(p.id);
        actions.innerHTML += `<button onclick="swapSlot(${p.id})">${isStarter ? 'Sub Out to Bench' : 'Sub In to Pitch'}</button>`;
        if (isStarter) {
            actions.innerHTML += `
                <button onclick="setCap(${p.id}, true)">Make Captain</button>
                <button onclick="setCap(${p.id}, false)">Make Vice-Captain</button>
            `;
        }
    }
    
    document.getElementById("player-modal").classList.add("active");
}

function closeModal() { document.getElementById("player-modal").classList.remove("active"); }

function setCap(id, isCap) {
    if (isCap) userState.captainId = id;
    else userState.viceCaptainId = id;
    closeModal(); saveState(); updateUI();
}

function swapSlot(id) {
    let testStarters = [...userState.startingIds];
    let testBench = [...userState.benchIds];

    if (testStarters.includes(id)) {
        const targetId = testBench[0];
        if (!targetId) return alert("Bench empty!");
        testStarters = testStarters.filter(x => x !== id); testBench = testBench.filter(x => x !== targetId);
        testStarters.push(targetId); testBench.push(id);
    } else {
        const targetId = testStarters[0];
        testBench = testBench.filter(x => x !== id); testStarters = testStarters.filter(x => x !== targetId);
        testBench.push(targetId); testStarters.push(id);
    }
    
    userState.startingIds = testStarters;
    userState.benchIds = testBench;
    closeModal(); saveState(); updateUI();
}

function toggleChip(name) {
    if (userState.usedChips[name]) return alert("Chip already used this season!");
    userState.activeChip = userState.activeChip === name ? null : name; 
    saveState(); updateUI(); 
}

// ------------------------------------------------------------------
// SIMULATION & LEAGUES
// ------------------------------------------------------------------
function generateFixtures() {
    // Round-robin pairing for 4 teams
    const t = leaguesState.teams;
    // T1vT2, T3vT4 (Simplified random rotation)
    const opponents = [t[1], t[2], t[3]].sort(() => 0.5 - Math.random());
    leaguesState.fixtures = [
        { home: t[0].id, away: opponents[0].id },
        { home: opponents[1].id, away: opponents[2].id }
    ];
}

function simulateGameweek() {
    if (userState.squad.length < 15) return alert("Draft all 15 players before simulating!");
    if (!validateAndDisplayFormation()) return alert("Invalid formation!");

    // 1. Process FPL Player Scores
    userState.squad.forEach(p => {
        if (adminStatsOverride[p.id]) {
            p.lastGW = adminStatsOverride[p.id].points;
            p.minutes = adminStatsOverride[p.id].minutes;
        } else {
            const played = Math.random() > 0.1; 
            p.minutes = played ? 90 : 0;
            p.lastGW = played ? Math.floor(Math.random() * 8) + 1 : 0;
        }
        p.points += p.lastGW;
        
        // Random price fluctuations
        if (Math.random() > 0.9) {
            if (p.lastGW > 5) p.price = Math.round((p.price + 0.1) * 10) / 10;
            else if (p.lastGW < 2 && p.price > 4.0) p.price = Math.round((p.price - 0.1) * 10) / 10;
        }
    });

    let currentStarters = [...userState.startingIds];
    let currentBench = [...userState.benchIds];

    // 2. Auto-Subs (If Bench Boost off)
    if (userState.activeChip !== 'benchboost') {
        for (let i = 0; i < currentStarters.length; i++) {
            const starter = userState.squad.find(x => x.id === currentStarters[i]);
            if (starter.minutes === 0) {
                for (let j = 0; j < currentBench.length; j++) {
                    const sub = userState.squad.find(x => x.id === currentBench[j]);
                    if (sub.minutes > 0) {
                        let test = [...currentStarters]; test[i] = sub.id;
                        let testCounts = { GK:0, DEF:0, MID:0, FWD:0 };
                        test.forEach(id => testCounts[userState.squad.find(x=>x.id===id).pos]++);
                        if (testCounts.DEF >= 3 && testCounts.MID >= 2 && testCounts.FWD >= 1 && testCounts.GK === 1) {
                            currentStarters[i] = sub.id; currentBench[j] = starter.id;
                            break;
                        }
                    }
                }
            }
        }
    }

    // 3. Score Calculation
    let activeCapId = userState.captainId;
    let cap = userState.squad.find(x => x.id === activeCapId);
    let viceCap = userState.squad.find(x => x.id === userState.viceCaptainId);
    if (cap.minutes === 0 && viceCap.minutes > 0) activeCapId = viceCap.id;

    let gwScore = 0;
    const scoringIds = userState.activeChip === 'benchboost' ? [...currentStarters, ...currentBench] : currentStarters;
    const multiplier = userState.activeChip === 'triplecaptain' ? 3 : 2;

    scoringIds.forEach(id => {
        let pts = userState.squad.find(x => x.id === id).lastGW;
        if (id === activeCapId) pts *= multiplier;
        gwScore += pts;
    });

    // 4. Hit Deductions
    const netTransfers = calcNetTransfersMade();
    let hits = 0;
    if (userState.activeChip !== 'wildcard' && userState.activeChip !== 'freehit') {
        if (netTransfers > userState.freeTransfers) {
            hits = (netTransfers - userState.freeTransfers) * 4;
            gwScore -= hits;
        }
    }

    // 5. Update State
    userState.lastGWPoints = gwScore;
    userState.totalPoints += gwScore;
    userState.freeTransfers = 1;
    if (userState.activeChip) { userState.usedChips[userState.activeChip] = true; userState.activeChip = null; }
    
    // Commit new draft state
    gwBaseState = { squad: [...userState.squad], budget: userState.budget };
    
    // 6. Process AI Teams & Leagues
    const userTeam = leaguesState.teams.find(t => t.id === 'user');
    userTeam.gwPts = gwScore;
    userTeam.totalPts = userState.totalPoints;

    leaguesState.teams.forEach(t => {
        if (t.id !== 'user') {
            t.gwPts = 30 + Math.floor(Math.random() * 45); // AI FPL Score 30-75
            t.totalPts += t.gwPts;
        }
    });

    // Resolve H2H Fixtures
    leaguesState.fixtures.forEach(fix => {
        let h = leaguesState.teams.find(t => t.id === fix.home);
        let a = leaguesState.teams.find(t => t.id === fix.away);
        if (h.gwPts > a.gwPts) { h.h2hW++; h.h2hPts+=3; a.h2hL++; }
        else if (h.gwPts < a.gwPts) { a.h2hW++; a.h2hPts+=3; h.h2hL++; }
        else { h.h2hD++; a.h2hD++; h.h2hPts+=1; a.h2hPts+=1; }
    });

    userState.gameweek++;
    adminStatsOverride = {};
    generateFixtures();
    saveState(); updateUI();
    
    alert(`Gameweek complete! You scored ${gwScore} pts ${hits>0 ? `(-${hits} hits)` : ''}. Leagues updated.`);
}

function renderLeagues() {
    if (currentMode !== 'leagues') return;

    // Classic League (Sort by Total Points)
    const classicList = [...leaguesState.teams].sort((a, b) => b.totalPts - a.totalPts);
    const cTbody = document.getElementById("classic-league-body");
    cTbody.innerHTML = "";
    classicList.forEach((t, i) => {
        const isMe = t.id === 'user' ? 'style="background:#00ff8533; font-weight:bold;"' : '';
        cTbody.innerHTML += `<tr ${isMe}><td>${i+1}</td><td>${t.name}<br><span style="font-size:0.75rem;color:#666;">${t.manager}</span></td><td>${t.gwPts}</td><td>${t.totalPts}</td></tr>`;
    });

    // H2H League (Sort by H2H Pts, then Total Pts)
    const h2hList = [...leaguesState.teams].sort((a, b) => b.h2hPts !== a.h2hPts ? b.h2hPts - a.h2hPts : b.totalPts - a.totalPts);
    const hTbody = document.getElementById("h2h-league-body");
    hTbody.innerHTML = "";
    h2hList.forEach((t, i) => {
        const isMe = t.id === 'user' ? 'style="background:#00ff8533; font-weight:bold;"' : '';
        hTbody.innerHTML += `<tr ${isMe}><td>${i+1}</td><td>${t.name}</td><td>${t.h2hW}</td><td>${t.h2hD}</td><td>${t.h2hL}</td><td><strong>${t.h2hPts}</strong></td></tr>`;
    });

    // Upcoming Fixtures
    const fDiv = document.getElementById("h2h-fixtures-list");
    fDiv.innerHTML = `<p style="font-size:0.85rem; color:#666; margin-bottom:5px;">Upcoming GW${userState.gameweek}</p>`;
    leaguesState.fixtures.forEach(fix => {
        let h = leaguesState.teams.find(t => t.id === fix.home).name;
        let a = leaguesState.teams.find(t => t.id === fix.away).name;
        fDiv.innerHTML += `<div class="h2h-match"><span>${h}</span> <span class="h2h-score">vs</span> <span>${a}</span></div>`;
    });
}

// ------------------------------------------------------------------
// ADMIN & UI REFRESH
// ------------------------------------------------------------------
function applyAdminStats() {
    const pId = parseInt(document.getElementById("admin-player-select").value);
    const p = players.find(x => x.id === pId);
    if (!p) return;
    const m = parseInt(document.getElementById("admin-mins").value) || 0;
    const g = parseInt(document.getElementById("admin-goals").value) || 0;
    const a = parseInt(document.getElementById("admin-assists").value) || 0;
    const cs = parseInt(document.getElementById("admin-cleansheet").value) || 0;
    let pts = (m >= 60 ? 2 : (m > 0 ? 1 : 0)) + (a * 3) - ((parseInt(document.getElementById("admin-yc").value)||0)*1) - ((parseInt(document.getElementById("admin-rc").value)||0)*3);
    
    if (p.pos === 'GK' || p.pos === 'DEF') pts += (g * 6) + (cs === 1 && m >= 60 ? 4 : 0);
    else if (p.pos === 'MID') pts += (g * 5) + (cs === 1 && m >= 60 ? 1 : 0);
    else pts += (g * 4);

    adminStatsOverride[pId] = { points: pts, minutes: m };
    alert(`Stats logged! Custom score of ${pts} pts queued for ${p.name}.`);
}

function populateAdminDropdown() {
    const sel = document.getElementById("admin-player-select");
    if (!sel) return;
    players.forEach(p => sel.innerHTML += `<option value="${p.id}">${p.name} (${p.team})</option>`);
}

function updateUI() {
    document.getElementById("gw-counter").innerText = userState.gameweek;
    document.getElementById("budget-val").innerText = userState.budget.toFixed(1);
    document.getElementById("points-val").innerText = userState.totalPoints;
    document.getElementById("last-gw-score").innerText = userState.lastGWPoints;
    document.getElementById("transfers-val").innerText = userState.freeTransfers;

    // Hits Logic
    const netT = calcNetTransfersMade();
    const hitCost = (netT > userState.freeTransfers && userState.activeChip !== 'wildcard' && userState.activeChip !== 'freehit') ? (netT - userState.freeTransfers) * 4 : 0;
    document.getElementById("transfer-hits-val").innerText = `-${hitCost}`;

    // Quotas
    const c = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    userState.squad.forEach(p => c[p.pos]++);
    ['gk','def','mid','fwd'].forEach(pos => {
        const el = document.getElementById(`q-${pos}`);
        if(el) el.innerText = `${pos.toUpperCase()}: ${c[pos.toUpperCase()]}/${pos==='gk'?2:pos==='fwd'?3:5}`;
    });

    ['wildcard', 'freehit', 'benchboost', 'triplecaptain'].forEach(chip => {
        const btn = document.getElementById(`chip-${chip}`);
        if(btn) {
            btn.className = "chip-btn";
            if (userState.usedChips[chip]) btn.classList.add("used");
            else if (userState.activeChip === chip) btn.classList.add("active");
        }
    });

    if (currentMode === 'pick-team') renderPitch('pick-pitch-xi', 'pick-pitch-bench');
    if (currentMode === 'transfers') { renderPitch('transfer-pitch-xi', 'transfer-pitch-bench'); renderMarket(); }
    if (currentMode === 'leagues') renderLeagues();
}

function resetAllData() { localStorage.clear(); location.reload(); }
