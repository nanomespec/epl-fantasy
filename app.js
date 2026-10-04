// Initialize Telegram WebApp SDK
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
    if (tg.initDataUnsafe?.user) {
        document.getElementById('manager-display').textContent = `Manager: ${tg.initDataUnsafe.user.first_name}`;
    }
}

// Master Player Database
const MARKET_PLAYERS = [
    { id: 1, name: "Lealem Birhanu", club: "Saint George", pos: "GKP", price: 5.0 },
    { id: 2, name: "Said Habtamu", club: "Ethiopian Coffee", pos: "GKP", price: 4.5 },
    { id: 3, name: "Nguemechieu P.", club: "Mekelakeya", pos: "GKP", price: 4.5 },
    
    { id: 4, name: "Aschalew Tamene", club: "Saint George", pos: "DEF", price: 5.5 },
    { id: 5, name: "Henok Adhyna", club: "Fasil Kenema", pos: "DEF", price: 5.0 },
    { id: 6, name: "Suleman Hamid", club: "Ethiopian Coffee", pos: "DEF", price: 4.5 },
    { id: 7, name: "Frimpong Yiadom", club: "Saint George", pos: "DEF", price: 5.0 },
    { id: 8, name: "Amanuel Terfa", club: "Mekelakeya", pos: "DEF", price: 4.5 },

    { id: 9, name: "Amanuel Yohannes", club: "Ethiopian Coffee", pos: "MID", price: 7.5 },
    { id: 10, name: "Biniam Belay", club: "Saint George", pos: "MID", price: 7.0 },
    { id: 11, name: "Gatoch Panom", club: "Fasil Kenema", pos: "MID", price: 6.5 },
    { id: 12, name: "Canaan Markneh", club: "Mekelakeya", pos: "MID", price: 7.0 },
    { id: 13, name: "Abdulkarim Worku", club: "Gondar", pos: "MID", price: 5.5 },

    { id: 14, name: "Abubeker Nasir", club: "Ethiopian Coffee", pos: "FWD", price: 10.0 },
    { id: 15, name: "Getaneh Kebede", club: "Fasil Kenema", pos: "FWD", price: 9.5 },
    { id: 16, name: "Chernet Gugsa", club: "Bahir Dar City", pos: "FWD", price: 8.0 }
];

// Persistent State
let userSquad = JSON.parse(localStorage.getItem("fpl_user_squad") || "{}");
let captainId = localStorage.getItem("fpl_captain") ? Number(localStorage.getItem("fpl_captain")) : null;
let viceCaptainId = localStorage.getItem("fpl_vc") ? Number(localStorage.getItem("fpl_vc")) : null;
let activeSlotId = null;
let activePos = null;

// Helpers
function calculateBudget() {
    let spent = 0;
    Object.values(userSquad).forEach(p => spent += p.price);
    return 100.0 - spent;
}

function getClubCount(clubName) {
    return Object.values(userSquad).filter(p => p.club === clubName).length;
}

// DOM Elements
const bankVal = document.getElementById("bank-val");
const countVal = document.getElementById("count-val");
const enterBtn = document.getElementById("enter-btn");
const marketModal = document.getElementById("market-modal");
const marketFilters = document.getElementById("market-filters");
const marketList = document.getElementById("market-list");
const modalTitle = document.getElementById("modal-title");
const closeModalBtn = document.getElementById("close-modal");
const searchInput = document.getElementById("search-input");
const clubSelect = document.getElementById("club-select");

// Populate Club Filter Options dynamically
function populateClubFilter() {
    const clubs = [...new Set(MARKET_PLAYERS.map(p => p.club))];
    clubSelect.innerHTML = `<option value="ALL">All Clubs</option>`;
    clubs.forEach(c => {
        clubSelect.innerHTML += `<option value="${c}">${c}</option>`;
    });
}
populateClubFilter();

