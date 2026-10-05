// Ethiopian Premier League Player Dataset & Market
const players = [
    // Saint George SC
    { id: 1, name: "Chernet Gugsa", team: "Saint George SC", pos: "MID", price: 8.5, points: 0 },
    { id: 2, name: "Ramkel Lok", team: "Saint George SC", pos: "FWD", price: 9.0, points: 0 },
    { id: 3, name: "Lealem Birhanu", team: "Saint George SC", pos: "GK", price: 5.5, points: 0 },

    // Ethiopian Coffee SC (Bunna)
    { id: 4, name: "Abubeker Nasir", team: "Ethiopian Coffee SC", pos: "FWD", price: 9.5, points: 0 },
    { id: 5, name: "Wogene Gezahegn", team: "Ethiopian Coffee SC", pos: "MID", price: 7.5, points: 0 },
    { id: 6, name: "Aschalew Tamene", team: "Ethiopian Coffee SC", pos: "DEF", price: 6.5, points: 0 },

    // Sidama Bunna
    { id: 7, name: "Yidnekachew Ali", team: "Sidama Bunna", pos: "GK", price: 5.0, points: 0 },
    { id: 8, name: "Safee Assefa", team: "Sidama Bunna", pos: "FWD", price: 8.0, points: 0 },

    // Fasil Kenema
    { id: 9, name: "Surafel Dagnachew", team: "Fasil Kenema", pos: "MID", price: 9.0, points: 0 },
    { id: 10, name: "Oumed Oukri", team: "Fasil Kenema", pos: "FWD", price: 8.0, points: 0 },

    // Defense Force SC (Mekelakeya)
    { id: 11, name: "Firew Solomon", team: "Defense Force SC", pos: "DEF", price: 6.0, points: 0 },
    { id: 12, name: "Mintesinot Allo", team: "Defense Force SC", pos: "GK", price: 5.5, points: 0 },

    // Bahir Dar Kenema
    { id: 13, name: "Fereb Zewdu", team: "Bahir Dar Kenema", pos: "MID", price: 7.0, points: 0 },
    { id: 14, name: "Ali Sulieman", team: "Bahir Dar Kenema", pos: "FWD", price: 8.5, points: 0 }
];

// User Squad State
let userSquad = {
    players: [],
    budget: 100.0,
    totalPoints: 0,
    maxPerTeam: 3
};

// Initialize App on Load
document.addEventListener("DOMContentLoaded", () => {
    renderMarket(players);
    setupEventListeners();
    renderPitch();
});

// Switch between tabs ("squad" or "market")
function switchTab(tabId) {
    document.querySelectorAll(".view-section").forEach(sec => {
        sec.style.display = "none";
        sec.classList.remove("active");
    });

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    const targetSection = document.getElementById(`${tabId}-section`);
    if (targetSection) {
        targetSection.style.display = "block";
        targetSection.classList.add("active");
    }

    event.currentTarget.classList.add("active");
}

// Render Player Market Table
function renderMarket(dataToRender) {
    const marketBody = document.getElementById("player-market-body");
    marketBody.innerHTML = "";

    dataToRender.forEach(player => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><strong>${player.name}</strong></td>
            <td>${player.team}</td>
            <td><span class="badge ${player.pos}">${player.pos}</span></td>
            <td>${player.price.toFixed(1)}M ETB</td>
            <td><button class="add-btn" onclick="addPlayerToSquad(${player.id})">Add</button></td>
        `;
        marketBody.appendChild(row);
    });
}

// Add Player Logic & Validation
function addPlayerToSquad(playerId) {
    const playerToAdd = players.find(p => p.id === playerId);
    if (!playerToAdd) return;

    // Check budget
    if (userSquad.budget - playerToAdd.price < 0) {
        alert("Not enough budget to sign this player!");
        return;
    }

    // Check max squad capacity (15 players)
    if (userSquad.players.length >= 15) {
        alert("Your squad is already full (15/15 players)!");
        return;
    }

    // Check max 3 players per club limit
    const clubCount = userSquad.players.filter(p => p.team === playerToAdd.team).length;
    if (clubCount >= userSquad.maxPerTeam) {
        alert(`Rule violation: Maximum of ${userSquad.maxPerTeam} players allowed from ${playerToAdd.team}!`);
        return;
    }

    // Check duplicate selection
    if (userSquad.players.some(p => p.id === playerToAdd.id)) {
        alert("Player is already in your squad!");
        return;
    }

    // Add to squad and deduct budget
    userSquad.players.push(playerToAdd);
    userSquad.budget -= playerToAdd.price;
    userSquad.totalPoints += playerToAdd.points;

    updateStatsUI();
    renderPitch();
    alert(`Successfully signed ${playerToAdd.name}!`);
}

// Render Players onto the Visual Pitch
function renderPitch() {
    const positions = ['GK', 'DEF', 'MID', 'FWD'];
    
    positions.forEach(pos => {
        const row = document.getElementById(`pitch-${pos}`);
        if (!row) return;
        
        row.innerHTML = "";
        const posPlayers = userSquad.players.filter(p => p.pos === pos);

        if (posPlayers.length === 0) {
            row.innerHTML = `<div class="player-slot placeholder">Empty ${pos}</div>`;
        } else {
            posPlayers.forEach(player => {
                const playerCard = document.createElement("div");
                playerCard.className = "player-slot";
                playerCard.innerHTML = `
                    <div class="pitch-player-name">${player.name.split(" ").pop()}</div>
                    <div class="pitch-player-price">${player.price.toFixed(1)}M</div>
                `;
                row.appendChild(playerCard);
            });
        }
    });
}

// Update Top Bar UI Stats
function updateStatsUI() {
    document.getElementById("budget-val").innerText = userSquad.budget.toFixed(1);
    document.getElementById("points-val").innerText = userSquad.totalPoints;
}

// Search and Position Filtering
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

    searchBar.addEventListener("input", filterHandler);
    posFilter.addEventListener("change", filterHandler);
}
