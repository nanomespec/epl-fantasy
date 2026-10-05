/* ==========================================================================
   ETHIOPIAN PREMIER LEAGUE FANTASY — COMPLETE APP LOGIC
   ========================================================================== */

// --- 1. DEFAULT DATA & INITIAL STATE ---
const INITIAL_PLAYERS = [
    { id: 1, name: "Abebe Tilahun", pos: "GK", club: "St. George", price: 5.0, score: 0 },
    { id: 2, name: "Bahiru Negash", pos: "GK", club: "Ethiopia Bunna", price: 4.5, score: 0 },
    { id: 3, name: "Aschalew Tamene", pos: "DEF", club: "Fasil Kenema", price: 5.5, score: 0 },
    { id: 4, name: "Yared Bayeh", pos: "DEF", club: "Bahir Dar", price: 5.0, score: 0 },
    { id: 5, name: "Suleman Hamid", pos: "DEF", club: "St. George", price: 4.5, score: 0 },
    { id: 6, name: "Henok Gebre", pos: "DEF", club: "Ethiopia Bunna", price: 4.5, score: 0 },
    { id: 7, name: "Ramkel Lok", pos: "DEF", club: "EEPCO", price: 4.0, score: 0 },
    { id: 8, name: "Gatoch Panom", pos: "MID", club: "St. George", price: 6.5, score: 0 },
    { id: 9, name: "Surafel Dagnachew", pos: "MID", club: "Fasil Kenema", price: 7.0, score: 0 },
    { id: 10, name: "Amanuel Yohannes", pos: "MID", club: "Ethiopia Bunna", price: 6.0, score: 0 },
    { id: 11, name: "Canaan Markneh", pos: "MID", club: "Defense Force", price: 5.5, score: 0 },
    { id: 12, name: "Biniyam Fikre", pos: "MID", club: "Sidama Bunna", price: 5.0, score: 0 },
    { id: 13, name: "Getaneh Kebede", pos: "FWD", club: "Wolkite", price: 8.0, score: 0 },
    { id: 14, name: "Abel Yalew", pos: "FWD", club: "mechal", price: 7.5, score: 0 },
    { id: 15, name: "Dawa Hotessa", pos: "FWD", club: "Adama City", price: 6.5, score: 0 },
    { id: 16, name: "Chernet Gugsa", pos: "FWD", club: "Bahir Dar", price: 6.0, score: 0 }
];

const DEFAULT_STATE = {
    currentGw: 1,
    budget: 100.0,
    overallPoints: 0,
    gwPoints: 0,
    highestPoints: 0,
    transfersCost: 0,
    freeTransfers: 1,
    activeChip: null, // 'wildcard', 'freehit', 'benchboost', 'triplecaptain'
    squad: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    startingXI: [1, 3, 4, 5, 8, 9, 10, 11, 13, 14, 15],
    bench: [2, 6, 7, 12], // [GK2, Sub1, Sub2, Sub3]
    captain: 13,
    viceCaptain: 8,
    pendingTransfers: { out: [], in: [] },
    adminOverrides: {},
    classicLeague: [
        { rank: 1, team: "nanome", manager: "Nate", gw: 0, total: 0 },
        { rank: 2, team: "Sheger Warriors", manager: "Dawit", gw: 0, total: 0 },
        { rank: 3, team: "Fasil Lions", manager: "Kaleb", gw: 0, total: 0 },
        { rank: 4, team: "Bunna Kings", manager: "Yonas", gw: 0, total: 0 }
    ],
    h2hLeague: [
        { rank: 1, team: "nanome", w: 0, d: 0, l: 0, pts: 0 },
        { rank: 2, team: "Sheger Warriors", w: 0, d: 0, l: 0, pts: 0 },
        { rank: 3, team: "Fasil Lions", w: 0, d: 0, l: 0, pts: 0 },
        { rank: 4, team: "Bunna Kings", w: 0, d: 0, l: 0, pts: 0 }
    ],
    h2hFixtures: []
};

let state = JSON.parse(localStorage.getItem('epl_fantasy_state')) || DEFAULT_STATE;
let selectedSwapId = null;

// --- 2. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    populateAdminSelect();
    renderAll();
});

function saveState() {
    localStorage.setItem('epl_fantasy_state', JSON.stringify(state));
}