// Attach Slot Listeners
document.querySelectorAll(".slot-wrapper").forEach(slotEl => {
    slotEl.addEventListener("click", () => {
        const slotId = slotEl.dataset.slotId;
        const requiredPos = slotEl.dataset.pos;

        if (userSquad[slotId]) {
            openPlayerActionMenu(slotId);
        } else {
            openMarketForSlot(slotId, requiredPos);
        }
    });
});

// Filled Slot Action Menu
function openPlayerActionMenu(slotId) {
    const player = userSquad[slotId];
    activeSlotId = slotId;
    modalTitle.textContent = `${player.name} (${player.pos})`;
    marketFilters.style.display = "none";

    const isC = captainId === player.id;
    const isVC = viceCaptainId === player.id;

    marketList.innerHTML = `
        <div class="player-actions">
            <button class="action-option-btn" onclick="setCaptain(${player.id})">
                ${isC ? "✓ Current Captain" : "Make Captain (C)"}
            </button>
            <button class="action-option-btn" onclick="setViceCaptain(${player.id})">
                ${isVC ? "✓ Current Vice-Captain" : "Make Vice-Captain (V)"}
            </button>
            <button class="action-option-btn remove" onclick="removePlayerFromSlot('${slotId}')">
                Remove Player
            </button>
        </div>
    `;
    marketModal.classList.add("active");
}

function setCaptain(playerId) {
    if (viceCaptainId === playerId) viceCaptainId = null;
    captainId = playerId;
    saveState();
    closeMarketModal();
    updateUI();
}

function setViceCaptain(playerId) {
    if (captainId === playerId) captainId = null;
    viceCaptainId = playerId;
    saveState();
    closeMarketModal();
    updateUI();
}

// Transfer Market Logic
function openMarketForSlot(slotId, pos) {
    activeSlotId = slotId;
    activePos = pos;
    marketFilters.style.display = "flex";
    searchInput.value = "";
    clubSelect.value = "ALL";
    renderMarketList();
    marketModal.classList.add("active");
}

function renderMarketList() {
    const budget = calculateBudget();
    modalTitle.textContent = `Select ${activePos} (Budget: £${budget.toFixed(1)}m)`;
    marketList.innerHTML = "";

    const query = searchInput.value.toLowerCase().trim();
    const selectedClub = clubSelect.value;

    const available = MARKET_PLAYERS.filter(p => {
        const alreadyChosen = Object.values(userSquad).some(s => s.id === p.id);
        const matchesPos = p.pos === activePos;
        const matchesSearch = p.name.toLowerCase().includes(query);
        const matchesClub = selectedClub === "ALL" || p.club === selectedClub;
        return matchesPos && !alreadyChosen && matchesSearch && matchesClub;
    });

    if (available.length === 0) {
        marketList.innerHTML = `<p style="color:#aaa; text-align:center; padding: 20px 0;">No matching players found.</p>`;
        return;
    }

    available.forEach(p => {
        const canAfford = budget >= p.price;
        const clubCount = getClubCount(p.club);
        const clubLimitReached = clubCount >= 3;

        let btnText = "Buy";
        let canBuy = true;

        if (!canAfford) {
            btnText = "Too Costly";
            canBuy = false;
        } else if (clubLimitReached) {
            btnText = "Club Limit (3/3)";
            canBuy = false;
        }

        marketList.innerHTML += `
            <div class="market-item">
                <div class="p-info">
                    <strong>${p.name}</strong>
                    <span>${p.club} (${clubCount}/3) • £${p.price.toFixed(1)}m</span>
                </div>
                <button class="add-player-btn" ${canBuy ? "" : "disabled"} onclick="selectPlayer(${p.id})">
                    ${btnText}
                </button>
            </div>
        `;
    });
}

// Search & Club Filter Events
searchInput.addEventListener("input", renderMarketList);
clubSelect.addEventListener("change", renderMarketList);

