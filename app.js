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

// App State (15 empty slots initially)
let userSquad = {}; // Map slotId -> player Object
let remainingBudget = 100.0;
let activeSlotId = null;

// DOM Elements
const bankVal = document.getElementById("bank-val");
const countVal = document.getElementById("count-val");
const enterBtn = document.getElementById("enter-btn");
const marketModal = document.getElementById("market-modal");
const marketList = document.getElementById("market-list");
const modalTitle = document.getElementById("modal-title");
const closeModalBtn = document.getElementById("close-modal");

// Attach click listeners to all 15 pitch & bench slots
document.querySelectorAll(".slot-wrapper").forEach(slotEl => {
    slotEl.addEventListener("click", () => {
        const slotId = slotEl.dataset.slotId;
        const requiredPos = slotEl.dataset.pos;

        if (userSquad[slotId]) {
            // Remove player if slot is filled
            removePlayerFromSlot(slotId);
        } else {
            // Open market for this position
            openMarketForSlot(slotId, requiredPos);
        }
    });
});

// Open Market Modal
function openMarketForSlot(slotId, pos) {
    activeSlotId = slotId;
    modalTitle.textContent = `Select ${pos} (Budget: £${remainingBudget.toFixed(1)}m)`;
    marketList.innerHTML = "";

    const availablePlayers = MARKET_PLAYERS.filter(p => {
        const alreadyInSquad = Object.values(userSquad).some(s => s.id === p.id);
        return p.pos === pos && !alreadyInSquad;
    });

    if (availablePlayers.length === 0) {
        marketList.innerHTML = `<p style="color:#aaa; text-align:center;">No available players for this position.</p>`;
    } else {
        availablePlayers.forEach(p => {
            const canAfford = remainingBudget >= p.price;
            marketList.innerHTML += `
                <div class="market-item">
                    <div class="p-info">
                        <strong>${p.name}</strong>
                        <span>${p.club} • £${p.price.toFixed(1)}m</span>
                    </div>
                    <button class="add-player-btn" ${canAfford ? "" : "disabled style='opacity:0.4'"} onclick="selectPlayer(${p.id})">
                        ${canAfford ? "Buy" : "Too Expensive"}
                    </button>
                </div>
            `;
        });
    }

    marketModal.classList.add("active");
}

// Select player from market
function selectPlayer(playerId) {
    const player = MARKET_PLAYERS.find(p => p.id === playerId);
    if (!player || remainingBudget < player.price) return;

    userSquad[activeSlotId] = player;
    remainingBudget -= player.price;

    closeMarketModal();
    updateUI();
}

// Remove player from slot
function removePlayerFromSlot(slotId) {
    const player = userSquad[slotId];
    if (player) {
        remainingBudget += player.price;
        delete userSquad[slotId];
        updateUI();
    }
}

// Close Modal
closeModalBtn.addEventListener("click", closeMarketModal);
function closeMarketModal() {
    marketModal.classList.remove("active");
    activeSlotId = null;
}

// Render UI & Stats
function updateUI() {
    const count = Object.keys(userSquad).length;
    
    // Update Header
    bankVal.textContent = `£${remainingBudget.toFixed(1)}m`;
    countVal.textContent = `${count} / 15`;
    enterBtn.disabled = count !== 15;

    // Update Pitch Slots
    document.querySelectorAll(".slot-wrapper").forEach(slotEl => {
        const slotId = slotEl.dataset.slotId;
        const pos = slotEl.dataset.pos;
        const player = userSquad[slotId];

        if (player) {
            slotEl.innerHTML = `
                <div class="player-slot filled">
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

// Auto Pick Button
document.getElementById("autopick-btn").addEventListener("click", () => {
    userSquad = {};
    remainingBudget = 100.0;

    document.querySelectorAll(".slot-wrapper").forEach(slotEl => {
        const slotId = slotEl.dataset.slotId;
        const pos = slotEl.dataset.pos;

        const available = MARKET_PLAYERS.filter(p => {
            const chosen = Object.values(userSquad).some(s => s.id === p.id);
            return p.pos === pos && !chosen && remainingBudget >= p.price;
        });

        if (available.length > 0) {
            const pick = available[Math.floor(Math.random() * available.length)];
            userSquad[slotId] = pick;
            remainingBudget -= pick.price;
        }
    });

    updateUI();
});

// Reset Button
document.getElementById("reset-btn").addEventListener("click", () => {
    userSquad = {};
    remainingBudget = 100.0;
    updateUI();
});

// Enter Squad Button
enterBtn.addEventListener("click", () => {
    if (Object.keys(userSquad).length === 15) {
        if (tg?.showAlert) {
            tg.showAlert("Squad entered successfully! You're ready for GW 1.");
        } else {
            alert("Squad entered successfully! You're ready for GW 1.");
        }
    }
});

// Initial boot
updateUI();