function renderAll() {
    renderDashboard();
    renderPickPitch();
    renderTransferPitch();
    renderMarket();
    renderLeagues();
    saveState();
}

// --- 3. NAVIGATION & TAB SWITCHING ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

function switchLcTab(tabName) {
    const leaguesView = document.getElementById('lc-view-leagues');
    const cupsView = document.getElementById('lc-view-cups');
    const toggleBtns = document.querySelectorAll('.lc-toggle-btn');

    toggleBtns.forEach(btn => btn.classList.remove('active'));

    if (tabName === 'leagues') {
        leaguesView.style.display = 'block';
        cupsView.style.display = 'none';
        toggleBtns[0].classList.add('active');
    } else {
        leaguesView.style.display = 'none';
        cupsView.style.display = 'block';
        toggleBtns[1].classList.add('active');
    }
}

// --- 4. DASHBOARD RENDERING ---
function renderDashboard() {
    document.getElementById('dash-gw').textContent = state.currentGw;
    document.getElementById('dash-avg').textContent = Math.round(state.overallPoints / Math.max(state.currentGw - 1, 1));
    document.getElementById('dash-highest').textContent = state.highestPoints;
    document.getElementById('dash-total-pts').textContent = state.overallPoints;
    document.getElementById('overall-pts-val').textContent = state.overallPoints;
    document.getElementById('budget-val').textContent = state.budget.toFixed(1);

    const chipBar = document.getElementById('dash-chip-bar');
    const chipName = document.getElementById('dash-chip-name');
    if (state.activeChip) {
        chipBar.style.display = 'block';
        const labels = { wildcard: 'Wildcard', freehit: 'Free Hit', benchboost: 'Bench Boost', triplecaptain: 'Triple Captain' };
        chipName.textContent = labels[state.activeChip];
    } else {
        chipBar.style.display = 'none';
    }

    // Formation text
    const xiPlayers = state.startingXI.map(id => INITIAL_PLAYERS.find(p => p.id === id));
    const defs = xiPlayers.filter(p => p.pos === 'DEF').length;
    const mids = xiPlayers.filter(p => p.pos === 'MID').length;
    const fwds = xiPlayers.filter(p => p.pos === 'FWD').length;
    document.getElementById('formation-display').textContent = `Formation: ${defs}-${mids}-${fwds}`;
}

// --- 5. PITCH RENDERING (PICK TEAM) ---
function renderPickPitch() {
    const xiContainer = document.getElementById('pick-pitch-xi');
    const benchContainer = document.getElementById('pick-pitch-bench');
    xiContainer.innerHTML = '';
    benchContainer.innerHTML = '';

    const xiPlayers = state.startingXI.map(id => INITIAL_PLAYERS.find(p => p.id === id));
    const rows = {
        GK: xiPlayers.filter(p => p.pos === 'GK'),
        DEF: xiPlayers.filter(p => p.pos === 'DEF'),
        MID: xiPlayers.filter(p => p.pos === 'MID'),
        FWD: xiPlayers.filter(p => p.pos === 'FWD')
    };

    ['GK', 'DEF', 'MID', 'FWD'].forEach(pos => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'pitch-row';
        rows[pos].forEach(player => {
            rowDiv.appendChild(createPlayerElement(player, true));
        });
        xiContainer.appendChild(rowDiv);
    });

    state.bench.forEach(id => {
        const player = INITIAL_PLAYERS.find(p => p.id === id);
        benchContainer.appendChild(createPlayerElement(player, false));
    });
}

function createPlayerElement(player, isStarting) {
    const el = document.createElement('div');
    el.className = 'player-marker';
    if (selectedSwapId === player.id) el.style.outline = '2px solid var(--fpl-green)';

    let badge = '';
    if (player.id === state.captain) badge = '<div class="p-badge">C</div>';
    else if (player.id === state.viceCaptain) badge = '<div class="p-badge">V</div>';

    el.innerHTML = `
        ${badge}
        <div class="shirt" style="background-image: url('https://fantasy.premierleague.com/static/media/shirts/standard/shirt_0-66.png');"></div>
        <div class="p-name">${player.name.split(' ')[0]}</div>
        <div class="p-score">${player.score} pts</div>
    `;

    el.onclick = () => handlePlayerClick(player.id, isStarting);
    return el;
}