function selectPlayer(playerId) {
    const player = MARKET_PLAYERS.find(p => p.id === playerId);
    if (!player || calculateBudget() < player.price || getClubCount(player.club) >= 3) return;

    userSquad[activeSlotId] = player;
    
    if (!captainId) captainId = player.id;
    else if (!viceCaptainId && captainId !== player.id) viceCaptainId = player.id;

    saveState();
    closeMarketModal();
    updateUI();
}

function removePlayerFromSlot(slotId) {
    const player = userSquad[slotId];
    if (player) {
        if (captainId === player.id) captainId = null;
        if (viceCaptainId === player.id) viceCaptainId = null;
        delete userSquad[slotId];
        saveState();
        closeMarketModal();
        updateUI();
    }
}

closeModalBtn.addEventListener("click", closeMarketModal);
function closeMarketModal() {
    marketModal.classList.remove("active");
    activeSlotId = null;
    activePos = null;
}

function saveState() {
    localStorage.setItem("fpl_user_squad", JSON.stringify(userSquad));
    if (captainId) localStorage.setItem("fpl_captain", captainId);
    if (viceCaptainId) localStorage.setItem("fpl_vc", viceCaptainId);
}

function updateUI() {
    const count = Object.keys(userSquad).length;
    const remainingBudget = calculateBudget();

    bankVal.textContent = `£${remainingBudget.toFixed(1)}m`;
    countVal.textContent = `${count} / 15`;
    enterBtn.disabled = count !== 15;

    document.querySelectorAll(".slot-wrapper").forEach(slotEl => {
        const slotId = slotEl.dataset.slotId;
        const pos = slotEl.dataset.pos;
        const player = userSquad[slotId];

        if (player) {
            const isC = captainId === player.id;
            const isVC = viceCaptainId === player.id;
            const badgeHTML = isC ? `<div class="captain-badge">C</div>` : isVC ? `<div class="vc-badge">V</div>` : "";

            slotEl.innerHTML = `
                <div class="player-slot filled">
                    ${badgeHTML}
                    <span class="p-shirt">👕</span>
                    <span class="p-name">${player.name.split(" ")[0]}</span>
                    <span class="p-price">£${player.price.toFixed(1)}m</span>
                </div>
            `;
        } else {
            const isBench = slotEl.closest(".bench-panel") !== null;
            slotEl.innerHTML = `
                <div class="player-slot empty ${isBench ? "bench-slot" : ""}">
                    <div class="plus-btn">+</div>
                    <span class="pos-tag">${pos}</span>
                </div>
            `;
        }
    });
}

// Auto Pick respecting Club Limits & Budget
document.getElementById("autopick-btn").addEventListener("click", () => {
    userSquad = {};
    captainId = null;
    viceCaptainId = null;

    document.querySelectorAll(".slot-wrapper").forEach(slotEl => {
        const slotId = slotEl.dataset.slotId;
        const pos = slotEl.dataset.pos;

        const available = MARKET_PLAYERS.filter(p => {
            const chosen = Object.values(userSquad).some(s => s.id === p.id);
            const canAfford = calculateBudget() >= p.price;
            const underClubLimit = getClubCount(p.club) < 3;
            return p.pos === pos && !chosen && canAfford && underClubLimit;
        });

        if (available.length > 0) {
            const pick = available[Math.floor(Math.random() * available.length)];
            userSquad[slotId] = pick;
        }
    });

    const squadList = Object.values(userSquad);
    if (squadList.length > 0) captainId = squadList[0].id;
    if (squadList.length > 1) viceCaptainId = squadList[1].id;

    saveState();
    updateUI();
});

// Reset
document.getElementById("reset-btn").addEventListener("click", () => {
    userSquad = {};
    captainId = null;
    viceCaptainId = null;
    localStorage.clear();
    updateUI();
});

// Enter Squad
enterBtn.addEventListener("click", () => {
    if (Object.keys(userSquad).length === 15) {
        if (tg?.showAlert) {
            tg.showAlert("Squad & Captains saved successfully for Gameweek 1!");
        } else {
            alert("Squad & Captains saved successfully for Gameweek 1!");
        }
    }
});

updateUI();