// --- 6. PLAYER INTERACTION & MODALS ---
function handlePlayerClick(id, isStarting) {
    if (selectedSwapId !== null) {
        if (selectedSwapId === id) {
            selectedSwapId = null;
        } else {
            swapPlayers(selectedSwapId, id);
            selectedSwapId = null;
        }
        renderPickPitch();
        renderDashboard();
        return;
    }

    const player = INITIAL_PLAYERS.find(p => p.id === id);
    const modal = document.getElementById('player-modal');
    document.getElementById('modal-p-name').textContent = player.name;
    document.getElementById('modal-p-info').textContent = `${player.pos} | ${player.club} | £${player.price}m`;

    const actions = document.getElementById('modal-actions');
    actions.innerHTML = `
        <button class="action-btn" onclick="initiateSwap(${player.id})">Swap Player</button>
        ${isStarting ? `<button class="action-btn" onclick="makeCaptain(${player.id})">Make Captain</button>` : ''}
        ${isStarting ? `<button class="action-btn" onclick="makeViceCaptain(${player.id})">Make Vice-Captain</button>` : ''}
    `;

    modal.classList.add('active');
}

function initiateSwap(id) {
    selectedSwapId = id;
    closeModal();
    renderPickPitch();
}

function swapPlayers(id1, id2) {
    const inXI1 = state.startingXI.includes(id1);
    const inXI2 = state.startingXI.includes(id2);

    if (inXI1 && !inXI2) {
        state.startingXI = state.startingXI.map(id => id === id1 ? id2 : id);
        state.bench = state.bench.map(id => id === id2 ? id1 : id);
    } else if (!inXI1 && inXI2) {
        state.startingXI = state.startingXI.map(id => id === id2 ? id1 : id);
        state.bench = state.bench.map(id => id === id1 ? id2 : id);
    } else {
        alert("Select one starting player and one bench player to swap.");
    }
}

function makeCaptain(id) {
    if (state.viceCaptain === id) state.viceCaptain = state.captain;
    state.captain = id;
    closeModal();
    renderPickPitch();
}

function makeViceCaptain(id) {
    if (state.captain === id) state.captain = state.viceCaptain;
    state.viceCaptain = id;
    closeModal();
    renderPickPitch();
}

function closeModal() {
    document.getElementById('player-modal').classList.remove('active');
}

// --- 7. CHIPS ---
function toggleChip(chipKey) {
    if (state.activeChip === chipKey) {
        state.activeChip = null;
    } else {
        state.activeChip = chipKey;
    }
    
    document.querySelectorAll('.chip-btn').forEach(btn => btn.classList.remove('active'));
    if (state.activeChip) {
        document.getElementById(`chip-${state.activeChip}`).classList.add('active');
    }
    renderDashboard();
    saveState();
}

// --- 8. TRANSFERS & MARKET ---
function renderTransferPitch() {
    const xiContainer = document.getElementById('transfer-pitch-xi');
    const benchContainer = document.getElementById('transfer-pitch-bench');
    xiContainer.innerHTML = '';
    benchContainer.innerHTML = '';

    const xiPlayers = state.startingXI.map(id => INITIAL_PLAYERS.find(p => p.id === id));
    ['GK', 'DEF', 'MID', 'FWD'].forEach(pos => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'pitch-row';
        xiPlayers.filter(p => p.pos === pos).forEach(player => {
            const el = createTransferMarker(player);
            rowDiv.appendChild(el);
        });
        xiContainer.appendChild(rowDiv);
    });

    state.bench.forEach(id => {
        const player = INITIAL_PLAYERS.find(p => p.id === id);
        benchContainer.appendChild(createTransferMarker(player));
    });

    document.getElementById('transfer-hits-val').textContent = state.transfersCost;
}

function createTransferMarker(player) {
    const el = document.createElement('div');
    el.className = 'player-marker';
    el.innerHTML = `
        <div class="shirt" style="background-image: url('https://fantasy.premierleague.com/static/media/shirts/standard/shirt_0-66.png');"></div>
        <div class="p-name">${player.name.split(' ')[0]}</div>
        <div class="p-score">£${player.price}m</div>
    `;
    el.onclick = () => sellPlayer(player.id);
    return el;
}

function renderMarket() {
    const search = document.getElementById('market-search').value.toLowerCase();
    const posFilter = document.getElementById('market-filter-pos').value;
    const maxPrice = parseFloat(document.getElementById('market-max-price').value) || 99;

    const squadPlayers = state.squad.map(id => INITIAL_PLAYERS.find(p => p.id === id));
    const counts = {
        GK: squadPlayers.filter(p => p.pos === 'GK').length,
        DEF: squadPlayers.filter(p => p.pos === 'DEF').length,
        MID: squadPlayers.filter(p => p.pos === 'MID').length,
        FWD: squadPlayers.filter(p => p.pos === 'FWD').length
    };

    document.getElementById('q-gk').textContent = `GK: ${counts.GK}/2`;
    document.getElementById('q-def').textContent = `DEF: ${counts.DEF}/5`;
    document.getElementById('q-mid').textContent = `MID: ${counts.MID}/5`;
    document.getElementById('q-fwd').textContent = `FWD: ${counts.FWD}/3`;

    const marketList = document.getElementById('market-list');
    marketList.innerHTML = '';

    INITIAL_PLAYERS.filter(p => {
        return !state.squad.includes(p.id) &&
               p.name.toLowerCase().includes(search) &&
               (posFilter === 'ALL' || p.pos === posFilter) &&
               p.price <= maxPrice;
    }).forEach(player => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${player.name}</strong><br><small>${player.club} (${player.pos})</small></td>
            <td>£${player.price}m</td>
            <td><button class="action-btn" style="padding:4px 8px; font-size:0.8rem;" onclick="buyPlayer(${player.id})">Buy</button></td>
        `;
        marketList.appendChild(tr);
    });
}

function sellPlayer(id) {
    if (state.squad.length <= 11) {
        alert("You must keep at least 11 players.");
        return;
    }
    const player = INITIAL_PLAYERS.find(p => p.id === id);
    state.squad = state.squad.filter(pId => pId !== id);
    state.startingXI = state.startingXI.filter(pId => pId !== id);
    state.bench = state.bench.filter(pId => pId !== id);
    state.budget += player.price;
    state.pendingTransfers.out.push(id);

    renderTransferPitch();
    renderMarket();
    renderDashboard();
}

function buyPlayer(id) {
    const player = INITIAL_PLAYERS.find(p => p.id === id);
    if (state.budget < player.price) {
        alert("Not enough budget remaining!");
        return;
    }

    state.squad.push(id);
    if (state.startingXI.length < 11) state.startingXI.push(id);
    else state.bench.push(id);

    state.budget -= player.price;
    state.pendingTransfers.in.push(id);

    if (state.pendingTransfers.in.length > state.freeTransfers && state.activeChip !== 'wildcard' && state.activeChip !== 'freehit') {
        state.transfersCost = (state.pendingTransfers.in.length - state.freeTransfers) * 4;
    }

    renderTransferPitch();
    renderMarket();
    renderDashboard();
}

function resetTransfers() {
    state = JSON.parse(localStorage.getItem('epl_fantasy_state')) || DEFAULT_STATE;
    state.pendingTransfers = { out: [], in: [] };
    state.transfersCost = 0;
    renderAll();
}

// --- 9. LEAGUES & CUPS ---
function renderLeagues() {
    const classicBody = document.getElementById('classic-league-body');
    classicBody.innerHTML = '';
    state.classicLeague.forEach(row => {
        classicBody.innerHTML += `
            <tr>
                <td>${row.rank}</td>
                <td><strong>${row.team}</strong><br><small>${row.manager}</small></td>
                <td>${row.gw}</td>
                <td><strong>${row.total}</strong></td>
            </tr>
        `;
    });

    const h2hBody = document.getElementById('h2h-league-body');
    h2hBody.innerHTML = '';
    state.h2hLeague.forEach(row => {
        h2hBody.innerHTML += `
            <tr>
                <td>${row.rank}</td>
                <td><strong>${row.team}</strong></td>
                <td>${row.w}</td>
                <td>${row.d}</td>
                <td>${row.l}</td>
                <td><strong>${row.pts}</strong></td>
            </tr>
        `;
    });
}

function openJoinLeagueModal() { alert("Private League Code entry form."); }
function openCreateLeagueModal() { alert("League creation panel initialized."); }
function renewLeagues() { alert("Leagues from last season successfully renewed!"); }

// --- 10. ADMIN & SIMULATION ENGINE ---
function populateAdminSelect() {
    const sel = document.getElementById('admin-player-select');
    sel.innerHTML = '';
    INITIAL_PLAYERS.forEach(p => {
        sel.innerHTML += `<option value="${p.id}">${p.name} (${p.club})</option>`;
    });
}

function applyAdminStats() {
    const pId = parseInt(document.getElementById('admin-player-select').value);
    state.adminOverrides[pId] = {
        mins: parseInt(document.getElementById('admin-mins').value) || 0,
        goals: parseInt(document.getElementById('admin-goals').value) || 0,
        assists: parseInt(document.getElementById('admin-assists').value) || 0,
        yc: parseInt(document.getElementById('admin-yc').value) || 0,
        rc: parseInt(document.getElementById('admin-rc').value) || 0,
        cs: parseInt(document.getElementById('admin-cleansheet').value) === 1
    };
    alert("Stats queued for Gameweek simulation!");
}

function simulateGameweek() {
    let gwTotal = 0;

    // Calculate score for each player
    INITIAL_PLAYERS.forEach(player => {
        let stats = state.adminOverrides[player.id] || generateRandomStats(player);
        let pts = 0;

        if (stats.mins > 0) pts += (stats.mins >= 60) ? 2 : 1;
        
        // Goals
        if (player.pos === 'FWD') pts += stats.goals * 4;
        else if (player.pos === 'MID') pts += stats.goals * 5;
        else pts += stats.goals * 6;

        // Assists
        pts += stats.assists * 3;

        // Clean Sheet
        if (stats.cs && stats.mins >= 60) {
            if (player.pos === 'GK' || player.pos === 'DEF') pts += 4;
            else if (player.pos === 'MID') pts += 1;
        }

        // Cards
        pts -= stats.yc * 1;
        pts -= stats.rc * 3;

        player.score = pts;
    });

    // Starting XI Scoring
    state.startingXI.forEach(id => {
        const player = INITIAL_PLAYERS.find(p => p.id === id);
        let multiplier = 1;
        if (id === state.captain) multiplier = (state.activeChip === 'triplecaptain') ? 3 : 2;
        gwTotal += player.score * multiplier;
    });

    // Bench Boost
    if (state.activeChip === 'benchboost') {
        state.bench.forEach(id => {
            const player = INITIAL_PLAYERS.find(p => p.id === id);
            gwTotal += player.score;
        });
    }

    // Deduct Transfer Hits
    gwTotal -= state.transfersCost;

    // Update Totals
    state.gwPoints = gwTotal;
    state.overallPoints += gwTotal;
    state.highestPoints = Math.max(state.highestPoints, gwTotal);
    state.currentGw += 1;
    state.transfersCost = 0;
    state.activeChip = null;
    state.adminOverrides = {};

    // AI Opponents Sim
    state.classicLeague.forEach(row => {
        if (row.team === 'nanome') {
            row.gw = gwTotal;
            row.total = state.overallPoints;
        } else {
            const simOpp = Math.floor(Math.random() * 40) + 30;
            row.gw = simOpp;
            row.total += simOpp;
        }
    });
    state.classicLeague.sort((a, b) => b.total - a.total);
    state.classicLeague.forEach((r, idx) => r.rank = idx + 1);

    renderAll();
    alert(`Gameweek Simulated! You scored ${gwTotal} points.`);
}

function generateRandomStats(player) {
    const mins = Math.random() > 0.1 ? 90 : 0;
    if (mins === 0) return { mins: 0, goals: 0, assists: 0, yc: 0, rc: 0, cs: false };
    return {
        mins,
        goals: Math.random() < (player.pos === 'FWD' ? 0.35 : 0.15) ? 1 : 0,
        assists: Math.random() < 0.2 ? 1 : 0,
        yc: Math.random() < 0.1 ? 1 : 0,
        rc: 0,
        cs: Math.random() < 0.4
    };
}

function resetAllData() {
    if (confirm("Are you sure you want to reset all game progress?")) {
        localStorage.removeItem('epl_fantasy_state');
        state = DEFAULT_STATE;
        renderAll();
    }
}
